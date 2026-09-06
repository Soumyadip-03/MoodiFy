# MoodiFy - Complete Testing Checklist

## 🔐 Authentication Tests

### Sign Up
- [✅] Sign up with email/password
- [✅] Sign up with Google OAuth
- [✅] Verify user profile created in Firestore
- [✅] Check if empty mood playlists are created automatically
- [✅] Verify redirect to home page after signup

### Sign In
- [✅] Sign in with email/password
- [✅] Sign in with Google OAuth
- [✅] Verify Spotify connection status shown
- [✅] Check if playlists load correctly
- [✅] Test "Remember me" functionality

### Sign Out
- [✅] Sign out successfully
- [✅] Verify redirect to landing page
- [✅] Check that session is cleared
- [✅] Ensure Spotify player stops

---

## 🎵 Spotify Integration Tests

### Spotify Connection
- [✅] Click "Connect Spotify" button
- [✅] Authorize Spotify successfully
- [✅] Verify token saved in Firestore
- [✅] Check Spotify premium status detection
- [ ] Test token refresh (wait 50+ minutes or manually trigger)

### Spotify Player
- [✅] Play a song from Top Tracks
- [⚠️] Pause/Resume playback
- [✅] Skip to next track
- [⚠️] Skip to previous track
- [✅] Adjust volume slider
- [✅] Seek within track (progress bar)
- [✅] Test shuffle mode
- [✅] Test repeat modes (off/track/context)

### Player UI
- [✅] Verify album art displays correctly
- [✅] Check track title and artist name
- [✅] Verify playback time updates
- [✅] Test progress bar interaction
- [✅] Check volume icon changes with mute
- [✅] Verify player controls are responsive

---

## 😊 Mood Detection Tests

### Camera & Detection
- [⚠️] Navigate to Mood Room page
- [✅] Grant camera permissions
- [✅] Verify camera feed displays
- [✅] Test face detection (face appears with green box)
- [✅] Test gesture detection (heart sign)
- [✅] Verify mood detected and displayed with emoji
- [✅] Check confidence score shown

### Mood Results
- [✅] Verify playlist generated based on detected mood
- [✅] Check that 40 songs are recommended
- [✅] Test "Regenerate" button to get new songs
- [✅] Verify tracks saved to mood playlist in Firestore
- [✅] Test switching between different moods

### Supported Moods
- [✅] Happy (smile widely)
- [✅] Upbeat (energetic expression)
- [✅] Chill (relaxed expression)
- [✅] Melancholy (sad expression)
- [✅] Relaxing (calm expression)
- [✅] Romantic (soft smile)
- [✅] Intense (strong expression)

---

## 📋 Playlist Tests

### Liked Songs
- [✅] Navigate to Playlist page
- [✅] Click on "Liked Songs"
- [✅] Verify all liked tracks appear
- [✅] Check track count is accurate
- [✅] Test playing songs from Liked Songs
- [✅] Verify album art, artist, and duration display

### Mood Playlists
- [✅] Open "Moods Playlist" folder
- [✅] Verify 7 mood categories appear (happy, upbeat, chill, etc.)
- [✅] Click on each mood playlist
- [✅] Check tracks appear if mood was detected before
- [✅] Test playing songs from mood playlists
- [✅] Verify playlist shows correct track count

### Custom Playlists
- [✅] Click "+ Create" button
- [✅] Name a new playlist
- [✅] Verify playlist appears in sidebar
- [✅] Add tracks to custom playlist (right-click context menu)
- [✅] Remove tracks from playlist
- [✅] Delete custom playlist
- [✅] Test sharing playlist (WhatsApp integration)

### Playlist Operations
- [✅] Play/Pause playlist
- [✅] Shuffle playlist
- [✅] Double-click track to play
- [⚠️] Add track to another playlist
- [✅] Remove track from playlist
- [✅] Like/Unlike track from playlist view

---

## 💿 Album Tests

### Saved Albums
- [✅] Click "Albums" tab in Playlist page
- [✅] Verify saved albums appear
- [✅] Click on an album card
- [✅] Album modal opens with track list
- [✅] Play tracks from album
- [✅] Close modal

### Album Operations
- [✅] Save album to library
- [✅] Verify album appears in "Albums" tab
- [✅] Remove album from library
- [✅] Test album art loading

