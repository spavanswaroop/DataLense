package com.datalens.repository;

import com.datalens.entity.AnalysisRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnalysisRunRepository extends JpaRepository<AnalysisRun, UUID> {

    List<AnalysisRun> findByDatasetIdOrderByCreatedAtDesc(UUID datasetId);

    @Query("SELECT a FROM AnalysisRun a WHERE a.id = :id AND a.dataset.user.id = :userId")
    Optional<AnalysisRun> findByIdAndUserId(@Param("id") UUID id, @Param("userId") Long userId);

    @Query("SELECT a FROM AnalysisRun a WHERE a.dataset.id = :datasetId AND a.dataset.user.id = :userId ORDER BY a.createdAt DESC")
    List<AnalysisRun> findByDatasetIdAndUserId(@Param("datasetId") UUID datasetId, @Param("userId") Long userId);
}

