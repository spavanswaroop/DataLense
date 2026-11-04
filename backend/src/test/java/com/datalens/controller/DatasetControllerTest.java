package com.datalens.controller;

import com.datalens.dto.RegisterRequest;
import com.datalens.repository.DatasetRepository;
import com.datalens.repository.UserRepository;
import com.datalens.service.AuthService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DatasetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DatasetRepository datasetRepository;

    @Autowired
    private AuthService authService;

    private String userToken;
    private String otherUserToken;

    @BeforeEach
    void setUp() {
        datasetRepository.deleteAll();
        userRepository.deleteAll();

        // Setup primary user
        userToken = authService.register(RegisterRequest.builder()
                .username("analyst_anna")
                .email("anna@datalens.com")
                .password("Password123")
                .build()).getToken();

        // Setup secondary user for access control testing
        otherUserToken = authService.register(RegisterRequest.builder()
                .username("analyst_bob")
                .email("bob@datalens.com")
                .password("Password123")
                .build()).getToken();
    }

    @Test
    void testDatasetLifecycleAndOwnership() throws Exception {
        String csvData = "customer_id,age,income,churn\n101,25,50000,0\n102,40,90000,1\n103,32,65000,0\n";
        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "customer_churn.csv",
                "text/csv",
                csvData.getBytes()
        );

        // 1. Upload CSV dataset
        MvcResult uploadResult = mockMvc.perform(multipart("/datasets")
                        .file(csvFile)
                        .param("name", "Customer Churn Study")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Customer Churn Study"))
                .andExpect(jsonPath("$.originalFilename").value("customer_churn.csv"))
                .andExpect(jsonPath("$.rowCount").value(3))
                .andExpect(jsonPath("$.columnCount").value(4))
                .andExpect(jsonPath("$.status").value("UPLOADED"))
                .andReturn();

        JsonNode responseJson = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String datasetId = responseJson.get("id").asText();

        // 2. List datasets for Anna
        mockMvc.perform(get("/datasets")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Customer Churn Study"));

        // 3. Bob's list should be empty (Data Isolation)
        mockMvc.perform(get("/datasets")
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // 4. Bob cannot access Anna's dataset (Ownership Protection)
        mockMvc.perform(get("/datasets/" + datasetId)
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isNotFound());

        // 5. Anna accesses dataset details
        mockMvc.perform(get("/datasets/" + datasetId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(datasetId))
                .andExpect(jsonPath("$.rowCount").value(3));

        // 6. Anna deletes dataset
        mockMvc.perform(delete("/datasets/" + datasetId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        // 7. Verify dataset no longer exists
        mockMvc.perform(get("/datasets/" + datasetId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }
}

