import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "DataLens ML Service"
    API_PREFIX: str = "/internal/v1"
    DEBUG: bool = True
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "127.0.0.1")

settings = Settings()

