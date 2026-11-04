import pandas as pd
import numpy as np
from app.analyzers.missing_values import analyze_missing_values
from app.analyzers.duplicates import analyze_duplicates
from app.analyzers.outliers import analyze_outliers_iqr
from app.analyzers.statistics import analyze_column_statistics
from app.analyzers.correlation import analyze_correlations

def test_missing_values_analysis():
    df = pd.DataFrame({
        "age": [20, 30, np.nan, 50],
        "category": ["A", "B", "A", None]
    })
    result = analyze_missing_values(df)
    assert result["total_missing_values"] == 2
    assert result["columns"]["age"]["missing_count"] == 1
    assert result["columns"]["age"]["missing_percentage"] == 25.0
    assert len(result["recommendations"]) == 2

def test_duplicates_analysis():
    df = pd.DataFrame({
        "id": [1, 2, 2, 3],
        "name": ["A", "B", "B", "C"]
    })
    result = analyze_duplicates(df)
    assert result["duplicate_rows"] == 1
    assert result["duplicate_percentage"] == 25.0

def test_outliers_iqr_analysis():
    # Regular values with two distinct outliers: 1000 and -500
    df = pd.DataFrame({
        "salary": [20, 22, 21, 23, 20, 22, 21, 24, 25, 23, 1000, -500]
    })
    result = analyze_outliers_iqr(df)
    assert "salary" in result["outlier_columns"]
    assert result["total_outliers_detected"] == 2
    assert result["column_outliers"]["salary"]["outlier_count"] == 2

def test_column_statistics_analysis():
    df = pd.DataFrame({
        "score": [10.0, 20.0, 30.0],
        "gender": ["M", "F", "F"]
    })
    profiles = analyze_column_statistics(df)
    assert len(profiles) == 2
    
    score_profile = next(p for p in profiles if p["column_name"] == "score")
    assert score_profile["data_type"] == "NUMERICAL"
    assert score_profile["statistics"]["mean"] == 20.0
    
    gender_profile = next(p for p in profiles if p["column_name"] == "gender")
    assert gender_profile["data_type"] == "CATEGORICAL"
    assert gender_profile["statistics"]["top_value"] == "F"

def test_correlation_analysis():
    # Strong positive correlation between x and y (y = 2x)
    df = pd.DataFrame({
        "x": [1.0, 2.0, 3.0, 4.0, 5.0],
        "y": [2.0, 4.0, 6.0, 8.0, 10.0],
        "z": [5.0, 2.0, 1.0, 4.0, 3.0],
        "category": ["A", "B", "C", "D", "E"]
    })
    result = analyze_correlations(df)
    assert result["columns"] == ["x", "y", "z"]
    assert len(result["matrix"]) == 3
    # Check diagonal is 1.0
    assert result["matrix"][0][0] == 1.0
    # Check correlation between x and y is 1.0
    assert result["matrix"][0][1] == 1.0
    assert len(result["strong_correlations"]) >= 1
    assert result["strong_correlations"][0]["feature_a"] in ["x", "y"]
    assert result["strong_correlations"][0]["coefficient"] == 1.0
    assert result["strong_correlations"][0]["relationship"] == "Strong Positive"

