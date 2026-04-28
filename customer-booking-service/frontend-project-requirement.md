# Bolt AI Prompt — Customer Portal + Business Owner Portal

---

## Tech stack

- **Framework:** Nuxt 4 (Composition API, `<script setup>`, file-based routing)
- **Styling:** Tailwind CSS v3.4
- **UI components:** shadcn-nuxt (Reka UI) v2.6 — install via `npx shadcn-vue@latest add`
- **Icons:** `lucide-vue-next` v1
- **HTTP / state:** `$api` plugin (`$fetch` with auth header + 401 auto-refresh); Pinia v3 for store management
- **Forms:** VeeValidate v4 + Zod v4
- **Notifications:** `vue-sonner` v2 (NOT shadcn Toast)
- **Date utilities:** `date-fns` v4
- **Reactive utilities:** VueUse v14

All pages live under `app/pages/` using Nuxt file-based routing. Reusable UI under `app/components/`. Pinia stores under `app/stores/`. Composables under `app/composables/`. Types in `app/types/index.ts`.

---

## Design theme — Listeo palette

Defined in `app/assets/css/tailwind.css` as CSS custom properties on `:root`.

| Token | Value | Usage |
|---|---|---|
| `--primary` | `189 68% 38%` | Teal `#1fa8be` — buttons, links, active states |
| `--background` | `210 20% 97%` | Page background `#f5f7fa` |
| `--card` | `0 0% 100%` | White card surfaces |
| `--foreground` | `224 32% 14%` | Dark navy text `#1a2038` |
| `--border` | `210 16% 88%` | Subtle gray borders |
| `--muted-foreground` | `215 12% 48%` | Secondary text |
| `--radius` | `0.625rem` | 10px border radius |

Navbar background: `hsl(224, 38%, 14%)` — dark navy, applied via inline style.
Hero gradient: `hsl(224,45%,18%) → hsl(189,68%,28%)` — used on services page hero and auth panels.
Custom utility: `.listeo-shadow` — `box-shadow: 0 2px 20px rgba(0,0,0,0.07)` with hover variant.

**CSS variable transparency bug:** Tailwind `bg-*` utilities inject `--tw-bg-opacity`. In teleported portal content (`SelectContent`, popovers), this causes transparent backgrounds. **Fix:** use `style="background-color: var(--background);"` directly on portal root elements, never Tailwind `bg-*` classes. Apply this to `SelectContent.vue` and any popover/dropdown portal.

---

## Global assumptions

- Backend REST API at `runtimeConfig.public.apiBase` (default `http://localhost:3001`).
- **Two cookies:** `access_token` (20 min TTL) and `refresh_token` (30 day TTL). Both managed exclusively by `useAuth`. Never touched directly by pages.
- `plugins/api.ts` creates `$api` — a `$fetch` instance that injects `Authorization: Bearer <access_token>` on every request and auto-refreshes on 401 using `refresh_token`.
- `plugins/auth.ts` runs on boot: calls `fetchUser()` if `access_token` exists; if it fails, calls `tryRefresh()` then re-fetches.
- All monetary values in the API are integer cents. Format with `formatCurrency(cents)`.
- All dates are ISO 8601 strings. Use `date-fns` for all formatting.
- Backend returns **camelCase**. Frontend types use **snake_case**. Map in composables via `mapService()` / `mapBooking()`.
- Category filter uses `categoryId` (UUID) — NOT category slug.
- Availability slots include `capacity`, `bookedCount`, `remainingCapacity` in addition to `time` and `available`. Show "X spots left" when `capacity > 1`; hide count when `capacity === 1`.
- `middleware/auth.ts` must preserve the `?redirect=` query param: `navigateTo('/auth/login?redirect=' + useRoute().fullPath)`.

---

## Role separation

The app serves two authenticated roles. They share the same Nuxt app but have completely separate page trees and middleware:

| Role | Root path | Access rules |
|---|---|---|
| `customer` | `/services`, `/book/*`, `/account/*` | Cannot access `/business/*` |
| `business_owner` | `/business/*` | Cannot access `/book/*`, `/account/bookings` — redirected to `/business` |

**`middleware/role.ts`** — a second middleware that reads `user.role`:
- If a `business_owner` navigates to `/book/*` or `/account/*`, redirect to `/business`.
- If a `customer` navigates to `/business/*`, redirect to `/services`.

Apply `definePageMeta({ middleware: ['auth', 'role'] })` on all role-restricted pages.

After login, redirect based on role:
- `customer` → `/services`
- `business_owner` → `/business`

---

## PART A — Customer Portal

---

### Feature A1 — Browse services (`/services`)

