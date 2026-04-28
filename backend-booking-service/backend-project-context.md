# Backend Booking Service — Project Context

> This document is written for a Claude model to read before implementing new features or requirements.
> It describes the **current state** of the codebase precisely — architecture, conventions, schemas, endpoints, and known quirks.
> Always read this before touching any file. If you change something structural, update this document too.

---

## 1. Project Identity

- **Name:** `backend-booking-service`
- **Purpose:** NestJS REST API backend for a booking platform. Handles authentication, user management, file storage, service catalogue management, and availability scheduling. BookingsModule (reservations, payments) is **not yet implemented**.
- **Runtime port:** `3001` (set via `PORT` env var)
- **Swagger UI:** `http://localhost:3001/api/docs`
- **Working directory:** `backend-booking-service/`

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | NestJS | 10.4.22 |
| Language | TypeScript | ^4.7.4 |
| Database | PostgreSQL (via `postgres` JS driver) | — |
| ORM | Drizzle ORM (`drizzle-orm/postgres-js`) | 0.45.2 |
| Cache | Redis (`ioredis`) | ^5.10.1 |
| Auth | Passport.js (JWT, Google OAuth, Telegram) | — |
| JWT | RS256, `@nestjs/jwt` v11 | 30-day refresh / 15-min access |
| File storage | MinIO / S3 (`@aws-sdk/client-s3`) | ^3.x |
| Validation | `class-validator` + `class-transformer` | 0.15.1 / 0.5.1 |
| API docs | `@nestjs/swagger` + `swagger-ui-express` | — |
| HTTP sessions | `express-session` (OAuth handshake only, 10-min TTL) | ^1.19.0 |
| Package manager | pnpm | 10.17.1 |

### TypeScript config notes
- `module: commonjs`, `esModuleInterop: true`, `allowSyntheticDefaultImports: true`
- `declaration: true` — generates `.d.ts` files; triggers TS2883 on all Drizzle table exports (see §18)
- `strictNullChecks: false`, `noImplicitAny: false` — loose mode
- `skipLibCheck: true`

---

## 3. Bootstrap (`src/main.ts`)

```
NestFactory.create(AppModule)
  → express-session middleware (SESSION_SECRET, 10-min cookie — for OAuth handshake only)
  → enableCors (origin: FRONTEND_URL, credentials: true, GET/POST/PATCH/DELETE/OPTIONS)
  → global ValidationPipe (whitelist: true, forbidNonWhitelisted: true)
  → global AllExceptionsFilter
  → global ClassSerializerInterceptor (Reflector)
  → SwaggerModule.setup('api/docs', ...) with Bearer auth security scheme 'access-token'
  → listen on PORT (default 3000)
```

`ClassSerializerInterceptor` is active globally — any class with `@Exclude()`/`@Expose()` decorators from `class-transformer` will be serialized automatically before the response is sent.

---

## 4. Module Dependency Graph

```
AppModule
├── ConfigModule (global, isGlobal: true)
├── ThrottlerModule (10 req / 60 s global)
├── DatabaseModule (@Global)
├── RedisModule (@Global)
├── AuthModule
│   └── imports UsersModule
│       └── @Global (UsersService injectable everywhere)
├── FilesModule (@Global, FilesService injectable everywhere)
├── CategoriesModule
│   └── exports CategoriesService
└── ServicesModule
    └── imports CategoriesModule (for CategoriesService injection)
```

**Dependency rules (enforced by design):**
- `UsersModule` must NOT import `AuthModule`, `FilesModule`, or any feature module.
- `FilesModule` must NOT import `AuthModule` or `UsersModule`.
- `CategoriesModule` is NOT `@Global()` — only ServicesModule imports it.
- Dependency direction: `AuthModule → UsersModule`. `ServicesModule → CategoriesModule`. `BookingsModule → FilesModule` (future).

---

## 5. Configuration (`src/config/configuration.ts`)

The `ConfigModule` loads this factory. All namespaced keys are accessed via `ConfigService.get('namespace.key')`.

```
jwt.privateKey          ← JWT_PRIVATE_KEY (RSA private, \\n → \n replacement applied)
jwt.publicKey           ← JWT_PUBLIC_KEY  (RSA public)
jwt.accessExpiry        ← JWT_ACCESS_EXPIRY (default: '15m')

oauth.google.clientID       ← GOOGLE_CLIENT_ID
oauth.google.clientSecret   ← GOOGLE_CLIENT_SECRET
oauth.google.callbackURL    ← GOOGLE_CALLBACK_URL (default: http://localhost:3001/auth/google/callback)

storage.endpoint             ← S3_ENDPOINT (default: http://localhost:9000)
storage.region               ← S3_REGION (default: us-east-1)
storage.accessKey            ← S3_ACCESS_KEY (default: minioadmin)
storage.secretKey            ← S3_SECRET_KEY (default: minioadmin)
storage.bucket               ← S3_BUCKET (default: booking-uploads)
storage.presignExpirySeconds ← S3_PRESIGN_EXPIRY_SECONDS (default: 3600)
```

