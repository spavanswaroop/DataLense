package com.datalens.client;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

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
}