File: `app/pages/services/index.vue`

Public page — no auth required. Hero banner (gradient background) with embedded search input. Below hero: category pills + sort + service card grid + pagination.

#### API

```
GET /services
Query: q, categoryId (UUID), sort (soonest|price_asc|price_desc|duration_asc), page, perPage
Response: { data: ServiceSummary[], meta: { total, page, perPage, lastPage } }
```

Backend response (camelCase) mapped to frontend `Service` type (snake_case) via `mapService(raw)`:
- `priceCents` → `price`
- `durationMinutes` → `duration_minutes`
- `coverImageUrl` → `cover_image_url`
- `nextAvailableSlot` → `next_available_slot`
- `business.logoUrl` → `business.logo_url`

```ts
interface Service {
  id: string
  name: string
  description: string
  price: number                   // cents
  duration_minutes: number
  category: { id: string; name: string; slug: string; colorHex: string | null }
  business: { id: string; name: string; logo_url: string | null }
  cover_image_url: string | null
  next_available_slot: string | null
}
```

#### Page structure

**Hero:** Full-width gradient banner (`hsl(224,45%,18%) → hsl(189,68%,28%)`). `<h1>` heading, subheading, and a search `Input` centered in the hero. Searching from the hero populates the same `q` filter as the inline search.

**Category pills:** Fetch from `GET /categories`. Render as a horizontally scrollable row. `categoryId` UUID (not slug) sent to API. "All" pill is default. Active: `bg-primary text-primary-foreground`. Inactive: `border border-input bg-background hover:bg-accent`.

**Sort dropdown:** shadcn-nuxt `Select` with: Soonest available, Price (low–high), Price (high–low), Duration. Default: soonest.

**Result count:** `"X services found"` updates reactively.

**Service card grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`. Loading state: 6 skeleton cards. Empty state: `SearchX` lucide icon + "No services found" + "Clear filters" button.

**Pagination:** Custom button row using `pageNumbers` computed array (NOT `Array(total).keys()` — iterate `lastPage` pages). Scroll to top on page change.

#### `components/ServiceCard.vue`

Props: `service: Service`

- Full card is a `<NuxtLink>` to `/services/[id]` wrapped in a Card with `.listeo-shadow`.
- Cover image `aspect-[16/9] object-cover`. If null: colored placeholder derived deterministically from `category.slug`.
- Category badge: shadcn-nuxt `Badge` variant `secondary`. Use `category.colorHex` as inline background if present.
- `next_available_slot` display: null → "Fully booked" `text-destructive`; today → "Today [time]" `text-green-600`; tomorrow → "Tomorrow [time]" `text-green-600`; further → formatted date `text-muted-foreground`.
- Price via `formatCurrency()`. Duration in minutes.
- Hover: `hover:shadow-md transition-shadow duration-200`.

---

### Feature A2 — Service detail (`/services/[id]`)

File: `app/pages/services/[id].vue`

Two-column desktop layout: left 60% (details), right 40% sticky (`BookingPanel`). On mobile: `BookingPanel` collapses to a bottom-anchored sheet trigger button ("Book now") that opens a full-screen shadcn-nuxt `Sheet` component.

#### API

```
GET /services/:id
Response: Service & {
  long_description: string
  cancellation_policy: string
  business: { address: string; about: string }
  avg_rating: number | null
  review_count: number
}

