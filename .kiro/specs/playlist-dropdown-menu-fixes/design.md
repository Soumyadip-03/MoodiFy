# Design Document: Playlist Dropdown Menu Fixes

## Introduction

This document describes the architectural design for implementing two fixes to the ContextMenu component in the MoodiFy application. The fixes address usability issues by expanding the menu width to prevent text truncation and correcting the remove button visibility logic to show the button for all playlists except "Liked Songs".

## Architecture Overview

### Component Structure

The ContextMenu component is a React client component located at `frontend/components/ui/ContextMenu.tsx`. It renders a dropdown menu with the following sections:

1. **Like Section**: Toggle track like status
2. **Go to Album Section**: Navigate to track's album
3. **Add to Playlist Section**: Expandable submenu for adding track to playlists
4. **Remove from Playlist Section**: Remove track from current playlist (conditional)
5. **Share Section**: Expandable submenu for sharing track

### Design Changes

#### Change 1: Menu Width Expansion

**Current Implementation:**
```typescript
style={{ width: 200 }}
```

**New Implementation:**
```typescript
style={{ width: 240 }}
```

**Rationale**: The 20% width increase (from 200px to 240px) provides additional horizontal space for longer playlist names and menu options without significantly impacting the visual layout or user experience.

#### Change 2: Remove Button Visibility Logic

**Current Implementation:**
```typescript
{currentPlaylistId && 
 !currentPlaylistId.startsWith("mood-") && 
 currentPlaylistId !== "liked" && 
 onRemoveFromPlaylist && (
  // Render remove button
)}
```

**Problem**: The current logic excludes mood playlists from showing the remove button by checking `!currentPlaylistId.startsWith("mood-")`.

**New Implementation:**
```typescript
{currentPlaylistId && 
 currentPlaylistId !== "liked" && 
 onRemoveFromPlaylist && (
  // Render remove button
)}
```

**Rationale**: The remove button should be hidden only for the special "Liked Songs" playlist (ID: "liked"), where removing tracks is handled through the like/unlike mechanism. For all other playlists (including mood playlists and custom playlists), users should be able to remove tracks directly.

## Component Interface

### Props

The ContextMenu component interface remains unchanged:

```typescript
interface ContextMenuProps {
  track: SpotifyTrack;                    // Track to display menu for
  playlists: Playlist[];                  // Available playlists for adding
  likedTrackIds?: Set<string>;            // Set of liked track IDs
  currentPlaylistId?: string;              // ID of current playlist context
  onClose: () => void;                    // Close menu callback
  onLike: (track: SpotifyTrack) => void;  // Like/unlike callback
  onAddToPlaylist: (track: SpotifyTrack, playlistId: string) => void;
  onCreatePlaylist: (track: SpotifyTrack) => void;
  onGoToAlbum: (albumId: string) => void;
  onShare: (track: SpotifyTrack) => void;
  onRemoveFromPlaylist?: (track: SpotifyTrack) => void;  // Optional remove callback
}
```

### Key Identifiers

- **Liked Songs Playlist ID**: `"liked"` - Special system playlist for liked tracks
- **Mood Playlist ID Pattern**: Starts with `"mood-"` - System-generated mood playlists
- **Custom Playlist IDs**: Any ID that is not "liked" and doesn't follow special patterns

## Data Models

### Playlist Types

1. **Liked Songs Playlist**
   - ID: `"liked"`
   - Special system playlist
   - Remove button: Hidden (tracks removed via unlike mechanism)

2. **Mood Playlists**
   - ID Pattern: `"mood-*"`
   - System-generated based on user mood
   - Remove button: Visible (users can curate mood playlists)

3. **Custom Playlists**
   - ID: User-generated string
   - User-created playlists
   - Remove button: Visible

## Visual Design

### Menu Dimensions

- **Width**: 240px (increased from 200px)
- **Height**: Auto-adjusted based on content
- **Border Radius**: 12px (unchanged)
- **Padding**: 4px (unchanged)

### Remove Button Styling

The remove button maintains its existing visual design:

```typescript
className={`${item} text-red-400 hover:bg-red-500/10`}
```

- **Text Color**: `text-red-400` (red)
- **Hover Background**: `hover:bg-red-500/10` (semi-transparent red)
- **Icon**: `<Trash2 size={14} />` (trash icon)
- **Label**: "Remove from Playlist"

### Layout Structure

The remove button appears in the following position:

