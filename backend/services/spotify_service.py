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
    "BENGALI": ["bengali", "bangla"],
    "KOREAN": ["korean", "k-pop"],
}

MOOD_FEATURES = {
    "happy":      {"valence": 0.8, "energy": 0.8,  "genres": ["pop", "happy"]},
    "upbeat":     {"valence": 0.7, "energy": 0.9,  "genres": ["dance", "pop"]},
    "chill":      {"valence": 0.5, "energy": 0.3,  "genres": ["chill", "ambient"]},
    "melancholy": {"valence": 0.2, "energy": 0.3,  "genres": ["sad", "indie"]},
    "relaxing":   {"valence": 0.5, "energy": 0.2,  "genres": ["sleep", "acoustic"]},
    "romantic":   {"valence": 0.7, "energy": 0.4,  "genres": ["romance", "soul"]},
    "intense":    {"valence": 0.3, "energy": 0.9,  "genres": ["metal", "hardcore"]},
}

def _get_mood_playlist_id(mood: str) -> str:
    """Read playlist ID at call time so .env is always loaded first."""
    key = f"MOOD_PLAYLIST_{mood.upper()}"
    return os.getenv(key, "")


def _get_trending_playlist_id() -> str:
    return os.getenv("MOOD_PLAYLIST_TRENDING", "")


def _auth_header() -> str:
    creds = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
    return f"Basic {creds}"


def _get_owner_refresh_token() -> str:
    return os.getenv("MOODIFY_REFRESH_TOKEN", "")


async def get_owner_token() -> str:
    """Get a fresh access token using the MoodiFy owner account refresh token."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            SPOTIFY_TOKEN_URL,
            headers={"Authorization": _auth_header(), "Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "refresh_token", "refresh_token": _get_owner_refresh_token()},
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def get_playlist_tracks(playlist_id: str, owner_token: str, mood: str) -> list:
    """Fetch tracks from an owner-account playlist using a random offset for variety."""
    if not playlist_id or playlist_id == "PLACEHOLDER_ID":
        return []
    import random
    # First get total track count
    async with httpx.AsyncClient() as client:
        meta = await client.get(
            f"{SPOTIFY_API_BASE}/playlists/{playlist_id}",
            headers={"Authorization": f"Bearer {owner_token}"},
            params={"fields": "tracks.total"},
        )
        total = meta.json().get("tracks", {}).get("total", 100) if meta.is_success else 100
        max_offset = max(0, total - 100)
        offset = random.randint(0, max_offset)
        resp = await client.get(
            f"{SPOTIFY_API_BASE}/playlists/{playlist_id}/items",
            headers={"Authorization": f"Bearer {owner_token}"},
            params={"limit": 100, "offset": offset},
        )
    if not resp.is_success:
        return []
    items = resp.json().get("items", [])
    tracks = []
    for item in items:
        try:
            # New Spotify API returns 'item' key, not 'track'
            t = item.get("item") or item.get("track")
            if t and t.get("id") and t.get("type") == "track":
                tracks.append(_format_track(t, mood))
        except Exception:
            pass
    return tracks


async def get_trending_tracks() -> list:
    """Fetch tracks from the trending playlist using owner token."""
    try:
        owner_token = await get_owner_token()
        tracks = await get_playlist_tracks(_get_trending_playlist_id(), owner_token, "mixed")
        if tracks:
            import random
            random.shuffle(tracks)
            return tracks[:80]
    except Exception:
        pass
    return []


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


def _filter_by_language(tracks: list, languages: list) -> list:
    """Filter tracks whose title or artist contains a language keyword."""
    if not languages:
        return tracks
    keywords = [kw for lang in languages if lang in LANGUAGE_KEYWORDS for kw in LANGUAGE_KEYWORDS[lang]]
    if not keywords:
        return tracks
    filtered = [
        t for t in tracks
        if any(kw in (t["title"] + " " + t["artist"]).lower() for kw in keywords)
    ]
    return filtered if filtered else tracks  # fallback to unfiltered if nothing matches


async def get_recommendations(mood: str, access_token: str | None, languages: list = []) -> list:
    # Always use owner playlist — no blending, no old /recommendations API
    try:
        owner_token = await get_owner_token()
        playlist_id = _get_mood_playlist_id(mood)
        tracks = await get_playlist_tracks(playlist_id, owner_token, mood)
        if tracks:
            import random
            tracks = _filter_by_language(tracks, languages)
            random.shuffle(tracks)
            return tracks[:30]
    except Exception:
        pass
    # Fallback: search
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