GET /services/:id/availability?date=YYYY-MM-DD
Response: {
  date: string
  slots: {
    time: string              // 'HH:mm'
    available: boolean
    capacity: number
    bookedCount: number
    remainingCapacity: number
  }[]
}
```

#### Left column

- `<h1>` service name. Breadcrumb back link to `/services`.
- Cover image with category badge overlay.
- Business info row: logo (32px rounded), name, address `text-muted-foreground`.
- Star rating from `avg_rating`. Review count.
- Description via `v-html` (sanitised).
- Cancellation policy in shadcn-nuxt `Alert` with `Info` icon.
- Reviews section: 3 mock items (real reviews deferred). Each: initials `Avatar`, stars, comment, relative date via `formatDistanceToNow`.

#### `components/BookingPanel.vue`

Used in both `/services/[id]` (sticky column) and `/book/[id]` step 1.

**Date strip:** 7-day horizontal row. `format(date, 'EEE')` + `format(date, 'd')`. On day select: fetch availability and populate slot grid.

**Slot grid:** `grid-cols-3 gap-2`. Available: `border border-input hover:border-primary`. Selected: `bg-primary text-primary-foreground`. Unavailable: `opacity-40 cursor-not-allowed`. When `capacity > 1` and `remainingCapacity <= 3`: show `"${remainingCapacity} left"` badge on the slot button. Loading: 3×3 `Skeleton` grid.

**Continue button:** Disabled until day + slot selected. On click: if unauthenticated → save intent to `stores/bookingIntent.ts` → redirect `/auth/login?redirect=/book/[id]`. If authenticated → `navigateTo('/book/[id]?date=...&time=...')`.

**Mobile bottom sheet:** On mobile screens, replace the sticky column with a fixed-bottom bar containing price + "Book now" button. Clicking opens a full-screen shadcn-nuxt `Sheet` from the bottom containing the full `BookingPanel` content.

---

### Feature A3 — Booking wizard (`/book/[id]`)

File: `app/pages/book/[id].vue`

`definePageMeta({ middleware: ['auth', 'role'] })`. 4-step wizard. Step indicator at top using animated `scaleX` CSS transform per completed segment with `origin-left`. Pulse ring on active step circle.

#### Pinia store: `stores/booking.ts`

```ts
interface BookingState {
  serviceId: string | null
  service: Service | null
  selectedDate: string | null
  selectedTime: string | null
  step: 1 | 2 | 3 | 4
  bookingReference: string | null
}
actions: setService, setDateTime, nextStep, prevStep, setStep, setConfirmation, reset
```

On mount: read `id`, `date`, `time` from route query. If missing, redirect to `/services/[id]`.

#### Step 1 — Date & time

Reuse `BookingPanel` component (or `DateTimePicker` extracted sub-component). Carries forward pre-selected date/time from query params.

#### Step 2 — Review

Summary `Card`: service, business, date (`formatBookingDate`), time (`formatBookingTime`), duration, total (`formatCurrency`). Cancellation policy in `Alert`. "← Back" ghost + "Confirm & continue →" default.

#### Step 3 — Sign-in gate

Skip if already authenticated (auto-advance to step 4). Show: heading, "Your slot is held for 5 minutes." subheading, MM:SS countdown (`setInterval`, clear in `onUnmounted`, redirect back on 0), email + password inputs (password toggle `Eye`/`EyeOff`), "Sign in & book" full-width button, "No account? Create one" link.

#### Step 4 — Submission & confirmation

```
POST /bookings
Body: { serviceId, bookingDate, bookingTime, notesFromCustomer? }
Response: { id, reference, service, bookingDate, bookingTime, status }
```

Map camelCase response: `bookingDate → date`, `bookingTime → time`.

Loading: full-panel spinner + "Confirming your booking…".

Success: `CheckCircle2` (52px, `text-green-500`), "Booking confirmed!" / "Booking pending", reference in `font-mono`, "View my bookings" → `/account/bookings`, "Book another service" → `/services`.

Error: `Alert` `variant="destructive"` + "Try again" button that re-POSTs.

---

### Feature A4 — My Bookings dashboard (`/account/bookings`)

File: `app/pages/account/bookings.vue`

`definePageMeta({ middleware: ['auth', 'role'] })`. `max-w-3xl mx-auto`.

#### API

```
GET /bookings/my?status=upcoming|past|cancelled&page=&perPage=
GET /bookings/stats   → { upcoming, completed, totalSpent }
POST /bookings/my/:id/cancel   body: { reason? }
```

Map response fields: `bookingDate → date`, `bookingTime → time`, `priceCents → price`.

#### Stats strip

Three metric Cards: Upcoming count, Completed count, Total Spent (`formatCurrency`). Fetch from stats endpoint on mount.

#### Tabs

shadcn-nuxt `Tabs`: Upcoming | Past | Cancelled. Lazy load per tab on first activation. Cache with `Map<string, Booking[]>`. 3-skeleton loading state. Empty states with contextual messages.

#### `components/BookingCard.vue`

Props: `booking: Booking` (snake_case)

Status badge mappings: `pending` → amber (custom variant `warning`), `confirmed` → primary (default), `completed` → green (custom variant `success`), `cancelled` → gray (secondary). Pending shows helper: "Awaiting confirmation from the business."

`<dl>` layout for: date+time, duration, reference (`font-mono text-xs`), amount paid.

Actions — upcoming: Reschedule (→ `/services/[id]?reschedule=[bookingId]`) if `can_reschedule`; Cancel inline if `can_cancel`; View service ghost.

Actions — past: "Leave a review" (→ `/services/[id]?review=[bookingId]#reviews`); "Book again".

Actions — cancelled: refund status line; "Book again".

**Inline cancel:** Expand `<div>` below action row (no modal). Show refund message from API. "Yes, cancel booking" `variant="destructive"` calls `POST /bookings/my/:id/cancel`. On success: remove from list reactively, `toast.success('Booking cancelled')`, increment cancelled count. On error: `toast.error(message)`. Track open card with `ref<string | null> expandedCancelId`.

