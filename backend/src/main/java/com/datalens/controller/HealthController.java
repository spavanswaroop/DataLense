package com.datalens.controller;

import com.datalens.client.MlServiceClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    private final MlServiceClient mlServiceClient;

    public HealthController(MlServiceClient mlServiceClient) {
        this.mlServiceClient = mlServiceClient;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "datalens-backend");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ml-service")
    public ResponseEntity<Map<String, Object>> testMlServiceConnection() {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> mlHealth = mlServiceClient.checkMlServiceHealth();
            response.put("backend_status", "UP");
            response.put("ml_service_connection", "CONNECTED");
            response.put("ml_service_response", mlHealth);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("backend_status", "UP");
            response.put("ml_service_connection", "UNREACHABLE");
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }
}

