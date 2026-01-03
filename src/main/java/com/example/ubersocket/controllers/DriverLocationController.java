package com.example.ubersocket.controllers;

import com.example.ubersocket.dtos.DriverLocationDTO;
import com.example.ubersocket.services.DriverMatchingService;
import com.example.ubersocket.services.SocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
@Slf4j
public class DriverLocationController {
    
    private final DriverMatchingService driverMatchingService;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * Update driver location and broadcast to subscribers
     */
    @PostMapping("/update")
    public ResponseEntity<String> updateDriverLocation(@RequestBody DriverLocationDTO locationDTO) {
        try {
            // Update driver location in matching service
            driverMatchingService.updateDriverLocation(
                locationDTO.getDriverId(), 
                locationDTO.getLatitude(), 
                locationDTO.getLongitude(),
                locationDTO.getHeading()
            );
            
            // Broadcast location update via WebSocket
            messagingTemplate.convertAndSend(
                "/topic/driver-location/" + locationDTO.getDriverId(), 
                locationDTO
            );
            
            log.debug("Updated and broadcast location for driver {}", locationDTO.getDriverId());
            return ResponseEntity.ok("Location updated");
        } catch (Exception e) {
            log.error("Failed to update driver location: {}", locationDTO.getDriverId(), e);
            return ResponseEntity.internalServerError().body("Failed to update location");
        }
    }
}
