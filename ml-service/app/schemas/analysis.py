from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    service: str

class AnalysisRequest(BaseModel):
    dataset_id: str
    file_path: str

class ColumnProfile(BaseModel):
    column_name: str
    data_type: str
    missing_count: int
    missing_percentage: float
    unique_count: int
    statistics: Optional[Dict[str, Any]] = None

class AnalysisResponse(BaseModel):
    status: str
    rows: int
    columns: int
    missing_values: int
    duplicate_rows: int
    outlier_columns: List[str]
    quality_score: float
    column_profiles: Optional[List[ColumnProfile]] = None
    correlation: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