---

### Feature A5 — Auth pages

#### `/auth/login` and `/auth/register`

`definePageMeta({ layout: false })`. Full-page split panel — no default navbar/footer layout.

Left panel (hidden on mobile): gradient decoration `hsl(224,45%,18%) → hsl(189,68%,28%)` with brand copy and illustration.

Right panel: white card, centered form.

Login form fields: Email, Password (show/hide toggle). "Sign in" button. Google OAuth button (→ `/auth/google` on backend). "Don't have an account? Register" link.

Register form fields: Full name, Email, Password, Confirm password. Zod schema validation (password min 8 chars, passwords must match). "Create account" button. "Already have an account? Sign in" link.

On success: read role from returned user object, redirect: `customer → /services`, `business_owner → /business`.

#### `/auth/callback`

Reads `accessToken` + `refreshToken` from query params. Calls `setFromOAuth(access, refresh)` on `useAuth`. Fetches user profile. Redirects based on role.

---

## PART B — Business Owner Portal

All business owner pages live under `/business`. Apply `definePageMeta({ middleware: ['auth', 'role'] })` on every page. The `role` middleware verifies `user.role === 'business_owner'` and redirects customers to `/services`.

A shared `BusinessLayout` (`app/layouts/business.vue`) wraps all `/business/*` pages. It replaces the default customer layout and provides:
- Dark navy sidebar (same `hsl(224, 38%, 14%)` as the navbar) on desktop, collapsible hamburger on mobile.
- Sidebar nav links: Dashboard, My Services, Bookings, Availability, Profile.
- Top bar with business name, avatar, and logout button.

---

### Feature B1 — Business dashboard (`/business`)

File: `app/pages/business/index.vue`

Overview stats for the logged-in business owner's business.

#### API

```
GET /businesses/me
Response: { id, ownerId, name, slug, description, address, logoUrl, phone, status, createdAt }

GET /services?businessId=&page=1&perPage=5&sort=created_desc
Response: { data: ServiceSummary[], meta: { total } }

GET /bookings/business?status=pending&page=1&perPage=5
Response: { data: Booking[], meta: { total } }
```

#### Page structure

**Stats row** (4 metric cards): Total services (active), Pending bookings, Upcoming bookings this week, Total completed bookings.

**Recent pending bookings** — a short list (max 5) of pending bookings needing confirmation. Each row shows: customer name, service name, date+time, action buttons (Confirm / Decline). "View all" link → `/business/bookings`.

**My services quick list** — most recent 5 services. Each row: cover thumbnail, name, status badge (`active`/`inactive`), price, "Edit" link. "View all" link → `/business/services`.

---

### Feature B2 — My services (`/business/services`)

File: `app/pages/business/services/index.vue`

#### API

```
GET /services?businessId=&page=&perPage=&q=
Response: { data: ServiceSummary[], meta }

POST /services
PATCH /services/:id
```

#### Page structure

**Header:** "My Services" title + "Add service" button (→ `/business/services/new`).

**Search input:** filters by name, debounced 400ms.

**Service table** (desktop) / card list (mobile):

| Column | Notes |
|---|---|
| Cover | 48×48 thumbnail or placeholder |
| Name + category badge | |
| Price | `formatCurrency` |
| Duration | "X min" |
| Status | Active (green badge) / Inactive (gray badge) |
| Availability | "X rules set" or "No availability" warning |
| Actions | Edit · Deactivate/Activate · Manage availability |

Loading: skeleton rows. Empty: "No services yet" with "Add your first service" CTA.

---

### Feature B3 — Create / Edit service (`/business/services/new` and `/business/services/[id]/edit`)

File: `app/pages/business/services/new.vue` and `app/pages/business/services/[id]/edit.vue`

Both use the same `BusinessServiceForm` component (`components/business/ServiceForm.vue`).

#### API

```
GET /services/:id          (edit only — pre-populate form)
GET /categories            (populate category dropdown)
POST /services             (create)
PATCH /services/:id        (edit)
```

#### Form fields

| Field | Component | Validation |
|---|---|---|
| Service name | `Input` | Required, 2–200 chars |
| Category | `Select` (populated from `/categories`) | Optional |
| Description | `Textarea` | Optional |
| Price (dollars) | `Input` type number | Required, > 0; multiply ×100 before sending |
| Duration (minutes) | `Input` type number | Required, ≥ 5 |
| Cover image URL | `Input` url | Optional |
| Cancellation policy | `Textarea` | Optional |
| Is active | `Switch` | Default true |

