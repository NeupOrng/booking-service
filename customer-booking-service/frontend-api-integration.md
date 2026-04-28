# Frontend API Integration Guide

> **Scope:** `customer-booking-service` — Nuxt 4, Pinia, `$fetch` — covers **both portals**
> **Customer portal:** `/services`, `/book/*`, `/account/*` — role `customer`
> **Business owner portal:** `/business/*` — role `business_owner`
> **Backend base URL:** `runtimeConfig.public.apiBase` (default `http://localhost:3001`)
> **Swagger UI:** `http://localhost:3001/api/docs`
>
> **Part A (§3–§9):** Customer-facing endpoints — replace mock data in `composables/useBooking.ts`
> **Part B (§10):** Business-owner endpoints — implement `composables/useBusinessOwner.ts`

---

## 1. How API calls work in this project

The `$api` plugin (`plugins/api.ts`) creates a pre-configured `$fetch` instance that:
- Sets `baseURL` from `runtimeConfig.public.apiBase`
- Injects `Authorization: Bearer <token>` on every request when a token exists
- On 401 → attempts token refresh via `tryRefresh()`, then logs out if that also fails

**Always use `$api` (injected via `useNuxtApp()`) for authenticated calls.**
Use raw `$fetch` with explicit `baseURL` only inside `useAuth` (before the plugin is set up).

```ts
// Inside a composable or component
const { $api } = useNuxtApp()
const data = await $api('/services', { query: { page: 1 } })
```

---

## 2. Field name mapping (backend → frontend)

The backend returns **camelCase**; the existing frontend `types/index.ts` uses **snake_case** for
`Service`, `Booking`, and `Business`. Apply this mapping when you receive data:

| Backend field | Frontend type field |
|---|---|
| `priceCents` | `price` |
| `durationMinutes` | `duration_minutes` |
| `coverImageUrl` | `cover_image_url` |
| `nextAvailableSlot` | `next_available_slot` |
| `logoUrl` | `logo_url` |
| `cancellationPolicy` | `cancellation_policy` |
| `businessId` | — (nested object after join) |

Create a mapper function in `composables/useBooking.ts` (or `utils/mappers.ts`):

```ts
function mapService(raw: BackendService): Service {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    price: raw.priceCents,
    duration_minutes: raw.durationMinutes,
    category: {
      id: raw.category?.id ?? '',
      name: raw.category?.name ?? '',
      slug: raw.category?.slug ?? '',
    },
    business: {
      id: raw.business.id,
      name: raw.business.name,
      logo_url: raw.business.logoUrl ?? null,
      address: raw.business.address ?? undefined,
    },
    cover_image_url: raw.coverImageUrl ?? null,
    next_available_slot: raw.nextAvailableSlot ?? null,
    cancellation_policy: raw.cancellationPolicy ?? undefined,
  }
}
```

---

## 3. Auth endpoints — already wired, nothing to change

These live in `composables/useAuth.ts` and are already calling the real API.

