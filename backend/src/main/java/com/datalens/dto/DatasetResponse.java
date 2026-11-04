package com.datalens.dto;

import com.datalens.entity.Dataset;
import com.datalens.entity.DatasetStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatasetResponse {

    private UUID id;
    private String name;
    private String originalFilename;
    private Long fileSize;
    private String formattedFileSize;
    private Long rowCount;
    private Integer columnCount;
    private DatasetStatus status;
    private LocalDateTime createdAt;

    public static DatasetResponse fromEntity(Dataset dataset) {
        return DatasetResponse.builder()
                .id(dataset.getId())
                .name(dataset.getName())
                .originalFilename(dataset.getOriginalFilename())
                .fileSize(dataset.getFileSize())
                .formattedFileSize(formatFileSize(dataset.getFileSize()))
                .rowCount(dataset.getRowCount())
                .columnCount(dataset.getColumnCount())
                .status(dataset.getStatus())
                .createdAt(dataset.getCreatedAt())
                .build();
    }

    private static String formatFileSize(Long bytes) {
        if (bytes == null || bytes <= 0) return "0 B";
        final String[] units = new String[] { "B", "KB", "MB", "GB" };
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        digitGroups = Math.min(digitGroups, units.length - 1);
        double size = bytes / Math.pow(1024, digitGroups);
        return String.format("%.2f %s", size, units[digitGroups]);
    }
}

