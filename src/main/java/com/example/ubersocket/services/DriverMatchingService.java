package com.example.ubersocket.services;

import org.springframework.stereotype.Service;
import com.example.ubersocket.dtos.DriverDTO;
import com.example.ubersocket.dtos.DriverMatchResponseDTO;
import com.example.ubersocket.utils.GeoHashUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class DriverMatchingService {
    
    private final SpatialIndexService spatialIndexService;
    
    // In-memory driver storage (replace with database in production)
    private final ConcurrentHashMap<Integer, DriverDTO> drivers = new ConcurrentHashMap<>();
    
    private static final double AVERAGE_SPEED_KMH = 40.0;
    private static final double EARTH_RADIUS_KM = 6371.0;
    
    // Scoring weights for final driver selection
    private static final double WEIGHT_ETA = 0.7;
    private static final double WEIGHT_SURGE = 0.2;
    private static final double WEIGHT_IDLE_TIME = 0.1;
    
    public DriverMatchingService(SpatialIndexService spatialIndexService) {
        this.spatialIndexService = spatialIndexService;
        // Initialize with mock drivers for demo
        initializeMockDrivers();
    }
    
    private void initializeMockDrivers() {
        String[] cities = {"San Francisco", "New York", "Los Angeles"};
        
        for (int i = 1; i <= 15; i++) {
            String city = cities[i % cities.length];
            double baseLat = city.equals("San Francisco") ? 37.7749 :
                           city.equals("New York") ? 40.7128 : 34.0522;
            double baseLon = city.equals("San Francisco") ? -122.4194 :
                           city.equals("New York") ? -74.0060 : -118.2437;
            
            double lat = baseLat + (Math.random() - 0.5) * 0.1;
            double lon = baseLon + (Math.random() - 0.5) * 0.1;
            
            DriverDTO driver = DriverDTO.builder()
                .driverId(i)
                .name("Driver " + i)
                .status(i % 3 == 0 ? DriverDTO.DriverStatus.ON_RIDE : DriverDTO.DriverStatus.IDLE)
                .currentLatitude(lat)
                .currentLongitude(lon)
                .city(city)
                .geoHash(GeoHashUtil.encode(lat, lon))
                .surgeMultiplier(1.0 + Math.random() * 0.5) // 1.0 to 1.5x
                .idleTimeSince(System.currentTimeMillis() - (long)(Math.random() * 300000)) // Last 5 mins
                .build();
            
            if (driver.getStatus() == DriverDTO.DriverStatus.ON_RIDE) {
                driver.setDropLatitude(lat + (Math.random() - 0.5) * 0.05);
                driver.setDropLongitude(lon + (Math.random() - 0.5) * 0.05);
                driver.setEstimatedTimeToFinishSeconds((int)(Math.random() * 600 + 180)); // 3-13 mins
            }
            
            drivers.put(i, driver);
            spatialIndexService.updateDriverLocation(i, city, lat, lon);
        }
        log.info("Initialized {} mock drivers across {} cities", drivers.size(), cities.length);
    }
    
    public Optional<DriverMatchResponseDTO> findBestDriver(
            String city,
            Double pickupLat, 
            Double pickupLon, 
            Integer bookingId
    ) {
        // Step 1: City-level sharding guard
        if (city == null || city.isEmpty()) {
            log.error("City is required for driver matching");
            return Optional.empty();
        }
        
        // Step 2: GeoHash-based spatial filtering
        Set<Integer> nearbyDriverIds = spatialIndexService.getDriversNearby(city, pickupLat, pickupLon);
        
        if (nearbyDriverIds.isEmpty()) {
            log.warn("No drivers found nearby in city: {}", city);
            return Optional.empty();
        }
        
        // Step 3: Filter by status and get driver objects
        List<DriverDTO> candidateDrivers = nearbyDriverIds.stream()
            .map(drivers::get)
            .filter(d -> d != null && (d.getStatus() == DriverDTO.DriverStatus.IDLE 
                                    || d.getStatus() == DriverDTO.DriverStatus.ON_RIDE))
            .collect(Collectors.toList());
        
        if (candidateDrivers.isEmpty()) {
            log.warn("No available drivers found among {} nearby drivers", nearbyDriverIds.size());
            return Optional.empty();
        }
        
        log.info("Evaluating {} candidate drivers in city {} (filtered from {} total nearby)", 
                candidateDrivers.size(), city, nearbyDriverIds.size());
        
        // Step 4: Calculate predictive ETA and score for each driver
        DriverDTO bestDriver = null;
        double bestScore = Double.MAX_VALUE;
        int bestETA = 0;
        
        for (DriverDTO driver : candidateDrivers) {
            int eta = calculatePredictiveETA(driver, pickupLat, pickupLon);
            double score = calculateDriverScore(driver, eta);
            
            log.debug("Driver {}: status={}, ETA={} sec, score={:.2f}, surge={}", 
                    driver.getDriverId(), driver.getStatus(), eta, score, driver.getSurgeMultiplier());
            
            if (score < bestScore) {
                bestScore = score;
                bestDriver = driver;
                bestETA = eta;
            }
        }
        
        // Step 5: Assign driver and update spatial index
        if (bestDriver != null) {
            bestDriver.setStatus(DriverDTO.DriverStatus.ASSIGNED);
            bestDriver.setCurrentBookingId(bookingId);
            drivers.put(bestDriver.getDriverId(), bestDriver);
            
            log.info("Matched driver {} with ETA {} seconds and score {:.2f}", 
                    bestDriver.getDriverId(), bestETA, bestScore);
            
            return Optional.of(DriverMatchResponseDTO.builder()
                .driverId(bestDriver.getDriverId())
                .driverName(bestDriver.getName())
                .etaSeconds(bestETA)
                .driverLatitude(bestDriver.getCurrentLatitude())
                .driverLongitude(bestDriver.getCurrentLongitude())
                .bookingId(bookingId)
                .city(city)
                .finalScore(bestScore)
                .surgeMultiplier(bestDriver.getSurgeMultiplier())
                .build());
        }
        
        return Optional.empty();
    }
    
    private int calculatePredictiveETA(DriverDTO driver, Double pickupLat, Double pickupLon) {
        // Base ETA calculation (routing-based)
        int baseETA;
        
        if (driver.getStatus() == DriverDTO.DriverStatus.IDLE) {
            double distance = calculateDistance(
                driver.getCurrentLatitude(), 
                driver.getCurrentLongitude(),
                pickupLat, 
                pickupLon
            );
            baseETA = (int) (distance / AVERAGE_SPEED_KMH * 3600);
        } else {
            // ON_RIDE: time to finish + travel from drop to pickup
            int timeToFinish = driver.getEstimatedTimeToFinishSeconds() != null 
                ? driver.getEstimatedTimeToFinishSeconds() 
                : 300;
            
            double distanceFromDrop = calculateDistance(
                driver.getDropLatitude(), 
                driver.getDropLongitude(),
                pickupLat, 
                pickupLon
            );
            int travelTime = (int) (distanceFromDrop / AVERAGE_SPEED_KMH * 3600);
            
            baseETA = timeToFinish + travelTime;
        }
        
        // ML-ready hook: can be replaced with trained model prediction
        return predictETAWithML(driver, baseETA, pickupLat, pickupLon);
    }
    
    private int predictETAWithML(DriverDTO driver, int baseETA, Double pickupLat, Double pickupLon) {
        // Placeholder for ML model integration
        // Future: Extract features and call ML service
        // Features: traffic_density, time_of_day, historical_patterns, weather, etc.
        
        // For now, apply simple heuristic adjustments
        double trafficFactor = 1.0; // Could be dynamic based on time/location
        
        return (int) (baseETA * trafficFactor);
    }
    
    private double calculateDriverScore(DriverDTO driver, int eta) {
        // ETA component (normalized to 0-1 scale, assuming max 30 min ETA)
        double etaScore = Math.min(eta / 1800.0, 1.0);
        
        // Surge penalty component
        double surgePenalty = driver.getSurgeMultiplier() != null 
            ? (driver.getSurgeMultiplier() - 1.0) 
            : 0.0;
        
        // Idle time preference (prefer drivers idle longer, normalized to 0-1)
        long idleTimeMs = System.currentTimeMillis() - 
            (driver.getIdleTimeSince() != null ? driver.getIdleTimeSince() : System.currentTimeMillis());
        double idleTimePenalty = 1.0 - Math.min(idleTimeMs / 600000.0, 1.0); // Max 10 min
        
        // Weighted final score (lower is better)
        return WEIGHT_ETA * etaScore 
             + WEIGHT_SURGE * surgePenalty 
             + WEIGHT_IDLE_TIME * idleTimePenalty;
    }
    
    public void updateDriverLocation(Integer driverId, Double lat, Double lon, Double heading) {
        DriverDTO driver = drivers.get(driverId);
        if (driver != null) {
            driver.setCurrentLatitude(lat);
            driver.setCurrentLongitude(lon);
            driver.setGeoHash(GeoHashUtil.encode(lat, lon));
            drivers.put(driverId, driver);
            
            // Update spatial index
            spatialIndexService.updateDriverLocation(driverId, driver.getCity(), lat, lon);
            
            log.debug("Updated location for driver {} in city {}", driverId, driver.getCity());
        }
    }
    
    public Optional<DriverDTO> getDriver(Integer driverId) {
        return Optional.ofNullable(drivers.get(driverId));
    }
    
    public void updateDriverStatus(Integer driverId, DriverDTO.DriverStatus status) {
        DriverDTO driver = drivers.get(driverId);
        if (driver != null) {
            driver.setStatus(status);
            if (status == DriverDTO.DriverStatus.IDLE) {
                driver.setCurrentBookingId(null);
                driver.setIdleTimeSince(System.currentTimeMillis());
            }
            drivers.put(driverId, driver);
        }
    }
    
    private double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return EARTH_RADIUS_KM * c;
    }
}
