# MoodiFy — Implementation Script

---

## Phase 4 Completion Plan — Owner Account Playlist Fetching

### The Problem
Spotify dev mode blocks `GET /playlists/{id}/items` for all non-owned playlists — returns 403
regardless of token type (client credentials or user OAuth). Only playlists owned by the
authenticated user return full track data.

### The Solution
Create 7 playlists on a dedicated MoodiFy Premium Spotify account. Since the backend uses
that account's OAuth token, all 7 playlists are "owned" from the API's perspective — full
track data returned for every request.

### Architecture
```
User detects mood → happy
    ↓
Backend reads MOODIFY_REFRESH_TOKEN from .env
    ↓
POST /api/token (refresh_token grant) → fresh access_token
    ↓
GET /playlists/{happy-playlist-id}/items (random offset for variety) → full tracks
    ↓
Filter by language keywords (title/artist match) → shuffle → return 30 tracks
    ↓
Save to Firestore moodTracks (with previewUrl — kept, Spotify returns null for most)
    ↓
Frontend plays track via previewUrl (free) or Web Playback SDK (premium)
```

### Step-by-Step Implementation Checklist

#### Step 1 — Spotify Account Setup (Manual — You Do This)
- [x] Create new Spotify Premium account for MoodiFy
- [x] Create 7 playlists on that account:
  - `MoodiFy - Happy`
  - `MoodiFy - Upbeat`
  - `MoodiFy - Chill`
  - `MoodiFy - Melancholy`
  - `MoodiFy - Relaxing`
  - `MoodiFy - Romantic`
  - `MoodiFy - Intense`
- [x] Fill each playlist with 50+ songs
- [x] Copy each playlist ID from the Spotify URL
- [ ] Fill `MOOD_PLAYLIST_ROMANTIC` in `backend/.env` (still placeholder)

#### Step 2 — Get Owner Refresh Token (One-Time)
- [x] Add the new account's email to Spotify app's allowlist (dev dashboard)
- [x] Complete OAuth → tokens saved to Firestore under owner's uid
- [x] `MOODIFY_REFRESH_TOKEN` set in `backend/.env`
- [x] `MOODIFY_OWNER_UID` set in `backend/.env`
- [x] `ADMIN_SECRET` set in `backend/.env`

#### Step 3 — Backend Changes
- [x] `spotify_service.py` — `get_owner_token()` implemented using `MOODIFY_REFRESH_TOKEN`
- [x] `spotify_service.py` — playlist IDs read from `.env` via `_get_mood_playlist_id()`
- [x] `spotify_service.py` — `get_recommendations()` uses owner token for playlist fetch
- [x] `spotify_service.py` — `get_trending()` uses owner token
- [x] `spotify_service.py` — `get_playlist_tracks()` uses random offset for full playlist variety
- [x] `spotify_service.py` — `_filter_by_language()` filters tracks by title/artist keyword match
- [x] `spotify_service.py` — dead code removed (`get_top_tracks`, module-level `MOODIFY_REFRESH_TOKEN` var)
- [~] `previewUrl` kept in Firestore — removal unnecessary, Spotify returns null for most tracks anyway
- [~] `language` field per track — unnecessary, filter works on title/artist at query time
- [~] `GET /api/spotify/track/{id}` — unnecessary, `preview_url` deprecated by Spotify, always null
- [~] `routes/admin.py` seed endpoint — unnecessary, Firestore seeds organically on each recommendation fetch
- [~] `main.py` admin router — unnecessary (no admin.py)

#### Step 4 — Frontend Changes
- [~] `fetchPreviewUrl(trackId)` — unnecessary, `preview_url` deprecated by Spotify
- [~] `MusicPlayer.tsx` fresh fetch — unnecessary for same reason

#### Step 5 — Environment Variables to Add
```env
# backend/.env
MOODIFY_REFRESH_TOKEN=owner_account_refresh_token
MOODIFY_OWNER_UID=owner_account_firebase_uid
ADMIN_SECRET=your_random_secret_string
```

### Playlist IDs (in backend/.env)
```
MOOD_PLAYLIST_TRENDING=6trf0nTsv4F08U3w4wmJPZ
MOOD_PLAYLIST_HAPPY=6AGoUiwAFILkJbmQMPlvEe
MOOD_PLAYLIST_UPBEAT=01g361QyifEWLZEtaPoFte
MOOD_PLAYLIST_CHILL=5h036KZcCS2AlWhxjbvgBn
MOOD_PLAYLIST_MELANCHOLY=5xX6njFrymncVsbvtNDkIE
MOOD_PLAYLIST_RELAXING=1gBRdjnCQLy0ybqHjSxnjU
MOOD_PLAYLIST_ROMANTIC=PLACEHOLDER_ID  ← still needs to be filled
MOOD_PLAYLIST_INTENSE=3PGivabZ7hckBJfkU3h0Sq
```