| Method | Path | Body | Response |
|---|---|---|---|
| `POST` | `/auth/register` | `{ email, password, fullName }` | `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/login` | `{ email, password }` | `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `POST` | `/auth/logout` | — (Bearer required) | `{ message }` |
| `GET` | `/auth/google` | — | Redirect (Passport handles) |
| `GET` | `/auth/google/callback` | — | Redirect to `{FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...` |
| `POST` | `/auth/telegram` | `TelegramAuthDto` | `{ accessToken, refreshToken, user }` |

**OAuth callback page** (`pages/auth/callback.vue`) — if not yet created, create it:
```ts
// pages/auth/callback.vue
const { setFromOAuth, fetchUser } = useAuth()
const route = useRoute()
const access = route.query.accessToken as string
const refresh = route.query.refreshToken as string
if (access && refresh) {
  setFromOAuth(access, refresh)
  await fetchUser()
}
await navigateTo('/')
```

---

## 4. Users endpoints

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `GET` | `/users/me` | Bearer | — | `UserResponseDto` |
| `PATCH` | `/users/me` | Bearer | `{ fullName?, email?, avatarUrl? }` | `UserResponseDto` |
| `DELETE` | `/users/me` | Bearer | — | `{ message }` |

Already called in `useAuth.fetchUser()`. Implement `updateProfile` and `deactivateAccount`
in `useAuth` or a dedicated `useProfile` composable:

```ts
async function updateProfile(data: { fullName?: string; email?: string; avatarUrl?: string }) {
  const { $api } = useNuxtApp()
  const updated = await $api<BackendUser>('/users/me', { method: 'PATCH', body: data })
  user.value = mapUser(updated)
}

async function deactivateAccount() {
  const { $api } = useNuxtApp()
  await $api('/users/me', { method: 'DELETE' })
  accessToken.value = null
  refreshToken.value = null
  user.value = null
  await navigateTo('/')
}
```

**`BackendUser` interface** (already defined in `useAuth.ts`, copy/reuse):
```ts
interface BackendUser {
  id: string; fullName: string; email: string | null
  avatarUrl: string | null; role: string
  isActive: boolean; isEmailVerified: boolean; createdAt: string
}
```

---

## 5. Categories endpoints

| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/categories` | Public | `CategoryResponseDto[]` |
| `GET` | `/categories/:slug` | Public | `CategoryResponseDto` |

**`CategoryResponseDto`:**
```ts
interface CategoryResponseDto {
  id: string
  name: string
  slug: string
  colorHex: string | null
  sortOrder: number
}
```

**Replace `fetchCategories()` in `useBooking.ts`:**
```ts
async function fetchCategories(): Promise<ServiceCategory[]> {
  const { $api } = useNuxtApp()
  const data = await $api<CategoryResponseDto[]>('/categories')
  return data.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
}
```

> `colorHex` is available from the API — consider surfacing it in category pills to
> replace the hardcoded color map in `ServiceCard.vue`.

---

## 6. Services endpoints

### 6.1 List services

```
GET /services
```

| Query param | Type | Notes |
|---|---|---|
| `q` | `string` | Full-text search on service name or business name |
| `categoryId` | `string` (UUID) | Filter by category UUID (not slug — look up UUID from `/categories`) |
| `sort` | `'price_asc' \| 'price_desc' \| 'duration_asc' \| 'soonest'` | |
| `page` | `number` | Default 1 |
| `perPage` | `number` | Default 12, max 50 |

**Response:**
```ts
{
  data: BackendServiceSummary[]
  meta: { total: number; page: number; perPage: number; lastPage: number }
}

interface BackendServiceSummary {
  id: string
  name: string
  priceCents: number
  durationMinutes: number
  coverImageUrl: string | null
  cancellationPolicy: string | null
  nextAvailableSlot: string | null    // ISO datetime or null
  business: { id: string; name: string; logoUrl: string | null }
  category: { id: string; name: string; slug: string; colorHex: string | null } | null
}
```

> **Note:** The frontend uses `category` (slug string) as a filter param but the backend
> expects `categoryId` (UUID). When the user selects a category pill, pass `categoryId`
> using the UUID from the categories list. Keep the slug for display/routing only.

**Replace `fetchServices()` in `useBooking.ts`:**
```ts
async function fetchServices(params: {
  q?: string
  categoryId?: string
  sort?: string
  page?: number
  perPage?: number
}): Promise<{ data: Service[]; meta: { total: number; page: number; perPage: number; lastPage: number } }> {
  const { $api } = useNuxtApp()
  const raw = await $api<{ data: BackendServiceSummary[]; meta: any }>('/services', {
    query: {
      ...(params.q ? { q: params.q } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.sort ? { sort: params.sort } : {}),
      page: params.page ?? 1,
      perPage: params.perPage ?? 12,
    },
  })
  return {
    data: raw.data.map(mapService),
    meta: {
      total: raw.meta.total,
      page: raw.meta.page,
      perPage: raw.meta.perPage,
      lastPage: raw.meta.lastPage,
    },
  }
}
```

---

### 6.2 Get service detail

```
GET /services/:id
```

**Response:**
```ts
interface BackendServiceDetail extends BackendServiceSummary {
  description: string | null
  business: {
    id: string; name: string; logoUrl: string | null
    address: string | null; phone: string | null
  }
}
```

**Replace `fetchService()` in `useBooking.ts`:**
```ts
async function fetchService(id: string): Promise<Service | null> {
  const { $api } = useNuxtApp()
  try {
    const raw = await $api<BackendServiceDetail>(`/services/${id}`)
    return mapService(raw)
  } catch (e: any) {
    if (e?.response?.status === 404) return null
    throw e
  }
}
```

---

### 6.3 Get availability for a date

```
GET /services/:id/availability?date=YYYY-MM-DD
```

**Response — slots now carry full capacity info:**
```ts
{
  date: string
  slots: BackendSlot[]
}

interface BackendSlot {
  time: string              // 'HH:mm'
  available: boolean        // true when remainingCapacity > 0
  capacity: number          // max concurrent bookings defined on the rule
  bookedCount: number       // confirmed + pending bookings from DB
  remainingCapacity: number // capacity - bookedCount - active checkout locks (≥ 0)
}
```

**Update `AvailabilitySlot` in `app/types/index.ts`** to expose the new fields:
```ts
export interface AvailabilitySlot {
  time: string
  available: boolean
  capacity: number
  bookedCount: number
  remainingCapacity: number
}
```

**Replace `fetchAvailability()` in `useBooking.ts`:**
```ts
async function fetchAvailability(
  serviceId: string,
  date: string,
): Promise<{ date: string; slots: AvailabilitySlot[] }> {
  const { $api } = useNuxtApp()
  return $api(`/services/${serviceId}/availability`, { query: { date } })
}
```

**Rendering guidance** — use `remainingCapacity` to show urgency cues in the slot picker:
```ts
function slotLabel(slot: AvailabilitySlot): string {
  if (!slot.available) return 'Full'
  if (slot.remainingCapacity === 1) return `${slot.time} — Last spot`
  if (slot.remainingCapacity <= 3) return `${slot.time} — ${slot.remainingCapacity} spots left`
  return slot.time
}
```

> `capacity = 1` for all existing services (the column defaults to 1), so single-seat services
> behave exactly as before — `available` is still the boolean to gate the "Book" button.

---

## 7. Files endpoints  *(used when uploading user avatars or service images)*

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/files/upload` | Bearer | `multipart/form-data`, field name `file`, optional `?subfolder=` query |
| `GET` | `/files/:id/url` | Bearer | Returns `{ url: string }` — presigned URL, 1-hour expiry |
| `DELETE` | `/files/:id` | Bearer | Returns `{ message: 'File deleted' }` |

**Upload helper:**
```ts
async function uploadAvatar(file: File): Promise<string> {
  const { $api } = useNuxtApp()
  const form = new FormData()
  form.append('file', file)
  const res = await $api<{ id: string }>('/files/upload', {
    method: 'POST',
    body: form,
    query: { subfolder: 'avatars' },
  })
  // store res.id in the user profile, never the URL
  return res.id
}

async function getFileUrl(fileId: string): Promise<string> {
  const { $api } = useNuxtApp()
  const res = await $api<{ url: string }>(`/files/${fileId}/url`)
  return res.url
}
```

> Always store the **file UUID** (returned by upload) in the DB / profile field,
> never the presigned URL. Call `GET /files/:id/url` on demand when you need to display.

---

## 8. Bookings endpoints — NOT YET IMPLEMENTED IN BACKEND

The `BookingsModule` does not exist yet. Keep the mock data in `useBooking.ts` for:
- `createBooking()`
- `fetchAccountBookings()`
- `fetchAccountBookingStats()`
- `cancelBooking()`

When `BookingsModule` is added, the expected contract will be:

```
POST   /bookings                  Create a booking
GET    /bookings?status=upcoming  List current user's bookings
GET    /bookings/:id              Booking detail
PATCH  /bookings/:id/cancel       Cancel a booking
GET    /bookings/stats            { upcoming, completed, total_spent }
```

**Expected request body for `POST /bookings`:**
```ts
{
  serviceId: string      // UUID
  bookingDate: string    // 'YYYY-MM-DD'
  bookingTime: string    // 'HH:mm'
}
```

**Planned response shape (to inform frontend types now):**
```ts
interface BookingResponse {
  id: string
  reference: string        // e.g. '#BK-99120'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  serviceId: string
  serviceName: string
  businessName: string
  bookingDate: string      // 'YYYY-MM-DD'
  bookingTime: string      // 'HH:mm'
  priceCents: number
  cancelledBy: 'customer' | 'business' | null
  cancelledAt: string | null
  refundStatus: 'refunded' | 'partial' | 'none' | null
  refundAmount: number | null
  canCancel: boolean
  canReschedule: boolean
}
```

> When implementing, map `priceCents → price`, `bookingDate → date`, `bookingTime → time`,
> `cancelledBy → cancelled_by`, etc. to fit the existing `Booking` type in `types/index.ts`.

---

## 9. Error handling pattern — applies to both portals

Use a wrapper around `$api` calls in composables to surface errors with `vue-sonner`:

```ts
import { toast } from 'vue-sonner'

async function safeCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (e: any) {
    const msg = e?.data?.message ?? e?.message ?? 'Something went wrong'
    toast.error(msg)
    return null
  }
}

