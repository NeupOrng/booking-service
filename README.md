# ListeoBook — Booking Service Monorepo

A full-stack service booking platform. Business owners publish services with configurable availability; customers browse, filter, and book slots through a guided wizard. The platform supports JWT, Google OAuth, and Telegram authentication.

## Architecture

```
┌─────────────────────────────────┐
│  customer-booking-service        │  Nuxt 4 · Vue 3 · Tailwind CSS
│  (frontend)          :3000       │
└────────────┬────────────────────┘
             │ HTTP · Bearer JWT
┌────────────▼────────────────────┐
│  backend-booking-service         │  NestJS 10 · Drizzle ORM
│  (REST API)          :3001       │
└──┬──────────┬────────────┬──────┘
   │          │            │
   ▼          ▼            ▼
PostgreSQL  Redis       Supabase Storage
 :5432      :6379       (file uploads)
```

## Repository Layout

```
booking-service/
├── backend-booking-service/    # NestJS REST API
├── customer-booking-service/   # Nuxt 4 frontend (ListeoBook)
├── docker-compose.yml          # Local infrastructure (Postgres, Redis, MinIO)
├── api-docs/                   # Bruno / Postman API collections
└── ui_kits/                    # Design assets
```

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10
- Docker & Docker Compose (for local infrastructure)

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL 16 on `:5432`, Redis 7 on `:6379`, and MinIO on `:9000/9001`.

### 2. Configure and run the backend

```bash
cd backend-booking-service
cp .env.example .env       # fill in required variables
pnpm install
pnpm dev                   # http://localhost:3001
```

Swagger docs are available at `http://localhost:3001/api/docs` once running.

### 3. Configure and run the frontend

```bash
cd customer-booking-service
cp .env.example .env       # set NUXT_PUBLIC_API_BASE=http://localhost:3001
pnpm install
pnpm dev                   # http://localhost:3000
```

## Projects

| Project | Stack | Docs |
|---|---|---|
| [backend-booking-service](./backend-booking-service/) | NestJS · Drizzle ORM · PostgreSQL · Redis | [README](./backend-booking-service/README.md) |
| [customer-booking-service](./customer-booking-service/) | Nuxt 4 · Vue 3 · Pinia · Tailwind | [README](./customer-booking-service/README.md) |

## User Roles

| Role | Capabilities |
|---|---|
| `customer` | Browse services, make/cancel bookings, leave reviews |
| `business_owner` | Manage services, availability rules, booking confirmations |
| `admin` | All of the above + category management, user provisioning |

## Environment Variables Summary

### Backend (`.env`)

| Variable | Description |
|---|---|
| `PORT` | API port (default `3001`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SESSION_SECRET` | Express session secret |
| `JWT_PRIVATE_KEY` | RS256 PEM private key |
| `JWT_PUBLIC_KEY` | RS256 PEM public key |
| `JWT_ACCESS_EXPIRY` | Access token lifespan (e.g. `15m`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL |
| `FRONTEND_URL` | Used for OAuth redirect |
| `TELEGRAM_BOT_TOKEN` | Telegram Login Widget token (optional) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_BUCKET` | Storage bucket name |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `NUXT_PUBLIC_API_BASE` | Backend API base URL |

## Tech Stack Overview

**Backend:** NestJS · TypeScript · Drizzle ORM · PostgreSQL · Redis · Passport.js (JWT / Google OAuth / Telegram) · Supabase Storage · Swagger

**Frontend:** Nuxt 4 · Vue 3 · Pinia · Tailwind CSS · shadcn-nuxt · vee-validate · Zod · date-fns

## License

MIT
