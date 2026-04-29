# Frontend Project Context — ListeoBook

> **For AI assistants.** Authoritative reference for the `customer-booking-service` frontend.
> Read before making any changes. Covers both portals: Customer and Business Owner.

---

## 1. Project Overview

A full-stack service booking platform with two distinct portals sharing a single Nuxt app:

| Portal | Root path | Who uses it |
|---|---|---|
| **Customer** | `/services`, `/book/*`, `/account/*` | End customers browsing and booking services |
| **Business Owner** | `/business/*` | Service providers managing listings, availability, and bookings |

Both portals are served from the same Nuxt app with role-based routing.
Backend: NestJS REST API at `http://localhost:3001` (see `backend-booking-service/`).

---

## 2. Tech Stack

| Concern | Library | Version |
|---|---|---|
| Framework | Nuxt | 4.x (`app/` directory structure) |
| UI framework | Vue 3 Composition API `<script setup>` | 3.5.x |
| State management | Pinia | 3.x |
| Styling | Tailwind CSS | 3.4.x |
| UI components | shadcn-nuxt (Reka UI) | 2.6.x |
| Icons | lucide-vue-next | 1.x |
| Date utilities | date-fns | 4.x |
| Form validation | vee-validate + zod | 4.x / 4.x |
| HTTP client | `$fetch` via `$api` plugin | Nuxt built-in |
| Notifications | vue-sonner | 2.x |
| Reactive utilities | VueUse | 14.x |
| Package manager | pnpm | 10.x |

---

## 3. Design Theme — Listeo Palette

Defined in `app/assets/css/tailwind.css` as CSS custom properties on `:root`.
Globally imported via `css: ['~/assets/css/tailwind.css']` in `nuxt.config.ts`.

| Token | HSL value | Colour |
|---|---|---|
| `--primary` | `189 68% 38%` | Teal `#1fa8be` |
| `--background` | `210 20% 97%` | Page bg `#f5f7fa` |
| `--card` | `0 0% 100%` | White card surfaces |
| `--foreground` | `224 32% 14%` | Dark navy text `#1a2038` |
| `--border` | `210 16% 88%` | Light gray borders |
| `--muted-foreground` | `215 12% 48%` | Secondary text |
| `--radius` | `0.625rem` | 10px border radius |
| Navbar/sidebar bg | `hsl(224, 38%, 14%)` | Dark navy — inline style |
| Hero gradient | `hsl(224,45%,18%) → hsl(189,68%,28%)` | Gradient banners |

### `.listeo-shadow`
Custom utility in `tailwind.css` `@layer utilities`:
```css
box-shadow: 0 2px 20px rgba(0,0,0,0.07);
```
Hover variant increases to `0 6px 32px rgba(0,0,0,0.13)`. Used on all cards.

### CSS Variable Transparency Bug
Tailwind `bg-*` utilities inject `--tw-bg-opacity` which is inherited down the DOM.
Inside teleported portal content (`SelectContent`, popovers), inherited `--tw-bg-opacity: 0`
makes every CSS-variable colour transparent.

**Fix:** Use `style="background-color: var(--background);"` directly on portal root elements.
This bypasses Tailwind's opacity mechanism entirely.

Applied to:
- `app/components/ui/select/SelectContent.vue` — `style="background-color: var(--background);"`, `bg-*` class removed
- `app/components/ui/select/SelectTrigger.vue` — base class changed `bg-transparent` → `bg-background`

---

## 4. File Structure

