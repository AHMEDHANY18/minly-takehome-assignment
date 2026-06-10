# Minly Mobile

React Native (Expo) client for Minly — a media-sharing social app. Talks to the Minly backend REST API (`/v1`) with the shared `{ status, data }` envelope.

## Stack

- **Expo SDK 54** / React Native 0.81 / React 19
- **expo-router** — file-based routing (typed routes enabled)
- **axios** — API client with Bearer-token interceptor (`src/api/client.ts`)
- **zustand** — auth/session state (`src/store/auth.store.ts`)
- **expo-secure-store** — token persistence
- **expo-web-browser + expo-linking** — Cognito hosted-UI OAuth (login / signup)
- TypeScript throughout, no UI kit — plain `StyleSheet` components

## Project structure

```
app/                      # expo-router routes (thin wrappers, default-export screens)
  (tabs)/                 # bottom tabs: home, upload, saved, notification, profile
  auth/                   # login / register / OAuth success
  media/[id]/details.tsx  # post details + comments
  messages/               # conversations list + chat ([id])
  hashtag/[tag].tsx       # posts for a hashtag
  search.tsx              # user & media search
  user/profile/[id].tsx   # other users' profiles
src/
  api/client.ts           # axios instance + base URL + auth header
  features/<feature>/     # api/ hooks/ components/ screen/ per feature
    auth, feed, media, messages, search, hashtag,
    notifications, profile, saved, social (block/report/follow/like)
  shared/                 # reusable components, hooks, theme, utils
  store/                  # zustand stores
  types/                  # shared TS types
```

## Configuration

| Env var | Purpose | Default |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Backend base URL **including** `/v1` | `https://minly-takehome-assignment.onrender.com/v1` |

Example `.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000/v1
```

(Use your machine's LAN IP, not `localhost`, when testing on a device.)

## Run

```bash
npm install
npx expo start
```

Then open in Expo Go (scan QR), or press `a` / `i` for the Android emulator / iOS simulator.

## Build (EAS)

`eas.json` defines `development`, `preview` (internal APK), and `production` profiles:

```bash
npx eas build --profile preview --platform android
npx eas build --profile production --platform android
```

OTA updates are configured via `expo-updates` (`runtimeVersion: appVersion`).

## Features

- **Auth** — Google sign-in via the backend's Cognito hosted UI; separate Register screen (signup hint), reachable from Login via "Create account"
- **Feeds** — Home (following) / Explore / Trending with pull-to-refresh and infinite scroll
- **Upload** — image/video upload through S3 presigned URLs (presign → PUT → finalize)
- **Post details** — likes, bookmarks, threaded comments with replies
  - edit your own comments (PATCH `/comment/:id`, shows "(edited)" marker)
  - delete your own posts (here and from the profile grid) with confirmation
  - report posts/comments (SPAM / ABUSE / INAPPROPRIATE / OTHER)
- **Search** — users and media (`/user/search`, `/media/search`), debounced, paginated
- **Hashtags** — tappable `#tags` in captions open `/hashtag/[tag]` feeds
- **Direct messages** — conversation list with unread badges, 1:1 chat with optimistic send, cursor pagination for history, 5s polling while focused, mark-as-read; unread-count badge on the Home header
- **Profiles** — own profile (edit, saved tab) and other users (follow, **Message**, **Block/Unblock** with confirmation)
- **Notifications** — likes, comments, follows, mentions
- **Saved** — bookmarked media grid
