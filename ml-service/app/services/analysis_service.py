import os
import pandas as pd
from typing import Dict, Any, List
from app.analyzers.missing_values import analyze_missing_values
from app.analyzers.duplicates import analyze_duplicates
from app.analyzers.outliers import analyze_outliers_iqr
from app.analyzers.statistics import analyze_column_statistics
from app.analyzers.correlation import analyze_correlations
from app.analyzers.alerts import generate_quality_alerts
from app.services.quality_scorer import get_quality_score_details
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
            quality_breakdown={"completeness": 0.0, "uniqueness": 0.0, "validity": 0.0, "consistency": 0.0},
            alerts=[],
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
                quality_breakdown={"completeness": 0.0, "uniqueness": 0.0, "validity": 0.0, "consistency": 0.0},
                alerts=[],
                column_profiles=[],
                error_message="Dataset contains 0 rows of data"
            )

        # Run modular analyzers
        missing_res = analyze_missing_values(df)
        dup_res = analyze_duplicates(df)
        outlier_res = analyze_outliers_iqr(df)
        column_profiles_data = analyze_column_statistics(df)
        correlation_res = analyze_correlations(df)

        # Calculate composite quality score and breakdown
        quality_details = get_quality_score_details(
            missing_analysis=missing_res,
            duplicate_analysis=dup_res,
            outlier_analysis=outlier_res,
            total_rows=rows,
            total_cols=cols
        )

        outlier_col_names = set()
        for oc in outlier_res.get("outlier_columns", []):
            if isinstance(oc, str):
                outlier_col_names.add(oc)
            elif isinstance(oc, dict):
                outlier_col_names.add(oc.get("column", ""))

        # Map column profiles with individual health status
        typed_column_profiles = []
        for cp in column_profiles_data:
            c_name = cp["column_name"]
            m_pct = cp["missing_percentage"]
            u_cnt = cp["unique_count"]
            d_type = cp["data_type"]

            # Health status classification
            if m_pct >= 30.0:
                health = "CRITICAL_MISSING"
            elif u_cnt <= 1:
                health = "CONSTANT"
            elif m_pct >= 5.0:
                health = "MODERATE_MISSING"
            elif c_name in outlier_col_names:
                health = "OUTLIERS"
            elif d_type == "CATEGORICAL" and rows > 10 and (u_cnt / rows) >= 0.85:
                health = "HIGH_CARDINALITY"
            else:
                health = "CLEAN"

            # Inject health status into statistics map for persistence in PostgreSQL
            stats = cp["statistics"] or {}
            stats["health_status"] = health

            typed_column_profiles.append(
                ColumnProfile(
                    column_name=c_name,
                    data_type=d_type,
                    missing_count=cp["missing_count"],
                    missing_percentage=m_pct,
                    unique_count=u_cnt,
                    health_status=health,
                    statistics=stats
                )
            )

        # Generate prioritized anomaly alerts feed
        alerts = generate_quality_alerts(
            df=df,
            missing_analysis=missing_res,
            duplicate_analysis=dup_res,
            outlier_analysis=outlier_res,
            correlation_analysis=correlation_res,
            column_profiles=column_profiles_data,
            total_rows=rows
        )

        return AnalysisResponse(
            status="COMPLETED",
            rows=rows,
            columns=cols,
            missing_values=missing_res["total_missing_values"],
            duplicate_rows=dup_res["duplicate_rows"],
            outlier_columns=outlier_res["outlier_columns"],
            quality_score=quality_details["score"],
            quality_breakdown=quality_details,
            alerts=alerts,
            column_profiles=typed_column_profiles,
            correlation=correlation_res,
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
            quality_breakdown={"completeness": 0.0, "uniqueness": 0.0, "validity": 0.0, "consistency": 0.0},
            alerts=[],
            column_profiles=[],
            error_message=f"Analysis pipeline error: {str(e)}"
        )
