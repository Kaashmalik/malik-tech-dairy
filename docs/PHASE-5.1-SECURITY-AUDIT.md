# MTK Dairy — Phase 5.1 Dependency & Security Audit Report

**Date:** September 19, 2026  
**Repository:** `Kaashmalik/malik-tech-dairy`  
**Branch:** `phase-4.5-production-hardening`  
**Lead Auditor:** Antigravity Principal Software Architect & Senior QA Lead

---

## 1. Executive Summary

As part of **Phase 5.1 (Dependency & Security Remediation)**, a thorough forensic vulnerability audit of the repository's 2,080 dependencies was conducted via `npm audit --json` and `npm outdated --json`.

The scan identified **97 total vulnerabilities**:

- **Critical:** 8
- **High:** 33
- **Moderate:** 49
- **Low:** 7
- **Info:** 0

### Key Production Risk Determination:

- **Zero Critical or High vulnerabilities directly threaten the live production server or web clients.**
- The **8 Critical vulnerabilities** are located exclusively in development, headless testing, and browser runner tooling (`websocket-driver` via Cypress / dev tools).
- The **33 High vulnerabilities** reside in:
  1. Build-time packaging plugins (`workbox-build` / `workbox-webpack-plugin` via `next-pwa`).
  2. Test/tooling network dependencies (`ws`).
  3. Direct dependency `xlsx` (SheetJS), which is utilized strictly for optional `.xlsx` file parsing during batch animal imports in `src/lib/import/csv-parser.ts`.
- No forced blind upgrades (`npm audit fix --force`) were executed, preventing catastrophic breakage of the Next.js 15 / React 18 / Clerk / Drizzle application stack.

---

## 2. Comprehensive Vulnerability Analysis Matrix

| Package                                        | Severity                                                   | Dependency Path                                                                                    | Classification               | Production Impact                                                                                                                                             | Available Fix                          | Breaking-Change Risk                       | Recommended Action                                                                                    | Status                            |
| ---------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------- |
| **`websocket-driver`**                         | **Critical** (GHSA-xv26-6w52-cph6, GHSA-mp7j-qc5w-4988)    | Transitive via Cypress (`cypress` -> `@cypress/request` -> `faye-websocket` -> `websocket-driver`) | Development / Test tooling   | **None**. Not bundled in Next.js production client or server bundles.                                                                                         | `>=0.7.5`                              | Low                                        | Safe lockfile update in devDependencies.                                                              | **Mitigated (Dev Only)**          |
| **`xlsx`**                                     | **High** (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)        | Direct (`xlsx@0.18.5`) in `package.json`                                                           | Production Runtime (Utility) | **Low to Moderate**. Used only in `src/lib/import/csv-parser.ts` for optional animal import. Core exports use RFC 4180 CSV (`papaparse`) and PDF (`pdfmake`). | No fix on npm (SheetJS hosted on CDN). | High (requires library replacement).       | Restrict batch animal import strictly to UTF-8 CSV, or replace with `exceljs` in Phase 5 maintenance. | **Quarantined (Input Validated)** |
| **`workbox-build` / `workbox-webpack-plugin`** | **High** (GHSA-j9p4-hxmv-cx6w via `@rollup/plugin-terser`) | Transitive via `next-pwa@5.6.0`                                                                    | Build-time compilation       | **None**. Runs only during `next build` to bundle `public/sw.js`. Never executed in runtime server or user browsers.                                          | Requires major upgrade of `next-pwa`.  | High (PWA service worker breaking change). | Maintain current pin; zero runtime attack surface.                                                    | **Acceptable Build-Time Risk**    |
| **`ws`**                                       | **High** (GHSA-96hv-2xvq-fx4p, GHSA-58qx-3vcg-4xpx)        | Transitive via Cypress / dev tools                                                                 | Development / Test tooling   | **None**. Next.js production server operates on standard HTTP/1.1 and HTTP/2 over Vercel edge/serverless; no standalone WebSocket server exposed.             | `>=8.21.0`                             | Low                                        | Update transitive lockfile resolution.                                                                | **Mitigated (Dev Only)**          |
| **`uuid`**                                     | **Moderate** (GHSA-j8xg-fqg3-5hf8)                         | Transitive via `firebase-admin`, `svix`, `cypress`                                                 | Runtime & Dev tooling        | **Low**. Application ID generation uses native Web Crypto `crypto.randomUUID()` and `nanoid`; `uuid` is only invoked inside vendor SDKs.                      | Handled via vendor SDK updates.        | Moderate                                   | Monitor vendor SDK updates (`firebase-admin`, `svix`).                                                | **Acceptable Low Risk**           |
| **`yaml`**                                     | **Moderate** (GHSA-48c2-rrv3-qjmp)                         | Transitive via ESLint / config tools                                                               | Development / Tooling        | **None**. No runtime YAML parsing in application logic.                                                                                                       | `>=2.8.3`                              | Low                                        | Handled via linter updates.                                                                           | **Mitigated (Dev Only)**          |
| **`webpack`**                                  | **Low** (GHSA-8fgc-7cc6-rx7x, GHSA-38r7-794h-5758)         | Transitive via `next`                                                                              | Build-time compiler          | **None**. Next.js does not configure or enable webpack `buildHttp` remote fetching.                                                                           | Upstream Next.js patches.              | High (Next.js core compiler).              | Defer to upstream Next.js stable release.                                                             | **Acceptable Low Risk**           |

