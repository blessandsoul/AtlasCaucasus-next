# AtlasCaucasus — Production Readiness Implementation Plan

> **Goal**: Transform the platform from a feature-rich prototype into a production-ready tourism marketplace.
> **Approach**: Inquiry-based model (no online payments yet). Users discover → inquire → providers respond via email + in-app.
> **Excluded**: Online payments (Stripe/BOG), Mobile app (React Native).

---

## How to Use This Plan

- Each phase is a self-contained milestone. Complete phases in order.
- Each task has a checkbox. Mark `[x]` when done.
- File paths are relative to the project root (`AtlasCaucasus-next/`).
- Follow existing project conventions in `.claude/rules/`.
- After each phase, run the full app and verify nothing is broken.

---

## Phase 1: Critical — Fix Before Launch

These issues actively damage user trust or break legal requirements.

---

### 1.1 Fix "Book Now" Dead End → Connect to Inquiry Flow

**Problem**: The tour detail sidebar has a "Check Availability" / "Book Now" button that calls an `onBook` callback, but nothing happens. Users hit a dead end after the entire browse flow.

**Solution**: Replace the dead-end button with a "Request This Tour" action that opens an inquiry dialog pre-filled with tour context.

#### Tasks

- [ ] **1.1.1** Create `RequestTourDialog` component

  **File**: `client/src/features/inquiries/components/RequestTourDialog.tsx`

  **Behavior**:
  - A dialog/modal triggered by the sidebar button
  - Pre-filled fields:
    - `targetType`: `TOUR` (hidden, auto-set)
    - `targetIds`: `[tour.id]` (hidden, auto-set)
    - `subject`: Pre-filled with `"Inquiry about: {tour.title}"` (editable)
    - `message`: Textarea for the user's message (required, min 10 chars)
    - Show tour summary at the top of the dialog (title, price, location) so user has context
  - If the user selected a date and guests from the hero search (available in URL params), include those in the message template: `"I'm interested in this tour for {guests} people on {date}."`
  - On submit: call `useCreateInquiry()` mutation with `{ targetType: 'TOUR', targetIds: [tour.id], subject, message }`
  - On success: `toast.success("Inquiry sent! The provider will respond soon.")`, close dialog
  - On error: `toast.error(getErrorMessage(error))`
  - If user is not authenticated: redirect to `/login?redirect=/explore/tours/{tour.id}` with a toast explaining they need to sign in

  **Design**:
  - Use shadcn `Dialog` component
  - Max width: `max-w-lg`
  - Dismissible with Escape + backdrop click
  - Disable submit button during submission
  - Validate with Zod schema

- [ ] **1.1.2** Wire `RequestTourDialog` into the tour detail page

  **File**: `client/src/app/explore/tours/[id]/page.tsx` (or wherever TourSidebar is rendered)

  **Changes**:
  - Import `RequestTourDialog`
  - Add state: `const [inquiryOpen, setInquiryOpen] = useState(false)`
  - Pass `onBook={() => setInquiryOpen(true)}` to `TourSidebar`
  - Render `<RequestTourDialog open={inquiryOpen} onOpenChange={setInquiryOpen} tour={tour} />`

- [ ] **1.1.3** Update `TourSidebar` button label

  **File**: `client/src/features/tours/components/TourSidebar.tsx`

  **Changes**:
  - Change primary button text from "Check Availability" to "Request This Tour" (or use i18n key)
  - Keep the `onBook` callback mechanism — it now opens the dialog

- [ ] **1.1.4** Create similar `RequestGuideDialog` and `RequestDriverDialog`

  **Files**:
  - `client/src/features/inquiries/components/RequestGuideDialog.tsx`
  - `client/src/features/inquiries/components/RequestDriverDialog.tsx`

  **Same pattern** as `RequestTourDialog` but with:
  - `targetType: 'GUIDE'` or `'DRIVER'`
  - Pre-filled subject: `"Inquiry about guide: {guide.name}"` / `"Inquiry about driver: {driver.name}"`
  - Show relevant info (languages, vehicle type, price per day)

  Wire these into:
  - `client/src/app/explore/guides/[id]/page.tsx` → GuideSidebar
  - `client/src/app/explore/drivers/[id]/page.tsx` → DriverSidebar

- [ ] **1.1.5** Add "Contact Company" button on company detail page

  **File**: `client/src/app/explore/companies/[id]/page.tsx`

  Same pattern with `targetType: 'COMPANY'`.

---

### 1.2 Email Notifications for Critical Events

**Problem**: Only WebSocket notifications exist. If a provider is offline, they never learn about inquiries or messages.

**Existing infrastructure**: `server/src/libs/email.ts` already has Resend API configured with `sendEmail()`, `sendVerificationEmail()`, etc. The pattern is established.

