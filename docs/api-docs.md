## 🛰 API Overview

All clients (Web + Mobile) communicate with a single REST API.

- **Base URL (local dev):** `http://localhost:4000/v1`
- **Base URL (production):** `https://minly-takehome-assignment.onrender.com/v1`

Protected routes require:

```txt
Authorization:<JWT_TOKEN>
```

Full interactive documentation:
https://documenter.getpostman.com/view/33115360/2sB3dHVY7T

---

## 🔐 Auth (Why?)
> To securely identify users and protect write operations like upload, like, and delete.

```md
- `POST /auth/register`
  Creates a new user and initializes their profile.

- `POST /auth/login`
  Issues a JWT token used for authenticated actions.

- `GET /auth/me` (protected)
  Returns the currently authenticated user (used by web/mobile on app load).
```

---

## 📸 Media (Why?)
> Media is the core domain object. These endpoints power the feed, profiles, and uploads.

```md
- `GET /media?page=1&limit=20`
  Public global feed sorted by newest (supports pagination for scalability).

- `GET /media/:id`
  Fetch a single media item for detail screens.

- `POST /media` (protected, multipart/form-data)
  Uploads image/video to S3 and stores metadata in PostgreSQL.

- `DELETE /media/:id` (protected, owner only)
  Enforces ownership and safely removes media + related likes.
```

---

## ❤️ Likes (Why?)
> Engagement metric. Toggle design simplifies client logic and prevents duplicate likes.

```md
- `POST /media/:id/like` (protected)
  Toggle behavior: like if not liked, unlike if already liked.
```

---

## 👤 Profile (Why?)
> Allows users to view identity, uploads, and activity — essential for social UX.

```md
- `GET /users/:id`
  Fetches public profile information.

- `GET /users/:id/media`
  Returns media uploads for a specific user (used in profile grid).
```

---

## 🆕 New Endpoints — Feature Batches 1 & 2 (2026-06-10)

All routes below are under `/v1` and require auth (`requireAuth`) unless noted.
Envelope: `{ "status": "success", "data": ... }` / `{ "status": "error", "message": ... }`.

### Search & discovery (batch 1)

```md
- `GET  /user/search?q=&page=&limit=` (auth)
  Search users by name/email (excludes self and blocked relationships).

- `GET  /media/search?q=&page=&limit=` (auth)
  Search media by title, description, or hashtag.

- `GET  /media/hashtag/:tag?page=&limit=` (auth)
  Media feed for a hashtag (same shape as explore feed).

- `GET  /user/:userId/media?page=&limit=` (auth)
  Paginated media grid for a user profile.
```

### Block & report (batch 1)

```md
- `POST /block/:userId` (auth)
  Toggle block; blocking removes follows in both directions.

- `GET  /block` (auth)
  List users blocked by the caller.

- `POST /report` (auth)
  Report MEDIA / COMMENT / USER with a reason; duplicate reports return the existing one (200).

- `GET  /report/mine` (auth)
  Reports created by the caller.
```

### Comments & messaging (batch 1)

```md
- `PATCH /comment/:commentId` (auth, owner only)
  Edit a comment (sets isEdited flag).

- `POST  /conversation` (auth)
  Get-or-create the 1:1 conversation with a user (403 when blocked).

- `GET   /conversation?page=&limit=` (auth)
  List conversations with last message + unread count.

- `GET   /conversation/unread-count` (auth)
  Total unread messages (badge).

- `GET   /conversation/:id/messages?cursor=&limit=` (auth, participant only)
  Cursor-paginated messages, newest first.

- `POST  /conversation/:id/messages` (auth, participant only)
  Send a message; pushes a realtime `MESSAGE` event over SSE.

- `PATCH /conversation/:id/read` (auth, participant only)
  Mark the other participant's messages as read.
```

### Feeds & views (batch 1 + 2)

```md
- `GET /feed/home` (auth)
  Following feed with recommended fallback (offset + cursor pagination).

- `GET /feed/explore` (auth)
  Discovery feed excluding self + following.

- `GET /feed/trending` (auth)
  Trending v2: media from the last 7 days scored by
  (views + likes*3 + comments*5) / (ageHours + 2)^1.5, Redis-cached for page 1.

- `GET /media/:mediaId/details` (auth)
  Media details + comments; increments `viewsCount` (never for the uploader).
  Feed/search/details payloads now include `viewsCount`.
```

### Stories (batch 2)

```md
- `POST   /story` (auth)
  Create a 24h story from an uploaded S3 URL (`{ url, type: IMAGE|VIDEO }`) → 201.

- `GET    /story/feed` (auth)
  Active stories grouped by user: own group first, then unviewed, then viewed.

- `POST   /story/:id/view` (auth)
  Mark a story viewed (idempotent; own stories are ignored).

- `GET    /story/:id/viewers` (auth, owner only)
  Who viewed the story + count.

- `DELETE /story/:id` (auth, owner only)
  Delete a story and its views.
```

### Admin (batch 2 — requires `isAdmin`, 403 otherwise)

```md
- `GET    /admin/stats`
  Platform totals: users, media, comments, likes, reports (total/pending),
  conversations, active stories.

- `GET    /admin/reports?status=&page=&limit=`
  Paginated reports with reporter info and a preview of the reported target.

- `PATCH  /admin/reports/:id`
  Set report status to REVIEWED or DISMISSED.

- `DELETE /admin/media/:id`
  Force-delete any media (marks its PENDING reports REVIEWED).

- `DELETE /admin/comment/:id`
  Force-delete any comment + replies (marks its PENDING reports REVIEWED).

- `GET    /admin/metrics`
  In-memory process metrics: uptime, memory, request counts and avg latency per route.
```

### Auth additions

```md
- `GET /auth/me` (auth)
  Response now includes `isAdmin` (clients use it to show the admin area).

- `POST /auth/dev-login` (local dev only, DEV_AUTH=true)
  Mints a local token without Cognito.
```

### Realtime

```md
- `GET /notification/stream` (auth, SSE)
  Per-user event stream; also carries `kind: "MESSAGE"` payloads for new DMs.
  Excluded from request-duration metrics (long-lived connection).
```

---

