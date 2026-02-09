# Comprehensive Testing Plan — AtlasCaucasus

## Context

The entire `IMPLEMENTATION_PLAN.md` (18 features across 4 phases) has been implemented. This plan defines a systematic, aggressive testing strategy for a testing agent to execute. The agent should test every feature end-to-end (server API + client UI), try to break functionality, find bugs, and report issues.

**Server**: `http://localhost:8000` (Fastify + Prisma + MySQL + Redis)
**Client**: `http://localhost:3000` (Next.js App Router)
**All API routes**: prefixed with `/api/v1`

---

## Phase 0: Setup & Baseline

### 0.1 Environment Verification
1. Start server: `cd server && npm run dev`
2. Start client: `cd client && npm run dev`
3. Verify health: `GET /api/v1/health` → 200
4. Verify CSRF: `GET /api/v1/auth/csrf-token` → 200 with token
5. Verify client loads: navigate browser to `http://localhost:3000` → homepage renders

### 0.2 Seed Test Data
```bash
cd server
npm run prisma:reset    # Reset DB and rerun migrations
npm run prisma:seed     # Seed realistic data
```

### 0.3 Create Test Accounts
Register these users via API (or verify they exist from seed):
- **Regular user**: `user@test.com` / `Test123!`
- **Company owner**: `company@test.com` / `Test123!` (with COMPANY role)
- **Guide**: `guide@test.com` / `Test123!` (with GUIDE role)
- **Driver**: `driver@test.com` / `Test123!` (with DRIVER role)
- **Admin**: `admin@test.com` / `Test123!` (with ADMIN role)
- **Unverified user**: `unverified@test.com` / `Test123!` (emailVerified=false)

For each account: login, save the access/refresh tokens, and note the user ID.

---

## Phase 1: Authentication & Authorization

### 1.1 Registration
| # | Test | Method | Expected |
|---|------|--------|----------|
| 1 | Register with valid data | `POST /auth/register` | 201, user created |
| 2 | Register duplicate email | `POST /auth/register` (same email) | 409 CONFLICT |
| 3 | Register with weak passwords: "pass", "PASSWORD1", "password1", "Password" | `POST /auth/register` each | 422 for each |
| 4 | Register with invalid emails: "notemail", "no@domain", "@domain.com" | `POST /auth/register` each | 422 for each |
| 5 | Register with XSS in name: `<script>alert(1)</script>` | `POST /auth/register` | Check response — name must be sanitized or stored safely |
| 6 | Register company with valid data | `POST /auth/register-company` | 201, company + user created |
| 7 | Register with extremely long name (500+ chars) | `POST /auth/register` | 422 or truncated |
| 8 | Register with empty body `{}` | `POST /auth/register` | 422 with field errors |

### 1.2 Login & Sessions
| # | Test | Method | Expected |
|---|------|--------|----------|
| 9 | Login with correct credentials | `POST /auth/login` | 200, tokens returned |
| 10 | Login with wrong password | `POST /auth/login` | 401 |
| 11 | Login with non-existent email | `POST /auth/login` | 401 |
| 12 | Login with case-different email (USER@TEST.COM) | `POST /auth/login` | 200 (case insensitive) |
| 13 | Brute force: 10 failed logins in 60s | `POST /auth/login` x10 | Account locked or rate limited |
| 14 | Use access token after logout | Logout, then `GET /auth/me` with old token | 401 |
| 15 | Refresh with revoked refresh token | Logout, then `POST /auth/refresh` | 401 |
| 16 | Logout-all, then use token from another session | `POST /auth/logout-all`, use other device token | 401 |
| 17 | Use expired access token | Wait or use manually expired token | 401 |
| 18 | Refresh token rotation — old refresh token reuse | Refresh, then use OLD refresh token | 401 |

