# MTK Dairy — Phase 3 Gap Matrix

## Overview
This document provides a comprehensive audit and classification of all major dairy features in the MTK Dairy codebase following the completion of Phase 2 (Security, Tenant Isolation & Production Foundation).

Features are classified as:
- **COMPLETE**: Fully functional across Database, API, Service, UI, RBAC, and Validation.
- **PARTIALLY COMPLETE**: Implemented in multiple layers but missing critical workflows, filters, validations, or error handling.
- **API ONLY**: Backend route exists with database access, but no user interface is connected.
- **DATABASE ONLY**: Schema exists in Drizzle/PostgreSQL, but no API or UI exists.
- **UI ONLY**: Component exists in the codebase but either has no page route or is not hooked to a working API.
- **BROKEN**: Exists but fails due to schema mismatches, incorrect route paths, or runtime exceptions.
- **MISSING**: Completely absent from schema, API, and UI.

---

## Executive Summary Matrix

| Feature Area | Status | UI | API | Database | Service Layer | RBAC | Validation | Audit Log |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Animal Management** | PARTIALLY COMPLETE | ✅ (List, Form, Profile) | ✅ (/api/animals) | ✅ (`animals`) | ⚠️ Scattered in API | ⚠️ Needs role enforcement | ✅ (Zod) | ⚠️ Partial |
| **Milk Management** | PARTIALLY COMPLETE | ⚠️ Basic list + form | ✅ (/api/milk) | ✅ (`milk_logs`) | ⚠️ Scattered in API | ⚠️ Missing role check | ✅ (Zod) | ❌ Missing |
| **Health Management** | PARTIALLY COMPLETE | ✅ List + Form | ✅ (/api/health/records) | ✅ (`health_records`) | ❌ None | ⚠️ Basic | ⚠️ Partial | ❌ Missing |
| **Breeding & Pregnancy**| PARTIALLY COMPLETE | ✅ Tabbed view | ✅ (/api/breeding) | ✅ (`breeding_records`)| ❌ None | ⚠️ Basic | ⚠️ Partial | ❌ Missing |
| **Feed Management** | UI ONLY / API ONLY | ⚠️ Components exist, no page | ⚠️ (/api/feed-management)| ✅ (`feed_inventory`) | ❌ None | ❌ Missing | ⚠️ Incomplete | ❌ Missing |
| **Staff Management** | PARTIALLY COMPLETE | ✅ Team page | ⚠️ Client tenantId leak | ✅ (`tenant_members`) | ❌ None | ⚠️ Role check present | ⚠️ Incomplete | ❌ Missing |
| **Finance (Sales/Expenses)** | PARTIALLY COMPLETE | ✅ Tracker | ✅ (/api/expenses, /sales)| ✅ (`expenses`, `sales`)| ❌ None | ⚠️ Basic | ⚠️ Incomplete | ❌ Missing |
| **Dashboard** | PARTIALLY COMPLETE | ✅ Glassmorphism UI | ⚠️ 6 separate client calls | ✅ Aggregated | ❌ None | ⚠️ Basic | N/A | N/A |
| **Subscription Limits** | PARTIALLY COMPLETE | ⚠️ UI indicators | ✅ Check on animal create | ✅ (`subscriptions`) | ✅ Management class | ⚠️ Needs API enforcement on all modules | ⚠️ Partial | ⚠️ Partial |
| **Reporting System** | PARTIALLY COMPLETE | ✅ PDF preview | ⚠️ PDF generate only | ✅ Aggregated | ⚠️ Partial PDF helper | ⚠️ Basic | ⚠️ Incomplete | ❌ Missing |
| **Localization (Urdu/RTL)**| PARTIALLY COMPLETE | ⚠️ en/ur json exists | ⚠️ Language switcher partial | N/A | N/A | N/A | N/A | N/A |

---

## 1. Animal Management

