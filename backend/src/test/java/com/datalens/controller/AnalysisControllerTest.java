package com.datalens.controller;

import com.datalens.client.MlServiceClient;
import com.datalens.dto.RegisterRequest;
import com.datalens.repository.AnalysisRunRepository;
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
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.*;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DatasetRepository datasetRepository;

    @Autowired
    private AnalysisRunRepository analysisRunRepository;

    @Autowired
    private AuthService authService;

    @MockBean
    private MlServiceClient mlServiceClient;

    private String userToken;
    private String otherUserToken;

    @BeforeEach
    void setUp() {
        analysisRunRepository.deleteAll();
        datasetRepository.deleteAll();
        userRepository.deleteAll();

        userToken = authService.register(RegisterRequest.builder()
                .username("analyst_clara")
                .email("clara@datalens.com")
                .password("Password123")
                .build()).getToken();

        otherUserToken = authService.register(RegisterRequest.builder()
                .username("analyst_dave")
                .email("dave@datalens.com")
                .password("Password123")
                .build()).getToken();
    }

    @Test
    void testTriggerAndRetrieveAnalysis() throws Exception {
        // 1. Upload Dataset
        String csvData = "age,salary,churn\n25,50000,0\n30,60000,0\n35,70000,1\n";
        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "sample.csv",
                "text/csv",
                csvData.getBytes()
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/datasets")
                        .file(csvFile)
                        .param("name", "Sample ML Dataset")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode datasetNode = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        UUID datasetId = UUID.fromString(datasetNode.get("id").asText());

        // 2. Mock ML service response
        Map<String, Object> mockMlResult = new HashMap<>();
        mockMlResult.put("status", "COMPLETED");
        mockMlResult.put("rows", 3);
        mockMlResult.put("columns", 3);
        mockMlResult.put("missing_values", 0);
        mockMlResult.put("duplicate_rows", 0);
        mockMlResult.put("outlier_columns", List.of());
        mockMlResult.put("quality_score", 98.5);

        List<Map<String, Object>> columnProfiles = new ArrayList<>();
        Map<String, Object> ageCol = new HashMap<>();
        ageCol.put("column_name", "age");
        ageCol.put("data_type", "NUMERICAL");
        ageCol.put("missing_count", 0);
        ageCol.put("missing_percentage", 0.0);
        ageCol.put("unique_count", 3);
        ageCol.put("statistics", Map.of("mean", 30.0, "median", 30.0));
        columnProfiles.add(ageCol);
        mockMlResult.put("column_profiles", columnProfiles);

        when(mlServiceClient.analyzeDataset(eq(datasetId), any())).thenReturn(mockMlResult);

        // 3. Trigger Analysis
        MvcResult analysisResult = mockMvc.perform(post("/datasets/" + datasetId + "/analyze")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.summary.quality_score").value(98.5))
                .andExpect(jsonPath("$.columnProfiles", hasSize(1)))
                .andReturn();

        JsonNode analysisNode = objectMapper.readTree(analysisResult.getResponse().getContentAsString());
        String analysisId = analysisNode.get("id").asText();

        // 4. Retrieve Dataset Analyses History
        mockMvc.perform(get("/datasets/" + datasetId + "/analyses")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(analysisId));

        // 5. Retrieve specific analysis by ID
        mockMvc.perform(get("/analyses/" + analysisId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(analysisId))
                .andExpect(jsonPath("$.datasetName").value("Sample ML Dataset"));

        // 6. Retrieve column profiles
        mockMvc.perform(get("/analyses/" + analysisId + "/columns")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].columnName").value("age"));

        // 7. Dave cannot access Clara's analysis
        mockMvc.perform(get("/analyses/" + analysisId)
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isNotFound());
    }
}