### 1.3 Role & Permission Bypass
| # | Test | Method | Expected |
|---|------|--------|----------|
| 19 | Regular USER → `GET /users` (admin-only) | As USER | 403 |
| 20 | Regular USER → `PATCH /tours/:other_user_tour_id` | As USER | 403 |
| 21 | Regular USER → `POST /blogs` (admin-only) | As USER | 403 |
| 22 | GUIDE → `PATCH /companies/:id` (not owner) | As GUIDE | 403 |
| 23 | Unverified user → `POST /tours` | As unverified | 403 EMAIL_NOT_VERIFIED |
| 24 | Claim ADMIN role via `/auth/claim-role` | As USER | 422 (ADMIN not in enum) |
| 25 | Claim already-claimed role | As GUIDE, claim GUIDE again | 400 ROLE_ALREADY_CLAIMED |
| 26 | Tour agent → modify parent company | As TOUR_AGENT | 403 |
| 27 | Access protected pages without auth (browser) | Navigate to `/dashboard` | Redirected to `/login` |
| 28 | Access `/login` while authenticated (browser) | Navigate to `/login` | Redirected to `/dashboard` |

### 1.4 Email Verification
| # | Test | Method | Expected |
|---|------|--------|----------|
| 29 | Verify with valid token | `POST /auth/verify-email` | 200, emailVerified=true |
| 30 | Verify with expired/invalid token | `POST /auth/verify-email` | 400 |
| 31 | Resend verification 10x in 60s | `POST /auth/resend-verification` x10 | Rate limited after 3-5 |
| 32 | Forgot password with valid email | `POST /auth/forgot-password` | 200 |
| 33 | Reset password with invalid token | `POST /auth/reset-password` | 400 |
| 34 | Forgot password 10x in 60s | `POST /auth/forgot-password` x10 | Rate limited |

---

## Phase 2: Tour CRUD & Availability

### 2.1 Tour Creation
| # | Test | Method | Expected |
|---|------|--------|----------|
| 35 | Create tour with valid data | `POST /tours` | 201 |
| 36 | Create tour with negative price | `POST /tours` `{price: -100}` | 422 |
| 37 | Create tour with price=0 | `POST /tours` `{price: 0}` | 422 or 201 (check) |
| 38 | Create tour with 500-char title | `POST /tours` | 422 |
| 39 | Create tour with invalid availabilityType | `POST /tours` `{availabilityType: "INVALID"}` | 422 |
| 40 | Create tour SPECIFIC_DATES without dates | `POST /tours` `{availabilityType: "SPECIFIC_DATES"}` | Check if valid or error |
| 41 | Create tour with invalid date format in availableDates | `POST /tours` `{availableDates: ["not-a-date"]}` | 422 |
| 42 | Create tour with past dates in availableDates | `POST /tours` `{availableDates: ["2020-01-01"]}` | Check behavior |
| 43 | Create tour with invalid startTime format | `POST /tours` `{startTime: "25:99"}` | 422 |
| 44 | Create tour with 31 itinerary steps (over 30 limit) | `POST /tours` | 422 |
| 45 | Create tour with empty itinerary step title | `POST /tours` `{itinerary: [{title: "", description: "x"}]}` | 422 |
| 46 | Create tour with XSS in title/summary | `POST /tours` | Stored safely, rendered safely on client |

### 2.2 Tour Update & Delete
| # | Test | Method | Expected |
|---|------|--------|----------|
| 47 | Update own tour | `PATCH /tours/:id` | 200 |
| 48 | Update another user's tour | `PATCH /tours/:other_id` | 403 |
| 49 | Delete own tour | `DELETE /tours/:id` | 200 |
| 50 | Delete another user's tour | `DELETE /tours/:other_id` | 403 |
| 51 | Admin updates any tour | `PATCH /tours/:id` as admin | 200 |
| 52 | Get deleted tour | `GET /tours/:deleted_id` | 404 |
| 53 | Update tour with empty body `{}` | `PATCH /tours/:id` | 200 (no changes) or 422 |

### 2.3 Tour Listing & Filtering
| # | Test | Method | Expected |
|---|------|--------|----------|
| 54 | List tours (public) | `GET /tours` | 200, paginated |
| 55 | Filter by minPrice > maxPrice | `GET /tours?minPrice=1000&maxPrice=500` | Empty results or 422 |
| 56 | Filter by invalid sortBy | `GET /tours?sortBy=invalid` | 422 or default sort |
| 57 | Page beyond total | `GET /tours?page=9999` | 200, empty items |
| 58 | Negative page | `GET /tours?page=-1` | 422 or default to 1 |
| 59 | Limit=0 | `GET /tours?limit=0` | 422 or default to 10 |
| 60 | Limit=1000 (over max 100) | `GET /tours?limit=1000` | Capped to 100 or 422 |
| 61 | SQL injection in search | `GET /tours?search=' OR 1=1 --` | Safe handling, no data leak |
| 62 | Related tours | `GET /tours/:id/related` | 200, array of related tours |
| 63 | Related tours for non-existent ID | `GET /tours/non-existent/related` | 404 or empty array |