Zod schema validation. VeeValidate `useForm`.

On create success: `toast.success('Service created')` → redirect `/business/services/[newId]/availability`.
On edit success: `toast.success('Service updated')` → redirect `/business/services`.

---

### Feature B4 — Availability management (`/business/services/[id]/availability`)

File: `app/pages/business/services/[id]/availability.vue`

This is the most complex business owner page. Two-tab layout: **Weekly schedule** (rules) and **Date overrides** (blocks).

#### API

```
GET    /services/:id/availability-rules
POST   /services/:id/availability-rules
PATCH  /services/:id/availability-rules/:ruleId
DELETE /services/:id/availability-rules/:ruleId

GET    /services/:id/availability-blocks
POST   /services/:id/availability-blocks
PATCH  /services/:id/availability-blocks/:blockId
DELETE /services/:id/availability-blocks/:blockId
```

#### Tab 1 — Weekly schedule

**7-column day grid** (Mon–Sun). Each column shows:
- Existing rules for that day as chips (time range + slot duration + capacity). Click a chip to open the rule editor panel.
- "+ Add" dashed button at the bottom of each column.

**Rule editor panel** (inline below the grid, not a modal):
- Appears when "+ Add" is clicked or an existing rule chip is clicked.
- Fields: Start time (`Input` type time), End time (`Input` type time), Slot size (`Select`: 15/30/45/60/90/120 min), Capacity (`Input` type number, default 1, min 1).
- Client-side validation before submit:
  - `startTime < endTime` → "Start time must be before end time"
  - `(endTime - startTime)` in minutes must be divisible by `slotDurationMinutes` → "X-min slots don't divide evenly into a Y-min window"
- "Save rule" button → POST or PATCH. On success: refresh rules list, close panel, `toast.success`.
- "Delete" button (edit mode only) → DELETE. Confirm with inline confirmation text ("Are you sure?") before calling API. On success: remove from list.
- "Cancel" button closes the panel.

**Slot preview strip** (below the grid): Shows generated slots for today's weekday based on current rules. Read-only. Fetches `GET /services/:id/availability?date=<today>` and renders each slot as a colored pill (green = available, gray/strikethrough = booked, amber = locked).

#### Tab 2 — Date overrides

**Mini calendar** (current month + next month, 2 months visible side by side on desktop). Each day cell:
- White: no override.
- Red background: full-day block.
- Amber background: partial-time block.
- Click any day to open the block editor panel.

**Block editor panel** (inline below calendar):
- Fields: Date (`Input` type date, pre-filled from clicked day), Block type (`RadioGroup`: "Whole day" / "Time range"), Start time + End time (only shown when "Time range" selected), Reason (`Input` optional).
- "Whole day" block: send no `startTime`/`endTime`.
- "Save block" → POST. On success: refresh blocks, close panel.
- "Delete" button (edit mode) → DELETE with inline confirmation.

**Active overrides list** (below calendar): table/list of all current blocks with date, type, reason, and Remove button.

---

### Feature B5 — Booking inbox (`/business/bookings`)

File: `app/pages/business/bookings.vue`

#### API

```
GET /bookings/business?status=&page=&perPage=&dateFrom=&dateTo=
PATCH /bookings/business/:id/status    body: { status: 'confirmed' | 'completed' }
POST  /bookings/business/:id/cancel    body: { reason? }
```

#### Page structure

**Filter bar:** Status filter (`Select`: All / Pending / Confirmed / Completed / Cancelled), date range pickers (dateFrom, dateTo).

**Stats strip:** Pending (amber), Confirmed (blue), Completed (green), Cancelled (gray) — counts per status fetched from a dedicated stats call or computed from the full list.

**Booking table** (desktop) / card list (mobile):

| Column | Notes |
|---|---|
| Reference | `font-mono text-xs` |
| Customer | Name + avatar initials |
| Service | Name |
| Date & time | Formatted |
| Duration | "X min" |
| Amount | `formatCurrency` |
| Status badge | Same color mapping as customer portal |
| Actions | Status-dependent (see below) |

**Per-row actions:**

| Current status | Available actions |
|---|---|
| `pending` | "Confirm" button (primary, calls PATCH status=confirmed) · "Decline" button (destructive outline, calls POST cancel) |
| `confirmed` | "Mark completed" button (outline) · "Cancel" button (destructive outline) |
| `completed` | View only |
| `cancelled` | View only |

"Confirm" and "Mark completed" show an inline loading spinner on the row while the API call is in flight. On success: update the row status reactively (no full page reload). `toast.success` on success, `toast.error` on failure.

