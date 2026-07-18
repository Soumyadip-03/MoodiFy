# Moodify — AI Mood-Based Music Player

Moodify detects your facial expression in real time, maps it to an emotional state, and instantly serves a Spotify-powered playlist that fits how you feel. Built with Next.js 14, Firebase, face-api.js, and the Spotify Web API.

---

## Core Workflow

```
Camera / Photo → face-api.js → Emotion → Mood Map → Spotify API → Music Player
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication (Google + Email/Password) |
| Database | Firestore (user profiles, mood history, liked tracks) |
| Face Detection | face-api.js (TinyFaceDetector + FaceExpressionNet) |
| Music | Spotify Web API (Client Credentials + optional OAuth) |
| Deployment | Vercel |

---

## Project Roadmap

### Phase 1 — Clean Slate & Project Setup
- [ ] Remove unused dependencies (`mongodb`, `mongoose`, `next-auth`, `jsonwebtoken`, `axios`)
- [ ] Remove dead API routes (`/api/music`, `/api/playlist`) and mock data files
- [ ] Unify Tailwind config — replace old light-theme color tokens with the black/orange design system
- [ ] Fix `Header.tsx` to match the dark theme used across all pages
- [ ] Set up folder structure:
  ```
  app/
    (auth)/         → login, signup pages
    (app)/          → protected: dashboard, history, profile
  components/
    auth/
    detection/
    player/
    ui/
  lib/
    firebase.ts
    firestore.ts
  hooks/
  types/
  utils/
  ```
- [ ] Configure path aliases in `tsconfig.json`

---

### Phase 2 — Firebase Authentication
- [ ] Create Firebase project, enable Google Sign-In and Email/Password
- [ ] Add Firebase config to `.env.local`
- [ ] `lib/firebase.ts` — initialize Firebase app, Auth, Firestore
- [ ] `AuthContext` — React context that exposes `user`, `loading`, `signIn`, `signOut`
- [ ] Login page (`/login`) — Google OAuth button + email/password form
- [ ] Signup page (`/signup`) — email/password registration + display name
- [ ] Route protection — middleware redirects unauthenticated users away from `/dashboard`, `/history`, `/profile`
- [ ] Persist auth state across page refreshes
- [ ] User profile document created in Firestore on first sign-in

---

### Phase 3 — Face Detection (Rebuilt Clean)
- [ ] Single `useFaceDetection` hook that encapsulates all face-api.js logic
- [ ] Webcam detection mode — continuous frame analysis, debounced mood updates
- [ ] Image upload mode — drag & drop or file picker, one-shot analysis
- [ ] Confidence threshold (≥ 50%) before triggering a mood update
- [ ] Graceful error states: camera denied, no face found, models failed to load
- [ ] Emotion → Mood mapping:

  | face-api Emotion | App Mood |
  |---|---|
  | happy | happy |
  | surprised | upbeat |
  | neutral | chill |
  | sad | melancholy |
  | fearful | relaxing |
  | disgusted | energetic |
  | angry | intense |

---

### Phase 4 — Spotify Integration (Rebuilt Clean)
- [ ] `/api/spotify/token` — server-side Client Credentials token fetch, cached with expiry
- [ ] Token stored server-side (not passed in query strings)
- [ ] `/api/spotify/recommendations?mood=` — returns 10 tracks with `id`, `title`, `artist`, `albumArt`, `preview_url`, `external_url`
- [ ] Mood → Spotify audio features mapping (valence, energy, genres, seed tracks)
- [ ] Handle `preview_url: null` gracefully — show "Open in Spotify" CTA
- [ ] **Optional (Phase 6):** Spotify OAuth flow so users can connect their account for full playback and personalized recommendations based on their listening history

---

### Phase 5 — Music Player (Rebuilt Clean)
- [ ] `MusicPlayer` component — album art, track info, seek bar, volume, prev/next
- [ ] Auto-play first track when mood is detected
- [ ] Track list panel — scrollable list of all recommendations
- [ ] "Open in Spotify" button on every track
- [ ] Smooth transition animation when mood changes and playlist refreshes
- [ ] **Mood override** — manual mood selector so users can pick a mood themselves if detection is off

---

### Phase 6 — User Features (Firestore)
- [ ] **Mood History** — every detection session saved to Firestore: `{ userId, mood, confidence, timestamp }`
- [ ] `/history` page — timeline of past moods with date grouping
- [ ] **Weekly Mood Chart** — simple bar/line chart showing mood frequency over the last 7 days
- [ ] **Liked Tracks** — heart button on each track, saved to Firestore: `{ userId, trackId, title, artist, albumArt, external_url, likedAt }`
- [ ] `/profile` page — display name, avatar, liked tracks list, mood stats summary
- [ ] Delete mood history entries

---

### Phase 7 — UI Polish & Responsiveness
- [ ] Consistent dark black/orange design system across all pages
- [ ] Mobile-first responsive layout for dashboard (stacked on mobile, side-by-side on desktop)
- [ ] Loading skeletons for player and detection panels
- [ ] Toast notifications for auth events (signed in, signed out, error)
- [ ] Smooth page transitions
- [ ] Favicon and Open Graph meta tags

---

### Phase 8 — Deployment
- [ ] Environment variables configured in Vercel dashboard
- [ ] Firebase authorized domains updated to include production URL
- [ ] Spotify redirect URI updated for production
- [ ] `next.config.js` image domains updated if needed
- [ ] Final build check — `npm run build` passes with no errors

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Spotify
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Firebase (client-side — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Getting Started (after setup)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### face-api.js Models

Download model weights from [justadudewhohacks/face-api.js](https://github.com/justadudewhohacks/face-api.js/tree/master/weights) and place them in `/public/models/`:

- `tiny_face_detector_model-shard1`
- `tiny_face_detector_model-weights_manifest.json`
- `face_expression_model-shard1`
- `face_expression_model-weights_manifest.json`

---

## Folder Structure (Target)

```
MoodiFy/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── history/page.tsx
│   │   └── profile/page.tsx
│   ├── api/
│   │   └── spotify/
│   │       ├── token/route.ts
│   │       └── recommendations/route.ts
│   ├── layout.tsx
│   ├── page.tsx          ← landing page
│   └── globals.css
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── GoogleSignInButton.tsx
│   ├── detection/
│   │   ├── MoodDetector.tsx       ← webcam
│   │   ├── ImageMoodDetector.tsx  ← photo upload
│   │   └── DetectionMethodChoice.tsx
│   ├── player/
│   │   ├── MusicPlayer.tsx
│   │   └── TrackList.tsx
│   └── ui/
│       ├── Header.tsx
│       ├── Toast.tsx
│       └── MoodBadge.tsx
├── context/
│   └── AuthContext.tsx
├── hooks/
│   ├── useFaceDetection.ts
│   └── useSpotify.ts
├── lib/
│   ├── firebase.ts
│   └── firestore.ts
├── types/
│   └── index.ts
├── utils/
│   ├── moodUtils.ts
│   └── spotifyApi.ts
├── public/
│   └── models/
├── middleware.ts           ← route protection
├── .env.local
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## License

MIT
