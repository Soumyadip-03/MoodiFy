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
  ├── app/(auth)/login & signup pages
  ├── app/(app)/home, history, profile, mood-room
  ├── components/auth, detection, player, ui
  ├── context/AuthContext.tsx
  ├── lib/firebase.ts, firestore.ts
  └── types/index.ts
  ```
- [x] Set up backend folder structure:
  ```
  backend/
  ├── main.py
  ├── routes/spotify.py, mood.py, auth.py
  ├── services/face_detection.py, spotify_service.py
  └── requirements.txt
  ```
- [x] Configure path aliases in `tsconfig.json`
- [x] Set up Tailwind peach/orange design system (`#FF6B35` orange, `#FFE8D6`→`#FFF5F0` peach gradient, `#7A6055` muted text)
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
- [x] Route protection — middleware redirects unauthenticated users
- [x] Logged-in users redirected away from `/login` and `/signup` back to `/home`
- [x] Persist auth state across page refreshes
- [x] FastAPI — verify Firebase ID tokens on protected routes
- [x] User profile document created in Firestore on first sign-in
- [x] Home page uses peach/orange design system

---

### Phase 3 — Realtime Face Detection (WebSocket)
- [x] FastAPI WebSocket endpoint `/ws/detect` — receives webcam frames, returns mood
- [x] `deepface` + OpenCV for emotion detection on each frame
- [x] Confidence threshold (≥ 50%) before triggering mood update
- [x] Debounce mood updates (800ms debounce, 1500ms frame interval)
- [x] Graceful error states: camera denied, no face found, model load failure
- [x] Frontend `useFaceDetection` hook — manages webcam stream + WebSocket connection
- [x] `MoodDetector` component — wired into home page
- [x] Emotion → Mood mapping:

| Emotion | App Mood |
|---------|----------|
| happy | happy |
| surprise | upbeat |
| neutral | chill |
| sad | melancholy |
| fear | relaxing |
| disgust | romantic |
| angry | intense |

---

### Phase 4 — Spotify OAuth Integration

#### Backend
- [x] FastAPI `/api/spotify/login` — build Spotify auth URL + redirect
- [x] FastAPI `/api/spotify/callback` — exchange code for tokens
- [x] FastAPI `/api/spotify/recommendations?mood=&uid=` — returns tracks based on mood
- [x] FastAPI `/api/spotify/refresh?uid=` — auto-refresh expired access tokens
- [x] FastAPI `/api/spotify/status?uid=` — returns `{connected, isPremium}`
- [x] FastAPI `/api/spotify/disconnect?uid=` — removes tokens from Firestore
- [x] `spotify_service.py` — all service functions implemented
- [x] Random offset on playlist fetch for full playlist variety
- [x] Language filter applied to playlist tracks
- [x] Spotify router registered in `main.py`

> ⚠️ **Spotify Dev Mode Limitation** — `/recommendations` endpoint blocked for new apps. Owner account playlists used as primary source. Random offset used on playlist fetch so all 200+ songs are accessible.

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
- [x] `useSpotify` hook — manages Spotify connection state
- [x] `useSpotifyPlayer` hook — full Spotify Web Playback SDK integration for Premium users
- [x] Profile page — Connect + Disconnect Spotify buttons
- [x] Home page — real recommendations fetched on mount + on mood detection
- [x] Nudge banner shown when Spotify not connected
- [x] Premium detection — crown badge + golden ring on avatar
- [x] `moodTracks` Firestore collection — auto-populated on every successful fetch

#### Two-Tier User System
| Feature | Free User | Premium User |
|---------|-----------|--------------|
| Face scan + mood detection | ✅ | ✅ |
| See recommendations | ✅ | ✅ |
| 30-sec preview playback | ✅ (if available) | ✅ |
| Full song playback in MoodiFy | ❌ | ✅ Web Playback SDK |
| "Open in Spotify" button | ✅ | ✅ |
| Like songs | ✅ | ✅ |
| Create playlist | ✅ | ✅ |
| Premium badge + crown on avatar | ❌ | ✅ |
| Artist browsing | ✅ | ✅ |
| Mood Room (Listen Together) | ✅ | ✅ |

> ℹ️ **Owner Account** — The owner account does NOT need Spotify Premium. It only needs to own the mood playlists. Premium is only required for users who want full song playback via the Web Playback SDK.

---

### Phase 5 — Music Player

