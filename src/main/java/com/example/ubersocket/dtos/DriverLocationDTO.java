package com.example.ubersocket.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DriverLocationDTO {
    private Integer driverId;
    private Double latitude;
    private Double longitude;
    private Double heading;
    private Long timestamp;
    private String city;
}
