import os
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from services.spotify_service import (
    exchange_code,
    refresh_access_token,
    get_recommendations,
    get_top_tracks,
    save_tokens,
    get_tokens,
    save_tracks_to_firestore,
    check_premium,
    ensure_fresh_token,
    _format_track,
    _get_client_credentials_token,
    search_tracks_by_mood,
    SPOTIFY_API_BASE,
)
import httpx
router = APIRouter(prefix="/api/spotify")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@router.get("/login")
def spotify_login(state: str = None):
    from urllib.parse import urlencode
    from services.spotify_service import SPOTIFY_AUTH_URL, SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI, SCOPES
    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "scope": " ".join(SCOPES),
        "show_dialog": "true",
    }
    if state:
        params["state"] = state
    return RedirectResponse(f"{SPOTIFY_AUTH_URL}?{urlencode(params)}")


@router.get("/callback")
async def spotify_callback(code: str = None, error: str = None, state: str = None):
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/profile?spotify=error")
    try:
        tokens = await exchange_code(code)
        uid = state  # uid passed via state param from frontend
        if uid:
            await save_tokens(uid, tokens)
            # Check and save premium status
            product = await check_premium(tokens["accessToken"])
            from firebase_admin import firestore as fs
            fs.client().collection("users").document(uid).set(
                {"isPremium": product == "premium"}, merge=True
            )
        return RedirectResponse(f"{FRONTEND_URL}/profile?spotify=connected")
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/profile?spotify=error")


@router.get("/top-tracks")
async def top_tracks(uid: str = None):
    """Returns user's top tracks (Spotify connected) or chill genre search (unconnected)."""
    try:
        if uid and uid.strip():
            token = await ensure_fresh_token(uid)
            if token:
                tracks = await get_top_tracks(token)
                return {"tracks": tracks}
        # Not connected — fall back to chill genre search via client credentials
        token = await _get_client_credentials_token()
        tracks = await search_tracks_by_mood("chill", token)
        return {"tracks": tracks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations")
async def recommendations(mood: str, uid: str = None, languages: str = None):
    try:
        access_token = await ensure_fresh_token(uid) if uid and uid.strip() else None
        lang_list = [l.strip().upper() for l in languages.split(",") if l.strip()] if languages else []
        tracks = await get_recommendations(mood, access_token, lang_list)
        if tracks:
            await save_tracks_to_firestore(tracks, mood)
        return {"tracks": tracks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/refresh")
async def refresh_token_route(uid: str):
    tokens = await get_tokens(uid)
    if not tokens:
        raise HTTPException(status_code=404, detail="No tokens found")
    try:
        refreshed = await refresh_access_token(tokens["refreshToken"])
        tokens.update(refreshed)
        await save_tokens(uid, tokens)
        return {"accessToken": refreshed["accessToken"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/disconnect")
async def disconnect_spotify(uid: str):
    from firebase_admin import firestore as fs
    fs.client().collection("users").document(uid).update({
        "spotifyTokens": fs.DELETE_FIELD,
        "isPremium": False,
    })
    return {"disconnected": True}


@router.get("/token")
async def get_access_token(uid: str):
    token = await ensure_fresh_token(uid)
    if not token:
        raise HTTPException(status_code=404, detail="No token found")
    return {"accessToken": token}


@router.get("/status")
async def spotify_status(uid: str):
    tokens = await get_tokens(uid)
    if not tokens:
        return {"connected": False, "isPremium": False}
    from firebase_admin import firestore as fs
    snap = fs.client().collection("users").document(uid).get()
    is_premium = snap.to_dict().get("isPremium", False) if snap.exists else False
    return {"connected": True, "isPremium": is_premium}


@router.get("/artist/{artist_id}")
async def get_artist(artist_id: str, uid: str = None):
    try:
        token = await ensure_fresh_token(uid) if uid and uid.strip() else None
        if not token:
            token = await _get_client_credentials_token()
        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient() as client:
            artist_res, top_tracks_res, albums_res = await asyncio.gather(
                client.get(f"{SPOTIFY_API_BASE}/artists/{artist_id}", headers=headers),
                client.get(f"{SPOTIFY_API_BASE}/artists/{artist_id}/top-tracks", headers=headers, params={"market": "US"}),
                client.get(f"{SPOTIFY_API_BASE}/artists/{artist_id}/albums", headers=headers, params={"limit": 20, "include_groups": "album,single"}),
            )
        if not artist_res.is_success:
            raise HTTPException(status_code=artist_res.status_code, detail="Artist not found")
        artist = artist_res.json()
        top_tracks = []
        if top_tracks_res.is_success:
            for t in top_tracks_res.json().get("tracks", []):
                try:
                    top_tracks.append(_format_track(t, "unknown"))
                except Exception:
                    pass
        albums = []
        if albums_res.is_success:
            for a in albums_res.json().get("items", []):
                try:
                    albums.append({
                        "id": a["id"],
                        "name": a["name"],
                        "albumArt": a["images"][0]["url"] if a.get("images") else None,
                        "releaseYear": a["release_date"][:4] if a.get("release_date") else None,
                        "totalTracks": a.get("total_tracks"),
                        "albumType": a.get("album_type"),
                    })
                except Exception:
                    pass
        return {
            "id": artist["id"],
            "name": artist["name"],
            "image": artist["images"][0]["url"] if artist.get("images") else None,
            "genres": artist.get("genres", []),
            "followers": artist.get("followers", {}).get("total", 0),
            "popularity": artist.get("popularity", 0),
            "topTracks": top_tracks,
            "albums": albums,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/album/{album_id}")
async def get_album(album_id: str, uid: str = None):
    try:
        token = await ensure_fresh_token(uid) if uid and uid.strip() else None
        if not token:
            token = await _get_client_credentials_token()
        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{SPOTIFY_API_BASE}/albums/{album_id}", headers=headers)
        if not resp.is_success:
            raise HTTPException(status_code=resp.status_code, detail="Album not found")
        data = resp.json()
        tracks = [
            {
                "id": t["id"],
                "title": t["name"],
                "artist": ", ".join(a["name"] for a in t["artists"]),
                "artistId": t["artists"][0]["id"] if t["artists"] else None,
                "album": data["name"],
                "albumId": data["id"],
                "albumArt": data["images"][0]["url"] if data["images"] else None,
                "releaseDate": data.get("release_date"),
                "previewUrl": t.get("preview_url"),
                "spotifyUrl": t["external_urls"]["spotify"],
                "duration": t["duration_ms"] // 1000,
                "mood": "unknown",
            }
            for t in data.get("tracks", {}).get("items", [])
        ]
        return {
            "id": data["id"],
            "name": data["name"],
            "albumArt": data["images"][0]["url"] if data["images"] else None,
            "releaseDate": data.get("release_date"),
            "totalTracks": data["total_tracks"],
            "label": data.get("label"),
            "popularity": data.get("popularity"),
            "artistId": data["artists"][0]["id"] if data["artists"] else None,
            "artistName": data["artists"][0]["name"] if data["artists"] else None,
            "tracks": tracks,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
