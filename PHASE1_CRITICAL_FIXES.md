# 🚀 Phase 1 Implementation: Critical Fixes (Day 1-2)

## Fix 1: Tenant Isolation Security Issue

### Problem
Several API routes are missing tenant_id filters, causing potential data leaks.

### Solution
Create a middleware helper that enforces tenant isolation:

```typescript
// src/lib/middleware/tenant-isolation.ts
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function withTenantIsolation<T>(
  queryFn: (tenantId: string) => Promise<T>
): Promise<T> {
  const { userId, orgId } = await auth();
  
  if (!userId || !orgId) {
    throw new Error('Unauthorized: No tenant context');
  }
  
  // Ensure orgId is used as tenant_id
  return queryFn(orgId);
}

// Usage in API routes
export async function GET(request: NextRequest) {
  return withTenantIsolation(async (tenantId) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('animals')
      .select('*')
      .eq('tenant_id', tenantId); // Always filtered!
    
    return successResponse(data);
  });
}
```

### Apply to All Routes
Update these files immediately:
- `/api/animals/[id]/route.ts`
- `/api/milk/route.ts`
- `/api/health/records/route.ts`
- `/api/breeding/route.ts`

## Fix 2: Generate Supabase Types

### Generate Types
```bash
npx supabase gen types typescript --project-id gdditqkvzlpnklcoxspj > src/types/supabase.ts
```

### Update Type Imports
```typescript
// Before
const { data } = (supabase.from('email_subscriptions') as any).select('*');

// After
import { Database } from '@/types/supabase';
type EmailSubscription = Database['public']['Tables']['email_subscriptions']['Row'];

const { data } = await supabase
  .from('email_subscriptions')
  .select('*')
  .returns<EmailSubscription[]>();
```

## Fix 3: Standardize API Responses

### Response Helper (Already exists, ensure all routes use it)
```typescript
// src/lib/api/response.ts
export const successResponse = <T>(data: T, message?: string) => ({
  success: true,
  data,
  message
});

export const errorResponse = (error: string, code?: string) => ({
  success: false,
  error,
  code
});

// Usage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // ... process request
    return successResponse(created, 'Animal created successfully');
  } catch (error) {
    return errorResponse('Failed to create animal', 'CREATE_FAILED');
  }
}
```

## Fix 4: Add Error Boundaries

### Create Error Boundary Component
```typescript
// src/components/ErrorBoundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Send to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Wrap Route Groups
```typescript
// src/app/(dashboard)/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      {/* Your existing layout */}
      {children}
    </ErrorBoundary>
  );
}
```

## Fix 5: Secure Public Routes

### Remove or Secure Unprotected Endpoints
```typescript
// DELETE or secure this route:
// src/app/api/public/data/route.ts

// If needed, add authentication:
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED');
  }
  // ... rest of code
}
```

## Fix 6: Input Validation with Zod

### Create Validation Schemas
```typescript
// src/lib/validations/animals.ts
import { z } from 'zod';

export const createAnimalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  tagNumber: z.string().regex(/^[A-Z]{2}\d{6}$/, 'Invalid tag format'),
  dateOfBirth: z.string().datetime().optional(),
  breed: z.enum(['holstein', 'jersey', 'buffalo', 'sahiwal']),
  gender: z.enum(['male', 'female']),
  tenantId: z.string().optional() // Will be set from auth
});

export type CreateAnimalInput = z.infer<typeof createAnimalSchema>;
```

### Use in API Routes
```typescript
// src/app/api/animals/route.ts
import { createAnimalSchema } from '@/lib/validations/animals';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createAnimalSchema.parse(body);
    
    // Add tenant_id from auth
    const { orgId } = await auth();
    const data = { ...validated, tenantId: orgId };
    
    // ... save to database
    return successResponse(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        'Validation failed: ' + error.errors.map(e => e.message).join(', '),
        'VALIDATION_ERROR'
      );
    }
    return errorResponse('Failed to create animal');
  }
}
```

## Implementation Checklist

### Today (Day 1)
- [ ] Run `npx supabase gen types` to generate types
- [ ] Create `withTenantIsolation` helper
- [ ] Fix tenant isolation in all API routes
- [ ] Add error boundaries to all route groups
- [ ] Remove/secure public API endpoints

### Tomorrow (Day 2)
- [ ] Replace all `any` types with proper types
- [ ] Add Zod validation to all forms/APIs
- [ ] Ensure all routes use standardized responses
- [ ] Test all fixes work correctly
- [ ] Run `npm run typecheck` - should have 0 errors

### Verification Commands
```bash
# Check TypeScript errors
npm run typecheck

# Check for any console logs
grep -r "console.log" src/ --exclude-dir=node_modules

# Check for any types
grep -r ": any" src/ --exclude-dir=node_modules

# Run tests
npm run test
```

These fixes will immediately improve security, type safety, and reliability of the platform! 🚀
