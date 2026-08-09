# Implementation Plan: Playlist Dropdown Menu Fixes

## Overview

This plan implements two focused improvements to the ContextMenu component: expanding the menu width from 200px to 240px to prevent text truncation, and correcting the remove button visibility logic to show it for all playlists except "Liked Songs" (including mood playlists).

## Tasks

- [ ] 1. Update ContextMenu width to 240px
  - Modify the inline style width property from 200px to 240px
  - Verify the component renders with the new width
  - _Requirements: 1.1, 1.2_

- [ ]* 1.1 Write property test for menu width consistency
  - **Property 1: Menu Width Consistency**
  - **Validates: Requirements 1.1, 1.2**
  - Verify that for any valid ContextMenu props configuration, the rendered component has a width of exactly 240 pixels

- [ ] 2. Update remove button visibility logic
  - Remove the `!currentPlaylistId.startsWith("mood-")` condition from the conditional rendering
  - Keep only the conditions: `currentPlaylistId` is defined, `currentPlaylistId !== "liked"`, and `onRemoveFromPlaylist` is provided
  - Verify the button renders correctly with updated logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ]* 2.1 Write property test for remove button visibility rule
  - **Property 2: Remove Button Visibility Rule**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
  - Verify that for any ContextMenu rendering context, the Remove button is visible if and only if all three conditions hold: (1) currentPlaylistId is defined, (2) currentPlaylistId is not equal to "liked", and (3) onRemoveFromPlaylist callback is provided

- [ ]* 2.2 Write unit tests for remove button visibility scenarios
  - Test button visible for custom playlist with callback
  - Test button visible for mood playlist with callback
  - Test button hidden for "liked" playlist
  - Test button hidden when currentPlaylistId is undefined
  - Test button hidden when onRemoveFromPlaylist callback is not provided
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 3. Checkpoint - Verify all changes and styling
  - Ensure the menu width is 240px
  - Ensure remove button appears correctly for mood and custom playlists
  - Ensure remove button is hidden for "Liked Songs" playlist
  - Ensure all existing styling (padding, borders, colors, icons) is preserved
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation involves only two simple code changes to the ContextMenu.tsx file
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All changes are backwards compatible with no breaking changes to the component interface

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["1.1", "2.1", "2.2"] }
  ]
}
```
