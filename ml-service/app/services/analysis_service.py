import os
import pandas as pd
from typing import Dict, Any
from app.analyzers.missing_values import analyze_missing_values
from app.analyzers.duplicates import analyze_duplicates
from app.analyzers.outliers import analyze_outliers_iqr
from app.analyzers.statistics import analyze_column_statistics
from app.services.quality_scorer import calculate_data_quality_score
from app.schemas.analysis import AnalysisResponse, ColumnProfile

def run_full_analysis(dataset_id: str, file_path: str) -> AnalysisResponse:
    if not os.path.exists(file_path):
        return AnalysisResponse(
            status="FAILED",
            rows=0,
            columns=0,
            missing_values=0,
            duplicate_rows=0,
            outlier_columns=[],
            quality_score=0.0,
            column_profiles=[],
            error_message=f"Dataset file not found at path: {file_path}"
        )

    try:
        # Load CSV with Pandas
        df = pd.read_csv(file_path)
        rows, cols = df.shape

        if rows == 0:
            return AnalysisResponse(
                status="FAILED",
                rows=0,
                columns=cols,
                missing_values=0,
                duplicate_rows=0,
                outlier_columns=[],
                quality_score=0.0,
                column_profiles=[],
                error_message="Dataset contains 0 rows of data"
            )

        # Run modular analyzers
        missing_res = analyze_missing_values(df)
        dup_res = analyze_duplicates(df)
        outlier_res = analyze_outliers_iqr(df)
        column_profiles_data = analyze_column_statistics(df)

        # Calculate composite quality score
        quality_score = calculate_data_quality_score(
            missing_analysis=missing_res,
            duplicate_analysis=dup_res,
            outlier_analysis=outlier_res,
            total_rows=rows,
            total_cols=cols
        )

        # Map column profiles
        typed_column_profiles = [
            ColumnProfile(
                column_name=cp["column_name"],
                data_type=cp["data_type"],
                missing_count=cp["missing_count"],
                missing_percentage=cp["missing_percentage"],
                unique_count=cp["unique_count"],
                statistics=cp["statistics"]
            )
            for cp in column_profiles_data
        ]

        return AnalysisResponse(
            status="COMPLETED",
            rows=rows,
            columns=cols,
            missing_values=missing_res["total_missing_values"],
            duplicate_rows=dup_res["duplicate_rows"],
            outlier_columns=outlier_res["outlier_columns"],
            quality_score=quality_score,
            column_profiles=typed_column_profiles,
            error_message=None
        )

    except Exception as e:
        return AnalysisResponse(
            status="FAILED",
            rows=0,
            columns=0,
            missing_values=0,
            duplicate_rows=0,
            outlier_columns=[],
            quality_score=0.0,
            column_profiles=[],
            error_message=f"Analysis pipeline error: {str(e)}"
        )