**Flat env vars** (not namespaced, accessed directly):
```
DATABASE_URL       ← postgres connection string
REDIS_URL          ← redis connection string
TELEGRAM_BOT_TOKEN ← for Telegram HMAC verification
FRONTEND_URL       ← CORS origin + OAuth redirect base
SESSION_SECRET     ← express-session secret
PORT               ← server port (default 3000, .env sets 3001)
```

---

## 6. Database Schema

### File structure

`src/database/schema.ts` is a **pure re-export barrel** — it does not define tables directly:

```ts
export * from './schemas/users.schema';
export * from './schemas/files.schema';
export * from './schemas/categories.schema';
export * from './schemas/services.schema';
```

Table definitions live in `src/database/schemas/`:

| File | Tables |
|---|---|
| `users.schema.ts` | `users`, `refreshTokens`, `oauthAccounts` |
| `files.schema.ts` | `files` |
| `categories.schema.ts` | `categories` |
| `services.schema.ts` | `businesses`, `services`, `availabilityRules`, `availabilityBlocks`, `slotLocks` |

All table exports have a `// @ts-ignore: TS2883` comment above them — CJS declaration-emit false positive, not a runtime issue (see §18).

All imports in feature modules still point to `'../database/schema'` — the barrel forwards everything.

### Table reference

All tables use `uuid` primary keys (`defaultRandom()`). Drizzle ORM with `postgres-js` driver.

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| email | varchar(255) | unique, not null |
| passwordHash | varchar(255) | nullable — null for OAuth-only accounts |
| fullName | varchar(200) | not null |
| avatarUrl | text | nullable |
| role | varchar(50) | `'customer'` \| `'admin'` \| `'business_owner'`, default `'customer'` |
| isActive | boolean | default true |
| isEmailVerified | boolean | default false |
| createdAt | timestamp | defaultNow |
| updatedAt | timestamp | defaultNow (must be manually set in update queries) |

#### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| userId | uuid FK→users.id | not null |
| tokenHash | varchar(255) | SHA256 of raw token, never stored raw |
| isRevoked | boolean | default false |
| expiresAt | timestamp | 30 days from creation |
| ipAddress | varchar(45) | from request |
| userAgent | text | from request |
| createdAt | timestamp | defaultNow |

#### `oauth_accounts`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| userId | uuid FK→users.id | not null |
| provider | varchar(50) | `'google'` or `'telegram'` |
| providerUserId | varchar(255) | |
| createdAt | timestamp | |
| — | unique index | on (provider, providerUserId) |

#### `files`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| bucket | varchar(100) | MinIO bucket name |
| objectKey | varchar(500) | path inside bucket |
| originalName | varchar(255) | |
| mimeType | varchar(100) | |
| sizeBytes | integer | |
| uploadedBy | uuid FK→users.id | nullable, onDelete: set null |
| createdAt | timestamp | defaultNow |

#### `categories`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | varchar(100) | not null |
| slug | varchar(100) | not null, unique |
| description | text | nullable (admin-only, never exposed to clients) |
| colorHex | varchar(7) | nullable |
| sortOrder | integer | default 0 |
| createdAt | timestamp | defaultNow |

#### `businesses`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| ownerId | uuid FK→users.id | not null, onDelete: restrict |
| name | varchar(200) | not null |
| slug | varchar(200) | not null, unique |
| description | text | nullable |
| address | text | nullable |
| logoUrl | text | nullable |
| phone | varchar(30) | nullable |
| status | varchar(30) | default `'active'` |
| createdAt / updatedAt | timestamp | |

#### `services`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| businessId | uuid FK→businesses.id | not null, onDelete: cascade |
| categoryId | uuid FK→categories.id | nullable, onDelete: set null |
| name | varchar(200) | not null |
| description | text | nullable |
| priceCents | integer | not null |
| durationMinutes | integer | not null |
| coverImageUrl | text | nullable |
| cancellationPolicy | text | nullable |
| isActive | boolean | default true |
| createdAt / updatedAt | timestamp | |

