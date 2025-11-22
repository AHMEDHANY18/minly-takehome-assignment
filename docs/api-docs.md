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

