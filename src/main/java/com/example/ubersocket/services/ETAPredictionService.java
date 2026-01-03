package com.example.ubersocket.services;

import com.example.ubersocket.dtos.DriverDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for predictive ETA calculation with ML-ready architecture
 * Currently uses heuristic fallback, can be extended with ML model
 */
@Service
@Slf4j
public class ETAPredictionService {
    
    /**
     * Predict ETA with contextual features
     * Hook for future ML model integration
     */
    public int predictETA(DriverDTO driver, int baseETA, double pickupLat, double pickupLon) {
        Map<String, Double> features = extractFeatures(driver, pickupLat, pickupLon);
        
        // Future: Call ML model here
        // return mlModel.predict(features);
        
        // Current: Use heuristic
        return applyHeuristicAdjustments(baseETA, features);
    }
    
    /**
     * Extract features for ML model (future use)
     */
    private Map<String, Double> extractFeatures(DriverDTO driver, double pickupLat, double pickupLon) {
        Map<String, Double> features = new HashMap<>();
        
        // Temporal features
        LocalTime now = LocalTime.now();
        features.put("hour_of_day", (double) now.getHour());
        features.put("is_rush_hour", isRushHour(now) ? 1.0 : 0.0);
        
        // Driver features
        features.put("driver_status", driver.getStatus() == DriverDTO.DriverStatus.IDLE ? 0.0 : 1.0);
        features.put("surge_multiplier", driver.getSurgeMultiplier());
        
        // Spatial features
        features.put("pickup_lat", pickupLat);
        features.put("pickup_lon", pickupLon);
        features.put("driver_lat", driver.getCurrentLatitude());
        features.put("driver_lon", driver.getCurrentLongitude());
        
        return features;
    }
    
    /**
     * Apply heuristic adjustments based on known patterns
     */
    private int applyHeuristicAdjustments(int baseETA, Map<String, Double> features) {
        double adjustmentFactor = 1.0;
        
        // Rush hour adjustment
        if (features.get("is_rush_hour") == 1.0) {
            adjustmentFactor *= 1.3; // 30% increase during rush hour
        }
        
        // Surge adjustment (high surge indicates high demand/traffic)
        double surge = features.get("surge_multiplier");
        if (surge > 1.2) {
            adjustmentFactor *= (1.0 + (surge - 1.0) * 0.2);
        }
        
        return (int) (baseETA * adjustmentFactor);
    }
    
    private boolean isRushHour(LocalTime time) {
        int hour = time.getHour();
        return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    }
}