### 2.4 Client Tour Pages (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 64 | Tours listing page | Navigate to `/explore/tours` | Tours render with cards |
| 65 | Tour detail page | Click a tour card | Detail page loads with header, info, sidebar |
| 66 | Tour availability badge on card | Check TourCard | Shows availability type (Daily, Weekdays, etc.) |
| 67 | Tour availability on sidebar | Check TourSidebar | Shows availability section with type + start time |
| 68 | Tour itinerary display | Check TourInfo | Timeline renders with steps, collapsible if >5 |
| 69 | Related tours section | Scroll to bottom of detail page | "You might also like" section with cards |
| 70 | Create tour form | Navigate to `/dashboard/tours/create` | Form renders with all fields including availability + itinerary |

---

## Phase 3: Inquiry → Booking → Review Flow

### 3.1 Inquiry Creation
| # | Test | Method | Expected |
|---|------|--------|----------|
| 71 | Send inquiry for tour | `POST /inquiries` `{targetType: "TOUR", targetIds: [tour_id], subject: "Test", message: "Interested"}` | 201 |
| 72 | Send inquiry with non-existent target | `POST /inquiries` `{targetIds: ["fake-uuid"]}` | 400 |
| 73 | Send inquiry with empty targetIds | `POST /inquiries` `{targetIds: []}` | 400 |
| 74 | Send inquiry without auth | `POST /inquiries` (no token) | 401 |
| 75 | Send inquiry for guide | `POST /inquiries` `{targetType: "GUIDE"}` | 201 |
| 76 | Send inquiry for driver | `POST /inquiries` `{targetType: "DRIVER"}` | 201 |
| 77 | Send inquiry for company | `POST /inquiries` `{targetType: "COMPANY"}` | 201 |
| 78 | Send inquiry with message < 10 chars | `POST /inquiries` `{message: "Hi"}` | 422 or 201 (check validation) |

### 3.2 Inquiry Response & Booking Auto-Creation
| # | Test | Method | Expected |
|---|------|--------|----------|
| 79 | Provider accepts inquiry | `POST /inquiries/:id/respond` `{status: "ACCEPTED"}` | 200, booking auto-created |
| 80 | Verify booking exists after accept | `GET /bookings` (as inquiry sender) | Booking with status=CONFIRMED |
| 81 | Provider declines inquiry | `POST /inquiries/:id/respond` `{status: "DECLINED"}` | 200, NO booking created |
| 82 | Non-recipient tries to respond | As User C, `POST /inquiries/:id/respond` | 403 |
| 83 | Double response (accept then decline) | Accept, then try to respond again | 400 already responded |
| 84 | Check notification created on inquiry | `GET /notifications` (as provider) | INQUIRY notification exists |
| 85 | Check notification on response | `GET /notifications` (as sender) | BOOKING notification exists |

### 3.3 Booking Management
| # | Test | Method | Expected |
|---|------|--------|----------|
| 86 | List user bookings | `GET /bookings` | 200, paginated |
| 87 | List provider received bookings | `GET /bookings/received` | 200, paginated |
| 88 | Cancel booking | `PATCH /bookings/:id/cancel` | 200, status=CANCELLED |
| 89 | Cancel already-cancelled booking | `PATCH /bookings/:id/cancel` again | 400 |
| 90 | Complete booking (provider) | `PATCH /bookings/:id/complete` | 200, status=COMPLETED |
| 91 | Complete cancelled booking | `PATCH /bookings/:id/complete` on cancelled | 400 |
| 92 | Non-owner cancels booking | As User C, `PATCH /bookings/:id/cancel` | 403 |