### Key Rules (Revised)
- Owner token used ONLY for playlist fetching — never exposed to frontend
- User OAuth token used ONLY for Web Playback SDK (premium)
- `previewUrl` stored in Firestore — kept as-is, Spotify returns null for most tracks
- Language filter works at query time via title/artist keyword matching
- `playCount` incremented on every recommendation fetch (Phase 6 can refine to once per day)
- `MOODIFY_REFRESH_TOKEN` in `.env` for now → move to Firestore encrypted field before Phase 8

---

## Spotify API — Available Endpoints (Post Dev-Mode Update)

### Search
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/search` | limit max=10, default=5 |

## Search
| Method | Endpoint | Notes |
|-----|-----------|-------------------------|
| GET | `/search` | limit max=10, default=5 |

## Metadata
| Method | Endpoint | Notes |
|-----|----------------|--------------|
| GET | `/albums/{id}` | Single album |
| GET | `/albums/{id}/tracks` | Tracks in album |
| GET | `/artists/{id}` | Single artist — followers + popularity removed |
| GET | `/artists/{id}/albums` | Artist albums |
| GET | `/tracks/{id}` | Single track — popularity + available_markets removed |
| GET | `/episodes/{id}` | Single episode |
| GET | `/shows/{id}` | Single show |
| GET | `/shows/{id}/episodes` | Show episodes |
| GET | `/audiobooks/{id}` | Single audiobook |
| GET | `/audiobooks/{id}/chapters` | Audiobook chapters |
| GET | `/chapters/{id}` | Single chapter |

## User
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/me` | Current user profile — product/email/country/followers removed |
| GET | `/me/top/{type}` | type = tracks or artists |

## Library
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/me/playlists` | Current user's playlists |
| GET | `/me/albums` | Saved albums |
| GET | `/me/tracks` | Saved tracks |
| GET | `/me/episodes` | Saved episodes |
| GET | `/me/shows` | Saved shows |
| GET | `/me/audiobooks` | Saved audiobooks |
| GET | `/me/following` | Followed artists |
| GET | `/me/library/contains` | Check if items saved — replaces all old /contains endpoints |
| PUT | `/me/library` | Save items — replaces PUT /me/tracks, /me/albums etc |
| DELETE | `/me/library` | Remove items — replaces DELETE /me/tracks, /me/albums etc |

## Playlists
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/playlists/{id}` | Metadata only for non-owned playlists |
| GET | `/playlists/{id}/items` | Contents — only works for user's OWN playlists |
| POST | `/playlists/{id}/items` | Add items to playlist |
| PUT | `/playlists/{id}/items` | Reorder or replace items |
| DELETE | `/playlists/{id}/items` | Remove items |
| POST | `/me/playlists` | Create playlist |
| PUT | `/playlists/{id}` | Update playlist details |
| GET | `/playlists/{id}/images` | Playlist cover image |
| PUT | `/playlists/{id}/images` | Upload custom cover image |

## Player (Premium only)
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/me/player` | Playback state |
| GET | `/me/player/currently-playing` | Currently playing track |
| GET | `/me/player/devices` | Available devices |
| GET | `/me/player/queue` | Current queue |
| GET | `/me/player/recently-played` | Recently played tracks |
| PUT | `/me/player` | Transfer playback |
| PUT | `/me/player/play` | Start / resume |
| PUT | `/me/player/pause` | Pause |
| PUT | `/me/player/next` | Skip to next |
| PUT | `/me/player/previous` | Skip to previous |
| PUT | `/me/player/seek` | Seek to position |
| PUT | `/me/player/volume` | Set volume |
| PUT | `/me/player/shuffle` | Toggle shuffle |
| PUT | `/me/player/repeat` | Set repeat mode |
| POST | `/me/player/queue` | Add item to queue |

## Removed — Do Not Use
| Endpoint | Replacement |
|---|---|
| `GET /artists/{id}/top-tracks` | Use `/search` instead |
| `GET /users/{id}/playlists` | Use `GET /me/playlists` |
| `GET /users/{id}` | Use `GET /me` |
| `GET /browse/new-releases` | Use `/search` |
| `GET /browse/categories` | Removed, no replacement |
| `GET /markets` | Removed |
| `GET /tracks` (bulk) | Use `GET /tracks/{id}` individually |
| `GET /artists` (bulk) | Use `GET /artists/{id}` individually |
| `GET /albums` (bulk) | Use `GET /albums/{id}` individually |
| `PUT /me/tracks` | Use `PUT /me/library` |
| `DELETE /me/tracks` | Use `DELETE /me/library` |
| `GET /me/tracks/contains` | Use `GET /me/library/contains` |
| `PUT /me/following` | Use `PUT /me/library` |
| `DELETE /me/following` | Use `DELETE /me/library` |
| `GET /playlists/{id}/tracks` | Use `GET /playlists/{id}/items` |
| `POST /playlists/{id}/tracks` | Use `POST /playlists/{id}/items` |

## Removed Fields
| Object | Removed Fields |
|---|---|
| Artist | `followers`, `popularity` |
| Album | `label`, `popularity`, `available_markets`, `external_ids`, `album_group` |
| Track | `popularity`, `available_markets`, `external_ids`, `linked_from` |
| User | `product`, `email`, `country`, `followers`, `explicit_content` |
| Playlist | `tracks` renamed to `items` |