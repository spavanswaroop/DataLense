package com.datalens.service;

import com.datalens.client.MlServiceClient;
import com.datalens.dto.AnalysisRunResponse;
import com.datalens.dto.ColumnProfileResponse;
import com.datalens.entity.*;
import com.datalens.exception.ResourceNotFoundException;
import com.datalens.repository.AnalysisRunRepository;
import com.datalens.repository.ColumnProfileRepository;
import com.datalens.repository.DatasetRepository;
import com.datalens.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalysisService {

    private final AnalysisRunRepository analysisRunRepository;
    private final ColumnProfileRepository columnProfileRepository;
    private final DatasetRepository datasetRepository;
    private final UserRepository userRepository;
    private final MlServiceClient mlServiceClient;

    public AnalysisService(
            AnalysisRunRepository analysisRunRepository,
            ColumnProfileRepository columnProfileRepository,
            DatasetRepository datasetRepository,
            UserRepository userRepository,
            MlServiceClient mlServiceClient) {
        this.analysisRunRepository = analysisRunRepository;
        this.columnProfileRepository = columnProfileRepository;
        this.datasetRepository = datasetRepository;
        this.userRepository = userRepository;
        this.mlServiceClient = mlServiceClient;
    }

    @Transactional
    public AnalysisRunResponse triggerAnalysis(UUID datasetId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        Dataset dataset = datasetRepository.findByIdAndUserId(datasetId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dataset not found with id: " + datasetId));

        // Create new AnalysisRun record
        AnalysisRun analysisRun = AnalysisRun.builder()
                .dataset(dataset)
                .status(AnalysisStatus.RUNNING)
                .build();
        AnalysisRun savedRun = analysisRunRepository.save(analysisRun);

        dataset.setStatus(DatasetStatus.PROCESSING);
        datasetRepository.save(dataset);

        try {
            // Call FastAPI ML service
            Map<String, Object> mlResult = mlServiceClient.analyzeDataset(dataset.getId(), dataset.getStoragePath());

            String statusStr = (String) mlResult.getOrDefault("status", "FAILED");
            if ("COMPLETED".equalsIgnoreCase(statusStr)) {
                // Build summary map
                Map<String, Object> summary = new HashMap<>();
                summary.put("rows", mlResult.get("rows"));
                summary.put("columns", mlResult.get("columns"));
                summary.put("missing_values", mlResult.get("missing_values"));
                summary.put("duplicate_rows", mlResult.get("duplicate_rows"));
                summary.put("outlier_columns", mlResult.get("outlier_columns"));
                summary.put("quality_score", mlResult.get("quality_score"));

                savedRun.setSummary(summary);
                savedRun.setStatus(AnalysisStatus.COMPLETED);
                savedRun.setCompletedAt(LocalDateTime.now());

                // Update dataset metadata if updated
                if (mlResult.get("rows") instanceof Number numRows) {
                    dataset.setRowCount(numRows.longValue());
                }
                if (mlResult.get("columns") instanceof Number numCols) {
                    dataset.setColumnCount(numCols.intValue());
                }
                dataset.setStatus(DatasetStatus.COMPLETED);
                datasetRepository.save(dataset);

                // Save column profiles
                List<?> columnProfilesRaw = (List<?>) mlResult.get("column_profiles");
                if (columnProfilesRaw != null) {
                    for (Object cpObj : columnProfilesRaw) {
                        if (cpObj instanceof Map<?, ?> rawMap) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> cpMap = (Map<String, Object>) rawMap;

                            long missingCount = cpMap.get("missing_count") instanceof Number n ? n.longValue() : 0L;
                            double missingPercentage = cpMap.get("missing_percentage") instanceof Number n ? n.doubleValue() : 0.0;
                            long uniqueCount = cpMap.get("unique_count") instanceof Number n ? n.longValue() : 0L;

                            @SuppressWarnings("unchecked")
                            Map<String, Object> stats = cpMap.get("statistics") instanceof Map<?, ?> sMap
                                    ? (Map<String, Object>) sMap
                                    : null;

                            ColumnProfile profile = ColumnProfile.builder()
                                    .analysisRun(savedRun)
                                    .columnName((String) cpMap.get("column_name"))
                                    .dataType((String) cpMap.get("data_type"))
                                    .missingCount(missingCount)
                                    .missingPercentage(missingPercentage)
                                    .uniqueCount(uniqueCount)
                                    .statistics(stats)
                                    .build();
                            savedRun.getColumnProfiles().add(profile);
                        }
                    }
                }
                analysisRunRepository.save(savedRun);
            } else {
                String errorMsg = (String) mlResult.getOrDefault("error_message", "Analysis failed in ML microservice");
                savedRun.setStatus(AnalysisStatus.FAILED);
                savedRun.setErrorMessage(errorMsg);
                savedRun.setCompletedAt(LocalDateTime.now());
                dataset.setStatus(DatasetStatus.FAILED);
                datasetRepository.save(dataset);
                analysisRunRepository.save(savedRun);
            }

        } catch (Exception e) {
            savedRun.setStatus(AnalysisStatus.FAILED);
            savedRun.setErrorMessage("Error communicating with ML microservice: " + e.getMessage());
            savedRun.setCompletedAt(LocalDateTime.now());
            dataset.setStatus(DatasetStatus.FAILED);
            datasetRepository.save(dataset);
            analysisRunRepository.save(savedRun);
        }

        return AnalysisRunResponse.fromEntity(savedRun);
    }

    @Transactional(readOnly = true)
    public List<AnalysisRunResponse> getAnalysesForDataset(UUID datasetId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        return analysisRunRepository.findByDatasetIdAndUserId(datasetId, user.getId())
                .stream()
                .map(AnalysisRunResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AnalysisRunResponse getAnalysisById(UUID analysisId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        AnalysisRun run = analysisRunRepository.findByIdAndUserId(analysisId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Analysis run not found with id: " + analysisId));

        return AnalysisRunResponse.fromEntity(run);
    }

    @Transactional(readOnly = true)
    public List<ColumnProfileResponse> getColumnProfiles(UUID analysisId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        AnalysisRun run = analysisRunRepository.findByIdAndUserId(analysisId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Analysis run not found with id: " + analysisId));

        return columnProfileRepository.findByAnalysisRunId(run.getId())
                .stream()
                .map(ColumnProfileResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
