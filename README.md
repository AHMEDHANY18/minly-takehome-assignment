# Minly – Media Sharing Platform (Take-Home Assignment)

This repository contains a full-stack implementation of a realistic media sharing platform inspired by Instagram.
Users can upload images and videos, browse a global feed, and like/unlike media from both web and mobile clients.

The project is implemented as a **single monorepo**, containing:

- `backend/` – Node.js + TypeScript REST API (media CRUD, likes, auth, AWS S3 integration)
- `web/` – React + TypeScript web application
- `mobile/` – React Native mobile application
- `docs/` – Architecture diagrams, sequence flows, and UI/UX documentation

This assignment is approached as a **real-world product**, not just a coding exercise.

---

## 📂 Repository Structure

```txt
MINLY-TAKEHOME-ASSIGNMENT/
  README.md
  backend/
  web/
  mobile/
  docs/
```

### Why a Single Monorepo?

* Easier for reviewers to clone and test all components.
* Backend, web, and mobile share the same domain model (Media, User, Like), so keeping them together ensures consistency.
* Matches the assignment requirement of one private GitHub repository.
* Easier integration, unified documentation, shared architecture, and quicker setup.

---

## 🎯 Project Vision

The aim of Minly is to build a **simple, scalable, maintainable media platform** where users can:

* Upload images/videos
* Browse a global feed
* Like/unlike media
* View their own uploads
* Access the platform from web and mobile

Focusing on:

* Clean architecture
* Cloud storage
* Realistic UX
* Code quality
* Maintainability

---

## 🔧 Core Features

### 1. Authentication

* User registration
* Login with email & password
* JWT-based authentication
* Protected endpoints

### 2. Media Management

* Upload image/video files
* Store files in AWS S3
* Save metadata to DB
* Delete media (owner only)
* View feed with pagination
* View media details

### 3. Likes System

* Like/unlike
* Prevent duplicate likes
* Maintain likes count

### 4. User Profile

* View user info
* View user uploads
* Optional statistics

### 5. Clients

* React Web App
* React Native Mobile App
* Both use the same backend API

---

## 🏗 Architecture Overview

### Clients

* **Web** – React + TS
* **Mobile** – React Native + TS

### Backend API

* Node.js + TypeScript
* Express-style routing
* AWS S3 integration
* JWT authentication
* REST endpoints

### Database

* PostgreSQL
* Prisma ORM

### Storage

* AWS S3 bucket

### Deployment

* Backend → Render/Railway/AWS
* Web → Vercel/Netlify
* Mobile → runs locally (Android/iOS simulators)

### Conceptual Flow

1. User authenticates
2. Client uploads file → backend → S3
3. Metadata stored in DB
4. Feed fetched paginated
5. Users like/unlike media

---

# 📘 Functional Requirements

### **1. Authentication**

* Register using name, email, password
* Login & receive JWT
* Auth required for:

  * Upload
  * Like/unlike
  * Delete media
  * User profile actions

### **2. Media Management**

* Upload image or video
* Accept only supported formats
* Store file in S3
* Save metadata in DB
* Delete media (only uploader)
* Get media by ID

### **3. Feed**

* Global feed for all users
* Sort by newest
* Support pagination: `page`, `limit`
* Filter by type: `image`, `video`

### **4. Likes**

* Like media once
* Unlike media
* Auto-update count

### **5. User Profile**

* View basic info
* View user uploads
* Stats (uploads count, likes count – optional)

### **6. Web App**

* Login / Signup
* Feed view
* Upload flow (title, desc, file)
* Profile
* Like/unlike

### **7. Mobile App**

* Same flows as web
* Mobile-first UX
* Light Mode UI

---

# 📙 Non-Functional Requirements

### **Security**

* JWT authentication
* File type validation
* Max file size (50 MB)
* Hash passwords (bcrypt)
* Protect AWS credentials
* CORS for web & mobile

### **Scalability**

* Use S3 for file storage
* Pagination for feed
* Indexed DB queries
* Modular architecture

### **Maintainability**

* Clean folder structure
* Reusable services
* TypeScript strict mode
* ESLint + Prettier
* Clear separation of concerns

### **Performance**

* Lazy loading images
* Efficient streaming for uploads
* Optimized queries
* Minimized payloads

---

# 🧩 Domain Model

### **User**

* id
* name
* email (unique)
* passwordHash
* createdAt

**Relations:**

* User → Media (1-to-many)
* User → Likes (1-to-many)

---

### **Media**

* id
* url
* type (IMAGE | VIDEO)
* title
* description
* uploaderId
* likesCount
* createdAt

**Relations:**

* Media → Likes (1-to-many)

---

### **Like**

* id
* userId
* mediaId
* createdAt

**Constraints:**

* Unique (userId, mediaId)

---

### ERD (Text Format)

```
User (1) ---- (many) Media
User (1) ---- (many) Likes
Media (1) ---- (many) Likes
```

---

# 📕 Assumptions

1. Only authenticated users can upload or like media.
2. The feed is public: all users see all uploads.
3. Supported file formats:

   * Images: JPG, JPEG, PNG, WebP
   * Videos: MP4
4. Maximum upload size = 50MB.
5. S3 handles all media storage (no local storage).
6. Only uploaders can delete their media.
7. No comments or followers system in this scope.
8. No video compression/transcoding implemented.
9. Mobile & web consume the same backend API.
10. Rate limiting is optional and can be added later.

---

# 🚀 Next Steps (Backend, Web, Mobile)

Documentation for:

* API structure
* Database schema
* Setup & environment variables
* Deployment instructions

…will be added in `docs/` and in each project folder.

---

# ✔ End of README.md