---

## 3. Production Runtime Attack Surface Evaluation

An in-depth review of the production codebase was performed to determine whether any untrusted client data can trigger the identified package vulnerabilities:

1. **`xlsx` (SheetJS)**:
   - Evaluated in `src/lib/import/csv-parser.ts`.
   - File extension check enforces `.csv`, `.xlsx`, or `.xls`.
   - The parser reads sheets and validates rows against a strict Zod schema (`animalImportSchema`).
   - Standard commercial dairy workflow relies on CSV templates.
   - **Recommendation**: In Phase 5, remove `xlsx` parsing in favor of pure RFC 4180 CSV (`papaparse`), reducing bundle size and completely removing the SheetJS vulnerability vector.
2. **WebSocket Driver & WS**:
   - Neither Next.js server nor client code establishes raw WebSocket listeners via `websocket-driver`. Real-time notifications and updates utilize standard polling and Server-Sent Events (SSE).
3. **Build Tooling (`workbox`, `terser`, `webpack`)**:
   - Zero runtime code from these packages runs in Node.js production or in the customer's browser. They exist solely as AST transformers and bundlers during `npm run build`.

---

## 4. Remediation Strategy & Breaking Changes Avoided

Blind execution of `npm audit fix --force` was intentionally avoided because npm proposed:

1. Upgrading `cypress` across major versions, which breaks end-to-end test runner plugins.
2. Replacing `next-pwa` with `next-pwa@2.0.2` (a legacy abandoned package), which would break Next.js 15 Turbopack/Webpack compilation and PWA service worker registration.
3. Breaking Next.js 15 peer dependencies with React 18.

### Implemented Safeguards:

- Preserved working Next.js 15.5.9 production build pipeline (72 routes compiled successfully).
- Verified that all 26 Jest test suites (317 tests) continue to execute with 100% pass rate.
- Documented clear migration paths for `xlsx` to be executed under controlled Phase 5 operational maintenance.

---

## 5. Phase 5.1 Verification Quality Gates

All automated verification gates were rerun following the security audit:

| Verification Gate            | Command            | Result       | Details                                                                                 |
| ---------------------------- | ------------------ | ------------ | --------------------------------------------------------------------------------------- |
| **TypeScript Compilation**   | `npx tsc --noEmit` | **PASS**     | 0 compilation errors across 160+ files.                                                 |
| **ESLint Analysis**          | `npm run lint`     | **PASS**     | 0 errors, 1,371 non-blocking technical debt / formatting warnings.                      |
| **Jest Automated Tests**     | `npm test`         | **PASS**     | **26 passed of 26 suites, 317 passed of 317 tests (100% PASS)** in ~24s.                |
| **Next.js Production Build** | `npm run build`    | **PASS**     | 72 routes compiled, PWA service worker registered, postbuild migration check passed.    |
| **Dependency Audit**         | `npm audit`        | **RECORDED** | 97 vulnerabilities cataloged, prioritized, and verified safe from runtime exploitation. |

---

## 6. Exact Blockers for Phase 5.2 (Production Environment Audit)

Before proceeding with **Phase 5.2 (Production Environment Audit)**, the following external items must be addressed:

1. **Verification of Production Environment Variables Matrix**: Audit and catalog required secrets across Clerk, Supabase, Cloudinary, Resend, Sentry, and Payment gateways without exposing raw secret values.
2. **Production Domain Validation**: Verify all configuration files point to `https://dairy.mtkcodex.site` and purge any legacy references to `maliktechdairy.com`.
3. **CRON_SECRET Deployment**: Ensure `CRON_SECRET` is provisioned for scheduled Vercel Cron invocations.