---

## ❤️ Like/Unlike Tests

### Liking Tracks
- [✅] Play a song on Home page
- [✅] Click heart icon to like
- [✅] Verify heart turns red
- [✅] Check track appears in "Liked Songs"
- [✅] Verify liked count increases in Firestore

### Unliking Tracks
- [✅] Click heart icon on liked track
- [✅] Verify heart turns gray
- [✅] Check track removed from "Liked Songs"
- [✅] Verify liked count decreases

### Like Persistence
- [✅] Like several tracks
- [✅] Sign out and sign back in
- [✅] Verify all liked tracks still appear
- [✅] Check heart icons are red for liked tracks

---

## 📊 History Tests

### Mood History View
- [✅] Navigate to History page
- [✅] Select today's date
- [✅] Verify detected moods appear as timeline
- [✅] Check mood emoji and confidence displayed
- [✅] Verify time stamps are accurate

### History Stats
- [✅] Check mood distribution chart
- [✅] Verify track play counts
- [✅] Test date picker (select different dates)
- [✅] Verify "Last 7 Days" view works
- [✅] Check that history persists across sessions

### History Data
- [✅] Play recommended tracks
- [✅] Navigate to History page
- [✅] Verify mood entry appears with tracks
- [✅] Check played tracks are recorded

---

## 👤 Profile Tests

### Profile Display
- [✅] Navigate to Profile page
- [✅] Verify display name shown
- [✅] Check email displayed
- [✅] Verify profile photo (Google or initial)
- [✅] Check Spotify connection status

### Profile Stats
- [✅] Check total liked tracks count
- [✅] Verify mood stats (most frequent mood)
- [✅] Verify all stats are accurate

### Settings
- [✅] Toggle "Track Trending" setting
- [✅] Toggle "Track Playlist" setting
- [✅] Verify settings saved in Firestore
- [✅] Test settings persistence after sign out/in

### Account Management
- [✅] Test "Disconnect Spotify" button
- [✅] Reconnect Spotify
- [✅] Test "Delete Account" button
- [✅] Verify account deletion warning
- [✅] Cancel deletion
- [⚠️] (Optional) Actually delete test account

---

## 🏠 Home Page Tests

### Top Tracks Display
- [⚠️] Verify Top Tracks load on home page
- [✅] Check that 50 tracks appear
- [✅] Verify album art, title, artist display
- [✅] Test playing tracks from home
- [✅] Verify track duration shown

### Navigation
- [✅] Test navigation to Mood Room
- [✅] Navigate to Playlist page
- [✅] Navigate to History page
- [✅] Navigate to Profile page
- [✅] Test back button in browser

---

## 🎨 UI/UX Tests

### Theme Toggle
- [✅] Click theme toggle button (sun/moon icon)
- [✅] Verify theme switches (dark ↔ light)
- [✅] Check colors update throughout app
- [✅] Verify theme persists after refresh
- [✅] Test theme in all pages

### Responsive Design
- [✅] Test on desktop (1920x1080)
- [✅] Test on tablet (768px width)
- [✅] Test on mobile (375px width)
- [✅] Verify layout adapts properly
- [✅] Check touch interactions on mobile

### Animations
- [✅] Verify smooth page transitions
- [✅] Check hover effects on buttons
- [✅] Test playlist card animations
- [✅] Verify mood icon animations
- [✅] Check player controls animations

### Accessibility
- [ ] Test keyboard navigation (Tab key)
- [ ] Verify focus indicators visible
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Check color contrast ratios
- [ ] Verify all images have alt text

---

## 🔊 Audio Tests

### Playback Quality
- [ ] Test audio plays without distortion
- [ ] Verify volume control works smoothly
- [ ] Check playback doesn't stutter
- [ ] Test switching tracks quickly
- [ ] Verify audio stops on sign out

### Preview URLs
- [ ] Test tracks with preview URLs (30s clips)
- [ ] Test tracks without preview URLs (full playback)
- [ ] Verify player handles missing previews gracefully

---

## 🌐 Network Tests

### Online
- [ ] Test all features with good internet
- [ ] Verify fast loading times
- [ ] Check real-time updates (Firestore listeners)

### Slow Connection
- [ ] Throttle network to "Slow 3G" in DevTools
- [ ] Test page loads
- [ ] Verify loading skeletons appear
- [ ] Check timeout handling

