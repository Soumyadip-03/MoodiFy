import os
import base64
import time
import httpx
import firebase_admin.firestore as firestore

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

LANGUAGE_KEYWORDS = {
    "ENGLISH": ["english"],
    "HINDI": ["hindi", "bollywood"],
    "SPANISH": ["spanish", "latin"],
    "FRENCH": ["french"],
    "JAPANESE": ["japanese", "j-pop"],
    "KOREAN": ["korean", "k-pop"],
}

MOOD_FEATURES = {
    "happy":      {"valence": 0.8, "energy": 0.8,  "genres": ["pop", "happy"]},
    "upbeat":     {"valence": 0.7, "energy": 0.9,  "genres": ["dance", "pop"]},
    "chill":      {"valence": 0.5, "energy": 0.3,  "genres": ["chill", "ambient"]},
    "melancholy": {"valence": 0.2, "energy": 0.3,  "genres": ["sad", "indie"]},
    "relaxing":   {"valence": 0.5, "energy": 0.2,  "genres": ["sleep", "acoustic"]},
    "energetic":  {"valence": 0.6, "energy": 0.95, "genres": ["work-out", "rock"]},
    "intense":    {"valence": 0.3, "energy": 0.9,  "genres": ["metal", "hardcore"]},
}


def _auth_header() -> str:
    creds = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
    return f"Basic {creds}"


def _db():
    return firestore.client()


async def exchange_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            SPOTIFY_TOKEN_URL,
            headers={"Authorization": _auth_header(), "Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "authorization_code", "code": code, "redirect_uri": SPOTIFY_REDIRECT_URI},
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "accessToken": data["access_token"],
            "refreshToken": data["refresh_token"],
            "expiresAt": int(time.time()) + data["expires_in"],
        }


