package com.datalens.service;

import com.datalens.dto.DatasetResponse;
import com.datalens.dto.FileMetadata;
import com.datalens.entity.Dataset;
import com.datalens.entity.DatasetStatus;
import com.datalens.entity.User;
import com.datalens.exception.ResourceNotFoundException;
import com.datalens.repository.DatasetRepository;
import com.datalens.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DatasetService {

    private final DatasetRepository datasetRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public DatasetService(
            DatasetRepository datasetRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService
    ) {
        this.datasetRepository = datasetRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public DatasetResponse uploadDataset(MultipartFile file, String customName, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        FileMetadata metadata = fileStorageService.storeFile(file);

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "dataset.csv";
        String displayName = StringUtils.hasText(customName) ? customName.trim() : originalFilename;

        Dataset dataset = Dataset.builder()
                .user(user)
                .name(displayName)
                .originalFilename(originalFilename)
                .storagePath(metadata.getStoragePath())
                .fileSize(metadata.getFileSize())
                .rowCount(metadata.getRowCount())
                .columnCount(metadata.getColumnCount())
                .status(DatasetStatus.UPLOADED)
                .build();

        Dataset savedDataset = datasetRepository.save(dataset);
        return DatasetResponse.fromEntity(savedDataset);
    }

    @Transactional(readOnly = true)
    public List<DatasetResponse> getUserDatasets(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        return datasetRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(DatasetResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DatasetResponse getDatasetById(UUID datasetId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        Dataset dataset = datasetRepository.findByIdAndUserId(datasetId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dataset not found with id: " + datasetId));

        return DatasetResponse.fromEntity(dataset);
    }

    @Transactional
    public void deleteDataset(UUID datasetId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        Dataset dataset = datasetRepository.findByIdAndUserId(datasetId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dataset not found with id: " + datasetId));

        fileStorageService.deleteFile(dataset.getStoragePath());
        datasetRepository.delete(dataset);
    }
}

