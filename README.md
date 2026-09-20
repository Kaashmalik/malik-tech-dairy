<div align="center">

# 🐄 MTK Dairy

### **Empowering Dairy Farms with Technology**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

**Enterprise-Ready Multi-Tenant SaaS Platform for Livestock Management**

[Features](#-features) • [Quick Start](#-quick-start) • [Setup Guide](SETUP_GUIDE.md) • [Documentation](#-documentation) • [Support](#-support)

</div>

---

## 🎯 Overview

**MTK Dairy** is a comprehensive, enterprise-ready SaaS platform designed specifically for dairy and livestock management in Pakistan. Built with modern technologies, it supports multi-tenancy, real-time analytics, IoT integration, and multiple payment gateways optimized for the Pakistani market.

### ✨ Key Highlights

- 🏢 **Multi-Tenant Architecture** - Complete data isolation per farm
- 💳 **Pakistani Payment Gateways** - JazzCash, EasyPaisa, Bank Transfer
- 🌍 **Bilingual Support** - English & Urdu with RTL layout
- 📊 **Real-Time Analytics** - Advanced reporting and insights
- 🔌 **IoT Ready** - Webhook API for automated milk logging
- 📱 **Progressive Web App** - Works offline, installable
- 🔒 **Enterprise Security** - RBAC, encryption, audit logs

---

## 🚀 Features

### Core Functionality

- **Animal Management** - Complete CRUD for Cows, Buffaloes, Poultry, Goats, Sheep, Horses
- **Milk Logging** - Morning/Evening sessions with quality tracking
- **Health Records** - Vaccination, treatment, and health monitoring
- **Breeding Management** - Heat detection, breeding cycles, pregnancy tracking
- **Financial Tracking** - Expenses, sales, revenue analytics
- **🆕 Disease Guide** - Comprehensive veterinary reference with 25+ diseases, treatments, and medicines
- **Staff Management** - Role-based access control with invitations
- **Custom Fields** - Extensible data model for farm-specific needs

### Enterprise Features

- **IoT Integration** - RESTful API for automated data collection
- **Advanced Analytics** - AI-powered milk yield predictions
- **Multi-Language** - Auto-detection with manual override
- **NPS Surveys** - Customer feedback collection system
- **Email Sequences** - Welcome, onboarding, and engagement emails
- **Performance Optimization** - Redis caching, load balancing ready

### Payment & Subscription

- **Flexible Pricing Tiers**:
  - 🆓 **Free** - Up to 5 animals, 1 user
  - 💼 **Professional** - ₨4,999/mo - Up to 100 animals, 5 users
  - 🏭 **Farm** - ₨12,999/mo - Up to 500 animals, 15 users, IoT access
  - 🏢 **Enterprise** - Custom pricing, unlimited, white-label
- **Payment Methods**: JazzCash, EasyPaisa, Bank Transfer
- **Recurring Subscriptions** - Automated billing with tokenization

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **i18n**: next-intl (English + Urdu)

### Backend

- **Authentication**: Clerk (Organizations = Tenants)
- **Database**:
  - Firebase Firestore (document data)
  - Supabase PostgreSQL (relational data)
- **Storage**: Firebase Storage
- **Queue**: BullMQ + Upstash Redis
- **Cache**: Redis (Upstash)

### Integrations

- **Payments**: JazzCash, EasyPaisa, XPay (Bank Alfalah)
- **Email**: Resend API
- **SMS**: Twilio
- **Analytics**: PostHog
- **Monitoring**: Sentry
- **Testing**: Jest, Cypress, k6

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm
- **Clerk Account** (with Organizations enabled)
- **Firebase Project** (Firestore + Storage enabled)
- **Supabase Project** (PostgreSQL database)
- **Upstash Redis** account
- **Payment Gateway Accounts** (JazzCash/EasyPaisa)
- **Resend API Key** (for emails)
- **PostHog Account** (for analytics)

---

## 🚀 Quick Start

> 📖 **For complete step-by-step setup, see [SETUP_GUIDE.md](SETUP_GUIDE.md)**

### 1. Clone & Install

```bash
git clone https://github.com/Kaashmalik/malik-tech-dairy.git
cd malik-tech-dairy
npm install
```

### 2. Configure Environment

```bash
cp env.example .env.local
# Edit .env.local with your credentials
```

### 3. Set Up Accounts (All Free Tier)

| Service                                 | Purpose          | Free Tier        |
| --------------------------------------- | ---------------- | ---------------- |
| [Clerk](https://clerk.com)              | Authentication   | 10K MAU          |
| [Supabase](https://supabase.com)        | Primary Database | 500MB            |
| [Firebase](https://firebase.google.com) | Activity Feeds   | 50K reads/day    |
| [Cloudinary](https://cloudinary.com)    | File Storage     | 25GB             |
| [Upstash](https://upstash.com)          | Redis Cache      | 10K commands/day |
| [Resend](https://resend.com)            | Email            | 100 emails/day   |
| [PostHog](https://posthog.com)          | Analytics        | 1M events/mo     |
| [Sentry](https://sentry.io)             | Error Tracking   | 5K errors/mo     |

**Total Monthly Cost: $0** 🎉

### 4. Database Setup

Run the SQL migration in Supabase SQL Editor:

```bash
# For FRESH Supabase project, use:
# scripts/supabase-fresh-setup.sql

# Copy the entire file content and paste in:
# Supabase Dashboard → SQL Editor → New Query → Run

# Verify tables created:
# SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
malik-tech-dairy/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Main application (protected)
│   │   ├── (onboarding)/      # Tenant onboarding flow
│   │   └── api/               # API routes
│   │       ├── iot/           # IoT webhook endpoints
│   │       ├── payments/      # Payment processing
│   │       └── survey/        # NPS survey API
│   ├── components/             # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── analytics/         # Analytics dashboards
│   │   ├── survey/            # NPS survey component
│   │   └── providers/         # Context providers
│   ├── lib/                   # Utilities & helpers
│   │   ├── firebase/         # Firebase configuration
│   │   ├── supabase/         # Supabase helpers
│   │   ├── payments/         # Payment gateway integrations
│   │   ├── emails/           # Email templates & sender
│   │   ├── redis/            # Redis caching
│   │   └── workers/          # BullMQ job processors
│   ├── hooks/                 # Custom React hooks
│   ├── store/                 # Zustand stores
│   ├── types/                 # TypeScript definitions
│   └── i18n/                  # Internationalization
├── messages/                   # Translation files
│   ├── en.json               # English translations
│   └── ur.json               # Urdu translations
├── scripts/                   # Migration & utility scripts
├── firebase.rules            # Firestore security rules
├── k6-load-test.js           # Load testing script
└── LAUNCH_CHECKLIST.md       # Pre-launch checklist
```

---

## 🔐 Security

- ✅ **Multi-Tenant Data Isolation** - Firestore security rules
- ✅ **Role-Based Access Control** - Owner, Manager, Staff roles
- ✅ **Rate Limiting** - Upstash Redis rate limiting
- ✅ **API Key Authentication** - Secure IoT device access
- ✅ **Input Validation** - Zod schema validation
- ✅ **Encryption** - Sensitive data encryption
- ✅ **Audit Logs** - Complete audit trail
- ✅ **HTTPS Enforced** - SSL/TLS required

---

## 💳 Payment Integration

### Supported Gateways

| Gateway           | Type       | Features                                  | Transaction Fee |
| ----------------- | ---------- | ----------------------------------------- | --------------- |
| **JazzCash**      | Primary    | Direct API, Recurring, Instant Settlement | 1.5-2%          |
| **EasyPaisa**     | Secondary  | Mobile-first, Backup Gateway              | 1.5-2%          |
| **Bank Transfer** | Enterprise | Manual Verification, OCR Ready            | N/A             |

### Pricing Tiers

- **Free**: ₨0 - Up to 5 animals, 1 user
- **Professional**: ₨4,999/mo - Up to 100 animals, 5 users
- **Farm**: ₨12,999/mo - Up to 500 animals, 15 users, IoT access
- **Enterprise**: Custom - Unlimited, white-label, dedicated support

**Add-on**: ₨100 per 10 animals above tier limit

---

## 🔌 IoT Integration

### Webhook Endpoint

```bash
POST /api/iot/milk-log
Headers:
  X-API-Key: mt_tenantid_xxxxxxxxxxxx
Content-Type: application/json

Body:
{
  "animalId": "animal123",
  "date": "2024-01-15",
  "session": "morning",
  "quantity": 10.5,
  "quality": 8
}

Response: 202 Accepted
{
  "success": true,
  "jobId": "job123",
  "message": "Milk log queued for processing"
}
```

### API Key Management

1. Navigate to Settings → API Keys
2. Create new API key with permissions
3. Use key in `X-API-Key` header for authentication

---

## 🌍 Internationalization

- **English** (default) - LTR layout
- **Urdu** - RTL layout with Noto Nastaliq Urdu font
- **Auto-Detection** - From URL, tenant config, or browser headers
- **Manual Override** - User can switch language anytime

---

## 📊 Development Scripts

### Code Quality

```bash
# Linting
npm run lint              # Run ESLint
npm run lint:fix          # Fix linting issues

# Formatting
npm run format            # Format code with Prettier
npm run format:check      # Check formatting

# Type checking
npm run typecheck         # Run TypeScript compiler

# Security audit
npm run audit             # Check for vulnerabilities
npm run audit:fix         # Auto-fix vulnerabilities
```

### Testing

```bash
# Unit tests
npm test                  # Run Jest tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:ci           # CI mode with coverage

# E2E tests
npm run cypress:open      # Open Cypress GUI
npm run cypress:run       # Run in headless mode
npm run cypress:ci        # CI mode

# All tests
npm run test:all          # Run all test suites
```

### Load Testing

```bash
k6 run k6-load-test.js --env BASE_URL=https://yourdomain.com
npm run load-test:animals # Enhanced animals API load test
npm run load-test:batch   # Batch operations load test
```

### Database

```bash
npm run db:generate       # Generate Drizzle migrations
npm run db:migrate        # Run migrations
npm run db:push           # Push schema to Supabase
npm run db:studio         # Open Drizzle Studio
```

**Target Metrics:**

- 95% of requests < 2s
- Error rate < 1%
- Support 500+ concurrent users

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy

### Custom Domain

1. Add domain in Vercel
2. Configure Clerk custom domains
3. Set up CNAME records for tenant subdomains

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📚 Documentation

- [Launch Checklist](./LAUNCH_CHECKLIST.md) - Pre-launch requirements
- [Final Upgrade Summary](./FINAL_UPGRADE_SUMMARY.md) - Enterprise features
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [Security Checklist](./SECURITY_CHECKLIST.md) - Security best practices
- [Phase Documentation](./PHASE*.md) - Development phases

---

## 🤝 Contributing

This is a proprietary project. For contributions or inquiries, please contact:

- **Email**: support@dairy.mtkcodex.site
- **Website**: [dairy.mtkcodex.site](https://dairy.mtkcodex.site)

---

## 📄 License

© 2024 Malik Tech. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited.

---

## 👨‍💻 Author

**Muhammad Kashif**  
_Founder & Lead Developer_  
Malik Tech

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

**Built with ❤️ in Pakistan**

[Website](https://dairy.mtkcodex.site) • [Documentation](./docs) • [Support](mailto:support@dairy.mtkcodex.site)

</div>
