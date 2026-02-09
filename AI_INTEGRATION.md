# AI Text Generation Integration Plan

## Context

Service providers (companies, guides, drivers) on AtlasCaucasus need professional content for their listings but often can't afford copywriters. This plan adds an **AI Studio** to the dashboard powered by **Google Gemini 2.5 Flash**, allowing providers to generate tour descriptions, itineraries, marketing copy, and blog content using a credit-based system. Everything runs in the existing Fastify server via the `@google/genai` Node.js SDK — no separate Python service needed.

---

## Phase 1: Database Schema

**File: `server/prisma/schema.prisma`**

Add 3 new enums and 3 new models:

```prisma
enum AiGenerationStatus { PENDING  COMPLETED  FAILED }
enum AiGenerationType   { TOUR_DESCRIPTION  TOUR_ITINERARY  MARKETING_COPY  BLOG_CONTENT }
enum CreditTransactionType { INITIAL_GRANT  GENERATION_DEBIT  GENERATION_REFUND  ADMIN_GRANT  PURCHASE }
```

**CreditBalance** — one per user, tracks current balance:
- `id`, `userId` (unique), `balance` (default 0), timestamps
- Relation: `user User` with `onDelete: Cascade`
- Map to `credit_balances`

**CreditTransaction** — audit log of every credit change:
- `id`, `userId`, `amount` (+ for grants, - for debits), `type` (CreditTransactionType), `description`, `metadata` (JSON text), `balanceAfter`, `createdAt`
- Indexes: `[userId, createdAt]`, `[type]`
- Map to `credit_transactions`

**AiGeneration** — logs every AI generation:
- `id`, `userId`, `type` (AiGenerationType), `templateId`, `prompt` (Text), `userInputs` (Text/JSON), `result` (LongText, nullable), `status` (AiGenerationStatus), `creditCost`, `errorMessage` (nullable), `metadata` (Text/JSON, nullable), timestamps
- Indexes: `[userId, createdAt]`, `[status]`, `[type]`
- Map to `ai_generations`

**User model** — add 3 new relations:
```prisma
creditBalance      CreditBalance?
creditTransactions CreditTransaction[] @relation("UserCreditTransactions")
aiGenerations      AiGeneration[]      @relation("UserAiGenerations")
```

**Run migration:** `npm run prisma:migrate dev -- --name add_ai_credits_and_generations`

---

## Phase 2: Server — Environment & Gemini Client

### 2a. Install dependency
```bash
cd server && npm install @google/genai
```

### 2b. Modify `server/src/config/env.ts`
Add to `envSchema`:
```typescript
GEMINI_API_KEY: z.string().min(1).optional(),
GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
AI_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
AI_INITIAL_CREDITS: z.coerce.number().int().min(0).default(10),
```

### 2c. Modify `server/.env.example`
Add Gemini config section with `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_RATE_LIMIT_PER_MINUTE`, `AI_INITIAL_CREDITS`.

### 2d. Create `server/src/libs/gemini.ts`
Singleton pattern (like `redis.ts`):
- `getGeminiClient(): GoogleGenAI` — lazy-inits with `env.GEMINI_API_KEY`
- `isGeminiConfigured(): boolean` — checks if key exists

---

## Phase 3: Server — Credits Module

**New directory: `server/src/modules/credits/`**

### Files:

| File | Responsibility |
|------|----------------|
| `credit.types.ts` | `SafeCreditBalance`, `SafeCreditTransaction` interfaces |
| `credit.repo.ts` | Prisma queries: `getOrCreateBalance` (upsert with initial credits), `deductCredits` (atomic via `$transaction` — read balance, verify sufficient, decrement, create transaction), `refundCredits`, `grantCredits`, `listTransactions`, `countTransactions` |
| `credit.service.ts` | `getCreditBalance`, `getCreditHistory`, `reserveCredits` (deduct before generation), `refundCredits` (on failure), `adminGrantCredits` (asserts admin role) |
| `credit.schemas.ts` | `adminGrantCreditsSchema` (Zod) |
| `credit.controller.ts` | `getMyBalanceHandler`, `getMyHistoryHandler`, `adminGrantCreditsHandler` — all use `successResponse`/`paginatedResponse` |
| `credit.routes.ts` | `GET /credits/balance` (auth+verified), `GET /credits/history` (auth+verified), `POST /credits/grant` (admin only) |

