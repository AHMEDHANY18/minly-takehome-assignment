# Minly – Media Sharing Platform (Take-Home Assignment)

This repository contains a full-stack implementation of a realistic media sharing platform inspired by Instagram.
Users can upload images and videos, browse a global feed, and like/unlike media from both web and mobile clients.

The project is implemented as a **single monorepo**, containing:

- `backend/` – Node.js + TypeScript REST API (media CRUD, likes, auth, AWS S3 integration)
- `web/` – React + TypeScript web application
- `mobile/` – React Native mobile application
- `docs/` – Architecture, API documentation, and system design notes

This assignment is approached as a **real-world product**, not just a coding exercise.

---

## 📂 Repository Structure

```txt
MINLY-TAKEHOME-ASSIGNMENT/
  README.md                # Main documentation (this file)
  backend/
    diagrams/              # PNG diagrams (architecture, ERD, sequences)
  web/
  mobile/
  docs/
    api-docs.md            # Detailed API reference
```

### Why a Single Monorepo?

* Easier for reviewers to clone and test all components.
* Backend, web, and mobile share the same domain model (Media, User, Like), so keeping them together ensures consistency.
* Matches the assignment requirement of a single private GitHub repository.
* Easier integration, unified documentation, shared architecture, and quicker setup.
* Mirrors a real-world monorepo setup used in many teams.

---

## 🎯 Project Vision

The aim of Minly is to build a **simple, scalable, maintainable media platform** where users can:

* Upload images/videos
* Browse a global feed
* Like/unlike media
* View their own uploads and stats
* Access the platform from both web and mobile apps

Focusing on:

* Clean architecture
* Cloud storage
* Realistic UX (Instagram-like, Light Mode)
* Code quality
* Maintainability

---

## 🔧 Core Features

### 1. Authentication

* User registration
* Login with email & password
* JWT-based authentication
* Protected endpoints for write operations

### 2. Media Management

* Upload image/video files
* Store files in AWS S3
* Save metadata in PostgreSQL
* Delete media (owner only)
* View feed with pagination
* View media details

### 3. Likes System

* Like/unlike media
* Prevent duplicate likes for the same user/media
* Maintain a likes counter per media item

### 4. User Profile

* View user info
* View user uploads
* Profile statistics:

  * Total media uploaded
  * Total likes received on user’s media
  * Total likes given by the user (optional)

### 5. Clients

* React Web App
* React Native Mobile App
* Both consume the same backend API

---

## 🏗 Architecture Overview

### Clients

* **Web** – React + TypeScript
* **Mobile** – React Native + TypeScript

### Backend API (Monolith)

* Node.js + TypeScript
* Express-style routing (controllers)
* Domain services (Auth, Media, Likes, Profile)
* Data access layer using Prisma
* Integration with AWS S3
* JWT authentication
* Centralized error handling and validation

### Database

* PostgreSQL
* Prisma ORM for schema and migrations

### Storage

* AWS S3 bucket for image and video files

### Deployment

* Backend → Render/Railway/AWS
* Web → Vercel/Netlify (or similar static hosting)
* Mobile → runs locally on Android/iOS simulators for this assignment

### Conceptual Flow

1. User authenticates via `/auth/register` or `/auth/login`.
2. Client uploads file → Backend → S3.
3. Backend saves media metadata in PostgreSQL.
4. Clients fetch paginated feed from `/media`.
5. Users like/unlike media via `/media/:id/like` and `/media/:id/unlike`.
6. Users open their profile via `/me/profile` to see info, uploads, and stats.

---

## 📡 API Documentation

Full API reference (endpoints, requests, responses, error formats) is documented in:

👉 **[`docs/api-docs.md`](./docs/api-docs.md)**

---

## 🧩 Functional Requirements

### 1. Authentication

* Register using name, email, password.
* Login & receive JWT.
* Authentication is required for:

  * Uploading media
  * Liking/unliking
  * Deleting media
  * Accessing profile information

### 2. Media Management

* Upload image or video.
* Accept only supported formats.
* Store file in S3.
* Save metadata in DB.
* Delete media (only uploader).
* Get media by ID.

### 3. Feed

* Global feed for all users.
* Sort by newest.
* Support pagination: `page`, `limit`.
* Optional filter by type: `image`, `video`.

### 4. Likes

* Like a media item once per user.
* Unlike media.
* Auto-update likes counter.

### 5. User Profile

* View basic user info.
* View all media uploaded by the user.
* View stats:

  * uploads count
  * total likes received
  * total likes given (optional)

### 6. Web App

* Login / Signup.
* Feed view.
* Upload flow (title, description, file).
* Like/unlike.
* Profile page.

### 7. Mobile App

* Same flows as web.
* Mobile-first UX.
* Light Mode UI.

---

## 📙 Non-Functional Requirements

### Security

* JWT authentication for protected endpoints.
* File type validation.
* Maximum file size (50 MB).
* Passwords hashed using bcrypt.
* AWS credentials and secrets stored in environment variables.
* CORS configured for web and mobile origins.

### Scalability

* S3 used for file storage instead of local disk.
* Pagination used for feed responses.
* Indexed DB queries on frequently accessed fields.
* Modular backend architecture to allow future extraction into services if needed.

### Maintainability

* Clean folder structure (modules: auth, media, likes, profile).
* Reusable services and utilities.
* TypeScript strict mode.
* ESLint + Prettier for formatting and linting.
* Clear separation of concerns (controller → service → repository → DB).

### Performance

* Lazy loading images on the client side.
* Efficient streaming/handling for uploads.
* Optimized DB queries.
* Minimized JSON payloads (only necessary fields returned).

---

## 🧩 Domain Model

### User

* `id` – UUID
* `name` – string
* `email` – unique string
* `passwordHash` – string
* `avatarUrl` – string (optional)
* `mediaCount` – int
* `totalLikesReceived` – int
* `totalLikesGiven` – int
* `createdAt` – datetime
* `updatedAt` – datetime

**Relations:**

* User → Media (1-to-many)
* User → Likes (1-to-many)

---

### Media

* `id` – UUID
* `url` – string
* `thumbnailUrl` – string (optional)
* `type` – `IMAGE` or `VIDEO`
* `title` – string
* `description` – string
* `uploaderId` – UUID
* `likesCount` – int
* `createdAt` – datetime
* `updatedAt` – datetime

---

### Like

* `id` – UUID
* `userId` – UUID
* `mediaId` – UUID
* `createdAt` – datetime

**Constraints:** unique (userId, mediaId)

---

### ERD (Text Format)

```txt
User (1) ---- (many) Media
User (1) ---- (many) Likes
Media (1) ---- (many) Likes
```

---

## 🧾 Diagrams

Stored under `backend/diagrams`:

* Architecture Diagram.png
* ERD Diagram.png
* Sequence diagrams for:
  * Registration
  * Login
  * View Feed
  * Upload Media
  * Like Media
  * Unlike Media
  * View Profile

---

## 📕 Assumptions

1. Only authenticated users can upload or like media.
2. Feed is public.
3. Supported formats: JPG, PNG, WebP, MP4.
4. Max file size: 50MB.
5. S3 for all file storage.
6. Only uploader can delete media.
7. No comments/followers system.
8. No transcoding.
9. Same API for Web & Mobile.
10. Rate limiting is future improvement.

---

## 🚀 Next Steps

* Backend:
  * Prisma schema + migrations
  * Implement auth/media/likes/profile modules
  * S3 integration
* Web:
  * React setup
  * Auth, feed, upload, profile
* Mobile:
  * React Native setup
  * Same flows
* Deployment:
  * Environment variables
  * Deploy backend + web

---
