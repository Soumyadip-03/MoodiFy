# routes/spotify.py
# Phase 4 — Spotify OAuth Routes

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.spotify_service import (
    get_auth_url,
    exchange_code,
    refresh_access_token,
    get_recommendations,
    save_tokens,
    get_tokens,
    check_premium,
)

router = APIRouter(prefix="/api/spotify")
security = HTTPBearer()


@router.get("/login")
def spotify_login():
    # TODO: Redirect user to Spotify OAuth authorization page
    pass


@router.get("/callback")
async def spotify_callback(code: str = None, error: str = None):
    # TODO: Exchange code for access_token + refresh_token
    # Save tokens to Firestore
    # Redirect back to frontend dashboard
    pass


@router.get("/recommendations")
async def recommendations(mood: str, uid: str):
    # TODO: Fetch tokens for uid, call get_recommendations(mood, access_token)
    # Save fetched tracks to Firestore moodTracks (hybrid cache)
    # Return 10 tracks
    pass


@router.get("/refresh")
async def refresh_token(uid: str):
    # TODO: Fetch refresh_token for uid, call refresh_access_token()
    # Save new access_token back to Firestore
    # Return new access_token
    pass


@router.get("/premium")
async def premium_status(uid: str):
    # TODO: Fetch access_token for uid, call check_premium()
    # Return { "isPremium": true/false }
    pass