**Key pattern — atomic credit deduction:**
```typescript
// Inside prisma.$transaction:
// 1. Read balance → 2. Verify >= amount → 3. Decrement → 4. Create transaction record
// Throws BadRequestError('Insufficient credits', 'INSUFFICIENT_CREDITS') if insufficient
```

---

## Phase 4: Server — AI Generation Module

**New directory: `server/src/modules/ai/`**

### Files:

| File | Responsibility |
|------|----------------|
| `ai.types.ts` | `SafeAiGeneration`, `GenerateResult`, `AiTemplate`, `TemplateField` interfaces |
| `ai.templates.ts` | Template definitions as code constants + `getTemplate()`, `getAllTemplates()`, `buildPrompt()` helpers |
| `ai.repo.ts` | `createGeneration`, `updateGeneration`, `getGeneration`, `listGenerationsByUser`, `countGenerationsByUser` |
| `ai.schemas.ts` | `generateContentSchema`, `listGenerationsQuerySchema`, `applyToTourSchema` (Zod) |
| `ai.service.ts` | Core logic: `generateContent` (non-streaming), `generateContentStream` (AsyncGenerator for SSE), `getGenerationHistory`, `getGenerationById`, `applyToTour` |
| `ai.controller.ts` | HTTP handlers for all endpoints |
| `ai.routes.ts` | Route registration as Fastify plugin |

### Prompt Templates (4 templates, code constants):

**1. `tour-description`** (2 credits)
- Required fields: `tourTitle`, `tourType` (select), `locations`, `duration`
- Optional: `highlights`, `targetAudience`, `tone` (select: professional/casual/adventurous/luxurious)
- System prompt: SEO-friendly tourism content, Caucasus expertise, sensory language
- Max output: 1000 tokens

**2. `tour-itinerary`** (5 credits)
- Required: `tourTitle`, `locations`, `durationDays` (number), `tourType`
- Optional: `includeMeals`, `activityLevel`, `specialInterests`
- Output: JSON array of `{ title, description }` matching Tour's `itinerary` field schema
- Max output: 3000 tokens

**3. `marketing-social`** (2 credits)
- Required: `tourTitle`, `platform` (select: instagram/facebook/twitter/general), `keyFeatures`
- Optional: `callToAction`, `hashtags`, `tone`
- Platform-appropriate copy with emojis/hashtags/character limits
- Max output: 500 tokens

**4. `blog-post`** (5 credits)
- Required: `topic`, `targetLength` (select: short/medium/long)
- Optional: `keywords`, `tone`, `targetAudience`, `outline`
- SEO-optimized blog content about Caucasus tourism
- Max output: 4000 tokens

### Generation Flow (service layer):

1. Validate template exists + required fields provided
2. Check `isGeminiConfigured()`
3. Create `AiGeneration` record (PENDING)
4. **Reserve credits** (deduct atomically) — refund on failure
5. Build prompt from template + user inputs via `buildPrompt()`
6. Call Gemini API (`ai.models.generateContent` or `generateContentStream`)
7. On success: update generation record (COMPLETED), return result
8. On failure: **refund credits**, update generation record (FAILED), throw `InternalError`

### SSE Streaming (controller):

```typescript
// POST /ai/generate/stream handler:
reply.raw.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
});

// Service yields chunks via AsyncGenerator
for await (const chunk of generateContentStream(user, data)) {
  reply.raw.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
}
reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
reply.raw.end();
```

### API Endpoints:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/ai/templates` | None | List all prompt templates |
| `POST` | `/api/v1/ai/generate` | Provider+Verified | Generate content (non-streaming) |
| `POST` | `/api/v1/ai/generate/stream` | Provider+Verified | Generate content (SSE streaming) |
| `GET` | `/api/v1/ai/generations` | Provider+Verified | List generation history (paginated) |
| `GET` | `/api/v1/ai/generations/:id` | Provider+Verified | Get single generation |
| `POST` | `/api/v1/ai/apply-to-tour` | Provider+Verified | Apply generated content to tour field |
| `GET` | `/api/v1/credits/balance` | Auth+Verified | Get credit balance |
| `GET` | `/api/v1/credits/history` | Auth+Verified | Credit transaction history (paginated) |
| `POST` | `/api/v1/credits/grant` | Admin | Grant credits to a user |

