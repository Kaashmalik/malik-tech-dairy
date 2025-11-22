<div align="center">

# 🐄 Malik Tech Dairy

### **Empowering Dairy Farms with Technology**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

**Enterprise-Ready Multi-Tenant SaaS Platform for Livestock Management**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Support](#-support)

</div>

---

## 🎯 Overview

**Malik Tech Dairy** is a comprehensive, enterprise-ready SaaS platform designed specifically for dairy and livestock management in Pakistan. Built with modern technologies, it supports multi-tenancy, real-time analytics, IoT integration, and multiple payment gateways optimized for the Pakistani market.

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

### 1. Clone the Repository

```bash
git clone https://github.com/Kaashmalik/malik-tech-dairy.git
cd malik-tech-dairy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env.local
```

**Required Environment Variables:**

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payment Gateways
JAZZCASH_MERCHANT_ID=your_merchant_id
EASYPAISA_STORE_ID=your_store_id

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Email
RESEND_API_KEY=re_...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key
```

See `env.example` for the complete list.

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore (start in **datastore mode**)
3. Enable Storage
4. Go to Project Settings → Service Accounts
5. Generate a new private key and add to `.env.local`
6. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 5. Supabase Setup

1. Create a Supabase project at [Supabase](https://supabase.com)
2. Run the migration script:
   ```bash
   npx tsx scripts/migrate-to-supabase.ts
   ```
3. Or use the SQL migration: `scripts/supabase-migration.sql`

### 6. Run Development Server

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

| Gateway | Type | Features | Transaction Fee |
|---------|------|----------|----------------|
| **JazzCash** | Primary | Direct API, Recurring, Instant Settlement | 1.5-2% |
| **EasyPaisa** | Secondary | Mobile-first, Backup Gateway | 1.5-2% |
| **Bank Transfer** | Enterprise | Manual Verification, OCR Ready | N/A |

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

## 📊 Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run cypress:open
```

### Load Testing

```bash
k6 run k6-load-test.js --env BASE_URL=https://yourdomain.com
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

- **Email**: support@maliktechdairy.com
- **Website**: [maliktechdairy.com](https://maliktechdairy.com)

---

## 📄 License

© 2024 Malik Tech. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited.

---

## 👨‍💻 Author

**Muhammad Kashif**  
*Founder & Lead Developer*  
Malik Tech

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

**Built with ❤️ in Pakistan**

[Website](https://maliktechdairy.com) • [Documentation](./docs) • [Support](mailto:support@maliktechdairy.com)

</div>
