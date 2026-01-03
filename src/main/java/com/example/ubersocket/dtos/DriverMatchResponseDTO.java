package com.example.ubersocket.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DriverMatchResponseDTO {
    private Integer driverId;
    private String driverName;
    private Integer etaSeconds;
    private Double driverLatitude;
    private Double driverLongitude;
    private Integer bookingId;
    private String city;
    private Double finalScore;
    private Double surgeMultiplier;
}