Provider roles: `COMPANY`, `GUIDE`, `DRIVER`, `ADMIN`

### Register routes in `server/src/app.ts`:
```typescript
import { creditRoutes } from "./modules/credits/credit.routes.js";
import { aiRoutes } from "./modules/ai/ai.routes.js";
// ...
app.register(creditRoutes, { prefix: "/api/v1" });
app.register(aiRoutes, { prefix: "/api/v1" });
```

---

## Phase 5: Server — Initial Credits on Registration

**Modify `server/src/modules/auth/auth.service.ts`:**

After successful user creation in the `register` function, call `getOrCreateBalance(newUser.id)` to give every new user 10 free credits.

---

## Phase 6: Client — Constants

### Modify `client/src/lib/constants/api-endpoints.ts`:
```typescript
AI: {
  TEMPLATES: '/ai/templates',
  GENERATE: '/ai/generate',
  GENERATE_STREAM: '/ai/generate/stream',
  GENERATIONS: '/ai/generations',
  GENERATION: (id: string) => `/ai/generations/${id}`,
  APPLY_TO_TOUR: '/ai/apply-to-tour',
},
CREDITS: {
  BALANCE: '/credits/balance',
  HISTORY: '/credits/history',
},
```

### Modify `client/src/lib/constants/routes.ts`:
```typescript
AI_STUDIO: '/dashboard/ai-studio',
```

---

## Phase 7: Client — AI Feature Module

**New directory: `client/src/features/ai/`**

### Types (`types/ai.types.ts`):
- `AiTemplate`, `TemplateField`, `CreditBalance`, `CreditTransaction`, `AiGeneration`, `GenerateRequest`, `GenerateResult`
- SSE event types: `SSEChunkEvent`, `SSEDoneEvent`, `SSEErrorEvent`