#### Components
- [x] `MusicPlayer.tsx` — Spotify-style persistent bar (80px height) in `(app)/layout.tsx`:
  - **Left zone** — album art + title + artist (truncated)
  - **Centre zone** — Shuffle · SkipBack · Play/Pause · SkipForward · Repeat + seek bar with timestamps
  - **Right zone** — Go to Album · Go to Artist · Volume slider
  - `currentTrackIdRef` guard prevents stale src firing autoplay
  - Auto-skip via `setTimeout(800ms)` when `previewUrl` is null
  - Free users — 30-sec preview via HTML `<audio>` tag
  - Premium users — full song via Spotify Web Playback SDK
- [x] `TrackList.tsx` — scrollable Up Next panel (album art `w-12 h-12`, enlarged for readability)
- [x] Context menu — Like, Go to Artist, Go to Album, Share per row
- [x] `ThemeToggle.tsx` — dark/light toggle in Header
- [x] Toast notifications — implemented with sonner

#### Header — Nav Pill Animation
- [x] Framer Motion `layoutId="nav-capsule"` sliding orange capsule between tabs
- [x] Water/jelly spring effect — `stiffness: 180`, `damping: 10`, `mass: 0.6`
- [x] Nav pill hidden on `/profile` and `/mood-room` pages
- [x] Back arrow (`ArrowLeft` + `router.back()`) on Profile and Mood Room pages

#### Playback Logic
- [x] Auto-play first track when mood is detected
- [x] Prev / Next track navigation through current queue
- [x] Recommended songs grid shown before mood detection (5-col grid)
- [x] TrackList shown after mood detection
- [x] Language preference multi-select filter on home page
- [x] Smooth transition animation when mood changes
- [x] Premium users — Spotify Web Playback SDK full song streaming

#### Playlist Page (`/playlist`)
- [x] Sidebar with all user playlists — Liked Songs, custom playlists, Moods Playlist folder
- [x] Moods Playlist folder — expands to show all 7 mood sub-playlists
- [x] Spotify-style hero banner — cover art, name, song count + duration, play + shuffle
- [x] Track table — #, title + album art, album, date added, duration, context menu
- [x] Create playlist button — prompts for name, adds to sidebar
- [x] Custom playlists get ⋯ menu on hover — dropdown with Share and Delete
- [x] Mood picker grid view — 4-col emoji grid of all 7 moods

#### History Page (`/history`)
- [x] Date heading — shows "Today" when today is selected
- [x] "View Date" calendar dropdown — month/year selectors + full calendar grid
- [x] Today highlighted with orange border ring; selected day filled orange
- [x] Empty state card shown — "No history yet"
- [x] Per-detection entry cards
- [x] Mood summary pills
- [x] Songs played dropdown per entry

#### Artist & Album Browsing
- [x] Click any artist name → opens Artist modal (portal overlay)
- [x] Artist modal — image, name, genres, follower count, popularity bar, top tracks, albums grid
- [x] Album modal — album art, release year, label, track table with play
- [x] `context/ArtistAlbumContext.tsx` — modal stack navigation
- [x] Backend `/api/spotify/artist/{id}` and `/api/spotify/album/{id}` endpoints
- [x] Artist endpoint 500 error fixed — safe `.get()` guards on all dict accesses

#### Mood Room — Listen Together
- [x] `/mood-room` page built — "Coming Soon" page with spinning disco ball
- [ ] Full Mood Room feature (real-time sync) — postponed to Phase 8

#### Landing Page (`app/page.tsx`)
- [x] Hero section — headline, subtext, CTA buttons, pipeline pill
- [x] Stats bar — 7 Moods, <1s Detection, 6 Languages, ∞ Tracks
- [x] How It Works — 3-step cards with 3D tilt effect
- [x] Mood Showcase — 7-col grid of all moods with genre tags
- [x] Features Grid — 6 feature cards
- [x] **Credits section** — Two team cards (Soumyadip + Sulagna) with GitHub + LinkedIn links
  - Sulagna's card has design gallery that slides open with staggered spring animation
- [x] CTA Banner — gradient orange section with sign-up CTA
- [x] Navbar includes anchor links: How It Works · Moods · Features · Credits
- [x] Dark/light theme support throughout
- [x] Framer Motion scroll animations + 3D tilt cards

#### Design Notes
- Dark mode — bg `#0a0a0a`, cards `#111111`, borders `#2a2a2a`
- Light mode — bg gradient `#FFE8D6` → `#FFF5F0`, cards `white`, borders `#FFDDD2`
- Orange accent — `#FF6B35` for all interactive elements
- Muted text — `#7A6055` (light) / `#aaa` (dark)
- Font — `font-pacifico` for brand name only, `font-comfortaa` for everything else

---

