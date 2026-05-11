# backend-booking-service

NestJS REST API for the ListeoBook booking platform. Provides authentication, service management, availability scheduling, booking lifecycle, reviews, and file uploads.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 10 (Express) |
| Language | TypeScript |
| ORM | Drizzle ORM + drizzle-kit |
| Database | PostgreSQL 16 |
| Cache | Redis 7 (ioredis) |
| Auth | Passport.js — JWT (RS256), Google OAuth 2.0, Telegram Login |
| File Storage | Supabase Storage |
| Validation | class-validator + class-transformer |
| API Docs | Swagger / OpenAPI (`/api/docs`) |
| Rate Limiting | @nestjs/throttler (10 req / min) |
| Build | pnpm + nest-cli · Docker multi-stage (Node 22 Alpine) |
| Tests | Jest + Supertest |

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10
- PostgreSQL instance (local or Neon)
- Redis instance

### Installation

```bash
pnpm install
```

### Environment

Create a `.env` file in this directory:

```env
PORT=3001
SESSION_SECRET=your-session-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/booking

# Redis
REDIS_URL=redis://localhost:6379

# JWT (RS256 — generate with: openssl genrsa -out private.pem 2048)
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
JWT_ACCESS_EXPIRY=15m

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
FRONTEND_URL=http://localhost:3000

# Telegram (optional)
TELEGRAM_BOT_TOKEN=

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=booking-uploads
SUPABASE_PRESIGN_EXPIRY_SECONDS=3600
```

### Run

```bash
pnpm dev           # watch mode
pnpm build         # compile to dist/
pnpm start:prod    # run compiled output
```

Swagger UI: `http://localhost:3001/api/docs`

### Tests

```bash
pnpm test          # unit tests
pnpm test:e2e      # end-to-end tests
```

## Module Architecture

```
src/
├── app.module.ts             # Root module
├── main.ts                   # Bootstrap (CORS, sessions, global pipes, Swagger)
├── config/
│   └── configuration.ts      # Typed config factory
├── database/
│   ├── database.module.ts
│   ├── database.service.ts   # Drizzle pg client
│   └── schemas/              # Table definitions
│       ├── users.schema.ts
│       ├── services.schema.ts
│       ├── bookings.schema.ts
│       ├── categories.schema.ts
│       ├── reviews.schema.ts
│       └── files.schema.ts
├── redis/                    # Redis module + service
├── common/
│   ├── decorators/           # @CurrentUser(), @Roles()
│   ├── guards/               # JwtAuthGuard, RolesGuard, OptionalAuthGuard
│   ├── filters/              # AllExceptionsFilter (global error handler)
│   └── utils/
├── auth/                     # Registration, login, refresh, Google/Telegram OAuth
├── users/                    # User profile CRUD
├── categories/               # Category CRUD with Redis caching
├── services/                 # Services, businesses, availability rules/blocks
├── bookings/                 # Full booking lifecycle
├── reviews/                  # Reviews and rating stats
└── files/                    # Supabase file upload + presigned URLs
```

## API Reference

All endpoints are documented interactively at `/api/docs`. Summary:

### Auth (`/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Customer registration |
| POST | `/auth/login` | — | Email/password login |
| POST | `/auth/refresh` | — | Rotate refresh token |
| POST | `/auth/logout` | JWT | Revoke all refresh tokens |
| POST | `/auth/register/business-owner` | Admin | Create business owner + business |
| GET | `/auth/google` | — | Google OAuth redirect |
| GET | `/auth/google/callback` | — | Google OAuth callback |
| POST | `/auth/telegram` | — | Telegram widget verification |

### Users (`/users`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | JWT | Get own profile |
| PATCH | `/users/me` | JWT | Update profile |
| DELETE | `/users/me` | JWT | Soft-deactivate account |

### Categories (`/categories`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/categories` | — | List all (Redis-cached) |
| GET | `/categories/:slug` | — | Get by slug |
| POST | `/categories` | Admin | Create category |
| PATCH | `/categories/:id` | Admin | Update category |

### Services (`/services`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/services` | — | Paginated list with search/filter/sort |
| GET | `/services/:id` | — | Service detail |
| GET | `/services/:id/availability` | — | Available slots for a date |
| GET | `/services/by-business` | Owner | Own business services |
| POST | `/services` | Owner/Admin | Create service |
| PATCH | `/services/:id` | Owner/Admin | Update service |
| GET/POST/PATCH/DELETE | `/services/:id/availability-rules/:ruleId` | Owner | Weekly recurring slots |
| GET/POST/PATCH/DELETE | `/services/:id/availability-blocks/:blockId` | Owner | One-off date blocks |

### Businesses (`/businesses`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/businesses/me` | Owner | Own business profile |
| PATCH | `/businesses/:id` | Owner/Admin | Update business |

### Bookings (`/bookings`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/bookings` | JWT | Create booking |
| GET | `/bookings/my` | JWT | Customer's bookings (paginated) |
| GET | `/bookings/my/stats` | JWT | Upcoming / completed / total spent |
| POST | `/bookings/my/:id/cancel` | JWT | Cancel own booking |
| GET | `/bookings/business` | Owner | Business bookings (paginated) |
| PATCH | `/bookings/business/:id/status` | Owner | Confirm / complete booking |
| POST | `/bookings/business/:id/cancel` | Owner | Cancel booking (business side) |

### Reviews (`/reviews`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/reviews` | — | Paginated reviews by service |
| GET | `/reviews/stats` | — | Average rating + count |
| POST | `/reviews` | JWT | Submit review (requires completed booking) |
| DELETE | `/reviews/:id` | JWT/Admin | Delete own review |

### Files (`/files`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/files/upload` | JWT | Upload file to Supabase Storage |
| GET | `/files/:id/url` | JWT | Get presigned download URL (1 hour) |
| DELETE | `/files/:id` | JWT | Delete file |

## Database Schema

All primary keys are UUIDs (`gen_random_uuid()`).

| Table | Purpose |
|---|---|
| `users` | All user accounts; roles: `customer`, `business_owner`, `admin` |
| `refresh_tokens` | SHA-256 hashed tokens with IP/UA tracking; rotated on each use |
| `oauth_accounts` | Links users to Google/Telegram provider IDs |
| `categories` | Service categories with slug, color, sort order |
| `businesses` | Business profiles linked to owner users |
| `services` | Bookable services (price in cents, duration in minutes) |
| `availability_rules` | Weekly recurring slots per service (day, time range, capacity) |
| `availability_blocks` | One-off date overrides (whole-day or time-range blocks) |
| `slot_locks` | Temporary slot reservation during checkout |
| `bookings` | Booking records with status, pricing, cancellation tracking |
| `reviews` | Customer reviews (1–5 rating); one per customer per service |
| `files` | File metadata for Supabase Storage objects |

## Authentication Flow

**Access tokens** are RS256 JWTs with a 15-minute expiry. Payload: `{ sub: userId, role }`.

**Refresh tokens** are 80-character random hex strings stored as SHA-256 hashes in the database. They expire after 30 days and are rotated on every use (old token deleted, new token issued).

**Google OAuth** uses express-session for state. On successful callback, the API issues a JWT pair and redirects to `FRONTEND_URL/auth/callback?accessToken=...&refreshToken=...`.

**Telegram Login** uses HMAC-SHA256 verification of the widget data against `TELEGRAM_BOT_TOKEN`.

## Deployment

The project includes a `Dockerfile` (multi-stage, Node 22 Alpine) and a `vercel.json` for Vercel serverless deployment.

```bash
# Docker
docker build -t booking-api .
docker run -p 3001:3001 --env-file .env booking-api
```