```
app/
├── assets/css/tailwind.css            Listeo CSS vars + Tailwind directives + .listeo-shadow
├── app.vue                            Root: NuxtLayout + Toaster
│
├── layouts/
│   ├── default.vue                    Customer layout: Navbar + main + dark footer
│   └── business.vue                  Business layout: dark sidebar + top bar + main
│
├── middleware/
│   ├── auth.ts                        Redirect to /auth/login?redirect=<fullPath> if unauthenticated
│   └── role.ts                        Role guard: owner→/business, customer→/services
│
├── plugins/
│   ├── api.ts                         $api: $fetch + Bearer injection + 401 auto-refresh
│   └── auth.ts                        Boot: fetchUser() or tryRefresh() on app load
│
├── stores/
│   ├── booking.ts                     4-step wizard state (serviceId, date, time, step, reference)
│   └── bookingIntent.ts              Unauthenticated intent (serviceId, date, time) pre-login
│
├── composables/
│   ├── useAuth.ts                     Auth state + login/register/logout/refresh/profile/deactivate
│   ├── useBooking.ts                  Services/categories/availability API + mock bookings
│   ├── useBusinessOwner.ts           All business owner API calls
│   └── useFormatters.ts              formatCurrency/Date/Time/NextSlot/Duration
│
├── types/
│   └── index.ts                       All TypeScript interfaces (snake_case frontend types)
│
├── utils/
│   └── index.ts                       cn() — clsx + tailwind-merge
│
├── pages/
│   ├── index.vue                      Role-based redirect (owner→/business, else→/services)
│   │
│   ├── auth/
│   │   ├── login.vue                 Split-panel login (layout: false)
│   │   ├── register.vue              Split-panel register (layout: false)
│   │   └── callback.vue             OAuth callback → role-based redirect
│   │
│   ├── services/                      ── CUSTOMER PORTAL ──
│   │   ├── index.vue                  A1: Browse services
│   │   └── [id].vue                  A2: Service detail + BookingPanel
│   │
│   ├── book/
│   │   └── [id].vue                  A3: 4-step booking wizard
│   │
│   ├── account/
│   │   └── bookings.vue              A4: My Bookings dashboard
│   │
│   └── business/                     ── BUSINESS OWNER PORTAL ──
│       ├── index.vue                 B1: Dashboard
│       ├── profile.vue               B6: Business profile + deactivate
│       ├── bookings.vue              B5: Booking inbox
│       └── services/
│           ├── index.vue             B2: Service list
│           ├── new.vue               B3: Create service
│           └── [id]/
│               ├── edit.vue          B3: Edit service
│               └── availability.vue  B4: Rules + date overrides
│
└── components/
    ├── Navbar.vue                     Dark navy sticky header + mobile hamburger
    ├── ServiceCard.vue                Listing card (image, rating, price, hover lift)
    ├── BookingPanel.vue               Date strip + slot grid (used in detail + wizard)
    ├── BookingCard.vue                My Bookings card with inline cancel
    └── business/
        ├── ServiceForm.vue            Shared create/edit service form
        ├── RuleEditorPanel.vue        Inline availability rule editor
        ├── BlockEditorPanel.vue       Inline date override editor
        └── BookingRow.vue             Booking table row with confirm/complete/cancel actions
```

---

## 5. Authentication

### Token Storage
Two cookies managed exclusively by `useAuth` — never touched directly by pages:

| Cookie | TTL | Content |
|---|---|---|
| `access_token` | 20 min | JWT access token |
| `refresh_token` | 30 days | JWT refresh token |

### Boot Sequence (`plugins/auth.ts`)
1. If `access_token` exists → `fetchUser()` (`GET /users/me`)
2. If that fails (expired) → `tryRefresh()` then re-`fetchUser()`

### `$api` Plugin (`plugins/api.ts`)
Creates a `$fetch` instance that:
- Sets `baseURL` from `runtimeConfig.public.apiBase`
- Injects `Authorization: Bearer <access_token>` on every request
- On 401: calls `tryRefresh()`, then `logout()` if refresh also fails

**All authenticated calls must use `$api`** (via the `getApi()` helper in composables).
`useAuth` itself uses raw `$fetch` directly — `$api` isn't bootstrapped when `useAuth` initialises.

### Role-Based Redirects
After login / register / OAuth callback:
- `customer` → `/services`
- `business_owner` → `/business`

On direct navigation (via `middleware/role.ts`):
- `business_owner` visiting `/book/*` or `/account/*` → redirect `/business`
- `customer` visiting `/business/*` → redirect `/services`

### `useAuth` Exports
```ts
{ token, user, isAuthenticated,
  login, register, logout, fetchUser, tryRefresh, setFromOAuth,
  updateProfile, deactivateAccount }
```

---

## 6. TypeScript Types (`app/types/index.ts`)

**All frontend interfaces use snake_case.** Backend returns camelCase — mapping done in composables.