### 3.4 Review After Booking
| # | Test | Method | Expected |
|---|------|--------|----------|
| 93 | Submit review for tour | `POST /reviews` `{targetType: "TOUR", targetId: tour_id, rating: 5, comment: "Great"}` | 201 |
| 94 | Submit duplicate review | `POST /reviews` (same target) | 409 |
| 95 | Rating=0 | `POST /reviews` `{rating: 0}` | 422 |
| 96 | Rating=6 | `POST /reviews` `{rating: 6}` | 422 |
| 97 | Rating=4.5 (decimal) | `POST /reviews` `{rating: 4.5}` | 422 or rounded |
| 98 | Update review | `PATCH /reviews/:id` `{rating: 3}` | 200 |
| 99 | Delete review | `DELETE /reviews/:id` | 200 |
| 100 | Verify averageRating updates | `GET /tours/:id` after review changes | Rating and reviewCount recalculated |
| 101 | XSS in review comment | `POST /reviews` `{comment: "<script>alert(1)</script>"}` | Sanitized |

### 3.5 Client Inquiry Dialog (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 102 | "Request This Tour" button on tour detail | Click button | RequestInquiryDialog opens |
| 103 | Dialog pre-filled with tour info | Check dialog | Subject pre-filled, tour summary visible |
| 104 | Submit inquiry from dialog | Fill message, submit | Toast success, dialog closes |
| 105 | Click "Request This Tour" while not logged in | Click button | Redirect to login |
| 106 | Same dialog on guide detail page | Navigate to guide detail, click CTA | Guide inquiry dialog opens |
| 107 | Same dialog on driver detail page | Navigate to driver detail, click CTA | Driver inquiry dialog opens |
| 108 | Same dialog on company detail page | Navigate to company detail, click CTA | Company inquiry dialog opens |

---

## Phase 4: Favorites System

### 4.1 Server API
| # | Test | Method | Expected |
|---|------|--------|----------|
| 109 | Add favorite | `POST /favorites` `{entityType: "TOUR", entityId: tour_id}` | 201 |
| 110 | Add duplicate favorite | `POST /favorites` (same) | 409 |
| 111 | Remove favorite | `DELETE /favorites/TOUR/:entityId` | 200 |
| 112 | Remove non-existent favorite | `DELETE /favorites/TOUR/fake-id` | 404 |
| 113 | List favorites | `GET /favorites` | 200, paginated |
| 114 | List favorites filtered by type | `GET /favorites?entityType=TOUR` | 200, only tours |
| 115 | Check single favorite | `GET /favorites/check?entityType=TOUR&entityId=x` | 200, `{isFavorited: true/false}` |
| 116 | Batch check favorites | `POST /favorites/check-batch` `{entityType: "TOUR", entityIds: [...]}` | 200, map of IDs |
| 117 | Batch check with 1000 IDs | `POST /favorites/check-batch` (1000 IDs) | Handled gracefully, <5s |
| 118 | Add favorite without auth | `POST /favorites` (no token) | 401 |
| 119 | Favorite non-existent entity | `POST /favorites` `{entityId: "fake"}` | 201 or 400 (check) |

### 4.2 Client Favorites (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 120 | Heart icon on TourCard | Check tour listing | Heart icon visible |
| 121 | Toggle favorite on TourCard | Click heart | Fills red (optimistic), API called |
| 122 | Heart state persists on page reload | Reload `/explore/tours` | Previously favorited tours show filled heart |
| 123 | Heart on GuideCard, DriverCard, CompanyCard | Check each listing page | Heart icons visible and functional |
| 124 | Favorites dashboard page | Navigate to `/dashboard/favorites` | Tabs: All, Tours, Guides, Drivers, Companies |
| 125 | Tab filtering works | Click each tab | Shows only entities of that type |
| 126 | Empty state | Remove all favorites, check page | "No favorites yet" message |
| 127 | Click heart while not logged in | Click heart on tour card | Redirect to login |

---

## Phase 5: Blog System

