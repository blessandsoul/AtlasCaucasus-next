# Booking System Overhaul Plan

## Context

The current booking system is incomplete and confusing. Bookings are auto-created when a provider accepts an inquiry, but they contain **no useful data** — no date, no guest count, no price, no tour name. There's no way for a customer to directly book a tour (pick a date, select guests, see price). The provider has no dashboard to manage received bookings. The booking card shows "Tour Booking" instead of the actual tour name. There's no booking detail page and no proper confirmation flow. This is the most important feature on the platform — it must be flawless, intuitive, and elder-friendly.

**Approach**: Two booking paths (like Booking.com):
1. **Direct Booking** for tours with set availability — date picker, guest counter, price summary, instant booking
2. **Inquiry Booking** (existing) for custom requests, guides, and drivers — enhanced with optional date/guests fields

**No payment integration** in this phase — focus entirely on flow, confirmations, notifications, and provider tools.

---

## Phase 1: Database Schema Changes

**Goal**: Extend the Booking model. All new fields are nullable — zero breaking changes.

### 1.1 Update Prisma Schema

**File**: `server/prisma/schema.prisma`

**Add to `BookingStatus` enum:**
```
PENDING    — customer submitted, awaiting provider confirmation
DECLINED   — provider declined the booking
```

**Add fields to `Booking` model:**
```prisma
// Provider-facing fields
providerNotes    String?   @map("provider_notes") @db.Text
confirmedAt      DateTime? @map("confirmed_at")
declinedAt       DateTime? @map("declined_at")
declinedReason   String?   @map("declined_reason") @db.Text
completedAt      DateTime? @map("completed_at")

// Denormalized entity info (so cards show "Mountain Hiking Tour" not "Tour Booking")
entityName       String?   @map("entity_name") @db.VarChar(255)
entityImage      String?   @map("entity_image") @db.VarChar(512)
providerUserId   String?   @map("provider_user_id")
providerName     String?   @map("provider_name") @db.VarChar(255)

// Contact info
contactPhone     String?   @map("contact_phone") @db.VarChar(20)
contactEmail     String?   @map("contact_email") @db.VarChar(255)

// Human-readable reference (e.g., "BK-260210-A3F2")
referenceNumber  String?   @unique @map("reference_number") @db.VarChar(20)
```

**Add indexes:**
```prisma
@@index([providerUserId, status])
@@index([referenceNumber])
```

**Add to `NotificationType` enum:**
```
BOOKING_CONFIRMED
BOOKING_DECLINED
BOOKING_CANCELLED
BOOKING_COMPLETED
```

### 1.2 Run Migration

```bash
cd server
npm run prisma:migrate dev --name add_booking_flow_fields
npm run prisma:generate
```

### 1.3 Backfill Existing Bookings

**New file**: `server/src/scripts/backfill-booking-entity-info.ts`

One-time script to populate `entityName`, `entityImage`, `providerUserId`, `providerName`, and `referenceNumber` for all existing bookings by looking up their linked tour/guide/driver.

Reference number format: `BK-YYMMDD-XXXX` (e.g., `BK-260210-A3F2`)

```typescript
function generateBookingRef(): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${yy}${mm}${dd}-${suffix}`;
}
```

### Verification
- [ ] `npm run prisma:generate` succeeds
- [ ] `npm run prisma:studio` shows new columns on bookings table
- [ ] Existing bookings still load in the dashboard (no breaking changes)
- [ ] Backfill script populates entity info on existing bookings

---

## Phase 2: Server — New Endpoints & Business Logic

**Goal**: Direct booking creation, availability checking, provider confirm/decline, and full notification loop.

### 2.1 New Types

**File**: `server/src/modules/bookings/booking.types.ts`

Add interfaces:
- `CreateDirectBookingData` — userId, entityType, entityId, date, guests, notes?, contactPhone?, contactEmail?
- `ConfirmBookingData` — providerNotes?
- `DeclineBookingData` — declinedReason (required)
- `BookingDetail` — full booking with all new fields + user info
- `AvailabilityResult` — available, remainingSpots, reason?

### 2.2 New Zod Schemas

**File**: `server/src/modules/bookings/booking.schemas.ts`

```typescript
CreateDirectBookingSchema:
  - entityType: z.enum(["TOUR", "GUIDE", "DRIVER"])
  - entityId: z.string().uuid()
  - date: z.coerce.date() — must be in the future
  - guests: z.coerce.number().int().min(1).max(100)
  - notes: z.string().max(1000).optional()
  - contactPhone: z.string().max(20).optional()
  - contactEmail: z.string().email().optional()