```ts
User             { id, fullName, email, avatarUrl?, role: 'customer'|'business_owner'|'admin' }
ServiceCategory  { id, name, slug, colorHex: string|null }
Business         { id, name, logo_url, address?, about? }
Service          { id, name, description, price(cents), duration_minutes, category, business,
                   cover_image_url, next_available_slot, is_active?,
                   long_description?, cancellation_policy?, avg_rating?, review_count? }
AvailabilitySlot { time(HH:mm), available, capacity, bookedCount, remainingCapacity }
Booking          { id, reference, status, service, business, date(YYYY-MM-DD), time(HH:mm),
                   price(cents), cancelled_by, cancelled_at, refund_status, refund_amount,
                   can_cancel, can_reschedule, notes_from_customer? }
AvailabilityRule { id, serviceId, dayOfWeek, startTime, endTime, slotDurationMinutes,
                   capacity, isActive }
AvailabilityBlock { id, serviceId, blockDate, startTime|null, endTime|null, reason|null }
BusinessProfile  { id, ownerId, name, slug, description, address, logoUrl, phone, status }
Meta             { total, page, perPage, lastPage }
```

---

## 7. Composables

### `useBooking.ts` — Customer API calls

**`getApi()` helper** — casts `$api` to a typed generic function:
```ts
type Api = <T>(url: string, opts?) => Promise<T>
```
Required because Nuxt plugin-injected `$api` loses generic type information without this cast.

**`mapService(raw)`** — maps `BackendServiceSummary` (camelCase) → `Service` (snake_case):
`priceCents→price`, `durationMinutes→duration_minutes`, `coverImageUrl→cover_image_url`,
`nextAvailableSlot→next_available_slot`, `business.logoUrl→business.logo_url`

**`mapBooking(raw)`** — maps `BackendBooking` (camelCase) → `Booking` (snake_case):
`bookingDate→date`, `bookingTime→time`, `priceCents→price`, `cancelledBy→cancelled_by`, etc.

| Function | Status | Endpoint |
|---|---|---|
| `fetchCategories()` | ✅ Live | `GET /categories` |
| `fetchServices(params)` | ✅ Live | `GET /services` |
| `fetchService(id)` | ✅ Live | `GET /services/:id` |
| `fetchAvailability(id, date)` | ✅ Live | `GET /services/:id/availability?date=` |
| `createBooking(params)` | ⏳ Mocked | `POST /bookings` (backend pending) |
| `fetchMyBookings(status, page?)` | ⏳ Mocked | `GET /bookings/my?status=` (backend pending) |
| `fetchBookingStats()` | ⏳ Mocked | `GET /bookings/stats` (backend pending) |
| `cancelMyBooking(id, reason?)` | ⏳ Mocked | `POST /bookings/my/:id/cancel` (backend pending) |

**`createBooking` params:** `{ serviceId, bookingDate, bookingTime, notesFromCustomer? }`
**`fetchBookingStats` returns:** `{ upcoming, completed, totalSpent }` (camelCase)

### `useBusinessOwner.ts` — Business owner API calls

Same `getApi()` pattern. All calls go through `$api` which injects Bearer automatically.

| Group | Functions |
|---|---|
| Business profile | `fetchMyBusiness()`, `updateBusiness(id, data)` |
| Services | `fetchMyServices(params?)`, `createService(data)`, `updateService(id, data)` |
| Availability rules | `fetchRules(svcId)`, `createRule(svcId, data)`, `updateRule(svcId, ruleId, data)`, `deleteRule(svcId, ruleId)` |
| Availability blocks | `fetchBlocks(svcId)`, `createBlock(svcId, data)`, `updateBlock(svcId, blockId, data)`, `deleteBlock(svcId, blockId)` |
| Business bookings | `fetchBusinessBookings(params)`, `confirmBooking(id)`, `completeBooking(id)`, `cancelBusinessBooking(id, reason?)` |

`fetchMyServices` internally calls `fetchMyBusiness()` first to get `businessId`, then passes it as `?businessId=` to `GET /services`.

Business bookings responses are mapped through `mapBooking()` from `useBooking`.

### `useFormatters.ts`
```ts
formatCurrency(cents)         // "$45.00"
formatBookingDate(dateStr)    // "Monday, 21 April 2025"
formatBookingTime(timeStr)    // "3:00 PM"
formatNextSlot(iso)           // { label: "Today 3:00 PM", urgent: false }
formatDuration(minutes)       // "60 min" or "1 hr 30 min"
```

---

## 8. Stores

