import pandas as pd
from app.services.analysis_service import run_full_analysis
import tempfile, os

def test_quality_alerts_generation():
    with tempfile.NamedTemporaryFile(suffix=".csv", mode="w", delete=False, newline="") as f:
        # Create a messy non-stable dataset
        f.write("id,age,income,debt,tx_count,tx_spend,status\n")
        f.write("1,25,50000,100,10,1000,ACTIVE\n")
        f.write("1,25,50000,100,10,1000,ACTIVE\n") # duplicate
        f.write("2,30,,200,20,2000,ACTIVE\n")      # missing income
        f.write("3,35,,150,30,3000,ACTIVE\n")      # missing income
        f.write("4,40,,100000,40,4000,ACTIVE\n")   # missing income + outlier debt
        f.write("5,45,,300,50,5000,ACTIVE\n")      # missing income
        temp_csv = f.name

    try:
        res = run_full_analysis("test_dataset", temp_csv)
        assert res.status == "COMPLETED"
        assert res.quality_breakdown is not None
        assert "completeness" in res.quality_breakdown
        assert "uniqueness" in res.quality_breakdown
        assert len(res.alerts) > 0

        severities = [a["severity"] for a in res.alerts]
        assert "CRITICAL" in severities
        
        # Check health status on column profiles
        income_profile = next(cp for cp in res.column_profiles if cp.column_name == "income")
        assert income_profile.health_status == "CRITICAL_MISSING"

        status_profile = next(cp for cp in res.column_profiles if cp.column_name == "status")
        assert status_profile.health_status == "CONSTANT"

    finally:
        if os.path.exists(temp_csv):
            os.remove(temp_csv)
