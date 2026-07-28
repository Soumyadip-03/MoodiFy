# Moodify — AI Mood-Based Music Player

Moodify detects your facial expression in real time via webcam, maps it to an emotional state, and instantly serves a Spotify-powered playlist that fits how you feel. Built with Next.js 14, FastAPI (Python), Firebase, deepface, and the Spotify Web API (OAuth).

---

## Core Workflow

```
Browser Webcam → WebSocket → FastAPI → deepface/fer → Emotion → Mood → Spotify OAuth API → Music Player
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Backend | Python FastAPI |
| Face Detection | deepface + fer + OpenCV (webcam via WebSocket) |
| Auth | Firebase Authentication (Google + Email/Password) |
| Database | Firestore (user profiles, mood history, liked tracks) |
| Music | Spotify Web API (OAuth — user connects their account) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render / Railway |

---

## Project Roadmap

### Phase 1 — Project Setup & Folder Structure
- [x] Scaffold Next.js 14 frontend (`frontend/`) with TypeScript + Tailwind + App Router
- [x] Scaffold FastAPI backend (`backend/`) with Python 3.11 virtual environment
- [x] Set up frontend folder structure:
  ```
  frontend/
  ├── app/
  │   ├── (auth)/login & signup pages
  │   ├── (app)/dashboard, history, profile
  │   └── globals.css
  ├── components/auth, detection, player, ui
  ├── context/AuthContext.tsx
  ├── hooks/
  ├── lib/firebase.ts, firestore.ts
  ├── types/index.ts
  └── utils/
  ```
- [x] Set up backend folder structure:
  ```
  backend/
  ├── main.py
  ├── routes/spotify.py, mood.py, auth.py
  ├── services/face_detection.py, spotify_service.py
  ├── requirements.txt
  └── .env
  ```
- [x] Configure path aliases in `tsconfig.json`
- [x] Set up Tailwind peach/orange design system (auth + app pages use `#FF6B35` orange, `#FFE8D6`→`#FFF5F0` peach gradient, `#7A6055` muted text)
- [x] Install all frontend and backend dependencies

---

### Phase 2 — Firebase Authentication
- [x] Enable Google Sign-In and Email/Password in Firebase console
- [x] Add Firebase config to `frontend/.env.local`
- [x] `lib/firebase.ts` — initialize Firebase app, Auth, Firestore
- [x] `AuthContext` — React context exposing `user`, `loading`, `signIn`, `signOut`
- [x] Login page (`/login`) — Google OAuth button + email/password form
- [x] Signup page (`/signup`) — email/password registration + display name
- [x] Route protection — middleware redirects unauthenticated users from `/dashboard`, `/history`, `/profile`
- [x] Logged-in users redirected away from `/login` and `/signup` back to `/dashboard`
- [x] Persist auth state across page refreshes
- [x] FastAPI — verify Firebase ID tokens on protected routes
- [x] User profile document created in Firestore on first sign-in
- [x] Dashboard page uses peach/orange design system (`#FFE8D6` → `#FFF5F0` gradient, `#FF6B35` orange accents)

---

### Phase 3 — Realtime Face Detection (WebSocket)
- [x] FastAPI WebSocket endpoint `/ws/detect` — receives webcam frames, returns mood
- [x] `deepface` + OpenCV for emotion detection on each frame
- [x] Confidence threshold (≥ 50%) before triggering mood update
- [x] Debounce mood updates (800ms debounce, 1500ms frame interval)
- [x] Graceful error states: camera denied, no face found, model load failure
- [x] Frontend `useFaceDetection` hook — manages webcam stream + WebSocket connection
- [x] `MoodDetector` component — wired into dashboard, uses peach/orange design system
- [x] Emotion → Mood mapping:

  | Emotion | App Mood |
  |---------|----------|
  |  happy  |  happy   |
  | surprise|  upbeat  |
  | neutral |  chill   |
  |   sad   |melancholy|
  |  fear   | relaxing |
  | disgust | energetic|
  |  angry  | intense  |

---

### Phase 4 — Spotify OAuth Integration

