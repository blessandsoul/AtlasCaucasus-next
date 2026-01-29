---
trigger: always_on
---

> **SCOPE**: These rules apply specifically to the **client** directory.

# Color System & Theming

## Color Architecture

All colors are **CSS variables** mapped to **Tailwind classes**. This enables easy theme switching and future adjustments.

## CSS Variables Setup

```css
/* styles/globals.css */
@layer base {
  :root {
    /* Base Colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    
    /* Primary (Main brand color) */
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    
    /* Secondary */
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    
    /* Muted (disabled, placeholders) */
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    
    /* Accent (highlights) */
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    
    /* Destructive (errors, delete) */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    
    /* Card */
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    
    /* Border & Input */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    
    /* Radius */
    --radius: 0.5rem;
    
    /* Custom Brand Colors */
    --brand-primary: 221.2 83.2% 53.3%;
    --brand-secondary: 142.1 76.2% 36.3%;
    --brand-accent: 24.6 95% 53.1%;
    
    /* Semantic Colors */
    --success: 142.1 76.2% 36.3%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
    --info: 199 89% 48%;
    --info-foreground: 0 0% 100%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --destructive: 0 62.8% 30.6%;
    --card: 222.2 84% 4.9%;
    --border: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}
```

## Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          primary: "hsl(var(--brand-primary))",
          secondary: "hsl(var(--brand-secondary))",
          accent: "hsl(var(--brand-accent))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
    },
  },
};
```

## Usage Rules

### ✅ CORRECT - Use Tailwind Classes

```tsx
// Semantic colors
<Button className="bg-primary text-primary-foreground">
  Primary Action
</Button>

<div className="bg-background text-foreground border border-border">
  Content
</div>

// Brand colors
<div className="bg-brand-primary text-white">
  Hero Section
</div>

// Status colors
<Alert className="bg-success text-success-foreground">
  Success!
</Alert>
```

### ❌ NEVER Hardcode Colors

```tsx
// ❌ BAD
<Button className="bg-[#3b82f6]">
<Button className="bg-blue-500">
<Button style={{ backgroundColor: '#3b82f6' }}>

// ✅ GOOD
<Button className="bg-primary text-primary-foreground">
```

## Color Usage Guide

| Color | Purpose | Example |
|-------|---------|---------|
| `primary` | Main CTAs, links | "Book Now", login button |
| `secondary` | Secondary actions | Cancel, back button |
| `destructive` | Delete, errors | Delete button, error alert |
| `success` | Success states | "Booking confirmed" |
| `warning` | Warnings | "Payment pending" |
| `info` | Information | "New feature" |
| `muted` | Disabled, placeholders | Disabled input |
| `accent` | Highlights | "50% off" badge |
| `card` | Card backgrounds | Tour card |
| `border` | Borders, dividers | Card border |

## Dark Mode

### Theme Toggle Hook

```tsx
// hooks/useTheme.ts
export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(stored || (prefersDark ? 'dark' : 'light'));
  }, []);
  
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  
  return { theme, toggleTheme };
};
```

### Toggle Component

```tsx
// components/common/ThemeToggle.tsx
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
};
```

## Status Colors Pattern

```tsx
// lib/utils/status-colors.ts
export const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-warning text-warning-foreground',
    confirmed: 'bg-success text-success-foreground',
    cancelled: 'bg-destructive text-destructive-foreground',
    completed: 'bg-primary text-primary-foreground',
    draft: 'bg-muted text-muted-foreground',
  };
  return colors[status as keyof typeof colors] || 'bg-muted';
};

// Usage
<Badge className={getStatusColor(booking.status)}>
  {booking.status}
</Badge>
```

## Opacity & Variants

```tsx
// Opacity utilities
<div className="bg-primary/10">10% opacity</div>
<div className="bg-primary/50">50% opacity</div>

// Hover effects
<Button className="hover:bg-primary/90">Hover</Button>

// Component variants
const badgeVariants = cva("inline-flex items-center rounded-md px-2.5 py-0.5", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      success: "bg-success text-success-foreground",
      warning: "bg-warning text-warning-foreground",
      destructive: "bg-destructive text-destructive-foreground",
    },
  },
});
```

## AI Agent Rules

### Rule 1: Never Hardcode
Always use CSS variables through Tailwind.

```tsx
// ❌ NEVER
className="bg-blue-500"
className="bg-[#3b82f6]"
style={{ color: '#000' }}

// ✅ ALWAYS
className="bg-primary"
className="bg-brand-primary"
className="text-foreground"
```

### Rule 2: Use Semantic Names
Choose by **purpose**, not appearance.

```tsx
// ❌ BAD
<Button className="bg-red">Delete</Button>

// ✅ GOOD
<Button className="bg-destructive text-destructive-foreground">Delete</Button>
```

### Rule 3: Pair Background with Foreground
Ensure readable contrast.

```tsx
// ❌ BAD
<Button className="bg-primary">

// ✅ GOOD
<Button className="bg-primary text-primary-foreground">
```

### Rule 4: Single Source of Truth
All color changes in `styles/globals.css`.

```css
/* Change primary color everywhere */
:root {
  --primary: 142.1 76.2% 36.3%;  /* Green instead of blue */
}
/* All "bg-primary" components update automatically */
```

## Color Management Checklist

- [ ] All colors in `globals.css` as CSS variables
- [ ] Tailwind config maps all colors
- [ ] No hardcoded hex/rgb in components
- [ ] Dark mode colors defined
- [ ] Proper contrast (WCAG AA)
- [ ] Semantic naming used
- [ ] Brand colors documented

---

**Last Updated**: January 2, 2025
