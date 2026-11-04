package com.datalens.dto;

import com.datalens.entity.ColumnProfile;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColumnProfileResponse {

    private Long id;
    private String columnName;
    private String dataType;
    private Long missingCount;
    private Double missingPercentage;
    private Long uniqueCount;
    private Map<String, Object> statistics;

    public static ColumnProfileResponse fromEntity(ColumnProfile entity) {
        return ColumnProfileResponse.builder()
                .id(entity.getId())
                .columnName(entity.getColumnName())
                .dataType(entity.getDataType())
                .missingCount(entity.getMissingCount())
                .missingPercentage(entity.getMissingPercentage())
                .uniqueCount(entity.getUniqueCount())
                .statistics(entity.getStatistics())
                .build();
    }
}

