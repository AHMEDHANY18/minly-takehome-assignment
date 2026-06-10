# New Features — Shared API Contract

This document is the single source of truth for the feature batch added on 2026-06-10.
Backend, web, and mobile MUST follow these shapes exactly.

## Conventions (already established in the codebase)

- Success envelope: `{ "status": "success", "data": <payload> }`
- Error envelope: `{ "status": "error", "message": "<msg>" }` (thrown as `Error` with `.status`)
- All new routes live under `/v1`, use `requireAuth` unless stated, zod `validate()` middleware.
- Layers: `routes/v1/*.router.ts` → `controllers/<x>.controller/*.controller.ts` → `services/<x>/*.service.ts` → `repositories/*.repository.ts`.
- Pagination (offset): query `page` (1-based, default 1), `limit` (default 10, max 50); responses include `page`, `limit`, `total`, `hasMore`.
- Cursor pagination (new, additive): endpoints that support it accept `cursor` (a media/message `id`); response includes `nextCursor: string | null`. When `cursor` is provided it takes precedence over `page`.

## Prisma schema additions

- `ThreadedComment`: add `updatedAt DateTime @updatedAt`, `isEdited Boolean @default(false)`
- `Message`: add `isRead Boolean @default(false)`, `@@index([conversationId, createdAt])`
- `Conversation`: add `lastMessageAt DateTime?`
- New enums: `ReportTargetType { MEDIA COMMENT USER }`, `ReportReason { SPAM ABUSE INAPPROPRIATE OTHER }`, `ReportStatus { PENDING REVIEWED DISMISSED }`
- New model `Report { id, reporterId, targetType ReportTargetType, targetId String, reason ReportReason, details String?, status ReportStatus @default(PENDING), createdAt }` with `@@index([reporterId])`
- New model `Hashtag { id, tag String @unique, createdAt }` and `MediaHashtag { id, mediaId, hashtagId, @@unique([mediaId, hashtagId]) }` with relations to Media/Hashtag
- Apply with `npx prisma db push` (no migration files exist in this repo; document this).

## 1) User & media search

`GET /v1/user/search?q=<text>&page=&limit=` (auth)
→ `data: { users: [{ id, name, email, avatarUrl, followerCount, isFollowing }], page, limit, total, hasMore }`
Search `name` and `email` with `contains`, mode insensitive. Excludes the caller and users the caller blocked / was blocked by.

`GET /v1/media/search?q=<text>&page=&limit=` (auth)
→ `data: { items: [<same media shape as explore feed items>], page, limit, total, hasMore }`
Searches `title`, `description`, and hashtag tag.

## 2) Block

`POST /v1/block/:userId` (auth) — toggle. → `data: { userId, isBlocked: boolean }`
Side effects when blocking: delete Follower rows in both directions and decrement the corresponding counts.
`GET /v1/block` (auth) → `data: { users: [{ id, name, avatarUrl, blockedAt }] }`
Blocked relationships are excluded from search, suggested users, and prevent DMs (403 "User is blocked").

## 3) Report

`POST /v1/report` (auth) body `{ targetType: "MEDIA"|"COMMENT"|"USER", targetId: string, reason: "SPAM"|"ABUSE"|"INAPPROPRIATE"|"OTHER", details?: string }`
→ `201`, `data: { id, status: "PENDING" }`. Validates the target exists. Duplicate (same reporter+target) returns the existing report (200).
`GET /v1/report/mine` (auth) → `data: { reports: [...] }`

## 4) Comment edit

`PATCH /v1/comment/:commentId` (auth, owner only) body `{ text: string (1..500) }`
→ `data: { id, text, isEdited: true, updatedAt }`
Clients render an "edited" marker when `isEdited`.

## 5) Direct messages (uses existing Conversation/Message models)

`POST /v1/conversation` (auth) body `{ userId }` — get-or-create the 1:1 conversation.
→ `data: { id, participant: { id, name, avatarUrl } }` (403 if either side blocked the other)

