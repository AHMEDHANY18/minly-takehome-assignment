# Batch 2 — Shared API Contract (2026-06-10)

Addendum to `new-features-contract.md`. Same conventions: `{status:"success",data}` envelope, `requireAuth`, zod `validate()`, layer structure, offset pagination fields (`page, limit, total, hasMore`).

## Prisma schema additions

- `Media`: add `viewsCount Int @default(0)`
- `User`: add `isAdmin Boolean @default(false)`, relations `stories Story[]`, `storyViews StoryView[]`
- New model `Story { id String @id @default(uuid()), userId String, url String, type MediaType, createdAt DateTime @default(now()), expiresAt DateTime, user User @relation(...), views StoryView[], @@index([userId, expiresAt]) }`
- New model `StoryView { id, storyId, viewerId, createdAt, @@unique([storyId, viewerId]) }` with relations to Story and User
- Apply with `npx prisma db push` then `npx prisma generate`.

## 1) Views & trending

- `GET /v1/media/:mediaId/details` increments `viewsCount` fire-and-forget (no await failure propagation), EXCEPT when the viewer is the uploader. Response now includes `viewsCount`.
- Feed/search media items include `viewsCount`.
- Trending feed (`GET /v1/feed/trending`) new ranking: fetch media from the last 7 days (cap 300 rows), score in the service:
  `score = (viewsCount + likesCount*3 + commentCount*5) / Math.pow(ageInHours + 2, 1.5)`
  sort desc, then paginate in memory. Result shape unchanged. Redis cache for page 1 stays (key bump to `feed:trending:v2:p1:l<limit>`). Fallback to recent-first if no rows.

## 2) Admin (web only)

- `User.isAdmin` exposed in `/auth/me` response (formatUser/me payload must include it).
- New middleware `requireAdmin` (after requireAuth; 403 `{status:"error",message:"Admin only"}`).
- New router `/v1/admin` (requireAuth + requireAdmin on ALL routes):
  - `GET /v1/admin/stats` → `data: { users, media, comments, likes, reports: { total, pending }, conversations, activeStories }`
  - `GET /v1/admin/reports?status=&page=&limit=` → `data: { reports: [{ id, targetType, targetId, reason, details, status, createdAt, reporter: {id,name,avatarUrl}, target: <preview|null> }], page, limit, total, hasMore }`
    - `target` preview: MEDIA → `{id,url,thumbnailUrl,type,title,uploader:{id,name}}`; COMMENT → `{id,text,user:{id,name}}`; USER → `{id,name,email,avatarUrl}`; null if deleted.
  - `PATCH /v1/admin/reports/:id` body `{ status: "REVIEWED" | "DISMISSED" }` → `data: { id, status }`
  - `DELETE /v1/admin/media/:id` and `DELETE /v1/admin/comment/:id` — admin force-delete reusing the existing delete services with an `isAdmin` bypass of the owner check (also mark related PENDING reports REVIEWED).
  - `GET /v1/admin/metrics` → `data: { uptimeSeconds, memory: {rss,heapUsed}, requests: { total, errors5xx, byRoute: [{route, count, avgMs}] } }` from the in-memory metrics module.
- Web route `/admin` (link visible only when `me.isAdmin`): tabs Reports (filter by status, preview, actions Review/Dismiss/Delete content) and Stats (cards + metrics).

## 3) Stories

- `POST /v1/story` body `{ url: string, type: "IMAGE"|"VIDEO" }` (url comes from the existing presign+PUT flow) → 201 `data: { story }`. `expiresAt = now + 24h`.
- `GET /v1/story/feed` → `data: { groups: [{ user: {id,name,avatarUrl}, stories: [{id,url,type,createdAt,expiresAt,viewed:boolean}], allViewed: boolean }] }`
  - Active (non-expired) stories from users the caller follows + the caller's own group FIRST. Ordered: own, then unviewed groups, then viewed.
