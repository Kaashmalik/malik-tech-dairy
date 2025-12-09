# MTK Dairy - Development Workflow

> Standard workflows and processes for developing, testing, and deploying the MTK Dairy platform.

## Development Workflow

### Starting Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies (if needed)
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

### Before Committing

```bash
# 1. Format code
npm run format

# 2. Check TypeScript
npx tsc --noEmit

# 3. Run linter
npm run lint

# 4. Run tests (if applicable)
npm run test
```

---

## Adding New Features

### 1. Adding a New API Route

```
Step 1: Create route file
  src/app/api/[feature]/route.ts

Step 2: Define Zod schema (if needed)
  src/lib/validations/[feature].ts

Step 3: Implement handlers with pattern:
```

```typescript
// src/app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('table_name') as any)
        .select('*')
        .eq('tenant_id', context.tenantId);

      if (error) throw error;

      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
    }
  })(request);
}
```

### 2. Adding a New Dashboard Page

```
Step 1: Create page file
  src/app/(dashboard)/[feature]/page.tsx

Step 2: Create component (if complex)
  src/components/[feature]/[Component].tsx

Step 3: Add navigation link
  src/components/tenant/DashboardHeader.tsx
  - Add to navItems array
  - Specify module for permissions
```

```typescript
// src/app/(dashboard)/[feature]/page.tsx
import { FeatureComponent } from '@/components/[feature]/FeatureComponent';

export const dynamic = 'force-dynamic';

export default function FeaturePage() {
  return <FeatureComponent />;
}
```

### 3. Adding Database Tables

```
Step 1: Update Drizzle schema
  src/db/schema.ts

Step 2: Create migration SQL
  scripts/migrations/[date]-[feature].sql

Step 3: Apply migration via Supabase MCP or SQL Editor
  mcp0_apply_migration(...)

Step 4: Add RLS policies if needed
```

---

## Testing Workflow

### Unit Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- [filename]

# Run with coverage
npm run test -- --coverage
```

### E2E Tests

```bash
# Run Cypress
npm run test:e2e

# Open Cypress UI
npm run cypress:open
```

### Manual Testing Checklist

- [ ] Test as super_admin user
- [ ] Test as farm_owner user
- [ ] Test with no organization (should redirect)
- [ ] Test API error handling
- [ ] Test mobile responsiveness
- [ ] Test dark mode

---

## Database Operations

### Querying via Supabase MCP

```typescript
// List tables
mcp0_list_tables({ project_id: 'gdditqkvzlpnklcoxspj' });

// Execute SQL
mcp0_execute_sql({
  project_id: 'gdditqkvzlpnklcoxspj',
  query: 'SELECT * FROM table_name LIMIT 10',
});

// Apply migration
mcp0_apply_migration({
  project_id: 'gdditqkvzlpnklcoxspj',
  name: 'add_new_column',
  query: 'ALTER TABLE table_name ADD COLUMN new_col TEXT;',
});
```

### Common Queries

```sql
-- List all tenants
SELECT id, farm_name, slug FROM tenants;

-- List users with roles
SELECT pu.email, tm.role, t.farm_name
FROM platform_users pu
JOIN tenant_members tm ON pu.id = tm.user_id
JOIN tenants t ON tm.tenant_id = t.id;

-- Check subscription status
SELECT t.farm_name, s.plan, s.status
FROM tenants t
JOIN subscriptions s ON t.id = s.tenant_id;
```

---

## Deployment Workflow

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] TypeScript compilation clean
- [ ] Code formatted
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied

### Deploy to Vercel

```bash
# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Post-Deployment

- [ ] Verify homepage loads
- [ ] Test sign-in flow
- [ ] Check dashboard access
- [ ] Monitor error logs

---

## Troubleshooting

### Common Issues

#### "Organization not found"

1. Check Clerk dashboard for organization
2. Verify tenant exists in Supabase
3. Check tenant_members table for user membership

#### "401 Unauthorized"

1. Check Clerk session is valid
2. Verify API middleware is applied
3. Check role permissions in types/roles.ts

#### "TypeScript 'never' error"

1. Add `as any` type assertion to Supabase query
2. Add eslint-disable comment above

#### "Page 404"

1. Check file exists in correct directory
2. Verify page.tsx naming
3. Check middleware.ts for route protection

### Debug Logging

```typescript
// Add debug logging in API routes
console.log('Debug:', {
  userId: context.userId,
  tenantId: context.tenantId,
  body: await req.json(),
});
```

---

## Code Review Guidelines

### Must Check

- [ ] Tenant isolation (tenant_id filter)
- [ ] Error handling
- [ ] Input validation
- [ ] Response format consistency
- [ ] TypeScript types

### Should Check

- [ ] Performance (N+1 queries)
- [ ] Security (no sensitive data exposure)
- [ ] Accessibility
- [ ] Mobile responsiveness

---

## Git Workflow

### Branch Naming

```
feature/[feature-name]    # New features
fix/[issue-description]   # Bug fixes
refactor/[area]           # Code refactoring
docs/[topic]              # Documentation
```

### Commit Messages

```
feat: Add milk production analytics
fix: Resolve tenant isolation issue in animals API
refactor: Migrate health records to Supabase
docs: Update API documentation
```

### Pull Request Template

```markdown
## Description

[What changes were made]

## Type

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation

## Testing

- [ ] Unit tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code formatted
- [ ] TypeScript clean
- [ ] No console.log left
```

---

## Quick Reference

### Key Directories

| Directory              | Purpose                |
| ---------------------- | ---------------------- |
| `src/app/api/`         | API routes             |
| `src/app/(dashboard)/` | Dashboard pages        |
| `src/components/`      | React components       |
| `src/lib/`             | Utilities and services |
| `src/types/`           | TypeScript types       |
| `scripts/`             | Utility scripts        |

### Key Commands

| Command            | Purpose          |
| ------------------ | ---------------- |
| `npm run dev`      | Start dev server |
| `npm run format`   | Format code      |
| `npm run lint`     | Lint code        |
| `npx tsc --noEmit` | Type check       |
| `npm run test`     | Run tests        |

### Key URLs (Development)

| URL                               | Purpose     |
| --------------------------------- | ----------- |
| http://localhost:3000             | App home    |
| http://localhost:3000/dashboard   | Dashboard   |
| http://localhost:3000/super-admin | Admin panel |
| http://localhost:3000/sign-in     | Login       |
| http://localhost:3000/sign-up     | Register    |