### 5.1 Server API
| # | Test | Method | Expected |
|---|------|--------|----------|
| 128 | List published blogs (public) | `GET /blogs` | 200, only published posts |
| 129 | Get blog by slug | `GET /blogs/:slug` | 200, full post |
| 130 | Get blog by ID | `GET /blogs/:id` | 200, full post |
| 131 | Get non-existent blog | `GET /blogs/fake-slug` | 404 |
| 132 | Get draft blog (public) | `GET /blogs/:draft_slug` | 404 |
| 133 | Related blogs | `GET /blogs/:id/related` | 200, array |
| 134 | Create blog (admin) | `POST /blogs` as admin | 201 |
| 135 | Create blog (non-admin) | `POST /blogs` as USER | 403 |
| 136 | Create blog with duplicate slug | `POST /blogs` (same slug) | 409 |
| 137 | Update blog | `PATCH /blogs/:id` as admin | 200 |
| 138 | Delete blog | `DELETE /blogs/:id` as admin | 200 |
| 139 | Upload blog cover | `POST /blogs/:id/cover` as admin | 200 |
| 140 | Delete blog cover | `DELETE /blogs/:id/cover` as admin | 200 |
| 141 | View count increments | `GET /blogs/:slug` 3x | viewCount increments |

### 5.2 Client Blog Pages (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 142 | Blog listing page | Navigate to `/blog` | Grid of blog cards |
| 143 | Blog post page | Click a blog card | Full post renders with cover, content, tags |
| 144 | Blog in header nav | Check Header | "Blog" link present |
| 145 | Blog management dashboard | Navigate to `/dashboard/blog` (as admin) | List of posts with create/edit/delete |
| 146 | Create blog form | Navigate to `/dashboard/blog/create` | Form with title, slug, content, tags, cover |
| 147 | Edit blog form | Click edit on existing post | Pre-filled form |

---

## Phase 6: Analytics & Provider Dashboard

### 6.1 Server API
| # | Test | Method | Expected |
|---|------|--------|----------|
| 148 | Track view | `POST /analytics/view` `{entityType: "TOUR", entityId: tour_id}` | 200 |
| 149 | Get provider analytics | `GET /analytics/me` as COMPANY | 200, stats object |
| 150 | Get analytics as regular USER | `GET /analytics/me` as USER | 403 |
| 151 | Analytics data isolation | Compare Company A vs Company B analytics | Each sees only their data |
| 152 | Track view for non-existent entity | `POST /analytics/view` `{entityId: "fake"}` | 200 or 400 |

### 6.2 Client Analytics (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 153 | Analytics dashboard page | Navigate to `/dashboard/analytics` as provider | Stats cards render |
| 154 | Analytics shows correct counts | Compare with manual API queries | Numbers match |
| 155 | Analytics not visible to regular users | Check sidebar as USER | No analytics link |

---

## Phase 7: Contact, Legal & Static Pages

### 7.1 Contact Form
| # | Test | Method | Expected |
|---|------|--------|----------|
| 156 | Submit valid contact form | `POST /contact` `{name, email, subject, message}` | 200 |
| 157 | Submit with invalid email | `POST /contact` `{email: "invalid"}` | 422 |
| 158 | Submit with empty fields | `POST /contact` `{}` | 422 |
| 159 | Rate limit: 4th request in 1 hour | `POST /contact` x4 | 429 on 4th |
| 160 | XSS in contact fields | `POST /contact` `{name: "<script>alert(1)</script>"}` | Sanitized |

### 7.2 Client Static Pages (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 161 | About page | Navigate to `/about` | Page renders with mission, team, stats |
| 162 | Contact page | Navigate to `/contact` | Form + contact info renders |
| 163 | Contact form submission | Fill and submit form | Toast success |
| 164 | Privacy policy | Navigate to `/legal/privacy` | Content renders |
| 165 | Terms of service | Navigate to `/legal/terms` | Content renders |
| 166 | Cookie policy | Navigate to `/legal/cookies` | Content renders |
| 167 | Footer links to legal pages | Click each footer link | Navigates to correct page |
| 168 | 404 page | Navigate to `/nonexistent-page` | Branded 404 with "Back to Home" CTA |
| 169 | Registration consent checkbox | Navigate to `/register` | "I agree to Terms + Privacy" checkbox required |

---

## Phase 8: Media Upload & Images

