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
- [ ] Scaffold Next.js 14 frontend (`frontend/`) with TypeScript + Tailwind + App Router
- [ ] Scaffold FastAPI backend (`backend/`) with Python 3.11 virtual environment
- [ ] Set up frontend folder structure:
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
- [ ] Set up backend folder structure:
  ```
  backend/
  ├── main.py
  ├── routes/spotify.py, mood.py, auth.py
  ├── services/face_detection.py, spotify_service.py
  ├── requirements.txt
  └── .env
  ```
- [ ] Configure path aliases in `tsconfig.json`
- [ ] Set up Tailwind black/orange design system
- [ ] Install all frontend and backend dependencies

---

### Phase 2 — Firebase Authentication
- [ ] Enable Google Sign-In and Email/Password in Firebase console
- [ ] Add Firebase config to `frontend/.env.local`
- [ ] `lib/firebase.ts` — initialize Firebase app, Auth, Firestore
- [ ] `AuthContext` — React context exposing `user`, `loading`, `signIn`, `signOut`
- [ ] Login page (`/login`) — Google OAuth button + email/password form
- [ ] Signup page (`/signup`) — email/password registration + display name
- [ ] Route protection — middleware redirects unauthenticated users from `/dashboard`, `/history`, `/profile`
- [ ] Persist auth state across page refreshes
- [ ] FastAPI — verify Firebase ID tokens on protected routes
- [ ] User profile document created in Firestore on first sign-in

---

### Phase 3 — Realtime Face Detection (WebSocket)
- [ ] FastAPI WebSocket endpoint `/ws/detect` — receives webcam frames, returns mood
- [ ] `deepface` / `fer` + OpenCV for emotion detection on each frame
- [ ] Confidence threshold (≥ 50%) before triggering mood update
- [ ] Debounce mood updates (avoid rapid switching)
- [ ] Graceful error states: camera denied, no face found, model load failure
- [ ] Frontend `useFaceDetection` hook — manages webcam stream + WebSocket connection
- [ ] Emotion → Mood mapping:

  | Emotion | App Mood |
  |---|---|
  | happy | happy |
  | surprise | upbeat |
  | neutral | chill |
  | sad | melancholy |
  | fear | relaxing |
  | disgust | energetic |
  | angry | intense |

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

## Getting Started

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Open [http://localhost:8000/docs](http://localhost:8000/docs)

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
