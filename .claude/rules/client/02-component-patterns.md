---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# Component Patterns & Rules

## Server vs Client Components

### Server Components (Default)
- Render on the server
- Can fetch data directly
- Can access backend resources
- NO hooks, NO browser APIs
- NO event handlers

```tsx
// Server Component (no 'use client' directive)
// app/tours/page.tsx
import { tourService } from '@/features/tours/services/tour.service';

export default async function ToursPage() {
  const tours = await tourService.getTours();

  return (
    <div>
      {tours.map(tour => (
        <TourCard key={tour.id} tour={tour} />
      ))}
    </div>
  );
}
```

### Client Components
- Render on client (and server for initial HTML)
- Can use hooks, state, effects
- Can handle browser events
- Must have `'use client'` directive

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { Tour } from '../types/tour.types';
import { cn } from '@/lib/utils';

interface TourCardProps {
  tour: Tour;
  onEdit?: (id: string) => void;
  className?: string;
}

export const TourCard = ({ tour, onEdit, className }: TourCardProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    router.push(`/tours/${tour.id}`);
  }, [router, tour.id]);

  if (!tour) return null;

  return (
    <div
      className={cn("tour-card", className)}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* JSX */}
    </div>
  );
};
```

## Component Structure Template

```tsx
'use client';

// 1. IMPORTS (grouped and ordered)
import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTours } from '../hooks/useTours';
import type { Tour } from '../types/tour.types';
import { cn } from '@/lib/utils';

// 2. TYPES (component-specific only)
interface TourCardProps {
  tour: Tour;
  onEdit?: (id: string) => void;
  className?: string;
}

// 3. COMPONENT
export const TourCard = ({ tour, onEdit, className }: TourCardProps) => {
  // 3a. HOOKS (router → Redux → React Query → state → custom)
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // 3b. EVENT HANDLERS
  const handleClick = useCallback(() => {
    router.push(`/tours/${tour.id}`);
  }, [router, tour.id]);

  // 3c. EFFECTS
  useEffect(() => {
    // Side effects
  }, []);

  // 3d. EARLY RETURNS
  if (!tour) return null;

  // 3e. RENDER
  return (
    <div className={cn("tour-card", className)} onClick={handleClick}>
      {/* JSX */}
    </div>
  );
};
```

## Component Types

### 1. Server Components (Data Fetching)
**Location**: `app/**/page.tsx`, `app/**/layout.tsx`

**Rules**:
- Default in App Router
- Can be async
- Fetch data directly
- Pass data to Client Components

```tsx
// ✅ GOOD - Server Component with data fetching
// app/tours/page.tsx
import { TourList } from '@/features/tours/components/TourList';
import { tourService } from '@/features/tours/services/tour.service';

export default async function ToursPage() {
  const { items: tours, pagination } = await tourService.getTours();

  return (
    <div>
      <h1>Tours</h1>
      <TourList tours={tours} pagination={pagination} />
    </div>
  );
}
```

### 2. Client Components (Interactive)
**Location**: `features/*/components/`, `components/`

**Rules**:
- Must have `'use client'` directive
- Use for interactivity (clicks, inputs, state)
- Keep as leaf components when possible

```tsx
'use client';

// ✅ GOOD - Client Component for interactivity
interface TourCardProps {
  tour: Tour;
  onClick: (id: string) => void;
}

export const TourCard = ({ tour, onClick }: TourCardProps) => {
  return (
    <div onClick={() => onClick(tour.id)}>
      <h3>{tour.title}</h3>
      <p>{tour.price}</p>
    </div>
  );
};
```

### 3. Layout Components
**Location**: `app/**/layout.tsx`, `components/layout/`

**Rules**:
- Define page structure
- Can be Server or Client Components
- Render children prop
- Persist across navigations

```tsx
// app/(main)/layout.tsx - Server Component
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

### 4. Page Components
**Location**: `app/**/page.tsx`

**Rules**:
- MUST be default export
- One page.tsx = One route
- Can be Server Component (preferred) or Client Component
- Handle page-level data fetching

```tsx
// ✅ GOOD - Server Component page with data fetching
// app/tours/[id]/page.tsx
import { notFound } from 'next/navigation';
import { TourDetails } from '@/features/tours/components/TourDetails';
import { tourService } from '@/features/tours/services/tour.service';

interface TourPageProps {
  params: { id: string };
}

export default async function TourPage({ params }: TourPageProps) {
  const tour = await tourService.getTour(params.id);

  if (!tour) {
    notFound();
  }

  return <TourDetails tour={tour} />;
}
```

### 5. Loading Components
**Location**: `app/**/loading.tsx`

```tsx
// app/tours/loading.tsx
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function ToursLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
```

### 6. Error Components
**Location**: `app/**/error.tsx`

```tsx
'use client';

// app/tours/error.tsx
import { Button } from '@/components/ui/button';

export default function ToursError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
```

## Component Size Rules

### Limits
- **Max 250 lines** per component
- **Max 5 props** (use object if more)
- **Max 3 levels** of JSX nesting

### When to Split

Split when:
1. Component exceeds 250 lines
2. JSX nesting exceeds 3 levels
3. Multiple responsibilities
4. Part is reusable elsewhere

