# Profile UI Update for Voyager/DS9

This update adds a Reddit/social media-style profile header with:

- **Banner Image** - Full-width banner at the top (or gradient placeholder)
- **Avatar/Profile Picture** - Circular avatar overlapping the banner
- **Display Name & Username** - With instance domain shown
- **Stats Row** - Post count, comment count, and account age
- **Bio** - User's bio text (if set)
- **Horizontal Tabs** - Quick navigation to Posts, Comments, Saved, Hidden, etc.

## Files to Copy

### Files to `src/features/user/` (replace existing or add new):

| File | Action |
|------|--------|
| `ProfileHeader.tsx` | **ADD** (new file) |
| `ProfileHeader.module.css` | **ADD** (new file) |
| `ProfileTabs.tsx` | **ADD** (new file) |
| `ProfileTabs.module.css` | **ADD** (new file) |
| `Profile.tsx` | **REPLACE** (overwrites existing) |
| `Profile.module.css` | **ADD** (new file) |

### Files to `src/routes/pages/profile/` (replace existing):

| File | Action |
|------|--------|
| `ProfilePage.tsx` | **REPLACE** (overwrites existing) |

## Installation Steps

1. Navigate to your ds9 repository folder
2. Copy all files from `src/features/user/` to your `src/features/user/` folder
3. Copy `ProfilePage.tsx` from `src/routes/pages/profile/` to your `src/routes/pages/profile/` folder
4. Stop the dev server if running
5. Run `pnpm dev` to restart

## Debugging

This version includes console.log statements to help debug. After installing:

1. Open the browser console (F12 → Console tab)
2. Go to your profile page
3. Look for these logs:
   - `[ProfilePage] State:` - Shows what data ProfilePage receives
   - `[ProfilePage] Rendering Profile with:` - Shows data passed to Profile
   - `[Profile] Component mounted with person:` - Shows Profile received data
   - `[ProfileHeader] Rendering with user data:` - Shows the avatar/banner values

If you see the `[ProfilePage]` logs but NOT the `[Profile]` logs, the Profile component isn't mounting.
If you see `[Profile]` logs but NOT `[ProfileHeader]` logs, there's an issue with ProfileHeader.
If avatar shows as `null` or `undefined`, the API isn't returning avatar data.

## What Changed

The old Profile component showed:
- Stats (post count, comment count, account age)
- Vertical list of links (Posts, Comments, Saved, Hidden, etc.)
- Overview feed of recent posts/comments

The new Profile component shows:
- Banner image (or gradient placeholder)
- Large circular avatar
- Display name and @username@instance
- Horizontal stats row
- Bio text
- Horizontal tabs for navigation
- Overview feed below
