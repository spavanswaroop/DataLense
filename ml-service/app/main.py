from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, analysis

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs"
)

# CORS setup - allowing internal requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_PREFIX, tags=["Health"])
app.include_router(analysis.router, prefix=settings.API_PREFIX, tags=["Analysis"])

@app.get("/")
def root():
    return {"message": "DataLens ML Service is running", "docs": f"{settings.API_PREFIX}/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