#### Backend
- [ ] FastAPI `/api/spotify/login` — build Spotify auth URL + redirect user to Spotify authorization page
- [ ] FastAPI `/api/spotify/callback` — exchange code for `access_token` + `refresh_token`
- [ ] FastAPI `/api/spotify/recommendations?mood=&uid=` — returns 10 personalized tracks based on mood
- [ ] FastAPI `/api/spotify/refresh?uid=` — auto-refresh expired access tokens
- [ ] `spotify_service.py`:
  - `get_auth_url()` — builds Spotify OAuth URL with required scopes
  - `exchange_code(code)` — POST to Spotify token endpoint
  - `refresh_access_token(refresh_token)` — get new access token
  - `get_recommendations(mood, access_token)` — mood → audio features → tracks
  - `get_user_top_seeds(access_token)` — fetch user's top artists + tracks as recommendation seeds
  - `check_premium(access_token)` — call `GET /v1/me`, return `"premium"` or `"free"`
  - `save_tracks_to_firestore(tracks, mood)` — cache fetched tracks to Firestore `moodTracks` with mood tag
  - `get_recommendations_from_firestore(mood)` — fallback query Firestore `moodTracks` by mood
  - `save_tokens(uid, tokens)` — store tokens in Firestore
  - `get_tokens(uid)` — fetch tokens from Firestore
- [x] Register spotify router in `main.py`
- [ ] `GET /api/spotify/premium` — check and return user's Spotify premium status

#### Mood → Spotify Audio Features Mapping
| Mood | Valence | Energy | Genre Seeds |
|------|---------|--------|-------------|
| happy | 0.8 | 0.8 | pop, happy        |
| upbeat | 0.7 | 0.9 | dance, pop       |
| chill | 0.5 | 0.3 | chill, ambient    |
| melancholy | 0.2 | 0.3 | sad, indie   |
| relaxing | 0.5 | 0.2 | sleep, acoustic|
| energetic | 0.6 | 0.95 | work-out,rock|
| intense | 0.3 | 0.9 | metal, hardcore |

#### Personalized Recommendations
- [ ] Fetch user's top artists + tracks from Spotify as recommendation seeds
- [ ] Blend user's personal taste with mood-based audio features for better results

#### Hybrid Recommendation System (Cache & Serve)
- [ ] Every Spotify recommendation fetched → simultaneously saved to Firestore `moodTracks` collection with mood tag
- [ ] Firestore `moodTracks` document structure:
  ```
  moodTracks/{trackId}
  ├── spotifyId
  ├── title
  ├── artist
  ├── albumArt
  ├── previewUrl
  ├── spotifyUrl
  ├── mood          ← "happy", "chill", etc.
  ├── valence
  ├── energy
  ├── playCount     ← increments on every play
  ├── likeCount     ← increments on every heart/like
  └── savedAt
  ```
- [ ] Fallback layer — when Spotify API unavailable, query Firestore `moodTracks` by mood tag
- [ ] Hardcoded seed playlist per mood — last resort fallback when Firestore has < 5 results
- [ ] Over time `playCount` + `likeCount` build a self-improving popularity ranking per mood

#### Frontend
- [x] `useSpotify` hook — shell created, exports `connected`, `connecting`, `isPremium`, `error`, `connectSpotify()`, `fetchRecommendations()` (TODO: wire to real API)
- [x] `connectSpotify()` — redirects to `/api/spotify/login`
- [ ] `fetchRecommendations(mood)` — calls backend, returns tracks (TODO: implement)
- [ ] Auto-fetch recommendations when mood changes
- [x] `lib/firestore.ts` — `saveSpotifyTokens(uid, tokens)` + `getSpotifyTokens(uid)` stubs added
- [x] `types/index.ts` — `SpotifyTrack` type + `SpotifyTokens` type
- [ ] "Connect Spotify" button on home page
- [ ] Handle `preview_url: null` — show "Open in Spotify" CTA

#### Two-Tier User System
| Feature | Free User | Premium User |
|---|---|---|
| Face scan + mood detection | ✅ | ✅ |
| See recommendations | ✅ | ✅ |
| 30-sec preview playback | ✅ | ✅ |
| Full song playback in MoodiFy | ❌ | ✅ |
| "Open in Spotify" button | ✅ | ✅ |
| Like songs | ✅ | ✅ |
| Create playlist | ✅ | ✅ |
| Premium badge on profile | ❌ | ✅ |
| Artist browsing | ✅ | ✅ |
| Mood Room (Listen Together) | ✅ | ✅ |

#### Premium Detection Flow
- [ ] After Spotify OAuth login call `GET /v1/me` — check `product` field (`"premium"` or `"free"`)
- [ ] Save premium status to Firestore user profile
- [ ] Frontend checks premium status → unlocks full playback via Web Playback SDK
- [ ] Premium badge displayed on profile page
- [ ] Free users get 30-sec preview + "Open in Spotify" button
- [ ] Premium users get full song streaming inside MoodiFy via Web Playback SDK
- [ ] Premium is determined by **user's own Spotify subscription** — no extra cost to developer

