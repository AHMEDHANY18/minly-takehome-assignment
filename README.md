# Minly – Media Sharing Platform (Take-Home Assignment)

A full‑stack, Instagram‑like media sharing platform where users can register/login, upload images or videos, browse a global feed, like/unlike media, and view profiles from both web and mobile clients.
Built end‑to‑end as a realistic product with production‑style architecture, cloud storage, and full system design.

---

## 🔗 Live Demos & Docs

- **Web App (Vercel):** https://minly-takehome-assignment-lo2q.vercel.app/
- **Mobile Build (Expo):** https://expo.dev/accounts/ahmedhany2003/projects/minly/builds/b3010397-9144-4adc-8efb-2f4447aa8aef
- **Postman API Docs:** https://documenter.getpostman.com/view/33115360/2sB3dHVY7T
- **Backend Base URL:** https://minly-takehome-assignment.onrender.com/v1

---

## ✨ Features

- **Authentication:** Register / Login with JWT, protected write operations.
- **Media Upload:** Image & video uploads stored on AWS S3 (presigned URLs), metadata in PostgreSQL, client-side video thumbnails.
- **Feeds:** Home (following), Explore, and Trending feeds with offset + cursor pagination (Trending page-1 cached in Redis).
- **Likes, Comments & Bookmarks:** Toggle likes, threaded comments (create / edit / delete, with `@mention` notifications), saved media.
- **Follow system:** Follow/unfollow, suggested users, follower stats.
- **Search & Hashtags:** User + media search, `#hashtag` extraction and hashtag feeds.
- **Direct Messages:** 1:1 conversations with real-time delivery (SSE) on web and polling on mobile, unread badges.
- **Notifications:** Real-time SSE stream (LIKE / COMMENT / FOLLOW / SYSTEM) with unread counters.
- **Stories:** 24-hour ephemeral stories with viewed/unviewed rings, full-screen viewer with progress bars, and viewer counts (web + mobile).
- **Views & Trending:** Per-media view counts and a time-decay trending score `(views + likes×3 + comments×5) / age^1.5`.
- **Safety & Moderation:** Block users (auto-unfollows both sides), report media / comments / users, and an admin dashboard (reports queue with content previews, force-delete, platform stats + live request metrics).
- **Profiles:** View user info, user media, basic stats; edit name & avatar.
- **Dev experience:** Database seed script (demo users/posts/stories), local dev-login (no Cognito needed), unit + API tests, CI, Docker.
- **Shared API:** One backend consumed by both web and mobile.

---

## 🧰 Tech Stack

**Backend**
- Node.js + TypeScript + Express
- Prisma ORM + PostgreSQL
- AWS S3 for media storage
- JWT auth, validation, centralized error handling
- Clean layers: Controllers → Services → Repositories

**Frontend (Web)**
- React + TypeScript + Vite
- TailwindCSS
- Centralized Axios instance + unified API layer

**Mobile**
- React Native (Expo) + TypeScript
- expo-router, expo-av, expo-secure-store
- Unified API layer

---

## 📁 Monorepo Structure

```
MINLY-TAKEHOME-ASSIGNMENT/
├── backend/          # REST API
├── minly-frontend/   # React web app
├── minly-mobile/     # Expo React Native app
├── diagrams/         # Architecture, ERD, sequence diagrams
├── docs/             # API docs + system design
└── README.md
```

**Why monorepo?**
- Single clone to run backend + web + mobile.
- Shared domain model (User, Media, Like).
- Easier review, integration, and consistent documentation.

---

## 🧾 Diagrams (System Design)

### Architecture
![Architecture Diagram](<./diagrams/Architecture Diagram.png>)

### ERD
![ERD Diagram](<./diagrams/ERD Digram.png>)

### Use Case
![Use Case Diagram](<./diagrams/useCase Digram.png>)

### Sequence Diagrams
**User Registration**
![User Registration Sequence](<./diagrams/User Registration – Sequence Diagram.png>)

**User Login**
![User Login Sequence](<./diagrams/User Login – Sequence Diagram.png>)

**View Media Feed**
![View Media Feed Sequence](<./diagrams/View Media Feed – Sequence Diagram.png>)

**Upload Media**
![Upload Media Sequence](<./diagrams/Upload Media Sequence Diagram.png>)

**Like Media**
![Like Media Sequence](<./diagrams/Like Media – Sequence Diagram.png>)

**Unlike Media**
![Unlike Media Sequence](<./diagrams/Unlike Media – Sequence Diagram.png>)

**View Profile**
![View Profile Sequence](<./diagrams/View Profile – Sequence Diagram.png>)

---

## ⚙️ Quick Start (Local)

### 1) Backend
```bash
cd backend
npm install
cp .env.example .env        # then fill in the values
docker compose up -d postgres
npx prisma db push          # apply the schema (no migration files)
npx prisma generate
npm run dev
```
API runs on: `http://localhost:4000/v1`

### 2) Web
```bash
cd minly-frontend
npm install
npm run dev
```

### 3) Mobile (Expo)
```bash
cd minly-mobile
npm install
npx expo start
```

---

## 🔐 Environment Variables

Create `backend/.env`:

```env
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...
AWS_S3_BASE_URL=https://<bucket>.s3.<region>.amazonaws.com
```

Web & Mobile (see the `.env.example` in each package):

```env
VITE_API_BASE_URL=https://minly-takehome-assignment.onrender.com/v1
EXPO_PUBLIC_API_BASE_URL=https://minly-takehome-assignment.onrender.com/v1
```

---

## 📚 More Documentation

- **API overview + endpoint purposes:** [`docs/api-docs.md`](./docs/api-docs.md)
- **Functional/Non‑Functional requirements, decisions, tradeoffs:** [`docs/system-design.md`](./docs/system-design.md)
- **API contract for the 2026-06 feature batch (search, DMs, block, report, hashtags…):** [`docs/new-features-contract.md`](./docs/new-features-contract.md)

---

## 🛣️ Future Improvements

Stories/reels, WebSocket transport for DMs, admin/moderation dashboard for reports, group conversations, push notifications (mobile), CDN (CloudFront) in front of S3, e2e tests.

---

## 👤 Author

**Ahmed Hany** – Software Engineer
Take-home assignment built end-to-end with production-style engineering practices.