ConfirmBookingSchema:
  - providerNotes: z.string().max(1000).optional()

DeclineBookingSchema:
  - declinedReason: z.string().min(1).max(1000) — required
```

### 2.3 Repository Updates

**File**: `server/src/modules/bookings/booking.repo.ts`

New methods:
- `createDirectBooking(data)` — creates PENDING booking, looks up entity to populate entityName/entityImage/providerUserId/providerName, generates referenceNumber
- `findByIdWithDetails(id)` — returns booking with all new fields + user info
- `confirmBooking(id, providerNotes?)` — sets status=CONFIRMED, confirmedAt=now()
- `declineBooking(id, reason)` — sets status=DECLINED, declinedAt=now(), declinedReason
- Update existing `completeBooking` to also set `completedAt`
- Update `findReceivedByProvider` to use `providerUserId` column (faster than current 3-table OR query)

### 2.4 Service Updates

**File**: `server/src/modules/bookings/booking.service.ts`

**New method: `createDirectBooking(data)`**
1. Validate entity exists and `isActive === true`
2. Block self-booking: if entity owner === userId → `BadRequestError("You cannot book your own tour")`
3. For TOUR: call `checkTourAvailability(tourId, date, guests)` — reject if unavailable
4. Calculate `totalPrice = tour.price * guests`
5. Create booking with status `PENDING`, full entity info populated
6. Notify provider (in-app notification + email)
7. Return booking

**New method: `getBookingById(bookingId, userId)`**
- Fetch booking with full details via `findByIdWithDetails`
- Authorize: user must be the customer (booking.userId) OR the provider (booking.providerUserId)
- Throw `ForbiddenError` otherwise
- Return BookingDetail

**New method: `confirmBooking(bookingId, providerUserId, data)`**
- Verify entity ownership via existing `verifyEntityOwnership()`
- Check booking status === PENDING, else throw appropriate error
- Update to CONFIRMED + confirmedAt
- Send notification + email to customer
- Return updated booking

**New method: `declineBooking(bookingId, providerUserId, data)`**
- Verify entity ownership
- Check booking status === PENDING
- Update to DECLINED + declinedAt + declinedReason
- Send notification + email to customer
- Return updated booking

**New method: `checkTourAvailability(tourId, date, guests)`**
- Fetch tour with availabilityType, availableDates, maxPeople
- Check date against availability rules:
  - `DAILY` — any future date is valid
  - `WEEKDAYS` — Monday through Friday only
  - `WEEKENDS` — Saturday and Sunday only
  - `SPECIFIC_DATES` — date must exist in the availableDates JSON array
  - `BY_REQUEST` — always valid (provider will manually confirm)
- Count existing PENDING + CONFIRMED bookings for that tour+date
- `remainingSpots = maxPeople - totalBookedGuests`
- If `guests > remainingSpots` → return `{ available: false, remainingSpots, reason }`
- Return `{ available: true, remainingSpots }`

**Update existing `cancelBooking`**
- Allow cancelling PENDING bookings too (not just CONFIRMED)
- After cancellation: send notification + email to provider (currently missing)

**Update existing `completeBooking`**
- Set `completedAt = new Date()` on the booking
- After completion: send notification + email to customer (currently missing)

### 2.5 Controller Updates

**File**: `server/src/modules/bookings/booking.controller.ts`

New handlers:

```
createBooking(request, reply)
  → validate body with CreateDirectBookingSchema
  → call bookingService.createDirectBooking({ ...body, userId: request.user.id })
  → return reply.status(201).send(successResponse("Booking created", booking))

getBooking(request, reply)
  → validate params.id with BookingIdParamSchema
  → call bookingService.getBookingById(id, request.user.id)
  → return reply.send(successResponse("Booking retrieved", booking))