#### Sharing
- [ ] WhatsApp share button per track — `https://wa.me/?text=Check out this song on MoodiFy: {spotify_track_url}`
- [ ] Web Share API fallback for native mobile share sheet (WhatsApp, Instagram, copy link, etc.)

---

### Phase 5 — Music Player

> ⚠️ **Depends on Phase 4** — requires `SpotifyTrack` type, `useSpotify` hook, and `fetchRecommendations(mood)` to be available before wiring up the player.

#### Components
- [ ] `components/player/MusicPlayer.tsx` — main player UI:
  - Album art (large)
  - Track name + artist name
  - Seek bar + current time / duration
  - Volume control
  - Prev / Play / Pause / Next controls
  - Free users — 30-sec `preview_url` playback via HTML `<audio>` tag
  - Premium users — full song playback via Spotify Web Playback SDK
  - "Open in Spotify" button on every track
  - WhatsApp share button per track
  - Heart/like button per track (saves to Firestore)
- [ ] `components/player/TrackList.tsx` — scrollable recommendations panel:
  - List of 10 tracks returned by mood
  - Album art thumbnail + track name + artist
  - Active track highlighted
  - Click to play
  - Like + Share buttons per row

#### Sharing
- [ ] WhatsApp share — `https://wa.me/?text=Check out this song on MoodiFy: {spotifyUrl}`
- [ ] Web Share API — native mobile share sheet fallback (WhatsApp, Instagram, copy link)

#### Playback Logic
- [ ] Auto-play first track when mood is detected
- [ ] Free users — HTML `<audio>` plays `preview_url` (30 seconds), stops automatically
- [ ] Premium users — Spotify Web Playback SDK streams full song
- [ ] Show "Open in Spotify" CTA when `preview_url` is null
- [ ] Smooth transition animation when mood changes and playlist refreshes
- [ ] Mood override — manual mood selector dropdown if detection is off

#### Artist & Album Browsing
- [ ] Click any artist name → opens Artist page inside MoodiFy
- [ ] Artist page — artist image, name, genres, follower count
- [ ] Artist top tracks list
- [ ] Album grid — album art, name, release year
- [ ] Click album → track list with play + share buttons
- [ ] Spotify endpoints used:
  - `GET /v1/artists/{id}` — artist info
  - `GET /v1/artists/{id}/albums` — discography
  - `GET /v1/artists/{id}/top-tracks` — top tracks
  - `GET /v1/albums/{id}/tracks` — album track list

#### Mood Room — Listen Together
- [ ] User A creates a Mood Room → gets a unique 6-digit room code
- [ ] User B enters the room code → joins the same room
- [ ] Both users see the same playlist synced in real time via Firestore `onSnapshot`
- [ ] Playback state (current track, position, play/pause) synced across both users
- [ ] Both hear 30-sec previews in sync (free) or full songs (premium)
- [ ] Firestore `moodRooms` collection:
  ```
  moodRooms/{roomCode}
  ├── hostUid
  ├── guestUid
  ├── mood
  ├── currentTrackIndex
  ├── isPlaying
  ├── tracks[]
  └── createdAt
  ```

#### Design Notes for Collaborator
- Dark mode default — bg `#0a0a0a`, cards `#111111`, borders `#2a2a2a`
- Light mode — bg gradient `#FFE8D6` → `#FFF5F0`, cards `white`, borders `#FFDDD2`
- Orange accent — `#FF6B35` for all interactive elements
- Muted text — `#7A6055` (light) / `#aaa` (dark)
- Font — `font-pacifico` for brand name only, `font-comfortaa` for everything else
- Use `useTheme()` from `context/ThemeContext.tsx` for all theme-aware styling

---

### Phase 6 — User Features (Firestore)
- [ ] **Mood History** — every detection session saved: `{ userId, mood, confidence, timestamp }`
- [ ] `/history` page — timeline of past moods with date grouping
- [ ] **Weekly Mood Chart** — bar/line chart showing mood frequency over last 7 days
- [ ] **Liked Tracks** — heart button saved to Firestore: `{ userId, trackId, title, artist, albumArt, external_url, likedAt }`
- [ ] `/profile` page — display name, avatar, liked tracks, mood stats
- [ ] Delete mood history entries

---

### Phase 7 — UI Polish & Responsiveness
- [ ] Consistent dark black/orange design system across all pages
- [ ] Mobile-first responsive layout (stacked on mobile, side-by-side on desktop)
- [ ] Loading skeletons for player and detection panels
- [ ] Toast notifications for auth events
- [ ] Smooth page transitions
- [ ] Favicon and Open Graph meta tags

---

