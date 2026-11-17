from typing import Dict, Any

def get_quality_score_details(
    missing_analysis: Dict[str, Any],
    duplicate_analysis: Dict[str, Any],
    outlier_analysis: Dict[str, Any],
    total_rows: int,
    total_cols: int
) -> Dict[str, Any]:
    """
    Computes quality score breakdown (Completeness, Uniqueness, Validity, Consistency)
    and composite Data-Quality Score (0.0 to 100.0).
    """
    if total_rows == 0 or total_cols == 0:
        return {
            "score": 0.0,
            "completeness": 0.0,
            "uniqueness": 0.0,
            "validity": 0.0,
            "consistency": 0.0
        }

    # 1. Completeness Score (C)
    missing_pct = missing_analysis.get("overall_missing_percentage", 0.0)
    completeness = round(max(0.0, 100.0 - missing_pct), 1)

    # 2. Uniqueness Score (D)
    duplicate_pct = duplicate_analysis.get("duplicate_percentage", 0.0)
    uniqueness = round(max(0.0, 100.0 - duplicate_pct), 1)

    # 3. Validity Score (V)
    total_cells = total_rows * total_cols
    total_outliers = outlier_analysis.get("total_outliers_detected", 0)
    outlier_pct = (total_outliers / total_cells * 100) if total_cells > 0 else 0.0
    validity = round(max(0.0, 100.0 - (outlier_pct * 2.0)), 1)

    # 4. Consistency Score (S)
    consistency = 100.0

    score = round((0.4 * completeness) + (0.2 * uniqueness) + (0.2 * validity) + (0.2 * consistency), 1)
    score = max(0.0, min(100.0, score))

    return {
        "score": score,
        "completeness": completeness,
        "uniqueness": uniqueness,
        "validity": validity,
        "consistency": consistency
    }

def calculate_data_quality_score(
    missing_analysis: Dict[str, Any],
    duplicate_analysis: Dict[str, Any],
    outlier_analysis: Dict[str, Any],
    total_rows: int,
    total_cols: int
) -> float:
    details = get_quality_score_details(
        missing_analysis=missing_analysis,
        duplicate_analysis=duplicate_analysis,
        outlier_analysis=outlier_analysis,
        total_rows=total_rows,
        total_cols=total_cols
    )
    return details["score"]