// Usage
const service = await safeCall(() => fetchService(id))
```

Common status codes returned by the backend:

| Code | Meaning |
|---|---|
| `400` | Validation error — `e.data.message` is an array of field errors from `class-validator` |
| `401` | Not authenticated / token expired (plugin handles refresh automatically) |
| `404` | Resource not found |
| `409` | Conflict — email already in use |
| `429` | Rate limit exceeded (throttler) |
| `500` | Unexpected server error |

---

---

## 10. Business owner endpoints — implement in `composables/useBusinessOwner.ts`

All endpoints below require `Authorization: Bearer <token>` and `role = 'business_owner' | 'admin'`.
Use `$api` (injected via `useNuxtApp()`). The backend enforces ownership — a `business_owner` can only
manage their own business and services; the API returns `403` if the check fails.

---

### 10.1 Business profile

```
GET  /businesses/me
PATCH /businesses/:id
```

**`BackendBusiness` interface (backend response — camelCase):**
```ts
interface BackendBusiness {
  id: string
  ownerId: string
  name: string
  slug: string
  description: string | null
  address: string | null
  logoUrl: string | null
  phone: string | null
  status: string           // 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}
```

**Map to frontend `Business` type:** `logoUrl → logo_url`.

**Implementation:**
```ts
async function fetchMyBusiness(): Promise<BackendBusiness> {
  const api = getApi()
  return api<BackendBusiness>('/businesses/me')
}

async function updateBusiness(id: string, data: {
  name?: string; slug?: string; description?: string
  address?: string; logoUrl?: string; phone?: string
}): Promise<BackendBusiness> {
  const api = getApi()
  return api<BackendBusiness>(`/businesses/${id}`, { method: 'PATCH', body: data })
}
```

**Errors:**
- `404` — business not found
- `403` — caller doesn't own this business
- `409` — `slug` already in use — show field-level error: "This slug is already taken"

---

### 10.2 Service management

```
POST  /services
PATCH /services/:id
```

**Request body for `POST /services`:**
```ts
interface CreateServiceBody {
  businessId: string          // UUID of the owner's business (from fetchMyBusiness().id)
  name: string                // 2–200 chars
  description?: string
  priceCents: number          // integer cents — multiply user-entered dollars × 100
  durationMinutes: number     // min 5
  coverImageUrl?: string      // valid URL
  cancellationPolicy?: string
  categoryId?: string         // UUID from GET /categories
  isActive?: boolean          // default true
}
```

> `PATCH /services/:id` accepts the same fields minus `businessId` (immutable after creation). All fields are optional.

**Response:** `SelectService` — plain service row (camelCase). **No joined business/category** — unlike the public `GET /services/:id` which returns a joined object, write endpoints return the raw service row. Fetch `GET /services/:id` after create/update if you need the full detail view.

**Implementation:**
```ts
async function createService(data: CreateServiceBody): Promise<SelectService> {
  const api = getApi()
  return api<SelectService>('/services', { method: 'POST', body: data })
}

async function updateService(id: string, data: Partial<Omit<CreateServiceBody, 'businessId'>>): Promise<SelectService> {
  const api = getApi()
  return api<SelectService>(`/services/${id}`, { method: 'PATCH', body: data })
}
```

**Errors:**
- `403` — you don't own this business / service
- `404` — business or category not found
- `400` — validation failure (e.g. `durationMinutes` < 5)

---

### 10.3 Availability rules

```
GET    /services/:id/availability-rules
POST   /services/:id/availability-rules
PATCH  /services/:id/availability-rules/:ruleId
DELETE /services/:id/availability-rules/:ruleId   → 204 No Content
```

**`AvailabilityRule` interface:**
```ts
interface AvailabilityRule {
  id: string
  serviceId: string
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  startTime: string           // 'HH:mm:ss'
  endTime: string             // 'HH:mm:ss' (exclusive)
  slotDurationMinutes: number // 15–480
  capacity: number            // default 1, max 100
  isActive: boolean
}
```

GET returns rules ordered by `dayOfWeek` (alphabetical). Group client-side by day for the 7-column grid.

**Request body for POST/PATCH:**
```ts
interface CreateRuleBody {
  dayOfWeek: string
  startTime: string           // 'HH:mm' or 'HH:mm:ss'
  endTime: string
  slotDurationMinutes: number // 15–480
  capacity?: number           // default 1
  isActive?: boolean          // default true
}
```

**Backend validates on POST/PATCH:**
- `startTime < endTime` → `400 "startTime must be before endTime"`
- `(endTime - startTime) % slotDurationMinutes === 0` → `400 "{n}-min slots do not divide evenly into a {w}-min window"`

> Run the **same validation client-side** before calling the API so errors surface instantly in the rule editor panel (avoids a round-trip).

**Implementation:**
```ts
async function fetchRules(serviceId: string): Promise<AvailabilityRule[]> {
  const api = getApi()
  return api<AvailabilityRule[]>(`/services/${serviceId}/availability-rules`)
}

async function createRule(serviceId: string, data: CreateRuleBody): Promise<AvailabilityRule> {
  const api = getApi()
  return api<AvailabilityRule>(`/services/${serviceId}/availability-rules`, { method: 'POST', body: data })
}

async function updateRule(serviceId: string, ruleId: string, data: Partial<CreateRuleBody>): Promise<AvailabilityRule> {
  const api = getApi()
  return api<AvailabilityRule>(`/services/${serviceId}/availability-rules/${ruleId}`, { method: 'PATCH', body: data })
}

async function deleteRule(serviceId: string, ruleId: string): Promise<void> {
  const api = getApi()
  await api(`/services/${serviceId}/availability-rules/${ruleId}`, { method: 'DELETE' })
}
```

---

### 10.4 Availability blocks

```
GET    /services/:id/availability-blocks
POST   /services/:id/availability-blocks
PATCH  /services/:id/availability-blocks/:blockId
DELETE /services/:id/availability-blocks/:blockId   → 204 No Content
```

**`AvailabilityBlock` interface:**
```ts
interface AvailabilityBlock {
  id: string
  serviceId: string
  blockDate: string           // 'YYYY-MM-DD'
  startTime: string | null    // null = whole-day block
  endTime: string | null
  reason: string | null
  createdAt: string
}
```

GET returns blocks ordered by `blockDate` ascending.

**Request body for POST/PATCH:**
```ts
interface CreateBlockBody {
  blockDate: string           // 'YYYY-MM-DD'
  startTime?: string          // omit BOTH for a whole-day block
  endTime?: string
  reason?: string
}
```

**Backend validates on POST:**
- `startTime` and `endTime` must be provided together or both absent → `400 "Provide both startTime and endTime, or neither for a whole-day block"`
- If both provided: `startTime < endTime` → `400 "startTime must be before endTime"`

**Implementation:**
```ts
async function fetchBlocks(serviceId: string): Promise<AvailabilityBlock[]> {
  const api = getApi()
  return api<AvailabilityBlock[]>(`/services/${serviceId}/availability-blocks`)
}

async function createBlock(serviceId: string, data: CreateBlockBody): Promise<AvailabilityBlock> {
  const api = getApi()
  return api<AvailabilityBlock>(`/services/${serviceId}/availability-blocks`, { method: 'POST', body: data })
}

async function updateBlock(serviceId: string, blockId: string, data: Partial<CreateBlockBody>): Promise<AvailabilityBlock> {
  const api = getApi()
  return api<AvailabilityBlock>(`/services/${serviceId}/availability-blocks/${blockId}`, { method: 'PATCH', body: data })
}

async function deleteBlock(serviceId: string, blockId: string): Promise<void> {
  const api = getApi()
  await api(`/services/${serviceId}/availability-blocks/${blockId}`, { method: 'DELETE' })
}
```

---

### 10.5 Deferred — business bookings (BookingsModule not yet implemented)

The requirement references these endpoints for the booking inbox (`/business/bookings`).
Keep them as stubs in `useBusinessOwner.ts` until the backend ships.

```
GET   /bookings/business?status=&page=&perPage=&dateFrom=&dateTo=
PATCH /bookings/business/:id/status   body: { status: 'confirmed' | 'completed' }
POST  /bookings/business/:id/cancel   body: { reason? }
```

---

## 11. Implementation checklist

### Part A — Customer portal

- [ ] `fetchCategories()` → `GET /categories`
- [ ] `fetchServices()` → `GET /services` — use `categoryId` (UUID); meta names `lastPage`/`perPage`
- [ ] `fetchService(id)` → `GET /services/:id`
- [ ] `fetchAvailability(id, date)` → `GET /services/:id/availability?date=...`
- [ ] Update `AvailabilitySlot` in `app/types/index.ts` — add `capacity`, `bookedCount`, `remainingCapacity`
- [ ] Update slot picker UI — show "X spots left" / "Last spot" cues using `remainingCapacity`
- [ ] Category pill filter — pass `categoryId` (UUID), not slug
- [ ] `updateProfile()` → `PATCH /users/me` (add to `useAuth`)
- [ ] `deactivateAccount()` → `DELETE /users/me` (add to `useAuth`)
- [ ] Avatar upload → `POST /files/upload` + store UUID in profile via `PATCH /users/me`
- [ ] *(deferred)* `createBooking()` → `POST /bookings`
- [ ] *(deferred)* `fetchMyBookings()` → `GET /bookings/my?status=...`
- [ ] *(deferred)* `fetchBookingStats()` → `GET /bookings/stats`
- [ ] *(deferred)* `cancelMyBooking()` → `POST /bookings/my/:id/cancel`

### Part B — Business owner portal

- [ ] Create `composables/useBusinessOwner.ts` with `getApi()` helper
- [ ] `fetchMyBusiness()` → `GET /businesses/me`
- [ ] `updateBusiness(id, data)` → `PATCH /businesses/:id` — handle `409` slug conflict as field-level error
- [ ] `createService(data)` → `POST /services` — send `priceCents` (not `price`), `durationMinutes` (not `duration_minutes`)
- [ ] `updateService(id, data)` → `PATCH /services/:id`
- [ ] `fetchRules(serviceId)` → `GET /services/:id/availability-rules` — group by `dayOfWeek` client-side
- [ ] `createRule` / `updateRule` → validate `startTime < endTime` and divisibility **client-side first**, then POST/PATCH
- [ ] `deleteRule` → `DELETE /services/:id/availability-rules/:ruleId` — 204 response
- [ ] `fetchBlocks(serviceId)` → `GET /services/:id/availability-blocks`
- [ ] `createBlock` / `updateBlock` → validate startTime/endTime pair **client-side first**, then POST/PATCH
- [ ] `deleteBlock` → `DELETE /services/:id/availability-blocks/:blockId` — 204 response
- [ ] Add `role` middleware — redirect `business_owner` away from `/book/*`, `customer` away from `/business/*`
- [ ] Post-login redirect — `customer → /services`, `business_owner → /business`
- [ ] *(deferred)* Business bookings inbox → `GET /bookings/business`, `PATCH /bookings/business/:id/status`, `POST /bookings/business/:id/cancel`

---

## 12. `nuxt.config.ts` — runtime config required

Make sure `apiBase` is exposed to the client:

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001',
    },
  },
})
```

`.env`:
```
NUXT_PUBLIC_API_BASE=http://localhost:3001
```
