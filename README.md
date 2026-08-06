# MoodiFy — AI Mood-Based Music Player

MoodiFy detects your facial expression in real time via webcam, maps it to an emotional state, and instantly serves a Spotify-powered playlist that fits how you feel. Built with Next.js 14, FastAPI (Python), Firebase, deepface, and the Spotify Web API (OAuth).

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
  │   ├── (app)/home, history, profile, mood-room
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
- [x] `ThemeContext.tsx` — dark/light theme context with `useTheme()` hook, persists to `localStorage`
- [x] `ThemeToggle.tsx` — sun/moon toggle button used in Header
- [x] Login page (`/login`) — Google OAuth button + email/password form
- [x] Signup page (`/signup`) — email/password registration + display name
- [x] Route protection — middleware redirects unauthenticated users from `/home`, `/history`, `/profile`, `/playlist`, `/mood-room`
- [x] Logged-in users redirected away from `/login` and `/signup` back to `/home`
- [x] Persist auth state across page refreshes
- [x] FastAPI — verify Firebase ID tokens on protected routes
- [x] User profile document created in Firestore on first sign-in
- [x] Home page uses peach/orange design system (`#FFE8D6` → `#FFF5F0` gradient, `#FF6B35` orange accents)

---

### Phase 3 — Realtime Face Detection (WebSocket)
- [x] FastAPI WebSocket endpoint `/ws/detect` — receives webcam frames, returns mood
- [x] `deepface` + OpenCV for emotion detection on each frame
- [x] Confidence threshold (≥ 50%) before triggering mood update
- [x] Debounce mood updates (800ms debounce, 1500ms frame interval)
- [x] Graceful error states: camera denied, no face found, model load failure
- [x] Frontend `useFaceDetection` hook — manages webcam stream + WebSocket connection
- [x] `MoodDetector` component — wired into home page, uses peach/orange design system
- [x] Emotion → Mood mapping:

  | Emotion | App Mood |
  |---------|----------|
  |  happy  |  happy   |
  | surprise|  upbeat  |
  | neutral |  chill   |
  |   sad   |melancholy|
  |  fear   | relaxing |
  | disgust | romantic |
  |  angry  | intense  |

---

### Phase 4 — Spotify OAuth Integration

#### Backend
- [x] FastAPI `/api/spotify/login` — build Spotify auth URL + redirect user to Spotify authorization page
- [x] FastAPI `/api/spotify/callback` — exchange code for `access_token` + `refresh_token`
- [x] FastAPI `/api/spotify/recommendations?mood=&uid=` — returns tracks based on mood
- [x] FastAPI `/api/spotify/refresh?uid=` — auto-refresh expired access tokens
- [x] FastAPI `/api/spotify/status?uid=` — returns `{connected, isPremium}`
- [x] FastAPI `/api/spotify/disconnect?uid=` — removes tokens + premium flag from Firestore
- [x] `spotify_service.py` — all service functions implemented, dead code removed (`get_top_tracks`, module-level `MOODIFY_REFRESH_TOKEN` var)
- [x] `spotify_service.py` — random offset on playlist fetch for full playlist variety
- [x] `spotify_service.py` — `_filter_by_language()` — language filter fixed (was bypassed before, now applied to playlist tracks)
- [x] Spotify router registered in `main.py`

> ⚠️ **Spotify Dev Mode Limitation** — `/recommendations` endpoint blocked for new apps. Search fallback via `/search` is used instead. Owner account playlists used as primary source — full track data returned. Language filter works via title/artist keyword matching at query time. Random offset used on playlist fetch so all 200+ songs are accessible, not just first 100.

#### Mood → Spotify Audio Features Mapping
| Mood | Valence | Energy | Genre Seeds |
|------|---------|--------|-------------|
| happy | 0.8 | 0.8 | pop, happy |
| upbeat | 0.7 | 0.9 | dance, pop |
| chill | 0.5 | 0.3 | chill, ambient |
| melancholy | 0.2 | 0.3 | sad, indie |
| relaxing | 0.5 | 0.2 | sleep, acoustic |
| romantic | 0.7 | 0.4 | romance, soul |
| intense | 0.3 | 0.9 | metal, hardcore |

