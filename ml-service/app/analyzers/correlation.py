import pandas as pd
import numpy as np
from typing import Dict, Any, List

def analyze_correlations(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes Pearson correlation matrix and identifies high collinearity pairs (|r| >= 0.7).
    """
    numeric_df = df.select_dtypes(include=[np.number])
    cols = list(numeric_df.columns)

    if len(cols) < 2:
        return {
            "columns": cols,
            "matrix": [],
            "strong_correlations": []
        }

    # Compute pairwise correlation
    corr_matrix = numeric_df.corr(method="pearson").round(3).fillna(0.0)

    # 2D matrix structure
    matrix_values: List[List[float]] = []
    for col in cols:
        matrix_values.append([float(val) for val in corr_matrix[col].tolist()])

    # Identify strong correlation pairs (|r| >= 0.7, excluding self-correlation)
    strong_correlations: List[Dict[str, Any]] = []
    seen_pairs = set()

    for i, col_a in enumerate(cols):
        for j, col_b in enumerate(cols):
            if i >= j:
                continue
            r_val = float(corr_matrix.loc[col_a, col_b])
            if abs(r_val) >= 0.7:
                pair_key = tuple(sorted([col_a, col_b]))
                if pair_key not in seen_pairs:
                    seen_pairs.add(pair_key)
                    strong_correlations.append({
                        "feature_a": col_a,
                        "feature_b": col_b,
                        "coefficient": r_val,
                        "relationship": "Strong Positive" if r_val > 0 else "Strong Negative"
                    })

    # Sort by absolute correlation strength descending
    strong_correlations.sort(key=lambda x: abs(x["coefficient"]), reverse=True)

    return {
        "columns": cols,
        "matrix": matrix_values,
        "strong_correlations": strong_correlations
    }