### 8.1 File Upload Security
| # | Test | Method | Expected |
|---|------|--------|----------|
| 170 | Upload valid JPEG | `POST /media/tours/:id` | 201 |
| 171 | Upload .exe file | `POST /media/tours/:id` (exe) | 400 invalid file type |
| 172 | Upload .php file | `POST /media/tours/:id` (php) | 400 invalid file type |
| 173 | Upload 10MB file (over 5MB limit) | `POST /media/tours/:id` (10MB) | 400 file too large |
| 174 | Upload 0-byte file | `POST /media/tours/:id` (empty) | 400 |
| 175 | MIME spoofing (exe renamed to .jpg) | `POST /media/tours/:id` | 400 (validate content) |
| 176 | Path traversal filename | `POST /media/tours/:id` filename: `../../etc/passwd` | Filename sanitized |
| 177 | Delete another user's media | `DELETE /media/:id` as wrong user | 403 |
| 178 | Cover image replacement | Upload cover twice for same entity | Old cover deleted |

---

## Phase 9: Chat & Notifications

### 9.1 Chat API
| # | Test | Method | Expected |
|---|------|--------|----------|
| 179 | Create direct chat | `POST /chats/direct` `{participantId: user_id}` | 201 |
| 180 | Send message | `POST /chats/:id/messages` `{content: "Hello"}` | 201 |
| 181 | Send message to chat user doesn't belong to | As User C | 403 |
| 182 | XSS in chat message | `{content: "<script>alert(1)</script>"}` | Sanitized |
| 183 | Get messages paginated | `GET /chats/:id/messages?page=1&limit=20` | 200 |
| 184 | Mark chat as read | `POST /chats/:id/read` | 200 |
| 185 | Leave chat | `DELETE /chats/:id/leave` | 200 |

### 9.2 Notifications
| # | Test | Method | Expected |
|---|------|--------|----------|
| 186 | List notifications | `GET /notifications` | 200, paginated |
| 187 | Unread count | `GET /notifications/unread-count` | 200, `{count: N}` |
| 188 | Mark single as read | `PATCH /notifications/:id/read` | 200 |
| 189 | Mark all as read | `PATCH /notifications/read-all` | 200 |
| 190 | Delete notification | `DELETE /notifications/:id` | 200 |
| 191 | Delete another user's notification | `DELETE /notifications/:other_id` | 403 |

---

## Phase 10: Currency, Sharing & Calendar

### 10.1 Currency (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 192 | Currency selector visible | Check header | GEL/USD/EUR dropdown |
| 193 | Switch to USD | Select USD | All prices convert with "~" prefix |
| 194 | Currency persists on reload | Reload page | Still shows USD |
| 195 | Switch back to GEL | Select GEL | Original prices shown |

### 10.2 Share Button (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 196 | Share button on tour detail | Check tour detail header | Share icon visible |
| 197 | Click share → dropdown | Click share button | Copy link, WhatsApp, Facebook, Twitter options |
| 198 | Copy link | Click "Copy link" | Toast "Link copied!" |
| 199 | Share on guide/driver/company details | Check each detail page | Share button present |

### 10.3 AddToCalendar (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 200 | Calendar button on booking | Check booking detail/card | "Add to Calendar" button visible |
| 201 | Download .ics file | Click button | .ics file downloads with correct event data |

---

## Phase 11: SEO & Metadata

### 11.1 Meta Tags (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 202 | Tour detail page title | View page source | `<title>Tour Name | AtlasCaucasus</title>` |
| 203 | Tour detail OG tags | View page source | og:title, og:description, og:image present |
| 204 | Tours listing title | View page source | "Explore Tours in the Caucasus | AtlasCaucasus" |
| 205 | Guide/Driver/Company detail titles | View page source | Entity name in title |
| 206 | Root layout default meta | View homepage source | Default title template set |
| 207 | robots.txt | `GET /robots.txt` | Returns rules, disallows /dashboard/ |
| 208 | sitemap.xml | `GET /sitemap.xml` | Returns XML with tour/guide/driver/company URLs |

---

## Phase 12: Compare Feature (Browser)

| # | Test | Action | Expected |
|---|------|--------|----------|
| 209 | Floating compare bar on companies | Select 2 companies on listing | Compare bar appears |
| 210 | Navigate to compare page | Click "Compare" | `/explore/companies/compare` with side-by-side |
| 211 | Same for guides | Select + compare guides | Compare page works |
| 212 | Same for drivers | Select + compare drivers | Compare page works |
| 213 | Max items limit | Try to add beyond limit | Cannot add more |
| 214 | Clear comparison | Click clear | Bar disappears, selection cleared |