#### Frontend
- [x] `useSpotify` hook — manages Spotify connection state (`connected`, `connecting`, `isPremium`, `error`)
- [x] `useSpotifyPlayer` hook — full Spotify Web Playback SDK integration for Premium users
- [x] Profile page — Connect + Disconnect Spotify buttons, OAuth redirect handling
- [x] Home page — real recommendations fetched on mount + on mood detection
- [x] Nudge banner shown when Spotify not connected
- [x] Premium detection — crown badge + golden ring on avatar, profile shows Premium status
- [x] `moodTracks` Firestore collection — auto-populated on every successful fetch

#### Two-Tier User System
|        Feature             | Free User | Premium User |
|----------------------------|-----------|--------------|
| Face scan + mood detection |     ✅   |      ✅      |
| See recommendations        |     ✅   |      ✅      |
| 30-sec preview playback    |✅(if previewUrl available)| ✅ |
| Full song playback in MoodiFy|   ❌   | ✅ Web Playback SDK |
| "Open in Spotify" button   |     ✅   |      ✅      |
| Like songs                 |     ✅   |      ✅      |
| Create playlist            |     ✅   |      ✅      |
| Premium badge + crown on avatar| ❌   |      ✅      |
| Artist browsing            |     ✅   |      ✅      |
| Mood Room (Listen Together)|     ✅   |      ✅      |

> ⚠️ **Spotify Dev Mode** — Owner account playlists used for mood tracks. Trending playlist used for home page recommendations. `energetic` mood replaced by `romantic`. `MOOD_PLAYLIST_ROMANTIC` still has placeholder ID in `.env` — needs to be filled.

> ℹ️ **Owner Account** — The owner account does NOT need Spotify Premium. It only needs to own the mood playlists. `GET /playlists/{id}/items` works on any Free account as long as the playlist is owned by it. Premium is only required for individual users who want full song playback via the Web Playback SDK.

---

### Phase 5 — Music Player

#### Components
- [x] `components/player/MusicPlayer.tsx` — Spotify-style single-row persistent bar (mounted in `(app)/layout.tsx`, height `80px`):
  - **Left zone** — album art + title + artist (truncated)
  - **Centre zone** — Shuffle · SkipBack · Play/Pause · SkipForward · Repeat + seek bar with timestamps
  - **Right zone** — `Disc3` Go to Album · `Mic2` Go to Artist · Volume slider
  - `currentTrackIdRef` guard on `onCanPlay` — prevents stale src firing autoplay for previous track
  - Auto-skip via `setTimeout(800ms)` when `previewUrl` is null
  - Free users — 30-sec `preview_url` playback via HTML `<audio>` tag
  - Premium users — full song streaming via `useSpotifyPlayer` hook (Spotify Web Playback SDK)
- [x] `components/player/TrackList.tsx` — scrollable Up Next panel:
  - Album art `w-12 h-12`, track title `text-base`, artist `text-sm`, row padding `py-2` (enlarged for readability)
  - Active track highlighted, click to play
  - Context menu with Like, Go to Artist, Go to Album, Share per row
- [x] `components/ui/ContextMenu.tsx` — portal-based context menu with rounded hover items
- [x] `components/ui/ThemeToggle.tsx` — dark/light toggle in Header
- [ ] `components/ui/Toast.tsx` — file scaffolded, implementation pending (Phase 7)

#### Header — Nav Pill Animation
- [x] Framer Motion `layoutId="nav-capsule"` sliding orange capsule between tabs
- [x] Water/jelly spring effect — `stiffness: 180`, `damping: 10`, `mass: 0.6` — capsule overshoots and wobbles on landing
- [x] Nav pill hidden (`visibility: hidden`) on `/profile` and `/mood-room` pages — logo and avatar remain visible
- [x] Back arrow (`ArrowLeft` + `router.back()`) on Profile and Mood Room pages instead of nav tabs