### Service (`services/ai.service.ts`):
- Standard methods via `apiClient`: `getTemplates`, `generate`, `getBalance`, `getCreditHistory`, `getGenerations`, `getGeneration`, `applyToTour`
- **Streaming method via native `fetch`** (axios doesn't support ReadableStream): `generateStream(data, onChunk, onDone, onError)` — reads SSE manually from `response.body`, parses `data:` lines, dispatches to callbacks. Gets auth token from Redux store.

### Hooks (`hooks/useAiStudio.ts`):
Query key factory pattern:
```typescript
export const aiKeys = {
  all: ['ai'] as const,
  templates: () => [...aiKeys.all, 'templates'] as const,
  balance: () => [...aiKeys.all, 'balance'] as const,
  creditHistory: (params) => [...aiKeys.all, 'creditHistory', params] as const,
  generations: (params) => [...aiKeys.all, 'generations', params] as const,
  generation: (id) => [...aiKeys.all, 'generation', id] as const,
};
```

Hooks: `useAiTemplates` (staleTime: 30min), `useCreditBalance` (staleTime: 1min), `useCreditHistory`, `useAiGenerations`, `useAiGeneration`, `useGenerate` (mutation, invalidates balance + generations), `useApplyToTour` (mutation, invalidates tour queries)

### Components:

| Component | Description |
|-----------|-------------|
| `AiStudioPage.tsx` | Main page: header, credit balance card, tabs (Generate / History) |
| `CreditBalance.tsx` | Displays current balance with coin icon, links to credit history |
| `TemplateGrid.tsx` | Grid of 4 template cards |
| `TemplateCard.tsx` | Card per template: icon (Map/Calendar/Megaphone/FileText), name, description, credit cost badge |
| `GenerationForm.tsx` | Dynamic form from template fields. React Hook Form + Zod (schema built dynamically). Submit shows credit cost. Disabled during streaming |
| `StreamingOutput.tsx` | Real-time text output. Accumulates chunks. Blinking cursor while streaming. Copy button + "Apply to Tour" button after completion |
| `GenerationHistory.tsx` | Paginated list of past generations with status badges |
| `GenerationHistoryItem.tsx` | Single row: template name, status, date, credit cost, "View" link |
| `GenerationDetail.tsx` | Full view of past generation result with copy + apply buttons |
| `ApplyToTourDialog.tsx` | Dialog: select tour from user's tours, select field (description/summary/itinerary), confirm |
| `CreditHistoryDialog.tsx` | Dialog: paginated list of credit transactions |

---

## Phase 8: Client — Dashboard Integration

### Create `client/src/app/dashboard/ai-studio/page.tsx`:
```typescript
'use client';
import { AiStudioPage } from '@/features/ai/components/AiStudioPage';
export default function Page() { return <AiStudioPage />; }
```

### Modify `client/src/components/layout/DashboardSidebar.tsx`:
Add `Sparkles` import from `lucide-react`. Add new sidebar item in the **Management group** (after Analytics, line ~178), same role check pattern as Analytics:

```tsx
{(user?.roles?.includes('COMPANY') ||
  user?.roles?.includes('GUIDE') ||
  user?.roles?.includes('DRIVER') ||
  user?.roles?.includes('ADMIN')) && (
  <SidebarItem
    icon={Sparkles}
    label={t('ai.studio_title', 'AI Studio')}
    href={ROUTES.AI_STUDIO}
    isActive={pathname === ROUTES.AI_STUDIO}
    onClick={onItemClick}
  />
)}
```

---

## Phase 9: Client — i18n Translations

### Modify all 3 translation files (`en`, `ka`, `ru`):

Add `"ai"` key with: `studio_title`, `studio_description`, `credits`, `credits_remaining`, `generate`, `generating`, `generate_cost`, `copy`, `copied`, `apply_to_tour`, `apply_success`, `select_template`, `templates`, `history`, `no_generations`, `insufficient_credits`, `generation_failed`, `view_result`, `credit_history`

Nested keys for templates (`template.tour_description`, etc.) and form fields (`field.tour_title`, etc.) and statuses (`status.pending`, etc.)

English first, then Georgian and Russian translations.

---

## Key Design Decisions

1. **Credits deducted BEFORE generation, refunded on failure** — prevents abuse from concurrent requests. Atomic via Prisma `$transaction`.
2. **SSE over WebSocket** for streaming — simpler for unidirectional text, works through standard HTTP, no new infra needed.
3. **Templates as code constants** — type-safe, version-controlled, no migration needed to iterate. Can move to DB later if admin UI is needed.
4. **Native `fetch` for SSE on client** — axios doesn't support `ReadableStream`. Only the streaming endpoint uses `fetch`; everything else uses `apiClient`.
5. **Separate streaming and non-streaming endpoints** — non-streaming useful for programmatic use and testing.

---

## Files to Create

| # | File | Phase |
|---|------|-------|
| 1 | `server/src/libs/gemini.ts` | 2 |
| 2 | `server/src/modules/credits/credit.types.ts` | 3 |
| 3 | `server/src/modules/credits/credit.repo.ts` | 3 |
| 4 | `server/src/modules/credits/credit.service.ts` | 3 |
| 5 | `server/src/modules/credits/credit.schemas.ts` | 3 |
| 6 | `server/src/modules/credits/credit.controller.ts` | 3 |
| 7 | `server/src/modules/credits/credit.routes.ts` | 3 |
| 8 | `server/src/modules/ai/ai.types.ts` | 4 |
| 9 | `server/src/modules/ai/ai.templates.ts` | 4 |
| 10 | `server/src/modules/ai/ai.repo.ts` | 4 |
| 11 | `server/src/modules/ai/ai.schemas.ts` | 4 |
| 12 | `server/src/modules/ai/ai.service.ts` | 4 |
| 13 | `server/src/modules/ai/ai.controller.ts` | 4 |
| 14 | `server/src/modules/ai/ai.routes.ts` | 4 |
| 15 | `client/src/features/ai/types/ai.types.ts` | 7 |
| 16 | `client/src/features/ai/services/ai.service.ts` | 7 |
| 17 | `client/src/features/ai/hooks/useAiStudio.ts` | 7 |
| 18 | `client/src/features/ai/components/AiStudioPage.tsx` | 7 |
| 19 | `client/src/features/ai/components/CreditBalance.tsx` | 7 |
| 20 | `client/src/features/ai/components/TemplateGrid.tsx` | 7 |
| 21 | `client/src/features/ai/components/TemplateCard.tsx` | 7 |
| 22 | `client/src/features/ai/components/GenerationForm.tsx` | 7 |
| 23 | `client/src/features/ai/components/StreamingOutput.tsx` | 7 |
| 24 | `client/src/features/ai/components/GenerationHistory.tsx` | 7 |
| 25 | `client/src/features/ai/components/GenerationHistoryItem.tsx` | 7 |
| 26 | `client/src/features/ai/components/GenerationDetail.tsx` | 7 |
| 27 | `client/src/features/ai/components/ApplyToTourDialog.tsx` | 7 |
| 28 | `client/src/features/ai/components/CreditHistoryDialog.tsx` | 7 |
| 29 | `client/src/app/dashboard/ai-studio/page.tsx` | 8 |

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `server/prisma/schema.prisma` | Add 3 enums, 3 models, 3 User relations |
| 2 | `server/src/config/env.ts` | Add Gemini env vars |
| 3 | `server/.env.example` | Add Gemini config section |
| 4 | `server/src/app.ts` | Import + register `creditRoutes` and `aiRoutes` |
| 5 | `server/src/modules/auth/auth.service.ts` | Grant initial credits after registration |
| 6 | `client/src/lib/constants/api-endpoints.ts` | Add `AI` and `CREDITS` endpoint groups |
| 7 | `client/src/lib/constants/routes.ts` | Add `AI_STUDIO` route |
| 8 | `client/src/components/layout/DashboardSidebar.tsx` | Add AI Studio sidebar item with `Sparkles` icon |
| 9 | `client/src/locales/en/translation.json` | Add `ai` translation keys |
| 10 | `client/src/locales/ka/translation.json` | Add `ai` translation keys (Georgian) |
| 11 | `client/src/locales/ru/translation.json` | Add `ai` translation keys (Russian) |

## Existing Code to Reuse

| What | File Path |
|------|-----------|
| `successResponse`, `paginatedResponse`, `errorResponse` | `server/src/libs/response.ts` |
| `AppError` subclasses (`BadRequestError`, `ValidationError`, etc.) | `server/src/libs/errors.ts` |
| `PaginationSchema`, `calculateOffset`, `buildPaginationMetadata` | `server/src/libs/pagination.ts` |
| `authGuard`, `requireRole`, `requireVerifiedEmail` | `server/src/middlewares/authGuard.ts` |
| `validateUuidParam` | `server/src/libs/validation.ts` |
| `logger` | `server/src/libs/logger.ts` |
| `prisma` | `server/src/libs/prisma.ts` |
| `env` | `server/src/config/env.ts` |
| `apiClient` | `client/src/lib/api/axios.config.ts` |
| `getErrorMessage` | `client/src/lib/utils/error.ts` |
| `cn` | `client/src/lib/utils.ts` |
| `store` (Redux) | `client/src/store/index.ts` |
| `useAuth` | `client/src/features/auth/hooks/useAuth.ts` |
| Tour hooks (`useMyTours`) | `client/src/features/tours/hooks/useTours.ts` |

---

## Verification

### Server:
1. `cd server && npm run build` — compiles without errors
2. `npx prisma migrate dev` — migration applies cleanly
3. `GET /api/v1/credits/balance` → returns 10 credits for new user
4. `GET /api/v1/ai/templates` → returns 4 templates with correct fields
5. `POST /api/v1/ai/generate` with valid template/inputs → returns generated text, credits deducted
6. `POST /api/v1/ai/generate/stream` via `curl --no-buffer` → SSE chunks arrive incrementally, ends with `done` event
7. Test insufficient credits → 400 `INSUFFICIENT_CREDITS`
8. Test invalid template → 404 `TEMPLATE_NOT_FOUND`
9. Test non-provider role → 403 `FORBIDDEN`
10. `POST /api/v1/ai/apply-to-tour` → updates tour's description/itinerary field

### Client:
1. `cd client && npm run build` — compiles without errors
2. Login as provider → see "AI Studio" in sidebar
3. Login as USER → do NOT see "AI Studio" in sidebar
4. Navigate to `/dashboard/ai-studio` → credit balance displays, 4 template cards render
5. Select template → form renders with correct fields
6. Fill form, click generate → text streams in real-time with blinking cursor
7. Copy button → copies text to clipboard
8. "Apply to Tour" → dialog shows user's tours, applying updates the tour
9. History tab → shows past generations with statuses
10. Verify all 3 languages render correctly