- `POST /v1/story/:id/view` → marks viewed (upsert StoryView; ignore own stories) → `data: { storyId, viewed: true }`
- `GET /v1/story/:id/viewers` (owner only) → `data: { viewers: [{id,name,avatarUrl,viewedAt}], count }`
- `DELETE /v1/story/:id` (owner only).
- Expired stories are filtered by query (`expiresAt > now`) — no cron needed.
- Web UI: stories bar (horizontal circles, gradient ring when unviewed, "+" tile for self) at top of home feed; full-screen viewer modal with progress bars per story, tap/arrow next-prev, auto-advance (images 5s, videos on end), marks viewed, shows viewer count on own stories. Upload story = pick image/video → existing presign flow → POST /v1/story.
- Mobile UI: same bar above home feed + full-screen viewer screen (expo-av for videos), same API.

## 4) Image thumbnails on web upload

When the selected file is an IMAGE: downscale client-side via canvas (max edge 480px, jpeg q0.8), presign `kind:"thumbnail"`, PUT, pass `thumbnailUrl` to finalize (same flow videos already use). Grids/cards prefer `thumbnailUrl ?? url`. Never fail the upload if thumbnail generation fails.

## 5) Observability (backend)

- `src/middleware/requestLogger.ts`: assigns `req.id` (crypto.randomUUID), logs via winston on finish: method, route path pattern, status, durationMs, userId if present. Mounted before routes.
- `src/observability/metrics.ts`: in-memory counters `{ total, errors5xx, byRoute: Map<route,{count,totalMs}> }` updated by the same middleware; exposed via `GET /v1/admin/metrics`. No new deps.

## 6) Seed

`backend/prisma/seed.ts` (run: `npx prisma db seed`, configure `"prisma": { "seed": "ts-node prisma/seed.ts" }` in package.json):
- Idempotent: skips if users with `@seed.minly.local` already exist (or upserts by email).
- 20 users (`name`, email `user<n>@seed.minly.local`, avatar `https://i.pravatar.cc/300?img=<n>`), one linked OAuthAccount each (provider "cognito", providerId `seed:<email>`).
- Ensure `dev@minly.local` user exists and set `isAdmin: true` (upsert).
- ~40 media: images `https://picsum.photos/seed/<slug>/900/1200` (thumbnail `.../300/400`), titles/descriptions with hashtags (#travel #food #art #nature #tech...), spread createdAt over the last 14 days, random viewsCount 20..900.
- Hashtag + MediaHashtag rows synced for those tags.
- Follows (each user follows 3-8 others incl. dev user), likes (random, with counters kept consistent), 2-5 comments per media (some replies), a few bookmarks, 6-8 active stories (picsum urls) across users, 3 sample reports (PENDING) targeting random media/comments, notifications skipped (not needed).
- ALL counter columns (mediaCount, followerCount, followingCount, likesCount, commentCount, totalLikesReceived) must end consistent with the rows.

## 7) Supertest API tests

Dev deps to add: `supertest`, `@types/supertest` (installable now). Tests in `backend/src/__tests__/api/` importing `app` from `src/app`:
- Mock `requireAuth`/`requireAdmin` via jest.mock to inject a fake user (and admin variant), mock repositories/services as needed — NO database.
- Cover: 401 without token (real requireAuth path with no cookie), validation 400s (bad report body, empty comment edit), happy-path shapes for `/v1/feed/explore`, `POST /v1/report`, `GET /v1/admin/stats` (403 for non-admin, 200 for admin), `POST /v1/story` validation.

## Hard constraints

- New npm deps allowed ONLY: `supertest`, `@types/supertest` (backend devDependencies). Nothing else anywhere.
- node_modules now EXIST (Windows install). Do NOT run npm/tsc/prisma yourselves — the orchestrator verifies after.
- Match existing styles; web admin page uses the same Tailwind patterns; keep dark-mode variants.
- Do not run git commit.
