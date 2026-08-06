# MusicPlayer — Rewrite Spec

---

## What Changed in the Previous Implementation

- `MusicPlayer.tsx` — wiped to a blank placeholder (`return null`)
- `useSpotifyPlayer.ts` — wiped to a blank placeholder (`return {}`)
- `layout.tsx` — all MusicPlayer, useSpotify, useArtistAlbum, togglePlayRef, setActiveTrack, setIsPlaying, notifyTrackPlayed references removed; replaced with a static placeholder bar
- **Bug fixes applied before wipe:**
  - `onTrackChange` in layout changed from `setQueue(queue, track)` → `setActiveTrack(track)` — fixed always-2nd-song bug
  - `hasAutoAdvancedRef` guard added to SDK auto-advance effect — fixed multi-skip on track end
  - `sdk` added as single dep in `handleNext` useCallback instead of individual `sdk.isReady`, `sdk.playTrack`

---

## What Must Stay Untouched

- `PlayerContext.tsx` — single source of truth, fully intact
- `TrackList.tsx` — Up Next panel, fully intact
- `useSpotify.ts` — Spotify connection/recommendations hook, fully intact
- All queue/track selection logic in `home/page.tsx`, `playlist/page.tsx` — fully intact

---

## How the New MusicPlayer Should Work

### Core Principle
One single persistent player bar — mounted once in `(app)/layout.tsx` — visible and functional across **all** app pages (home, history, playlist, profile, mood-room). Exactly like Spotify / JioSaavn — you navigate pages freely, music never stops.

---

### Player Bar Layout (80px height, full width)

```
[ Album Art | Title + Artist ]  [ Prev | Play/Pause | Next | Seek Bar | Time ]  [ Volume | Go to Album ]
     LEFT (220px)                          CENTRE (flex-1)                              RIGHT (220px)
```

- Always rendered at the bottom of the screen inside `layout.tsx`
- When no track is active → shows static placeholder ("Play a song to start listening")
- When track is active → full player UI

---

### State — Comes from PlayerContext

The player reads everything from `PlayerContext` — no local queue state:

| Context Value | Used For |
|---|---|
| `activeTrack` | Current track to display and play |
| `currentQueue` | Full list for prev/next navigation |
| `isPlaying` | Play/pause button state |
| `togglePlayRef` | Ref written by MusicPlayer so any page can trigger play/pause |
| `setActiveTrack(track)` | Called on skip next / skip prev |
| `setIsPlaying(bool)` | Called when playback state changes |
| `notifyTrackPlayed(track)` | Called once per track start — logs to Firestore |
| `likedTrackIds` | Heart icon state on active track |
| `toggleLike(track)` | Like/unlike from player bar |

---

### Playback — Two Paths

#### Free User
- Uses HTML `<audio>` element with `track.previewUrl`
- If `previewUrl` is null → auto-skip to next after 800ms (Spotify deprecated previews)
- `onEnded` → advance to next track
- Max 30 seconds per track

#### Premium User
- Uses Spotify Web Playback SDK via `useSpotifyPlayer` hook
- Full song streaming
- SDK `player_state_changed` event drives `isPlaying`, `position`, `duration`
- Position polled every 1s while playing for seek bar accuracy
- `hasAutoAdvancedRef` guard — fires `handleNext` exactly once per natural track end, never on manual pause

---

### Controls

| Control | Behaviour |
|---|---|
| Play/Pause | Toggle playback — writes handler into `togglePlayRef` so home page can call it |
| Skip Next | `setActiveTrack(tracks[idx + 1])` — queue unchanged |
| Skip Prev | `setActiveTrack(tracks[idx - 1])` — queue unchanged |
| Seek bar | Scrub position — `audio.currentTime` (free) or `sdk.seek(ms)` (premium) |
| Volume slider | `audio.volume` (free) or `sdk.setVolume` (premium) |
| Mute icon | Toggle between 0 and last non-zero volume |
| Go to Album | `openAlbum(track.albumId)` via `useArtistAlbum` |
| Shuffle | Visual only for now — Phase 7 |
| Repeat | Visual only for now — Phase 7 |

---

### Track Change Flow

```
Any page calls setQueue(tracks, track) or setActiveTrack(track)
  → PlayerContext updates activeTrack
  → layout.tsx passes new track prop to MusicPlayer
  → useEffect([track.id]) fires in MusicPlayer
  → resets audio state, starts playback
  → notifyTrackPlayed(track) called once
```

---

### Auto-advance Flow

```
Track ends (onEnded / SDK position >= duration - 1s)
  → handleNext() called
  → setActiveTrack(tracks[nextIdx])  ← only active track changes, queue stays
  → useEffect([track.id]) fires
  → next track plays
```

---

### Files to Write / Rewrite

| File | Action |
|---|---|
| `components/player/MusicPlayer.tsx` | Full rewrite — self-contained player bar |
| `hooks/useSpotifyPlayer.ts` | Full rewrite — SDK wrapper |
| `app/(app)/layout.tsx` | Mount MusicPlayer, wire PlayerContext |

---

### Key Rules for Rewrite

1. **MusicPlayer reads from PlayerContext directly** — no prop drilling of queue/track from layout
2. **`onTrackChange` calls `setActiveTrack` only** — never `setQueue` (queue is already set by the page)
3. **`togglePlayRef.current = handleTogglePlay`** written on every render — so home page can call it
4. **`notifyTrackPlayed`** called exactly once per track via `notifiedTrackRef` guard
5. **`hasAutoAdvancedRef`** reset on every `track.id` change — prevents multi-skip on SDK track end
6. **`<audio>` element only rendered when `!isPremium && track.previewUrl`** — conditional render
7. **Player bar always visible** — even when no track active (shows placeholder text)
