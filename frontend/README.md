# StorePro — Inventory Management Frontend

A modern, responsive React application for managing products and stock. Paired with the [StorePro Go backend](../backend/README.md) and deployed on Vercel.

> **AI-assisted development:** GitHub Copilot was used throughout this frontend to fix bugs, implement complex logic (infinite pagination, token refresh interceptor, image compression pipeline), and build solid, performant components.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Pages & Components](#pages--components)
- [Architecture](#architecture)
- [Authentication Flow](#authentication-flow)
- [Getting Started](#getting-started)
- [Environment & Proxy](#environment--proxy)
- [Project Structure](#project-structure)

---

## Overview

StorePro frontend is a single-page application built with React 19 and Vite. It provides a complete product management dashboard — from user registration with OTP verification, to product CRUD with image upload, filtering, infinite scroll, and real-time dashboard statistics with charts.

The UI is fully in French and uses FCFA as the currency format.

---

## Tech Stack

| Category | Library / Tool |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 8 + React Compiler |
| Routing | React Router v7 |
| Server State | TanStack React Query v5 |
| Forms | React Hook Form v7 |
| HTTP Client | Axios |
| UI Framework | Tailwind CSS v4 + DaisyUI v5 |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Image Compression | browser-image-compression |
| Linting / Formatting | ESLint + Prettier + prettier-plugin-tailwindcss |
| Deployment | Vercel |

---

## Features

- **Registration** with email OTP verification
- **Login / Logout** with JWT stored in HTTP-only cookies
- **Automatic token refresh** — Axios interceptor silently retries on 401
- **Forgot password** — two-step flow (email → OTP code → new password)
- **Product management** — create, edit, delete with confirmation dialog
- **Image upload** with client-side compression (auto-compressed to < 0.5 MB)
- **Infinite scroll** pagination for the product list
- **Filtering** by status, category, and search term
- **Dashboard statistics** — total products, estimated expenses, estimated revenue, total stock
- **Charts** — revenue vs. expenses bar chart, in-stock vs. out-of-stock donut chart
- **Responsive design** — mobile sidebar toggle, adaptive layouts
- **Route protection** — unauthenticated users are redirected to login

---

## Pages & Components

### Pages

| Page | Route | Description |
|------|-------|-------------|
| `Login` | `/` | Email + password login form |
| `Register` | `/register` | Name, email, password registration |
| `ValideCode` | `/validCode` | 6-digit OTP verification |
| `ForgotPassword` | `/password` | Two-step password reset |
| `Dashboard` | `/dashboard` | Stats cards + charts + recent products |
| `Products` | `/products` | Add product form + full product list |

### Key Components

| Component | Description |
|-----------|-------------|
| `DashboardLayout` | Main layout wrapper with sidebar and header |
| `Sidebar` | Desktop/mobile navigation with logout |
| `Header` | User avatar with initials, mobile menu toggle |
| `AddProductForm` | Product creation with image upload and compression |
| `AllProducts` | Infinite scroll table with filters and edit/delete actions |
| `EditProductModal` | DaisyUI modal for updating product details |
| `RecentProductsTable` | Last 20 products on the dashboard |
| `SimpleStatsCard` | Reusable stat card (icon + title + value) |
| `RevenueChart` | Bar chart — estimated expenses vs. estimated revenue |
| `StockChart` | Donut chart — in-stock vs. out-of-stock with center count |
| `ConfirmDialog` | Reusable confirmation modal (danger / warning / info variants) |

---

## Architecture

```
src/
├── pages/          ← Route-level components
├── components/     ← Feature-level components (forms, tables, charts)
├── ui/             ← Reusable UI primitives (dialogs, buttons, steps)
├── hooks/          ← React Query hooks (useAuth, useProduct, useUser)
├── services/       ← Axios API calls (authService, productService, userService)
├── api/            ← Axios instance + interceptors
├── contexts/       ← AuthContext (isAuthenticated, user, loading)
├── guards/         ← ProtectedRoute component
└── utils/          ← formatDate, formatValue, getErrorMessage
```

**Data flow:**

```
Page / Component
    ↓ calls
Custom Hook (React Query)
    ↓ calls
Service function (Axios)
    ↓ HTTP
Backend API
```

React Query handles caching, background refetching, loading/error states, and query invalidation after mutations — keeping the UI always in sync with the server.

---

## Authentication Flow

```
1. Register      POST /api/register       → account created, OTP sent
2. Verify OTP    POST /api/verify         → account activated
3. Login         POST /api/login          → access token set in cookie (15 min)
                                            refresh token set in cookie (30 days)
4. Protected     GET  /api/*              → cookie sent automatically (withCredentials)
5. Token expired → Axios interceptor calls POST /api/refresh automatically
6. Logout        POST /api/logout         → cookies cleared, queries invalidated
```

The Axios instance is configured with `withCredentials: true` so cookies are sent on every request. A response interceptor catches `401` errors, attempts a silent token refresh, and retries the original request — all transparent to the user.

---

## Getting Started

### Prerequisites

- Node.js 18+
- The backend API running (see [backend README](../backend/README.md))

### Local Development

```bash
# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app runs on `http://localhost:5173` by default.

### Build for Production

```bash
npm run build
```

Output is in the `dist/` folder.

---

## Environment & Proxy

The Axios base URL is set to `/api` (relative). In development, Vite proxies `/api` requests to the backend.

For production (Vercel), the `vercel.json` file handles rewrites to the backend URL.

Make sure the backend is reachable and CORS is configured to allow your frontend origin.

---

## Project Structure

```
frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/
│   │   └── axios.js                  # Axios instance + 401 refresh interceptor
│   ├── components/
│   │   ├── AddProductForm.jsx         # Product creation + image compression
│   │   ├── AllProducts.jsx            # Infinite scroll list + filters
│   │   ├── DashboardLayout.jsx        # Main layout (sidebar + header + outlet)
│   │   ├── EditProductModal.jsx       # Edit product modal
│   │   ├── ForgotPassword.jsx         # Two-step password reset wrapper
│   │   ├── RecentProductsTable.jsx    # Last 20 products table
│   │   ├── RevenueChart.jsx           # Bar chart (expenses vs revenue)
│   │   ├── SimpleStatsCard.jsx        # Stat card (icon + value)
│   │   ├── StockChart.jsx             # Donut chart (stock status)
│   │   └── UserForm.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx            # isAuthenticated, user, loading
│   ├── guards/
│   │   └── ProtectedRoute.jsx         # Redirect to / if not authenticated
│   ├── hooks/
│   │   ├── useAuth.js                 # Auth mutations and queries
│   │   ├── useProduct.js              # Product mutations and infinite query
│   │   ├── useUser.js                 # Current user query
│   │   └── index.js
│   ├── pages/
│   │   ├── Dashboard.jsx              # Stats + charts + recent products
│   │   ├── Login.jsx
│   │   ├── Products.jsx               # Add form + product list
│   │   ├── Register.jsx
│   │   └── ValideCode.jsx             # OTP verification
│   ├── services/
│   │   ├── authService.js             # Auth API calls
│   │   ├── productService.js          # Product API calls
│   │   └── userService.js             # User API calls
│   ├── ui/
│   │   ├── ActionButtons.jsx          # Submit button with loading state
│   │   ├── Confirmdialog.jsx          # Confirmation modal (3 variants)
│   │   ├── EmailStep.jsx              # Password reset step 1
│   │   ├── Header.jsx                 # Top bar with user avatar
│   │   ├── NewPasswordStep.jsx        # Password reset step 2
│   │   └── Sidebar.jsx                # Navigation + logout
│   ├── utils/
│   │   ├── errorHandler.js            # Extract error messages from Axios errors
│   │   └── fonctionData.js            # formatDate, formatValue (FCFA, K/M)
│   ├── App.jsx                        # Routes definition
│   ├── index.css                      # Tailwind imports + custom utilities
│   └── main.jsx                       # React root + QueryClientProvider + AuthProvider
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── eslint.config.js
```