#### Tasks

- [ ] **1.2.1** Add inquiry email templates

  **File**: `server/src/libs/email.ts`

  Add these functions following the existing pattern (see `sendVerificationEmail` as reference):

  ```typescript
  // When a provider receives a new inquiry
  async function sendInquiryReceivedEmail(
    recipientEmail: string,
    recipientFirstName: string,
    senderName: string,
    subject: string,
    messagePreview: string,  // first 200 chars
    inquiryId: string
  ): Promise<void>

  // When the user who sent an inquiry gets a response
  async function sendInquiryResponseEmail(
    userEmail: string,
    userFirstName: string,
    providerName: string,
    status: 'ACCEPTED' | 'DECLINED' | 'RESPONDED',
    responseMessage: string | null,
    inquiryId: string
  ): Promise<void>
  ```

  **Email content**:
  - Include a CTA button linking to `{FRONTEND_URL}/dashboard/inquiries/{inquiryId}`
  - Keep subject lines short: "New inquiry: {subject}" / "Response to your inquiry"
  - Use simple HTML template consistent with existing verification emails
  - Include unsubscribe text at bottom (legal requirement)

- [ ] **1.2.2** Send email when inquiry is created

  **File**: `server/src/modules/inquiries/inquiry.service.ts`

  **Changes**:
  - In the method that creates an inquiry, after creating notification records:
  - For each recipient (targetId), look up their email and first name
  - Call `sendInquiryReceivedEmail()` for each recipient
  - Do NOT await email sending in the request path — use `Promise.allSettled()` or fire-and-forget with error logging
  - Log failures with `logger.error()` but don't fail the request

- [ ] **1.2.3** Send email when inquiry is responded to

  **File**: `server/src/modules/inquiries/inquiry.service.ts`

  **Changes**:
  - In the method that handles inquiry response (accept/decline/respond):
  - Look up the original inquiry creator's email
  - Call `sendInquiryResponseEmail()` with the status and message
  - Fire-and-forget with error logging

- [ ] **1.2.4** Add offline chat message email notification

  **File**: `server/src/modules/chat/chat.service.ts`

  **Logic**:
  - When a message is sent, check if the recipient is online via presence service
  - If the recipient is **offline**, queue an email notification
  - To avoid spam: only send one email per chat per 15-minute window
  - Implementation: Use a Redis key like `chat-email:{recipientId}:{chatId}` with 15-min TTL. If the key exists, skip. If not, set the key and send the email.

  Add to `server/src/libs/email.ts`:
  ```typescript
  async function sendChatMessageEmail(
    recipientEmail: string,
    recipientFirstName: string,
    senderName: string,
    messagePreview: string,
    chatId: string
  ): Promise<void>
  ```

- [ ] **1.2.5** Add email preference field (optional but recommended)

  **Database**: Add to User model in `server/prisma/schema.prisma`:
  ```prisma
  emailNotifications Boolean @default(true) @map("email_notifications")
  ```

  Run migration: `npm run prisma:migrate dev --name add_email_notifications_preference`

  **Check this field** before sending any notification email. If `false`, skip email (WebSocket-only).

  **Client**: Add a toggle in the profile settings page (`client/src/features/users/components/ProfileGeneral.tsx` or a new `ProfileNotifications` tab).

---

### 1.3 Legal Pages

**Problem**: Footer links to Privacy Policy, Terms of Service, and Cookie Policy all point to `#`.

#### Tasks

- [ ] **1.3.1** Create legal page layout

  **File**: `client/src/app/legal/layout.tsx`

  **Design**:
  - Simple centered layout with `max-w-prose` (65ch) content width
  - `py-16 px-4` padding
  - Back link to home
  - Table of contents sidebar on desktop (optional)

- [ ] **1.3.2** Create Privacy Policy page

  **File**: `client/src/app/legal/privacy/page.tsx`

  **Content must cover** (at minimum):
  - What data is collected (email, name, location, messages, IP, usage data)
  - How data is used (account management, communication, service improvement)
  - Data sharing (with tour providers when inquiry is sent — be specific)
  - Cookies and tracking
  - Data retention periods
  - User rights (access, deletion, export — GDPR basics)
  - Contact information for data requests
  - Last updated date

  **Note**: Use static content. This should be a Server Component with no client-side JS.

- [ ] **1.3.3** Create Terms of Service page

  **File**: `client/src/app/legal/terms/page.tsx`

  **Content must cover**:
  - Platform description (marketplace connecting users with tourism providers)
  - User responsibilities (accurate info, no fraud)
  - Provider responsibilities (accurate listings, responding to inquiries)
  - Intellectual property
  - Limitation of liability (AtlasCaucasus is a marketplace, not the service provider)
  - Account termination conditions
  - Dispute resolution
  - Governing law (Georgia)
  - Last updated date