#### Playback Logic
- [x] Auto-play first track when mood is detected
- [x] Prev / Next track navigation through current queue
- [x] Recommended songs grid shown before mood is detected (5-col grid)
- [x] TrackList shown after mood is detected
- [x] Language preference multi-select filter on home page
- [x] Smooth transition animation when mood changes and playlist refreshes
- [x] Premium users — Spotify Web Playback SDK full song streaming

#### Playlist Page (`/playlist`)
- [x] Sidebar with all user playlists — Liked Songs, custom playlists, Moods Playlist folder
- [x] Moods Playlist folder — expands to show all 7 mood sub-playlists
- [x] Spotify-style hero banner — large cover art, playlist label, name, song count + total duration, play + shuffle
- [x] Track table — #, title + album art, album, date added, duration, context menu
- [x] Create playlist button — prompts for name, adds to sidebar
- [x] Custom playlists get ⋯ menu on hover — dropdown with 🔗 Share and 🗑️ Delete
- [x] Mood picker grid view — clicking "Moods Playlist" folder shows 4-col emoji grid of all 7 moods

#### History Page (`/history`)
- [x] Date heading — shows "Today" when today is selected, full date label otherwise
- [x] "View Date" calendar dropdown — month/year selectors + full calendar grid
- [x] Today highlighted with orange border ring; selected day filled orange
- [x] Empty state card shown — "No history yet" (no mock data)
- [x] Per-detection entry cards
- [x] Mood summary pills
- [x] Songs played dropdown per entry

#### Artist & Album Browsing
- [x] Click any artist name → opens Artist modal (portal overlay)
- [x] Artist modal — artist image, name, genres, follower count, popularity bar, top tracks, albums grid
- [x] Album modal — album art, release year, label, track table with play
- [x] `context/ArtistAlbumContext.tsx` — modal stack navigation
- [x] `components/ui/ArtistModal.tsx`, `AlbumModal.tsx`, `ModalRenderer.tsx`, `ModalSkeleton.tsx`
- [x] Backend `/api/spotify/artist/{id}` and `/api/spotify/album/{id}` endpoints live
- [x] Artist endpoint 500 error fixed — safe `.get()` guards on all dict accesses, per-item try/except so one bad track/album can't crash the full response

#### Mood Room — Listen Together
- [x] `/mood-room` page built — "Coming Soon" page with:
  - Spinning disco ball with pulsing orange glow rings (Framer Motion)
  - "Mood Room" in Pacifico font + "Coming Soon" with orange pulse dots
  - Back arrow to return to previous page
  - Route protected in middleware
- [ ] Full Mood Room feature (real-time sync) — postponed to Phase 7
- [ ] Firestore `moodRooms` collection — postponed to Phase 7:
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

#### Landing Page (`app/page.tsx`)
- [x] Hero section — headline, subtext, CTA buttons, pipeline pill
- [x] Stats bar — 7 Moods, <1s Detection, 6 Languages, ∞ Tracks
- [x] How It Works — 3-step cards with 3D tilt effect
- [x] Mood Showcase — 7-col grid of all moods with genre tags
- [x] Features Grid — 6 feature cards
- [x] **Credits section** (replaces Testimonials):
  - Two equal-height team cards — Soumyadip (Full-Stack Developer) + Sulagna (UI/UX Designer)
  - Each card has GitHub + LinkedIn icon links
  - Sulagna's card has a `FolderOpen` Designs button — clicking it slides open a 4-col design gallery below the cards with staggered spring animation (accordion expand/collapse)
  - Each design card has an orange `↗` arrow on hover — opens full image in new tab
  - Design images: Home, Playlist, History, Logo (from `public/credits/`)