#### `availability_rules`
Recurring weekly schedule per service.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| serviceId | uuid FK→services.id | not null, onDelete: cascade |
| dayOfWeek | varchar(10) | `'monday'`..'`sunday'` |
| startTime | varchar(8) | `'HH:mm:ss'` |
| endTime | varchar(8) | `'HH:mm:ss'` (exclusive) |
| slotDurationMinutes | integer | |
| capacity | integer | NOT NULL, default 1 — max concurrent bookings per slot; 1 = single-customer (original behaviour) |
| isActive | boolean | default true |

#### `availability_blocks`
One-off date overrides.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| serviceId | uuid FK→services.id | not null, onDelete: cascade |
| blockDate | varchar(10) | `'YYYY-MM-DD'` |
| startTime | varchar(8) | nullable — null means whole day blocked |
| endTime | varchar(8) | nullable |
| reason | text | nullable |
| createdAt | timestamp | defaultNow |

#### `slot_locks`
Short-lived Redis-backed reservation audit log.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| serviceId | uuid FK→services.id | not null, onDelete: cascade |
| slotDate | varchar(10) | `'YYYY-MM-DD'` |
| slotTime | varchar(8) | `'HH:mm'` |
| lockedByUserId | uuid FK→users.id | nullable, onDelete: set null |
| expiresAt | timestamp | |
| createdAt | timestamp | defaultNow |

**Redis slot lock key format:** `slot_lock:{serviceId}:{date}:{HH:mm}:{bookingId}` — one key per lock attempt, allowing multiple concurrent locks on the same slot up to its `capacity`. ServicesService counts keys matching `slot_lock:{serviceId}:{date}:{HH:mm}:*` to determine total active locks.

**Exported types from schema.ts (via barrel):**
`SelectUser`, `InsertUser`, `SelectOauthAccount`, `InsertOauthAccount`, `UserRole`,
`InsertFile`, `SelectFile`,
`SelectCategory`, `InsertCategory`,
`SelectBusiness`, `InsertBusiness`, `SelectService`, `InsertService`,
`SelectAvailabilityRule`, `InsertAvailabilityRule`,
`SelectAvailabilityBlock`, `InsertAvailabilityBlock`,
`SelectSlotLock`, `InsertSlotLock`

---

## 7. Global Infrastructure

### DatabaseModule / DatabaseService (`src/database/`)
- `@Global()` — injectable everywhere without importing DatabaseModule.
- Exposes `db: PostgresJsDatabase<typeof schema>` — use `this.db.db.select()...` pattern.
- Connects via `DATABASE_URL`. Lifecycle: `onModuleInit` (connect), `onModuleDestroy` (end).

### RedisModule / RedisService (`src/redis/`)
- `@Global()` — exposes `client: Redis` (ioredis).
- Used by `CategoriesService` (cache-aside) and `ServicesService` (slot lock checks).

### Common infrastructure (`src/common/`)

**Guards:**
- `JwtAuthGuard` — extends `AuthGuard('jwt')`. Throws 401 if no/invalid token.
- `OptionalAuthGuard` — extends `AuthGuard('jwt')`. Sets `req.user = null` if no token, never throws.
- `RolesGuard` — reads `@Roles()` metadata, throws 403 if `req.user.role` is not in the allowed list. Must be used **after** `JwtAuthGuard` (which populates `req.user`).

**Decorators:**
- `@CurrentUser()` — extracts `request.user` (set by Passport: `{ id, role }`).
- `@Roles(...roles)` — sets `ROLES_KEY` metadata consumed by `RolesGuard`.

**Filter:**
- `AllExceptionsFilter` — catches all exceptions, returns `{ statusCode, timestamp, path, message }`. Logs 500s.

### Role guard usage pattern
```ts
// Method-level — apply JwtAuthGuard first, then RolesGuard
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post('something')
doAdminThing() { ... }

