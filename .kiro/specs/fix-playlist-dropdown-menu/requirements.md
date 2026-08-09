# Requirements Document

## Introduction

This document defines requirements for fixing UI issues in the playlist page dropdown menu system. The playlist page contains two types of dropdown menus: (1) playlist action menus for custom playlists that appear on hover, and (2) track context menus that appear when clicking the "⋯" button on individual tracks. Both menus experience issues with positioning, visibility, z-index layering, and click-outside behavior that need to be resolved to ensure proper user interaction.

## Glossary

- **Playlist_System**: The React component system managing playlist display, track tables, and user interactions on the `/playlist` page
- **Context_Menu**: The dropdown menu component (`ContextMenu.tsx`) that appears when users click the "⋯" button on a track row
- **Playlist_Action_Menu**: The dropdown menu that appears when users click the "⋯" button on custom playlist sidebar items
- **Portal**: A React portal rendering mechanism that mounts a component at the document body level to escape z-index stacking contexts
- **Viewport**: The visible browser window area
- **Z_Index_Layer**: The stacking order of overlapping UI elements

## Requirements

### Requirement 1: Context Menu Positioning

**User Story:** As a user, I want the track context menu to appear near the clicked track button, so that I can easily see and interact with menu options without searching the screen.

#### Acceptance Criteria

1. WHEN a user clicks the "⋯" button on a track row, THE Context_Menu SHALL appear within 4 pixels of the button's bottom edge
2. WHEN the Context_Menu would extend beyond the right Viewport edge, THE Context_Menu SHALL reposition itself to align its right edge with the button's right edge
3. WHEN the Context_Menu would extend beyond the bottom Viewport edge, THE Context_Menu SHALL reposition itself above the button instead of below
4. THE Context_Menu SHALL maintain a minimum 8-pixel margin from all Viewport edges

### Requirement 2: Context Menu Portal Rendering

**User Story:** As a user, I want the context menu to always appear above all other page elements, so that it is never obscured by overlapping content.

#### Acceptance Criteria

1. THE Context_Menu SHALL render through a React Portal attached to the document body
2. THE Context_Menu SHALL have a Z_Index_Layer value of 9999 or higher
3. WHEN the Context_Menu is visible, THE Context_Menu SHALL appear above the playlist hero banner, table headers, and scrollable content areas
4. WHEN multiple Context_Menus are triggered in sequence, THE Playlist_System SHALL close the previous menu before opening a new one

### Requirement 3: Playlist Action Menu Positioning

**User Story:** As a user, I want the playlist action menu to appear consistently near the playlist item, so that I can quickly access share and delete options.

#### Acceptance Criteria

1. WHEN a user clicks the "⋯" button on a custom playlist sidebar item, THE Playlist_Action_Menu SHALL appear within 4 pixels below the button
2. WHEN the Playlist_Action_Menu would extend beyond the right Viewport edge, THE Playlist_Action_Menu SHALL reposition to appear on the left side of the button instead
3. WHEN the Playlist_Action_Menu would extend beyond the bottom Viewport edge, THE Playlist_Action_Menu SHALL reposition above the button
4. THE Playlist_Action_Menu SHALL remain within the Viewport boundaries with a minimum 8-pixel margin

### Requirement 4: Submenu Positioning

**User Story:** As a user, I want submenu options like "Add to Playlist" and "Share" to expand in a direction that keeps them visible, so that I can see all available options without scrolling or repositioning.

#### Acceptance Criteria

1. WHEN a Context_Menu item with a submenu is hovered, THE Playlist_System SHALL calculate the available space on the left side of the menu
2. IF the submenu would extend beyond the left Viewport edge, THEN THE Playlist_System SHALL position the submenu on the right side of the parent menu instead
3. WHEN the submenu is positioned on the right side, THE Playlist_System SHALL add a left margin of 4 pixels from the parent menu edge
4. THE Playlist_System SHALL adjust submenu vertical position if it would extend beyond the top or bottom Viewport edges

### Requirement 5: Click-Outside Menu Closure

**User Story:** As a user, I want dropdown menus to close when I click anywhere outside them, so that I can easily dismiss menus and continue interacting with the page.

#### Acceptance Criteria

