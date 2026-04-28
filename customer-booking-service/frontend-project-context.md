# Customer Booking Service — Frontend Project Context

> **For AI assistants.** This document is the authoritative reference for the frontend codebase.
> Read this before making any changes to understand architecture decisions, integration status,
> and naming conventions.

---

## 1. Project Overview

A customer-facing service booking platform. Customers browse local wellness, beauty, and fitness
services, select a date/time slot, and complete a booking through a multi-step wizard. After
booking, they manage their appointments from an account dashboard.

**Frontend:** Nuxt 4 SPA (file-based routing, Composition API, `<script setup>`)
**Backend:** NestJS REST API at `http://localhost:3001` (see `backend-booking-service/`)
**Design theme:** Listeo — dark navy navbar, teal primary, light gray background, card shadows

---

## 2. Tech Stack

| Concern | Library | Version |
|---|---|---|
| Framework | Nuxt | 4.x |
| UI framework | Vue 3 Composition API | 3.5.x |
| State management | Pinia | 3.x |
| Styling | Tailwind CSS | 3.4.x |
| UI components | shadcn-nuxt (Reka UI) | 2.6.x |
| Icons | lucide-vue-next | 1.x |
| Date utilities | date-fns | 4.x |
| Forms | vee-validate + zod | 4.x / 4.x |
| HTTP client | `$fetch` (Nuxt built-in) via `$api` plugin | — |
| Toast notifications | vue-sonner | 2.x |
| Reactive utilities | VueUse | 14.x |
| Package manager | pnpm | 10.x |

---

## 3. File Structure

```
customer-booking-service/
├── app/
│   ├── app.vue                        Root component (NuxtLayout + Toaster)
│   ├── assets/
│   │   └── css/tailwind.css           CSS custom properties (Listeo palette) + Tailwind directives
│   ├── components/
│   │   ├── Navbar.vue                 Dark navy sticky header; mobile hamburger menu
│   │   ├── BookingCard.vue            Card for My Bookings list (status badge, actions, inline cancel)
│   │   ├── BookingPanel.vue           Sticky date/time selector on service detail page
│   │   ├── ServiceCard.vue            Service listing card (image, rating, price, next slot)
│   │   └── ui/                        shadcn-nuxt generated components (Button, Card, Input, etc.)
│   ├── composables/
│   │   ├── useAuth.ts                 Auth state, login/register/logout/refresh/profile
│   │   ├── useBooking.ts              All booking-related API calls + mock booking data
│   │   └── useFormatters.ts           formatCurrency, formatBookingDate, formatBookingTime, formatNextSlot
│   ├── layouts/
│   │   └── default.vue                Navbar + main slot + Listeo dark footer
│   ├── middleware/
│   │   └── auth.ts                    Redirects unauthenticated users to /auth/login
│   ├── pages/
│   │   ├── index.vue                  Redirects to /services
│   │   ├── services/
│   │   │   ├── index.vue              Browse services (hero, search, category filter, grid, pagination)
│   │   │   └── [id].vue              Service detail (image, business, reviews, BookingPanel)
│   │   ├── book/
│   │   │   └── [id].vue              4-step booking wizard (date/time → review → sign-in → confirmed)
│   │   ├── account/
│   │   │   └── bookings.vue          My Bookings dashboard (stats, tabs, BookingCard list)
│   │   └── auth/
│   │       ├── login.vue             Split-panel login (Listeo style, Google OAuth)
│   │       ├── register.vue          Split-panel register (same Listeo style)
│   │       └── callback.vue          OAuth redirect handler (sets tokens, fetches user)
│   ├── plugins/
│   │   ├── api.ts                     Creates $api ($fetch with auth header + 401 refresh logic)
│   │   └── auth.ts                    On app boot: fetchUser if token exists; refresh if expired
│   ├── stores/
│   │   └── booking.ts                 Pinia store for 4-step wizard state
│   ├── types/
│   │   └── index.ts                   All TypeScript interfaces (snake_case, see §6)
│   └── utils/
│       └── index.ts                   cn() helper (clsx + tailwind-merge)
├── nuxt.config.ts
├── tailwind.config.ts
├── package.json
└── frontend-api-integration.md        Integration guide (source of truth for API contracts)
```

---

## 4. Theme — Listeo Palette

Defined in `app/assets/css/tailwind.css` as CSS custom properties on `:root`.
Imported globally via `css: ['~/assets/css/tailwind.css']` in `nuxt.config.ts`.

