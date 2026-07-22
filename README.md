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
- [ ] FastAPI `/api/spotify/login` — redirect user to Spotify authorization page
- [ ] FastAPI `/api/spotify/callback` — exchange code for `access_token` + `refresh_token`
- [ ] Store tokens securely in Firestore against `userId`
- [ ] FastAPI `/api/spotify/recommendations?mood=` — returns 10 personalized tracks
- [ ] Mood → Spotify audio features mapping (valence, energy, genres, seed tracks)
- [ ] Token refresh logic — auto-refresh expired access tokens
- [ ] Handle `preview_url: null` — show "Open in Spotify" CTA
- [ ] Frontend `useSpotify` hook — manages Spotify connection state

---

### Phase 5 — Music Player
- [ ] `MusicPlayer` component — album art, track info, seek bar, volume, prev/next
- [ ] Auto-play first track when mood is detected
- [ ] Track list panel — scrollable list of all recommendations
- [ ] "Open in Spotify" button on every track
- [ ] Smooth transition animation when mood changes and playlist refreshes
- [ ] Mood override — manual mood selector if detection is off

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

### 🔲 Phase 4 — Spotify OAuth Integration
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

MIT