- [ ] **1.3.4** Create Cookie Policy page

  **File**: `client/src/app/legal/cookies/page.tsx`

  **Content**: What cookies are used (auth tokens, preferences, analytics if any), how to manage them.

- [ ] **1.3.5** Update Footer links

  **File**: `client/src/components/layout/Footer.tsx`

  **Changes**:
  - Privacy Policy: `href="/legal/privacy"`
  - Terms of Service: `href="/legal/terms"`
  - Cookie Policy: `href="/legal/cookies"`

- [ ] **1.3.6** Add legal consent to registration

  **Files**:
  - `client/src/features/auth/components/RegisterForm.tsx`
  - `client/src/features/auth/components/CompanyRegisterForm.tsx`

  **Changes**:
  - Add a checkbox: "I agree to the [Terms of Service](/legal/terms) and [Privacy Policy](/legal/privacy)"
  - Make it required (form doesn't submit without it)
  - Do NOT store consent in database — the fact that they registered implies consent. The checkbox is a UX confirmation.

---

### 1.4 Tour Availability / Dates

**Problem**: Tours have no date information. Users pick a date in hero search but it's never validated. Tours don't have schedules.

**Solution (minimal)**: Add an availability type field to tours, and optionally specific available dates.

#### Tasks

- [ ] **1.4.1** Add availability fields to Tour model

  **File**: `server/prisma/schema.prisma`

  Add to the `Tour` model:
  ```prisma
  availabilityType  String    @default("BY_REQUEST") @map("availability_type") @db.VarChar(50)
  // Values: "DAILY", "WEEKDAYS", "WEEKENDS", "SPECIFIC_DATES", "BY_REQUEST"

  availableDates    String?   @map("available_dates") @db.Text
  // JSON array of date strings ["2025-06-01", "2025-06-15", ...] — only used when availabilityType = "SPECIFIC_DATES"

  startTime         String?   @map("start_time") @db.VarChar(10)
  // e.g., "09:00" — optional default start time
  ```

  Run migration: `npm run prisma:migrate dev --name add_tour_availability`

- [ ] **1.4.2** Update tour creation/edit schemas

  **Server files**:
  - `server/src/modules/tours/tour.schemas.ts` — add `availabilityType`, `availableDates`, `startTime` to create/update schemas
  - `server/src/modules/tours/tour.service.ts` — pass new fields through
  - `server/src/modules/tours/tour.repo.ts` — include in select/create/update

  **Validation** (Zod):
  ```typescript
  availabilityType: z.enum(['DAILY', 'WEEKDAYS', 'WEEKENDS', 'SPECIFIC_DATES', 'BY_REQUEST']).default('BY_REQUEST')
  availableDates: z.array(z.string().date()).optional()  // only when SPECIFIC_DATES
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional()
  ```

- [ ] **1.4.3** Update client Tour type

  **File**: `client/src/features/tours/types/tour.types.ts`

  Add:
  ```typescript
  availabilityType: 'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'SPECIFIC_DATES' | 'BY_REQUEST';
  availableDates: string[] | null;
  startTime: string | null;
  ```

- [ ] **1.4.4** Display availability on TourSidebar

  **File**: `client/src/features/tours/components/TourSidebar.tsx`

  **Add a section** above the CTA button showing:
  - "Available daily" / "Weekdays only" / "Weekends only" / "By request" / specific dates in a mini calendar or chip list
  - If `startTime` exists: "Starts at {startTime}"
  - Use a Calendar icon from Lucide

- [ ] **1.4.5** Display availability badge on TourCard

  **File**: `client/src/features/tours/components/TourCard.tsx`

  The card already has an availability display section. Update it to use the new `availabilityType` field instead of the current placeholder logic.

- [ ] **1.4.6** Add availability fields to tour creation form

  **File**: `client/src/features/tours/components/CreateTourForm.tsx`

  Add:
  - Dropdown for `availabilityType` with the 5 options
  - Conditional date picker (multi-select) when `SPECIFIC_DATES` is selected
  - Optional time input for `startTime`

---

## Phase 2: High Priority — Add for Credibility

These won't break the site but will make it feel incomplete to users.

---

### 2.1 Favorites / Wishlist System

**Problem**: Users browsing many tours can't save ones they like. The `TourCard` already has an `onFavorite` prop and heart icon but it's wired to `console.log`.

#### Tasks

- [ ] **2.1.1** Create Favorite model in database

  **File**: `server/prisma/schema.prisma`

  ```prisma
  model Favorite {
    id         String   @id @default(uuid())
    userId     String   @map("user_id")
    entityType String   @map("entity_type") @db.VarChar(50)  // "TOUR" | "GUIDE" | "DRIVER" | "COMPANY"
    entityId   String   @map("entity_id")
    createdAt  DateTime @default(now()) @map("created_at")

    user User @relation("UserFavorites", fields: [userId], references: [id], onDelete: Cascade)

    @@unique([userId, entityType, entityId])
    @@index([userId, entityType])
    @@index([entityType, entityId])
    @@map("favorites")
  }
  ```

  Add to User model: `favorites Favorite[] @relation("UserFavorites")`

  Run migration: `npm run prisma:migrate dev --name add_favorites`

- [ ] **2.1.2** Create favorites server module

  **Files** (follow existing module pattern):
  - `server/src/modules/favorites/favorite.routes.ts`
  - `server/src/modules/favorites/favorite.controller.ts`
  - `server/src/modules/favorites/favorite.service.ts`
  - `server/src/modules/favorites/favorite.repo.ts`
  - `server/src/modules/favorites/favorite.schemas.ts`

  **Endpoints**:
  - `POST /api/v1/favorites` — Add favorite `{ entityType, entityId }` (auth required)
  - `DELETE /api/v1/favorites/:entityType/:entityId` — Remove favorite (auth required)
  - `GET /api/v1/favorites` — List user's favorites, optional `?entityType=TOUR` filter (auth required, paginated)
  - `GET /api/v1/favorites/check?entityType=TOUR&entityId=xxx` — Check if specific entity is favorited (auth required)
  - `POST /api/v1/favorites/check-batch` — Check multiple entities at once `{ entityType, entityIds: [...] }` (auth required) — for rendering heart state on listing pages

  Register in `server/src/app.ts`.

- [ ] **2.1.3** Create client favorites feature module

  **Files**:
  - `client/src/features/favorites/services/favorite.service.ts`
  - `client/src/features/favorites/hooks/useFavorites.ts`
  - `client/src/features/favorites/types/favorite.types.ts`

  **Hooks**:
  - `useFavorites(entityType?)` — list user's favorites
  - `useToggleFavorite()` — mutation that adds or removes
  - `useFavoriteCheck(entityType, entityIds)` — batch check for listing pages (returns `Set<string>` of favorited IDs)

  **Optimistic UI**: When user clicks heart, immediately toggle the UI state. Revert on error.

- [ ] **2.1.4** Wire favorites into TourCard

  **File**: `client/src/features/tours/components/TourCard.tsx`

  **Changes**:
  - The heart icon already exists. Make it:
    - Filled red (`fill-red-500 text-red-500`) when favorited
    - Outlined when not favorited
  - On click: call `useToggleFavorite()` mutation
  - If not authenticated: redirect to login

  **Important**: On the tours listing page, use `useFavoriteCheck('TOUR', tourIds)` to batch-check all visible tours in one request. Pass the result down to each `TourCard`.

- [ ] **2.1.5** Wire favorites into GuideCard, DriverCard, CompanyCard

  Same pattern as TourCard. Each card should have a heart icon toggle.

- [ ] **2.1.6** Create "My Favorites" dashboard page

  **File**: `client/src/app/dashboard/favorites/page.tsx`

  **Design**:
  - Tabs: All | Tours | Guides | Drivers | Companies
  - Display favorites as the same cards used in explore pages
  - Empty state: "No favorites yet. Browse tours to save your favorites."
  - Paginated (12 per page)

  **Add to dashboard sidebar navigation** in `client/src/components/layout/DashboardSidebar.tsx` (or wherever the sidebar nav is defined) — add a "Favorites" link with Heart icon.

---

### 2.2 SEO Metadata

**Problem**: No dynamic `<title>`, `<meta>`, or Open Graph tags on any page. Tourism platforms depend on organic search.

#### Tasks

- [ ] **2.2.1** Add metadata to tour detail page

  **File**: `client/src/app/explore/tours/[id]/page.tsx`

  Use Next.js `generateMetadata()`:
  ```typescript
  export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // Fetch tour data (or use a lighter endpoint)
    const tour = await tourService.getTour(params.id);
    return {
      title: `${tour.title} | AtlasCaucasus`,
      description: tour.summary || `Book ${tour.title} - starting from ${tour.price} ${tour.currency}`,
      openGraph: {
        title: tour.title,
        description: tour.summary || '',
        images: tour.images?.[0]?.url ? [{ url: tour.images[0].url }] : [],
        type: 'website',
      },
    };
  }
  ```

  **Note**: This requires the page to be a Server Component or use server-side data fetching. If the page is currently a client component, the `generateMetadata` function can still be exported from the same file as long as the metadata function itself doesn't use client hooks.

- [ ] **2.2.2** Add metadata to guide, driver, company detail pages

  Same pattern:
  - `client/src/app/explore/guides/[id]/page.tsx`
  - `client/src/app/explore/drivers/[id]/page.tsx`
  - `client/src/app/explore/companies/[id]/page.tsx`

  Use entity name, description/bio, avatar/cover image for OG tags.

- [ ] **2.2.3** Add metadata to listing pages

  **Files**:
  - `client/src/app/explore/tours/page.tsx`
  - `client/src/app/explore/guides/page.tsx`
  - `client/src/app/explore/drivers/page.tsx`
  - `client/src/app/explore/companies/page.tsx`

  Static metadata:
  ```typescript
  export const metadata: Metadata = {
    title: 'Explore Tours in the Caucasus | AtlasCaucasus',
    description: 'Discover the best tours, guides, and experiences in Georgia, Armenia, Azerbaijan, and Turkey.',
  };
  ```

- [ ] **2.2.4** Add default metadata to root layout

  **File**: `client/src/app/layout.tsx`

  ```typescript
  export const metadata: Metadata = {
    title: {
      default: 'AtlasCaucasus — Discover the Caucasus',
      template: '%s | AtlasCaucasus',
    },
    description: 'Your gateway to tours, guides, and travel experiences in the Caucasus region.',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://atlascaucasus.com'),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: 'AtlasCaucasus',
    },
  };
  ```

- [ ] **2.2.5** Add `robots.txt` and `sitemap.xml`

  **File**: `client/src/app/robots.ts`
  ```typescript
  export default function robots(): MetadataRoute.Robots {
    return {
      rules: { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/admin/'] },
      sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
    };
  }
  ```

  **File**: `client/src/app/sitemap.ts`
  - Generate sitemap with static pages + dynamic tour/guide/driver/company detail pages
  - Fetch all active entity IDs from the API (add a lightweight endpoint if needed)

---

### 2.3 About & Contact Pages

**Problem**: No about page, no contact page. Users don't know who runs the platform.

#### Tasks

- [ ] **2.3.1** Create About page

  **File**: `client/src/app/about/page.tsx`

  **Sections**:
  - Hero with headline: "About AtlasCaucasus"
  - Mission statement (2-3 paragraphs about connecting travelers with Caucasus experiences)
  - Team section (even if just founders — photos, names, short bios)
  - Stats section (number of tours, guides, destinations — can be dynamic from API)
  - CTA: "Ready to explore?" → link to `/explore/tours`

  **Design**: Follow the neuro-minimalism style. Use existing CSS variables. Server Component.

- [ ] **2.3.2** Create Contact page

  **File**: `client/src/app/contact/page.tsx`

  **Sections**:
  - Contact form (name, email, subject, message) — can submit via email API or store in DB
  - Contact info sidebar (email, phone, address — same as footer)
  - FAQ accordion (5-8 common questions about the platform)
  - Map embed (optional — Google Maps iframe of office location)

  **Backend** (if submitting to API):
  - Add a simple `POST /api/v1/contact` endpoint that sends the form data as an email to the admin email address using the existing Resend setup
  - Rate limit: 3 requests per hour per IP

- [ ] **2.3.3** Add About and Contact to navigation

  **File**: `client/src/components/layout/Header.tsx`

  Add "About" and "Contact" links to the main nav (between Explore and Support, or replace Support with Contact).

  Update Footer quick links to include About and Contact.

---

### 2.4 Custom 404 Page

#### Tasks

- [ ] **2.4.1** Create branded 404 page

  **File**: `client/src/app/not-found.tsx`

  **Design**:
  - Centered layout
  - Large "404" text (muted)
  - Headline: "Page not found"
  - Subtext: "The page you're looking for doesn't exist or has been moved."
  - CTA button: "Back to Home" → `/`
  - Secondary link: "Browse Tours" → `/explore/tours`
  - Use existing design tokens. Keep it clean and minimal.

---

### 2.5 Remove Disabled Hotels Tab

**Problem**: The explore entity tabs show a "Hotels" option that's disabled/not functional. This looks unfinished.

#### Tasks

- [ ] **2.5.1** Remove or hide Hotels from entity tabs

  **File**: `client/src/features/explore/components/EntityTypeTabs.tsx`

  **Action**: Remove the Hotels tab entirely. When hotels are ready in the future, add it back. Don't show disabled/coming-soon tabs in production — it undermines confidence.

---

## Phase 3: Medium Priority — Competitive Advantage

These features differentiate the platform and increase engagement.

---

### 3.1 Provider Response Time & Verification Badges

#### Tasks

- [ ] **3.1.1** Calculate and store average response time

  **Server changes**:

  **File**: `server/src/modules/inquiries/inquiry.service.ts`

  When a provider responds to an inquiry:
  - Calculate time difference between `inquiry.createdAt` and `response.respondedAt`
  - Store/update average response time on the provider's profile

  **Database**: Add to Company, Guide, Driver models in `schema.prisma`:
  ```prisma
  avgResponseTimeMinutes Int? @map("avg_response_time_minutes")
  ```

  Run migration: `npm run prisma:migrate dev --name add_response_time`

  **Calculation**: Rolling average — `newAvg = ((oldAvg * count) + newTime) / (count + 1)`

- [ ] **3.1.2** Display response time on cards and detail pages

  **Files**: `TourCard.tsx`, `GuideCard.tsx`, `DriverCard.tsx`, `CompanyCard.tsx`, and their detail page sidebars

  Show a badge like:
  - "Responds within 1 hour" (green, if < 60 min)
  - "Responds within 24 hours" (yellow, if < 1440 min)
  - "Responds within a few days" (muted, if > 1440 min)
  - Don't show anything if no response data yet

- [ ] **3.1.3** Make verification badges more prominent

  **Files**: Detail page headers for guides, drivers, companies

  If the entity is verified, show a prominent "Verified" badge with a shield-check icon. Use `bg-success/10 text-success` styling. Include a tooltip explaining what verification means.

---

### 3.2 Social Sharing

#### Tasks

- [ ] **3.2.1** Create `ShareButton` component

  **File**: `client/src/components/common/ShareButton.tsx`

  **Props**: `{ url: string, title: string, description?: string }`

  **Behavior**:
  - On click: try `navigator.share()` (Web Share API) first — this works on mobile and some desktops
  - Fallback: show a dropdown with:
    - Copy link (copies to clipboard, toast "Link copied!")
    - Share on WhatsApp (`https://wa.me/?text={encodedUrl}`)
    - Share on Facebook (`https://www.facebook.com/sharer/sharer.php?u={encodedUrl}`)
    - Share on Twitter/X (`https://twitter.com/intent/tweet?url={encodedUrl}&text={encodedTitle}`)

  **Design**: Small icon button (Share2 icon from Lucide) with dropdown menu.

- [ ] **3.2.2** Add ShareButton to detail pages

  **Files**:
  - Tour detail header
  - Guide detail header
  - Driver detail header
  - Company detail header

  Place next to the title or in the action bar area.

---

### 3.3 Tour Itinerary Structure

#### Tasks

- [ ] **3.3.1** Add itinerary field to Tour model

  **File**: `server/prisma/schema.prisma`

  Add to Tour model:
  ```prisma
  itinerary String? @db.Text
  // JSON array: [{ "title": "Day 1: Tbilisi", "description": "..." }, ...]
  ```

  Run migration: `npm run prisma:migrate dev --name add_tour_itinerary`

- [ ] **3.3.2** Update tour schemas and service

  **Server files**: Update create/update schemas to accept itinerary as array of `{ title: string, description: string }` objects. Validate with Zod. Store as JSON string.

- [ ] **3.3.3** Update client Tour type

  **File**: `client/src/features/tours/types/tour.types.ts`

  ```typescript
  itinerary: { title: string; description: string }[] | null;
  ```

- [ ] **3.3.4** Display itinerary on tour detail page

  **File**: `client/src/features/tours/components/TourInfo.tsx`

  Add an "Itinerary" section:
  - Vertical timeline/stepper layout
  - Each step shows: numbered circle → title → description
  - Use `border-l-2 border-primary/20` for the timeline line
  - Collapsible if more than 5 steps (show first 3, "Show all" button)

- [ ] **3.3.5** Add itinerary builder to tour creation form

  **File**: `client/src/features/tours/components/CreateTourForm.tsx`

  Add a dynamic field array:
  - "Add itinerary step" button
  - Each step: title input + description textarea + remove button
  - Drag to reorder (optional, can use simple up/down arrows instead)

---

### 3.4 Related / Similar Tours

#### Tasks

- [ ] **3.4.1** Add "related tours" endpoint

  **Server file**: `server/src/modules/tours/tour.routes.ts`

  New endpoint: `GET /api/v1/tours/:id/related?limit=4`

  **Logic** (in `tour.service.ts`):
  - Find tours with the same `category` OR same `locationId`, excluding the current tour
  - Order by rating (highest first), limit to 4
  - Cache in Redis for 10 minutes

- [ ] **3.4.2** Create `RelatedTours` component

  **File**: `client/src/features/tours/components/RelatedTours.tsx`

  **Props**: `{ tourId: string }`

  **Design**:
  - Section title: "You might also like"
  - Horizontal scroll of 4 `TourCard` components (smaller variant or same)
  - Skeleton loader while fetching
  - Don't render the section if no related tours found

- [ ] **3.4.3** Add to tour detail page

  **File**: Tour detail page

  Render `<RelatedTours tourId={tour.id} />` below the reviews section.

---

### 3.5 Blog / Content Section

#### Tasks

- [ ] **3.5.1** Design blog architecture

  **Approach**: Use MDX files for blog posts (no CMS needed for now). Store posts in `client/src/content/blog/` as `.mdx` files with frontmatter.

  **Frontmatter schema**:
  ```yaml
  ---
  title: "10 Best Hikes in Svaneti"
  slug: "best-hikes-svaneti"
  excerpt: "Discover the most breathtaking trails..."
  coverImage: "/blog/svaneti-hikes.jpg"
  author: "AtlasCaucasus Team"
  publishedAt: "2025-06-01"
  tags: ["hiking", "svaneti", "georgia"]
  ---
  ```

- [ ] **3.5.2** Create blog listing page

  **File**: `client/src/app/blog/page.tsx`

  **Design**:
  - Hero with "AtlasCaucasus Blog" title
  - Grid of blog post cards (image, title, excerpt, date, tags)
  - Filter by tag (optional)
  - Responsive: 1 col mobile, 2 col tablet, 3 col desktop

- [ ] **3.5.3** Create blog post page

  **File**: `client/src/app/blog/[slug]/page.tsx`

  **Design**:
  - Cover image (full width)
  - Title, author, date, tags
  - MDX content rendered with proper typography (`prose` class from Tailwind Typography)
  - "Related posts" at bottom
  - Share button
  - CTA: "Explore tours in {location}" linking to relevant explore page

  **SEO**: `generateMetadata()` with post title, excerpt, cover image for OG.

- [ ] **3.5.4** Add Blog to navigation

  **File**: `client/src/components/layout/Header.tsx`

  Add "Blog" link to main navigation.

- [ ] **3.5.5** Write 3-5 initial blog posts

  Topics:
  - "Your Ultimate Guide to Touring the Caucasus"
  - "Top 10 Hidden Gems in Georgia"
  - "How to Choose the Right Tour Guide"
  - "Best Time to Visit the Caucasus Region"
  - "Wine Tasting in Kakheti: A Complete Guide"

  Store as `.mdx` files in `client/src/content/blog/`.

---

## Phase 4: Polish — Nice to Have

---

### 4.1 Booking Management System (Simple)

> Not a payment system — just a way to track confirmed bookings after inquiry acceptance.

#### Tasks

- [ ] **4.1.1** Create Booking model

  **File**: `server/prisma/schema.prisma`

  ```prisma
  model Booking {
    id          String        @id @default(uuid())
    userId      String        @map("user_id")
    entityType  String        @map("entity_type") @db.VarChar(50)  // TOUR | GUIDE | DRIVER
    entityId    String        @map("entity_id")
    inquiryId   String?       @map("inquiry_id")  // optional link to original inquiry
    status      BookingStatus @default(CONFIRMED)
    date        DateTime?     @map("booking_date")
    guests      Int?
    totalPrice  Decimal?      @map("total_price") @db.Decimal(10, 2)
    currency    String        @default("GEL") @db.VarChar(3)
    notes       String?       @db.Text
    createdAt   DateTime      @default(now()) @map("created_at")
    updatedAt   DateTime      @updatedAt @map("updated_at")
    cancelledAt DateTime?     @map("cancelled_at")

    user    User     @relation("UserBookings", fields: [userId], references: [id])
    inquiry Inquiry? @relation(fields: [inquiryId], references: [id])

    @@index([userId, status])
    @@index([entityType, entityId])
    @@map("bookings")
  }

  enum BookingStatus {
    CONFIRMED
    COMPLETED
    CANCELLED
  }
  ```

- [ ] **4.1.2** Auto-create booking when inquiry is accepted

  **File**: `server/src/modules/inquiries/inquiry.service.ts`

  When a provider accepts an inquiry, automatically create a `Booking` record with status `CONFIRMED`. Send email notification to the user: "Your booking has been confirmed!"

- [ ] **4.1.3** Create bookings server module

  Endpoints:
  - `GET /api/v1/bookings` — user's bookings (auth, paginated)
  - `GET /api/v1/bookings/received` — provider's received bookings (auth, paginated)
  - `PATCH /api/v1/bookings/:id/cancel` — cancel booking
  - `PATCH /api/v1/bookings/:id/complete` — mark as completed (provider only)

- [ ] **4.1.4** Create "My Bookings" dashboard page

  **File**: `client/src/app/dashboard/bookings/page.tsx`

  **Design**:
  - Tabs: Upcoming | Completed | Cancelled
  - Each booking card shows: entity name, date, guests, price, status badge
  - Cancel button (with confirmation dialog) for upcoming bookings
  - Add to dashboard sidebar navigation

---

### 4.2 Provider Analytics Dashboard

#### Tasks

- [ ] **4.2.1** Create analytics endpoint

  **Server endpoint**: `GET /api/v1/analytics/me`

  Returns for the authenticated provider:
  ```json
  {
    "views": { "total": 1250, "last30Days": 340 },
    "inquiries": { "total": 45, "last30Days": 12, "responseRate": 0.89 },
    "favorites": { "total": 78 },
    "avgRating": 4.6,
    "reviewCount": 23
  }
  ```

  **Implementation**: Aggregate from existing data. For views, you'll need to add a view tracking mechanism (see 4.2.2).

- [ ] **4.2.2** Add view tracking

  **Simple approach**: When a user views a tour/guide/driver/company detail page, fire a `POST /api/v1/analytics/view` with `{ entityType, entityId }`.

  **Server**: Increment a counter in Redis (`views:{entityType}:{entityId}:{YYYY-MM-DD}`). Periodically (daily cron or on-demand) aggregate into a database table.

  **Don't track**: Unauthenticated views from bots (check User-Agent), duplicate views from same user within 1 hour (Redis dedup key).

- [ ] **4.2.3** Create provider dashboard overview page

  **File**: `client/src/app/dashboard/analytics/page.tsx`

  **Design**:
  - Stat cards: Total views, Inquiries received, Response rate, Avg rating
  - Simple bar chart: Views over last 30 days (use a lightweight chart library like `recharts`)
  - List of recent inquiries

  Add to dashboard sidebar for COMPANY, GUIDE, DRIVER roles.

---

### 4.3 Multi-Currency Display

#### Tasks

- [ ] **4.3.1** Add currency preference to user settings

  Store in localStorage (no DB change needed):
  ```typescript
  const [currency, setCurrency] = useLocalStorage('preferredCurrency', 'GEL');
  ```

- [ ] **4.3.2** Create currency conversion utility

  **File**: `client/src/lib/utils/currency.ts`

  **Simple approach**: Hardcoded exchange rates updated manually (or fetch from a free API daily):
  ```typescript
  const RATES = { GEL: 1, USD: 0.37, EUR: 0.34 };  // GEL as base
  export function convertCurrency(amount: number, from: string, to: string): number
  ```

- [ ] **4.3.3** Add currency selector

  Add a small currency dropdown (GEL/USD/EUR) in the header or explore filter sidebar. When changed, all prices on the page re-render in the selected currency with a "~" prefix to indicate approximation.

---

### 4.4 Calendar Integration

#### Tasks

- [ ] **4.4.1** Add "Add to Calendar" button on booking confirmation

  **File**: Create `client/src/components/common/AddToCalendar.tsx`

  Generate `.ics` file download with:
  - Event title: Tour/guide/driver name
  - Date/time from booking
  - Location from tour
  - Description with booking details

  No external library needed — `.ics` format is simple text.

---

## Implementation Order Summary

| Order | Task | Effort | Impact |
|-------|------|--------|--------|
| 1 | 1.1 Request Tour Dialog | Medium | Critical |
| 2 | 1.2 Email Notifications | Medium | Critical |
| 3 | 1.3 Legal Pages | Low | Critical |
| 4 | 1.4 Tour Availability | Medium | Critical |
| 5 | 2.1 Favorites/Wishlist | Medium | High |
| 6 | 2.2 SEO Metadata | Low | High |
| 7 | 2.3 About & Contact Pages | Low | High |
| 8 | 2.4 Custom 404 Page | Low | High |
| 9 | 2.5 Remove Hotels Tab | Trivial | High |
| 10 | 3.1 Response Time & Badges | Medium | Medium |
| 11 | 3.2 Social Sharing | Low | Medium |
| 12 | 3.3 Tour Itinerary | Medium | Medium |
| 13 | 3.4 Related Tours | Low | Medium |
| 14 | 3.5 Blog Section | Medium | Medium |
| 15 | 4.1 Booking Management | High | Nice-to-have |
| 16 | 4.2 Provider Analytics | High | Nice-to-have |
| 17 | 4.3 Multi-Currency | Low | Nice-to-have |
| 18 | 4.4 Calendar Integration | Low | Nice-to-have |

---

## Notes for Agents

- **Always follow** the project conventions in `.claude/rules/`.
- **Server modules** follow the pattern: `routes.ts → controller.ts → service.ts → repo.ts → schemas.ts`.
- **Client features** follow the pattern: `components/ → hooks/ → services/ → types/`.
- **All API responses** must use `successResponse()` or `paginatedResponse()` helpers.
- **All errors** must be `AppError` subclasses.
- **All inputs** validated with Zod.
- **All emails** use the existing Resend setup in `server/src/libs/email.ts`.
- **Run `prisma:migrate dev`** after any schema change — never use `db push`.
- **Test after each phase** — run the full app and verify existing features still work.
- **i18n**: Add translation keys for any new user-facing text.
