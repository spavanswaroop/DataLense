package com.datalens.repository;

import com.datalens.entity.ColumnProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ColumnProfileRepository extends JpaRepository<ColumnProfile, Long> {

    List<ColumnProfile> findByAnalysisRunId(UUID analysisRunId);
}