### `stores/booking.ts` — 4-step wizard
Used only by `pages/book/[id].vue`.
```ts
state: { serviceId, service, selectedDate, selectedTime, step(1|2|3|4), bookingReference }
actions: setService, setDateTime, nextStep, prevStep, setStep, setConfirmation, reset
```
Populated on page mount from URL query params `?date=&time=`. Missing params → redirect to `/services/:id`.

### `stores/bookingIntent.ts` — Unauthenticated intent
Persists booking selection when an unauthenticated user clicks "Continue to booking".
```ts
state: { serviceId, date, time }
actions: set(serviceId, date, time), clear()
```
`BookingPanel` saves intent here before redirecting to `/auth/login?redirect=/book/:id`.

---

## 9. Middleware

### `middleware/auth.ts`
Redirects unauthenticated users to login, preserving the destination:
```ts
navigateTo('/auth/login?redirect=' + encodeURIComponent(to.fullPath))
```

### `middleware/role.ts`
Reads `user.role` after auth. Applied via `middleware: ['auth', 'role']`:
- `business_owner` on `/book/*` or `/account/*` → redirect `/business`
- non-owner on `/business/*` → redirect `/services`

Applied on: all `/business/*` pages, `/book/[id]`, `/account/bookings`.

---

## 10. Layouts

### `layouts/default.vue` — Customer
Navbar + `<slot>` + dark footer with 3-column links (brand, quick links, categories).

### `layouts/business.vue` — Business Owner
Dark navy sidebar (`hsl(224,38%,14%)`):
- Logo + brand name
- Nav links: Dashboard, My Services, Bookings, Availability, Profile
- User avatar + email footer + sign out button
- Mobile: collapsible hamburger with overlay
- Top bar: hamburger (mobile) + user avatar (desktop)
- `<slot>` in main scrollable area

---

## 11. Pages — Customer Portal

### `pages/services/index.vue` — Browse services
- Full-width gradient hero with embedded search `<input>` (not shadcn Input to avoid border issues)
- Category pills: store `selectedCategoryId` (UUID), pass `categoryId` to API — NOT slug
- Active category button is `:disabled` — clicking it does nothing (no deselect-on-click)
- Loading state: centered `Loader2` spinner (not skeleton grid)
- Pagination: custom button row from `pageNumbers = Array.from({ length: lastPage }, (_, i) => i+1)`
  — the old bug iterated `total` items; this iterates page numbers correctly
- Sort dropdown uses `rounded-xl` on trigger; `SelectContent` has inline style for background

### `pages/services/[id].vue` — Service detail
- Breadcrumb back link strip below navbar
- Cover image with category badge overlay
- Business info card
- `BookingPanel` sticky in right column (lg screens)
- Static mock reviews (3 items) — real reviews deferred
- Cancellation policy in `Alert` with `border-primary/30 bg-accent`

### `pages/book/[id].vue` — 4-step booking wizard
- `middleware: ['auth', 'role']`
- **Step indicator:** 4 circles + 3 connector segments. Each segment uses `scaleX` CSS transform
  with `origin-left` to animate a "drawing line" when the step is passed. Pulse ring (`animate-ping`)
  on the currently active step circle.
- **Step 1:** Date/time picker (same UI as BookingPanel)
- **Step 2:** Booking summary + cancellation policy alert (`border-primary/40 bg-accent`)
- **Step 3:** Login gate (skip if authenticated) — 5-min countdown, redirects to service on expiry
- **Step 4:** `POST /bookings` → spinner → confirmation card with reference number

### `pages/account/bookings.vue` — My Bookings
- `middleware: ['auth', 'role']`
- Stats from `fetchBookingStats()` — field is `totalSpent` (camelCase, not `total_spent`)
- Tabs lazy-load on first activation, cached in `cache: Record<string, Booking[]>`
- Uses `fetchMyBookings(tab)` and `cancelMyBooking(id)` (not old `fetchAccountBookings`)

---

## 12. Pages — Business Owner Portal

All pages: `middleware: ['auth', 'role']`, `layout: 'business'`

### `pages/business/index.vue` — Dashboard
- Stats row (4 cards): active services, pending bookings, upcoming, completed
- Pending bookings list (max 5) — links to `/business/bookings`
- Recent services list (max 5) — links to `/business/services`
- All data loaded in parallel with `Promise.all`

