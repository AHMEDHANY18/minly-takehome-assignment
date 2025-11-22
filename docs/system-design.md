# Minly – System Design & Analysis

This document summarizes the system analysis, functional/non-functional requirements, key design decisions, and tradeoffs behind **Minly – Media Sharing Platform**.

The goal is to present the take-home as a realistic, production-minded product with clear architecture and future scalability in mind.

---

## 1. High-Level Overview

Minly is a media sharing platform (Instagram-like) that allows users to:
- Register / Login
- Upload images or videos
- Browse a global feed
- Like / Unlike media
- View profiles and user media

The system is delivered end-to-end:
- REST API backend
- Web client (React)
- Mobile client (Expo React Native)

---

## 2. Architecture

### 2.1 Backend Style
- **Monolithic REST API**, built with Node.js + TypeScript.
- Designed with modular boundaries so it can evolve into services later if required.

### 2.2 Layered Structure
The backend follows a clean separation of concerns:

1. **Routes**
   - Map endpoints to controllers.

2. **Controllers**
   - Handle request parsing & validation.
   - Call services.
   - Return consistent API responses.

3. **Services (Business Logic)**
   - Contains use-case logic (Feed, Upload, Likes, Profile, Auth).
   - Handles pagination rules, ownership checks, edge cases.

4. **Repositories (Data Access)**
   - Prisma queries only (no business rules).
   - Transactional operations where needed.

5. **Middlewares**
   - JWT auth
   - Error handler
   - Validation
   - Multer file parsing

### 2.3 Storage
- **AWS S3** for all media files.
- Database stores **metadata + URLs**, not raw blobs.

---

## 3. Diagrams (Embedded)

### 3.1 Architecture Diagram
![Architecture Diagram](<../diagrams/Architecture Diagram.png>)

### 3.2 ERD Diagram
![ERD Diagram](<../diagrams/ERD Digram.png>)

### 3.3 Use Case Diagram
![Use Case Diagram](<../diagrams/UseCase Digram.png>)

### 3.4 Sequence Diagrams

**User Registration**
![User Registration Sequence](<../diagrams/User Registration – Sequence Diagram.png>)

**User Login**
![User Login Sequence](<../diagrams/User Login – Sequence Diagram.png>)

**View Media Feed**
![View Media Feed Sequence](<../diagrams/View Media Feed – Sequence Diagram.png>)

**Upload Media**
![Upload Media Sequence](<../diagrams/Upload Media Sequence Diagram.png>)

**Like Media**
![Like Media Sequence](<../diagrams/Like Media – Sequence Diagram.png>)

**Unlike Media**
![Unlike Media Sequence](<../diagrams/Unlike Media – Sequence Diagram.png>)

**View Profile**
![View Profile Sequence](<../diagrams/View Profile – Sequnce Diagram.png>)

---

## 4. Domain Model

### Entities

**User**
- id (UUID)
- name
- email (unique)
- passwordHash
- avatarUrl (optional)
- mediaCount
- totalLikesReceived
- totalLikesGiven
- createdAt / updatedAt

**Media**
- id (UUID)
- url (S3 public URL)
- thumbnailUrl (optional for videos)
- type (IMAGE | VIDEO)
- title / description
- uploaderId
- likesCount
- createdAt / updatedAt

**Like**
- id (UUID)
- userId
- mediaId
- createdAt
- Unique constraint: (userId, mediaId)

### Relations (ERD)
User (1) ---- (many) Media
User (1) ---- (many) Like
Media (1) ---- (many) Like


---

## 5. Functional Requirements (FR)

### FR-1 Authentication
- Register with name, email, password.
- Login with email, password.
- JWT token returned on success.
- Protected operations require JWT.

### FR-2 Upload Media
- Authenticated user uploads image/video (multipart).
- Validate file type and size.
- Upload to S3 → store URL + metadata in DB.
- Increment `mediaCount`.

### FR-3 Global Feed
- Public feed sorted by newest.
- Pagination using `page` and `limit`.
- Returns `{ items, pagination }`.

### FR-4 Like / Unlike
- Authenticated users can like/unlike.
- One like per user per media.
- Like is **toggle-based**: same endpoint handles like/unlike.
- Update `likesCount` atomically.
- Supports `isLikedByCurrentUser` in feed response.

### FR-5 Delete Media
- Only uploader can delete.
- Delete safely even if media has likes.

### FR-6 Profile
- View user basic info.
- View all uploaded media.
- Show stats:
  - total uploads
  - likes received
  - likes given

---

