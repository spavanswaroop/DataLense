package com.datalens.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "column_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColumnProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = false)
    private AnalysisRun analysisRun;

    @Column(name = "column_name", nullable = false, length = 255)
    private String columnName;

    @Column(name = "data_type", nullable = false, length = 50)
    private String dataType;

    @Column(name = "missing_count", nullable = false)
    @Builder.Default
    private Long missingCount = 0L;

    @Column(name = "missing_percentage", nullable = false)
    @Builder.Default
    private Double missingPercentage = 0.0;

    @Column(name = "unique_count")
    private Long uniqueCount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> statistics;
}

