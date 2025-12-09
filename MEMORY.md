# MTK Dairy - Project Memory

> Essential information for AI assistants and developers working on this project.

## Project Identity

- **Name**: MTK Dairy
- **Type**: Multi-Tenant Dairy Farm Management SaaS
- **Target Market**: Pakistan dairy farms
- **Currency**: PKR (Pakistani Rupee)
- **Languages**: English, Urdu (RTL support)

## Environment

| Service    | Project ID / Details                      |
| ---------- | ----------------------------------------- |
| Supabase   | `gdditqkvzlpnklcoxspj` (ap-south-1)       |
| Firebase   | `mtk-dairy` (legacy, activity feeds only) |
| Cloudinary | `dujpst04m`                               |
| Clerk      | Organizations = Tenants                   |

## Database Schema (Key Tables)

### Core Tables

```
platform_users    - All users (Clerk user ID as PK)
tenants           - Farm organizations (Clerk org ID as PK)
tenant_members    - User-tenant relationships with roles
subscriptions     - Subscription plans and status
```

### Business Tables

```
animals           - Livestock records
milk_logs         - Daily milk production
health_records    - Animal health records (notes encrypted)
breeding_records  - Breeding management
expenses          - Farm expenses
sales             - Sales records
```

### Application Tables

```
farm_applications - New farm onboarding workflow
payments          - Payment records
api_keys          - Tenant API keys
audit_logs        - Activity logging
```

## User Roles

### Platform Roles

- `super_admin` - Full platform access

### Tenant Roles

- `farm_owner` - Full farm access
- `farm_manager` - Management access
- `veterinarian` - Health module access
- `breeder` - Breeding module access
- `milking_staff` - Milk module access
- `feed_manager` - Feed module access
- `accountant` - Finance module access
- `guest` - View-only access

## Subscription Plans

| Plan         | Price/Month | Animals   | Users     |
| ------------ | ----------- | --------- | --------- |
| Free         | PKR 0       | 5         | 1         |
| Professional | PKR 4,999   | 100       | 5         |
| Farm         | PKR 12,999  | 500       | 15        |
| Enterprise   | Custom      | Unlimited | Unlimited |

## User Flow

```
1. /sign-up         → User registers via Clerk
2. /apply           → User submits farm application
3. /super-admin     → Super Admin reviews application
4. Approval         → Creates Clerk Org + Tenant + Subscription
5. /select-farm     → User joins org and selects farm
6. /dashboard       → Full farm management access
```

## Key Files

| File                                        | Purpose                            |
| ------------------------------------------- | ---------------------------------- |
| `src/lib/supabase.ts`                       | Supabase client                    |
| `src/lib/api/middleware.ts`                 | API middleware with tenant context |
| `src/lib/middleware/roleMiddleware.ts`      | Role-based access control          |
| `src/db/schema.ts`                          | Drizzle ORM schema                 |
| `src/types/roles.ts`                        | Role definitions and permissions   |
| `src/components/tenant/TenantProvider.tsx`  | Tenant context provider            |
| `src/components/tenant/DashboardHeader.tsx` | Navigation header                  |

## API Endpoints

### Animals

- `GET/POST /api/animals` - List/Create animals
- `GET/PUT/DELETE /api/animals/[id]` - CRUD by ID

### Milk

- `GET/POST /api/milk` - Milk logs

### Health

- `GET/POST /api/health/records` - Health records
- `GET/PUT/DELETE /api/health/records/[id]` - CRUD by ID

### Breeding

- `GET/POST /api/breeding` - Breeding records
- `GET/PUT/DELETE /api/breeding/[id]` - CRUD by ID

### Admin

- `GET /api/admin/applications` - List farm applications
- `POST /api/admin/applications/[id]/review` - Review application
- `GET /api/admin/users` - List platform users

## Test Accounts

| Email               | Role        | Farm              |
| ------------------- | ----------- | ----------------- |
| mtkdairy@gmail.com  | super_admin | -                 |
| kaash0542@gmail.com | user        | Green Valley Farm |

## Migration Status

### Completed (Supabase)

- `/api/animals/*`
- `/api/milk/*`
- `/api/health/records/*`
- `/api/breeding/*`
- `/api/admin/*`
- `/api/farm-applications/*`

### Pending Migration

- `/api/expenses/*`
- `/api/sales/*`
- `/api/predictions/*`

### Firebase Only (Keep)

- Real-time activity feeds (`src/lib/firebase/activity-feed.ts`)

## Common Issues & Fixes

| Issue                     | Fix                                  |
| ------------------------- | ------------------------------------ |
| 404 on /login             | Redirect to /sign-in                 |
| "No organizations"        | Call /api/user/join-org              |
| TypeScript 'never' errors | Use `(supabase.from(...) as any)`    |
| Missing icon              | Check lucide-react exports           |
| Tenant not found          | Check Clerk org ID matches tenant ID |

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run format           # Format all files
npm run lint             # Lint check
npx tsc --noEmit         # TypeScript check

# Database
npm run db:push          # Push Drizzle schema to Supabase
npm run db:studio        # Open Drizzle Studio

# Testing
npm run test             # Run Jest tests
npm run test:e2e         # Run Cypress E2E tests
```

## Environment Variables

```env
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional
ENCRYPTION_KEY=          # For encrypting sensitive data
RESEND_API_KEY=          # For emails
UPSTASH_REDIS_URL=       # For rate limiting
```