| Token | HSL value | Usage |
|---|---|---|
| `--primary` | `189 68% 38%` | Teal `#1fa8be` — buttons, links, active states |
| `--background` | `210 20% 97%` | Page background `#f5f7fa` |
| `--card` | `0 0% 100%` | White card surfaces |
| `--foreground` | `224 32% 14%` | Dark navy text `#1a2038` |
| `--border` | `210 16% 88%` | Subtle gray borders |
| `--muted-foreground` | `215 12% 48%` | Secondary text |
| `--radius` | `0.625rem` | 10px border radius |
| Navbar bg | `hsl(224, 38%, 14%)` | Dark navy — applied via inline style |
| Hero gradient | `hsl(224,45%,18%) → hsl(189,68%,28%)` | Services page hero + auth panels |

### Important: CSS variable transparency bug
Tailwind's `bg-*` utilities inject `--tw-bg-opacity` which is inherited. In teleported portal
content (`SelectContent`, popovers), this can cause transparent backgrounds. **Fix:** use
`style="background-color: ..."` directly on portal root elements, not Tailwind `bg-*` classes.
`SelectContent.vue` uses `style="background-color: var(--background);"` for this reason.

### Custom utility
`.listeo-shadow` — defined in `tailwind.css` `@layer utilities`. Gives cards `box-shadow: 0 2px 20px rgba(0,0,0,0.07)` with a hover variant.

---

## 5. Authentication

### Token storage
- `access_token` cookie — 20 min TTL
- `refresh_token` cookie — 30 day TTL
- Both set by `useAuth` composable; never touched directly by pages

### Flow
1. `plugins/auth.ts` runs on boot — calls `fetchUser()` if `access_token` exists
2. If `fetchUser` fails (expired JWT), calls `tryRefresh()` then re-fetches
3. `plugins/api.ts` creates `$api` — a `$fetch` instance that injects `Authorization: Bearer`
   on every request and auto-refreshes on 401
4. `middleware/auth.ts` — applied via `definePageMeta({ middleware: 'auth' })` on protected pages;
   redirects to `/auth/login` if unauthenticated
5. Google OAuth: `/auth/google` → backend → `/auth/callback?accessToken=&refreshToken=`

### useAuth exports
```ts
{ token, user, isAuthenticated, login, register, logout,
  fetchUser, tryRefresh, setFromOAuth, updateProfile, deactivateAccount }
```

---

## 6. TypeScript Types (`app/types/index.ts`)

All frontend interfaces use **snake_case** field names. The backend returns camelCase.
Mapping is done in `useBooking.ts` via `mapService()`.

```ts
ServiceCategory  { id, name, slug }
Business         { id, name, logo_url, address?, about? }
Service          { id, name, description, price (cents), duration_minutes, category,
                   business, cover_image_url, next_available_slot,
                   long_description?, cancellation_policy?, avg_rating?, review_count? }
AvailabilitySlot { time (HH:mm), available }
Booking          { id, reference, status, service, business, date (YYYY-MM-DD),
                   time (HH:mm), price (cents), cancelled_by, cancelled_at,
                   refund_status, refund_amount, can_cancel, can_reschedule }
User             { id, fullName, email, avatarUrl?, role? }
```

---

## 7. API Integration Status

Backend base URL: `runtimeConfig.public.apiBase` (default `http://localhost:3001`)
Full integration spec: `frontend-api-integration.md`

### ✅ Live (calling real backend)

| Composable fn | Method | Endpoint |
|---|---|---|
| `fetchCategories()` | GET | `/categories` |
| `fetchServices()` | GET | `/services` |
| `fetchService(id)` | GET | `/services/:id` |
| `fetchAvailability(id, date)` | GET | `/services/:id/availability?date=` |
| `login()` | POST | `/auth/login` |
| `register()` | POST | `/auth/register` |
| `logout()` | POST | `/auth/logout` |
| `fetchUser()` | GET | `/users/me` |
| `tryRefresh()` | POST | `/auth/refresh` |
| `updateProfile()` | PATCH | `/users/me` |
| `deactivateAccount()` | DELETE | `/users/me` |

### ⏳ Mocked (backend `BookingsModule` not yet implemented)

| Composable fn | Mock in | When to wire up |
|---|---|---|
| `createBooking()` | `useBooking.ts` | When `POST /bookings` ships |
| `fetchAccountBookings()` | `useBooking.ts` | When `GET /bookings?status=` ships |
| `fetchAccountBookingStats()` | `useBooking.ts` | When `GET /bookings/stats` ships |
| `cancelBooking()` | `useBooking.ts` | When `PATCH /bookings/:id/cancel` ships |

**Planned booking API contract** (from `frontend-api-integration.md` §8):
```
POST   /bookings                        body: { serviceId, bookingDate, bookingTime }
GET    /bookings?status=upcoming|past|cancelled
GET    /bookings/stats
PATCH  /bookings/:id/cancel
```
Response shape uses camelCase; map `priceCents→price`, `bookingDate→date`, `bookingTime→time`,
`cancelledBy→cancelled_by` etc. to match the existing `Booking` type.

