package com.example.ubersocket.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Location {
    private double latitude;
    private double longitude;

    public static double calculateDistance(Location l1, Location l2) {
        // Simple Euclidean distance for simulation (can be replaced with Haversine)
        return Math.sqrt(Math.pow(l1.latitude - l2.latitude, 2) + Math.pow(l1.longitude - l2.longitude, 2));
    }
}
