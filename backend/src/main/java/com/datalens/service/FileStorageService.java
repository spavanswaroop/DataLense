package com.datalens.service;

import com.datalens.dto.FileMetadata;
import com.datalens.exception.InvalidFileException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadLocation;

    public FileStorageService(@Value("${datalens.storage.upload-path:../storage/uploads}") String uploadPath) {
        this.uploadLocation = Paths.get(uploadPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload storage directory", e);
        }
    }

    public FileMetadata storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Cannot upload an empty file");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        if (originalFilename.contains("..")) {
            throw new InvalidFileException("Filename contains invalid relative path sequence: " + originalFilename);
        }

        if (!originalFilename.toLowerCase().endsWith(".csv")) {
            throw new InvalidFileException("Only CSV files are supported. Received: " + originalFilename);
        }

        // Generate unique, non-colliding filename: <uuid>.csv
        String generatedFilename = UUID.randomUUID() + ".csv";
        Path targetPath = this.uploadLocation.resolve(generatedFilename);

        try {
            // Save file stream to disk
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Extract row count and column count safely without full memory loading
            long rowCount = 0;
            int columnCount = 0;

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(Files.newInputStream(targetPath)))) {
                String headerLine = reader.readLine();
                if (headerLine == null || headerLine.trim().isEmpty()) {
                    // Cleanup and reject empty CSV
                    Files.deleteIfExists(targetPath);
                    throw new InvalidFileException("CSV file has no headers or data content");
                }

                // Simple header column count split by comma
                columnCount = headerLine.split(",").length;

                // Count data rows
                while (reader.readLine() != null) {
                    rowCount++;
                }
            }

            return FileMetadata.builder()
                    .storagePath(targetPath.toString())
                    .fileSize(file.getSize())
                    .rowCount(rowCount)
                    .columnCount(columnCount)
                    .build();

        } catch (IOException e) {
            try {
                Files.deleteIfExists(targetPath);
            } catch (IOException ignored) {}
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    public void deleteFile(String storagePath) {
        if (storagePath == null || storagePath.trim().isEmpty()) {
            return;
        }
        try {
            Path path = Paths.get(storagePath);
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // Logged as warning in production; deletion is best-effort
        }
    }
}

