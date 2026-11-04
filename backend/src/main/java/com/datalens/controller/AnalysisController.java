package com.datalens.controller;

import com.datalens.dto.AnalysisRunResponse;
import com.datalens.dto.ColumnProfileResponse;
import com.datalens.service.AnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/datasets/{id}/analyze")
    public ResponseEntity<AnalysisRunResponse> triggerAnalysis(
            @PathVariable("id") UUID id,
            Authentication authentication
    ) {
        AnalysisRunResponse response = analysisService.triggerAnalysis(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/datasets/{id}/analyses")
    public ResponseEntity<List<AnalysisRunResponse>> getDatasetAnalyses(
            @PathVariable("id") UUID id,
            Authentication authentication
    ) {
        List<AnalysisRunResponse> responses = analysisService.getAnalysesForDataset(id, authentication.getName());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/analyses/{id}")
    public ResponseEntity<AnalysisRunResponse> getAnalysisById(
            @PathVariable("id") UUID id,
            Authentication authentication
    ) {
        AnalysisRunResponse response = analysisService.getAnalysisById(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/analyses/{id}/columns")
    public ResponseEntity<List<ColumnProfileResponse>> getColumnProfiles(
            @PathVariable("id") UUID id,
            Authentication authentication
    ) {
        List<ColumnProfileResponse> columns = analysisService.getColumnProfiles(id, authentication.getName());
        return ResponseEntity.ok(columns);
    }
}