```
┌─────────────────────────────┐
│ Like                        │
│ Go to Album                 │
├─────────────────────────────┤
│ Add to Playlist          >  │
├─────────────────────────────┤
│ Remove from Playlist        │ ← Visible when appropriate
├─────────────────────────────┤
│ Share                    >  │
└─────────────────────────────┘
```

Dividers appear above and below the remove button section when it's visible.

## Implementation Details

### File Modifications

**File**: `frontend/components/ui/ContextMenu.tsx`

**Modification 1**: Update width style property
- **Line**: ~68
- **Change**: `style={{ width: 200 }}` → `style={{ width: 240 }}`

**Modification 2**: Update remove button visibility condition
- **Line**: ~117
- **Change**: Remove `!currentPlaylistId.startsWith("mood-") &&` condition
- **Before**: `{currentPlaylistId && !currentPlaylistId.startsWith("mood-") && currentPlaylistId !== "liked" && onRemoveFromPlaylist && (`
- **After**: `{currentPlaylistId && currentPlaylistId !== "liked" && onRemoveFromPlaylist && (`

### Conditional Rendering Logic

The remove button renders when all conditions are met:

1. ✅ `currentPlaylistId` is defined (truthy)
2. ✅ `currentPlaylistId !== "liked"` (not the Liked Songs playlist)
3. ✅ `onRemoveFromPlaylist` callback is provided

The remove button does NOT render when any condition fails:

1. ❌ `currentPlaylistId` is undefined or null
2. ❌ `currentPlaylistId === "liked"`
3. ❌ `onRemoveFromPlaylist` is undefined

## Error Handling

### Edge Cases

1. **Undefined currentPlaylistId**
   - **Behavior**: Remove button hidden
   - **Reason**: No playlist context available

2. **Liked Songs Playlist (ID: "liked")**
   - **Behavior**: Remove button hidden
   - **Reason**: Tracks removed via unlike mechanism

3. **Missing onRemoveFromPlaylist callback**
   - **Behavior**: Remove button hidden
   - **Reason**: No handler available for remove action

4. **Empty Playlists List**
   - **Behavior**: Add to Playlist submenu shows only "Create Playlist" option
   - **Impact**: Unaffected by these changes

### Theme Compatibility

Both changes maintain compatibility with dark and light themes:

- Width change is theme-agnostic
- Remove button uses theme-aware styling via the `item` class variable
- Red accent color (`text-red-400`) works in both themes

## Testing Strategy

### Unit Tests

1. **Width Verification**
   - Verify ContextMenu has width of 240px
   - Test with various prop combinations

2. **Remove Button Examples**
   - Verify button visible for custom playlist with callback
   - Verify button hidden for "liked" playlist
   - Verify button hidden when currentPlaylistId undefined
   - Verify button hidden when callback not provided

3. **Styling Regression**
   - Verify padding, border, and shadow classes preserved
   - Verify remove button has red text and trash icon
   - Verify remove button positioned correctly with dividers

### Property-Based Tests

Property-based tests will validate universal behaviors across randomized inputs (see Correctness Properties section below).

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Menu Width Consistency

*For any* valid ContextMenu props configuration, the rendered component SHALL have a width of exactly 240 pixels.

**Validates: Requirements 1.1, 1.2**

### Property 2: Remove Button Visibility Rule

*For any* ContextMenu rendering context, the Remove button SHALL be visible if and only if all three conditions hold: (1) currentPlaylistId is defined, (2) currentPlaylistId is not equal to "liked", and (3) onRemoveFromPlaylist callback is provided.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

## Deployment Considerations

### Backwards Compatibility

- ✅ Component interface unchanged (no breaking changes)
- ✅ All existing callbacks and props function identically
- ✅ Parent components require no modifications

### Performance Impact

- **Width Change**: Negligible (static style property)
- **Logic Change**: Negligible (removed one string comparison)

### User Impact

1. **Improved Readability**: Wider menu reduces text truncation
2. **Enhanced Functionality**: Users can now remove tracks from mood playlists
3. **Consistent Behavior**: Remove button appears for all playlists except Liked Songs

## Future Enhancements

1. **Dynamic Width**: Consider responsive width based on content length
2. **Keyboard Navigation**: Add keyboard shortcuts for menu actions
3. **Accessibility**: Enhance ARIA labels and screen reader support
4. **Animation**: Add smooth transitions for submenu expansion

## Conclusion

These two fixes improve the ContextMenu component's usability without introducing breaking changes. The width expansion prevents text truncation, while the corrected visibility logic enables users to curate all playlist types except Liked Songs, where the like/unlike mechanism already provides track management.