confirmBooking(request, reply)
  → validate params.id, body with ConfirmBookingSchema
  → call bookingService.confirmBooking(id, request.user.id, body)
  → return reply.send(successResponse("Booking confirmed", booking))

declineBooking(request, reply)
  → validate params.id, body with DeclineBookingSchema
  → call bookingService.declineBooking(id, request.user.id, body)
  → return reply.send(successResponse("Booking declined", booking))

checkAvailability(request, reply)
  → validate params.id, query (date, guests)
  → call bookingService.checkTourAvailability(id, date, guests)
  → return reply.send(successResponse("Availability checked", result))
```

### 2.6 Route Updates

**File**: `server/src/modules/bookings/booking.routes.ts`

| Method | Path | Rate Limit | Auth |
|--------|------|-----------|------|
| POST | /bookings | 10/min | Required |
| GET | /bookings/:id | 100/min | Required |
| PATCH | /bookings/:id/confirm | 30/min | Required |
| PATCH | /bookings/:id/decline | 30/min | Required |

**File**: `server/src/modules/tours/tour.routes.ts`

| Method | Path | Rate Limit | Auth |
|--------|------|-----------|------|
| GET | /tours/:id/availability | 60/min | Not required |

### 2.7 Email Templates

**File**: `server/src/libs/email.ts`

Add 5 new email functions following the existing `sendBookingConfirmedEmail` pattern and HTML template style:

1. **`sendNewBookingRequestEmail`** — to provider
   - Trigger: customer creates a direct booking
   - Content: "{customerName} has requested to book {entityName}" with booking date, guests, reference number
   - CTA button: "View Booking Request" → /dashboard/bookings/received

2. **`sendBookingConfirmedNotificationEmail`** — to customer
   - Trigger: provider confirms a PENDING booking
   - Content: green header, "Your booking has been confirmed!", reference number, date, guests, provider notes if any
   - CTA button: "View Booking" → /dashboard/bookings/{bookingId}

3. **`sendBookingDeclinedEmail`** — to customer
   - Trigger: provider declines a PENDING booking
   - Content: red/muted header, "{providerName} was unable to accept your booking", includes declined reason
   - CTA button: "Browse Other Tours" → /explore/tours

4. **`sendBookingCancelledEmail`** — to provider
   - Trigger: customer cancels a booking
   - Content: red header, "{customerName} has cancelled their booking for {entityName}", reference number, date
   - CTA button: "View Bookings" → /dashboard/bookings/received

5. **`sendBookingCompletedEmail`** — to customer
   - Trigger: provider marks booking as completed
   - Content: green header, "Your booking is complete!", reference number
   - CTA button: "Leave a Review" → entity detail page

### 2.8 Notification Helpers

**File**: `server/src/modules/notifications/notification.service.ts`

Add helper methods (following existing `notifyInquiryReceived` pattern):
- `notifyBookingPending(providerUserId, bookingId, customerName, entityName)`
- `notifyBookingConfirmed(customerUserId, bookingId, providerName, entityName)`
- `notifyBookingDeclined(customerUserId, bookingId, providerName, entityName)`
- `notifyBookingCancelled(providerUserId, bookingId, customerName, entityName)`
- `notifyBookingCompleted(customerUserId, bookingId, entityName)`

### 2.9 Fix Inquiry-Based Booking Auto-Creation

**File**: `server/src/modules/inquiries/inquiry.service.ts`

Update `createBookingFromInquiry` method (around line 409) to:
- Look up the entity to populate `entityName`, `entityImage`, `providerUserId`, `providerName`
- Generate `referenceNumber`
- Set `confirmedAt = new Date()` (provider already accepted the inquiry, so it's immediately confirmed)
- Status stays CONFIRMED (correct — this is an explicit acceptance)

### Verification
- [ ] `POST /api/v1/bookings` with valid tour/date/guests → creates PENDING booking with full entity info
- [ ] `GET /api/v1/bookings/:id` → returns complete booking detail
- [ ] `PATCH /api/v1/bookings/:id/confirm` as provider → CONFIRMED + customer notified
- [ ] `PATCH /api/v1/bookings/:id/decline` as provider → DECLINED with reason + customer notified
- [ ] `GET /api/v1/tours/:id/availability?date=2026-03-01&guests=4` → correct availability
- [ ] Booking own tour → 400 "You cannot book your own tour"
- [ ] Date in past → 422 validation error
- [ ] Guests > maxPeople → 400 "Not enough spots available"
- [ ] Notifications created for every status transition
- [ ] Emails sent for every status transition
- [ ] Existing cancel/complete endpoints still work
- [ ] Inquiry acceptance still creates bookings (now with entity info populated)

---

## Phase 3: Client — Types, Services, Hooks

**Goal**: Update the client data layer. No visual changes yet.

### 3.1 Update Types

**File**: `client/src/features/bookings/types/booking.types.ts`

- Add `PENDING` and `DECLINED` to `BookingStatus` type
- Add all new fields to `Booking` interface:
  - entityName, entityImage, providerUserId, providerName
  - providerNotes, confirmedAt, declinedAt, declinedReason, completedAt
  - contactPhone, contactEmail, referenceNumber
- Add new interfaces:
  - `CreateDirectBookingInput` — entityType, entityId, date (ISO string), guests, notes?, contactPhone?, contactEmail?
  - `ConfirmBookingInput` — providerNotes?
  - `DeclineBookingInput` — declinedReason
  - `AvailabilityResult` — available, remainingSpots, reason?

### 3.2 Update API Endpoints

**File**: `client/src/lib/constants/api-endpoints.ts`

Add to BOOKINGS:
```typescript
CONFIRM: (id: string) => `/bookings/${id}/confirm`
DECLINE: (id: string) => `/bookings/${id}/decline`
```

Add to TOURS:
```typescript
AVAILABILITY: (id: string) => `/tours/${id}/availability`
```

### 3.3 Update Routes Constants

**File**: `client/src/lib/constants/routes.ts`

Change BOOKINGS from a simple string to an object:
```typescript
BOOKINGS: {
  ROOT: '/dashboard/bookings',
  RECEIVED: '/dashboard/bookings/received',
  DETAIL: (id: string) => `/dashboard/bookings/${id}`,
  CONFIRMATION: (id: string) => `/dashboard/bookings/${id}/confirmation`,
}
```

**Important**: Update all existing references to `ROUTES.BOOKINGS` (it was a string) → `ROUTES.BOOKINGS.ROOT` throughout the codebase. Search for usages in:
- `client/src/components/layout/dashboard/DashboardSidebarNav.tsx`
- Any other files referencing `ROUTES.BOOKINGS`

### 3.4 Update Booking Service

**File**: `client/src/features/bookings/services/booking.service.ts`

Add methods:
```typescript
createBooking(data: CreateDirectBookingInput): Promise<Booking>
getBooking(id: string): Promise<Booking>
confirmBooking(id: string, data: ConfirmBookingInput): Promise<Booking>
declineBooking(id: string, data: DeclineBookingInput): Promise<Booking>
checkTourAvailability(tourId: string, date: string, guests: number): Promise<AvailabilityResult>
```

### 3.5 Update Hooks

**File**: `client/src/features/bookings/hooks/useBookings.ts`

Add query key entries:
```typescript
detail: (id: string) => [...bookingKeys.all, 'detail', id] as const
```

Add hooks:
- `useBooking(id: string)` — single booking detail query, enabled when id is truthy
- `useCreateBooking()` — mutation, invalidates all booking queries on success, shows toast
- `useConfirmBooking()` — mutation for providers, invalidates queries, shows success toast
- `useDeclineBooking()` — mutation for providers, invalidates queries, shows success toast
- `useTourAvailability(tourId, date, guests)` — query, enabled only when date is not null

### Verification
- [ ] TypeScript compilation passes with no errors
- [ ] Existing booking pages still render correctly
- [ ] New hooks can be imported and called without errors

---

## Phase 4: Client — Pages & Components

**Goal**: Build the new UI. This is the biggest phase — implement in the sub-step order below.

### 4.1 Improve Existing Booking Cards (Quick Win — Do First)

**File**: `client/src/app/dashboard/bookings/page.tsx`

Changes to the `BookingCard` component:
- Show `booking.entityName` instead of `"Tour Booking"` (fallback to entity type if entityName is null)
- Add small entity image thumbnail on the left side of the card
- Display reference number below the title (`text-xs text-muted-foreground`)
- Show provider name in the details row
- Make the entire card clickable → navigates to `/dashboard/bookings/${booking.id}`
- Add PENDING status config: amber/yellow color, Clock icon, label "Pending"
- Add DECLINED status config: muted gray, XCircle icon, label "Declined"
- Add "Pending" tab to the TABS array and stat cards

### 4.2 Booking Detail Page

**New route file**: `client/src/app/dashboard/bookings/[id]/page.tsx`
**New component**: `client/src/features/bookings/components/BookingDetailPage.tsx`

Layout:
- **Header**: Reference number (large), status badge
- **Status timeline**: Visual horizontal stepper showing booking progress
- **Entity info card**: Tour/guide/driver name, image, provider name, link to entity's explore page
- **Booking details card**: Date (formatted), guest count, total price, currency, customer notes
- **Provider notes card** (shown if providerNotes exists, or if declinedReason exists)
- **Actions section** (contextual based on role and status):
  - Customer + PENDING → "Cancel Booking" button
  - Customer + CONFIRMED → "Cancel Booking" button
  - Provider + PENDING → "Confirm Booking" button (green) + "Decline" button (red)
  - Provider + CONFIRMED → "Mark as Complete" button
- **Activity log**: List of timestamps — "Created on {date}", "Confirmed on {date}", etc.

**New component**: `client/src/features/bookings/components/BookingStatusTimeline.tsx`

Visual horizontal stepper:
```
  (1)  ———  (2)  ———  (3)
