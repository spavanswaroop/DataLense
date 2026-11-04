package com.datalens.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Value("${datalens.ml-service.url:http://localhost:8000/internal/v1}")
    private String mlServiceBaseUrl;

    @Bean
    public RestClient mlRestClient() {
        return RestClient.builder()
                .baseUrl(mlServiceBaseUrl)
                .build();
    }
}

