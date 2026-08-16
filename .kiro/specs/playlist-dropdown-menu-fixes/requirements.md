# Requirements Document

## Introduction

This document specifies requirements for two playlist dropdown menu fixes in the MoodiFy application. The fixes address usability issues with the ContextMenu component: increasing the menu width to prevent text truncation and correcting the remove button visibility logic to exclude only the "Liked Songs" playlist while showing it for all other playlists.

## Glossary

- **ContextMenu**: The dropdown menu component that appears when a user interacts with a track, providing options such as Like, Go to Album, Add to Playlist, Remove from Playlist, and Share.
- **Liked_Songs_Playlist**: A special system playlist with ID "liked" that contains all tracks the user has marked as liked.
- **Custom_Playlist**: A user-created playlist that is not a mood-generated playlist or the Liked Songs playlist.
- **Mood_Playlist**: A system-generated playlist with an ID starting with "mood-".
- **Remove_Button**: The "Remove from Playlist" action in the ContextMenu that allows users to remove a track from the current playlist.
- **Menu_Width**: The horizontal width of the ContextMenu component measured in pixels.

## Requirements

### Requirement 1: ContextMenu Width Expansion

**User Story:** As a user, I want the playlist dropdown menu to be wider, so that longer playlist names and menu options are fully visible without truncation.

#### Acceptance Criteria

1. THE ContextMenu SHALL have a width of 240 pixels
2. THE ContextMenu SHALL maintain consistent width across all usage contexts
3. THE ContextMenu SHALL preserve existing padding, border, and shadow styling

### Requirement 2: Remove Button Visibility Logic

**User Story:** As a user, I want to see the remove button for all playlists except "Liked Songs", so that I can remove tracks from my custom playlists and mood playlists.

#### Acceptance Criteria

1. WHEN currentPlaylistId is defined AND currentPlaylistId is not equal to "liked" AND onRemoveFromPlaylist callback is provided, THE ContextMenu SHALL display the Remove_Button
2. WHEN currentPlaylistId equals "liked", THE ContextMenu SHALL NOT display the Remove_Button
3. WHEN currentPlaylistId is undefined, THE ContextMenu SHALL NOT display the Remove_Button
4. WHEN onRemoveFromPlaylist callback is not provided, THE ContextMenu SHALL NOT display the Remove_Button
5. THE Remove_Button SHALL be displayed for Custom_Playlist contexts
6. THE Remove_Button SHALL be displayed for Mood_Playlist contexts
7. THE Remove_Button SHALL maintain its existing visual styling including red text color and trash icon
8. THE Remove_Button SHALL be positioned between the "Add to Playlist" section and the "Share" section with dividers above and below