### Feature Classification: **PARTIALLY COMPLETE**
- **Animal Registration**: COMPLETE (via `AnimalForm` and `POST /api/animals`). Validates species, tag uniqueness per tenant, subscription animal limit, species plan restrictions.
- **Animal Profile**: PARTIALLY COMPLETE (`/animals/[id]` renders `AnimalDetailClient`). Displays details, but milk history, health timeline, and breeding timeline tabs are not connected to real backend queries for that specific animal.
- **Tag / Ear Number**: COMPLETE (indexed, enforced unique within tenant).
- **Breed, Gender, DOB/Age, Weight, Color**: COMPLETE (stored in DB, displayed in UI).
- **Purchase Info (Date, Price)**: COMPLETE in DB & API, basic display in UI.
- **Ownership & Status (`active`, `sold`, `deceased`, `quarantine`)**: COMPLETE in schema and API; UI allows status changes.
- **Location**: DATABASE ONLY (`location` column in schema, not exposed in form/UI).
- **Images**: PARTIALLY COMPLETE (Cloudinary / Supabase storage upload; form accepts photo URL).
- **Lineage (Mother/Father ID)**: COMPLETE in DB; basic select in form.
- **Animal History / Timeline**: PARTIALLY COMPLETE (Components `BreedingTimeline` exist in `src/components/animals`, but need unified animal event aggregation).
- **Animal Transfer**: MISSING (No tenant-to-tenant transfer workflow).
- **Animal Sale**: PARTIALLY COMPLETE (Marked as sold, but does not atomically create a sales revenue record).
- **Animal Death / Culling**: PARTIALLY COMPLETE (Soft-deactivate/deceased status supported, needs death date and reason capture).

### Gaps & Action Items:
1. Extract business logic from `src/app/api/animals/route.ts` and `[id]/route.ts` into a dedicated `AnimalService` (`src/lib/services/animals/animal.service.ts`).
2. Fix broken navigation link: `router.push('/dashboard/animals')` -> `router.push('/animals')`.
3. Add server-side pagination, sorting, and status/breed filters to the `AnimalList` component.
4. Add audit logging for animal creation, update, and archival.

---

## 2. Milk Management

### Feature Classification: **PARTIALLY COMPLETE**
- **Daily Milk Entry**: COMPLETE (`/milk/new` and `POST /api/milk`).
- **Individual Animal Milk**: COMPLETE (tied to `animal_id`).
- **Morning / Evening Sessions**: COMPLETE (enforced in enum/schema, duplicate prevention per animal/date/session).
- **Bulk Milk Entry**: MISSING (Staff cannot log milk for all active cows in a single table entry workflow).
- **Milk History**: PARTIALLY COMPLETE (List exists at `/milk`, but lacks date range pickers, animal search, and pagination controls).
- **Milk Totals & Production Averages**: PARTIALLY COMPLETE (Calculated on dashboard, but no server-side aggregation API endpoint for daily/weekly/monthly stats).
- **Fat / SNF / Quality**: PARTIALLY COMPLETE (Columns `fat` and `quality` exist in `milk_logs`, but SNF is missing; entry form only has quality rating).
- **Rejected Milk**: MISSING.
- **Monthly Reports**: PARTIALLY COMPLETE (Covered in PDF reports, but no interactive UI trend chart on the milk page).

### Gaps & Action Items:
1. Create `MilkService` (`src/lib/services/milk/milk.service.ts`) with methods for logging milk, calculating daily/weekly/monthly farm totals, and animal production trends.
2. Fix species filter bug in `MilkLogForm.tsx`: change `a.species === 'cow'` to `a.species === 'cattle' || a.species === 'cow' || a.species === 'buffalo'`.
3. Fix navigation bug in `MilkLogForm.tsx`: `router.push('/dashboard/milk')` -> `router.push('/milk')`.
4. Add daily summary KPIs on `/milk` (today total, morning total, evening total, average per animal).
5. Implement bulk milk entry modal/page for fast barn data entry.

---

## 3. Health Management

### Feature Classification: **PARTIALLY COMPLETE**
- **Health Records**: COMPLETE (`/api/health/records` and `/health`).
- **Diseases & Diagnosis**: COMPLETE in database (`diseases` table, `diseases-medicines-schema.ts`), UI list at `/diseases`.
- **Treatments & Medications**: PARTIALLY COMPLETE (`treatmentRecords`, `medicines` in schema; API routes `/api/animal-treatments`, `/api/medicines` exist; UI at `/medicine`).
- **Veterinary Visits**: PARTIALLY COMPLETE (Recorded as health record type `checkup` / `surgery`).
- **Vaccinations & Schedules**: COMPLETE in schema (`vaccinationSchedules`, `animalVaccinations`); UI present in medicine/disease modules.
- **Follow-ups & Withdrawal Periods**: DATABASE ONLY (Schema supports `withdrawal_period_days`, but not surfaced as alerts when milking treated animals).
- **Veterinary Notes**: COMPLETE (Text field in health records).

