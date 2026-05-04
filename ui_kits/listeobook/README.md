# ListeoBook — Customer Web UI Kit

A high-fidelity React recreation of the customer-facing booking flow from `customer-booking-service/`. Click-thru prototype showing the four core surfaces:

1. **Services listing** — hero search + category pills + sort + grid of `ServiceCard`
2. **Service detail** — cover image + about + reviews + sticky `BookingPanel`
3. **Booking wizard** — 3-step flow (confirm → review → confirmed)
4. **Account bookings** — stats + tabs (Upcoming / Past / Cancelled) + `BookingCard` with inline cancel
5. **Sign in** — split-panel auth with gradient left and form card right

## Files
- `index.html` — entrypoint; mounts `<App>` with internal routing
- `styles.css` — design-token-bound stylesheet (mirrors `app/assets/css/tailwind.css`)
- `Atoms.jsx` — `Lockup`, `Button`, `Badge`, `CategoryPill`, `Input`, `LbIcon`
- `Chrome.jsx` — `Navbar`, `Footer`
- `BookingComponents.jsx` — `ServiceCard`, `BookingPanel`, `BookingCard`
- `Pages.jsx` — `ServicesPage`, `ServiceDetailPage`, `BookWizard`, `AccountBookings`, `SignInPage`
- `AvailabilityHours.jsx` + `availability.css` — merchant-facing weekly schedule editor (`<AvailabilityHours service rules .../>`); demo at `availability.html`. Generalized from the V1 "Shop hours" exploration in `designs/availability/`.

## How it differs from the codebase
- Vue → React (cosmetic recreation, not a port).
- API calls are mocked with in-file demo data; `vee-validate`/`zod`/`pinia` are not modeled.
- Reka UI Select replaced with a styled native `<select>`.
- Toast notifications and skeleton states are simplified to inline UI.

## Try it
1. Lands on the services listing
2. Click a service → service detail
3. Pick a date & time → "Continue to booking" → forces sign-in if not authed → wizard
4. Confirm booking → arrives in My Bookings
5. Try cancelling — inline confirm appears in the card