- [x] CTA Banner — gradient orange section with sign-up CTA
- [x] Navbar includes: How It Works · Moods · Features · Credits anchor links
- [x] Dark/light theme support throughout
- [x] Framer Motion scroll animations + 3D tilt cards

#### Design Notes
- Dark mode — bg `#0a0a0a`, cards `#111111`, borders `#2a2a2a`
- Light mode — bg gradient `#FFE8D6` → `#FFF5F0`, cards `white`, borders `#FFDDD2`
- Orange accent — `#FF6B35` for all interactive elements
- Muted text — `#7A6055` (light) / `#aaa` (dark)
- Font — `font-pacifico` for brand name only, `font-comfortaa` for everything else
- Use `useTheme()` from `context/ThemeContext.tsx` for all theme-aware styling

---

### Phase 6 — User Features (Firestore)

- [x] **Mood History** — every detection session saved: { userId, mood, confidence, timestamp }
- [x] **/history page** — timeline of past moods with date grouping
- [x] **/history page** — timeline of past moods with date grouping, per-detection entry cards, mood summary pills, songs played dropdown per entry
- [x] **Weekly Mood Chart** — bar/line chart showing mood frequency over last 7 days
- [x] **Liked Tracks** — heart button saved to Firestore: { userId, trackId, title, artist, albumArt, external_url, likedAt }
- [x] **/profile page** — display name, avatar, liked tracks, mood stats
- [x] **Liked Tracks** — heart button saved to Firestore: { userId, trackId, title, artist, albumArt, external_url, likedAt } — currently in-memory only, resets on refresh
- [x] **Custom Playlists** — save to Firestore, persist across sessions, wire "Add to Playlist" in context menu
- [x] **/profile page** — display name, avatar, liked tracks count, mood stats

#### Bug Fixes & Known Issues
- [x] **Mood History** — every detection session saved: `{ userId, mood, confidence, timestamp }`
- [x] `/history` page — timeline of past moods with date grouping, per-detection entry cards, mood summary pills, songs played dropdown per entry
- [x] **Weekly Mood Chart** — bar/line chart showing mood frequency over last 7 days
- [x] **Liked Tracks** — heart button saved to Firestore: `{ userId, trackId, title, artist, albumArt, external_url, likedAt }` — persists across sessions via `likedTracks/{uid}/tracks/{trackId}`
- [x] **Custom Playlists** — save to Firestore, persist across sessions, wire "Add to Playlist" in context menu
- [x] `/profile` page — display name, avatar, liked tracks count, mood stats
- [x] **Language filter** — language-specific playlists per mood fetched from owner account; selected languages fetch from dedicated playlists and merge results
- [x] **Profile page — Delete Account** — `deleteUser` + Firestore cleanup implemented
- [x] **Always 2nd song playing** — fixed; queue now starts at index 0 on mood detection

---

### Phase 7 — UI Polish, Responsiveness & Deferred Features
- [ ] Consistent dark black/orange design system across all pages
- [ ] Mobile-first responsive layout (stacked on mobile, side-by-side on desktop)
- [ ] Loading skeletons for player and detection panels
- [ ] Toast notifications for auth events (`Toast.tsx` pending)
- [ ] Smooth page transitions
- [ ] Favicon and Open Graph meta tags
- [ ] Shuffle / Repeat logic wired in `MusicPlayer.tsx`
- [x] **Romantic playlist** — create playlist on owner Spotify account, fill `MOOD_PLAYLIST_ROMANTIC` in `backend/.env`
- [ ] **Mood Room** — full real-time listen-together feature via Firestore `onSnapshot`