async def refresh_access_token(refresh_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            SPOTIFY_TOKEN_URL,
            headers={"Authorization": _auth_header(), "Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "refresh_token", "refresh_token": refresh_token},
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "accessToken": data["access_token"],
            "expiresAt": int(time.time()) + data["expires_in"],
        }


async def check_premium(access_token: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SPOTIFY_API_BASE}/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        return resp.json().get("product", "free")


async def get_top_tracks(access_token: str) -> list:
    """Fetch user's actual top tracks — no mood filter, pure listening history."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SPOTIFY_API_BASE}/me/top/tracks",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"limit": 20, "time_range": "medium_term"},
        )
    if resp.is_success:
        tracks = [_format_track(t, "mixed") for t in resp.json().get("items", []) if t]
        if tracks:
            return tracks
    # top/tracks returned nothing — fall back to search
    return await search_tracks_by_mood("chill", access_token)


async def get_user_top_seeds(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        artists_resp = await client.get(
            f"{SPOTIFY_API_BASE}/me/top/artists",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"limit": 2, "time_range": "medium_term"},
        )
        tracks_resp = await client.get(
            f"{SPOTIFY_API_BASE}/me/top/tracks",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"limit": 2, "time_range": "medium_term"},
        )
        seed_artists = [a["id"] for a in artists_resp.json().get("items", [])] if artists_resp.is_success else []
        seed_tracks = [t["id"] for t in tracks_resp.json().get("items", [])] if tracks_resp.is_success else []
        return {"seed_artists": seed_artists[:2], "seed_tracks": seed_tracks[:2]}


def _format_track(item: dict, mood: str) -> dict:
    track = item if "album" in item else item.get("track", item)
    return {
        "id": track["id"],
        "title": track["name"],
        "artist": ", ".join(a["name"] for a in track["artists"]),
        "artistId": track["artists"][0]["id"] if track["artists"] else None,
        "album": track["album"]["name"],
        "albumId": track["album"]["id"],
        "albumArt": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
        "releaseDate": track["album"].get("release_date"),
        "previewUrl": track.get("preview_url"),
        "spotifyUrl": track["external_urls"]["spotify"],
        "duration": track["duration_ms"] // 1000,
        "mood": mood,
    }


async def get_recommendations(mood: str, access_token: str | None, languages: list = []) -> list:
    features = MOOD_FEATURES.get(mood, MOOD_FEATURES["chill"])
    token = access_token or await _get_client_credentials_token()

    if access_token:
        seed_artists, seed_tracks_ids = [], []
        try:
            seeds = await get_user_top_seeds(access_token)
            seed_artists = seeds["seed_artists"]
            seed_tracks_ids = seeds["seed_tracks"]
        except Exception:
            pass

        seed_genres = features["genres"] if (len(seed_artists) + len(seed_tracks_ids)) < 3 else []
        params = {
            "limit": 10,
            "target_valence": features["valence"],
            "target_energy": features["energy"],
        }
        if seed_artists:
            params["seed_artists"] = ",".join(seed_artists)
        if seed_tracks_ids:
            params["seed_tracks"] = ",".join(seed_tracks_ids)
        if seed_genres:
            params["seed_genres"] = ",".join(seed_genres[:2])

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SPOTIFY_API_BASE}/recommendations",
                headers={"Authorization": f"Bearer {token}"},
                params=params,
            )
            if resp.is_success:
                tracks = [_format_track(t, mood) for t in resp.json().get("tracks", []) if t]
                if tracks:
                    return tracks

    search_token = access_token if access_token else await _get_client_credentials_token()
    return await search_tracks_by_mood(mood, search_token, languages)


async def search_tracks_by_mood(mood: str, token: str, languages: list = []) -> list:
    features = MOOD_FEATURES.get(mood, MOOD_FEATURES["chill"])
    genre = features["genres"][0]

    # Build language suffix — use first keyword per selected language
    lang_suffix = " ".join(
        LANGUAGE_KEYWORDS[lang][0] for lang in languages if lang in LANGUAGE_KEYWORDS
    ) if languages else ""

    base_queries = [f"genre:{genre}", genre, features["genres"][1] if len(features["genres"]) > 1 else genre]
    queries = [f"{q} {lang_suffix}".strip() for q in base_queries] if lang_suffix else base_queries

    async with httpx.AsyncClient() as client:
        for query in queries:
            resp = await client.get(
                f"{SPOTIFY_API_BASE}/search",
                headers={"Authorization": f"Bearer {token}"},
                params={"q": query, "type": "track", "limit": "10"},
            )
            if not resp.is_success:
                continue
            items = resp.json().get("tracks", {}).get("items", [])
            tracks = [_format_track(t, mood) for t in items if t]
            if tracks:
                return tracks
    return await get_recommendations_from_firestore(mood)


async def _get_client_credentials_token() -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            SPOTIFY_TOKEN_URL,
            headers={"Authorization": _auth_header(), "Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "client_credentials"},
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def save_tracks_to_firestore(tracks: list, mood: str):
    db = _db()
    batch = db.batch()
    for t in tracks:
        ref = db.collection("moodTracks").document(t["id"])
        snap = ref.get()
        if snap.exists:
            # Always refresh all fields so stale docs (missing artistId/albumId/releaseDate) get corrected
            batch.update(ref, {**t, "playCount": firestore.Increment(1)})
        else:
            batch.set(ref, {**t, "playCount": 1, "likeCount": 0, "savedAt": firestore.SERVER_TIMESTAMP})
    batch.commit()


async def get_recommendations_from_firestore(mood: str) -> list:
    db = _db()
    try:
        docs = (
            db.collection("moodTracks")
            .where("mood", "==", mood)
            .order_by("playCount", direction="DESCENDING")
            .limit(10)
            .stream()
        )
        return [d.to_dict() for d in docs]
    except Exception:
        # Index not yet created or collection empty — return empty list
        return []


async def save_tokens(uid: str, tokens: dict):
    _db().collection("users").document(uid).set({"spotifyTokens": tokens}, merge=True)


async def get_tokens(uid: str) -> dict | None:
    snap = _db().collection("users").document(uid).get()
    if not snap.exists:
        return None
    return (snap.to_dict() or {}).get("spotifyTokens")


async def ensure_fresh_token(uid: str) -> str | None:
    """Returns a valid access token, refreshing if expired. Returns None if no tokens."""
    tokens = await get_tokens(uid)
    if not tokens:
        return None
    if int(time.time()) >= tokens.get("expiresAt", 0) - 60:
        refreshed = await refresh_access_token(tokens["refreshToken"])
        tokens.update(refreshed)
        await save_tokens(uid, tokens)
    return tokens["accessToken"]
