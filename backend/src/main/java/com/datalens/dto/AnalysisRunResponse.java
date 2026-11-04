package com.datalens.dto;

import com.datalens.entity.AnalysisRun;
import com.datalens.entity.AnalysisStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisRunResponse {

    private UUID id;
    private UUID datasetId;
    private String datasetName;
    private AnalysisStatus status;
    private Map<String, Object> summary;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private List<ColumnProfileResponse> columnProfiles;

    public static AnalysisRunResponse fromEntity(AnalysisRun entity) {
        return AnalysisRunResponse.builder()
                .id(entity.getId())
                .datasetId(entity.getDataset().getId())
                .datasetName(entity.getDataset().getName())
                .status(entity.getStatus())
                .summary(entity.getSummary())
                .errorMessage(entity.getErrorMessage())
                .createdAt(entity.getCreatedAt())
                .completedAt(entity.getCompletedAt())
                .columnProfiles(
                        entity.getColumnProfiles() != null
                                ? entity.getColumnProfiles().stream().map(ColumnProfileResponse::fromEntity).collect(Collectors.toList())
                                : List.of()
                )
                .build();
    }
}