### `pages/business/services/index.vue` — Service list
- Debounced search, paginated
- Per-row: thumbnail, name, category badge, price, duration, active/inactive badge
- Service data is **camelCase** from backend (`s.priceCents`, `s.durationMinutes`, `s.isActive`, `s.coverImageUrl`) — `mapService()` is NOT applied here (see P3 in §16)
- Edit button → `NuxtLink` to `/business/services/:id/edit` (dedicated page, not inline Sheet — see P5 in §16)
- Availability button → `/business/services/:id/availability`
- Activate/Deactivate toggle via `updateService(id, { isActive: !s.isActive })`

### `pages/business/services/new.vue` — Create service
- Uses `BusinessServiceForm` component
- On success: toast + redirect to `/business/services/:id/availability`

### `pages/business/services/[id]/edit.vue` — Edit service
- Fetches service via `useBooking().fetchService(id)` (same public endpoint, no auth required)
- Submits via `useBusinessOwner().updateService(id, data)`

### `pages/business/services/[id]/availability.vue` — Availability management
Two tabs:

**Weekly schedule tab:**
- 7-column grid (Mon–Sun), each column lists rules as clickable chips
- "+ Add" dashed button opens `BusinessRuleEditorPanel` inline below the grid
- Rule editor validates: `startTime < endTime` and window divisible by slot duration
- Slot preview strip at bottom — fetches `GET /services/:id/availability?date=<today>`

**Date overrides tab:**
- 2-month calendar (current + next month), days colour-coded by block type:
  - Red = whole-day block, Amber = time-range block, White = no override
- Clicking a day opens `BusinessBlockEditorPanel` inline
- Active overrides list below calendar with Remove buttons

### `pages/business/bookings.vue` — Booking inbox
- Filters: status `Select` + dateFrom/dateTo date inputs
- `BusinessBookingRow` component per row
- Inline cancel: `expandedCancelId` ref tracks which row has cancel panel open (one at a time)
- Status changes update the row reactively (no page reload)

### `pages/business/profile.vue` — Business profile
- Form pre-populated from `fetchMyBusiness()`
- Slug field validates `/^[a-z0-9-]+$/`; 409 response shows field-level "slug already taken" error
- Danger zone: "Deactivate account" → shadcn `AlertDialog` confirmation → `deactivateAccount()`

---

## 13. Components

### Customer components
| Component | Purpose |
|---|---|
| `Navbar.vue` | Dark navy sticky header; `ListeoBook` brand; mobile hamburger with slide-down menu |
| `ServiceCard.vue` | `rounded-2xl`, `shadow-sm`, hover: `-translate-y-1.5` + `shadow-xl` via `transition-all` |
| `BookingPanel.vue` | 7-day date strip + slot grid; "X left" amber badge when `capacity > 1 && remainingCapacity ≤ 3` |
| `BookingCard.vue` | Status badge (amber/primary/green/gray), `<dl>` detail rows, inline cancel expand |

### Business components
| Component | Purpose |
|---|---|
| `business/ServiceForm.vue` | Reusable form; price in dollars (×100 before sending); Switch for isActive |
| `business/RuleEditorPanel.vue` | Inline rule editor; slot-math validation before save; inline delete confirm |
| `business/BlockEditorPanel.vue` | Inline block editor; radio for whole-day vs time-range |
| `business/BookingRow.vue` | Table row; Confirm/Decline for pending; Mark done/Cancel for confirmed; inline cancel reason input |

---

## 14. API Integration Status

Backend base: `runtimeConfig.public.apiBase` (env: `NUXT_PUBLIC_API_BASE`, default `http://localhost:3001`)

### ✅ Live (real API calls)

