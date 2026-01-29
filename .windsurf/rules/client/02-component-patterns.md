---
trigger: always_on
---

> **SCOPE**: These rules apply specifically to the **client** directory.

# Component Patterns & Rules

## Component Structure Template

```tsx
// 1. IMPORTS (grouped and ordered)
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTours } from '../hooks/useTours';
import type { Tour } from '../types/tour.types';
import { cn } from '@/lib/cn';

// 2. TYPES (component-specific only)
interface TourCardProps {
  tour: Tour;
  onEdit?: (id: string) => void;
  className?: string;
}

// 3. COMPONENT
export const TourCard = ({ tour, onEdit, className }: TourCardProps) => {
  // 3a. HOOKS (router → Redux → React Query → state → custom)
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  // 3b. EVENT HANDLERS
  const handleClick = useCallback(() => {
    navigate(`/tours/${tour.id}`);
  }, [navigate, tour.id]);
  
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

### 1. Presentational Components
**Location**: `components/common/` or `features/*/components/`

**Rules**:
- NO business logic
- NO API calls
- NO Redux/Context (except theme)
- Receive ALL data via props
- Focus ONLY on UI

```tsx
// ✅ GOOD - Pure presentation
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

// ❌ BAD - Contains business logic
export const TourCard = ({ tourId }: { tourId: string }) => {
  const { data: tour } = useTour(tourId); // API call
  const { user } = useAuth(); // Auth logic
  return <div>{tour.title}</div>;
};
```

### 2. Container Components
**Location**: `features/*/pages/` or `features/*/components/`

**Rules**:
- Contains business logic
- Makes API calls via hooks
- Manages state
- Passes data to presentational components

```tsx
// ✅ GOOD - Container component
export const ToursPage = () => {
  const [filters, setFilters] = useState<TourFilters>({});
  const { tours, isLoading } = useTours(filters);
  const navigate = useNavigate();
  
  const handleTourClick = (id: string) => {
    navigate(`/tours/${id}`);
  };
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      <TourFilters value={filters} onChange={setFilters} />
      {tours.map(tour => (
        <TourCard key={tour.id} tour={tour} onClick={handleTourClick} />
      ))}
    </div>
  );
};
```

### 3. Layout Components
**Location**: `components/layout/`

**Rules**:
- Define page structure
- NO business logic
- Can use global state (theme, auth status)
- Render children prop

```tsx
// ✅ GOOD - Layout component
export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={isAuthenticated} />
      <main className="flex-1 container mx-auto py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
```

### 4. Page Components
**Location**: `features/*/pages/`

**Rules**:
- One page = One route
- Always end with `Page` suffix
- Can be container components
- Handle page-level state

```tsx
// ✅ GOOD - Page component
export const TourDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { tour, isLoading, error } = useTour(id!);
  
  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage error={error} />;
  if (!tour) return <NotFoundPage />;
  
  return (
    <div>
      <TourHeader tour={tour} />
      <TourContent tour={tour} />
    </div>
  );
};
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
export const TourDetailsPage = () => {
  // 300 lines handling everything
  return <div>{/* 200 lines of JSX */}</div>;
};

// ✅ GOOD - Split into focused components
export const TourDetailsPage = () => {
  const { tour } = useTour(id!);
  
  return (
    <div>
      <TourHeader tour={tour} />
      <TourContent tour={tour} />
      <TourBooking tour={tour} />
      <TourReviews tourId={tour.id} />
    </div>
  );
};
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
  currency: string;
  city: string;
  duration: number;
  maxPeople: number;
  // ... 10+ props
}

// ✅ GOOD - Group related props
interface TourCardProps {
  tour: Tour;
  actions?: TourActions;
  className?: string;
}
```

### Children Prop

```tsx
interface CardProps {
  children: React.ReactNode;
  title?: string;
}

export const Card = ({ children, title }: CardProps) => {
  return (
    <div className="card">
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
};
```

## Event Handlers

### Naming
- Component handlers: `handle<Event>` → `handleClick`, `handleSubmit`
- Prop callbacks: `on<Event>` → `onClick`, `onSubmit`

### Rules

```tsx
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

// ❌ BAD - No useCallback
const handleClick = (e) => {
  onClick(id);
};
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

### React.memo

```tsx
// ✅ Use for components in lists
export const TourCard = React.memo(({ tour }: TourCardProps) => {
  return <div>{tour.title}</div>;
});

TourCard.displayName = 'TourCard';
```

### useMemo

```tsx
// ✅ For expensive computations
const filteredTours = useMemo(() => {
  return tours.filter(t => t.city === selectedCity);
}, [tours, selectedCity]);
```

### useCallback

```tsx
// ✅ For handlers passed to children
const handleClick = useCallback((id: string) => {
  navigate(`/tours/${id}`);
}, [navigate]);

<TourCard tour={tour} onClick={handleClick} />
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
{errors.email && (
  <p id="email-error" className="text-destructive">
    {errors.email.message}
  </p>
)}
```

## Common Anti-Patterns

### ❌ God Components
```tsx
// BAD - Does everything
export const DashboardPage = () => {
  // 500 lines handling auth, tours, bookings, profile
};

// ✅ GOOD
export const DashboardPage = () => {
  return (
    <div>
      <DashboardHeader />
      <DashboardStats />
      <RecentTours />
      <RecentBookings />
    </div>
  );
};
```

### ❌ Prop Drilling
```tsx
// BAD - 5 levels deep
<Parent user={user}>
  <Child1 user={user}>
    <Child2 user={user}>
      <Child3 user={user} />
    </Child2>
  </Child1>
</Parent>

// ✅ GOOD - Use context/Redux
const { user } = useAuth();
```

### ❌ Derived State
```tsx
// BAD
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${first} ${last}`);
}, [first, last]);

// ✅ GOOD
const fullName = `${first} ${last}`;
```

## Component Checklist

- [ ] Under 250 lines
- [ ] Props interface defined (max 5)
- [ ] Event handlers use useCallback
- [ ] Expensive computations use useMemo
- [ ] Early returns for error/loading
- [ ] Tailwind classes (no inline styles)
- [ ] Accessibility attributes
- [ ] Named export (not default)

---

**Last Updated**: January 2, 2025