1. WHEN a user clicks outside the Context_Menu boundaries, THE Playlist_System SHALL close the Context_Menu within 100 milliseconds
2. WHEN a user clicks outside the Playlist_Action_Menu boundaries, THE Playlist_System SHALL close the Playlist_Action_Menu within 100 milliseconds
3. WHEN a submenu is open and the user clicks outside both the parent menu and submenu, THE Playlist_System SHALL close both menus
4. WHEN a user clicks on another clickable page element outside the menu, THE Playlist_System SHALL close the menu before processing the new click event

### Requirement 6: Menu State Management

**User Story:** As a developer, I want menu state to be managed consistently across the playlist page, so that menu behavior is predictable and prevents multiple menus from being open simultaneously.

#### Acceptance Criteria

1. THE Playlist_System SHALL maintain a single state variable for the currently open Context_Menu identified by track ID
2. THE Playlist_System SHALL maintain a single state variable for the currently open Playlist_Action_Menu identified by playlist ID
3. WHEN a new Context_Menu is opened, THE Playlist_System SHALL set any existing Context_Menu state to null before setting the new menu state
4. WHEN a new Playlist_Action_Menu is opened, THE Playlist_System SHALL set any existing Playlist_Action_Menu state to null before setting the new menu state
5. WHEN the user scrolls the playlist table, THE Playlist_System SHALL close any open Context_Menu

### Requirement 7: Submenu Interaction Behavior

**User Story:** As a user, I want to be able to move my mouse from a menu item to its submenu without the submenu disappearing, so that I can select submenu options easily.

#### Acceptance Criteria

1. WHEN a user hovers over a menu item with a submenu, THE Context_Menu SHALL open the submenu after a 150-millisecond delay
2. WHEN a user moves their mouse cursor from the parent menu item to the submenu, THE Context_Menu SHALL keep the submenu open
3. WHEN the submenu is open and the user moves their mouse to a different parent menu item, THE Context_Menu SHALL close the current submenu and open the new submenu for the hovered item
4. WHEN the user moves their mouse completely outside both the parent menu and submenu for more than 200 milliseconds, THE Context_Menu SHALL close the submenu

### Requirement 8: Visual Feedback and Transitions

**User Story:** As a user, I want smooth visual transitions when menus appear and disappear, so that the interface feels polished and responsive.

#### Acceptance Criteria

1. WHEN a Context_Menu opens, THE Context_Menu SHALL fade in with an opacity transition lasting 150 milliseconds
2. WHEN a Context_Menu closes, THE Context_Menu SHALL fade out with an opacity transition lasting 100 milliseconds
3. WHEN a submenu expands, THE Playlist_System SHALL apply a scale transform from 0.95 to 1.0 over 150 milliseconds
4. WHEN menu items are hovered, THE Context_Menu SHALL highlight the item with a background color transition lasting 100 milliseconds

### Requirement 9: Accessibility and Keyboard Navigation

**User Story:** As a keyboard user, I want to navigate and interact with dropdown menus using keyboard controls, so that I can access all menu functionality without a mouse.

#### Acceptance Criteria

1. WHEN a Context_Menu is open and the user presses the Escape key, THE Playlist_System SHALL close the Context_Menu
2. WHEN a Playlist_Action_Menu is open and the user presses the Escape key, THE Playlist_System SHALL close the Playlist_Action_Menu
3. WHEN a menu is open and the user presses the Tab key, THE Playlist_System SHALL move focus to the next menu item
4. WHEN a menu item with a submenu receives focus and the user presses the Right Arrow key, THE Playlist_System SHALL open the submenu and focus the first submenu item
5. WHEN a submenu is open and the user presses the Left Arrow key, THE Playlist_System SHALL close the submenu and return focus to the parent menu item

### Requirement 10: Mobile and Touch Device Support

**User Story:** As a mobile user, I want dropdown menus to work correctly on touch devices, so that I can access all menu options on my phone or tablet.

#### Acceptance Criteria

1. WHEN a user taps the "⋯" button on a touch device, THE Playlist_System SHALL open the corresponding menu
2. WHEN a menu is open on a touch device and the user taps outside the menu, THE Playlist_System SHALL close the menu
3. WHEN the Viewport width is less than 768 pixels, THE Context_Menu SHALL position itself centered horizontally on the screen instead of near the button
4. WHEN a submenu is opened on a touch device, THE Playlist_System SHALL expand the submenu inline within the parent menu instead of as an overlay
5. WHEN the device orientation changes while a menu is open, THE Playlist_System SHALL reposition the menu to remain within the new Viewport boundaries