| Composable | Method | Endpoint |
|---|---|---|
| `fetchCategories()` | GET | `/categories` |
| `fetchServices(params)` | GET | `/services?categoryId=&q=&sort=&page=&perPage=` |
| `fetchService(id)` | GET | `/services/:id` |
| `fetchAvailability(id, date)` | GET | `/services/:id/availability?date=` |
| `login()` | POST | `/auth/login` |
| `register()` | POST | `/auth/register` |
| `logout()` | POST | `/auth/logout` |
| `fetchUser()` | GET | `/users/me` |
| `tryRefresh()` | POST | `/auth/refresh` |
| `updateProfile()` | PATCH | `/users/me` |
| `deactivateAccount()` | DELETE | `/users/me` |
| `fetchMyBusiness()` | GET | `/businesses/me` |
| `updateBusiness(id, data)` | PATCH | `/businesses/:id` |
| `fetchMyServices(params)` | GET | `/services?businessId=` |
| `createService(data)` | POST | `/services` |
| `updateService(id, data)` | PATCH | `/services/:id` |
| `fetchRules(svcId)` | GET | `/services/:id/availability-rules` |
| `createRule(svcId, data)` | POST | `/services/:id/availability-rules` |
| `updateRule(svcId, ruleId, data)` | PATCH | `/services/:id/availability-rules/:ruleId` |
| `deleteRule(svcId, ruleId)` | DELETE | `/services/:id/availability-rules/:ruleId` |
| `fetchBlocks(svcId)` | GET | `/services/:id/availability-blocks` |
| `createBlock(svcId, data)` | POST | `/services/:id/availability-blocks` |
| `updateBlock(svcId, blockId, data)` | PATCH | `/services/:id/availability-blocks/:blockId` |
| `deleteBlock(svcId, blockId)` | DELETE | `/services/:id/availability-blocks/:blockId` |
| `fetchBusinessBookings(params)` | GET | `/bookings/business` |
| `confirmBooking(id)` | PATCH | `/bookings/business/:id/status` → `{ status: 'confirmed' }` |
| `completeBooking(id)` | PATCH | `/bookings/business/:id/status` → `{ status: 'completed' }` |
| `cancelBusinessBooking(id, reason?)` | POST | `/bookings/business/:id/cancel` |

### ⏳ Mocked — `BookingsModule` not yet on backend

| Composable fn | Planned endpoint |
|---|---|
| `createBooking({ serviceId, bookingDate, bookingTime, notesFromCustomer? })` | `POST /bookings` |
| `fetchMyBookings(status, page?)` | `GET /bookings/my?status=upcoming\|past\|cancelled` |
| `fetchBookingStats()` | `GET /bookings/stats` → `{ upcoming, completed, totalSpent }` |
| `cancelMyBooking(id, reason?)` | `POST /bookings/my/:id/cancel` |

When wiring up: map `bookingDate→date`, `bookingTime→time`, `priceCents→price`,
`cancelledBy→cancelled_by`, etc. using `mapBooking()` in `useBooking.ts`.

---

## 15. Known Gaps & Deferred Work

| Item | Notes |
|---|---|
| `BookingsModule` (customer) | All 4 booking functions mocked; wire up when backend ships |
| Real reviews | Service detail shows 3 static mock reviews |
| Review submission | `?review=` param handled in URL but no form logic |
| Rescheduling | Button in `BookingCard` links to `/services/:id?reschedule=` but no logic |
| Avatar upload | `POST /files/upload` spec exists in integration doc; not wired |
| Mobile bottom sheet | `BookingPanel` has no mobile Sheet variant — desktop sticky only |
| `business/services/index.vue` | Uses raw camelCase API shape — see P3 in §16 (resolved) |
| `business/index.vue` debug output | `{{ recentServices }}` removed by developer (resolved) |
| Bearer token injection | `useBusinessOwner.ts` now relies on `$api` plugin; explicit headers were added and later simplified back to plugin-only (resolved) |

---

## 16. Patterns & Pitfalls — Lessons from Past Fixes

Concrete bugs that were introduced by AI-generated code and corrected by the developer.
Each entry states the rule, the root cause, and how to apply it going forward.

---

### P1 — `useState` (and all Nuxt composables) must be called inside a function, never at module scope

**Rule:** Never call `useState`, `useNuxtApp`, `useRoute`, or any auto-imported Nuxt composable
at module level (i.e. directly at the top level of a `.ts` file, outside any function body).

**What broke:** `useBusinessOwner.ts` had:
```ts
// ❌ WRONG — called at module scope
const _cachedBusiness = useState<BusinessProfile | null>('ownerBusiness', () => null)

export function useBusinessOwner() { ... }
```

Nuxt threw: *"A composable that requires access to the Nuxt instance was called outside of a
plugin, Nuxt hook, Nuxt middleware, or Vue setup function."*

