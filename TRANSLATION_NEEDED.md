# Translation Audit Report

**Generated:** 2026-02-09
**Languages:** English (en), Georgian (ka), Russian (ru)
**i18n Library:** react-i18next with bundled JSON files in `client/src/locales/`

---

## Table of Contents

1. [Missing Translation Keys (RU)](#1-missing-translation-keys-in-russian-ru)
2. [Missing Translation Keys (KA)](#2-missing-translation-keys-in-georgian-ka)
3. [Entire Pages with No Translations (Hardcoded English)](#3-entire-pages-with-no-translations-hardcoded-english)
4. [Hardcoded Strings in Components (Features)](#4-hardcoded-strings-in-feature-components)
5. [Hardcoded Strings in Layout & Common Components](#5-hardcoded-strings-in-layout--common-components)
6. [Hardcoded Strings in App Pages](#6-hardcoded-strings-in-app-pages)
7. [Utility Functions with Hardcoded Strings](#7-utility-functions-with-hardcoded-strings)

---

## 1. Missing Translation Keys in Russian (RU)

These keys exist in `en/translation.json` but are **missing** from `ru/translation.json`.

### `common` section
| Missing Key | English Value |
|---|---|
| `common.active` | "Active" |
| `common.inactive` | "Inactive" |
| `common.creating` | "Creating..." |
| `common.id` | "ID" |
| `common.created_at` | "Created At" |
| `common.updated_at` | "Updated At" |
| `common.phone` | "Phone" |
| `common.website` | "Website" |
| `common.status` | "Status" |
| `common.years` | "years" |
| `common.verification` | "Verification" |
| `common.bio` | "Bio" |
| `common.seats` | "seats" |
| `common.close` | "Close" |
| `common.pagination.page_of` | "Page {{page}} of {{total}}" |

### `header` section
| Missing Key | English Value |
|---|---|
| `header.nav.notifications` | "Notifications" |
| `header.nav.messages` | "Messages" |
| `header.nav_menu.items.companies` | "Companies" |
| `header.nav_menu.explore.companies_subtitle` | "Find trusted tourism companies" |

### `auth` section
| Missing Key | English Value |
|---|---|
| `auth.create_agent_desc` | "Create a new agent account for your company." |
| `auth.create_agent_form_desc` | "Fill in the details to invite a new agent." |
| `auth.change_password` | "Change Password" |
| `auth.invalid_credentials` | "Invalid email or password." |
| `auth.invalid_credentials_with_attempts` | "Invalid email or password. {{count}} attempts remaining." |
| `auth.account_locked` | "Account is locked. Please try again later." |
| `auth.too_many_attempts` | "Too many attempts. Please try again later." |
| `auth.verify_email_required` | "Please verify your email to continue" |
| `auth.rate_limited` | "Too many requests. Please try again later." |

### `home` section (large gap - missing entirely)
| Missing Key | English Value |
|---|---|
| `home.features.title` | "Featured Tours" |
| `home.features.subtitle` | "Hand-picked experiences for you" |
| `home.features.view_all` | "View All" |
| `home.features.view_all_tours` | "View All Tours" |
| `home.destinations.title` | "Popular Destinations" |
| `home.destinations.tours_count` | "{{count}} Tours" |
| `home.cta.title` | "Ready to start your journey?" |
| `home.cta.subtitle` | "Join thousands of travelers..." |
| `home.cta.get_started` | "Get Started" |
| `home.cta.browse_tours` | "Browse Tours" |
| `home.categories.title` | "Find Your Vibe" |
| `home.categories.subtitle` | "Discover tours that match your travel style." |
| `home.categories.items.hiking` | "Hiking" |
| `home.categories.items.wine` | "Wine" |
| `home.categories.items.culture` | "Culture" |
| `home.categories.items.sea` | "Sea" |
| `home.categories.items.adventure` | "Adventure" |
| `home.testimonials.title` | "Trusted by Travelers" |
| `home.testimonials.review_1` | "The best experience of my life!..." |
| `home.testimonials.review_2` | "Incredible guides and seamless organization." |
| `home.testimonials.review_3` | "Highly recommended for solo travelers." |
| `home.testimonials.review_4` | "Food, wine, and views - everything was perfect." |

### `explore_page` section
| Missing Key | English Value |
|---|---|
| `explore_page.hero.companies_title` | "Trusted Tour Operators" |
| `explore_page.hero.companies_subtitle` | "Find and connect with certified travel companies..." |
| `explore_page.hero.drivers_title` | "Professional Drivers" |
| `explore_page.hero.drivers_subtitle` | "Reliable transportation services..." |
| `explore_page.filters.languages` | "Languages" |
| `explore_page.filters.language_placeholder` | "English, Georgian..." |
| `explore_page.filters.experience` | "Experience" |
| `explore_page.filters.min_years` | "Min years" |

### `company_details` section (missing entirely from RU)
| Missing Key | English Value |
|---|---|
| `company_details.not_found_title` | "Company not found" |
| `company_details.not_found_desc` | "The company you are looking for does not exist..." |
| `company_details.back_to_companies` | "Back to Companies" |
| `company_details.joined` | "Joined {{date}}" |
| `company_details.reg_number` | "Reg: {{number}}" |
| `company_details.contact` | "Contact" |
| `company_details.about_company` | "About {{name}}" |
| `company_details.no_description` | "This company hasn't added a description yet." |
| `company_details.stats.tours` | "Tours" |
| `company_details.stats.reviews` | "Reviews" |
| `company_details.stats.rating` | "Rating" |
| `company_details.stats.response` | "Response" |
| `company_details.no_active_tours` | "No active tours listed." |
| `company_details.contact_info.title` | "Contact Information" |
| `company_details.contact_info.website` | "Website" |
| `company_details.contact_info.phone` | "Phone" |
| `company_details.contact_info.email` | "Email" |
| `company_details.verified_partner.title` | "Verified Partner" |
| `company_details.verified_partner.desc` | "This company has been verified..." |

### `company.operations` section (missing from RU)
| Missing Key | English Value |
|---|---|
| `company.management.group_title` | "Management" |
| `company.operations.title` | "Operations" |
| `company.operations.subtitle` | "Manage your business operations" |
| `company.operations.tabs.agents` | "Agents" |
| `company.operations.tabs.tours` | "Tours" |
| `company.operations.tours.table.title` | "Title" |
| `company.operations.tours.table.location` | "Location" |
| `company.operations.tours.table.price` | "Price" |
| `company.operations.tours.table.status` | "Status" |
| `company.operations.tours.table.created` | "Created" |
| `company.operations.tours.empty_state` | "No tours found..." |

### `guide_details` section (partially missing from RU)
| Missing Key | English Value |
|---|---|
| `guide_details.tabs.photos` | "Photos" |
| `guide_details.tour_card.check_dates` | "Check dates" |
| `guide_details.tour_card.today` | "Today" |
| `guide_details.tour_card.tomorrow` | "Tomorrow" |
| `guide_details.tour_card.new` | "New" |
| `guide_details.tour_card.from` | "from {{location}}" |
| `guide_details.tour_card.flexible` | "Flexible" |
| `guide_details.tour_card.free_cancel` | "Free Cancel" |
| `guide_details.tour_card.instant` | "Instant" |
| `guide_details.tour_card.per_person` | "per person" |
| `guide_details.chat.login_required` | "Please log in to start a chat" |
| `guide_details.chat.self_chat_error` | "You can't chat with yourself" |
| `guide_details.chat.start_error` | "Failed to start chat..." |
| `guide_details.notifications.*` | (all notification keys) |
| `guide_details.guide_photos` | "Guide Photos" |
| `guide_details.days.Mon` | "Mon" |
| `guide_details.days.Tue` | "Tue" |
| `guide_details.days.Wed` | "Wed" |
| `guide_details.days.Thu` | "Thu" |
| `guide_details.days.Fri` | "Fri" |
| `guide_details.days.Sat` | "Sat" |
| `guide_details.days.Sun` | "Sun" |

### `driver_details` section (missing entirely from RU)
This entire section exists in KA but not in EN or RU. However, it is used in the driver detail page. Needs to be added to EN and RU:
| Key Pattern | Description |
|---|---|
| `driver_details.not_found.*` | Not found messages |
| `driver_details.tabs.*` | Tab labels (About & Vehicle, Reviews, Photos) |
| `driver_details.about.*` | About section (bio, vehicle details, operating areas) |
| `driver_details.sidebar.*` | Sidebar (daily rate, book now, fuel disclaimer) |

### `driver` dashboard section (missing from RU)
| Missing Key | English Value (from KA) |
|---|---|
| `driver.dashboard.*` | Driver Profile dashboard labels |
| `driver.profile.*` | Profile edit labels |
| `driver.bio` | Bio label |
| `driver.vehicle` | Vehicle label |
| `driver.vehicle_capacity` | Capacity label |
| `driver.photos.*` | Photo upload labels |
| `driver.delete_*` | Delete profile labels |

### `guide` dashboard section (missing from RU)
| Missing Key | English Value (from KA) |
|---|---|
| `guide.profile.subtitle` | Profile subtitle |
| `guide.profile.avatar` | Avatar label |
| `guide.bio` | Bio label |
| `guide.experience` | Experience label |
| `guide.languages` | Languages label |
| `guide.photos.*` | Photo upload labels |
| `guide.delete_*` | Delete profile labels |

### `dashboard.menu` section
| Missing Key | English Value |
|---|---|
| `dashboard.menu.inquiries` | "Inquiries" |
| `dashboard.menu.reviews` | "My Reviews" |

### `dashboard.reviews` section (missing from RU)
| Missing Key | English Value |
|---|---|
| `dashboard.reviews.title` | "My Reviews" |
| `dashboard.reviews.description` | "Manage your reviews..." |

### `reviews` section (partially missing from RU)
| Missing Key | English Value |
|---|---|
| `reviews.section_title` | "Reviews" |
| `reviews.write_review` | "Write a Review" |
| `reviews.edit_your_review` | "Edit Your Review" |
| `reviews.already_reviewed` | "You have already reviewed this item." |
| `reviews.login_to_review` | "Please log in to write a review." |
| `reviews.edit_title` | "Edit Your Review" |
| `reviews.edit_description` | "Update your rating and comment below." |
| `reviews.no_reviews` | "No reviews yet" |
| `reviews.no_reviews_description` | "Be the first to share your experience!" |
| `reviews.based_on` | "Based on {{count}} reviews" |
| `reviews.rating_required` | "Please select a rating" |
| `reviews.comment_placeholder` | "Share your experience..." |
| `reviews.submit_review` | "Submit Review" |
| `reviews.submitting` | "Submitting..." |
| `reviews.update_review` | "Update Review" |
| `reviews.updating` | "Updating..." |
| `reviews.review_created` | "Review submitted successfully!" |
| `reviews.review_updated` | "Review updated successfully!" |
| `reviews.review_deleted` | "Review deleted successfully!" |
| `reviews.delete_confirm_title` | "Delete Review" |
| `reviews.delete_confirm_description` | "Are you sure...?" |
| `reviews.my_reviews.*` | My reviews tab labels |
| `reviews.stats.*` | Review stats labels |

### `admin.locations.details` section (missing from RU)
| Missing Key | English Value |
|---|---|
| `admin.locations.details.title` | "Location Details" |
| `admin.locations.details.description` | "Full information about the selected location." |
| `admin.locations.details.latitude` | "Latitude" |
| `admin.locations.details.longitude` | "Longitude" |

### `admin.tabs` section
| Missing Key | English Value |
|---|---|
| `admin.tabs.users` | "Users" |

---

## 2. Missing Translation Keys in Georgian (KA)

KA is the most complete translation file. Very few gaps vs EN:

| Missing Key | English Value |
|---|---|
| `reviews.no_reviews_description` | "Be the first to share your experience!" |
| `reviews.based_on` | "Based on {{count}} reviews" |
| `reviews.rating_required` | "Please select a rating" |
| `reviews.submit_review` | "Submit Review" |
| `reviews.submitting` | "Submitting..." |
| `reviews.update_review` | "Update Review" |
| `reviews.updating` | "Updating..." |
| `reviews.review_created` | "Review submitted successfully!" |
| `reviews.review_updated` | "Review updated successfully!" |
| `reviews.review_deleted` | "Review deleted successfully!" |
| `reviews.my_reviews.*` | My reviews section (uses different key structure) |
| `reviews.stats.*` | Review stats |

> Note: KA has many EXTRA keys that EN doesn't have (e.g. `notifications.*`, `chat.*`, `not_found.*`, `driver_details.*`, extended `driver.*` and `guide.*` dashboard keys, extra `explore_page.filters.*` keys). These should be **backported to EN and RU** as well.

### Keys in KA but missing from EN (need to be added to EN)
| Key | Georgian Value (meaning) |
|---|---|
| `notifications.title` | Notifications |
| `notifications.mark_all_read` | Mark all read |
| `notifications.empty_title` | No notifications |
| `notifications.empty_desc` | You have no new notifications |
| `notifications.load_more` | Load more |
| `notifications.time_ago.*` | Time ago labels (just now, X min ago, etc.) |
| `chat.drawer_title` | Messages |
| `chat.detail_title` | Chat |
| `chat.back` | Back |
| `chat.new_chat` | New chat |
| `chat.*` | (full chat UI translation keys) |
| `not_found.title` | Page not found |
| `not_found.description` | Description text |
| `not_found.back_home` | Back to home |
| `not_found.explore_tours` | Browse tours |
| `driver_details.*` | Full driver detail page translations |
| `driver.profile.subtitle` | Profile edit subtitle |
| `driver.bio` through `driver.delete_*` | Driver dashboard profile keys |
| `guide.profile.subtitle` | Guide profile subtitle |
| `guide.bio` through `guide.delete_*` | Guide dashboard profile keys |
| `explore_page.hero.guides_title` | Find your guide |
| `explore_page.hero.guides_subtitle` | Discover Georgia with locals |
| `explore_page.filters.*` (many extra) | Extended filter keys (difficulty, sort_by, vehicle_type, etc.) |

---

## 3. Entire Pages with No Translations (Hardcoded English)

These pages have **zero** translation usage - all text is hardcoded in English.

### `app/about/page.tsx` - HIGH PRIORITY
**All text hardcoded.** Needs full translation for:
- Page title: "About AtlasCaucasus"
- Hero section: "Your trusted gateway to authentic travel experiences..."
- Mission section: "Our Mission" + paragraphs
- Stats: "Active Tours", "Local Guides", "Destinations", "Happy Travelers"
- Team section: "Meet Our Team" + team member names/roles/bios
- CTA section: "Ready to Explore?" + subtitle
- Button labels: "Browse Tours", "Find a Guide"

### `app/contact/page.tsx` - HIGH PRIORITY
**All text hardcoded.** Needs translation for:
- Page title: "Get in Touch"
- Subtitle: "Have questions? We're here to help..."
- Form labels: "Name", "Email", "Subject", "Message"
- Form placeholders: "John Doe", "How can we help you?", etc.
- Zod validation messages (5 strings)
- Toast success message
- Contact info section: "Contact Information", "Email", "Phone", "Address"
- Address text: "123 Rustaveli Avenue, Tbilisi, Georgia"
- Office hours section: "Office Hours" + day/time labels
- FAQ section: "Frequently Asked Questions" + all Q&A pairs (6 items)
- Button: "Send Message" / "Sending..."

### `app/legal/privacy/page.tsx` - MEDIUM PRIORITY
Entire privacy policy document is hardcoded English (~150 lines of content).

### `app/legal/terms/page.tsx` - MEDIUM PRIORITY
Entire terms of service document is hardcoded English (~180 lines of content).

### `app/legal/cookies/page.tsx` - MEDIUM PRIORITY
Entire cookie policy document is hardcoded English (~160 lines of content).

---

## 4. Hardcoded Strings in Feature Components

### Chat Components (`features/chat/`)
| File | String | Context |
|---|---|---|
| `ChatWindow.tsx:38` | `'Group Chat'` | Fallback name |
| `ChatWindow.tsx:46` | `'Chat'` | Fallback name |
| `ChatWindow.tsx:131` | `'participants'` | Participant count |
| `ChatWindow.tsx:144` | `'Failed to load messages'` | Error message |
| `ChatWindow.tsx:148` | `'No messages yet. Start the conversation!'` | Empty state |
| `ChatWindow.tsx:162` | `'is'` / `'are'` + `'typing...'` | Typing indicator |
| `ChatListItem.tsx:19` | `'Group Chat'` | Fallback name |
| `ChatListItem.tsx:27` | `'Chat'` | Fallback name |
| `ChatListItem.tsx:40` | `'Yesterday'` | Timestamp |
| `ChatListItem.tsx:69` | `'You: '` | Message prefix |
| `MessageInput.tsx:96` | `placeholder="Type a message..."` | Input placeholder |
| `MessageItem.tsx:58` | `aria-label="Read"` | Accessibility |
| `MessageItem.tsx:60` | `aria-label="Sent"` | Accessibility |

### Driver Components (`features/drivers/`)
| File | String | Context |
|---|---|---|
| `DriverHeader.tsx:69` | `'Please log in to send a message'` | Toast error |
| `DriverHeader.tsx:75` | `"You can't message yourself"` | Toast error |
| `DriverHeader.tsx:85` | `'Failed to start chat. Please try again.'` | Toast error |
| `DriverCard.tsx:133,143` | `'New'` | Fallback rating |
| `DriverCard.tsx:164` | `title="Vehicle Type"` | Tooltip |
| `DriverCard.tsx:168` | `title="Passenger Capacity"` | Tooltip |
| `dashboard/DriverProfileTab.tsx:289` | `placeholder="AB-123-CD"` | License placeholder |

### Guide Components (`features/guides/`)
| File | String | Context |
|---|---|---|
| `GuideCard.tsx:165,175` | `'New'` | Fallback rating |
| `dashboard/GuideProfileTab.tsx:266` | `placeholder="English, Georgian, Russian"` | Languages placeholder |

### Company Components (`features/companies/`)
| File | String | Context |
|---|---|---|
| `CompanyCard.tsx:129,138` | `'New'` | Fallback rating |
| `CreateAgentForm.tsx:125` | `placeholder="+995 555 00 00 00"` | Phone placeholder |

### Tour Components (`features/tours/`)
| File | String | Context |
|---|---|---|
| `TourHeader.tsx:27` | `', Georgia'` | Hardcoded country name |
| `TourHeader.tsx:34` | `'New'` | Fallback rating |
| `TourHeader.tsx:37` | `'review'` / `'reviews'` | Singular/plural |
| `TourLightbox.tsx:77` | `sr-only "Close"` | Screen reader |
| `TourLightbox.tsx:91` | `sr-only "Previous"` | Screen reader |
| `TourLightbox.tsx:105` | `sr-only "Next"` | Screen reader |

### Review Components (`features/reviews/`)
| File | String | Context |
|---|---|---|
| `MyReviews.tsx:28-33` | `'Tour'`, `'Guide'`, `'Driver'`, `'Company'` | Target type labels object |

### Admin Components (`features/admin/`)
| File | String | Context |
|---|---|---|
| `CreateUserDialog.tsx:83` | `placeholder="user@example.com"` | Email placeholder |
| `CreateUserDialog.tsx:109` | `placeholder="John"` | First name placeholder |
| `CreateUserDialog.tsx:121` | `placeholder="Doe"` | Last name placeholder |
| `hooks/useCreateUser.ts:20` | `'User created successfully'` | Toast |
| `hooks/useAuditLogs.ts:21` | `'User restored successfully'` | Toast |

### Explore Components
| File | String | Context |
|---|---|---|
| `ExploreHero.tsx:36` | `alt="Explore Background"` | Image alt |
| `ExploreFilters.tsx:431,439` | `placeholder="Min"`, `placeholder="Max"` | Filter inputs |
| `ExploreFilters.tsx:474,482` | `placeholder="Min"`, `placeholder="Max"` | Duration inputs |

### Blog Components
| File | String | Context |
|---|---|---|
| `BlogPostForm.tsx:273` | `alt="Cover preview"` | Image alt |

### Partner/BecomePartner
| File | String | Context |
|---|---|---|
| `BecomePartnerPage.tsx:351` | `placeholder="AA-123-BB"` | License placeholder |

---

## 5. Hardcoded Strings in Layout & Common Components

### Header (`components/layout/Header.tsx`)
| String | Context |
|---|---|
| `"About"` | Navigation link |
| `"Contact"` | Navigation link |
| `"Language & Currency"` | aria-label |

### Footer (`components/layout/Footer.tsx`)
| String | Context |
|---|---|
| `"Language"` | Label in preferences panel |
| `"Currency"` | Label in preferences panel |
| `"Quick Links"` | Section heading |
| `"About"` | Link text |
| `"Contact"` | Link text |
| `"123 Rustaveli Avenue, Tbilisi, Georgia"` | Address |
| `"+995 555 123 456"` | Phone number |

### MobileMenu (`components/layout/MobileMenu.tsx`)
| String | Context |
|---|---|
| `"About"` | Link text |
| `"Contact"` | Link text |

### OnlineIndicator (`components/common/OnlineIndicator.tsx`)
| String | Context |
|---|---|
| `'Online'` / `'Offline'` | Title attribute and label |

### ListingCard (`components/common/ListingCard.tsx`)
| String | Context |
|---|---|
| `"from"` | Price prefix |

### Pagination (`components/common/Pagination.tsx`)
| String | Context |
|---|---|
| `"Page {page} of {totalPages}"` | Pagination text |

### ErrorBoundary (`components/common/ErrorBoundary.tsx`)
| String | Context |
|---|---|
| `"Something went wrong"` | Error heading |
| `"An unexpected error occurred"` | Error message |
| `"Try Again"` | Button text |

### ErrorMessage (`components/common/ErrorMessage.tsx`)
| String | Context |
|---|---|
| `'Error'` | Default title prop |

### ProtectedRoute (`components/common/ProtectedRoute.tsx`)
| String | Context |
|---|---|
| `"Access Denied"` | Error heading |
| `"You do not have permission to access this page."` | Error message |

### ConfirmDialog (`components/common/ConfirmDialog.tsx`)
| String | Context |
|---|---|
| `'Confirm'` | Default confirm label |
| `'Cancel'` | Default cancel label |

### ShareButton (`components/common/ShareButton.tsx`)
| String | Context |
|---|---|
| `"WhatsApp"`, `"Facebook"`, `"X (Twitter)"` | Platform names |

### CurrencySelector (`components/common/CurrencySelector.tsx`)
| String | Context |
|---|---|
| `"Select currency"` | aria-label |

---

## 6. Hardcoded Strings in App Pages

### Blog pages
| File | String | Context |
|---|---|---|
| `app/blog/page.tsx` | `'Today'`, `'Yesterday'`, `'Xd ago'` | timeAgo helper |
| `app/blog/[slug]/BlogPostClient.tsx` | `"Back to Blog"` | Navigation |

### Dashboard pages
| File | String | Context |
|---|---|---|
| `app/dashboard/bookings/page.tsx` | `'Today'`, `'Yesterday'`, `'Xd ago'` | timeAgo helper |
| `app/dashboard/bookings/page.tsx` | `'Confirmed'`, `'Completed'`, `'Cancelled'` | Status labels |
| `app/dashboard/bookings/page.tsx` | `"Booking"` | Template literal |
| `app/dashboard/bookings/page.tsx` | `'guest'` / `'guests'` | Singular/plural |
| `app/dashboard/favorites/page.tsx` | `'Today'`, `'Yesterday'`, etc. | timeAgo helper |

---

## 7. Utility Functions with Hardcoded Strings

### `timeAgo()` helper (duplicated in multiple files)
This function appears in several files and always has hardcoded English:
- `app/blog/page.tsx`
- `app/dashboard/bookings/page.tsx`
- `app/dashboard/favorites/page.tsx`
- `features/chat/components/ChatListItem.tsx`

Strings: `'Today'`, `'Yesterday'`, `'Xd ago'`, `'Xh ago'`, `'Xm ago'`, `'Just now'`

**Suggestion:** Create a shared utility using translation keys like `common.time.today`, `common.time.yesterday`, etc.

---

## Summary & Priority Guide

### Priority 1 - Critical (User-facing pages with zero translations)
- [ ] `app/about/page.tsx` - Entire page
- [ ] `app/contact/page.tsx` - Entire page (form + FAQ + contact info)
- [ ] Navigation links "About" and "Contact" in Header, Footer, MobileMenu

### Priority 2 - High (Missing translation keys for existing features)
- [ ] RU: `home.features`, `home.destinations`, `home.cta`, `home.categories`, `home.testimonials`
- [ ] RU: `company_details.*` (entire section)
- [ ] RU: `company.operations.*`
- [ ] RU: `driver_details.*` (entire section - also missing from EN!)
- [ ] RU: `guide_details.tour_card.*`, `guide_details.chat.*`, `guide_details.days.*`
- [ ] RU: `reviews.*` (most of the section)
- [ ] RU: `driver.*` and `guide.*` dashboard sections
- [ ] EN: `driver_details.*` (exists only in KA, needs EN and RU)
- [ ] EN: `notifications.*` (exists only in KA, needs EN and RU)
- [ ] EN: `chat.*` (exists only in KA, needs EN and RU)
- [ ] EN: `not_found.*` (exists only in KA, needs EN and RU)

### Priority 3 - Medium (Hardcoded strings in components)
- [ ] Chat components (13+ strings)
- [ ] Toast error messages in DriverHeader (3 strings)
- [ ] "New" rating fallback in CompanyCard, DriverCard, GuideCard, TourHeader
- [ ] Legal pages: privacy, terms, cookies (large content blocks)
- [ ] ErrorBoundary, ProtectedRoute error messages
- [ ] timeAgo() utility (duplicated in 4+ files)

### Priority 4 - Low (Placeholders, aria-labels, minor UI)
- [ ] Form placeholders across admin, partner, explore components
- [ ] aria-label attributes
- [ ] Screen reader only text (sr-only)
- [ ] Image alt texts
- [ ] Social platform names (WhatsApp, Facebook, etc.)

---

## Suggested New Translation Keys to Add

```
// For about page
about.title
about.hero_text
about.mission_title
about.mission_desc
about.stats.active_tours
about.stats.local_guides
about.stats.destinations
about.stats.happy_travelers
about.team_title
about.team_subtitle
about.cta_title
about.cta_subtitle
about.browse_tours
about.find_guide

// For contact page
contact.title
contact.subtitle
contact.form.name
contact.form.name_placeholder
contact.form.email
contact.form.email_placeholder
contact.form.subject
contact.form.subject_placeholder
contact.form.message
contact.form.message_placeholder
contact.form.send
contact.form.sending
contact.form.success
contact.validation.*
contact.info.title
contact.info.email
contact.info.phone
contact.info.address
contact.info.office_hours
contact.faq.title
contact.faq.subtitle
contact.faq.q1 through contact.faq.q6
contact.faq.a1 through contact.faq.a6

// For timeAgo utility
common.time.just_now
common.time.minutes_ago
common.time.hours_ago
common.time.days_ago
common.time.yesterday
common.time.today

// For common UI
common.online
common.offline
common.access_denied
common.no_permission
common.something_went_wrong
common.unexpected_error
common.confirm
common.from

// For navigation
header.nav.about
header.nav.contact
header.footer.quick_links
header.footer.address
header.footer.language
header.footer.currency
```
