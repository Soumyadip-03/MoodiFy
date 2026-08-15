# MoodiFy — TODO List

## 🔜 Pending Tasks

### 🟡 Nice to Have (Post-MVP)

#### 1. Open Graph Meta Tags
**Status:** Not implemented  
**Priority:** Medium  
**Description:** Add social media preview cards for better sharing

**Tasks:**
- [ ] Add `og:title`, `og:description`, `og:image` meta tags
- [ ] Create social media preview image (1200x630px)
- [ ] Add Twitter Card meta tags
- [ ] Test preview on Facebook, Twitter, LinkedIn

**Files to modify:**
- `frontend/app/layout.tsx` — Add meta tags
- `frontend/public/` — Add og-image.png

---

#### 2. Proper Favicon
**Status:** Using logo.png as fallback  
**Priority:** Low  
**Description:** Generate proper favicon.ico with multiple sizes

**Tasks:**
- [ ] Generate favicon.ico (16x16, 32x32, 48x48)
- [ ] Create apple-touch-icon.png (180x180)
- [ ] Add favicon-16x16.png and favicon-32x32.png
- [ ] Update manifest.json with icon references

**Files to create:**
- `frontend/public/favicon.ico`
- `frontend/public/apple-touch-icon.png`
- `frontend/public/favicon-16x16.png`
- `frontend/public/favicon-32x32.png`

**Files to modify:**
- `frontend/app/layout.tsx` — Update favicon links

---

#### 3. Mood Room (Real-time Collaborative Feature)
**Status:** Coming Soon page exists  
**Priority:** Low (Future feature)  
**Description:** Real-time collaborative listening — friends can join a room and listen to synced playlists

**Current State:**
- `/mood-room` page shows "Coming Soon" message

**Tasks:**
- [ ] Design real-time room architecture (WebSocket/Socket.io)
- [ ] Implement room creation & join logic
- [ ] Sync playback state across all users in room
- [ ] Add room chat feature (optional)
- [ ] Handle room host controls (play/pause/skip)
- [ ] Add invite link generation

**Files to create:**
- `backend/routes/room.py` — Room management endpoints
- `backend/services/room_service.py` — Room logic
- `frontend/app/(app)/mood-room/page.tsx` — Replace coming soon page
- `frontend/context/RoomContext.tsx` — Room state management

**Estimated Effort:** 2-3 weeks

---

#### 4. Performance Optimizations
**Status:** Not implemented  
**Priority:** Medium  
**Description:** Improve load times and runtime performance

**Tasks:**
- [ ] Run Lighthouse audit and fix issues
- [ ] Implement code splitting for large components
- [ ] Lazy load images with Next.js Image component
- [ ] Add loading skeletons for slow content
- [ ] Optimize bundle size (analyze with `npm run build`)
- [ ] Enable Next.js ISR (Incremental Static Regeneration) where possible
- [ ] Add service worker for offline support (optional)

**Files to modify:**
- `frontend/next.config.js` — Enable optimizations
- Various component files — Add lazy loading

**Target Metrics:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1

---

#### 5. Spotify Preview Fallback
**Status:** Known issue  
**Priority:** Low  
**Description:** Many Spotify tracks have `previewUrl: null`, causing playback issues

**Current Behavior:**
- Tracks without preview URLs can't be played in the 30-second preview player

**Possible Solutions:**
- [ ] Show "Preview not available" message for tracks without preview
- [ ] Auto-skip to next track if preview is null
- [ ] Use Spotify Web Playback SDK for full-track playback (requires Premium)
- [ ] Add visual indicator (icon) for tracks with/without preview

**Files to modify:**
- `frontend/components/player/MusicPlayer.tsx`
- `frontend/components/player/TrackList.tsx`

---

### 🔵 Deployment Checklist

#### Frontend (Vercel)
- [ ] Create Vercel account and link GitHub repo
- [ ] Set up production environment variables in Vercel dashboard
- [ ] Configure custom domain (optional)
- [ ] Test production build locally: `npm run build && npm start`
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Verify all features work in production

**Environment Variables to set:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_BACKEND_URL` (production backend URL)

---

#### Backend (Render/Railway)
- [ ] Create Render/Railway account
- [ ] Set up Python 3.11 environment
- [ ] Configure production environment variables
- [ ] Set up persistent storage for models folder (if needed)
- [ ] Deploy backend service
- [ ] Run `setup_enhanced_detection.py` on production server
- [ ] Verify WebSocket connections work

**Environment Variables to set:**
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI` (production redirect URI)
- `FIREBASE_SERVICE_ACCOUNT_KEY` (as JSON string or file path)
- `FRONTEND_URL` (production frontend URL)

---

#### Spotify Configuration
- [ ] Add production redirect URI to Spotify app settings
  - Example: `https://your-backend.onrender.com/api/spotify/callback`
- [ ] Update quota settings if needed (rate limits)
- [ ] Test OAuth flow from production frontend

---

#### Firebase Configuration
- [ ] Add production domains to authorized domains in Firebase console
  - Authentication → Settings → Authorized domains
- [ ] Update CORS settings if needed
- [ ] Set up Firestore indexes for production (if using complex queries)
- [ ] Configure Firebase security rules for production

---

#### Post-Deployment
- [ ] Test all features on production URLs
- [ ] Monitor error logs (Vercel logs, Render logs)
- [ ] Set up monitoring/alerting (optional: Sentry, LogRocket)
- [ ] Add analytics (optional: Google Analytics, Vercel Analytics)
- [ ] Update README with production URLs
- [ ] Announce launch! 🎉

---

## 🐛 Known Issues

### Minor Issues (Non-blocking)

1. **MediaPipe Warnings**
   - Console shows MediaPipe inference feedback warnings
   - Does not affect functionality
   - Can be ignored

2. **Landmark Projection Warning**
   - `Using NORM_RECT without IMAGE_DIMENSIONS` warning in backend logs
   - MediaPipe internal warning, does not affect detection
   - Can be ignored

3. **Hot Reload Flicker**
   - Frontend hot reload sometimes causes brief UI flicker
   - Development-only issue, not present in production build

---

## 📝 Documentation Tasks

- [ ] Add API documentation (Swagger is auto-generated at `/docs`)
- [ ] Create user guide with screenshots
- [ ] Add architecture diagram
- [ ] Document environment variable meanings in `.env.example` files
- [ ] Add changelog/version history

---

## 🎯 Future Feature Ideas

### Phase 9 — Social Features
- User profiles (public/private)
- Follow other users
- Share playlists
- Mood activity feed
- Friend recommendations

### Phase 10 — Advanced Analytics
- Weekly mood reports
- Listening statistics dashboard
- Mood trends over time
- Personalized insights

### Phase 11 — Mobile App
- React Native or Flutter mobile app
- Native camera integration
- Push notifications for mood reminders
- Offline playback support

### Phase 12 — Enhanced AI
- Multi-person detection (group moods)
- Voice tone analysis for mood detection
- Background music mood matching
- Custom model training with user feedback

---

## ✅ Completed (For Reference)

- ✅ All 7 core development phases
- ✅ Enhanced mood detection (82-88% accuracy)
- ✅ Heart gesture recognition
- ✅ Adaptive temporal buffering
- ✅ Spotify OAuth integration
- ✅ User authentication & profiles
- ✅ Dark/light theme
- ✅ Mobile responsive design
- ✅ Mood history tracking
- ✅ Custom playlists
- ✅ Multi-language support (English, Hindi, Bengali, Korean)

---

**Last Updated:** August 2026  
**Version:** 1.0.0 (MVP Complete)
