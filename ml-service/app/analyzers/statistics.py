import pandas as pd
import numpy as np
from typing import Dict, Any, List

def analyze_column_statistics(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Computes statistical profiles and distribution data for all columns
    compatible with frontend visualization charts.
    """
    column_profiles = []
    total_rows = len(df)

    for col in df.columns:
        series = df[col]
        non_null_series = series.dropna()
        missing_count = int(series.isnull().sum())
        missing_percentage = round((missing_count / total_rows * 100), 2) if total_rows > 0 else 0.0
        unique_count = int(series.nunique())

        is_numeric = pd.api.types.is_numeric_dtype(series)
        is_bool = pd.api.types.is_bool_dtype(series)

        stats: Dict[str, Any] = {}

        if is_numeric and not is_bool:
            data_type = "NUMERICAL"
            if len(non_null_series) > 0:
                mean_val = float(non_null_series.mean())
                median_val = float(non_null_series.median())
                std_val = float(non_null_series.std()) if len(non_null_series) > 1 else 0.0
                min_val = float(non_null_series.min())
                max_val = float(non_null_series.max())
                zeros_count = int((non_null_series == 0).sum())

                # Generate 5-bin histogram for distribution visualization in Recharts
                bins_data = []
                try:
                    counts, bin_edges = np.histogram(non_null_series, bins=5)
                    for i in range(len(counts)):
                        bins_data.append({
                            "range": f"{round(bin_edges[i], 1)}-{round(bin_edges[i+1], 1)}",
                            "count": int(counts[i])
                        })
                except Exception:
                    bins_data = []

                stats = {
                    "mean": round(mean_val, 2),
                    "median": round(median_val, 2),
                    "std": round(std_val, 2),
                    "min": round(min_val, 2),
                    "max": round(max_val, 2),
                    "zeros_count": zeros_count,
                    "histogram": bins_data
                }
        else:
            data_type = "CATEGORICAL" if not is_bool else "BOOLEAN"
            # Top categories frequency distribution
            top_counts = non_null_series.astype(str).value_counts().head(5).to_dict()
            distribution = [{"category": str(k), "count": int(v)} for k, v in top_counts.items()]
            top_value = str(non_null_series.mode().iloc[0]) if len(non_null_series) > 0 else "N/A"

            stats = {
                "top_value": top_value,
                "distribution": distribution
            }

        column_profiles.append({
            "column_name": col,
            "data_type": data_type,
            "missing_count": missing_count,
            "missing_percentage": missing_percentage,
            "unique_count": unique_count,
            "statistics": stats
        })

    return column_profiles