**Cancel flow:** Clicking "Decline" or "Cancel" expands an inline reason input below the row. Optional `reason` field + "Confirm cancellation" button. Same `expandedCancelId` pattern as customer portal.

**Pagination:** Same custom button row pattern as services listing.

---

### Feature B6 — Business profile (`/business/profile`)

File: `app/pages/business/profile.vue`

#### API

```
GET  /businesses/me
PATCH /businesses/:id    body: UpdateBusinessDto
```

#### Page structure

**Profile form** using `useForm` (VeeValidate + Zod):

| Field | Component | Validation |
|---|---|---|
| Business name | `Input` | Required, 2–200 chars |
| Slug | `Input` | Required, URL-safe (`/^[a-z0-9-]+$/`), 2–200 chars |
| Description | `Textarea` | Optional |
| Address | `Input` | Optional |
| Phone | `Input` | Optional, 10–30 chars |
| Logo URL | `Input` url | Optional |

Pre-populate from `GET /businesses/me` on mount.

"Save changes" button (disabled when form is pristine / unchanged). On success: `toast.success('Profile updated')`. On slug conflict error (409): show field-level error "This slug is already taken".

**Danger zone section** (bottom of page, inside a red-bordered card):
- "Deactivate account" button → calls `DELETE /users/me`. Shows confirmation dialog (shadcn-nuxt `AlertDialog`) before proceeding. On success: logout and redirect to `/auth/login`.

---

## Shared composables

### `composables/useAuth.ts`

```ts
export function useAuth() {
  const accessToken  = useCookie('access_token',  { maxAge: 60 * 20 })
  const refreshToken = useCookie('refresh_token', { maxAge: 60 * 60 * 24 * 30 })
  const user = useState<User | null>('user', () => null)
  const isAuthenticated = computed(() => !!accessToken.value)

  async function login(email: string, password: string): Promise<void>
  async function register(fullName: string, email: string, password: string): Promise<void>
  function logout(): void
  async function fetchUser(): Promise<void>          // GET /users/me
  async function tryRefresh(): Promise<boolean>      // POST /auth/refresh
  function setFromOAuth(access: string, refresh: string): void
  async function updateProfile(data: Partial<User>): Promise<void>
  async function deactivateAccount(): Promise<void>

  return { accessToken, refreshToken, user, isAuthenticated,
           login, register, logout, fetchUser, tryRefresh,
           setFromOAuth, updateProfile, deactivateAccount }
}
```

Uses raw `$fetch` (not `$api`) — `$api` plugin isn't bootstrapped when `useAuth` initialises.

### `composables/useBooking.ts`

```ts
type Api = <T>(url: string, opts?: object) => Promise<T>

export function useBooking() {
  function getApi(): Api { return useNuxtApp().$api as Api }

  function mapService(raw: BackendServiceSummary): Service { ... }
  function mapBooking(raw: BackendBooking): Booking { ... }  // camelCase → snake_case

  async function fetchCategories(): Promise<Category[]>
  async function fetchServices(params: ServiceListParams): Promise<{ data: Service[]; meta: Meta }>
  async function fetchService(id: string): Promise<ServiceDetail>
  async function fetchAvailability(id: string, date: string): Promise<AvailabilityResponse>
  async function createBooking(params: CreateBookingParams): Promise<BookingConfirmation>
  async function fetchMyBookings(status: string, page?: number): Promise<{ data: Booking[]; meta: Meta }>
  async function fetchBookingStats(): Promise<BookingStats>
  async function cancelMyBooking(bookingId: string, reason?: string): Promise<void>

  return { mapService, mapBooking, fetchCategories, fetchServices, fetchService,
           fetchAvailability, createBooking, fetchMyBookings, fetchBookingStats, cancelMyBooking }
}
```

### `composables/useBusinessOwner.ts`

New composable for all business owner API calls.

