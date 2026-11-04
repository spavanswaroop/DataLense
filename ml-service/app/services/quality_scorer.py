from typing import Dict, Any

def calculate_data_quality_score(
    missing_analysis: Dict[str, Any],
    duplicate_analysis: Dict[str, Any],
    outlier_analysis: Dict[str, Any],
    total_rows: int,
    total_cols: int
) -> float:
    """
    Computes a composite Data-Quality Score (0.0 to 100.0) based on the DataLens blueprint heuristic:
    Q = 0.4 * C + 0.2 * D + 0.2 * V + 0.2 * S

    Where:
    - C (Completeness): 100 - overall missing percentage
    - D (Uniqueness): 100 - duplicate rows percentage
    - V (Validity): 100 - outlier percentage across numeric entries
    - S (Consistency): baseline score (100.0 for structured CSV)
    """
    if total_rows == 0 or total_cols == 0:
        return 0.0

    # 1. Completeness Score (C)
    missing_pct = missing_analysis.get("overall_missing_percentage", 0.0)
    completeness = max(0.0, 100.0 - missing_pct)

    # 2. Uniqueness Score (D)
    duplicate_pct = duplicate_analysis.get("duplicate_percentage", 0.0)
    uniqueness = max(0.0, 100.0 - duplicate_pct)

    # 3. Validity Score (V)
    total_cells = total_rows * total_cols
    total_outliers = outlier_analysis.get("total_outliers_detected", 0)
    outlier_pct = (total_outliers / total_cells * 100) if total_cells > 0 else 0.0
    validity = max(0.0, 100.0 - (outlier_pct * 2.0)) # Weighted penalty for outliers

    # 4. Consistency Score (S)
    consistency = 100.0

    quality_score = (0.4 * completeness) + (0.2 * uniqueness) + (0.2 * validity) + (0.2 * consistency)
    return round(max(0.0, min(100.0, quality_score)), 1)