```tsx
// ❌ BAD - Too large
export default async function TourDetailsPage() {
  // 300 lines handling everything
  return <div>{/* 200 lines of JSX */}</div>;
}

// ✅ GOOD - Split into focused components
export default async function TourDetailsPage({ params }: Props) {
  const tour = await tourService.getTour(params.id);

  return (
    <div>
      <TourHeader tour={tour} />
      <TourContent tour={tour} />
      <TourBooking tour={tour} />
      <TourReviews tourId={tour.id} />
    </div>
  );
}
```

## Props Rules

### Props Interface

```tsx
// ✅ GOOD - Props object
interface TourCardProps {
  tour: Tour;
  onEdit?: (id: string) => void;
  className?: string;
}

// ❌ BAD - Too many props
interface TourCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  // ... 10+ props
}

// ✅ GOOD - Group related props
interface TourCardProps {
  tour: Tour;
  actions?: TourActions;
  className?: string;
}
```

## Event Handlers

### Naming
- Component handlers: `handle<Event>` → `handleClick`, `handleSubmit`
- Prop callbacks: `on<Event>` → `onClick`, `onSubmit`

### Rules

```tsx
'use client';

// ✅ GOOD - With useCallback for passed handlers
const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
  onClick(id);
}, [id, onClick]);

// ✅ GOOD - Typed event
const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  onSubmit(formData);
}, [formData, onSubmit]);
```

## Conditional Rendering

```tsx
// ✅ GOOD - Early returns
export const TourCard = ({ tour }: TourCardProps) => {
  if (!tour) return null;
  if (tour.isDeleted) return <DeletedCard />;

  return <div>{tour.title}</div>;
};

// ✅ GOOD - Ternary for simple condition
{isEditing ? <EditForm /> : <ViewMode />}

// ✅ GOOD - && for optional
{user && <WelcomeMessage user={user} />}

// ✅ GOOD - Extract complex condition
const shouldShowActions = isOwner && !isDeleted && !isLocked;
{shouldShowActions && <ActionButtons />}

// ❌ BAD - Nested ternary
{isLoading ? <Spinner /> : error ? <Error /> : tours.length > 0 ? <List /> : <Empty />}
```

## Using Next.js Components

### Image Optimization
```tsx
import Image from 'next/image';

// ✅ GOOD - Optimized images
<Image
  src={tour.imageUrl}
  alt={tour.title}
  width={400}
  height={300}
  className="object-cover rounded-lg"
/>

// For remote images, configure next.config.js
```

### Link Navigation
```tsx
import Link from 'next/link';

// ✅ GOOD - Client-side navigation
<Link href={`/tours/${tour.id}`} className="hover:underline">
  {tour.title}
</Link>

// With dynamic routes
<Link href={{ pathname: '/tours/[id]', query: { id: tour.id } }}>
  View Tour
</Link>
```

## Styling Rules

### Tailwind CSS

```tsx
// ❌ BAD - Inline styles
<div style={{ padding: '1rem' }}>

// ❌ BAD - Hardcoded colors
<div className="bg-blue-500">

// ✅ GOOD - Tailwind + theme + responsive
<div className="p-4 bg-background text-foreground md:p-6">

// ✅ GOOD - Conditional with cn()
<Button
  className={cn(
    "w-full",
    isLoading && "opacity-50 cursor-not-allowed",
    variant === "primary" && "bg-primary"
  )}
/>
```

## Performance Optimization

### React.memo (Client Components only)

```tsx
'use client';

// ✅ Use for components in lists
export const TourCard = React.memo(({ tour }: TourCardProps) => {
  return <div>{tour.title}</div>;
});

TourCard.displayName = 'TourCard';
```

### useMemo (Client Components only)

```tsx
'use client';

// ✅ For expensive computations
const filteredTours = useMemo(() => {
  return tours.filter(t => t.city === selectedCity);
}, [tours, selectedCity]);
```

## Accessibility Rules

```tsx
// ✅ GOOD - Accessible
<button
  type="button"
  onClick={handleDelete}
  aria-label="Delete tour"
>
  <TrashIcon className="w-4 h-4" />
</button>

// ✅ GOOD - Form accessibility
<Input
  id="email"
  type="email"
  {...register('email')}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
```

## Common Anti-Patterns

### ❌ Using Client Component when Server Component suffices
```tsx
// BAD - Unnecessary 'use client'
'use client';
export const TourCard = ({ tour }: Props) => {
  return <div>{tour.title}</div>; // No interactivity needed
};

// ✅ GOOD - Server Component
export const TourCard = ({ tour }: Props) => {
  return <div>{tour.title}</div>;
};
```

### ❌ Fetching data in Client Components when possible in Server
```tsx
// BAD - Client-side fetching
'use client';
export const ToursPage = () => {
  const { data: tours } = useTours();
  return <TourList tours={tours} />;
};

// ✅ GOOD - Server-side fetching
export default async function ToursPage() {
  const tours = await tourService.getTours();
  return <TourList tours={tours} />;
}
```

## Component Checklist

- [ ] Correct component type (Server vs Client)
- [ ] Under 250 lines
- [ ] Props interface defined (max 5)
- [ ] Event handlers use useCallback (Client Components)
- [ ] Expensive computations use useMemo (Client Components)
- [ ] Early returns for error/loading
- [ ] Tailwind classes (no inline styles)
- [ ] Accessibility attributes
- [ ] Using Next.js Image and Link components

---

**Last Updated**: January 2025