### Gaps & Action Items:
1. Create `HealthService` (`src/lib/services/health/health.service.ts`) unifying health records, treatments, and vaccination scheduling.
2. Enforce RBAC: Only `veterinarian`, `farm_owner`, and `farm_manager` can create or modify treatments.
3. Link health history directly into the animal profile tab.
4. Add active treatment alerts and upcoming vaccination notifications.

---

## 4. Breeding & Pregnancy Management

### Feature Classification: **PARTIALLY COMPLETE**
- **Heat Detection**: COMPLETE in schema (`heatDetections`), API endpoint at `/api/breeding/heat-alerts`.
- **Breeding / Service (AI / Natural)**: COMPLETE (`/api/breeding` and `BreedingList` UI).
- **Semen Inventory**: COMPLETE in schema (`semenInventory`), UI component `SemenInventory.tsx` in breeding tabs.
- **AI Records & Technician Tracking**: COMPLETE (Stored in `breeding_records`).
- **Pregnancy Checks**: COMPLETE (`/api/breeding/pregnancy-checks` and `PregnancyDashboard.tsx`).
- **Expected Calving & Gestation Calculation**: COMPLETE (`calculateExpectedDueDate` in `breeding-constants.ts`).
- **Calving Records**: PARTIALLY COMPLETE (Outcome recorded on breeding record, but automatic newborn animal registration is missing).

### Gaps & Action Items:
1. Create `BreedingService` (`src/lib/services/breeding/breeding.service.ts`) with state machine validation:
   - Prevent pregnancy check before breeding date.
   - Prevent duplicate active pregnancies on the same animal.
   - Prevent breeding male animals or deceased/sold animals.
2. Add "Register Calf" action upon recording successful calving outcome.
3. Connect breeding metrics into dashboard KPIs.

---

## 5. Feed Management

### Feature Classification: **UI ONLY / API ONLY (Page Missing)**
- **Feed Inventory**: COMPLETE in schema (`feedInventory`), API exists at `/api/feed-management/inventory`.
- **Stock Levels & Purchases**: COMPLETE in schema; low stock alerts supported.
- **Feeding Schedules**: COMPLETE in schema (`feedingSchedules`), API at `/api/feed-management/schedules`.
- **Nutrition Templates**: COMPLETE in schema (`nutritionTemplates`), component `NutritionOptimizer.tsx` exists.
- **UI Route**: **MISSING** — `src/components/feed/` contains 4 complete components, but `src/app/(dashboard)/feed/page.tsx` was never created!

### Gaps & Action Items:
1. Create `src/app/(dashboard)/feed/page.tsx` integrating `FeedManagementDashboard`, `FeedInventoryTable`, and `NutritionOptimizer`.
2. Create `FeedService` (`src/lib/services/feed/feed.service.ts`) for inventory adjustments, consumption tracking, and stock reorder alerts.
3. Ensure inventory deduction on feeding schedule execution is atomic.
4. Add sidebar navigation link for Feed Management.

---

## 6. Staff Management & RBAC

### Feature Classification: **PARTIALLY COMPLETE**
- **Staff List & Roles**: COMPLETE (`/staff` and `tenant_members`).
- **Attendance**: DATABASE ONLY (`staffAttendance` table exists, UI not connected).
- **Task Assignments**: DATABASE ONLY (`taskAssignments` table exists).
- **Performance Reviews**: DATABASE ONLY (`performanceReviews` table exists).
- **RBAC Enforcement**: PARTIALLY COMPLETE (`roleMiddleware.ts` and `withTenantContext` exist, but `/api/staff` had potential tenantId leak via query parameters).

### Gaps & Action Items:
1. Secure `/api/staff/route.ts`: Strictly use `context.tenantId` from Clerk authentication; never accept `searchParams.get('tenantId')`.
2. Create `StaffService` (`src/lib/services/staff/staff.service.ts`).
3. Wire up task assignments and attendance tabs on `/staff`.

---

## 7. Finance (Expenses & Sales)