#### Bug Fixes & Known Issues
- [ ] **Album queue** — playing a track from AlbumModal should load the full album as the active queue in `PlayerContext`
- [ ] **Up Next panel refreshing** — `TrackList` re-renders/resets scroll position unexpectedly; needs stable queue reference
- [ ] **No back button from album tracklist** — AlbumModal has no way to return to the Up Next / mood tracklist view; add back navigation
- [ ] **History page UI fixes** — layout and spacing polish on `/history` page
- [ ] **Profile page UI fixes** — layout and spacing polish on `/profile` page

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
### ✅ Phase 2 — Firebase Authentication — Complete
### ✅ Phase 3 — Realtime Face Detection (WebSocket) — Complete
### ✅ Phase 4 — Spotify OAuth Integration — Complete
### ✅ Phase 5 — Music Player — Complete
### ✅ Phase 6 — User Features (Firestore) — Complete

### 🔲 Phase 7 — UI Polish & Responsiveness
### 🔲 Phase 8 — Deployment

---

## Getting Started (for collaborators)

> **Requirements:** Node.js v22+ and Python 3.11.x

**1. Clone the repo:**
```bash
git clone https://github.com/Soumyadip-03/MoodiFy.git
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

## Folder Structure

```
MoodiFy/
├── Credits/                    ← UI design screenshots (source)
│   ├── Home.jpeg
│   ├── PlayList.jpeg
│   ├── History.jpeg
│   └── Logo.jpeg
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/
│   │   │   ├── home/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   ├── playlist/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── mood-room/page.tsx  ← Coming Soon page
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── GoogleSignInButton.tsx
│   │   ├── detection/
│   │   │   └── MoodDetector.tsx
│   │   ├── player/
│   │   │   ├── MusicPlayer.tsx
│   │   │   └── TrackList.tsx
│   │   └── ui/
│   │       ├── Header.tsx
│   │       ├── Toast.tsx
│   │       ├── MoodBadge.tsx
│   │       ├── ArtistModal.tsx
│   │       ├── AlbumModal.tsx
│   │       ├── ModalRenderer.tsx
│   │       ├── ModalSkeleton.tsx
│   │       └── ThemeToggle.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── PlayerContext.tsx
│   │   └── ArtistAlbumContext.tsx
│   ├── hooks/
│   │   ├── useFaceDetection.ts
│   │   ├── useSpotify.ts
│   │   └── useSpotifyPlayer.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── firestore.ts
│   ├── public/
│   │   ├── logo.png
│   │   ├── disco-ball.png
│   │   └── credits/            ← design images served by Next.js
│   │       ├── Home.jpeg
│   │       ├── PlayList.jpeg
│   │       ├── History.jpeg
│   │       └── Logo.jpeg
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── moodUtils.ts
│   │   └── mockData.ts
│   ├── middleware.ts
│   ├── .env.local
│   ├── next.config.mjs
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

## Known Pending Items

- **Album queue** — playing from AlbumModal doesn't load album as active queue; pending Phase 7
- **Up Next panel refreshing** — `TrackList` resets unexpectedly on re-render; pending Phase 7
- **No back button from album tracklist** — AlbumModal missing back navigation to mood tracklist; pending Phase 7
- **History page UI fixes** — layout/spacing polish pending Phase 7
- **Profile page UI fixes** — layout/spacing polish pending Phase 7
- **Shuffle / Repeat buttons** — now fully wired with ref-based state
- **30s preview URLs** — deprecated by Spotify, most tracks have `previewUrl: null`
- **Mood Room** — Coming Soon page shown, full real-time sync postponed to Phase 7
- **Toast.tsx** — file exists but empty, pending Phase 7

---

## Credits

| Name | Role | GitHub | LinkedIn |
|---|---|---|---|
| Soumyadip | Full-Stack Developer | [Soumyadip-03](https://github.com/Soumyadip-03) | [Profile](https://www.linkedin.com/in/soumyadip-khan-sarkar-8bbb6331b/) |
| Sulagna | UI / UX Designer | [Sulagna2005](https://github.com/Sulagna2005) | [Profile](https://www.linkedin.com/in/sulagna-bhattacharya-145993377/) |

---

## License

Proprietary — © 2026 Soumyadip. All Rights Reserved.
