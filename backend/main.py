from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routes.auth import router as auth_router
from routes.mood import router as mood_router
from routes.spotify import router as spotify_router

app = FastAPI(title="Moodify API")

# Parse allowed origins from environment variable (comma-separated)
allowed_origins_str = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(mood_router)
app.include_router(spotify_router)


@app.get("/")
def root():
    return {"status": "Moodify API running"}
