# DS9 UI Updates

This package contains UI modifications for the DS9 (Voyager fork) Lemmy client.

## Changes Included

### 1. Compact Icon-Only Tab Bar
**File:** `src/routes/TabBar.module.css`
- Removes text labels from bottom tab bar (icons only)
- Reduces tab bar height to 40px (from ~56px)
- Larger 28px icons for easy tapping
- Adjusted badge positioning

### 2. Rounded Post Cards with Spacing
**Files:**
- `src/features/post/inFeed/Post.module.css` - Adds 12px spacing between posts
- `src/features/post/inFeed/large/LargePost.module.css` - Adds 12px rounded corners, theme-matching background, subtle border

### 3. In-Place Profile Tabs with Inline Loading
**Files:**
- `src/features/user/Profile.tsx` - Tabs now switch content in place instead of navigating to new pages. Shows inline loading spinner under tabs instead of full-screen flash.
- `src/features/user/ProfileTabs.tsx` - Tab component (unchanged, included for completeness)
- `src/features/user/Profile.module.css` - Added styles for inline tab loading indicator

**Tabs that work in-place:** Overview, Posts, Comments, Saved, Upvoted, Downvoted

**"Hidden" tab** still navigates to separate page (uses local IndexedDB, different data source)

## Installation

Replace the corresponding files in your ds9 repository with these updated versions:

1. `src/routes/TabBar.module.css`
2. `src/features/post/inFeed/Post.module.css`
3. `src/features/post/inFeed/large/LargePost.module.css`
4. `src/features/user/Profile.tsx`
5. `src/features/user/ProfileTabs.tsx`
6. `src/features/user/Profile.module.css`
