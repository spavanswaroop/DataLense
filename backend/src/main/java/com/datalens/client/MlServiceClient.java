package com.datalens.client;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class MlServiceClient {

    private final RestClient mlRestClient;

    public MlServiceClient(RestClient mlRestClient) {
        this.mlRestClient = mlRestClient;
    }

    public Map<String, Object> checkMlServiceHealth() {
        return mlRestClient.get()
                .uri("/health")
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {});
    }

    public Map<String, Object> analyzeDataset(UUID datasetId, String filePath) {
        Map<String, Object> request = new HashMap<>();
        request.put("dataset_id", datasetId.toString());
        request.put("file_path", filePath);

        return mlRestClient.post()
                .uri("/analyze")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {});
    }
}