### Feature Classification: **PARTIALLY COMPLETE**
- **Expenses**: COMPLETE (`/api/expenses`, `ExpenseForm`, categories: feed, medicine, labor, etc.).
- **Sales & Milk Revenue**: COMPLETE (`/api/sales`, `SaleForm`, types: milk, animal, etc.).
- **Financial Summary (Profit & Loss)**: PARTIALLY COMPLETE (Calculated in client in `ExpenseSalesTracker`).
- **Terminology Accuracy**: Label clearly as "Revenue", "Operating Expenses", and "Net Result" (avoid unqualified "Profit").
- **Date Range Filtering**: COMPLETE in UI (current month vs custom range).

### Gaps & Action Items:
1. Create `FinanceService` (`src/lib/services/finance/finance.service.ts`) with server-side aggregation for monthly revenue, expenses, and net result.
2. Link milk sales with milk production volume.
3. Link animal sales with animal status (`sold`).

---

## 8. Dashboard

### Feature Classification: **PARTIALLY COMPLETE**
- **KPI Metrics**: Total animals, active animals, milk production, revenue, expenses.
- **Data Fetching Architecture**: PARTIALLY COMPLETE (Currently makes 6 parallel client-side requests).
- **Weather Integration**: COMPLETE (`ModernWeatherWidget` via OpenWeather).

### Gaps & Action Items:
1. Create a dedicated server-side aggregation endpoint `/api/dashboard/stats` powered by a `DashboardService` (`src/lib/services/dashboard/dashboard.service.ts`) to return all farm KPIs in a single fast, tenant-isolated query.
2. Remove any fallback hardcoded numbers.

---

## 9. Subscription & Usage Limits

### Feature Classification: **PARTIALLY COMPLETE**
- **Plan Limits**: Free (10 animals, 1 user), Starter (50 animals, 3 users), Professional (200 animals, 10 users), Enterprise (Unlimited).
- **Animal Limit Check**: COMPLETE on `POST /api/animals`.
- **Species Restrictions Check**: COMPLETE on `POST /api/animals`.
- **User / Staff Limit Check**: MISSING on `POST /api/staff` (invitations).
- **Feature Access Gating**: PARTIALLY COMPLETE (`hasFeatureAccess` in `SubscriptionService`).

### Gaps & Action Items:
1. Enforce user limit on staff invitations.
2. Enforce report export restrictions based on plan tier.
3. Ensure bulk animal operations respect remaining plan quota.

---

## 10. Reporting System & Exports

### Feature Classification: **PARTIALLY COMPLETE**
- **PDF Generation**: COMPLETE (`pdfmake` engine in `src/lib/reports/pdf.ts`).
- **CSV Export**: MISSING (No raw data export for animals, milk logs, expenses).
- **Report Types**: Animal inventory, Milk production, Health summary, Financial report.

### Gaps & Action Items:
1. Create `ReportService` (`src/lib/services/reports/report.service.ts`).
2. Add CSV export endpoints for tabular data.
3. Add Feed inventory report to the report generator.

---

## 11. Internationalization (English + Urdu/RTL)

### Feature Classification: **PARTIALLY COMPLETE**
- **next-intl Setup**: COMPLETE (`next-intl` plugin in `next.config.ts`, `messages/en.json`, `messages/ur.json`).
- **RTL Support**: PARTIALLY COMPLETE (`dir="rtl"` styling foundation exists, needs verification on forms and tables).
- **Urdu Translations**: PARTIALLY COMPLETE (Core terms translated, newer Phase 3 modules need complete translation keys).

---

## Implementation Priority Roadmap
1. **Service Layer Foundation** (`src/lib/services/*`): Centralize business rules, isolate tenant context.
2. **API Validation Standardization**: Consolidate Zod schemas and standard error responses.
3. **Animal Management**: Service layer, navigation fix, pagination, unified profile.
4. **Milk Management**: Service layer, navigation fix, species filter fix, daily totals, bulk entry.
5. **Feed Management**: Create missing `/feed` route, wire UI components to API.
6. **Health & Breeding**: Service layers, state machines, animal timeline integration.
7. **Staff & Finance**: Secure tenant isolation, server-side financial aggregations.
8. **Dashboard Optimization**: Single aggregation endpoint `/api/dashboard/stats`.
9. **Subscription Enforcement**: Staff and feature limits.
10. **Reports & Exports**: CSV exports, report service.
11. **Testing & Quality Gates**: Unit, integration, and E2E coverage.