PENDING   CONFIRMED  COMPLETED
```
- Filled/colored circle for completed steps
- Current step has a pulse animation
- Outlined/gray for future steps
- DECLINED and CANCELLED shown as red branching paths
- Timestamps shown under each completed step
- Text labels under each dot (elder-friendly — not just dots)

### 4.3 Provider Received Bookings Page

**New route file**: `client/src/app/dashboard/bookings/received/page.tsx`
**New component**: `client/src/features/bookings/components/ReceivedBookingsPage.tsx`

Similar to existing bookings page but from the provider perspective:
- Page title: "Received Bookings"
- Tab filters: All | Pending | Confirmed | Completed | Declined | Cancelled
- Stat cards for Pending (amber), Confirmed (blue), Completed (green)
- Each booking card shows:
  - Customer name and email
  - Entity name (which tour/guide/driver)
  - Booking date, guest count, total price
  - Status badge
  - Reference number
- **Pending cards have prominent inline action buttons:**
  - "Confirm" (green, large) — opens ConfirmBookingDialog
  - "Decline" (red outline) — opens DeclineBookingDialog
- **Confirmed cards have:**
  - "Mark Complete" button — with confirmation dialog
- Cards are clickable → navigate to booking detail page
- Empty states per tab with clear messaging

**New component**: `client/src/features/bookings/components/ConfirmBookingDialog.tsx`
- AlertDialog with optional "Add a note for the customer" textarea
- "Confirm Booking" primary action button
- "Cancel" secondary button

**New component**: `client/src/features/bookings/components/DeclineBookingDialog.tsx`
- AlertDialog with required "Reason for declining" textarea
- Clear label: "Please provide a reason — the customer will see this"
- "Decline Booking" destructive action button
- "Cancel" secondary button

### 4.4 Direct Booking Dialog (Core Feature)

**New component**: `client/src/features/bookings/components/DirectBookingDialog.tsx`

**3-step wizard** designed to be elder-friendly (large text, large buttons, clear step numbers):

**Step indicator at the top:**
```
  (1)           (2)            (3)
