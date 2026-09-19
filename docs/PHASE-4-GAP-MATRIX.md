# MTK Dairy — Phase 4 Gap Matrix & Architecture Roadmap

**Date:** September 19, 2026  
**Repository:** `Kaashmalik/malik-tech-dairy`  
**Branch:** `phase-4-advanced-product`  
**Target:** Production SaaS Readiness for Dairy Farms in Pakistan

---

## 1. Feature Classification Matrix

| Feature Area       | Candidate Capability                    | Status       | Current Code State & Gap Description                                                                                                                                                                                                      | Target Phase 4 Action                                                                                                                       |
| ------------------ | --------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **SaaS & Billing** | Reusable `PlanService` & `UsageService` | **PARTIAL**  | Basic `SubscriptionService` in `src/lib/subscriptions/management.ts` checks animal counts. Missing centralized `PlanService`, `UsageService`, and `FeatureGate` helper functions (`canUseFeature`, `checkUsageLimit`, `getCurrentUsage`). | Implement unified `PlanService`, `UsageService`, and server/client `FeatureGate` abstractions.                                              |
| **SaaS & Billing** | Payment Provider Interface              | **PARTIAL**  | `api/payments/checkout/route.ts` has ad-hoc conditionals for JazzCash, EasyPaisa, XPay, Bank Transfer. Missing clean provider interface (`PaymentProvider`, `PaymentTransaction`, `PaymentWebhook`) with idempotency and retry safety.    | Build provider-independent `PaymentProvider` interface with webhook signature validation and transaction state machine.                     |
| **SaaS & Billing** | Webhook Idempotency & Audit             | **PARTIAL**  | Webhooks exist but need database-backed idempotency records to prevent replay attacks and duplicate activations.                                                                                                                          | Implement idempotency key tracking on payment webhooks with audit logging.                                                                  |
| **Localization**   | Urdu (اردو) Translation Catalog         | **COMPLETE** | `messages/ur.json` (9.5KB) and `messages/en.json` (7.6KB) contain comprehensive strings.                                                                                                                                                  | Expand dictionaries for new Phase 4 modules (tasks, notifications, billing).                                                                |
| **Localization**   | Dynamic Locale & RTL Switcher           | **PARTIAL**  | `next-intl` request config detects locale from header, but `DashboardHeader.tsx` and root layout lack user-facing language switcher (`dir="rtl"` vs `dir="ltr"`).                                                                         | Add persistent Locale Switcher component in `DashboardHeader` with full RTL CSS class toggling and font application (`Noto_Nastaliq_Urdu`). |
| **PWA & Offline**  | Offline Milk Entry & Dexie DB           | **COMPLETE** | `OfflineDB` in `src/lib/offline/database.ts` handles animals, milk logs, and health records with IndexedDB.                                                                                                                               | Retain and optimize IndexedDB syncing.                                                                                                      |
| **PWA & Offline**  | Visible Sync Status Indicator           | **MISSING**  | `src/components/ui/sync-status.tsx` (`CompactSyncStatus`, `SyncStatusIndicator`) was never mounted in `DashboardHeader` or main dashboard layout.                                                                                         | Mount `CompactSyncStatus` prominently in `DashboardHeader` showing online/offline/syncing status.                                           |
| **Notifications**  | In-App Notification System              | **MISSING**  | `notifications` table is not in Drizzle schema; no `NotificationService` or `/api/notifications` route exists.                                                                                                                            | Create `notifications` schema table, `NotificationService`, API routes, and header notification bell popover.                               |
| **Notifications**  | Automated Reminders Engine              | **PARTIAL**  | `src/app/api/cron/` has stubs. Missing centralized `ReminderService` for vaccination due, pregnancy checks, expected calvings, low feed stock, and subscription renewal.                                                                  | Implement `ReminderService` that evaluates farm conditions and issues deduplicated notifications.                                           |
| **Operations**     | Farm Task Management UI                 | **PARTIAL**  | `task_assignments` table and `/api/staff-management/tasks` API exist, but there is no dedicated `/tasks` page or task board for farm workers.                                                                                             | Build a dedicated, responsive `/tasks` page with role-based status updating, filters, and assignment workflows.                             |
| **Breeding & Vet** | Semen Inventory & AI Straws             | **COMPLETE** | `/api/semen` and `SemenInventory.tsx` in `/breeding` tab are operational.                                                                                                                                                                 | Maintain and link to breeding event forms.                                                                                                  |
| **Breeding & Vet** | Gestation & Calving Predictions         | **COMPLETE** | Verified in Phase 3.5: Cow 283d, Buffalo 310d, Goat 150d, Sheep 150d.                                                                                                                                                                     | Retain existing mathematical implementation.                                                                                                |
| **Breeding & Vet** | Medicine Inventory & Withdrawal         | **COMPLETE** | `/api/medicines` and `/medicine` page manage inventory, withdrawal periods for milk/meat, and storage conditions.                                                                                                                         | Maintain existing implementation.                                                                                                           |
| **Analytics**      | Real-Data Dashboard KPIs                | **COMPLETE** | Phase 3.5 replaced all mock metrics with `DashboardService.getFarmKPIs()`.                                                                                                                                                                | Add milk production trend visual charts and herd reproductive distribution.                                                                 |
| **Reporting**      | CSV Export                              | **COMPLETE** | Animals, Milk, Health, Financial CSV export operational with quote escaping and strict tenant isolation.                                                                                                                                  | Retain existing implementation.                                                                                                             |
| **Reporting**      | PDF Export Reliability                  | **PARTIAL**  | `pdfmake` lazy-loaded; serverless font metric dependencies require graceful fallback to CSV or standard Helvetica fonts.                                                                                                                  | Ensure robust PDF generation fallback without runtime crashes.                                                                              |
| **Observability**  | Sentry Error Tracking                   | **COMPLETE** | Sentry client and server configs initialized and active; verified in Phase 3.5 quality gates.                                                                                                                                             | Add React Error Boundaries with graceful recovery UI.                                                                                       |

---

## 2. Implementation Plan & Priority Phases

```
P0: Security & Payment Architecture (PaymentProvider abstraction, idempotency, webhook records)
 ↓
P1: SaaS Subscription Foundation (PlanService, UsageService, FeatureGate)
 ↓
P1: Urdu + English + RTL Integration (Header Locale Switcher, dir="rtl", Noto Nastaliq Urdu font)
 ↓
P1: Notification & Reminder System (Database schema, NotificationService, ReminderService, In-App Bell UI)
 ↓
P1: Operational Farm Task Management (Task UI, assignments, status lifecycle, audit logging)
 ↓
P1: PWA Sync Status Visibility (Mount CompactSyncStatus in DashboardHeader, verify offline resilience)
 ↓
P2: Real-Data Analytics & UX Polish (Responsive polish, loading skeletons, error boundaries)
 ↓
Quality Gates: npx tsc, npm run lint, npm test, npm run build
```
