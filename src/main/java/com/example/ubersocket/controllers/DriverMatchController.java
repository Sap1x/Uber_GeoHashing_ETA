package com.example.ubersocket.controllers;

import com.example.ubersocket.dtos.DriverMatchResponseDTO;
import com.example.ubersocket.services.DriverMatchingService;
import com.example.ubersocket.services.SpatialIndexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
@Slf4j
public class DriverMatchController {
    
    private final DriverMatchingService driverMatchingService;
    private final SpatialIndexService spatialIndexService;
    
    /**
     * Find best driver match with enhanced GeoHash + city-based filtering
     */
    @PostMapping("/match")
    public ResponseEntity<DriverMatchResponseDTO> matchDriver(
            @RequestParam String city,
            @RequestParam Double pickupLat,
            @RequestParam Double pickupLon,
            @RequestParam Integer bookingId
    ) {
        log.info("Matching driver request: city={}, pickup=[{}, {}], bookingId={}", 
                city, pickupLat, pickupLon, bookingId);
        
        Optional<DriverMatchResponseDTO> match = driverMatchingService.findBestDriver(
            city, pickupLat, pickupLon, bookingId
        );
        
        if (match.isPresent()) {
            log.info("Match successful: driverId={}, ETA={} sec, score={}", 
                    match.get().getDriverId(), 
                    match.get().getEtaSeconds(),
                    match.get().getFinalScore());
            return ResponseEntity.ok(match.get());
        } else {
            log.warn("No driver match found for city={}, booking={}", city, bookingId);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get spatial index statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = spatialIndexService.getIndexStats();
        log.debug("Retrieved spatial index stats: {}", stats);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Update driver location and spatial index
     */
    @PostMapping("/location")
    public ResponseEntity<String> updateLocation(
            @RequestParam Integer driverId,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Double heading
    ) {
        try {
            driverMatchingService.updateDriverLocation(driverId, latitude, longitude, heading);
            log.info("Updated location for driver {}: [{}, {}]", driverId, latitude, longitude);
            return ResponseEntity.ok("Location updated successfully");
        } catch (Exception e) {
            log.error("Failed to update location for driver {}", driverId, e);
            return ResponseEntity.internalServerError().body("Failed to update location");
        }
    }
}
