## 🛰 API Overview

All clients (Web + Mobile) communicate with a single monolithic backend via a REST API.

- **Base URL (local dev):** `http://localhost:4000`
- **Base URL (production):** `https://your-backend-domain.com` (to be set in env / config)

All protected routes require:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Authentication APIs

### 1. `POST /auth/register`

Create a new user account.

**Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "Ahmed Hany",
  "email": "ahmed@example.com",
  "password": "StrongPassword123"
}
```

**Responses:**

- `201 Created` – User created successfully

```json
{
  "user": {
    "id": "uuid",
    "name": "Ahmed Hany",
    "email": "ahmed@example.com",
    "avatarUrl": null,
    "createdAt": "2025-11-18T10:00:00.000Z"
  },
  "token": "jwt-token-here"
}
```

- `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is invalid"
  }
}
```

- `409 Conflict`

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "User with this email already exists"
  }
}
```

---

### 2. `POST /auth/login`

Authenticate a user.

**Headers:**

- `Content-Type: application/json`

```json
{
  "email": "ahmed@example.com",
  "password": "StrongPassword123"
}
```

**200 OK**

```json
{
  "user": {
    "id": "uuid",
    "name": "Ahmed Hany",
    "email": "ahmed@example.com",
    "avatarUrl": null,
    "createdAt": "2025-11-18T10:00:00.000Z"
  },
  "token": "jwt-token-here"
}
```

---

## 📸 Media APIs

### 3. `GET /media`

Paginated media list.

---

### 4. `GET /media/:id`

Returns media details.

---

### 5. `POST /media`

Upload media (image/video).

---

### 6. `DELETE /media/:id`

Delete user-owned media.

---

## ❤️ Like APIs

### 7. `POST /media/:id/like`

### 8. `POST /media/:id/unlike`

---

## 👤 Profile API

### 9. `GET /me/profile`

---

## 🩺 Health Check

### 10. `GET /health`

```json
{
  "status": "ok",
  "uptime": 1234,
  "timestamp": "2025-11-18T10:00:00.000Z"
}
```
