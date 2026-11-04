package com.datalens.controller;

import com.datalens.dto.DatasetResponse;
import com.datalens.service.DatasetService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/datasets")
public class DatasetController {

    private final DatasetService datasetService;

    public DatasetController(DatasetService datasetService) {
        this.datasetService = datasetService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DatasetResponse> uploadDataset(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name,
            Authentication authentication
    ) {
        DatasetResponse response = datasetService.uploadDataset(file, name, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DatasetResponse>> getUserDatasets(Authentication authentication) {
        List<DatasetResponse> datasets = datasetService.getUserDatasets(authentication.getName());
        return ResponseEntity.ok(datasets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DatasetResponse> getDataset(
            @PathVariable("id") UUID id,
            Authentication authentication
    ) {
        DatasetResponse response = datasetService.getDatasetById(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDataset(
            @PathVariable("id") UUID id,
            Authentication authentication
    ) {
        datasetService.deleteDataset(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}

