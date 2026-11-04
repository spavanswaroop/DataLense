import pandas as pd
import numpy as np
from typing import Dict, Any, List

def analyze_outliers_iqr(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Detects outliers across numerical columns using the Interquartile Range (IQR) method:
    IQR = Q3 - Q1
    Lower Bound = Q1 - 1.5 * IQR
    Upper Bound = Q3 + 1.5 * IQR
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    outlier_summary = {}
    outlier_columns: List[str] = []
    total_outliers_count = 0

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 4:
            continue

        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outliers_mask = (series < lower_bound) | (series > upper_bound)
        outlier_count = int(outliers_mask.sum())

        if outlier_count > 0:
            outlier_columns.append(col)
            total_outliers_count += outlier_count

        outlier_percentage = round((outlier_count / len(series) * 100), 2) if len(series) > 0 else 0.0

        outlier_summary[col] = {
            "q1": round(q1, 3),
            "q3": round(q3, 3),
            "iqr": round(iqr, 3),
            "lower_bound": round(lower_bound, 3),
            "upper_bound": round(upper_bound, 3),
            "outlier_count": outlier_count,
            "outlier_percentage": outlier_percentage
        }

    return {
        "outlier_columns": outlier_columns,
        "total_outliers_detected": total_outliers_count,
        "column_outliers": outlier_summary
    }

