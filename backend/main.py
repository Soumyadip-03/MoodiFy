from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import time

load_dotenv()

from routes.auth import router as auth_router
from routes.mood import router as mood_router
from routes.spotify import router as spotify_router
from routes.email import router as email_router

app = FastAPI(title="Moodify API")

# Parse allowed origins from environment variable (comma-separated)
allowed_origins_str = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

# For local admin panel HTML file support (development only)
if os.getenv("ENV", "development") == "development":
    allowed_origins.extend(["null"])  # Allow file:// protocol for local admin panel

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Use environment-based origins only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(mood_router)
app.include_router(spotify_router)
app.include_router(email_router)


@app.get("/api/health")
def health_check():
    """
    Health check endpoint for monitoring and platform readiness checks
    
    Returns:
        dict: Service health status with timestamp
    """
    return {
        "status": "healthy",
        "service": "moodify-backend",
        "version": "1.0.0",
        "timestamp": time.time(),
        "environment": os.getenv("ENV", "development")
    }


@app.get("/")
def root():
    return {
        "status": "Moodify API running",
        "version": "v1.1.0-refresh-fix",
        "timestamp": "2026-09-04T19:10:00Z"
    }
