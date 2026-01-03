# 🎨 MalikTech UI/UX Design System

> **Version:** 2.0 | **Updated:** January 2026  
> **Framework:** Next.js 15 + React 19 + Tailwind CSS v4 + shadcn/ui (New York Style)  
> **Author:** MalikTech

This document serves as the complete reference guide for the UI/UX design patterns used in MalikTech Dairy. Use this as a template for all future projects to maintain consistent, modern, and beautiful user interfaces.

---

## 📋 Table of Contents

1. [Design Philosophy](#-design-philosophy)
2. [Tech Stack](#-tech-stack)
3. [Color System](#-color-system)
4. [Typography](#-typography)
5. [Spacing & Layout](#-spacing--layout)
6. [Component Library](#-component-library)
7. [Animation System](#-animation-system)
8. [Glassmorphism & Effects](#-glassmorphism--effects)
9. [Dark Mode](#-dark-mode)
10. [Loading States](#-loading-states)
11. [Empty States](#-empty-states)
12. [Icons](#-icons)
13. [Responsive Design](#-responsive-design)
14. [Accessibility](#-accessibility)
15. [Code Snippets](#-code-snippets)

---

## 🎯 Design Philosophy

### Core Principles

1. **Modern & Clean** - Minimalist design with generous whitespace
2. **Glassmorphism** - Frosted glass effects for depth and elegance
3. **Micro-interactions** - Subtle animations for delightful UX
4. **Accessibility First** - WCAG 2.1 AA compliant
5. **Mobile-First** - Responsive design starting from mobile
6. **Performance** - Optimized animations that don't sacrifice speed

### Design Goals

- **Professional yet Friendly** - Business-grade UI with approachable aesthetics
- **Consistent** - Unified design language across all pages
- **Intuitive** - Users should understand the interface immediately
- **Delightful** - Small moments of joy through animations and interactions

---

## 🛠 Tech Stack

### Dependencies

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "tailwindcss": "^4.x",
    "@radix-ui/react-*": "latest",
    "framer-motion": "^11.x",
    "lucide-react": "latest",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  }
}
```

### Configuration Files

**components.json** (shadcn/ui config):

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Utility Function

**lib/utils.ts**:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 🎨 Color System

### Modern OKLCH Color Palette

We use **OKLCH** color space for more perceptually uniform colors with better contrast ratios.

#### Light Mode

```css
:root {
  --radius: 1rem;

  /* Base Colors */
  --background: oklch(0.99 0.005 200);
  --foreground: oklch(0.12 0.02 260);

  /* Card & Surfaces */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.12 0.02 260);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.12 0.02 260);

  /* Primary - Vivid Emerald */
  --primary: oklch(0.6 0.16 155);
  --primary-foreground: oklch(0.99 0 0);

  /* Secondary */
  --secondary: oklch(0.96 0.01 155);
  --secondary-foreground: oklch(0.3 0.05 155);

  /* Muted */
  --muted: oklch(0.97 0.005 200);
  --muted-foreground: oklch(0.55 0.02 260);

  /* Accent */
  --accent: oklch(0.97 0.02 155);
  --accent-foreground: oklch(0.3 0.05 155);

  /* Destructive */
  --destructive: oklch(0.6 0.2 25);
  --destructive-foreground: oklch(0.99 0 0);

  /* Borders & Inputs */
  --border: oklch(0.94 0.01 200);
  --input: oklch(0.94 0.01 200);
  --ring: oklch(0.6 0.16 155 / 0.5);

  /* Charts */
  --chart-1: oklch(0.65 0.2 150);
  --chart-2: oklch(0.6 0.15 180);
  --chart-3: oklch(0.55 0.1 220);
  --chart-4: oklch(0.7 0.15 80);
  --chart-5: oklch(0.7 0.15 60);

  /* Sidebar */
  --sidebar: oklch(0.99 0.005 200);
  --sidebar-foreground: oklch(0.12 0.02 260);
  --sidebar-primary: oklch(0.6 0.16 155);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.97 0.02 155);
  --sidebar-accent-foreground: oklch(0.3 0.05 155);
  --sidebar-border: oklch(0.94 0.01 200);
  --sidebar-ring: oklch(0.6 0.16 155 / 0.5);

  /* Glassmorphism */
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  --glass-blur: blur(16px);
}
```

#### Dark Mode

```css
.dark {
  --background: oklch(0.12 0.02 260);
  --foreground: oklch(0.99 0.005 200);

  --card: oklch(0.15 0.02 260);
  --card-foreground: oklch(0.99 0.005 200);

  --popover: oklch(0.15 0.02 260);
  --popover-foreground: oklch(0.99 0.005 200);

  /* Neon/Bright Emerald for Dark Mode */
  --primary: oklch(0.7 0.15 155);
  --primary-foreground: oklch(0.1 0.05 155);

  --secondary: oklch(0.2 0.03 260);
  --secondary-foreground: oklch(0.99 0.005 200);

  --muted: oklch(0.2 0.03 260);
  --muted-foreground: oklch(0.7 0.02 260);

  --accent: oklch(0.2 0.05 155);
  --accent-foreground: oklch(0.99 0.005 200);

  --destructive: oklch(0.5 0.2 25);
  --destructive-foreground: oklch(0.99 0 0);

  --border: oklch(0.25 0.02 260);
  --input: oklch(0.25 0.02 260);
  --ring: oklch(0.7 0.15 155 / 0.5);

  /* Dark Glassmorphism */
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-bg: rgba(20, 20, 30, 0.6);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
}
```

### Color Usage Guidelines

| Purpose         | Variable             | Usage                         |
| --------------- | -------------------- | ----------------------------- |
| Primary Actions | `--primary`          | Buttons, links, highlights    |
| Backgrounds     | `--background`       | Page background               |
| Cards           | `--card`             | Card surfaces, modals         |
| Text            | `--foreground`       | Primary text                  |
| Secondary Text  | `--muted-foreground` | Descriptions, hints           |
| Errors          | `--destructive`      | Error states, warnings        |
| Success         | `--chart-1`          | Success states, confirmations |

---

## ✍️ Typography

### Font Stack

```css
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
--font-urdu: var(--font-urdu); /* For RTL support */
```

### Fluid Typography

```css
.text-fluid-h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
}

.text-fluid-h2 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.text-fluid-p {
  font-size: clamp(1rem, 2vw, 1.125rem);
}
```

### Typography Classes

| Class                    | Size     | Weight | Usage           |
| ------------------------ | -------- | ------ | --------------- |
| `text-3xl font-bold`     | 1.875rem | 700    | Page titles     |
| `text-2xl font-semibold` | 1.5rem   | 600    | Section headers |
| `text-xl font-semibold`  | 1.25rem  | 600    | Card titles     |
| `text-lg font-medium`    | 1.125rem | 500    | Subheadings     |
| `text-base`              | 1rem     | 400    | Body text       |
| `text-sm`                | 0.875rem | 400    | Secondary text  |
| `text-xs`                | 0.75rem  | 400    | Labels, badges  |

---

## 📐 Spacing & Layout

### Border Radius System

```css
--radius: 1rem; /* Base: 16px */
--radius-sm: calc(var(--radius) - 4px); /* 12px */
--radius-md: calc(var(--radius) - 2px); /* 14px */
--radius-lg: var(--radius); /* 16px */
--radius-xl: calc(var(--radius) + 4px); /* 20px */
```

### Spacing Scale

Use Tailwind's default spacing scale:

```
p-1 = 0.25rem (4px)
p-2 = 0.5rem (8px)
p-3 = 0.75rem (12px)
p-4 = 1rem (16px)
p-5 = 1.25rem (20px)
p-6 = 1.5rem (24px)
p-8 = 2rem (32px)
```

### Layout Patterns

#### Page Container

```jsx
<div className='space-y-6'>
  {/* Page Header */}
  <div className='flex items-center justify-between'>
    <div>
      <h1 className='text-3xl font-bold'>Page Title</h1>
      <p className='text-muted-foreground'>Description text</p>
    </div>
    <Button>Action</Button>
  </div>

  {/* Content */}
  <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>{/* Cards */}</div>
</div>
```

#### Grid Layouts

```jsx
// Stats Grid
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

// Card Grid
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

// Two Column
<div className="grid gap-6 md:grid-cols-2">
```

---

## 🧩 Component Library

### Button Component

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 duration-200',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:shadow-primary/20',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-red-500/20',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // Modern 2025 Variants
        'neo-glass':
          'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 shadow-lg dark:bg-black/20 dark:hover:bg-black/30',
        'gradient-shine':
          'bg-gradient-to-r from-primary via-blue-500 to-primary text-primary-foreground bg-[length:200%_auto] hover:bg-[position:right_center] transition-[background-position] duration-500 shadow-lg hover:shadow-primary/30',
        magnetic: 'bg-primary text-primary-foreground hover:bg-primary/90 relative overflow-hidden',
        subtle: 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
        xl: 'h-14 rounded-xl px-8 text-lg',
      },
    },
  }
);
```

**Usage:**

```jsx
<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="neo-glass">Glass Effect</Button>
<Button variant="gradient-shine">Gradient</Button>
<Button size="lg">Large Button</Button>
<Button size="icon"><Plus /></Button>
```

### Card Component

```tsx
const Card = React.forwardRef<
  HTMLDivElement,
  {
    variant?: 'default' | 'glass' | 'gradient' | 'neo' | 'ghost';
    hoverEffect?: 'none' | 'lift' | 'glow' | 'spotlight';
    noise?: boolean;
  }
>(({ variant = 'default', hoverEffect = 'none', noise = false, ...props }, ref) => {
  const variants = {
    default: 'bg-card text-card-foreground',
    glass:
      'bg-white/10 backdrop-blur-md border-white/20 text-card-foreground shadow-lg dark:bg-black/20 dark:border-white/10',
    gradient: 'bg-gradient-to-br from-card to-secondary/20 border-primary/10',
    neo: 'bg-card shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.8)] dark:shadow-[5px_5px_10px_rgba(0,0,0,0.3),-5px_-5px_10px_rgba(255,255,255,0.05)] border-none',
    ghost: 'border-none shadow-none bg-transparent',
  };

  const hoverStyles = {
    none: '',
    lift: 'hover:-translate-y-1 hover:shadow-md',
    glow: 'hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:border-primary/50',
    spotlight: 'group relative overflow-hidden',
  };
});
```

**Usage:**

```jsx
<Card variant="neo" hoverEffect="lift">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

<Card variant="glass">
  {/* Glass effect card */}
</Card>
```

### Badge Component

```tsx
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white hover:bg-destructive/90 shadow-sm',
        outline: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        glass:
          'border-white/20 bg-white/20 backdrop-blur-md text-white hover:bg-white/30 shadow-sm',
        soft: 'border-transparent bg-primary/10 text-primary hover:bg-primary/20',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        scale: 'hover:scale-105',
      },
    },
  }
);
```

**Usage:**

```jsx
<Badge>Default</Badge>
<Badge variant="soft">Soft</Badge>
<Badge variant="glass">Glass</Badge>
<Badge withDot pulse>Live</Badge>
```

### GlassCard Component

```tsx
interface GlassCardProps {
  hoverEffect?: boolean;
  gradient?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlassCard({
  intensity = 'medium',
  hoverEffect = false,
  gradient = false,
  ...props
}: GlassCardProps) {
  const intensityMap = {
    low: 'backdrop-blur-sm bg-white/40 dark:bg-black/20',
    medium: 'backdrop-blur-md bg-white/60 dark:bg-black/40',
    high: 'backdrop-blur-xl bg-white/80 dark:bg-black/60',
  };
}
```

**Usage:**

```jsx
<GlassCard intensity='high' hoverEffect gradient>
  <div className='p-6'>Glass content</div>
</GlassCard>
```

---

## 🎬 Animation System

### Motion Variants

```tsx
export const motionVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  },
  staggerContainer: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  },
};
```

### MotionWrapper Component

```tsx
<MotionWrapper variant="fadeInUp" delay={0.1}>
  <Card>Content</Card>
</MotionWrapper>

// Staggered List
<MotionWrapper stagger>
  {items.map((item) => (
    <MotionItem key={item.id}>
      <Card>{item.content}</Card>
    </MotionItem>
  ))}
</MotionWrapper>
```

### CSS Keyframes

```css
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes glow {
  from {
    box-shadow: 0 0 10px -10px var(--primary);
  }
  to {
    box-shadow: 0 0 20px 5px var(--primary);
  }
}

@keyframes enter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Animation Classes

```css
.animate-enter {
  animation: enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}
.animate-shimmer {
  animation: shimmer 2s linear infinite;
}
.animate-glow {
  animation: glow 2s ease-in-out infinite alternate;
}

/* Stagger Delays */
.delay-100 {
  animation-delay: 100ms;
}
.delay-200 {
  animation-delay: 200ms;
}
.delay-300 {
  animation-delay: 300ms;
}
```

### Button Micro-interactions

```tsx
// Framer Motion button with spring animation
const motionProps = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};
```

---

## ✨ Glassmorphism & Effects

### Glass Panel Utility

```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}
```

### 3D Hover Effect

```css
.rotate-3d-hover {
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  perspective: 1000px;
}

.rotate-3d-hover:hover {
  transform: rotateY(5deg) rotateX(5deg) scale(1.02);
  box-shadow:
    -5px 5px 20px rgba(0, 0, 0, 0.1),
    inset 0 0 20px rgba(255, 255, 255, 0.5);
}
```

### Neumorphism (Neo) Style

```css
.neo-card {
  background: var(--card);
  box-shadow:
    5px 5px 10px rgba(0, 0, 0, 0.05),
    -5px -5px 10px rgba(255, 255, 255, 0.8);
  border: none;
}

.dark .neo-card {
  box-shadow:
    5px 5px 10px rgba(0, 0, 0, 0.3),
    -5px -5px 10px rgba(255, 255, 255, 0.05);
}
```

### Background Gradients

```css
body {
  background-image:
    radial-gradient(circle at 15% 50%, oklch(0.96 0.02 155 / 0.1) 0%, transparent 25%),
    radial-gradient(circle at 85% 30%, oklch(0.95 0.03 200 / 0.1) 0%, transparent 25%);
  background-attachment: fixed;
}

.dark body {
  background-image:
    radial-gradient(circle at 15% 50%, oklch(0.2 0.1 155 / 0.15) 0%, transparent 25%),
    radial-gradient(circle at 85% 30%, oklch(0.2 0.05 260 / 0.15) 0%, transparent 25%);
}
```

---

## 🌙 Dark Mode

### Implementation

```tsx
// Theme Toggle Component
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className='h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
      <Moon className='absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
    </Button>
  );
}
```

### CSS Custom Variant

```css
@custom-variant dark (&:is(.dark *));
```

### Dark Mode Classes

Always use Tailwind's dark mode classes:

```jsx
<div className="bg-white dark:bg-slate-900">
<p className="text-gray-900 dark:text-gray-100">
<div className="border-gray-200 dark:border-gray-800">
```

---

## ⏳ Loading States

### Loading Spinner

```tsx
export function LoadingSpinner({
  size = 'md',
  text,
}: {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className='flex items-center gap-2'>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className='text-muted-foreground text-sm'>{text}</span>}
    </div>
  );
}
```

### Skeleton Components

```tsx
function Skeleton({ variant = 'pulse' }) {
  return (
    <div
      className={cn(
        'bg-muted/50 rounded-md',
        variant === 'pulse' && 'animate-pulse',
        variant === 'shimmer' &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent'
      )}
    />
  );
}

// Card Skeleton
<div className='space-y-4 rounded-lg border p-6'>
  <div className='flex items-center space-x-4'>
    <Skeleton className='h-12 w-12 rounded-full' />
    <div className='space-y-2'>
      <Skeleton className='h-4 w-[250px]' />
      <Skeleton className='h-4 w-[200px]' />
    </div>
  </div>
</div>;
```

### Full Page Loading

```tsx
export function FullPageLoading({ title = 'Loading...', description = 'Please wait' }) {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center'>
      <div className='flex flex-col items-center space-y-4 text-center'>
        <LoadingSpinner size='lg' />
        <div className='space-y-2'>
          <h2 className='text-lg font-semibold'>{title}</h2>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 📭 Empty States

### EmptyState Component

```tsx
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className='animate-in fade-in zoom-in flex flex-col items-center justify-center p-8 text-center duration-500'>
      {icon && (
        <div className='bg-primary/5 text-primary ring-primary/5 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ring-4 backdrop-blur-sm transition-transform duration-300 hover:scale-110'>
          {icon}
        </div>
      )}
      <h3 className='text-foreground mb-3 text-xl font-bold tracking-tight'>{title}</h3>
      <p className='text-muted-foreground mb-8 max-w-sm text-base leading-relaxed'>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className='bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-medium transition-all duration-200 hover:shadow-lg active:scale-95'
        >
          <PlusCircle className='h-4 w-4' />
          {action.label}
        </button>
      )}
    </div>
  );
}
```

### Context-Specific Empty States

```tsx
<EmptyAnimals onAdd={() => router.push('/animals/new')} />
<EmptyMilkRecords onLog={() => setShowLogDialog(true)} />
<EmptySearchResults query={searchQuery} />
<EmptyAnalytics />
<EmptyOffline />
<EmptyError onRetry={() => window.location.reload()} />
```

---

## 🎯 Icons

### Icon Library: Lucide React

```tsx
import {
  Home,
  Users,
  Settings,
  Search,
  Plus,
  X,
  Check,
  AlertCircle,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  // Domain Icons
  Beef, // Animals
  Droplets, // Milk
  Heart, // Health
  Baby, // Breeding
  Bug, // Diseases
  Pill, // Medicine
  DollarSign, // Finance
  BarChart3, // Analytics
} from 'lucide-react';
```

### Icon Usage Guidelines

- **Size**: Default `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for empty states
- **Color**: Inherit from text or use specific color classes
- **Spacing**: Use `gap-2` between icon and text

```jsx
// In Button
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Item
</Button>

// In Navigation
<Link>
  <Home className="h-5 w-5" />
  <span>Dashboard</span>
</Link>

// In Stats Card
<div className="rounded-xl p-2.5 bg-green-100">
  <TrendingUp className="h-5 w-5 text-green-600" />
</div>
```

---

## 📱 Responsive Design

### Breakpoints

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Mobile-First Approach

```jsx
// Grid that adapts
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// Text sizing
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Padding/Margin
<div className="p-4 md:p-6 lg:p-8">

// Show/Hide
<div className="hidden md:block">  {/* Hidden on mobile */}
<div className="md:hidden">         {/* Only on mobile */}
```

### Custom Scrollbar

```css
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 hover:bg-muted-foreground/50 rounded-full transition-colors;
}
```

---

## ♿ Accessibility

### Focus States

All interactive elements have visible focus states:

```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

### ARIA Labels

```jsx
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

<Input aria-describedby="email-error" aria-invalid={!!errors.email} />
```

### Keyboard Navigation

- All buttons and links are focusable
- Modals trap focus
- Dropdowns support arrow keys
- Escape closes overlays

### Color Contrast

All text meets WCAG 2.1 AA contrast requirements:

- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

---

## 📝 Code Snippets

### Complete Page Template

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MotionWrapper, MotionItem } from '@/components/ui/motion-wrapper';
import { PageLoading } from '@/components/ui/loading-states';
import { EmptyState } from '@/components/ui/empty-state';

export default function MyPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['items'],
    queryFn: () => fetch('/api/items').then(res => res.json()),
  });

  if (isLoading) return <PageLoading title='Loading items...' />;
  if (error) return <EmptyError onRetry={() => window.location.reload()} />;
  if (!data?.length) return <EmptyState title='No items yet' />;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Page Title</h1>
          <p className='text-muted-foreground'>Description here</p>
        </div>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Add New
        </Button>
      </div>

      {/* Content Grid */}
      <MotionWrapper stagger>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {data.map((item, index) => (
            <MotionItem key={item.id}>
              <Card variant='neo' hoverEffect='lift'>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>{item.description}</CardContent>
              </Card>
            </MotionItem>
          ))}
        </div>
      </MotionWrapper>
    </div>
  );
}
```

### Stats Card Pattern

```tsx
function StatsCard({ title, value, change, changeType, icon: Icon, color }) {
  return (
    <Card variant='neo' hoverEffect='lift'>
      <CardHeader className='flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className='h-4 w-4' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p
          className={cn(
            'flex items-center gap-1 text-xs',
            changeType === 'increase' && 'text-green-600',
            changeType === 'decrease' && 'text-red-600'
          )}
        >
          {changeType === 'increase' ? (
            <ArrowUp className='h-3 w-3' />
          ) : (
            <ArrowDown className='h-3 w-3' />
          )}
          {change}% from last month
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## 🚀 Quick Start Checklist

When starting a new project, ensure you have:

- [ ] Tailwind CSS v4 configured
- [ ] shadcn/ui installed with "new-york" style
- [ ] Framer Motion installed
- [ ] Lucide React icons installed
- [ ] `globals.css` with OKLCH color variables
- [ ] `lib/utils.ts` with `cn()` helper
- [ ] Dark mode provider (next-themes)
- [ ] Motion wrapper components
- [ ] Loading and empty state components

---

## 📚 Resources

- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion)
- [Lucide Icons](https://lucide.dev)
- [OKLCH Color Picker](https://oklch.com)
- [Radix UI Primitives](https://www.radix-ui.com)

---

> **Note:** This design system is continuously evolving. Always check for updates and improvements.

**Created with ❤️ by MalikTech**
