# spotify_service.py
# Phase 4 — Spotify OAuth + Recommendations Service

import os
import httpx
from google.cloud import firestore

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"

SCOPES = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "streaming",
    "user-read-playback-state",
    "user-modify-playback-state",
]

# Mood → Spotify audio features mapping
MOOD_FEATURES = {
    "happy":      {"valence": 0.8, "energy": 0.8, "genres": ["pop", "happy"]},
    "upbeat":     {"valence": 0.7, "energy": 0.9, "genres": ["dance", "pop"]},
    "chill":      {"valence": 0.5, "energy": 0.3, "genres": ["chill", "ambient"]},
    "melancholy": {"valence": 0.2, "energy": 0.3, "genres": ["sad", "indie"]},
    "relaxing":   {"valence": 0.5, "energy": 0.2, "genres": ["sleep", "acoustic"]},
    "energetic":  {"valence": 0.6, "energy": 0.95, "genres": ["work-out", "rock"]},
    "intense":    {"valence": 0.3, "energy": 0.9, "genres": ["metal", "hardcore"]},
}


def get_auth_url() -> str:
    # TODO: Build and return Spotify OAuth authorization URL
    pass


async def exchange_code(code: str) -> dict:
    # TODO: POST to Spotify token endpoint, return access_token + refresh_token
    pass


async def refresh_access_token(refresh_token: str) -> dict:
    # TODO: Use refresh_token to get a new access_token
    pass


async def get_user_top_seeds(access_token: str) -> dict:
    # TODO: Fetch user's top artists + tracks from Spotify
    # Returns { "seed_artists": [...], "seed_tracks": [...] }
    pass


async def check_premium(access_token: str) -> str:
    # TODO: Call GET /v1/me, return "premium" or "free"
    pass


async def get_recommendations(mood: str, access_token: str) -> list:
    # TODO: Map mood → audio features → call /v1/recommendations → return 10 tracks
    pass


async def save_tracks_to_firestore(tracks: list, mood: str):
    # TODO: Save each track to Firestore moodTracks collection with mood tag
    # Fields: spotifyId, title, artist, albumArt, previewUrl, spotifyUrl,
    #         mood, valence, energy, playCount, likeCount, savedAt
    pass


async def get_recommendations_from_firestore(mood: str) -> list:
    # TODO: Query Firestore moodTracks collection by mood tag
    # Fallback when Spotify API is unavailable
    pass


async def save_tokens(uid: str, tokens: dict):
    # TODO: Save access_token + refresh_token + expiry to Firestore users/{uid}
    pass


async def get_tokens(uid: str) -> dict | None:
    # TODO: Fetch Spotify tokens from Firestore users/{uid}
    pass
