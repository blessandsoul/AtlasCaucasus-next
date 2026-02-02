# Atlas Caucasus - Production Testing Guide

> **IMPORTANT**: Complete this entire guide before deploying to production.
> Check off each item as you complete it. This guide is designed to be followed sequentially.

---

## Table of Contents
1. [Pre-Testing Setup](#1-pre-testing-setup)
2. [Server Health & Configuration](#2-server-health--configuration)
3. [Authentication Testing](#3-authentication-testing)
4. [User Management Testing](#4-user-management-testing)
5. [Tour Management Testing](#5-tour-management-testing)
6. [Company Management Testing](#6-company-management-testing)
7. [Guide & Driver Testing](#7-guide--driver-testing)
8. [Inquiry System Testing](#8-inquiry-system-testing)
9. [Chat & Messaging Testing](#9-chat--messaging-testing)
10. [Review System Testing](#10-review-system-testing)
11. [Notification System Testing](#11-notification-system-testing)
12. [Search & Filter Testing](#12-search--filter-testing)
13. [File Upload Testing](#13-file-upload-testing)
14. [Security Testing](#14-security-testing)
15. [Performance Testing](#15-performance-testing)
16. [Mobile & Responsive Testing](#16-mobile--responsive-testing)
17. [Browser Compatibility Testing](#17-browser-compatibility-testing)
18. [Error Handling Testing](#18-error-handling-testing)
19. [Pre-Production Checklist](#19-pre-production-checklist)

---

## 1. Pre-Testing Setup

### 1.1 Environment Setup
- [ ] **Server is running** on `http://localhost:8000`
- [ ] **Client is running** on `http://localhost:3000`
- [ ] **MySQL database** is running and seeded
- [ ] **Redis** is running (for rate limiting & sessions)
- [ ] **Email service** is configured (Resend API key in `.env`)

### 1.2 Test Accounts to Create
Create these accounts before starting tests:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `admin@test.com` | `Test@123!` | ADMIN | Admin testing |
| `user@test.com` | `Test@123!` | USER | Regular user testing |
| `company@test.com` | `Test@123!` | COMPANY | Company owner testing |
| `guide@test.com` | `Test@123!` | GUIDE | Guide profile testing |
| `driver@test.com` | `Test@123!` | DRIVER | Driver profile testing |
| `unverified@test.com` | `Test@123!` | USER | Unverified email testing |

### 1.3 Tools Needed
- [ ] **Postman** or **Insomnia** (for API testing)
- [ ] **Browser DevTools** (Network tab, Console)
- [ ] **Multiple browser windows** (for multi-user testing)
- [ ] **Mobile device or emulator** (for responsive testing)
- [ ] **Stopwatch/timer** (for performance testing)

---

## 2. Server Health & Configuration

### 2.1 Health Check
- [ ] Open `http://localhost:8000/api/v1/health`
- [ ] Verify response: `{ "success": true, "message": "...", "data": { "status": "healthy" } }`
- [ ] Check database connection in health response
- [ ] Check Redis connection in health response

### 2.2 API Documentation
- [ ] Open `http://localhost:8000/api/v1/docs`
- [ ] Verify Swagger/OpenAPI documentation loads
- [ ] Test at least 3 endpoints from docs

### 2.3 CORS Configuration
- [ ] Open browser console on `http://localhost:3000`
- [ ] Verify no CORS errors on API calls
- [ ] Test from a different origin (should fail with CORS error)

### 2.4 Environment Variables
- [ ] Verify `DATABASE_URL` is set
- [ ] Verify `ACCESS_TOKEN_SECRET` is 32+ characters
- [ ] Verify `REFRESH_TOKEN_SECRET` is 32+ characters
- [ ] Verify `RESEND_API_KEY` is set (or email logging works)
- [ ] Verify `FRONTEND_URL` matches client URL

---

## 3. Authentication Testing

### 3.1 User Registration
- [ ] Go to `/register`
- [ ] Enter valid data and submit
- [ ] Verify success message appears
- [ ] Verify email verification email is sent (check inbox or console)
- [ ] Verify redirect to `/verify-email-pending`

### 3.2 Registration Validation
- [ ] Try empty form - verify field errors
- [ ] Try invalid email format - verify error message
- [ ] Try password < 8 chars - verify error
- [ ] Try password without uppercase - verify error
- [ ] Try password without number - verify error
- [ ] Try password without special char - verify error
- [ ] Try duplicate email - verify "email exists" error
- [ ] Try name < 2 chars - verify error

### 3.3 Email Verification
- [ ] Click verification link from email
- [ ] Verify success message
- [ ] Verify redirect to login
- [ ] Try expired token (after 24 hours) - verify error
- [ ] Try invalid token - verify error
- [ ] Try already-verified token - verify appropriate message

### 3.4 Resend Verification
- [ ] Login with unverified account
- [ ] Click "Resend verification"
- [ ] Verify new email is sent
- [ ] Verify rate limit after 3 resends

### 3.5 Login
- [ ] Go to `/login`
- [ ] Login with verified account
- [ ] Verify redirect to `/dashboard`
- [ ] Verify user data appears in header/sidebar
- [ ] Check localStorage for tokens (DevTools > Application)

### 3.6 Login Validation
- [ ] Try empty form - verify errors
- [ ] Try invalid email - verify error
- [ ] Try wrong password - verify "Invalid credentials"
- [ ] Try 6 wrong passwords - verify rate limit message

### 3.7 Token Refresh (Automatic)
- [ ] Login successfully
- [ ] Wait 15 minutes (or manually expire token in DevTools)
- [ ] Perform any action requiring auth
- [ ] Verify automatic token refresh (check Network tab)
- [ ] Verify user stays logged in

### 3.8 Logout
- [ ] Click logout button
- [ ] Verify redirect to home or login
- [ ] Verify tokens removed from localStorage
- [ ] Verify protected routes redirect to login

### 3.9 Logout All Sessions
- [ ] Login on two browser windows
- [ ] Logout all sessions from one window
- [ ] Verify second window gets logged out
- [ ] Verify refresh token no longer works

### 3.10 Password Reset
- [ ] Go to `/forgot-password`
- [ ] Enter registered email
- [ ] Verify success message (even for non-existent emails - security)
- [ ] Check email for reset link
- [ ] Click reset link
- [ ] Enter new password on `/reset-password`
- [ ] Verify can login with new password
- [ ] Verify old password no longer works

### 3.11 Company Registration
- [ ] Go to `/register-company`
- [ ] Fill company details
- [ ] Verify account created with COMPANY role
- [ ] Verify company profile auto-created
- [ ] Verify redirect to verification pending

---

## 4. User Management Testing

### 4.1 User Profile
- [ ] Login as regular user
- [ ] Go to `/dashboard/profile`
- [ ] Verify current info displays correctly
- [ ] Update first name - verify saves
- [ ] Update last name - verify saves
- [ ] Change password - verify works
- [ ] Try invalid password change - verify errors

### 4.2 Avatar Upload
- [ ] Click avatar upload button
- [ ] Upload valid image (jpg, png, webp)
- [ ] Verify avatar displays after upload
- [ ] Try uploading non-image file - verify rejection
- [ ] Try uploading 10MB+ file - verify rejection

### 4.3 Admin User Management
- [ ] Login as admin
- [ ] Go to `/dashboard/admin/users`
- [ ] Verify user list loads with pagination
- [ ] Search for a user - verify filtering
- [ ] View user details
- [ ] Update user role - verify role changes
- [ ] Deactivate user - verify user can't login
- [ ] Reactivate user - verify user can login again
- [ ] Delete user (soft delete) - verify user removed from list
- [ ] Restore deleted user - verify user restored

### 4.4 Account Deletion (Self)
- [ ] Login as regular user
- [ ] Go to profile settings
- [ ] Request account deletion
- [ ] Verify confirmation dialog
- [ ] Confirm deletion
- [ ] Verify logout and account deactivated

---

## 5. Tour Management Testing

### 5.1 Browse Tours (Public)
- [ ] Go to `/explore/tours` (no login required)
- [ ] Verify tour list loads
- [ ] Verify pagination works
- [ ] Click on a tour card
- [ ] Verify tour detail page loads

### 5.2 Tour Filtering
- [ ] Filter by city - verify results update
- [ ] Filter by category - verify correct tours show
- [ ] Filter by price range (min-max)
- [ ] Filter by difficulty level
- [ ] Filter by duration
- [ ] Combine multiple filters - verify correct results
- [ ] Clear filters - verify all tours return

### 5.3 Tour Sorting
- [ ] Sort by price (low to high)
- [ ] Sort by price (high to low)
- [ ] Sort by rating
- [ ] Sort by newest first
- [ ] Verify each sort works correctly

### 5.4 Tour Search
- [ ] Search by tour title
- [ ] Search by description keyword
- [ ] Search with no results - verify empty state
- [ ] Clear search - verify tours return

### 5.5 Tour Detail Page
- [ ] View tour with all fields filled
- [ ] Verify title, description, price display
- [ ] Verify images/gallery loads
- [ ] Verify owner/company info shows
- [ ] Verify location on map (if implemented)
- [ ] Verify inquiry button appears (for logged in users)

### 5.6 Create Tour
- [ ] Login as company/guide/driver
- [ ] Go to `/dashboard/tours/create`
- [ ] Fill required fields:
  - [ ] Title (verify validation)
  - [ ] Price (verify number only)
  - [ ] Duration
  - [ ] Description
- [ ] Fill optional fields:
  - [ ] City/Location
  - [ ] Max people
  - [ ] Difficulty
  - [ ] Category
  - [ ] Instant booking toggle
  - [ ] Free cancellation toggle
- [ ] Upload tour images
- [ ] Submit form
- [ ] Verify tour appears in "My Tours"
- [ ] Verify tour appears in public listing

### 5.7 Edit Tour
- [ ] Go to your tour detail page
- [ ] Click edit button
- [ ] Change title - verify saves
- [ ] Change price - verify saves
- [ ] Change images - verify updates
- [ ] Verify changes appear on public page

### 5.8 Delete Tour
- [ ] Go to your tour detail/edit page
- [ ] Click delete button
- [ ] Verify confirmation dialog
- [ ] Confirm deletion
- [ ] Verify tour removed from "My Tours"
- [ ] Verify tour removed from public listing

### 5.9 My Tours
- [ ] Go to `/dashboard` or tours section
- [ ] Verify only your tours appear
- [ ] Verify pagination works
- [ ] Verify can edit/delete from list

---

## 6. Company Management Testing

### 6.1 Browse Companies (Public)
- [ ] Go to `/explore/companies`
- [ ] Verify company list loads
- [ ] Verify pagination works
- [ ] Click on a company
- [ ] Verify company profile loads

### 6.2 Company Profile (Public)
- [ ] View company details
- [ ] View company photos
- [ ] View company tours list
- [ ] View company reviews
- [ ] Verify contact/inquiry options

### 6.3 Company Dashboard
- [ ] Login as company owner
- [ ] Go to `/dashboard/company`
- [ ] Verify company info displays
- [ ] Update company name - verify saves
- [ ] Update description - verify saves
- [ ] Update contact info - verify saves

### 6.4 Company Photos
- [ ] Upload company photo
- [ ] Verify photo appears in gallery
- [ ] Reorder photos (if implemented)
- [ ] Delete photo - verify removal

### 6.5 Tour Agent Management
- [ ] Go to `/dashboard/create-agent`
- [ ] Enter agent email
- [ ] Enter agent name
- [ ] Submit invitation
- [ ] Verify invitation email sent
- [ ] Open new incognito window
- [ ] Accept invitation via email link
- [ ] Set password for agent account
- [ ] Login as agent
- [ ] Verify agent can access company dashboard
- [ ] Verify agent can manage company tours

### 6.6 Tour Agent Listing
- [ ] Login as company owner
- [ ] Go to `/dashboard/operations/agents`
- [ ] Verify agent list shows
- [ ] Verify can remove agent
- [ ] Remove agent - verify agent loses access

---

## 7. Guide & Driver Testing

### 7.1 Claim Guide Role
- [ ] Login as regular user
- [ ] Go to role claim section
- [ ] Claim GUIDE role
- [ ] Verify guide profile created
- [ ] Verify dashboard updates for guide

### 7.2 Guide Profile Setup
- [ ] Go to `/dashboard/guide`
- [ ] Fill bio/description
- [ ] Add languages spoken
- [ ] Add years of experience
- [ ] Set availability status
- [ ] Save changes - verify updates

### 7.3 Guide Locations
- [ ] Go to guide locations tab
- [ ] Add service location (city)
- [ ] Add another location
- [ ] Verify locations appear on public profile
- [ ] Remove location - verify removal

### 7.4 Guide Photos
- [ ] Upload guide photo
- [ ] Verify photo appears
- [ ] Upload multiple photos
- [ ] Delete photo - verify removal

### 7.5 Browse Guides (Public)
- [ ] Go to `/explore/guides`
- [ ] Verify guide list loads
- [ ] Filter by location - verify results
- [ ] Filter by language (if implemented)
- [ ] Click guide - verify profile loads

### 7.6 Driver Testing (Repeat for Drivers)
- [ ] Claim DRIVER role
- [ ] Setup driver profile
- [ ] Add vehicle information
- [ ] Add service locations
- [ ] Upload driver photos
- [ ] Browse drivers publicly
- [ ] View driver profile

---

## 8. Inquiry System Testing

### 8.1 Create Inquiry (Tour)
- [ ] Login as user
- [ ] Go to a tour detail page
- [ ] Click "Make Inquiry" or similar
- [ ] Fill inquiry details:
  - [ ] Message
  - [ ] Preferred dates (if applicable)
- [ ] Submit inquiry
- [ ] Verify success message
- [ ] Verify inquiry appears in "Sent" list

### 8.2 Create Inquiry (Company/Guide/Driver)
- [ ] Go to company profile
- [ ] Click contact/inquiry button
- [ ] Fill and submit inquiry
- [ ] Repeat for guide profile
- [ ] Repeat for driver profile

### 8.3 View Sent Inquiries
- [ ] Go to `/dashboard/inquiries/sent`
- [ ] Verify all sent inquiries appear
- [ ] Verify pagination works
- [ ] Click inquiry - verify detail page

### 8.4 View Received Inquiries
- [ ] Login as tour/company owner
- [ ] Go to `/dashboard/inquiries/received`
- [ ] Verify received inquiries appear
- [ ] Click inquiry - verify details

### 8.5 Respond to Inquiry
- [ ] As recipient, open an inquiry
- [ ] Write response message
- [ ] Submit response
- [ ] Verify status changes to "RESPONDED"
- [ ] Login as sender - verify response visible

### 8.6 Accept/Decline Inquiry
- [ ] As recipient, open an inquiry
- [ ] Click "Accept" - verify status changes
- [ ] Test "Decline" on another inquiry
- [ ] Verify sender sees status change

### 8.7 Inquiry Rate Limiting
- [ ] Create 20 inquiries in 1 minute
- [ ] Verify rate limit kicks in
- [ ] Wait and verify can create again

---

## 9. Chat & Messaging Testing

### 9.1 Start Direct Chat
- [ ] Login as user
- [ ] Go to another user's profile
- [ ] Click "Message" or chat button
- [ ] Verify chat window opens
- [ ] Verify new chat created (check chat list)

### 9.2 Send Message
- [ ] Type message in chat input
- [ ] Press send (or Enter)
- [ ] Verify message appears in chat
- [ ] Verify timestamp shows

### 9.3 Receive Message
- [ ] Open two browser windows with different users
- [ ] Send message from user A
- [ ] Verify message appears for user B (real-time)
- [ ] Verify notification for user B

### 9.4 Chat List
- [ ] Go to `/chats` or chat section
- [ ] Verify all chats listed
- [ ] Verify unread count badge
- [ ] Verify last message preview
- [ ] Click chat - verify opens correct conversation

### 9.5 Mark as Read
- [ ] Send message to yourself (from another account)
- [ ] Open the chat
- [ ] Verify message marked as read
- [ ] Verify unread count updates

### 9.6 Message Rate Limiting
- [ ] Send 60 messages in 1 minute
- [ ] Verify rate limit triggers
- [ ] Wait and verify can send again

### 9.7 WebSocket Reconnection
- [ ] Open chat
- [ ] Disconnect network briefly (airplane mode)
- [ ] Reconnect
- [ ] Verify WebSocket reconnects
- [ ] Verify can send/receive messages

---

## 10. Review System Testing

### 10.1 Create Review (Tour)
- [ ] Login as user
- [ ] Go to tour you've "completed" or inquired about
- [ ] Click "Write Review"
- [ ] Set star rating (1-5)
- [ ] Write review text
- [ ] Submit review
- [ ] Verify review appears on tour page

### 10.2 Create Review (Company/Guide/Driver)
- [ ] Write review for company
- [ ] Write review for guide
- [ ] Write review for driver
- [ ] Verify each review appears correctly

### 10.3 View Reviews
- [ ] Go to entity with reviews (tour/guide/etc.)
- [ ] Verify reviews display
- [ ] Verify average rating shows
- [ ] Verify review count accurate
- [ ] Verify pagination for many reviews

### 10.4 Edit Review
- [ ] Go to your review
- [ ] Click edit
- [ ] Change rating
- [ ] Change text
- [ ] Save - verify updates
- [ ] Verify average rating recalculates

### 10.5 Delete Review
- [ ] Go to your review
- [ ] Click delete
- [ ] Confirm deletion
- [ ] Verify review removed
- [ ] Verify average rating recalculates

### 10.6 Review Validation
- [ ] Try creating review without rating - verify error
- [ ] Try creating duplicate review for same entity - verify error
- [ ] Try review with only rating (no text) - verify allowed or not per requirements

### 10.7 Review Rate Limiting
- [ ] Create 10 reviews in 1 minute
- [ ] Verify rate limit kicks in

---

## 11. Notification System Testing

### 11.1 Notification Generation
- [ ] Perform action that generates notification:
  - [ ] Receive chat message
  - [ ] Receive inquiry
  - [ ] Receive inquiry response
  - [ ] Get @mentioned in chat
- [ ] Verify notification appears

### 11.2 Notification Display
- [ ] Check notification icon/badge
- [ ] Verify unread count shows
- [ ] Open notification drawer/panel
- [ ] Verify notifications listed

### 11.3 Mark as Read
- [ ] Click on notification
- [ ] Verify marked as read
- [ ] Verify unread count decreases
- [ ] Verify notification styling changes (read vs unread)

### 11.4 Real-time Notifications
- [ ] Open app in two windows
- [ ] Trigger notification from one window
- [ ] Verify notification appears in real-time in other window

### 11.5 Notification Pagination
- [ ] Generate many notifications
- [ ] Open notification panel
- [ ] Scroll or click "load more"
- [ ] Verify older notifications load

---

## 12. Search & Filter Testing

### 12.1 Global Search
- [ ] Use search bar (if global)
- [ ] Search for tour title
- [ ] Search for company name
- [ ] Search for guide name
- [ ] Verify results categorized correctly

### 12.2 Location Autocomplete
- [ ] Start typing city name in search
- [ ] Verify autocomplete suggestions appear
- [ ] Select suggestion
- [ ] Verify correct location selected

### 12.3 Location Statistics
- [ ] Go to location detail (if implemented)
- [ ] Verify tour count per location
- [ ] Verify average ratings shown

### 12.4 Combined Search & Filter
- [ ] Search + filter by price
- [ ] Search + filter by category
- [ ] Search + multiple filters
- [ ] Verify results intersection is correct

### 12.5 Search with No Results
- [ ] Search for gibberish
- [ ] Verify "No results" message
- [ ] Verify suggestions or clear search option

---

## 13. File Upload Testing

### 13.1 Valid File Uploads
- [ ] Upload JPG image - verify success
- [ ] Upload PNG image - verify success
- [ ] Upload WebP image - verify success
- [ ] Upload GIF image (if allowed) - verify success

### 13.2 Invalid File Uploads
- [ ] Upload PDF file - verify rejection with error
- [ ] Upload EXE file - verify rejection
- [ ] Upload PHP file - verify rejection
- [ ] Upload file with .jpg extension but wrong content - verify rejection (magic byte check)

### 13.3 File Size Limits
- [ ] Upload file exactly at limit (5MB) - verify success
- [ ] Upload file over limit (6MB) - verify rejection
- [ ] Verify clear error message about size limit

### 13.4 Multiple File Upload
- [ ] Upload 5 images at once - verify all upload
- [ ] Upload 15 images at once - verify limit enforced (10 max)

### 13.5 File Access
- [ ] Upload file
- [ ] Copy file URL
- [ ] Open URL in incognito - verify accessible
- [ ] Verify URL format is correct (UUID-based)

### 13.6 File Deletion
- [ ] Upload file
- [ ] Delete file from entity
- [ ] Verify file removed from gallery
- [ ] Verify file URL returns 404 (or remains cached)

---

## 14. Security Testing

### 14.1 CSRF Protection
- [ ] Open DevTools Network tab
- [ ] Perform POST/PATCH/DELETE request
- [ ] Verify X-CSRF-Token header present
- [ ] Remove CSRF token manually in request - verify 403 error
- [ ] Verify automatic CSRF refresh on 403

### 14.2 Rate Limiting
Test these endpoints hit rate limits:

| Endpoint | Limit | Action |
|----------|-------|--------|
| Login | 5/15min | Try 6 logins with wrong password |
| Register | 3/15min | Try 4 registrations |
| Password Reset | 3/1hr | Try 4 reset requests |
| Inquiry Create | 20/min | Try 21 inquiries |
| Message Send | 60/min | Try 61 messages |

- [ ] Verify each rate limit triggers correctly
- [ ] Verify rate limit error message (429 status)
- [ ] Verify rate limit clears after time period

### 14.3 Authentication Bypass Attempts
- [ ] Access `/dashboard` without login - verify redirect to login
- [ ] Access `/dashboard/admin` as regular user - verify 403
- [ ] Access other user's profile edit - verify 403
- [ ] Edit other user's tour - verify 403
- [ ] Delete other user's review - verify 403

### 14.4 Input Validation (XSS Prevention)
- [ ] Enter `<script>alert('xss')</script>` in:
  - [ ] Tour title - verify escaped
  - [ ] Tour description - verify escaped
  - [ ] Chat message - verify escaped
  - [ ] Review text - verify escaped
  - [ ] User name - verify escaped
- [ ] Verify no script execution anywhere

### 14.5 SQL Injection Prevention
- [ ] Enter `' OR '1'='1` in search fields - verify no SQL error
- [ ] Enter `'; DROP TABLE users; --` in inputs - verify no effect
- [ ] Verify all queries use parameterized statements (Prisma does this)

### 14.6 Token Security
- [ ] Copy access token from localStorage
- [ ] Modify token payload (change userId)
- [ ] Use modified token - verify rejection (signature invalid)
- [ ] Use expired token - verify 401 and refresh flow

### 14.7 Password Security
- [ ] Verify passwords never appear in:
  - [ ] API responses
  - [ ] Console logs
  - [ ] Network requests (except login/register body)
- [ ] Verify password hashing in database (bcrypt)

### 14.8 Email Enumeration Prevention
- [ ] Request password reset for non-existent email
- [ ] Verify response is same as existing email
- [ ] No "email not found" error exposed

### 14.9 Session Security
- [ ] Login, note session
- [ ] Change password
- [ ] Verify old sessions invalidated (logout all)
- [ ] Verify must re-login with new password

### 14.10 Verified Email Restrictions
- [ ] Login with unverified email
- [ ] Try to create tour - verify blocked
- [ ] Try to upload files - verify blocked
- [ ] Try to update profile - verify blocked

---

## 15. Performance Testing

### 15.1 Page Load Times
Test each page loads within acceptable time (under 3 seconds):

| Page | Target | Actual | Pass? |
|------|--------|--------|-------|
| Home `/` | < 2s | ___ | [ ] |
| Login `/login` | < 1s | ___ | [ ] |
| Tours List `/explore/tours` | < 2s | ___ | [ ] |
| Tour Detail `/explore/tours/[id]` | < 2s | ___ | [ ] |
| Dashboard `/dashboard` | < 2s | ___ | [ ] |
| Chat `/chats` | < 2s | ___ | [ ] |

### 15.2 API Response Times
Test with Network tab in DevTools:

| Endpoint | Target | Actual | Pass? |
|----------|--------|--------|-------|
| GET /tours | < 500ms | ___ | [ ] |
| GET /tours/:id | < 200ms | ___ | [ ] |
| POST /auth/login | < 500ms | ___ | [ ] |
| GET /chats | < 300ms | ___ | [ ] |
| GET /notifications | < 200ms | ___ | [ ] |

### 15.3 Pagination Performance
- [ ] Load page 1 of tours - note time
- [ ] Load page 50 of tours - verify similar time
- [ ] Load page 1 of 1000+ items - verify acceptable

### 15.4 Image Loading
- [ ] Check images have proper sizing
- [ ] Check images lazy load (below fold)
- [ ] Check thumbnail vs full image usage

### 15.5 Concurrent Users Simulation
- [ ] Open 5 browser tabs logged in as different users
- [ ] Perform actions simultaneously
- [ ] Verify no errors or slowdowns

### 15.6 Memory Leaks (Long Session)
- [ ] Use app for 30+ minutes
- [ ] Check browser memory in Task Manager
- [ ] Verify memory doesn't grow unbounded
- [ ] Check for uncleared intervals/timeouts

---

## 16. Mobile & Responsive Testing

### 16.1 Mobile Viewport (375px)
Test on iPhone SE or similar:

| Element | Works? |
|---------|--------|
| Navigation hamburger menu | [ ] |
| Tour cards stack vertically | [ ] |
| Forms are usable | [ ] |
| Buttons are tappable (48px+ target) | [ ] |
| Text is readable (16px+ body) | [ ] |
| Images scale properly | [ ] |
| Chat interface usable | [ ] |
| Modals fit screen | [ ] |

### 16.2 Tablet Viewport (768px)
Test on iPad or similar:

| Element | Works? |
|---------|--------|
| Layout adjusts appropriately | [ ] |
| Sidebar visible or toggleable | [ ] |
| Grid layouts work | [ ] |
| Forms properly sized | [ ] |

### 16.3 Desktop Viewport (1440px)
- [ ] Content doesn't stretch too wide
- [ ] Proper max-width containers
- [ ] Sidebar navigation works
- [ ] Multi-column layouts correct

### 16.4 Touch Interactions
- [ ] Swipe gestures work (if any)
- [ ] Long press works (if any)
- [ ] Double tap doesn't zoom unexpectedly
- [ ] Scroll is smooth

### 16.5 Mobile-Specific Features
- [ ] Phone number fields show numeric keyboard
- [ ] Email fields show email keyboard
- [ ] Date pickers work on mobile
- [ ] File upload works from camera/gallery

---

## 17. Browser Compatibility Testing

### 17.1 Chrome (Latest)
- [ ] Full functionality works
- [ ] No console errors
- [ ] Performance acceptable

### 17.2 Firefox (Latest)
- [ ] Full functionality works
- [ ] No console errors
- [ ] Form autofill works

### 17.3 Safari (Latest)
- [ ] Full functionality works
- [ ] WebSocket works
- [ ] File upload works
- [ ] Date pickers work

### 17.4 Edge (Latest)
- [ ] Full functionality works
- [ ] No console errors

### 17.5 Mobile Safari (iOS)
- [ ] Login/auth works
- [ ] File upload from camera
- [ ] Notifications work
- [ ] WebSocket reconnection

### 17.6 Chrome Mobile (Android)
- [ ] Login/auth works
- [ ] File upload works
- [ ] Notifications work

---

## 18. Error Handling Testing

### 18.1 Network Errors
- [ ] Turn off WiFi/network
- [ ] Try to login - verify error message
- [ ] Try to load tours - verify error message
- [ ] Reconnect - verify recovery

### 18.2 Server Errors (500)
- [ ] Trigger internal error (if possible)
- [ ] Verify user-friendly error message
- [ ] Verify no stack trace exposed
- [ ] Verify error logged server-side

### 18.3 Not Found (404)
- [ ] Go to `/nonexistent-page`
- [ ] Verify 404 page displays
- [ ] Go to `/explore/tours/nonexistent-id`
- [ ] Verify "Tour not found" message

### 18.4 Validation Errors
- [ ] Submit form with invalid data
- [ ] Verify field-level errors display
- [ ] Verify errors clear on fix
- [ ] Verify form doesn't submit until valid

### 18.5 Session Expiration
- [ ] Login, close browser for 7+ days (or clear refresh token)
- [ ] Return to app
- [ ] Verify graceful logout and redirect to login
- [ ] Verify no infinite redirect loops

### 18.6 Concurrent Edit Conflicts
- [ ] Open same tour edit in two tabs
- [ ] Edit in tab 1, save
- [ ] Edit in tab 2, save
- [ ] Verify appropriate handling (last write wins or conflict message)

---

## 19. Pre-Production Checklist

### 19.1 Environment Configuration
- [ ] **Production URLs** set in environment variables
- [ ] **CORS_ORIGINS** includes only production domains
- [ ] **JWT secrets** are unique 64+ character strings (not defaults!)
- [ ] **Database** is production database (not dev)
- [ ] **Redis** is production Redis (not local)
- [ ] **Email service** is configured with production API key
- [ ] **File upload path** is configured for production storage

### 19.2 Security Hardening
- [ ] **HTTPS** enforced (redirect HTTP to HTTPS)
- [ ] **Secure cookies** enabled in production
- [ ] **HSTS headers** configured
- [ ] **Rate limiting** Redis-backed (not in-memory)
- [ ] **Error messages** don't expose internals
- [ ] **Debug logging** disabled in production

### 19.3 Database
- [ ] **Migrations** all applied
- [ ] **Seed data** removed or appropriate for production
- [ ] **Backups** configured and tested
- [ ] **Connection pooling** configured
- [ ] **Indexes** verified for slow queries

### 19.4 Monitoring & Logging
- [ ] **Error tracking** set up (Sentry, etc.)
- [ ] **Performance monitoring** configured
- [ ] **Uptime monitoring** configured
- [ ] **Log aggregation** set up
- [ ] **Alert thresholds** defined

### 19.5 Performance
- [ ] **Frontend build** is production optimized
- [ ] **Images** are optimized/compressed
- [ ] **Static assets** have cache headers
- [ ] **CDN** configured (if applicable)
- [ ] **Gzip/Brotli** compression enabled

### 19.6 Legal & Compliance
- [ ] **Privacy Policy** link works
- [ ] **Terms of Service** link works
- [ ] **Cookie consent** banner (if required)
- [ ] **GDPR** compliance (data export/deletion)

### 19.7 Backup & Recovery
- [ ] **Database backup** tested restoration
- [ ] **File backup** (uploaded images) configured
- [ ] **Disaster recovery** plan documented
- [ ] **Rollback procedure** documented

### 19.8 Final Smoke Test
After deploying to production:

- [ ] Home page loads
- [ ] Can register new account
- [ ] Can login
- [ ] Can browse tours
- [ ] Can create tour (as company)
- [ ] Can send inquiry
- [ ] Can send chat message
- [ ] Can receive notification
- [ ] Can upload image
- [ ] Can logout

---

## Test Results Summary

| Section | Passed | Failed | Notes |
|---------|--------|--------|-------|
| Server Health | /4 | | |
| Authentication | /11 | | |
| User Management | /4 | | |
| Tour Management | /9 | | |
| Company Management | /6 | | |
| Guide & Driver | /6 | | |
| Inquiry System | /7 | | |
| Chat & Messaging | /7 | | |
| Review System | /7 | | |
| Notification System | /5 | | |
| Search & Filter | /5 | | |
| File Upload | /6 | | |
| Security | /10 | | |
| Performance | /6 | | |
| Mobile & Responsive | /5 | | |
| Browser Compatibility | /6 | | |
| Error Handling | /6 | | |
| Pre-Production | /8 | | |
| **TOTAL** | /108 | | |

---

## Issue Tracking

### Critical Issues (Must Fix Before Production)
| # | Description | Status |
|---|-------------|--------|
| 1 | | |
| 2 | | |
| 3 | | |

### Major Issues (Should Fix Before Production)
| # | Description | Status |
|---|-------------|--------|
| 1 | | |
| 2 | | |
| 3 | | |

### Minor Issues (Can Fix After Launch)
| # | Description | Status |
|---|-------------|--------|
| 1 | | |
| 2 | | |
| 3 | | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product Owner | | | |

---

**Testing Completed Date**: _________________

**Production Ready**: [ ] YES  [ ] NO

**Notes**:
