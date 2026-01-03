package com.example.ubersocket.utils;

/**
 * Utility for GeoHash computation and spatial cell management.
 * Simulates GeoHash logic with precision 6 (~1.2km x 0.6km).
 */
public class GeoHashUtils {
    
    private static final String BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    private static final int PRECISION = 6;

    /**
     * Encodes latitude and longitude into a GeoHash string.
     */
    public static String encode(double lat, double lon) {
        double[] latRange = {-90, 90};
        double[] lonRange = {-180, 180};
        StringBuilder geohash = new StringBuilder();
        boolean isEven = true;
        int bit = 0;
        int ch = 0;

        while (geohash.length() < PRECISION) {
            double mid;
            if (isEven) {
                mid = (lonRange[0] + lonRange[1]) / 2;
                if (lon > mid) {
                    ch |= (1 << (4 - bit));
                    lonRange[0] = mid;
                } else {
                    lonRange[1] = mid;
                }
            } else {
                mid = (latRange[0] + latRange[1]) / 2;
                if (lat > mid) {
                    ch |= (1 << (4 - bit));
                    latRange[0] = mid;
                } else {
                    latRange[1] = mid;
                }
            }

            isEven = !isEven;
            if (bit < 4) {
                bit++;
            } else {
                geohash.append(BASE32.charAt(ch));
                bit = 0;
                ch = 0;
            }
        }
        return geohash.toString();
    }

    /**
     * Gets the 8 neighbors of a geohash cell to support boundary-aware matching.
     */
    public static String[] getNeighbors(String geohash) {
        // Mocking neighbor calculation for architectural demonstration
        // In production, use a library like ch.hsr.geohash
        return new String[]{}; 
    }
}