### Phase 6 — User Features (Firestore)
- [x] **Mood History** — every detection session saved: `{ userId, mood, confidence, timestamp }`
- [x] `/history` page — timeline with date grouping, per-detection entry cards, mood summary pills
- [x] **Weekly Mood Chart** — bar/line chart showing mood frequency over last 7 days
- [x] **Liked Tracks** — heart button saved to Firestore: `{ userId, trackId, title, artist, albumArt, external_url, likedAt }`
- [x] **Custom Playlists** — save to Firestore, persist across sessions
- [x] `/profile` page — display name, avatar, liked tracks count, mood stats
- [x] **Language filter** — language-specific playlists per mood fetched from owner account
- [x] **Profile page — Delete Account** — `deleteUser` + Firestore cleanup implemented
- [x] **Always 2nd song playing** — fixed; queue now starts at index 0 on mood detection

#### Bug Fixes
- [x] Liked tracks persist across sessions via `likedTracks/{uid}/tracks/{trackId}`
- [x] Custom playlists wired in context menu "Add to Playlist"
- [x] Language preference applies correctly to mood-based recommendations

---

### Phase 7 — UI Polish, Responsiveness & Deferred Features
- [x] Consistent dark black/orange design system across all pages
- [x] **Landing page responsive** — full mobile-first design with hamburger menu
- [x] **History page responsive** — columns stack on mobile, side-by-side on desktop
- [x] **Profile page responsive** — two-panel layout stacks vertically on mobile
- [x] **Playlist page responsive** — sidebar + grid adapt for mobile
- [x] **Header responsive** — hamburger menu on mobile, full nav on desktop
- [x] **Home page responsive** — left panel stacks below right panel on mobile
- [x] **History page loading skeletons** — implemented for mood entries
- [x] **Album modal loading skeleton** — `ModalSkeleton.tsx` used
- [x] **Home page loading skeletons** — trending cards skeleton implemented
- [x] **Toast notifications** — implemented with sonner (detection start, mood detected, queue refresh)
- [x] **Soothing animations** — playlist & history pages with fade-in/slide transitions
- [x] **Refresh button** — re-fetch mood queue with language preference, detailed toasts
- [x] Smooth page transitions
- [x] **Favicon** — logo.png set as icon in metadata
- [ ] **Open Graph meta tags** — needs og:image, og:description, twitter:card for social sharing
- [x] **Shuffle / Repeat logic wired** — ref-based state, fully synced

#### Bug Fixes & Improvements
- [x] **Album queue** — playing track from AlbumModal loads full album via `playAlbumTrack`
- [x] **Up Next reshuffles on navigation** — `selectedLangs` moved to `PlayerContext`; queue persists
- [x] **Language change reshuffled current Up Next** — removed `selectedLangs` effect
- [x] **Camera denied ran 5-second countdown** — `startDetection` returns boolean; bails on error
- [x] **Blank cards in Up Next** — tracks with null `albumArt` filtered out in backend
- [x] **Album plays hijacked home Up Next panel** — album playback uses separate `albumSource` context
- [x] **AlbumModal close animation** — dropdown slide-down exit animation on track play
- [x] **AlbumModal play/pause sync** — hero play button reflects actual player state
- [x] **Queue icon in MusicPlayer** — `ListMusic` icon shown only when album is active
- [x] **`registerPlayHandler` crash** — replaced with `registerPlayAlbumHandler` pattern
- [x] **Trending history tracking issue** — fixed with "Track Trending Plays" toggle
- [x] **History page UI fixes** — layout and spacing polish
- [x] **Profile page redesign** — complete overhaul with two-panel layout
- [x] **Track Trending Plays toggle** — user preference setting for trending history
- [x] **Session state security** — PlayerContext resets on sign-out to prevent data leakage
- [x] **Countdown blinking fix** — optimized state updates with `will-change` CSS hints
- [x] **Spotify 404 device error after sign-out** — hard page reload clears player state

---

### Phase 8 — Deployment

#### Backend Deployment (FastAPI)
- [x] CORS middleware configured
- [x] Environment variable structure defined
- [ ] Create Render/Railway account
- [ ] Deploy FastAPI backend to Render/Railway
- [ ] Configure production environment variables in deployment platform
- [ ] Set up production `SPOTIFY_REDIRECT_URI` in backend `.env`
- [ ] Verify backend health endpoint (`/`) returns 200 OK
- [ ] Test all API endpoints with production URL

