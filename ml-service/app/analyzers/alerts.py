from typing import List, Dict, Any, Optional
import pandas as pd

def generate_quality_alerts(
    df: pd.DataFrame,
    missing_analysis: Dict[str, Any],
    duplicate_analysis: Dict[str, Any],
    outlier_analysis: Dict[str, Any],
    correlation_analysis: Dict[str, Any],
    column_profiles: List[Dict[str, Any]],
    total_rows: int
) -> List[Dict[str, Any]]:
    """
    Generates prioritized data health alerts categorized by severity:
    - CRITICAL: Severe multicollinearity (|r| >= 0.85), high missingness (> 30%), constant/zero-variance columns.
    - WARNING: Moderate missingness (5% - 30%), severe outliers (> 5%), duplicate rows, strong correlation (|r| >= 0.70).
    - INFO: High cardinality ID/text features (> 85% unique values).
    """
    alerts = []

    # 1. Constant / Zero-Variance Columns (CRITICAL)
    for col in df.columns:
        unique_cnt = df[col].nunique(dropna=False)
        if unique_cnt <= 1:
            alerts.append({
                "severity": "CRITICAL",
                "category": "Zero Variance",
                "column": col,
                "title": f"Constant Feature: '{col}'",
                "message": f"Column '{col}' has only {unique_cnt} unique value across all {total_rows} rows. It provides zero statistical variance and should be removed."
            })

    # 2. High Missingness (CRITICAL) & Moderate Missingness (WARNING)
    for cp in column_profiles:
        pct = cp.get("missing_percentage", 0.0)
        col = cp.get("column_name", "")
        if pct >= 30.0:
            alerts.append({
                "severity": "CRITICAL",
                "category": "Severe Missingness",
                "column": col,
                "title": f"High Missing Data: '{col}' ({pct}%)",
                "message": f"Column '{col}' is missing {cp.get('missing_count')} values ({pct}%). Exceeds 30% threshold; consider column removal or domain-specific reconstruction."
            })
        elif pct >= 5.0:
            alerts.append({
                "severity": "WARNING",
                "category": "Missing Data",
                "column": col,
                "title": f"Moderate Missingness: '{col}' ({pct}%)",
                "message": f"Column '{col}' has {cp.get('missing_count')} missing values ({pct}%). Automated imputation advised."
            })

    # 3. Severe Multicollinearity (CRITICAL & WARNING)
    strong_corrs = correlation_analysis.get("strong_correlations", [])
    for sc in strong_corrs:
        r_val = abs(sc.get("coefficient", sc.get("correlation", 0.0)))
        f1 = sc.get("feature_a", sc.get("feature1", "Feature A"))
        f2 = sc.get("feature_b", sc.get("feature2", "Feature B"))
        if r_val >= 0.85:
            alerts.append({
                "severity": "CRITICAL",
                "category": "Severe Multicollinearity",
                "column": f"{f1} ↔ {f2}",
                "title": f"Redundant Features: '{f1}' & '{f2}' (|r| = {r_val:.2f})",
                "message": f"Extremely high linear correlation (|r| = {r_val:.2f}). These features convey redundant information and will cause variance inflation in regression."
            })
        else:
            alerts.append({
                "severity": "WARNING",
                "category": "Multicollinearity",
                "column": f"{f1} ↔ {f2}",
                "title": f"Strong Correlation: '{f1}' & '{f2}' (|r| = {r_val:.2f})",
                "message": f"Strong correlation (|r| = {r_val:.2f}) detected between these numerical features."
            })

    # 4. Outlier Heavy Columns (WARNING)
    outlier_cols = outlier_analysis.get("outlier_columns", [])
    for oc in outlier_cols:
        col_name = oc if isinstance(oc, str) else oc.get("column")
        cnt = oc.get("outlier_count", 0) if isinstance(oc, dict) else 0
        pct = oc.get("outlier_percentage", 0.0) if isinstance(oc, dict) else 0.0
        alerts.append({
            "severity": "WARNING",
            "category": "Statistical Outliers",
            "column": col_name,
            "title": f"Outlier Heavy: '{col_name}'",
            "message": f"Features values strictly outside 1.5x IQR boundaries. Verify if these represent valid high-leverage events or measurement noise."
        })

    # 5. Duplicate Records (WARNING)
    dup_rows = duplicate_analysis.get("duplicate_rows", 0)
    dup_pct = duplicate_analysis.get("duplicate_percentage", 0.0)
    if dup_rows > 0:
        alerts.append({
            "severity": "WARNING",
            "category": "Data Duplication",
            "column": None,
            "title": f"Duplicate Records Detected ({dup_rows} rows, {dup_pct}%)",
            "message": f"Found {dup_rows} exact duplicate rows ({dup_pct}% of dataset). Deduplication advised before training to prevent test set contamination."
        })

    # 6. High Cardinality Identifier Columns (INFO)
    for cp in column_profiles:
        col = cp.get("column_name", "")
        uniq = cp.get("unique_count", 0)
        dtype = cp.get("data_type", "")
        if dtype == "CATEGORICAL" and total_rows > 10:
            ratio = uniq / total_rows
            if ratio >= 0.85:
                alerts.append({
                    "severity": "INFO",
                    "category": "High Cardinality",
                    "column": col,
                    "title": f"Potential Identifier: '{col}'",
                    "message": f"Column '{col}' has {uniq} distinct values ({ratio * 100:.1f}% unique). Appears to be an ID/UUID column; recommend dropping from feature sets."
                })

    # Sort alerts: CRITICAL first, then WARNING, then INFO
    severity_order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    alerts.sort(key=lambda a: severity_order.get(a["severity"], 3))
    return alerts