```ts
export function useBusinessOwner() {
  function getApi(): Api { return useNuxtApp().$api as Api }

  async function fetchMyBusiness(): Promise<Business>
  async function updateBusiness(id: string, data: UpdateBusinessData): Promise<Business>

  async function fetchMyServices(params?: ServiceListParams): Promise<{ data: Service[]; meta: Meta }>
  async function createService(data: CreateServiceData): Promise<Service>
  async function updateService(id: string, data: UpdateServiceData): Promise<Service>

  async function fetchRules(serviceId: string): Promise<AvailabilityRule[]>
  async function createRule(serviceId: string, data: CreateRuleData): Promise<AvailabilityRule>
  async function updateRule(serviceId: string, ruleId: string, data: UpdateRuleData): Promise<AvailabilityRule>
  async function deleteRule(serviceId: string, ruleId: string): Promise<void>

  async function fetchBlocks(serviceId: string): Promise<AvailabilityBlock[]>
  async function createBlock(serviceId: string, data: CreateBlockData): Promise<AvailabilityBlock>
  async function updateBlock(serviceId: string, blockId: string, data: UpdateBlockData): Promise<AvailabilityBlock>
  async function deleteBlock(serviceId: string, blockId: string): Promise<void>

  async function fetchBusinessBookings(params: BookingListParams): Promise<{ data: Booking[]; meta: Meta }>
  async function confirmBooking(bookingId: string): Promise<Booking>
  async function completeBooking(bookingId: string): Promise<Booking>
  async function cancelBusinessBooking(bookingId: string, reason?: string): Promise<Booking>

  return { fetchMyBusiness, updateBusiness, fetchMyServices, createService, updateService,
           fetchRules, createRule, updateRule, deleteRule,
           fetchBlocks, createBlock, updateBlock, deleteBlock,
           fetchBusinessBookings, confirmBooking, completeBooking, cancelBusinessBooking }
}
```

### `composables/useFormatters.ts`

```ts
export function useFormatters() {
  function formatCurrency(cents: number): string
  function formatBookingDate(dateStr: string): string       // "Monday, 21 April 2025"
  function formatBookingTime(timeStr: string): string       // "3:00 PM"
  function formatNextSlot(iso: string | null): { label: string; urgent: boolean }
  function formatDuration(minutes: number): string          // "60 min" or "1 hr 30 min"
  return { formatCurrency, formatBookingDate, formatBookingTime, formatNextSlot, formatDuration }
}
```

### `middleware/role.ts`

```ts
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()
  const route = useRoute()

  if (!user.value) return  // auth middleware handles the unauthenticated case

  const isBusinessOwner = user.value.role === 'business_owner'
  const isCustomerRoute = route.path.startsWith('/book') ||
                          route.path.startsWith('/account')
  const isBusinessRoute = route.path.startsWith('/business')

  if (isBusinessOwner && isCustomerRoute) return navigateTo('/business')
  if (!isBusinessOwner && isBusinessRoute) return navigateTo('/services')
})
```

---

## TypeScript types (`app/types/index.ts`)

```ts
// Frontend snake_case types (mapped from camelCase API responses)

interface User {
  id: string; fullName: string; email: string; avatarUrl?: string; role: 'customer' | 'business_owner' | 'admin'
}

interface ServiceCategory { id: string; name: string; slug: string; colorHex: string | null }

interface Business { id: string; name: string; logo_url: string | null; address?: string; about?: string }

interface Service {
  id: string; name: string; description: string
  price: number; duration_minutes: number
  category: ServiceCategory; business: Business
  cover_image_url: string | null; next_available_slot: string | null
  long_description?: string; cancellation_policy?: string
  avg_rating?: number | null; review_count?: number
  is_active?: boolean
}

interface AvailabilitySlot {
  time: string; available: boolean
  capacity: number; bookedCount: number; remainingCapacity: number
}

interface Booking {
  id: string; reference: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  service: { id: string; name: string; cover_image_url: string | null; duration_minutes: number; category: { slug: string } }
  business: { id: string; name: string }
  date: string; time: string; price: number
  cancelled_by: 'customer' | 'business' | 'admin' | null
  cancelled_at: string | null
  refund_status: 'refunded' | 'partial' | 'none' | null
  refund_amount: number | null
  can_cancel: boolean; can_reschedule: boolean
  notes_from_customer?: string | null
}

interface AvailabilityRule {
  id: string; serviceId: string; dayOfWeek: string
  startTime: string; endTime: string
  slotDurationMinutes: number; capacity: number; isActive: boolean
}

interface AvailabilityBlock {
  id: string; serviceId: string; blockDate: string
  startTime: string | null; endTime: string | null; reason: string | null
}

interface BusinessProfile {
  id: string; ownerId: string; name: string; slug: string
  description: string | null; address: string | null
  logoUrl: string | null; phone: string | null; status: string
}

interface Meta { total: number; page: number; perPage: number; lastPage: number }
```

---

## File structure

