---
title: App Gestion Stock
emoji: 🚀
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# StorePro — Inventory Management API

A RESTful backend API for managing products, stock, and users. Built with Go, PostgreSQL, and deployed via Docker.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)

---

## Overview

StorePro is a product inventory management API that allows users to register, manage their own product catalog, track stock levels, and visualize dashboard statistics. Each user only has access to their own data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Go 1.25 |
| HTTP Router | `net/http` (stdlib) + `justinas/alice` |
| Database | PostgreSQL 15 (via `pgx`) |
| Authentication | JWT (access token) + Refresh token rotation |
| Image Storage | Cloudinary |
| Email | Resend API |
| Hot Reload (dev) | Air |
| Containerization | Docker + Docker Compose |
| Deployment | Hugging Face Spaces / VPS |

---

## Architecture

The codebase follows a clean **3-layer architecture**:

```
HTTP Request
    ↓
Handler (cmd/web/)       ← parses input, calls service, writes response
    ↓
Service (internal/service/)  ← business logic, validation, orchestration
    ↓
Repository (internal/repository/)  ← SQL queries, database access
    ↓
PostgreSQL
```

Each layer depends only on the layer below it via interfaces, making the service layer fully testable without a real database.

---

## Features

- **User registration** with email OTP verification
- **JWT authentication** with short-lived access tokens (15 min) and rotating refresh tokens (30 days)
- **Password reset** via email OTP code
- **Product management** — create, read, update, delete (scoped per user)
- **Cursor-based pagination** for efficient product listing
- **Filtering** by status, category, and search term
- **Image upload** to Cloudinary with format validation (JPEG/PNG, 5 MB max)
- **Dashboard statistics** — total products, total stock, estimated costs and revenue, in-stock vs. out-of-stock counts
- **Middleware** — panic recovery, structured JSON logging, CORS

---

## API Reference

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/register` | Register a new user |
| `POST` | `/api/verify` | Verify email with OTP code |
| `POST` | `/api/resend-otp` | Resend OTP code |
| `POST` | `/api/login` | Login and receive tokens |
| `POST` | `/api/refresh` | Rotate access + refresh tokens |
| `POST` | `/api/password-reset-request` | Request a password reset code |
| `POST` | `/api/password-reset` | Reset password with code |
| `POST` | `/api/upload` | Upload a product image |

### Protected Routes (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/check-auth` | Verify authentication status |
| `GET` | `/api/user` | Get current user profile |
| `POST` | `/api/logout` | Logout and invalidate refresh token |
| `POST` | `/api/create-product` | Add a new product |
| `GET` | `/api/products` | List products (paginated + filtered) |
| `PUT` | `/api/products/{id}` | Update a product |
| `DELETE` | `/api/products/{id}` | Delete a product |
| `GET` | `/api/stats` | Get dashboard statistics |

### Query Parameters for `GET /api/products`

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | int | Number of results (1–100, default: 20) |
| `cursor` | int | Last product ID for pagination |
| `status` | string | Filter by `En Stock` or `Rupture` |
| `category` | string | Filter by category name |
| `search` | string | Search by product name (max 100 chars) |

### Response Format

All endpoints return a consistent JSON envelope:

```json
{
  "status": 200,
  "data": { ... }
}
```

Errors:

```json
{
  "status": 400,
  "error": "error message"
}
```

---

## Authentication Flow

```
1. POST /api/register       → user created, OTP sent by email
2. POST /api/verify         → account activated
3. POST /api/login          → returns access_token (cookie, 15 min)
                               + refresh_token (cookie, 30 days)
4. Protected requests       → access_token read from cookie by middleware
5. POST /api/refresh        → old refresh token invalidated, new pair issued
6. POST /api/logout         → refresh token deleted from DB
```

Access tokens are stored as **HTTP-only cookies**. Refresh tokens are rotated on every use (one-time tokens stored hashed in the database).

---

## Getting Started

### Prerequisites

- Go 1.25+
- PostgreSQL 15+
- A [Cloudinary](https://cloudinary.com) account
- A [Resend](https://resend.com) account

### Local Development

```bash
# Clone the repository
git clone https://gitlab.com/babamboup697/app-gestion-stock.git
cd app-gestion-stock/backend

# Install dependencies
go mod download

# Copy and fill in environment variables
cp .env.example .env

# Run with hot reload (requires Air)
air

# Or run directly
go run ./cmd/web/
```

The server starts on `http://localhost:7860`.

---

## Environment Variables

Create a `.env` file at the root of the `backend/` directory:

```env
DB_URL=postgres://user:password@host:5432/dbname
JWT_SECRET=your-secret-key
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
RESEND_API_KEY=re_xxxxxxxxxxxx
```

| Variable | Description |
|----------|-------------|
| `DB_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `CLOUDINARY_URL` | Cloudinary credentials URL |
| `RESEND_API_KEY` | Resend API key for transactional emails |

---

## Running Tests

Unit tests cover the full service layer (34 tests) using in-memory mocks — no database required.

```bash
go test ./internal/service/... -v
```

Test files:

| File | Coverage |
|------|----------|
| `mocks_test.go` | Shared mock implementations and helpers |
| `product_service_test.go` | AddProduct, GetProductsByUser, Delete, Update, Dashboard |
| `auth_service_test.go` | Register, Login, Activate, Reset password, Refresh, Logout |

---

## Docker Deployment

### Build and run with Docker Compose

```bash
docker compose up --build
```

This starts:
- `app_backend` — the Go API on port `8080`
- `app_db` — PostgreSQL 15 on port `5432`

### Build the image manually

```bash
docker build -t storepro-backend .
docker run -p 8080:8080 --env-file .env storepro-backend
```

The Dockerfile uses a **multi-stage build**: compiles the binary in a `golang:alpine` builder, then copies only the binary into a minimal `alpine` image.

---

## Project Structure

```
backend/
├── cmd/web/
│   ├── main.go                 # Entry point, dependency wiring
│   ├── routes.go               # HTTP routes and server setup
│   ├── middleware.go           # Logger, RecoverPanic, CORS, requireAuth
│   ├── helpers.go              # sendJSON, sendError, sendFieldErrors
│   ├── auth_handler.go         # Register, login, OTP, password reset
│   ├── products_handler.go     # Product CRUD + image upload
│   └── user_handler.go         # User profile
├── internal/
│   ├── models/
│   │   └── models.go           # User, Product, DashboardStats, ProductFilter
│   ├── repository/
│   │   ├── auth_repo.go        # Auth SQL queries
│   │   ├── product_repo.go     # Product SQL queries
│   │   └── user_repo.go        # User SQL queries
│   ├── service/
│   │   ├── auth_service.go     # Auth business logic
│   │   ├── product_service.go  # Product business logic
│   │   ├── user_service.go     # User business logic
│   │   ├── errors.go           # Sentinel errors
│   │   ├── service.go          # Mailer interface
│   │   ├── auth_service_test.go
│   │   ├── product_service_test.go
│   │   └── mocks_test.go
│   ├── config/
│   │   ├── config.go           # PostgreSQL connection
│   │   └── cloudinary.go       # Cloudinary client
│   ├── mailer/
│   │   └── mailer.go           # Resend email sender
│   └── validator/
│       ├── validator.go        # Form validation helpers
│       └── otp.go              # OTP generator
├── Dockerfile
├── docker-compose.yml
├── .air.toml                   # Hot reload config
└── go.mod
```