`GET /v1/conversation?page=&limit=` (auth)
→ `data: { conversations: [{ id, participant: { id, name, avatarUrl }, lastMessage: { id, text, mediaUrl, senderId, createdAt } | null, unreadCount, lastMessageAt }], page, limit, total, hasMore }`
Ordered by `lastMessageAt` desc (nulls last).

`GET /v1/conversation/:id/messages?cursor=&limit=` (auth, participant only)
→ `data: { messages: [{ id, conversationId, senderId, text, mediaUrl, isRead, createdAt }], nextCursor }`
Newest first; `nextCursor` = id of the oldest message returned, `null` when no more.

`POST /v1/conversation/:id/messages` (auth, participant only) body `{ text: string (1..1000) }`
→ `201`, `data: { message: { id, conversationId, senderId, text, mediaUrl, isRead, createdAt } }`
Updates `Conversation.lastMessageAt`. Emits realtime event to the other participant (see §8).

`PATCH /v1/conversation/:id/read` (auth, participant only)
→ `data: { conversationId, readCount }` — marks the other participant's messages as read.

`GET /v1/conversation/unread-count` (auth) → `data: { count }` (total unread messages for badge)

## 6) Hashtags & mentions

- On `media/finalize` and `media PATCH`, the backend extracts `#tag` tokens (`/#([\p{L}\d_]+)/gu`, lowercased) from title+description and syncs `Hashtag`/`MediaHashtag` rows.
- `GET /v1/media/hashtag/:tag?page=&limit=` (auth) → same shape as explore feed.
- Media payloads in feed/details MAY include `hashtags: string[]` (best effort).
- Mentions: when a comment is created, `@Name` tokens are matched case-insensitively against existing user names; each (non-self) match gets a `SYSTEM` notification. Best-effort only (names are not unique).

## 7) Empty stubs to fill

- `backend/src/validation/media/feedQuery.schema.ts` — zod: `{ query: { page?, limit?, cursor? } }`, wire into feed router.
- `backend/src/validation/media/avatar.schema.ts` — zod for avatar presign body; wire where avatar presign is handled.
- `backend/src/controllers/media.controller/getUserMedia.controller.ts` — `GET /v1/user/:userId/media?page=&limit=` → `data: { items, page, limit, total, hasMore }`.
- `minly-mobile/app/auth/register.tsx` — Cognito hosted-UI signup (same flow as login but signup screen hint).

## 8) Realtime (SSE — reuse existing notification stream)

New event payloads pushed through the existing per-user SSE stream (`/v1/notification/stream`) via `notificationStream.emit(userId, payload)`:

- New DM: `{ kind: "MESSAGE", conversationId, message: <message shape §5> }`
- Existing notification payloads keep their current shape; clients distinguish by `kind === "MESSAGE"`.
Mobile chat screens additionally poll messages every 5s as a fallback.

## 9) Trending cache (Redis, optional dependency)

`getTrendingFeed` caches page-1 results in Redis for 60s (key `feed:trending:p1:l<limit>`). All Redis calls are wrapped in try/catch — if Redis is down or `REDIS_URL` unset, the app works normally without caching. Cache invalidation is TTL-only.

## 10) Video thumbnails (web)

On video upload the web client captures a frame via `<canvas>` (no new deps), requests a second presign with `kind: "thumbnail"` (image/jpeg), uploads it, and passes `thumbnailUrl` to `media/finalize`. Backend presign service accepts `kind: "thumbnail"`; finalize accepts optional `thumbnailUrl`. Mobile sends no thumbnail (no extra deps available).

## Hard constraints for all implementers

- **No new npm dependencies anywhere** (node_modules cannot be reinstalled in this environment).
- Do not run `npm install`, `prisma migrate`, or builds — write code statically correct against existing deps.
- Match existing code style (Arabic comments appear in places; keep comments minimal).
- Web env var `VITE_API_URL`, mobile `EXPO_PUBLIC_API_URL` (unchanged).
