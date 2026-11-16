import os
import tempfile
import pandas as pd
from app.api.routes.analysis import analyze_dataset
from app.schemas.analysis import AnalysisRequest

def test_analyze_endpoint_with_csv():
    with tempfile.NamedTemporaryFile(suffix=".csv", mode="w", delete=False, newline="") as f:
        f.write("id,age,salary,department\n")
        f.write("1,25,50000,Engineering\n")
        f.write("2,30,60000,Marketing\n")
        f.write("3,,75000,Engineering\n") # 1 missing age
        f.write("4,45,250000,Executive\n") # 1 outlier salary
        temp_csv_path = f.name

    try:
        req = AnalysisRequest(
            dataset_id="test-dataset-123",
            file_path=temp_csv_path
        )
        data = analyze_dataset(req)

        assert data.status == "COMPLETED"
        assert data.rows == 4
        assert data.columns == 4
        assert data.missing_values == 1
        assert "salary" in data.outlier_columns
        assert data.quality_score > 80.0
        assert len(data.column_profiles) == 4

        # Validate column profiles
        age_col = next(c for c in data.column_profiles if c.column_name == "age")
        assert age_col.missing_count == 1
        assert age_col.data_type == "NUMERICAL"

        dept_col = next(c for c in data.column_profiles if c.column_name == "department")
        assert dept_col.data_type == "CATEGORICAL"
        assert dept_col.statistics["top_value"] == "Engineering"

    finally:
        if os.path.exists(temp_csv_path):
            os.remove(temp_csv_path)

def test_analyze_non_existent_file():
    req = AnalysisRequest(
        dataset_id="missing-uuid",
        file_path="C:/invalid/path/to/missing.csv"
    )
    data = analyze_dataset(req)
    assert data.status == "FAILED"
    assert "not found" in data.error_message.lower()
