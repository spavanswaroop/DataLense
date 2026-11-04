import os
import tempfile
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analyze_endpoint_with_csv():
    # Create temporary CSV file for testing
    with tempfile.NamedTemporaryFile(suffix=".csv", mode="w", delete=False, newline="") as f:
        f.write("id,age,salary,department\n")
        f.write("1,25,50000,Engineering\n")
        f.write("2,30,60000,Marketing\n")
        f.write("3,,75000,Engineering\n") # 1 missing age
        f.write("4,45,250000,Executive\n") # 1 outlier salary
        temp_csv_path = f.name

    try:
        response = client.post("/internal/v1/analyze", json={
            "dataset_id": "test-dataset-123",
            "file_path": temp_csv_path
        })

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "COMPLETED"
        assert data["rows"] == 4
        assert data["columns"] == 4
        assert data["missing_values"] == 1
        assert "salary" in data["outlier_columns"]
        assert data["quality_score"] > 80.0
        assert len(data["column_profiles"]) == 4

        # Validate column profiles
        age_col = next(c for c in data["column_profiles"] if c["column_name"] == "age")
        assert age_col["missing_count"] == 1
        assert age_col["data_type"] == "NUMERICAL"

        dept_col = next(c for c in data["column_profiles"] if c["column_name"] == "department")
        assert dept_col["data_type"] == "CATEGORICAL"
        assert dept_col["statistics"]["top_value"] == "Engineering"

    finally:
        if os.path.exists(temp_csv_path):
            os.remove(temp_csv_path)

def test_analyze_non_existent_file():
    response = client.post("/internal/v1/analyze", json={
        "dataset_id": "missing-uuid",
        "file_path": "C:/invalid/path/to/missing.csv"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "FAILED"
    assert "not found" in data["error_message"].lower()