```
app/
├── assets/css/tailwind.css            Listeo CSS vars + Tailwind directives + .listeo-shadow
├── components/
│   ├── Navbar.vue                     Dark navy sticky header + mobile hamburger
│   ├── ServiceCard.vue                Customer service listing card
│   ├── BookingPanel.vue               Date/time selector (customer + booking wizard)
│   ├── BookingCard.vue                Customer My Bookings card
│   ├── DateTimePicker.vue             Extracted date strip + slot grid (shared sub-component)
│   ├── StepIndicator.vue              4-step wizard header (animated scaleX segments)
│   ├── InlineCancelConfirm.vue        Inline cancel confirmation panel (customer)
│   └── business/
│       ├── BusinessLayout.vue         Sidebar nav layout for all /business pages
│       ├── ServiceForm.vue            Create/edit service form (shared)
│       ├── RuleEditorPanel.vue        Inline availability rule editor
│       ├── BlockEditorPanel.vue       Inline availability block editor
│       └── BookingRow.vue             Single row in business booking inbox table
├── layouts/
│   ├── default.vue                    Navbar + main slot + footer (customer)
│   └── business.vue                  Sidebar layout wrapper (business owner)
├── middleware/
│   ├── auth.ts                        Redirect to /auth/login with ?redirect= preserved
│   └── role.ts                        Role-based redirect (customer ↔ business_owner)
├── pages/
│   ├── index.vue                      Redirect: customer → /services, owner → /business
│   ├── services/
│   │   ├── index.vue                  A1: Browse services
│   │   └── [id].vue                  A2: Service detail + BookingPanel
│   ├── book/
│   │   └── [id].vue                  A3: 4-step booking wizard
│   ├── account/
│   │   └── bookings.vue              A4: My Bookings dashboard
│   ├── auth/
│   │   ├── login.vue                 A5: Split-panel login (layout: false)
│   │   ├── register.vue              A5: Split-panel register (layout: false)
│   │   └── callback.vue             A5: OAuth redirect handler
│   └── business/
│       ├── index.vue                 B1: Business dashboard
│       ├── services/
│       │   ├── index.vue             B2: My services list
│       │   ├── new.vue               B3: Create service
│       │   └── [id]/
│       │       ├── edit.vue          B3: Edit service
│       │       └── availability.vue  B4: Availability rules + blocks
│       ├── bookings.vue              B5: Booking inbox
│       └── profile.vue               B6: Business profile
├── plugins/
│   ├── api.ts                        $api ($fetch + Bearer + 401 refresh)
│   └── auth.ts                       Boot: fetchUser or tryRefresh
├── stores/
│   ├── booking.ts                    4-step wizard state
│   └── bookingIntent.ts              Unauthenticated booking intent (serviceId+date+time)
├── composables/
│   ├── useAuth.ts
│   ├── useBooking.ts
│   ├── useBusinessOwner.ts           NEW — all business owner API calls
│   └── useFormatters.ts
├── types/
│   └── index.ts
└── utils/
    └── index.ts                      cn() helper (clsx + tailwind-merge)
```

---

## Notes for Bolt

### Framework
- This is **Nuxt 4**, not Nuxt 3. Use `app/` directory structure. `definePageMeta` is available in `<script setup>`.
- Use `useNuxtApp().$api` to access the `$api` plugin. Cast to `Api` type via the `getApi()` helper in composables.

### shadcn-nuxt
- Install via `npx shadcn-vue@latest add [component]`.
- Components needed: `button`, `card`, `input`, `badge`, `select`, `tabs`, `alert`, `alert-dialog`, `avatar`, `skeleton`, `sheet`, `switch`, `radio-group`, `textarea`, `separator`, `tooltip`.
- Fix `SelectContent` background: use `style="background-color: var(--background);"` not Tailwind `bg-*`.
- Custom badge variants `warning` (amber) and `success` (green) must be added to `components/ui/badge/index.ts`.

### API conventions
- All API calls in composables, never in `<script setup>` directly.
- Map camelCase responses to snake_case frontend types in `mapService()` / `mapBooking()` / mapper functions.
- Category filter sends `categoryId` (UUID) not slug.
- Pagination uses `lastPage` from meta (NOT `total`) to build page number arrays.

### Auth
- Two separate cookies: `access_token` and `refresh_token`.
- `auth.ts` middleware must include `?redirect=` query param.
- After login: role-based redirect — `customer → /services`, `business_owner → /business`.

### Business owner pages
- All under `/business/`. Apply `middleware: ['auth', 'role']`.
- Use `layouts/business.vue` — set `definePageMeta({ layout: 'business' })` on all `/business/*` pages.
- Business owner CANNOT navigate to `/book/*` or `/account/bookings` — `role` middleware handles this.

### Loading states
- Use `Skeleton` components that match the shape of real content for all data-fetching states.
- Exception: booking submission step 4 uses a full-panel spinner.

### Inline confirmations
- Cancel flows (both customer and business owner) use inline expanding `<div>` panels, never modals.
- Track open state with `ref<string | null> expandedCancelId`.

### TypeScript
- All interfaces in `app/types/index.ts`.
- Strict mode off (`strictNullChecks: false` to match backend project) — but still use proper types everywhere.
