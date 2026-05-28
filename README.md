---
title: App Gestion Stock
emoji: 🚀
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# StorePro — Inventory Management App

A full-stack product and stock management application. Built with a **Go REST API** and a **React SPA**, deployed on Hugging Face (backend) and Vercel (frontend).

---

## What is StorePro?

StorePro lets businesses manage their product catalog from a clean dashboard. Each user has their own isolated inventory — they can add products with images, track stock levels, filter and search their catalog, and visualize key financial stats through charts.

---

## Monorepo Structure

```
App-Gestion-Produits/
├── backend/    ← Go REST API (PostgreSQL, JWT, Cloudinary, Resend)
└── frontend/   ← React SPA (Vite, React Query, Tailwind CSS, DaisyUI)
```

Each folder has its own detailed README:

- [Backend README](./backend/README.md) — API reference, architecture, tests, Docker
- [Frontend README](./frontend/README.md) — components, hooks, auth flow, deployment

---

## Tech Stack

| | Backend | Frontend |
|---|---|---|
| Language | Go 1.25 | JavaScript (React 19) |
| Build | Docker / Air | Vite 8 + React Compiler |
| Database | PostgreSQL 15 | — |
| Auth | JWT + Refresh token rotation | HTTP-only cookies + Axios interceptor |
| Storage | Cloudinary (images) | browser-image-compression |
| Email | Resend API | — |
| UI | — | Tailwind CSS v4 + DaisyUI v5 |
| Charts | — | Recharts |
| State | — | TanStack React Query v5 |
| Tests | 48 unit tests (service + handler) | — |
| Deployment | Hugging Face Spaces | Vercel |

---

## Features

- Register with email OTP verification
- Login / logout with JWT (15 min access + 30 day rotating refresh token)
- Password reset via OTP code
- Add products with image upload (JPEG/PNG, compressed client-side)
- List products with infinite scroll, filters (status, category, search)
- Edit and delete products with confirmation
- Dashboard — total products, total stock, estimated expenses, estimated revenue
- Revenue vs. expenses bar chart
- In-stock vs. out-of-stock donut chart
- Fully responsive — mobile sidebar, adaptive layouts

---

## Architecture Overview

```
┌─────────────────────────────────┐
│         React Frontend          │
│  React Query · Axios · DaisyUI  │
└────────────────┬────────────────┘
                 │ HTTPS (REST/JSON)
                 │ cookies (JWT)
┌────────────────▼────────────────┐
│          Go REST API            │
│  Handler → Service → Repository │
└──────┬──────────────┬───────────┘
       │              │
┌──────▼──────┐  ┌────▼──────────┐
│  PostgreSQL │  │  Cloudinary   │
│  (Neon DB)  │  │  (images)     │
└─────────────┘  └───────────────┘
```

The backend follows a strict **3-layer architecture** — each layer communicates through interfaces, which is what makes the 48 unit tests possible without a real database.

---

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env   # fill in DB_URL, JWT_SECRET, CLOUDINARY_URL, RESEND_API_KEY
go mod download
air                    # hot reload, or: go run ./cmd/web/
```

Server starts on `http://localhost:7860`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`.

### With Docker Compose

```bash
cd backend
docker compose up --build
```

Starts the API on port `8080` + a PostgreSQL instance on port `5432`.

---

## Tests

```bash
cd backend
go test ./...
```

48 tests — no database required, all mocked:

| Scope | Tests |
|---|---|
| Service layer (product) | 18 |
| Service layer (auth) | 16 |
| Handler layer (HTTP) | 14 |

---

## Environment Variables (Backend)

| Variable | Description |
|---|---|
| `DB_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `CLOUDINARY_URL` | Cloudinary credentials URL |
| `RESEND_API_KEY` | Resend API key for transactional emails |

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Backend API | Hugging Face Spaces | `https://babamboup697-app-gestion-stock.hf.space` |
| Frontend | Vercel | `https://app-gestion-stock-opal.vercel.app` |

The backend is containerized with a multi-stage Dockerfile — the final image is minimal Alpine with only the compiled Go binary.