---

## 8. Key Composables

### `useBooking.ts`
- **`getApi()`** — internal helper that casts `$api` to a typed generic function
  (`type Api = <T>(url, opts?) => Promise<T>`). Required because `$api` is untyped at
  the TS level (`$fetch` from Nuxt plugins loses generics without this cast).
- **`mapService(raw)`** — maps `BackendServiceSummary` (camelCase) → `Service` (snake_case).
  Called for both list and detail endpoints.
- **Backend type interfaces** (`CategoryResponseDto`, `BackendServiceSummary`, `BackendBusiness`)
  are defined locally in this file, not in `types/index.ts`.

### `useAuth.ts`
- Uses raw `$fetch` (not `$api`) for auth calls — `$api` plugin isn't bootstrapped yet
  when `useAuth` runs.
- `setFromOAuth(access, refresh)` — called from `pages/auth/callback.vue` after OAuth redirect.

### `useFormatters.ts`
- `formatNextSlot(iso)` — returns `{ label, urgent }`. `urgent: true` only for `null` (fully
  booked). Differentiates Today / Tomorrow / date string.

---

## 9. Pinia Store — `stores/booking.ts`

Used exclusively by the 4-step booking wizard (`pages/book/[id].vue`).

```ts
state: { serviceId, service, selectedDate, selectedTime, step (1|2|3|4), bookingReference }
actions: setService, setDateTime, nextStep, prevStep, setStep, setConfirmation, reset
```

The store is populated on page mount from URL query params (`?date=&time=`). If params are
missing the page redirects back to `/services/:id`.

---

## 10. Pages

### `/services` — Service listing
- Hero banner (gradient) with embedded search input
- Category filter pills — selection passes `categoryId` (UUID) to API, not slug
- Sort dropdown — `soonest | price_asc | price_desc | duration_asc`
- Loading state: spinner (not skeleton grid)
- Pagination: custom button row built from `pageNumbers` computed array (avoids the old bug
  that iterated `total` items instead of `lastPage` pages)

### `/services/[id]` — Service detail
- Breadcrumb back link
- Cover image with category badge overlay
- Business info card
- `BookingPanel` sticky in right column
- Static mock reviews (3 items) — real reviews deferred

### `/book/[id]` — Booking wizard
- Requires auth (`middleware: 'auth'`)
- Step indicator: animated per-segment line draw using `scaleX` CSS transform + `origin-left`;
  pulse ring on active step
- Step 1: Date/time picker (same UI as BookingPanel)
- Step 2: Booking summary + cancellation policy alert
- Step 3: Inline login gate with 5-minute countdown (skipped if already authenticated)
- Step 4: Booking submission → confirmation card

### `/account/bookings` — My Bookings
- Requires auth
- Stats strip: Upcoming / Completed / Total Spent
- Tabs: Upcoming | Past | Cancelled — lazy loaded, cached per tab
- `BookingCard` with inline cancel confirmation (no modal)

### `/auth/login` and `/auth/register`
- `layout: false` (no default layout — full-page split panels)
- Left panel: gradient decoration with brand copy
- Right panel: white card form
- Google OAuth button

---

## 11. UI Components — Notable Customisations

### `components/ui/select/SelectTrigger.vue`
Changed base class `bg-transparent` → `bg-background` so triggers have a solid background.

### `components/ui/select/SelectContent.vue`
Uses `style="background-color: var(--background);"` directly (not a Tailwind `bg-*` class) to
avoid the `--tw-bg-opacity` inheritance bug in teleported portal content.

---

## 12. Known Gaps / Deferred Work

| Item | Status |
|---|---|
| Booking create/list/cancel/stats | Mocked — awaiting `BookingsModule` in backend |
| Real reviews on service detail | Static mock (3 items) |
| Review submission flow | UI placeholder only (`?review=` param) |
| Rescheduling flow | Button exists, no logic |
| Payment processing | Not started |
| Email notifications | Not started |
| Avatar upload (`POST /files/upload`) | Spec in integration doc, not wired up |
| `auth.ts` middleware redirect | Redirects to `/auth/login` but does not preserve `?redirect=` query param |
| `BookingPanel` mobile bottom sheet | Desktop sticky panel only; no mobile sheet variant |

---

## 13. Environment

```
NUXT_PUBLIC_API_BASE=http://localhost:3001
```

Set in `.env`. Exposed to client via `runtimeConfig.public.apiBase` in `nuxt.config.ts`.