Choose Date  ·  Guests  ·  Confirm
```
Large numbered circles with text labels. Active step is primary-colored, completed steps have checkmarks.

**Step 1 — Choose Date**
- shadcn Calendar component
- Available dates are selectable (normal styling)
- Unavailable dates are grayed out and disabled
- Availability type label shown: "Available daily", "Weekdays only", "Weekends only", "Specific dates only", "By request"
- After selecting a date: large formatted display "Saturday, March 1, 2026"
- "Next" button (large, primary, full-width)
- Uses `useTourAvailability` to validate selection

**Step 2 — Choose Guests**
- Large +/- counter (not a tiny number input)
- Current count in `text-3xl font-bold` center
- "X spots remaining for this date" helper text
- Price per person shown
- Total price updates live: "Total: $120" in `text-xl font-bold`
- Min: 1, Max: remaining spots
- "Next" button + "Back" button

**New component**: `client/src/features/bookings/components/GuestCounter.tsx`
```
  [ - ]    4    [ + ]
```
- Buttons are 48px minimum height
- aria-label="Decrease guests" / "Increase guests"
- Keyboard accessible (Tab + Enter/Space)
- Disable "-" at min, "+" at max

**Step 3 — Review & Confirm**
- Summary card with:
  - Tour name + small image thumbnail
  - Selected date (formatted nicely)
  - Guest count
  - Price per person
  - **Total price (text-xl font-bold — impossible to miss)**
- Optional notes textarea ("Special requests or notes for the provider")
- Optional contact phone input
- Clear explanatory text: "After you confirm, the tour provider will review your booking request. You'll be notified when they respond."
- "Confirm Booking" button (large, primary, full-width, h-12)
- "Go Back" secondary button
- Loading state on submit (spinner + disabled)

On success → navigate to `/dashboard/bookings/{id}/confirmation`

### 4.5 Booking Confirmation Page

**New file**: `client/src/app/dashboard/bookings/[id]/confirmation/page.tsx`
**New component**: `client/src/features/bookings/components/BookingConfirmation.tsx`

Post-booking success page:
- Large green checkmark icon (animated)
- "Booking Submitted!" heading in `text-2xl font-bold`
- Reference number displayed prominently (large, could be copyable)
- Summary: tour name, date, guests, total price
- Status message in a muted info card: "Waiting for provider confirmation — you'll be notified by email when they respond."
- "View Booking Details" primary button → /dashboard/bookings/{id}
- "Browse More Tours" secondary text link → /explore/tours

### 4.6 Update Tour Detail Page

**File**: `client/src/app/explore/tours/[id]/TourDetailsClient.tsx`

Changes:
- Main "Book Now" CTA opens `DirectBookingDialog` (instead of `RequestInquiryDialog`)
- Add secondary "Ask a Question" text link below that opens `RequestInquiryDialog` (for custom inquiries)
- For tours with `availabilityType === 'BY_REQUEST'`: main button says "Request Booking" (still opens DirectBookingDialog, but Step 1 shows a note: "This tour is available by request — the provider will confirm your preferred date")
- Pass tour data (id, name, image, price, currency, maxPeople, availabilityType, availableDates) to DirectBookingDialog

### 4.7 Enhance Inquiry Dialog for Guides/Drivers

**File**: `client/src/features/inquiries/components/RequestInquiryDialog.tsx`

Add two optional fields below the existing message field:
- **Preferred date** — date picker (optional), label: "Preferred date (optional)"
- **Number of guests** — number input (optional), label: "Number of guests (optional)"
- When filled, these are appended to the inquiry message as structured data:
  ```
  ---
  Preferred date: March 1, 2026
  Guests: 4
  ```
- Keeps backward compatibility — these fields are optional, existing flow unchanged

### 4.8 Update Dashboard Sidebar Navigation

**File**: `client/src/components/layout/dashboard/DashboardSidebarNav.tsx`

Add a "Received Bookings" nav item in the Management section:
- Icon: CalendarCheck (or similar)
- Label: "Received Bookings"
- Href: `/dashboard/bookings/received`
- Visible to roles: COMPANY, GUIDE, DRIVER
- Match pattern for active state

### Verification
- [ ] Tour detail page → click "Book Now" → 3-step wizard opens and works end-to-end
- [ ] After successful booking → confirmation page with reference number
- [ ] Dashboard → booking cards show entity name, image, reference number, provider name
- [ ] Click a booking card → detail page loads with status timeline
- [ ] Provider sidebar shows "Received Bookings" link
- [ ] Provider → Received Bookings → sees pending bookings with confirm/decline buttons
- [ ] Provider confirms → customer's booking updates, notification sent
- [ ] Provider declines with reason → customer sees "Declined" with reason text
- [ ] Customer cancels → provider gets notification
- [ ] Guide/driver inquiry dialog has optional date and guest count fields
- [ ] All new pages have proper loading skeletons and empty states

---

## Phase 5: Polish, Edge Cases, Accessibility

**Goal**: Elder-friendly final touches, edge case handling, automated cleanup.

### 5.1 Elder-Friendly UI Standards

Apply across ALL new booking components:

| Element | Minimum Size | Why |
|---------|-------------|-----|
| Body text | `text-base` (16px) | Readable without squinting |
| Labels | `text-lg` (18px) | Clear field identification |
| Buttons (primary) | `h-12` (48px height) | Large touch target |
| Touch targets | 44x44px | WCAG 2.1 minimum |
| Step numbers | 32px circles with text labels | Not just tiny dots |
| Price display | `text-xl font-bold` | Unmistakable |
| Status badges | icon + text always | Never icon-only |

Additional elder-friendly patterns:
- "Go Back" button on every wizard step (not just browser back)
- Confirmation dialogs use extra-clear language: "This will cancel your booking. The provider will be notified. You cannot undo this."
- No complex gestures — only clicks/taps
- High contrast on all text (WCAG AA 4.5:1 minimum)

### 5.2 Loading & Error States

For every new page/component:
- **Booking creation**: loading spinner inside button + button disabled during submit
- **Availability check**: inline spinner next to the date while checking
- **Booking detail page**: full skeleton loader matching the layout shape
- **Received bookings page**: skeleton cards matching card layout
- **Error boundary**: wrap all booking pages — show "Something went wrong" with retry button
- **Empty states per tab**: helpful message + CTA (e.g., "No pending bookings. Your new booking requests will appear here.")

### 5.3 Booking Expiration Cron Job

**New file**: `server/src/jobs/bookingExpiration.ts`

Following the pattern of `server/src/jobs/inquiryExpiration.ts`:
- Runs every hour via node-cron
- Finds all PENDING bookings older than 48 hours
- Auto-declines them with reason: "Expired — provider did not respond in time"
- Sends notification + email to the customer
- Logs results

**Register in**: `server/src/server.ts` (alongside existing scheduled jobs)

### 5.4 Edge Case Handling

| Edge Case | How It's Handled |
|-----------|-----------------|
| User tries to book their own tour | Server returns `BadRequestError("You cannot book your own tour")`, client shows toast |
| Tour becomes inactive during booking | Server checks `isActive` on submit, returns "Tour is no longer available" |
| Concurrent booking exhausts capacity | Server rejects with "Not enough spots available for this date", client shows toast |
| PENDING booking not responded to | Cron job auto-declines after 48 hours, customer notified |
| Existing inquiry-based bookings (no date/guests/price) | Cards gracefully handle null fields with "-" fallback (already works) |
| Provider confirms but booking date already passed | Allowed (some bookings are retroactive records) |
| User not logged in clicks "Book Now" | Redirect to login with return URL back to tour page |

### 5.5 Accessibility Checklist

- [ ] All form inputs have associated `<Label>` elements
- [ ] Calendar is keyboard navigable (Tab, Arrow keys, Enter to select)
- [ ] Guest counter +/- buttons are keyboard accessible and have aria-labels
- [ ] Status timeline has `aria-label` describing current booking state
- [ ] All action buttons have visible text labels (not icon-only)
- [ ] `aria-live="polite"` on the price total (updates when guest count changes)
- [ ] Focus management: after booking creation, focus moves to the confirmation page heading
- [ ] All animations use `motion-safe:` Tailwind variant
- [ ] Tab order is logical throughout the booking wizard (no focus traps)
- [ ] Screen reader can navigate the full booking flow

### Verification
- [ ] Browser zoom 200% — all elements still usable and readable
- [ ] Complete the entire booking flow using only keyboard (no mouse)
- [ ] Create a PENDING booking, wait 48h (or trigger cron manually) → auto-declined
- [ ] Try booking own tour → clear "You cannot book your own tour" error
- [ ] Try booking inactive tour → "Tour is no longer available" error
- [ ] Try booking with more guests than available → "Not enough spots" error
- [ ] All focus rings visible on interactive elements (`:focus-visible`)

---

## Complete File Reference

### New Server Files
| File | Purpose |
|------|---------|
| `server/prisma/migrations/.../` | Schema migration |
| `server/src/scripts/backfill-booking-entity-info.ts` | One-time data backfill for existing bookings |
| `server/src/jobs/bookingExpiration.ts` | Auto-expire PENDING bookings after 48h |

### Modified Server Files
| File | What Changes |
|------|-------------|
| `server/prisma/schema.prisma` | BookingStatus enum + Booking fields + NotificationType enum |
| `server/src/modules/bookings/booking.types.ts` | New interfaces for direct booking, confirm, decline |
| `server/src/modules/bookings/booking.schemas.ts` | New Zod validation schemas |
| `server/src/modules/bookings/booking.repo.ts` | New query methods for direct booking, confirm, decline |
| `server/src/modules/bookings/booking.service.ts` | Direct booking, confirm, decline, availability check logic |
| `server/src/modules/bookings/booking.controller.ts` | New endpoint handlers |
| `server/src/modules/bookings/booking.routes.ts` | New route registrations |
| `server/src/modules/tours/tour.routes.ts` | Availability check route |
| `server/src/modules/inquiries/inquiry.service.ts` | Fix booking auto-creation to populate entity info |
| `server/src/modules/notifications/notification.service.ts` | New notification helper methods |
| `server/src/libs/email.ts` | 5 new email template functions |
| `server/src/server.ts` | Register booking expiration cron job |

### New Client Files
| File | Purpose |
|------|---------|
| `client/src/features/bookings/components/DirectBookingDialog.tsx` | 3-step booking wizard |
| `client/src/features/bookings/components/BookingDetailPage.tsx` | Full booking detail view |
| `client/src/features/bookings/components/ReceivedBookingsPage.tsx` | Provider's received bookings list |
| `client/src/features/bookings/components/BookingStatusTimeline.tsx` | Visual status progress stepper |
| `client/src/features/bookings/components/BookingConfirmation.tsx` | Post-booking success page |
| `client/src/features/bookings/components/GuestCounter.tsx` | Elder-friendly +/- guest counter |
| `client/src/features/bookings/components/ConfirmBookingDialog.tsx` | Provider confirm dialog |
| `client/src/features/bookings/components/DeclineBookingDialog.tsx` | Provider decline dialog |
| `client/src/app/dashboard/bookings/[id]/page.tsx` | Booking detail route |
| `client/src/app/dashboard/bookings/[id]/confirmation/page.tsx` | Booking confirmation route |
| `client/src/app/dashboard/bookings/received/page.tsx` | Provider received bookings route |

### Modified Client Files
| File | What Changes |
|------|-------------|
| `client/src/features/bookings/types/booking.types.ts` | New statuses, new fields, new input types |
| `client/src/features/bookings/services/booking.service.ts` | New API methods |
| `client/src/features/bookings/hooks/useBookings.ts` | New React Query hooks |
| `client/src/lib/constants/api-endpoints.ts` | New endpoint constants |
| `client/src/lib/constants/routes.ts` | BOOKINGS becomes object with sub-routes |
| `client/src/app/explore/tours/[id]/TourDetailsClient.tsx` | Use DirectBookingDialog instead of inquiry |
| `client/src/app/dashboard/bookings/page.tsx` | Better cards, new statuses, clickable, entity info |
| `client/src/components/layout/dashboard/DashboardSidebarNav.tsx` | Add "Received Bookings" nav item |
| `client/src/features/inquiries/components/RequestInquiryDialog.tsx` | Add optional date/guests fields |

---

## Implementation Order

Execute phases in order. Within Phase 4, follow the sub-step numbering (4.1 → 4.2 → ... → 4.8).

Each phase is independently deployable:
- **Phase 1** can be deployed alone (database only, nothing breaks)
- **Phase 2** can be deployed after Phase 1 (new API endpoints, no client changes needed)
- **Phase 3** can be deployed after Phase 2 (client data layer, no visual changes)
- **Phase 4** can be deployed after Phase 3 (new UI pages and components)
- **Phase 5** can be deployed after Phase 4 (polish and cleanup)
