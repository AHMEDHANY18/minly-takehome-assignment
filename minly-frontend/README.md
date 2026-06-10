# Minly — Web Client

React + TypeScript + Vite web client for the Minly media-sharing platform.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **TailwindCSS** (with dark mode)
- **React Router** for routing
- **Zustand** for state (auth, notifications, messages)
- **Axios** with a centralized API client
- **SSE (EventSource)** for real-time notifications and direct messages

## Features

- Cognito OAuth login / logout
- Home / Explore / Trending feeds with infinite scroll
- Media upload via S3 presigned URLs (images & videos, with client-side video thumbnail capture)
- Likes, threaded comments (create / edit / delete), bookmarks
- Follow / unfollow + suggested users
- User & media search (`/search`) and hashtag pages (`/hashtag/:tag`)
- Direct messages (`/messages`) with real-time updates and unread badge
- Block users (`/profile/blocked`) and report content (media / comments / users)
- Real-time notifications with sound, profile view & edit, dark mode

## Project Structure

```
src/
├── app/            # App.tsx (routes), layouts, providers
├── features/       # feature folders: feed, media, upload, profile,
│                   # notifications, messages, search, hashtag, saved, auth
│   └── <feature>/  # api/ + hooks/ + components/ + pages
└── shared/         # axios client, stores, shared components (ReportModal, HashtagText, MediaGrid)
```

## Environment Variables

Create `.env` (see `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:4000/v1
```

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build    # type-check + production build
npm run preview  # serve the build locally
```

Deployed on Vercel (see `vercel.json` for SPA rewrites).
