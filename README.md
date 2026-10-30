# MTK Dairy

Multi-tenant dairy farm management SaaS for Pakistan — animals, milk (with fat/SNF),
health, breeding, feed, staff, finance and reports, in English and Urdu.

Live: https://dairy.mtkcodex.site

## Stack

- **Next.js 15** (App Router, React 18, TypeScript), Tailwind CSS, TanStack Query
- **Clerk** — authentication; each farm is a Clerk Organization
- **Supabase Postgres** — accessed over REST with the service role from server code only
- Optional: Upstash Redis (rate limiting), Resend (email), Cloudinary (images), Sentry,
  PostHog, Google AdSense (public guides/tools only)

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Clerk + Supabase keys (see docs/SETUP.md)
npm run dev                  # http://localhost:3000
```

## Scripts

| Command             | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `npm run dev`       | Development server                                          |
| `npm run typecheck` | TypeScript check                                            |
| `npm test`          | Unit tests (Jest)                                           |
| `npm run lint`      | ESLint                                                      |
| `npm run build`     | Validate env + production build                             |
| `npm run db:push`   | Create tables from `src/db/schema.ts` (fresh database only) |

CI (`.github/workflows/ci.yml`) runs typecheck, lint errors, tests and a production
compile on every push and PR to `main`.

## Documentation

- **[docs/SETUP.md](docs/SETUP.md)** — everything to do in Supabase, Clerk, Vercel,
  Search Console and AdSense, including database migrations. Start here.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — how tenancy, auth, data access and
  the main flows work.
- **[docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)** — the remediation roadmap and progress log.

## License

Proprietary — © MalikTech. All rights reserved.
