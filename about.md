# MTK Dairy - Smart Dairy Farm Management Software

## Project Overview

MTK Dairy is Pakistan's leading multi-tenant SaaS platform designed specifically for dairy farm management. Built for farmers, farm managers, and agricultural cooperatives, it provides comprehensive tools to track milk production, manage cattle health, monitor breeding cycles, and handle finances - all in one powerful, easy-to-use platform.

## Tech Stack

- **Framework:** Next.js 15 (App Router) with TypeScript
- **Authentication:** Clerk (Organizations as Tenants)
- **Database:** Supabase PostgreSQL + Drizzle ORM
- **Real-time:** Firebase Firestore (activity feeds)
- **Storage:** Cloudinary (primary) + Supabase Storage (backup)
- **Cache & Queue:** Upstash Redis + BullMQ
- **Email:** Resend
- **UI:** Tailwind CSS + shadcn/ui + Radix UI
- **State Management:** Zustand + TanStack Query
- **Internationalization:** next-intl (English + Urdu RTL)
- **Error Tracking:** Sentry
- **Testing:** Jest, Cypress, k6

## Live URL

**https://dairy.mtkcodex.site**

## GitHub Repository

**https://github.com/Kaashmalik/malik-tech-dairy**

## Key Features & Highlights

### 1. Comprehensive Farm Management
- **Milk Production Tracking:** Real-time monitoring of daily milk yields by animal with trend analysis and optimization insights
- **Cattle Health Management:** Complete vaccination schedules, treatment records, and automated health checkup alerts
- **Breeding & Pregnancy Tracking:** Heat cycle monitoring, breeding records, and pregnancy status tracking with calving date predictions
- **Financial Analytics:** Expense tracking, sales management, profit analysis, and PDF report generation

### 2. Multi-Tenant SaaS Architecture
- **Organization-Based Isolation:** Each farm operates as an independent tenant with complete data separation
- **Role-Based Access Control:** 7 distinct roles (farm_owner, farm_manager, veterinarian, breeder, milking_staff, feed_manager, accountant) with granular permissions
- **Subscription Management:** Flexible pricing plans (Free, Professional, Farm, Enterprise) with automated billing and feature gating
- **Scalable Infrastructure:** Built to handle thousands of farms with millions of records

### 3. IoT & Mobile-First Design
- **Progressive Web App (PWA):** Works offline, installs like a native app, and provides seamless mobile experience
- **IoT Device Integration:** API key authentication for milking machines, sensors, and automated data collection
- **Real-time Updates:** Instant synchronization across all devices using Firebase and Supabase real-time features
- **Bilingual Support:** Full English and Urdu (RTL) interface for accessibility across Pakistan

### 4. Enterprise-Grade Security & Reliability
- **Bank-Level Encryption:** All data encrypted at rest and in transit
- **Multi-Factor Authentication (MFA):** Optional 2FA for enhanced security
- **Audit Logging:** Complete trail of all actions with timestamps and user attribution
- **99.9% Uptime SLA:** Built on reliable infrastructure with automatic backups and disaster recovery
- **GDPR & Data Privacy:** Compliance-ready architecture with data export and deletion capabilities

## SaaS Architecture & Business Model

### Multi-Tenant Architecture
- **Tenant Isolation:** Each dairy farm operates as an independent tenant with complete data separation using Clerk Organizations
- **Shared Infrastructure:** Optimized resource utilization while maintaining strict data isolation at the database level
- **Horizontal Scalability:** Can scale to support thousands of tenants without performance degradation
- **Tenant-Specific Configuration:** Customizable branding, feature flags, and settings per farm

### Subscription Management
- **Automated Billing:** Integration with local payment gateways (JazzCash, EasyPaisa, XPay, Bank Transfer)
- **Feature Gating:** Dynamic feature access based on subscription tier
- **Usage Monitoring:** Real-time tracking of animal counts, user limits, and API usage
- **Grace Periods:** Automatic downgrade handling with data retention policies
- **Upgrade/Downgrade:** Seamless plan changes with prorated billing

### Subscription Plans (PKR)

| Plan | Price | Animals | Users | Features |
|------|-------|---------|-------|----------|
| **Free** | Rs. 0 | 5 | 1 | Basic tracking, limited reports |
| **Professional** | Rs. 4,999/mo | 100 | 5 | Full features, PDF exports, priority support |
| **Farm** | Rs. 12,999/mo | 500 | 15 | IoT integration, advanced analytics, API access |
| **Enterprise** | Custom | Unlimited | Unlimited | Custom integrations, dedicated support, SLA |

## Target Market

MTK Dairy is designed for the Pakistani agricultural sector, serving dairy farms across Punjab, Sindh, KPK, and Balochistan. The platform is optimized for local needs with:
- Urdu language support
- Local payment gateway integration (JazzCash, EasyPaisa, XPay)
- Regional city targeting for SEO
- Mobile-first design for farmers on the go

## Impact

- **500+ Active Farms** already using the platform
- **50K+ Animals** tracked and managed
- **1M+ Milk Logs** recorded
- **30% Productivity Increase** reported by users implementing breeding tracking
- **4.9/5 User Rating** with 127+ reviews

## Future Roadmap

- AI-powered milk yield predictions
- Computer vision integration for cattle health monitoring
- Blockchain-based supply chain tracking
- Drone integration for pasture management
- Mobile app for Android and iOS
- Advanced analytics dashboard with predictive insights