// Multiple roles
@Roles('business_owner', 'admin')
@UseGuards(JwtAuthGuard, RolesGuard)
```

---

## 8. Error Handling Conventions

| Situation | Exception |
|---|---|
| Email already registered | `ConflictException('Email already in use')` |
| Business slug already taken | `ConflictException('Business slug already in use')` |
| Category slug already taken | `ConflictException('Slug "..." is already in use')` |
| User not found / inactive / wrong password | `UnauthorizedException('Invalid credentials')` (same msg — no enumeration) |
| Expired/revoked refresh token | `UnauthorizedException('Refresh token is invalid or expired')` |
| Telegram HMAC mismatch | `UnauthorizedException('Telegram auth data is invalid')` |
| User not found during profile update | `NotFoundException('User not found')` |
| File not found | `NotFoundException('File not found')` |
| Service not found or inactive | `NotFoundException('Service not found')` |
| Category not found | `NotFoundException('Category not found')` |
| Business not found | `NotFoundException('Business not found')` |
| Availability rule not found / serviceId mismatch | `NotFoundException('Availability rule not found')` |
| Availability block not found / serviceId mismatch | `NotFoundException('Availability block not found')` |
| Caller does not own the business | `ForbiddenException('You do not own this business')` |
| Caller does not own the service | `ForbiddenException('You do not own this service')` |
| Rule startTime ≥ endTime | `BadRequestException('startTime must be before endTime')` |
| Slots don't divide evenly into window | `BadRequestException('{n}-min slots do not divide evenly into a {w}-min window')` |
| Block startTime/endTime not paired | `BadRequestException('Provide both startTime and endTime, or neither for a whole-day block')` |
| Slot fully booked (future BookingsModule) | `ConflictException('This time slot is fully booked')` |
| Insufficient role | `ForbiddenException('Insufficient role')` |
| MinIO upload/delete failure | `InternalServerErrorException(...)` |
| Any unexpected DB error | Let bubble → `AllExceptionsFilter` returns 500 |

---

## 9. Response Shape Conventions

- Auth endpoints return: `{ accessToken, refreshToken, user: SafeUser }`
- `registerBusinessOwner` additionally returns `business: SelectBusiness` in the response.
- `SafeUser` = `SelectUser` with `passwordHash` stripped (destructured away).
- User-facing user objects use `UserResponseDto` (class-transformer `@Exclude`/`@Expose`).
- File-facing responses use `FileResponseDto` — never include `bucket`/`objectKey`.
- Availability endpoint returns per-slot shape: `{ time, available, capacity, bookedCount, remainingCapacity }` — see §17 for full detail.
- `ClassSerializerInterceptor` is global — DTOs using `@Exclude()` are auto-serialized.
- `ValidationPipe` is global with `whitelist: true, forbidNonWhitelisted: true` — unknown body properties are rejected.

---

## 10. Rate Limiting

`ThrottlerModule` is configured globally: **10 requests per 60 seconds**.

Applied at **method level** on:
- `POST /auth/register`
- `POST /auth/login`
- `PATCH /users/me`
- `DELETE /users/me`

NOT applied to: admin provisioning endpoints, `POST /auth/refresh`, `POST /auth/logout`, `GET /users/me`, all `/files/*`, `/categories/*`, `/services/*` endpoints.

---

## 11. Drizzle ORM Query Patterns

Always use `this.db.db` (the `db` property on `DatabaseService`):

```typescript
// Select
const rows = await this.db.db.select().from(users).where(eq(users.email, email)).limit(1);

// Insert
const [user] = await this.db.db.insert(users).values({ ... }).returning();

// Update (always set updatedAt manually where the table has it)
const [row] = await this.db.db.update(services)
  .set({ ...data, updatedAt: new Date() })
  .where(eq(services.id, id))
  .returning();

// Delete
await this.db.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

// Transaction
await this.db.db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({ ... }).returning();
  await tx.insert(businesses).values({ ownerId: user.id, ... });
});

// Aggregation
const [{ count: total }] = await this.db.db
  .select({ count: count() })
  .from(services)
  .where(where);
```

Import helpers from `'drizzle-orm'`: `eq`, `and`, `or`, `inArray`, `asc`, `desc`, `ilike`, `count`.

---

## 12. File Upload Pattern

Files are handled with **Multer in-memory storage** — never written to disk.
`FileInterceptor('file', { storage: memoryStorage() })` is used at the controller level.
`file.buffer` is passed directly to MinIO.

Object key format: `{subfolder ?? 'uploads'}/{Date.now()}-{uuidv4()}-{safeName}`
where `safeName` replaces non-alphanumeric chars (except `.`, `-`, `_`) with `_`.

**Never store presigned URLs or objectKeys in other tables — store only the file record UUID.**
Call `filesService.getFileUrls(fileIds)` on demand when building responses.

---

## 13. Implemented Modules — AuthModule (`src/auth/`)

### Endpoints

**`AuthController`** — base path `/auth`

| Method | Path | Guard | Body | Response |
|---|---|---|---|---|
| `POST` | `/auth/register` | ThrottlerGuard | `RegisterDto` | `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/login` | ThrottlerGuard | `LoginDto` | `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/refresh` | — | `RefreshDto` | `{ accessToken, refreshToken }` |
| `POST` | `/auth/logout` | JwtAuthGuard | — | `{ message }` |
| `POST` | `/auth/register/admin` | **Public** (no guard — bootstrap endpoint) | `RegisterAdminDto` | `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/register/business-owner` | JwtAuthGuard + RolesGuard(`admin`) | `RegisterBusinessOwnerDto` | `{ accessToken, refreshToken, user, business }` |

**`OAuthController`** — base path `/auth`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/auth/google` | Passport redirect — excluded from Swagger |
| `GET` | `/auth/google/callback` | Redirects to `{FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...` |
| `POST` | `/auth/telegram` | `TelegramAuthDto` → `{ accessToken, refreshToken, user }` |

### AuthService methods
- `register(dto)` — email uniqueness → bcrypt hash (cost 12) → insert user (role: `'customer'`) → issueTokens
- `registerAdmin(dto)` — email uniqueness → bcrypt hash → insert user (role: `'admin'`) → issueTokens
- `registerBusinessOwner(dto)` — email uniqueness + slug uniqueness → bcrypt hash → **transaction**: insert user (role: `'business_owner'`) + insert business → issueTokens; returns `{ ...tokens, user, business }`
- `login(dto)` — find by email → check isActive + passwordHash → bcrypt compare → issueTokens
- `issueTokens(userId, role)` — signs RS256 JWT (sub, role, 15m expiry) + creates refresh token (40-byte hex, SHA256 stored) in DB with IP/UA from `@Inject(REQUEST)`
- `refreshTokens(rawToken)` — hash lookup → expiry check → delete old row (rotation) → issueTokens
- `revokeAllTokens(userId)` — deletes all refresh_tokens rows for user
- `findOrCreateOAuthUser(provider, providerUserId, profile)` — find existing oauth link → or find by email → or create new user + oauth link (transaction)
- `handleTelegramAuth(dto)` — delegates HMAC verification to TelegramStrategy → findOrCreateOAuthUser → issueTokens

### DTOs
`RegisterDto`, `RegisterAdminDto`, `RegisterBusinessOwnerDto` (user fields + businessName/businessSlug/businessDescription/businessAddress/businessPhone), `LoginDto`, `RefreshDto`, `TelegramAuthDto`

---

## 14. Implemented Modules — UsersModule (`src/users/`) — `@Global()`

**Controller:** `UsersController` — base path `/users`, all behind `JwtAuthGuard`
- `GET /users/me` → `UserResponseDto`
- `PATCH /users/me` — ThrottlerGuard, body: `UpdateProfileDto` → `UserResponseDto`
- `DELETE /users/me` — ThrottlerGuard → soft-deactivate → `{ message: 'Account deactivated' }`

**UsersService:** `findById`, `findByEmail`, `create`, `updateProfile` (resets `isEmailVerified` if email changed), `deactivate` (idempotent soft-delete), `findOrCreateOAuth`

**UsersRepository:** `findById`, `findByEmail`, `create`, `update`, `findOAuthAccount`, `createOAuthAccount`, `createUserWithOAuth` (transaction)

**DTOs:** `UpdateProfileDto` (optional fullName/email/avatarUrl), `UserResponseDto` (`@Exclude()` — exposes id/email/fullName/avatarUrl/role/isActive/isEmailVerified/createdAt, never passwordHash)

---

## 15. Implemented Modules — FilesModule (`src/files/`) — `@Global()`

**Controller:** `FilesController` — base path `/files`, all behind `JwtAuthGuard`
- `POST /files/upload` — `multipart/form-data`, field `file`, optional `?subfolder=` → `FileResponseDto`
- `GET /files/:id/url` → `{ url: string }` (presigned URL, 1-hour default expiry)
- `DELETE /files/:id` → `{ message: 'File deleted' }`

**MinioService:** `upload`, `getPresignedUrl`, `delete`, `ensureBucket` (called `onModuleInit`)

**FilesService:** `uploadFile(file, uploadedBy, subfolder?)`, `getFileUrl(fileId)`, `getFileUrls(fileIds[])` → `Record<fileId, url>`, `deleteFile(fileId)`

**FilesRepository:** `findById`, `findByIds` (uses `inArray`), `create`, `delete`

**DTOs:** `FileResponseDto` (exposes id/originalName/mimeType/sizeBytes/createdAt — never bucket/objectKey), `UploadFileDto`

---

## 16. Implemented Modules — CategoriesModule (`src/categories/`)

**Controller:** `CategoriesController` — base path `/categories`

| Method | Path | Guard | Notes |
|---|---|---|---|
| `GET` | `/categories` | Public | Redis-cached list ordered by `sortOrder` |
| `GET` | `/categories/:slug` | Public | 404 if not found |
| `POST` | `/categories` | JwtAuthGuard + RolesGuard(`admin`) | Creates category, invalidates cache |
| `PATCH` | `/categories/:id` | JwtAuthGuard + RolesGuard(`admin`) | Partial update, invalidates cache |

**CategoriesService:**
- `findAll()` — cache-aside, key `categories:all`, TTL 3600s
- `findById(id)` — direct DB query (no cache — admin use only)
- `findBySlug(slug)` — cache-aside, key `categories:slug:{slug}`, TTL 3600s
- `create(dto)` — slug uniqueness check (ConflictException) → insert → invalidateCache
- `update(id, dto)` — slug conflict check if slug changing → update → invalidateCache (NotFoundException if id not found)
- `invalidateCache()` — deletes `categories:all` + all `categories:slug:*` keys

Redis failures are silently caught — never crash the request.

**CategoriesRepository:** `findAll` (ordered by sortOrder asc), `findById`, `findBySlug`, `create`, `update`

**DTOs:** `CategoryResponseDto` (exposes id/name/slug/colorHex/sortOrder — `description` intentionally hidden), `CreateCategoryDto`, `UpdateCategoryDto` (PartialType of Create)

---

## 17. Implemented Modules — ServicesModule (`src/services/`)

ServicesModule registers two controllers and one shared service.

### BusinessesController — base path `/businesses`

All endpoints behind `JwtAuthGuard + RolesGuard('business_owner', 'admin')`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/businesses/me` | Returns the business owned by the current user; 404 if none exists |
| `PATCH` | `/businesses/:id` | Partial update — slug uniqueness check; 403 if caller doesn't own it |

Response type: `BusinessResponseDto` (`@Exclude()`/`@Expose()` — exposes all business fields including `ownerId`, `status`, `createdAt`, `updatedAt`).

### ServicesController — base path `/services`

#### Public / optional-auth read endpoints
| Method | Path | Guard | Notes |
|---|---|---|---|
| `GET` | `/services` | OptionalAuthGuard | Paginated list with filters |
| `GET` | `/services/:id` | OptionalAuthGuard | 404 if not found or inactive |
| `GET` | `/services/:id/availability` | OptionalAuthGuard | `?date=YYYY-MM-DD` required |

#### Write endpoints (business_owner or admin)
| Method | Path | Notes |
|---|---|---|
| `POST` | `/services` | business_owner must own the `businessId`; admin skips ownership check; returns `SelectService` |
| `PATCH` | `/services/:id` | businessId is immutable; returns `SelectService` |

#### Availability rules (business_owner who owns the service, or admin)
| Method | Path | Notes |
|---|---|---|
| `GET` | `/services/:id/availability-rules` | Ordered by `dayOfWeek asc` |
| `POST` | `/services/:id/availability-rules` | Validates startTime < endTime + window divisibility |
| `PATCH` | `/services/:id/availability-rules/:ruleId` | Same time validation (merges dto with existing values) |
| `DELETE` | `/services/:id/availability-rules/:ruleId` | 204 No Content |

#### Availability blocks (business_owner who owns the service, or admin)
| Method | Path | Notes |
|---|---|---|
| `GET` | `/services/:id/availability-blocks` | Ordered by `blockDate asc` |
| `POST` | `/services/:id/availability-blocks` | Omit both startTime/endTime for whole-day block; pair validation enforced |
| `PATCH` | `/services/:id/availability-blocks/:blockId` | Partial update |
| `DELETE` | `/services/:id/availability-blocks/:blockId` | 204 No Content |

All availability rule/block write endpoints validate that the rule/block `serviceId` matches the `:id` param (prevents cross-service tampering).

### Availability slot response shape

`GET /services/:id/availability` returns:

```ts
{
  date: string,   // 'YYYY-MM-DD'
  slots: {
    time: string;              // 'HH:mm'
    available: boolean;        // true when remainingCapacity > 0
    capacity: number;          // total capacity from the rule
    bookedCount: number;       // confirmed + pending bookings for this slot
    remainingCapacity: number; // capacity - bookedCount - activeLockCount (min 0)
  }[]
}
```

Frontend guidance: render `remainingCapacity` as "X spots left" when `capacity > 1`; hide the count when `capacity === 1` (single-customer services behave like before).

### ServicesService methods

**Business management:**
- `findBusinessByOwner(ownerId)` — delegates to `findBusinessByOwnerId`; returns null if none
- `updateBusiness(id, dto, userId, userRole)` — ownership check (admin bypasses) → slug uniqueness check → update

**Service write:**
- `createService(dto, userId, userRole)` — admin skips business lookup; business_owner: checks ownership → categoryId validation → `repository.create()` → returns `SelectService`
- `updateService(id, dto, userId, userRole)` — `assertServiceOwnership` → categoryId validation → `repository.update()` → returns `SelectService`

**Availability rules:**
- `createRule(serviceId, dto, ...)` — ownership check → validates `startTime < endTime` → validates `(endTime - startTime) % slotDurationMinutes === 0` → create
- `updateRule(serviceId, ruleId, dto, ...)` — ownership check → ruleId/serviceId mismatch check → merges dto fields with existing values for validation → update
- `listRules / deleteRule` — ownership check then CRUD

**Availability blocks:**
- `createBlock(serviceId, dto, ...)` — ownership check → validates startTime/endTime are provided together (or both absent) → validates `startTime < endTime` if both present → create
- `updateBlock / listBlocks / deleteBlock` — ownership check then CRUD

**Read / availability:**
- `findAll(query)` — delegates to repo, computes `nextAvailableSlot` only when `sort === 'soonest'`
- `findById(id)` — returns null if not found or inactive (uses `findWithRelations`)
- `getAvailability(serviceId, date)` — loads rules + blocks + bookedCounts in parallel → `AvailabilityService.computeSlots` → counts Redis locks via `KEYS slot_lock:{serviceId}:{date}:{time}:*` → returns `(SlotResult & { available })[]`
- `getNextAvailableSlot(serviceId)` — iterates up to 14 days forward

**Private helper:**
- `assertServiceOwnership(serviceId, userId, userRole)` — calls lean `findById` (not `findWithRelations`); admin immediately returns; business_owner checks `business.ownerId === userId`

### AvailabilityService (pure — no DB/Redis — unit-testable)

`computeSlots(rules, blocks, bookedCounts)` → three steps:

1. **generateSlots(rules)** — for each active rule, step from startTime to endTime in `slotDurationMinutes` increments. When the same `time` appears in multiple active rules (overlapping ranges), take MAX `capacity`. Returns `SlotResult[]` sorted by time: `{ time, capacity, bookedCount: 0, remainingCapacity: capacity }`. **No `available` field** — that is added later by `ServicesService`.
2. **subtractBlocks(slots, blocks)** — whole-day block (null startTime/endTime) removes all slots; time-range block removes slots within `[block.startTime, block.endTime)`. Slots are **removed entirely**, not greyed out.
3. **applyBookings(slots, bookedCounts)** — reduces `remainingCapacity` by the confirmed/pending booking count per slot (`remainingCapacity = max(0, capacity - bookedCount)`). Slots are **NOT removed** — frontend renders fully-booked slots greyed out. **Does not set `available`** — that field is set exclusively in `ServicesService.getAvailability()` after Redis lock counting.

Redis lock counting happens in `ServicesService.getAvailability()` AFTER `computeSlots()`.

### ServicesRepository methods

**Services:**
- `findAll(query)` — joined paginated query with dynamic filters and sort
- `findWithRelations(id)` — joined single-row fetch (service + business + category)
- `findById(id)` — lean single-table select from `services` (no joins; used by ownership check)
- `create(data)` — insert returning `SelectService`
- `update(id, data)` — auto-sets `updatedAt: new Date()`

**Businesses:**
- `findBusinessById(id)`, `findBusinessByOwnerId(ownerId)`, `findBusinessBySlug(slug)`
- `updateBusiness(id, data)` — auto-sets `updatedAt: new Date()`

**Availability data (read by public/availability pipeline):**
- `findRulesByDayOfWeek(serviceId, dayOfWeek)` — filters `isActive = true`
- `findBlocksByDate(serviceId, date)`
- `findBookedSlots(serviceId, date)` → `{ bookingTime: string; count: number }[]` — returns `[]` placeholder until BookingsModule

**Rules CRUD:** `findAllRules` (ordered by `dayOfWeek asc`), `findRuleById`, `createRule`, `updateRule`, `deleteRule`  
— Note: `availabilityRules` has no `updatedAt` column; never add one to `.set()` calls.

**Blocks CRUD:** `findAllBlocks` (ordered by `blockDate asc`), `findBlockById`, `createBlock`, `updateBlock`, `deleteBlock`  
— Note: `availabilityBlocks` has no `updatedAt` column.

### DTOs
- Business: `BusinessResponseDto` (`@Exclude()`/`@Expose()` — all fields), `UpdateBusinessDto` (name?, slug?, description?, address?, logoUrl?, phone?)
- Query: `ServiceListQueryDto` (q, categoryId, sort, page, perPage)
- Service write: `CreateServiceDto` (`durationMinutes @Min(5)`, `coverImageUrl @IsUrl()`), `UpdateServiceDto` (PartialType of Create minus businessId)
- Rules: `CreateAvailabilityRuleDto` (dayOfWeek, startTime, endTime, `slotDurationMinutes @Min(15) @Max(480)`, `capacity? @Max(100)`, isActive?), `UpdateAvailabilityRuleDto` (PartialType)
- Blocks: `CreateAvailabilityBlockDto` (blockDate, startTime?, endTime?, reason?), `UpdateAvailabilityBlockDto` (PartialType)

---

## 18. Known Quirks and Workarounds

### TS2883 on all Drizzle table exports
Every `export const <table> = pgTable(...)` in the `src/database/schemas/` files has a `// @ts-ignore: TS2883` comment above it. This suppresses "inferred type cannot be named" which is triggered by Drizzle's generic FK types combined with `declaration: true` in tsconfig. It is a CJS type-portability false positive — not a runtime issue.

### `expiresIn` type cast in JWT signing
`jwtService.sign(...)` uses `expiresIn: accessExpiry as any`. Required because `@nestjs/jwt` v11 types `expiresIn` as `StringValue | number`, and `configService.get<string>()` returns a plain `string`.

### `postgres` ESM/CJS interop
`esModuleInterop: true` was added to fix a runtime error `(0, postgres_1.default) is not a function`. The `postgres` v3 package is ESM-first; without this flag the CJS output breaks at runtime.

### `canActivate` return type on `JwtAuthGuard`
Typed as `boolean | Promise<boolean> | Observable<boolean>` and imports `Observable` from `rxjs` to satisfy the parent interface under strict TypeScript.

### `(req as any).user` in `OAuthController`
Express `Request` type doesn't include `user`. Passport adds it at runtime.

### Redis `KEYS` usage in slot lock counting
`redisService.client.keys('slot_lock:{serviceId}:{date}:{time}:*')` is used to count active locks per slot. `KEYS` is an O(N) Redis command — acceptable for the current scale. Migrate to `SCAN`-based counting if lock key count grows significantly. Redis failures are always caught silently and `lockCount` defaults to `0`.

---

## 19. What Is NOT Yet Implemented

- **BookingsModule** — booking creation, listing, management. `ServicesRepository.findBookedSlots` returns `[]` as a placeholder with a `// TODO` comment.
- **Slot lock writes** — Redis slot lock keys are read in `ServicesService.getAvailability()` but nothing writes them yet. BookingsModule will write keys in format `slot_lock:{serviceId}:{date}:{HH:mm}:{bookingId}` during checkout, with expiry matching checkout timeout. Before confirming a booking, BookingsModule must verify `bookedCount + activeLockCount < capacity` and throw `ConflictException('This time slot is fully booked')` if not.
- **Payments** — payment processing integration.
- **Email verification** — `isEmailVerified` flag is set/reset in code but no email-sending flow exists.

---

## 20. File & Folder Map

```
src/
├── main.ts                           Bootstrap, Swagger setup, global middleware/pipes/filters/interceptors
├── app.module.ts                     Root module — registers all feature modules
├── app.controller.ts / app.service.ts  Health check GET /
│
├── config/
│   └── configuration.ts             Namespaced config factory for ConfigModule
│
├── database/
│   ├── database.module.ts            @Global
│   ├── database.service.ts           Drizzle + postgres-js connection
│   ├── schema.ts                     Re-export barrel (4 lines)
│   └── schemas/
│       ├── users.schema.ts           users, refreshTokens, oauthAccounts + types
│       ├── files.schema.ts           files + types
│       ├── categories.schema.ts      categories + types
│       └── services.schema.ts        businesses, services, availabilityRules (+ capacity col),
│                                     availabilityBlocks, slotLocks + types
│
├── redis/
│   ├── redis.module.ts               @Global
│   └── redis.service.ts              ioredis client
│
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts         JwtAuthGuard (throws 401)
│   │   ├── optional-auth.guard.ts    OptionalAuthGuard (sets user=null, no throw)
│   │   └── roles.guard.ts            RolesGuard (throws 403 on role mismatch)
│   ├── decorators/
│   │   ├── current-user.decorator.ts   @CurrentUser() → request.user
│   │   └── roles.decorator.ts          @Roles(...roles) → sets ROLES_KEY metadata
│   └── filters/
│       └── all-exceptions.filter.ts    Global catch-all filter
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts            register/login/refresh/logout + register/admin + register/business-owner
│   ├── oauth.controller.ts           Google OAuth redirect, Telegram login
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   ├── google.strategy.ts
│   │   └── telegram.strategy.ts      Plain @Injectable HMAC verifier (not a Passport strategy)
│   └── dto/
│       ├── register.dto.ts
│       ├── register-admin.dto.ts
│       ├── register-business-owner.dto.ts
│       ├── login.dto.ts
│       ├── refresh.dto.ts
│       └── telegram-auth.dto.ts
│
├── users/
│   ├── users.module.ts               @Global
│   ├── users.controller.ts           GET|PATCH|DELETE /users/me
│   ├── users.service.ts
│   ├── users.repository.ts
│   └── dto/
│       ├── update-profile.dto.ts
│       └── user-response.dto.ts
│
├── files/
│   ├── files.module.ts               @Global
│   ├── files.controller.ts           POST /files/upload, GET /files/:id/url, DELETE /files/:id
│   ├── files.service.ts
│   ├── files.repository.ts
│   ├── minio.service.ts              S3Client wrapper (forcePathStyle: true for MinIO)
│   └── dto/
│       ├── file-response.dto.ts
│       └── upload-file.dto.ts
│
├── categories/
│   ├── categories.module.ts          exports CategoriesService
│   ├── categories.controller.ts      GET (public) + POST/PATCH (admin)
│   ├── categories.service.ts         Redis cache-aside, create/update with cache invalidation
│   ├── categories.repository.ts
│   └── dto/
│       ├── category-response.dto.ts
│       ├── create-category.dto.ts
│       └── update-category.dto.ts
│
└── services/
    ├── services.module.ts            imports CategoriesModule; controllers: [BusinessesController, ServicesController]
    ├── businesses.controller.ts      GET /businesses/me, PATCH /businesses/:id
    ├── services.controller.ts        read (public/optional) + write + availability-rules + availability-blocks CRUD
    ├── services.service.ts           business mgmt + service write + time-validated rule/block CRUD + availability
    ├── services.repository.ts        findById (lean), findBusinessBy*, updateBusiness; rules/blocks ordered
    ├── availability.service.ts       Pure slot computation: generateSlots → subtractBlocks → applyBookings
    └── dto/
        ├── business-response.dto.ts  @Exclude()/@Expose() — all business fields
        ├── update-business.dto.ts    name?, slug?, description?, address?, logoUrl?, phone?
        ├── service-list-query.dto.ts
        ├── create-service.dto.ts     durationMinutes @Min(5), coverImageUrl @IsUrl()
        ├── update-service.dto.ts
        ├── create-availability-rule.dto.ts   slotDurationMinutes @Min(15)@Max(480), capacity @Max(100)
        ├── update-availability-rule.dto.ts
        ├── create-availability-block.dto.ts
        └── update-availability-block.dto.ts
```