## 6. Non-Functional Requirements (NFR)

### NFR-1 Security
- JWT auth for protected routes.
- Passwords hashed using bcrypt.
- File validation (type + size).
- Secrets in `.env` only.
- CORS configured for web/mobile origins.

### NFR-2 Performance
- Pagination for feed to avoid heavy payloads.
- Prisma queries return minimal necessary fields.
- Like toggle avoids extra round trips.
- Clients lazy-load media lists.

### NFR-3 Scalability
- S3 external storage (no local disk).
- Modular backend to enable future extraction (Media Service / Feed Service / Auth Service).
- Indexed/unique constraints on hot paths:
  - `email`
  - `(userId, mediaId)` for likes

### NFR-4 Maintainability
- Controllers → Services → Repositories separation.
- TypeScript strictness across layers.
- Unified API layer in web/mobile to avoid duplicated endpoint logic.
- Consistent response shape & centralized error formatting.

### NFR-5 Reliability & Observability
- Centralized error handler.
- Explicit status codes + error codes.
- Health endpoint for uptime checks.
- Fail-safe behavior for S3 or DB failures.

---

## 7. Technology Choices (Why These Tools?)

### 7.1 Why React Native (Expo) for Mobile?
- **Cross-platform delivery**: one codebase for Android/iOS.
- **Fast iteration with Expo**: ideal for take-home speed + reliability.
- **Shared domain with web**: same Media/User/Like flows reused easily.
- **Production-ready path**: can later eject to native if needed.

### 7.2 Why Vite for Web Frontend?
- **Very fast dev + build** (better DX than CRA).
- **Modern React + TS starter** with minimal configuration.
- **Optimized bundling** and clean project structure for take-home review.
- Fits a lightweight, client-heavy app (feed + uploads).

### 7.3 Why Prisma + PostgreSQL in Backend?
- **Relational model fits strongly** (users/media/likes).
- **Prisma gives type-safe queries + migrations** → fewer runtime bugs.
- **Transactions support** needed for safe delete & like consistency.
- PostgreSQL is stable, scalable, and matches real product needs.

---

## 8. Key Design Decisions & Tradeoffs

### Decision-1: Monorepo
**Why**
- Single clone to run backend + web + mobile.
- Shared domain understanding between clients.
- Faster review & integration.

**Tradeoff**
- Repo grows faster; needs folder discipline.

---

### Decision-2: AWS S3 for Media Storage
**Why**
- Media files are large; DB/local disk is not suitable.
- Enables horizontal scaling without file sync issues.

**Tradeoff**
- Requires S3 credentials + public bucket config.

---

### Decision-3: Like Toggle Endpoint
**Why**
- 1 endpoint reduces client complexity.
- Prevents race/duplicate likes via unique constraint.

**Tradeoff**
- Slightly more logic in service.

---

### Decision-4: Offset Pagination (`page`, `limit`)
**Why**
- Simple for take-home + Instagram-style feed.
- Easy to implement on both clients.

**Tradeoff**
- Deep pages can be slower than cursor pagination, but acceptable here.

---

### Decision-5: Safe Delete with Transaction
When deleting media, likes referencing it must be removed first to avoid FK errors.

**Implementation**
- Prisma transaction:
  1) deleteMany likes by mediaId
  2) delete media

**Tradeoff**
- Two operations, but guarantees integrity.

---

## 9. Edge Cases Handled

- **Duplicate likes** prevented by unique constraint.
- **Unlike without a like** is safe (toggle just removes).
- **Deleting media with likes** handled via transaction.
- **Unauthorized operations** return 401/403 with consistent errors.
- **Invalid file types or oversize files** return validation error.
- **Pagination bounds** enforce limit caps.

---

## 10. Assumptions

1. Feed is public.
2. Only authenticated users can upload/like/delete.
3. Supported formats: JPG, PNG, WebP, MP4.
4. Max file size: 50MB.
5. No comments/follow system in this version.
6. No video transcoding.
7. Same REST API for web & mobile.
8. Rate limiting is planned as future work.

---

## 11. Future Improvements

- Comments system.
- Follow/unfollow + personalized feed.
- Notifications.
- Stories/Reels.
- Realtime updates (WebSockets).
- Cursor-based pagination for deep scrolling.
- Background jobs (queues) for heavy tasks.
- Optional microservices split.

---

## 12. References

- **Diagrams:** `/diagrams`
- **API Docs:** `/docs/api-docs.md`
- **Postman Collection:** https://documenter.getpostman.com/view/33115360/2sB3dHVY7T
