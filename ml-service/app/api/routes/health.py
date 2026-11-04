from fastapi import APIRouter
from app.schemas.analysis import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        status="UP",
        service="datalens-ml-service"
    )

