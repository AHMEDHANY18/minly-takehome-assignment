# Minly – Media Sharing Platform (Take-Home Assignment)

This repository contains a full-stack implementation of a simple media sharing platform inspired by Instagram.
Users can upload images and videos, browse a global feed, and like/unlike media from both web and mobile clients.

The project is built as a **single monorepo** containing:

- `backend/` – Node.js + TypeScript REST API (media CRUD, likes, auth, AWS S3 integration)
- `web/` – React + TypeScript web application
- `mobile/` – React Native mobile application
- `docs/` – Architecture diagrams, sequence flows, and UI/UX notes

The goal is to treat this assignment as a real-world product and not just a small coding exercise.

---

## Table of Contents

1. [Project Vision](#project-vision)
2. [Core Features](#core-features)
3. [Architecture Overview](#architecture-overview)
4. [Why a Single Repository (Monorepo)?](#why-a-single-repository-monorepo)
5. [Repository Structure](#repository-structure)
6. [Tech Stack](#tech-stack)
7. [Requirements & Assumptions](#requirements--assumptions)
   - [Functional Requirements](#functional-requirements)
   - [Non-Functional Requirements](#non-functional-requirements)
   - [Assumptions](#assumptions)
8. [Backend Overview](#backend-overview)
9. [Web App Overview](#web-app-overview)
10. [Mobile App Overview](#mobile-app-overview)
11. [API Overview](#api-overview)
12. [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Clone & Install](#clone--install)
    - [Running the Backend](#running-the-backend)
    - [Running the Web App](#running-the-web-app)
    - [Running the Mobile App](#running-the-mobile-app)
13. [Environment Variables](#environment-variables)
14. [Deployment](#deployment)
15. [Future Improvements](#future-improvements)

---

## Project Vision

The project aims to implement a **simple but realistic media sharing platform**:

- Users can **upload** images and videos.
- Everyone can **browse** a global feed.
- Users can **like/unlike** media items.
- The system is accessible from a **web app** and **mobile app** (React Native).
- The backend is deployed to the cloud and uses **AWS S3** for media storage.

The focus is on:

- Clear architecture
- Code quality and maintainability
- Reasonable scalability
- A straightforward UX similar to Instagram (Light Mode, feed + upload + profile)

---

## Core Features

### 1. Authentication

- User registration (sign up)
- Login with email and password
- JWT-based authentication
- Protected endpoints for upload/like actions

### 2. Media Management

- Upload image or video files
- Store media files in AWS S3
- Persist metadata in the database (URL, type, owner, timestamps)
- List all media items in a paginated feed
- View single media details

### 3. Likes System

- Like / Unlike a media item
- Prevent duplicate likes by the same user
- Maintain a likes counter per media

### 4. User Profile

- View basic user info
- View media uploaded by the current user
- Simple statistics (optional: total uploads, total likes)

### 5. Clients

- **Web app (React + TS)** – feed, upload, like/unlike, profile
- **Mobile app (React Native)** – same core functionality, optimized for mobile UX

---

## Architecture Overview

High-level architecture:

- **Clients**
  - Web (React + TypeScript)
  - Mobile (React Native)
- **Backend API**
  - Node.js + TypeScript + Express (or Nest-like structure)
  - REST endpoints for auth, media, likes
- **Database**
  - PostgreSQL (accessed via Prisma ORM or similar)
- **Storage**
  - AWS S3 bucket for media assets
- **Auth**
  - JWT tokens, stored client-side (securely)
- **Deployment**
  - Backend deployed to a cloud provider (e.g. Render/Railway/AWS)
  - Web deployed to a static hosting (e.g. Vercel/Netlify)
  - Mobile run locally on simulator/emulator

Conceptual flow:

1. User authenticates via the backend.
2. Client uploads media to the backend.
3. Backend uploads the file to S3 and stores metadata in the DB.
4. Clients fetch paginated media lists from the backend.
5. Users like/unlike media; likes are stored in the DB and reflected in the UI.

---

## Why a Single Repository (Monorepo)?

Although the assignment includes three separate deliverables (backend, web, mobile), everything is hosted in **one private repository** for several reasons:

1. **Single Source of Truth**
   All code for the assignment lives in one place, making it easier for reviewers to clone, run, and navigate between backend, web, and mobile.

2. **Shared Context**
   The three projects share the same domain model (Media, User, Like). Keeping them together helps maintain a consistent architecture and simplifies coordination between client and server.

3. **Simplified Review & Access**
   The instructions ask to share a **private GitHub repository** with specific reviewers. Using a monorepo avoids managing and sharing multiple repos for the same assignment.

4. **Real-world Monorepo Pattern**
   Many modern teams use a monorepo for closely related services and clients. This structure mimics that approach and keeps the project scalable if more apps or services are added later (e.g. admin panel, analytics).

If needed, each folder (`backend`, `web`, `mobile`) can be extracted into a standalone repository in the future with minimal changes.

---

## Repository Structure

```txt
MINLY-TAKEHOME-ASSIGNMENT/
  README.md          # Root documentation (this file)
  backend/           # Node.js + TypeScript backend (REST API)
  web/               # React + TypeScript web application
  mobile/            # React Native mobile application
  docs/              # Architecture diagrams, flows, and notes