### Offline
- [ ] Disable internet connection
- [ ] Verify error messages appear
- [ ] Test reconnection behavior
- [ ] Check data persistence when offline

---

## 🐛 Error Handling Tests

### API Errors
- [ ] Test expired Spotify token
- [ ] Verify token refresh works automatically
- [ ] Test rate limiting (make many requests quickly)
- [ ] Check error toasts appear

### User Errors
- [ ] Try signing up with existing email
- [ ] Try wrong password on sign in
- [ ] Test creating playlist with empty name
- [ ] Verify validation messages appear

### Camera Errors
- [ ] Deny camera permissions
- [ ] Verify error message shown
- [ ] Test with camera already in use
- [ ] Check handling of unsupported browser

---

## 🔒 Security Tests

### Authentication
- [ ] Try accessing protected routes without login
- [ ] Verify redirect to login page
- [ ] Test token expiration handling
- [ ] Check that tokens are stored securely

### Firestore Rules
- [ ] Try reading another user's playlists (in console)
- [ ] Verify permission denied
- [ ] Test writing to another user's data
- [ ] Check admin service account can write

---

## 📱 Cross-Browser Tests

### Chrome
- [ ] Test all features in Chrome
- [ ] Verify Spotify player works

### Firefox
- [ ] Test all features in Firefox
- [ ] Check camera permissions work

### Edge
- [ ] Test all features in Edge
- [ ] Verify layout is correct

### Safari (Mac/iOS)
- [ ] Test on Safari browser
- [ ] Check MediaPipe face detection works
- [ ] Test audio playback

---

## ⚡ Performance Tests

### Load Times
- [ ] Measure initial page load (<3 seconds)
- [ ] Check Time to Interactive (<5 seconds)
- [ ] Verify images lazy load
- [ ] Test bundle size (<500KB initial)

### Memory Usage
- [ ] Open DevTools → Performance Monitor
- [ ] Play music for 10 minutes
- [ ] Check for memory leaks
- [ ] Verify smooth 60fps animations

---

## 🚀 Deployment Tests (Azure)

### Backend (Azure App Service)
- [ ] Verify backend is running (check logs)
- [ ] Test all API endpoints
- [ ] Check WebSocket connection for mood detection
- [ ] Verify environment variables loaded
- [ ] Test mood detection model loads correctly

### Frontend (Vercel/Azure)
- [ ] Verify frontend deploys successfully
- [ ] Check all pages accessible
- [ ] Test production build performance
- [ ] Verify environment variables set

### Integration
- [ ] Test frontend connects to backend API
- [ ] Verify CORS headers configured
- [ ] Check WebSocket connections work
- [ ] Test end-to-end flow in production

---

## 📝 Additional Edge Cases

### Empty States
- [ ] New user with no liked tracks
- [ ] Mood playlist with no songs
- [ ] History with no mood detections
- [ ] Profile with no Spotify connection

### Long Content
- [ ] Playlist with 100+ songs
- [ ] Track title with very long name
- [ ] Artist name with special characters
- [ ] Album with many tracks

### Special Cases
- [ ] Spotify Free vs Premium users
- [ ] Multiple tabs open simultaneously
- [ ] Browser refresh during playback
- [ ] Sign out while music playing
- [ ] Camera in use by another app

---

## ✅ Completion Summary

**Total Tests**: ~150+

**Pass**: ___ / 150  
**Fail**: ___ / 150  
**Skip**: ___ / 150  

---

## 🐛 Bug Report Template

When you find issues, report them like this:

**Bug Title**: [Brief description]

**Steps to Reproduce**:
1. Go to [page]
2. Click [button]
3. Observe [issue]

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happens]

**Console Errors**: [Copy any errors]

**Screenshots**: [If applicable]

---

## 📅 Testing Schedule

**Day 1**: Authentication + Spotify Integration (20 tests)  
**Day 2**: Mood Detection + Playlist Features (30 tests)  
**Day 3**: UI/UX + Performance (25 tests)  
**Day 4**: Edge Cases + Deployment (25 tests)  
**Day 5**: Cross-browser + Security (20 tests)  
**Day 6**: Bug fixes + Retesting (30 tests)

---

**Good Luck Testing! 🚀**
