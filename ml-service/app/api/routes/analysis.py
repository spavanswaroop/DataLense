from fastapi import APIRouter
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.analysis_service import run_full_analysis

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_dataset(request: AnalysisRequest):
    return run_full_analysis(request.dataset_id, request.file_path)