**Fix:** Move the call inside the exported function. `useState` with a key is still a shared
singleton — the key ensures all callers get the same `Ref` regardless of how many times the
composable is instantiated:
```ts
// ✅ CORRECT
export function useBusinessOwner() {
  const _cachedBusiness = useState<BusinessProfile | null>('ownerBusiness', () => null)
  ...
}
```

**Apply:** Any time you want module-level shared state in a composable, use `useState(<key>)`
*inside* the function, not outside it.

---

### P2 — Availability rule `dayOfWeek` must be lowercase when sent to the backend

**Rule:** The backend availability rules API expects `dayOfWeek` as a **lowercase string**
(`'monday'`, `'tuesday'`, … `'sunday'`). The UI display uses title-case (`'Monday'`), but
`.toLowerCase()` must be applied before any `createRule` / `updateRule` call.

**What broke:** `availability.vue` sent `dayOfWeek: editingRule.value.dayOfWeek` directly.
The `DAYS` array is `['Monday','Tuesday',...]` so the backend received `'Monday'` and rejected or
silently mishandled the rule.

**Fix (applied by developer):**
```ts
const created = await createRule(serviceId, {
  dayOfWeek: editingRule.value.dayOfWeek.toLowerCase(), // ← required
  ...
})
```

**Apply:** Whenever building a payload that includes `dayOfWeek`, always call `.toLowerCase()`
on the value even if it looks correct, since the display array is title-case.

---

### P3 — Business owner service list uses raw camelCase; `mapService` is NOT applied

**Rule:** `fetchMyServices()` in `useBusinessOwner.ts` calls `/services/by-business` and returns
the raw backend camelCase shape. Do **not** apply `mapService()` or use snake_case field names
when working with service data from this composable.

| Business owner service field | Value |
|---|---|
| Name | `s.name` |
| Price (cents) | `s.priceCents` |
| Duration | `s.durationMinutes` |
| Active flag | `s.isActive` |
| Cover image URL | `s.coverImageUrl` |
| Category | `s.category.name` / `s.category.id` |

Customer-facing service data (from `useBooking.fetchServices` / `fetchService`) IS mapped through
`mapService()` and uses snake_case (`s.price`, `s.duration_minutes`, `s.cover_image_url`, etc.).
**These are two different shapes — do not mix them.**

---

### P4 — `fetchMyServices` does not need a `businessId` param

**Rule:** `GET /services/by-business` is an authenticated endpoint that derives the business from
the JWT token. **Do not** call `fetchMyBusiness()` first to get a `businessId` and pass it as a
query param. Just call the endpoint directly.

**What was wrong:** An earlier version of `useBusinessOwner.fetchMyServices` called
`fetchMyBusiness()` to get the ID, then passed `businessId: biz.id` as a query param.
The developer simplified it to pass the query params directly without `businessId`.

---

### P5 — Business edit forms navigate to a dedicated page, not inline Sheet

**Rule:** For complex service-management forms (create, edit service details), use navigation
to a dedicated page (`/business/services/:id/edit`), not an inline `Sheet` component.

**What broke:** An AI-generated edit button opened a `Sheet` drawer with a full inline form
(cover image upload, all service fields, categories fetch, etc.). The developer reverted this
to a simple `NuxtLink` to the existing edit page.

**When to use Sheet vs page navigation:**
- **Sheet** — quick single-action confirmations, small forms (< 3 fields), reason inputs
- **Page navigation** — complex forms with validation, multiple sections, image management

---

### P6 — `Booking` type is imported from `~/models`, not `~/types` in several business files

Several files (including `BookingCard.vue`, `BookingRow.vue`, `business/bookings.vue`,
`business/index.vue`) import `Booking` from `~/models`:
```ts
import type { Booking } from '~/models'
```
This is intentional — the `~/models` module contains a different Booking shape used by the
business owner portal. Do not change these imports to `~/types`. If adding new business owner
components that work with booking data, import from `~/models`.

---

### P7 — `nuxt.config.ts` CSS array includes two stylesheets

```ts
css: ['~/assets/css/tailwind.css', '~/assets/css/listeo.css']
```

Both must be present. Do not remove `listeo.css` or reorder the entries.

---

## 17. Environment

```env
NUXT_PUBLIC_API_BASE=http://localhost:3001
```

Set in `.env`. Exposed to client via `nuxt.config.ts`:
```ts
runtimeConfig: {
  public: { apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001' }
}
```
