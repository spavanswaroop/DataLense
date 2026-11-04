import pandas as pd
from typing import Dict, Any

def analyze_missing_values(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyzes missing values per column and generates smart recommendations
    based on data type and missingness percentage.
    """
    total_rows = len(df)
    missing_series = df.isnull().sum()
    total_missing = int(missing_series.sum())
    
    columns_report = {}
    recommendations = []
    
    for col in df.columns:
        count = int(missing_series[col])
        percentage = round((count / total_rows * 100), 2) if total_rows > 0 else 0.0
        
        is_numeric = pd.api.types.is_numeric_dtype(df[col])
        recommendation = "None"
        
        if count > 0:
            if percentage > 50.0:
                recommendation = "High missingness (>50%): Consider dropping column or checking data collection source."
            elif is_numeric:
                recommendation = "Median imputation recommended (robust against outliers)."
            else:
                recommendation = "Mode (most frequent value) imputation or missing indicator category recommended."
            
            recommendations.append({
                "column": col,
                "missing_count": count,
                "missing_percentage": percentage,
                "recommendation": recommendation
            })
            
        columns_report[col] = {
            "missing_count": count,
            "missing_percentage": percentage,
            "recommendation": recommendation
        }
        
    return {
        "total_missing_values": total_missing,
        "overall_missing_percentage": round((total_missing / (total_rows * len(df.columns)) * 100), 2) if total_rows > 0 and len(df.columns) > 0 else 0.0,
        "columns": columns_report,
        "recommendations": recommendations
    }

