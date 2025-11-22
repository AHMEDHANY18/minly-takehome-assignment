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
- **Media Upload:** Image & video uploads stored on AWS S3, metadata in PostgreSQL.
- **Global Feed:** Public feed ordered by newest with pagination.
- **Likes:** Toggle like/unlike with accurate likes counter per media item.
- **Profiles:** View user info, user media, and basic stats.
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
npx prisma generate
npx prisma migrate dev
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

Web & Mobile:

```env
VITE_API_URL=https://minly-takehome-assignment.onrender.com/v1
EXPO_PUBLIC_API_URL=https://minly-takehome-assignment.onrender.com/v1
```

---

## 📚 More Documentation

- **API overview + endpoint purposes:** [`docs/api-docs.md`](./docs/api-docs.md)
- **Functional/Non‑Functional requirements, decisions, tradeoffs:** [`docs/system-design.md`](./docs/system-design.md)

---

## 🛣️ Future Improvements

Comments & follow system, notifications, stories/reels, real‑time updates, cursor pagination.

---

## 👤 Author

**Ahmed Hany** – Software Engineer
Take-home assignment built end-to-end with production-style engineering practices.