### Phase 8 — Deployment
- [ ] Deploy frontend to Vercel — configure environment variables
- [ ] Deploy backend to Render / Railway — configure environment variables
- [ ] Firebase authorized domains updated to include production URL
- [ ] Spotify redirect URI updated for production
- [ ] CORS configured in FastAPI for production frontend URL
- [ ] Final build check — `npm run build` passes with no errors

---

## Environment Variables

**`frontend/.env.local`**
```env
# Firebase (client-side — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**`backend/.env`**
```env
# Spotify
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/spotify/callback

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/serviceAccountKey.json

# App
FRONTEND_URL=http://localhost:3000
```

---

## Current Status

### ✅ Phase 1 — Complete
- Next.js 14 scaffolded with TypeScript, Tailwind v3, ESLint, App Router
- Full frontend folder structure created
- All frontend dependencies installed (Framer Motion, React Three Fiber, Three.js, Firebase)
- FastAPI backend scaffolded with full folder structure
- All backend dependencies installed (deepface, fer, OpenCV, Firebase Admin, etc.)
- `requirements.txt` generated
- `.env.local` and `.env` placeholder files created

### ✅ Phase 2 — Firebase Authentication — Complete
- `lib/firebase.ts` — Firebase app initialized with env vars
- `AuthContext.tsx` — Google + Email/Password sign-in, token refresh every 55 mins
- Login/Signup pages built with Framer Motion animations
- Route protection middleware — redirects unauthenticated users to `/login`, logged-in users away from auth routes to `/dashboard`
- `backend/main.py` — FastAPI app with CORS middleware + auth + mood routers registered
- `backend/serviceAccountKey.json` — valid service account key from Firebase console
- Dashboard uses peach/orange design system consistent with auth pages

### ✅ Phase 3 — Realtime Face Detection (WebSocket) — Complete
- FastAPI WebSocket endpoint `/ws/detect` — receives webcam frames, returns mood
- `useFaceDetection` hook — manages webcam stream + WebSocket connection
- `MoodDetector` component — wired into dashboard, design system aligned with Phase 2 (peach/orange)
- Emotion → Mood mapping complete (`moodUtils.ts`)
- deepface model pre-loaded at startup for reduced latency
- Debounce (800ms) + frame interval (1500ms) to avoid rapid mood switching

### 🟡 Phase 4 — Spotify OAuth Integration — In Progress
- `useSpotify.ts` shell created — shape ready, real API wiring pending
- `firestore.ts` — `saveSpotifyTokens` + `getSpotifyTokens` stubs added
- Spotify router registered in `main.py`
- Backend routes + service functions — all stubs, implementation pending

### 🔲 Phase 5 — Music Player
### 🔲 Phase 6 — User Features (Firestore)
### 🔲 Phase 7 — UI Polish & Responsiveness
### 🔲 Phase 8 — Deployment

---

## Getting Started (for collaborators)

> **Requirements:** Node.js v22+ and Python 3.11.x

**1. Clone the repo:**
```bash
git clone https://github.com/<your-username>/MoodiFy.git
cd MoodiFy
```

**2. Frontend setup:**
```bash
cd frontend
npm install
```

Create `frontend/.env.local` and fill in your Firebase config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Run the frontend:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**3. Backend setup:**
```bash
cd backend
"C:\Users\<username>\AppData\Local\Programs\Python\Python311\python.exe" -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

Create `backend/.env` and fill in your credentials:
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/spotify/callback
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/serviceAccountKey.json
FRONTEND_URL=http://localhost:3000
```

Run the backend:
```bash
uvicorn main:app --reload --port 8000
```
Open [http://localhost:8000/docs](http://localhost:8000/docs)

> ⚠️ Never commit `.env` or `.env.local` — they are in `.gitignore`

---

## Folder Structure (Target)

```
MoodiFy/
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx          ← landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── GoogleSignInButton.tsx
│   │   ├── detection/
│   │   │   └── MoodDetector.tsx   ← webcam + WebSocket
│   │   ├── player/
│   │   │   ├── MusicPlayer.tsx
│   │   │   └── TrackList.tsx
│   │   └── ui/
│   │       ├── Header.tsx
│   │       ├── Toast.tsx
│   │       └── MoodBadge.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useFaceDetection.ts
│   │   └── useSpotify.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── firestore.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── moodUtils.ts
│   ├── middleware.ts           ← route protection
│   ├── .env.local
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
└── backend/
    ├── main.py
    ├── routes/
    │   ├── spotify.py
    │   ├── mood.py
    │   └── auth.py
    ├── services/
    │   ├── face_detection.py
    │   └── spotify_service.py
    ├── requirements.txt
    └── .env
```

---

## License

Proprietary — © 2025 Soumyadip. All Rights Reserved.
