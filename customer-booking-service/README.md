# customer-booking-service (ListeoBook)

Nuxt 4 frontend for the ListeoBook booking platform. Provides two distinct experiences: a customer-facing service browser and booking wizard, and a business owner dashboard for managing services, availability, and bookings.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4.4 (Vue 3.5) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 + tailwindcss-animate |
| Components | shadcn-nuxt + reka-ui (headless) |
| Icons | lucide-vue-next + @radix-icons/vue |
| State | Pinia 3 + @pinia/nuxt |
| Forms | vee-validate 4 + Zod 4 |
| HTTP | Nuxt `$fetch` with custom `$api` plugin |
| Dates | date-fns 4 |
| Toasts | vue-sonner |
| Utilities | @vueuse/core |
| Package Manager | pnpm 10 |

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10
- Backend API running at `http://localhost:3001`

### Installation

```bash
pnpm install
```

### Environment

Create a `.env` file in this directory:

```env
NUXT_PUBLIC_API_BASE=http://localhost:3001
```

### Run

```bash
pnpm dev        # development server at http://localhost:3000
pnpm build      # production build
pnpm preview    # preview production build
pnpm generate   # static site generation
```

## Application Structure

```
app/
├── app.vue                     # Root — role-based redirect on mount
├── assets/css/                 # Tailwind entry + custom theme variables
├── plugins/
│   ├── api.ts                  # $api: fetch wrapper with auth + token refresh
│   └── auth.ts                 # Hydrates user state on app init
├── middleware/
│   ├── auth.ts                 # Redirects unauthenticated users to /auth/login
│   └── role.ts                 # Separates customer and business_owner routes
├── stores/
│   ├── booking.ts              # 4-step booking wizard state (Pinia)
│   └── bookingIntent.ts        # Booking intent persistence
├── composables/
│   ├── useAuth.ts              # login, register, logout, refresh, profile
│   ├── useBooking.ts           # services, availability, bookings
│   ├── useBusinessOwner.ts     # business dashboard operations
│   ├── useReviews.ts           # reviews + rating stats
│   ├── useFormatters.ts        # currency, date, time formatting
│   └── useNotify.ts            # toast notifications (vue-sonner)
├── types/
│   └── index.ts                # Shared TypeScript interfaces
├── layouts/
│   ├── default.vue             # Customer layout with Navbar
│   └── business.vue            # Business owner sidebar layout
├── pages/
│   ├── index.vue               # Smart role-based redirect
│   ├── services/
│   │   ├── index.vue           # Service browser (search, filter, sort, paginate)
│   │   └── [id].vue            # Service detail with reviews
│   ├── book/
│   │   └── [id].vue            # 4-step booking wizard
│   ├── auth/
│   │   ├── login.vue           # Email/password + Google OAuth
│   │   ├── register.vue        # Customer registration
│   │   └── callback.vue        # Google OAuth token handler
│   ├── account/
│   │   ├── bookings.vue        # Customer booking history + cancel
│   │   └── profile.vue         # Profile edit + account deactivation
│   └── business/
│       ├── index.vue           # Dashboard: stats, pending bookings
│       ├── profile.vue         # Business profile editor
│       ├── account.vue         # Owner user profile
│       ├── bookings.vue        # Booking management (filter, confirm, complete, cancel)
│       ├── feedback.vue        # Reviews received
│       └── services/
│           ├── index.vue       # Service list
│           ├── new.vue         # Create service
│           ├── [id]/edit.vue   # Edit service
│           └── [id]/availability.vue  # Availability rules + blocks
└── components/
    ├── Navbar.vue
    ├── ServiceCard.vue
    ├── BookingCard.vue
    ├── BookingPanel.vue
    ├── ReviewCard.vue
    ├── ReviewFormModal.vue
    ├── StarRating.vue
    ├── business/
    │   ├── BookingRow.vue
    │   ├── ServiceForm.vue
    │   ├── RuleEditorPanel.vue   # Weekly recurring slot editor
    │   └── BlockEditorPanel.vue  # Date-specific block editor
    └── ui/                       # shadcn-nuxt primitives (auto-imported)
```

## Key Design Patterns

### API Client (`$api`)

A plugin wraps Nuxt's `$fetch` and is injected as `$api` across the app. It:
- Attaches `Authorization: Bearer <accessToken>` to every request
- Intercepts `401` responses and calls `tryRefresh()` once (singleton promise prevents concurrent refresh races)
- Retries the original request after a successful refresh
- Calls `logout()` and redirects to `/auth/login` if refresh fails

### Auth State

Tokens are stored in `useCookie` with `sameSite: lax`:
- Access token — 20 minute max age
- Refresh token — 30 day max age

User state lives in `useState('user')` for SSR-safe reactivity across components.

### Booking Wizard (Pinia)

A 4-step flow managed by the `booking` Pinia store:
1. **Date & Time** — calendar picker + available slot grid
2. **Review** — booking summary before confirmation
3. **Sign-in gate** — prompted if unauthenticated; has a 5-minute countdown timer; step is skipped for logged-in users
4. **Confirmation** — submits booking, shows reference code

### Role-Based Routing

Two route middleware files enforce role separation:
- `auth` — redirects unauthenticated access to `/auth/login`
- `role` — redirects `business_owner` away from `/account/*` and `/book/*`; redirects `customer` away from `/business/*`

## Pages Overview

### Customer Routes

| Path | Description |
|---|---|
| `/services` | Browse all services with search, category filter, and sort options |
| `/services/:id` | Service detail: description, review carousel, book CTA |
| `/book/:id` | 4-step booking wizard |
| `/account/bookings` | Booking history with cancel option |
| `/account/profile` | Edit profile; deactivate account |
| `/auth/login` | Email/password login + Google OAuth button |
| `/auth/register` | Customer sign-up |
| `/auth/callback` | Handles Google OAuth redirect (reads tokens from query params) |

### Business Owner Routes

| Path | Description |
|---|---|
| `/business` | Dashboard: stats cards, pending bookings, recent services |
| `/business/services` | Service list with edit/delete |
| `/business/services/new` | Create a new service |
| `/business/services/:id/edit` | Edit service details |
| `/business/services/:id/availability` | Manage weekly rules and date-specific blocks |
| `/business/bookings` | Full booking list with filter, confirm, complete, cancel |
| `/business/feedback` | Reviews received across all services |
| `/business/profile` | Edit business profile (name, description, address, logo) |
| `/business/account` | Owner personal profile |

## Composables Reference

| Composable | Responsibility |
|---|---|
| `useAuth` | `login`, `register`, `logout`, `tryRefresh`, `fetchUser`, `updateProfile`, `deactivateAccount` |
| `useBooking` | `fetchCategories`, `fetchServices`, `fetchService`, `fetchAvailability`, `createBooking`, `fetchMyBookings`, `cancelMyBooking` |
| `useBusinessOwner` | `fetchMyBusiness`, `updateBusiness`, service CRUD, booking status management, availability rule/block CRUD |
| `useReviews` | `fetchReviews`, `createReview`, `deleteReview`, `getReviewStats` |
| `useFormatters` | `formatCurrency`, `formatBookingDate`, `formatBookingTime` |
| `useNotify` | `notify.success(msg)`, `notify.error(msg)` |
