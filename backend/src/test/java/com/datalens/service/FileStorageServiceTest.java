package com.datalens.service;

import com.datalens.dto.FileMetadata;
import com.datalens.exception.InvalidFileException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileStorageServiceTest {

    @TempDir
    Path tempUploadDir;

    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService(tempUploadDir.toString());
    }

    @Test
    void testStoreValidCsv() {
        String csvContent = "id,name,age,salary\n1,Alice,30,70000\n2,Bob,35,80000\n3,Charlie,28,60000\n";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "employees.csv",
                "text/csv",
                csvContent.getBytes()
        );

        FileMetadata metadata = fileStorageService.storeFile(file);

        assertNotNull(metadata);
        assertEquals(3, metadata.getRowCount());
        assertEquals(4, metadata.getColumnCount());
        assertTrue(Files.exists(Path.of(metadata.getStoragePath())));

        // Test deletion
        fileStorageService.deleteFile(metadata.getStoragePath());
        assertFalse(Files.exists(Path.of(metadata.getStoragePath())));
    }

    @Test
    void testRejectEmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.csv",
                "text/csv",
                new byte[0]
        );

        assertThrows(InvalidFileException.class, () -> fileStorageService.storeFile(emptyFile));
    }

    @Test
    void testRejectNonCsvFile() {
        MockMultipartFile txtFile = new MockMultipartFile(
                "file",
                "data.txt",
                "text/plain",
                "Hello world".getBytes()
        );

        assertThrows(InvalidFileException.class, () -> fileStorageService.storeFile(txtFile));
    }

    @Test
    void testRejectOversizedFile() {
        // Mock a file larger than 100MB (101MB)
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large.csv",
                "text/csv",
                new byte[1]
        ) {
            @Override
            public long getSize() {
                return 101 * 1024 * 1024L; // 101MB
            }
        };

        assertThrows(InvalidFileException.class, () -> fileStorageService.storeFile(largeFile));
    }

    @Test
    void testRejectPathTraversal() {
        MockMultipartFile maliciousFile = new MockMultipartFile(
                "file",
                "../../secret.csv",
                "text/csv",
                "a,b\n1,2".getBytes()
        );

        assertThrows(InvalidFileException.class, () -> fileStorageService.storeFile(maliciousFile));
    }
}

