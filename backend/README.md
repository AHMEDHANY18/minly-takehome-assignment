# Minly Backend

Express + TypeScript + Prisma (PostgreSQL) REST API for the Minly media-sharing app.
Auth is handled with AWS Cognito, media storage with AWS S3 (presigned uploads), realtime
notifications/DMs with SSE, and an optional Redis cache for the trending feed.

## Stack

- Node.js 20, Express 4, TypeScript
- Prisma ORM + PostgreSQL
- AWS Cognito (OAuth / JWT) and AWS S3 (presigned PUT uploads)
- Server-Sent Events for realtime notifications & direct messages
- Redis (optional) — trending feed cache; the app works without it
- Jest + ts-jest for unit tests

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# fill in the values (see table below)
```

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | no | `development` (default) or `production` |
| `PORT` | no | HTTP port (default `4000`) |
| `CORS_ORIGINS` | no | Comma-separated allowed origins (default `http://localhost:5173`) |
| `COOKIE_SAMESITE` | no | `lax` / `strict` / `none` |
| `DATABASE_URL` | **yes** | PostgreSQL connection string |
| `COGNITO_DOMAIN` | **yes** | Cognito hosted-UI domain |
| `COGNITO_CLIENT_ID` | **yes** | Cognito app client id |
| `COGNITO_CLIENT_SECRET` | **yes** | Cognito app client secret |
| `COGNITO_CALLBACK_URL` | **yes** | OAuth callback URL |
| `COGNITO_JWKS_URL` | **yes** | JWKS endpoint for token verification |
| `COGNITO_REGION` | **yes** | AWS region of the user pool |
| `COGNITO_USER_POOL_ID` | **yes** | Cognito user pool id |
| `COGNITO_FORCE_LOGIN` | no | `true` to always show the login screen |
| `AWS_ACCESS_KEY_ID` | **yes** | S3 credentials |
| `AWS_SECRET_ACCESS_KEY` | **yes** | S3 credentials |
| `AWS_REGION` | **yes** | S3 region |
| `AWS_S3_BUCKET` | **yes** | S3 bucket for media/avatars/thumbnails |
| `REDIS_URL` | no | e.g. `redis://:pass@host:6379` — enables trending cache |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | no | alternative to `REDIS_URL` |

### 3. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 4. Apply the Prisma schema

This repo does not use migration files for the new models — push the schema directly:

```bash
npx prisma db push
npx prisma generate
```

### 5. Run

```bash
npm run dev      # ts-node-dev with reload
# or
npm run build    # prisma generate && tsc
npm start        # node dist/server.js
```

### Docker

```bash
docker compose up --build   # postgres + backend (multi-stage Dockerfile)
```

## Tests

```bash
npm test
```

Unit tests live in `src/__tests__/` and mock all repositories — no database or network needed.

## API overview (all under `/v1`, auth required unless noted)

| Area | Routes |
| --- | --- |
| Auth | `POST/GET /auth/...` (login, callback, refresh, logout, me — public flow) |
| Media | `POST /media/presign` (kinds: `media`, `avatar`, `thumbnail`), `POST /media/finalize` (optional `thumbnailUrl`), `GET /media/search?q=`, `GET /media/hashtag/:tag`, `GET /media/:mediaId/details`, `PATCH /media/:id`, `DELETE /media/:id` |
| Feeds | `GET /feed/home`, `GET /feed/trending` (60s Redis cache on page 1), `GET /feed/explore` — all support `page`/`limit` and cursor pagination via `cursor` |
| Users | `GET /user/search?q=`, `GET /user/suggested`, `GET /user/me`, `GET /user/profile[/:userId]`, `GET /user/:userId/media`, `GET /user/:id`, `PATCH /user` |
| Likes | `POST /like/:id` (toggle) |
| Comments | `POST /comment/:id/add-comment`, `PATCH /comment/:commentId` (owner, 1–500 chars), `DELETE /comment/:commentId`, `GET /comment/:commentId/replies` |
| Follow | `POST /follow/:id` (toggle), `GET /follow/:id` |
| Block | `POST /block/:userId` (toggle, removes follows both ways), `GET /block` |
| Report | `POST /report` (duplicate returns existing), `GET /report/mine` |
| Conversations | `POST /conversation` (get-or-create 1:1), `GET /conversation`, `GET /conversation/:id/messages?cursor=`, `POST /conversation/:id/messages`, `PATCH /conversation/:id/read`, `GET /conversation/unread-count` |
| Bookmarks | `POST /bookmark/:mediaId` (toggle), `GET /bookmark` |
| Notifications | `GET /notification`, `GET /notification/stream` (SSE — also delivers `{ kind: "MESSAGE" }` DM events), `GET /notification/unread-count`, `PATCH /notification/:id/read`, `PATCH /notification/read-all` |

Responses use the envelope `{ "status": "success", "data": ... }`; errors use
`{ "status": "error", "message": "..." }`.
