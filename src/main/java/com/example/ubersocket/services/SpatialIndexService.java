package com.example.ubersocket.services;

import com.example.ubersocket.utils.GeoHashUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SpatialIndexService {
    
    // City -> GeoHash -> Set<DriverId>
    private final Map<String, Map<String, Set<Integer>>> spatialIndex = new ConcurrentHashMap<>();
    
    // DriverId -> {city, geohash} for quick removal
    private final Map<Integer, DriverLocation> driverLocationCache = new ConcurrentHashMap<>();
    
    /**
     * Add or update driver location in spatial index
     */
    public void updateDriverLocation(Integer driverId, String city, double latitude, double longitude) {
        String newGeoHash = GeoHashUtil.encode(latitude, longitude);
        
        // Remove driver from old location if exists
        DriverLocation oldLocation = driverLocationCache.get(driverId);
        if (oldLocation != null) {
            removeFromIndex(driverId, oldLocation.city, oldLocation.geohash);
        }
        
        // Add driver to new location
        addToIndex(driverId, city, newGeoHash);
        
        // Update cache
        driverLocationCache.put(driverId, new DriverLocation(city, newGeoHash));
        
        log.debug("Updated driver {} location: city={}, geohash={}", driverId, city, newGeoHash);
    }
    
    /**
     * Get all driver IDs within the same GeoHash cell and its 8 neighbors
     */
    public Set<Integer> getDriversNearby(String city, double latitude, double longitude) {
        String centerGeoHash = GeoHashUtil.encode(latitude, longitude);
        List<String> geohashesToSearch = new ArrayList<>();
        geohashesToSearch.add(centerGeoHash);
        geohashesToSearch.addAll(GeoHashUtil.getNeighbors(centerGeoHash));
        
        Map<String, Set<Integer>> cityIndex = spatialIndex.get(city);
        if (cityIndex == null) {
            log.warn("No drivers found in city: {}", city);
            return Collections.emptySet();
        }
        
        Set<Integer> nearbyDrivers = geohashesToSearch.stream()
            .map(cityIndex::get)
            .filter(Objects::nonNull)
            .flatMap(Set::stream)
            .collect(Collectors.toSet());
        
        log.info("Found {} drivers nearby in city {} for geohash {} and neighbors", 
                nearbyDrivers.size(), city, centerGeoHash);
        
        return nearbyDrivers;
    }
    
    /**
     * Remove driver from spatial index (e.g., when going offline)
     */
    public void removeDriver(Integer driverId) {
        DriverLocation location = driverLocationCache.remove(driverId);
        if (location != null) {
            removeFromIndex(driverId, location.city, location.geohash);
            log.info("Removed driver {} from spatial index", driverId);
        }
    }
    
    private void addToIndex(Integer driverId, String city, String geohash) {
        spatialIndex
            .computeIfAbsent(city, k -> new ConcurrentHashMap<>())
            .computeIfAbsent(geohash, k -> ConcurrentHashMap.newKeySet())
            .add(driverId);
    }
    
    private void removeFromIndex(Integer driverId, String city, String geohash) {
        Map<String, Set<Integer>> cityIndex = spatialIndex.get(city);
        if (cityIndex != null) {
            Set<Integer> drivers = cityIndex.get(geohash);
            if (drivers != null) {
                drivers.remove(driverId);
                if (drivers.isEmpty()) {
                    cityIndex.remove(geohash);
                }
            }
        }
    }
    
    /**
     * Get statistics about spatial index
     */
    public Map<String, Object> getIndexStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCities", spatialIndex.size());
        stats.put("totalDriversTracked", driverLocationCache.size());
        
        Map<String, Integer> cityDriverCounts = new HashMap<>();
        spatialIndex.forEach((city, geohashes) -> {
            int driverCount = geohashes.values().stream()
                .mapToInt(Set::size)
                .sum();
            cityDriverCounts.put(city, driverCount);
        });
        stats.put("driversByCity", cityDriverCounts);
        
        return stats;
    }
    
    private static class DriverLocation {
        String city;
        String geohash;
        
        DriverLocation(String city, String geohash) {
            this.city = city;
            this.geohash = geohash;
        }
    }
}
