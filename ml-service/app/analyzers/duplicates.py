import pandas as pd
from typing import Dict, Any

def analyze_duplicates(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Identifies exact duplicate rows across the dataset.
    """
    total_rows = len(df)
    duplicate_count = int(df.duplicated().sum())
    duplicate_percentage = round((duplicate_count / total_rows * 100), 2) if total_rows > 0 else 0.0
    
    recommendation = "No action needed: Dataset has 0 duplicate rows."
    if duplicate_count > 0:
        recommendation = f"Found {duplicate_count} duplicate rows ({duplicate_percentage}%). Consider removing exact duplicates before training models."
        
    return {
        "duplicate_rows": duplicate_count,
        "duplicate_percentage": duplicate_percentage,
        "recommendation": recommendation
    }