#### Frontend Deployment (Next.js)
- [x] Build-ready codebase (no build errors)
- [x] Environment variable structure defined
- [ ] Deploy frontend to Vercel
- [ ] Configure production environment variables in Vercel dashboard
- [ ] Update `NEXT_PUBLIC_BACKEND_URL` to production backend URL
- [ ] Verify frontend builds successfully on Vercel
- [ ] Test all pages load correctly in production

#### Third-Party Service Configuration
- [ ] **Firebase** — Add production domain to authorized domains in Firebase Console
- [ ] **Firebase** — Update authorized redirect URIs for Google OAuth
- [ ] **Spotify** — Update redirect URI in Spotify Developer Dashboard to production URL
- [ ] **Spotify** — Add production frontend URL to allowed redirect URIs
- [ ] Verify SSL/HTTPS certificates are active on both frontend and backend

#### Pre-Deployment Testing
- [ ] Run `npm run build` in frontend and verify no errors
- [ ] Test all API endpoints with production URLs (Postman/Thunder Client)
- [ ] Verify environment variables are correctly loaded in both environments
- [ ] Test Google OAuth login flow with production URLs
- [ ] Test Spotify OAuth connection flow with production URLs
- [ ] Test face detection WebSocket connection with production backend
- [ ] Verify mood detection + playlist generation works end-to-end
- [ ] Security audit: ensure no sensitive data exposed in client-side code
- [ ] Security audit: check for hardcoded secrets or API keys
- [ ] Performance audit: Run Lighthouse score (target: 90+ Performance, 100 Accessibility)
- [ ] Test responsive design on mobile devices (Chrome DevTools + real devices)
- [ ] Cross-browser testing: Chrome, Firefox, Safari, Edge

#### Post-Deployment Verification
- [ ] User registration and login works in production
- [ ] Face detection captures webcam and detects mood
- [ ] Spotify connection flow completes successfully
- [ ] Music playback works for both free and premium users
- [ ] Liked tracks persist across sessions
- [ ] Custom playlists can be created and saved
- [ ] History page shows past mood detections
- [ ] Profile page loads user data correctly
- [ ] All navigation and routing works correctly
- [ ] Dark/light theme toggle persists across sessions

#### Future Enhancements (Post-Launch)
- [ ] **Mood Room** — Implement real-time listen-together feature via Firestore `onSnapshot`
- [ ] **Open Graph meta tags** — Add og:image, og:description, twitter:card for social sharing
- [ ] **Proper favicon** — Generate multi-size favicon.ico from logo.png
- [ ] **Performance optimization** — Implement lazy loading, code splitting, mood detection optimization
- [ ] **Analytics** — Add Google Analytics or Vercel Analytics for user tracking
- [ ] **Error monitoring** — Set up Sentry or similar for error tracking in production

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
### ✅ Phase 7 — UI Polish & Responsiveness — Complete
### 🔲 Phase 8 — Deployment — **Ready for Configuration**

---

## Getting Started

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

## Remaining Work & Known Issues

### 🟡 High Priority (UX Impact)
1. **Open Graph meta tags** — missing og:image, og:description for social media sharing
2. **Proper favicon generation** — currently uses logo.png, should be proper favicon.ico

### 🟢 Medium Priority (Feature Enhancement)
1. **Mood Room real-time feature** — Coming Soon page exists, full implementation pending
2. **Performance optimization** — Lighthouse audit, lazy loading, code splitting

### ⚪ Low Priority (Nice to Have)
1. **30-second preview reliability** — many Spotify tracks have `previewUrl: null`

### ✅ Recently Completed (9 August)
1. ~~Home page mobile responsiveness~~ — **FIXED**
2. ~~Production CORS configuration~~ — **FIXED**
3. ~~Build verification~~ — **PASSED**
4. ~~Soothing page animations~~ — **ADDED** (playlist & history)
5. ~~Refresh button with detailed toasts~~ — **RESTORED**
6. ~~Detection toasts~~ — **ADDED** (start, detected, refreshed)
7. ~~Spotify 404 device error after sign-out~~ — **FIXED** (hard reload on sign-out)

---

## Credits

| Name | Role | GitHub | LinkedIn |
|---|---|---|---|
| Soumyadip | Full-Stack Developer | [Soumyadip-03](https://github.com/Soumyadip-03) | [Profile](https://www.linkedin.com/in/soumyadip-khan-sarkar-8bbb6331b/) |
| Sulagna | UI / UX Designer | [Sulagna2005](https://github.com/Sulagna2005) | [Profile](https://www.linkedin.com/in/sulagna-bhattacharya-145993377/) |

---

## License

Proprietary — © 2026 Soumyadip. All Rights Reserved.