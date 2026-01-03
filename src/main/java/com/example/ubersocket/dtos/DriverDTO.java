package com.example.ubersocket.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DriverDTO {
    private Integer driverId;
    private String name;
    private DriverStatus status;
    
    // Current location
    private Double currentLatitude;
    private Double currentLongitude;
    private String city;
    private String geoHash;
    
    // Drop location (for ON_RIDE drivers)
    private Double dropLatitude;
    private Double dropLongitude;
    
    // ETA and booking info
    private Integer estimatedTimeToFinishSeconds;
    private Integer currentBookingId;
    
    // Surge and priority metadata
    private Double surgeMultiplier;
    private Long idleTimeSince; // Timestamp when driver became idle
    
    public enum DriverStatus {
        IDLE,
        ON_RIDE,
        ASSIGNED
    }
}
