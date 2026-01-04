# YouTube Embed Feature for Voyager

This adds inline playable YouTube videos to your Voyager/DS9 Lemmy client.

## Features

- ▶️ Inline playable YouTube videos in the post feed (large view)
- 🎬 YouTube embeds in post detail view
- 🖼️ YouTube thumbnail with play icon in compact view
- 🔗 Supports multiple YouTube URL formats:
  - `youtube.com/watch?v=VIDEO_ID`
  - `youtu.be/VIDEO_ID`
  - `youtube.com/embed/VIDEO_ID`
  - `youtube.com/shorts/VIDEO_ID`
  - `youtube-nocookie.com/embed/VIDEO_ID`
- ⏱️ Timestamp support (e.g., `?t=120` or `?t=2m30s`)
- 🔒 Privacy-focused: Uses `youtube-nocookie.com` for embeds
- 📱 Responsive 16:9 aspect ratio
- 🌫️ NSFW blur support
- ⚡ Lazy loading: Thumbnail shown first, iframe loads on play

## Installation

### New Files to ADD

Copy these files to your `src/` directory:

```
src/features/media/external/youtube/
├── helpers.ts
├── index.ts
├── LargeFeedYouTubeMedia.module.css
├── LargeFeedYouTubeMedia.tsx
├── YouTubeEmbed.module.css
└── YouTubeEmbed.tsx
```

### Existing Files to REPLACE

Replace these existing files with the modified versions:

```
src/features/post/inFeed/large/media/LargeFeedPostMedia.tsx  (REPLACE)
src/features/post/useIsPostUrlMedia.ts                       (REPLACE)
src/features/post/inFeed/compact/Thumbnail.tsx               (REPLACE)
src/features/post/inFeed/compact/Thumbnail.module.css        (REPLACE)
src/features/post/detail/PostHeader.tsx                      (REPLACE)
src/features/post/detail/PostHeader.module.css               (REPLACE)
```

## File Structure

```
youtube-embed-feature/
├── ADD/
│   └── src/features/media/external/youtube/
│       ├── helpers.ts              # YouTube URL parsing utilities
│       ├── index.ts                # Exports
│       ├── LargeFeedYouTubeMedia.module.css
│       ├── LargeFeedYouTubeMedia.tsx  # Feed embed component
│       ├── YouTubeEmbed.module.css
│       └── YouTubeEmbed.tsx        # Main embed component
│
└── REPLACE/
    └── src/features/post/
        ├── useIsPostUrlMedia.ts    # Added YouTube detection
        ├── detail/
        │   ├── PostHeader.tsx      # Added YouTube embed in detail view
        │   └── PostHeader.module.css
        └── inFeed/
            ├── compact/
            │   ├── Thumbnail.tsx   # Added YouTube thumbnail with play icon
            │   └── Thumbnail.module.css
            └── large/media/
                └── LargeFeedPostMedia.tsx  # Added YouTube case
```

## How It Works

1. **URL Detection**: `isYouTubeUrl()` in `helpers.ts` detects YouTube URLs
2. **Feed Display**: `LargeFeedPostMedia.tsx` checks for YouTube URLs and renders `LargeFeedYouTubeMedia`
3. **Embed Component**: `YouTubeEmbed.tsx` shows a thumbnail first, loads iframe when clicked
4. **Post Detail**: `PostHeader.tsx` renders the YouTube embed in the full post view
5. **Compact Thumbnail**: `Thumbnail.tsx` shows the YouTube thumbnail with a play icon overlay

## Settings Integration

The YouTube embed respects the existing `embedExternalMedia` setting, which is the same setting used for Redgifs. If users have disabled external media embedding, YouTube videos will show as regular links instead.

## Privacy

All YouTube embeds use `youtube-nocookie.com` which is YouTube's privacy-enhanced mode that doesn't store cookies or tracking information on the user's device unless they actually play the video.
