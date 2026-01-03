package com.example.ubersocket.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Driver {
    private int id;
    private DriverStatus status;
    private Location currentLocation;
    private Location dropLocation; // if ON_RIDE
    private double estimatedTimeToFinish; // in minutes
    private String city;
    private String geoHash;
    private double surgeMultiplier;
    private Long idleTimeSince;

    public double calculateETA(Location clientLocation) {
        double travelTime = Location.calculateDistance(currentLocation, clientLocation) * 10; // Mock factor
        if (status == DriverStatus.IDLE) {
            return travelTime;
        } else if (status == DriverStatus.ON_RIDE) {
            double timeToDrop = Location.calculateDistance(currentLocation, dropLocation) * 10;
            double timeFromDropToClient = Location.calculateDistance(dropLocation, clientLocation) * 10;
            return timeToDrop + timeFromDropToClient;
        }
        return Double.MAX_VALUE; // ASSIGNED drivers are unavailable
    }
}
