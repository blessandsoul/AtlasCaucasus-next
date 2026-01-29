# Tourism Server - Testing Checklist

## ✅ Authentication System
- [ ] User registration works
- [ ] Email verification token sent
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials fails (401)
- [ ] JWT access token returned on login
- [ ] JWT token refresh works
- [ ] Password reset request works
- [ ] Password reset with valid token works
- [ ] Account lockout after 5 failed attempts
- [ ] Multi-role registration works (USER, COMPANY, GUIDE, DRIVER)
- [ ] Tour agent creation by company works
- [ ] Logout invalidates refresh token

## ✅ Tours Module
- [ ] Create tour (as TOUR_AGENT or COMPANY)
- [ ] List tours with pagination
- [ ] Get tour by ID
- [ ] Update own tour
- [ ] Cannot update others' tours (403)
- [ ] Delete own tour
- [ ] Filter tours by location
- [ ] Filter tours by price range
- [ ] Tours show correct average rating
- [ ] Tours show correct review count

## ✅ Guides Module
- [ ] Create guide profile
- [ ] List guides with location filter
- [ ] Get guide by ID
- [ ] Update own guide profile
- [ ] Associate guides with locations
- [ ] Guides appear in search results
- [ ] Average rating displayed

## ✅ Drivers Module
- [ ] Create driver profile
- [ ] List drivers with filters
- [ ] Get driver by ID
- [ ] Update own driver profile
- [ ] Vehicle information stored correctly
- [ ] Drivers appear in search results

## ✅ Companies Module
- [ ] Register company (during user registration)
- [ ] List companies with pagination
- [ ] Get company by ID
- [ ] Update own company
- [ ] Create tour agent sub-accounts
- [ ] Tour agents can create tours for company
- [ ] Company verification status works

## ✅ Chat System
- [ ] Create direct chat between two users
- [ ] Create group chat (TOUR_AGENT/COMPANY only)
- [ ] Send message via REST API
- [ ] Send message via WebSocket
- [ ] Real-time message delivery works
- [ ] Typing indicators work
- [ ] Read receipts work
- [ ] @ mentions create notifications
- [ ] Group chat max 100 participants enforced
- [ ] Cannot chat with COMPANY role users directly
- [ ] Message pagination works

## ✅ Notifications
- [ ] Notifications created for chat mentions
- [ ] Notifications created for inquiry responses
- [ ] Notifications created for new reviews
- [ ] Notifications delivered via WebSocket
- [ ] Get unread notification count
- [ ] Mark single notification as read
- [ ] Mark all notifications as read
- [ ] Delete notifications
- [ ] Notification cleanup job works

## ✅ Inquiry System
- [ ] Create inquiry to guide/driver/company
- [ ] Send to multiple recipients (max 10)
- [ ] requiresPayment flag set for >2 recipients
- [ ] Recipients receive inquiry notifications
- [ ] Respond to inquiry (ACCEPTED/DECLINED/RESPONDED)
- [ ] Inquiry sender gets response notification
- [ ] Get sent inquiries
- [ ] Get received inquiries
- [ ] Inquiry expiration job marks old inquiries

## ✅ Search & Aggregator
- [ ] Search by location returns all categories
- [ ] Filter by category (tours/guides/drivers/companies)
- [ ] Filter by price range (tours)
- [ ] Filter by verified status
- [ ] Filter by available status
- [ ] Text search across titles/descriptions/names
- [ ] Sort by price (asc/desc)
- [ ] Sort by newest
- [ ] Location autocomplete works
- [ ] Location stats endpoint works
- [ ] Results cached in Redis (5 min TTL)
- [ ] Search completes in <500ms

## ✅ Reviews & Ratings
- [ ] Create review for tour
- [ ] Create review for guide
- [ ] Create review for driver
- [ ] Create review for company
- [ ] One review per user per entity enforced
- [ ] Email verification required to review
- [ ] Rating must be 1-5
- [ ] Comment optional (min 10 chars if provided)
- [ ] Average rating calculates correctly
- [ ] Review count updates on create
- [ ] Review count updates on delete
- [ ] Edit own review
- [ ] Cannot edit others' reviews
- [ ] Delete own review
- [ ] Review stats endpoint works
- [ ] Owner receives review notification

## ✅ WebSocket & Real-time
- [ ] WebSocket connection with JWT auth
- [ ] Connection rejected without valid token
- [ ] User marked online on connect
- [ ] User marked offline on disconnect
- [ ] Heartbeat keeps user online
- [ ] Multiple devices per user supported
- [ ] WebSocket keepalive ping/pong works
- [ ] Graceful disconnect handling

## ✅ Redis & Caching
- [ ] Redis connection established on startup
- [ ] Presence tracking (online users) works
- [ ] Search results cached
- [ ] Typing indicators stored with TTL
- [ ] Session data stored
- [ ] Cache invalidation works

## ✅ Background Jobs
- [ ] Session cleanup runs (daily)
- [ ] Typing indicator cleanup runs (every 10s)
- [ ] Notification cleanup removes old read notifications
- [ ] Inquiry expiration marks 30-day old inquiries
- [ ] Jobs can be started/stopped cleanly

## ✅ Security
- [ ] Passwords hashed with Argon2
- [ ] JWT tokens use secure secrets
- [ ] Access token expires (15 min default)
- [ ] Refresh token rotation works
- [ ] Refresh token reuse detection works
- [ ] Rate limiting prevents brute force
- [ ] Helmet security headers applied
- [ ] CORS configured correctly
- [ ] Input validation with Zod
- [ ] SQL injection prevented (Prisma parameterized)
- [ ] XSS protection via Helmet

## ✅ Performance
- [ ] Database queries use indexes
- [ ] Pagination works on all list endpoints
- [ ] No N+1 query problems
- [ ] Search <500ms average response time
- [ ] WebSocket handles 100+ concurrent connections
- [ ] Memory usage stable over time

## ✅ Error Handling
- [ ] Validation errors return 400
- [ ] Authentication errors return 401
- [ ] Authorization errors return 403
- [ ] Not found errors return 404
- [ ] Conflict errors return 409
- [ ] Rate limit errors return 429
- [ ] Server errors return 500
- [ ] Error responses follow consistent format
- [ ] Error details logged server-side
- [ ] Generic errors sent to client (no stack traces)

## ✅ Health Checks
- [ ] GET /health returns 200 when healthy
- [ ] GET /health/detailed checks all dependencies
- [ ] Database health check works
- [ ] Redis health check works
- [ ] WebSocket metrics accurate
- [ ] GET /health/metrics returns uptime and memory
- [ ] GET /health/ready for Kubernetes readiness
- [ ] GET /health/live for Kubernetes liveness

## ✅ Deployment Readiness
- [ ] Environment variables documented in .env.example
- [ ] Database migrations run successfully
- [ ] Seed data can be loaded
- [ ] Graceful shutdown handles SIGTERM
- [ ] Graceful shutdown handles SIGINT
- [ ] Logs are structured JSON
- [ ] PM2 ecosystem file configured
- [ ] README documentation complete

## 📊 Load Testing Benchmarks (Target)
- [ ] Health check: >1000 req/sec
- [ ] Search endpoint: >100 req/sec
- [ ] Auth endpoints: Rate limited correctly
- [ ] WebSocket: 500 concurrent connections
- [ ] p99 latency: <200ms for reads
- [ ] p99 latency: <500ms for writes