---

## Phase 13: End-to-End Integration Flows

### 13.1 Complete User Journey (Browser + API)
Execute this full flow in the browser:
1. Register new user at `/register` with consent checkbox
2. Verify email (check API or use test token)
3. Browse tours at `/explore/tours`
4. Filter by location and price range
5. Click a tour → view detail page
6. Click "Request This Tour" → fill inquiry dialog → submit
7. Switch to provider account → check `/dashboard/inquiries/received`
8. Accept inquiry → verify booking auto-created
9. Switch back to user → check `/dashboard/bookings`
10. Add tour to favorites (heart icon)
11. Check favorites at `/dashboard/favorites`
12. Submit a review on the tour
13. Verify tour's averageRating updated
14. Check notification bell → notifications received

**Expected**: Every step succeeds, data is consistent across views.

### 13.2 Company Registration Flow (Browser)
1. Register company at `/register-company`
2. Complete company profile
3. Create a tour with itinerary + availability + images
4. Create a tour agent
5. Agent accepts invitation and logs in
6. Agent creates another tour
7. Check company's analytics dashboard
8. Receive and respond to an inquiry

### 13.3 Multi-Language Test (Browser)
1. Switch language to Georgian (ka) — check header language switcher
2. Navigate through pages — all text should be in Georgian
3. Switch to Russian (ru) — verify translation
4. Switch back to English (en)
5. Check that form validation errors are translated

---

## Phase 14: Error Handling & Edge Cases

### 14.1 Network & Server Errors
| # | Test | Action | Expected |
|---|------|--------|----------|
| 215 | Server down → client gracefully handles | Stop server, load client page | Error state shown, no crash |
| 216 | Slow response → loading states | Throttle network | Skeleton loaders appear |
| 217 | 500 error on API | Trigger server error | Toast with user-friendly message |
| 218 | Invalid JSON in request body | Send malformed JSON | 400 with clear error |

### 14.2 Empty States (Browser)
| # | Test | Action | Expected |
|---|------|--------|----------|
| 219 | No tours in listing | Filter to get 0 results | Empty state with CTA |
| 220 | No favorites | Remove all favorites | "No favorites yet" message |
| 221 | No bookings | New user → `/dashboard/bookings` | Empty state |
| 222 | No notifications | New user → notification bell | "No notifications" message |
| 223 | No inquiries | New user → `/dashboard/inquiries` | Empty state |

### 14.3 Hotels Tab Removed
| # | Test | Action | Expected |
|---|------|--------|----------|
| 224 | Hotels tab not in explore | Check `/explore` tabs | No "Hotels" option |

---

## Phase 15: Response Time & Verification Badges

| # | Test | Action | Expected |
|---|------|--------|----------|
| 225 | Response time displayed on cards | Check GuideCard, DriverCard, CompanyCard | "Responds within X" badge (if data exists) |
| 226 | Response time on detail sidebar | Check guide/driver/company detail | Response time shown |
| 227 | Verification badge visible | Check verified entity detail | "Verified" badge with shield icon |
| 228 | No badge for unverified | Check unverified entity | No verification badge |
| 229 | avgResponseTimeMinutes updates | Accept inquiry, check provider profile | Field updated |

---

## Verification

After all tests complete, the agent should:

1. **Compile a bug report** listing every failed test with:
   - Test number and description
   - Actual vs expected behavior
   - Steps to reproduce
   - Severity (Critical / High / Medium / Low)

2. **Check data integrity**:
   - Run `GET /tours` and verify pagination totalItems matches actual count
   - Check that averageRating on entities matches actual review averages
   - Verify favorite counts are consistent
   - Ensure no orphaned records in database

3. **Check console errors**:
   - Open browser DevTools → Console
   - Navigate through all main pages
   - Report any JavaScript errors or warnings

4. **Check server logs**:
   - Review server console output for unhandled errors
   - Check for any deprecation warnings
   - Look for N+1 query patterns in SQL logs
