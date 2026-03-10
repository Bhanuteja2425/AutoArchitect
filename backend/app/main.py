from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api_v1 import router as api_v1_router

app = FastAPI(
    title="AutoArchitect Backend",
    description="Backend API for converting requirements into system architecture artifacts.",
    version="0.1.0",
)

# Allow local frontend (Vite) to call this API during development
origins = [
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """
    Simple health check endpoint.
    """
    return {"status": "ok", "service": "autoarchitect-backend"}


@app.get("/")
async def root():
    """
    Root endpoint.
    """
    return {"message": "AutoArchitect backend is running"}


# Mount AI/diagram routes under /api/v1/...
app.include_router(api_v1_router)
