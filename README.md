# Malik Tech Dairy & Cattle Management - Multi-Tenant SaaS

Premium livestock management SaaS platform for Pakistan, supporting Cows, Buffaloes, Poultry, and extensible to Goats, Sheep, and Horses.

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Clerk (Organizations = Farms)
- **Database**: Firebase Firestore (datastore mode)
- **Storage**: Firebase Storage
- **Payments**: JazzCash + EasyPaisa + XPay (Bank Alfalah)
- **Queue**: BullMQ + Upstash Redis
- **i18n**: next-intl (English + Urdu with RTL)
- **State**: Zustand + TanStack Query

## 📋 Prerequisites

1. Node.js 18+ and npm
2. Clerk account (with Organizations enabled)
3. Firebase project (Firestore + Storage enabled)
4. Upstash Redis account (for queues and rate limiting)
5. Payment gateway accounts (JazzCash/EasyPaisa/XPay)

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
cd malik-tech-dairy
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Required variables:
- Clerk keys (from dashboard.clerk.com)
- Firebase config (from Firebase Console)
- Payment gateway credentials
- Upstash Redis URL and token
- Twilio credentials (for SMS)
- Resend API key (for emails)

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore (start in **datastore mode**)
3. Enable Storage
4. Go to Project Settings → Service Accounts
5. Generate a new private key and add to `.env.local`
6. Deploy security rules: `firebase deploy --only firestore:rules` (using `firebase.rules`)

### 4. Clerk Setup

1. Sign up at https://clerk.com
2. Create a new application
3. Enable **Organizations** (for multi-tenancy)
4. Enable Phone authentication (for Pakistan)
5. Enable Google OAuth (optional)
6. Copy publishable and secret keys to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (sign-in, sign-up)
│   ├── (onboarding)/      # Tenant onboarding
│   ├── (dashboard)/       # Main app (protected)
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── providers/       # Context providers
├── lib/                  # Utilities
│   ├── firebase/         # Firebase config
│   ├── payments/         # Payment gateway integrations
│   └── workers/          # BullMQ queues
├── hooks/                # Custom React hooks
├── store/                # Zustand stores
├── types/                # TypeScript types
└── i18n/                 # Internationalization

firebase.rules            # Firestore security rules
messages/                 # Translation files (en.json, ur.json)
```

## 🔐 Security

- Multi-tenant data isolation via Firestore security rules
- Tenant context validation in middleware
- Rate limiting via Upstash
- Clerk authentication with RBAC

## 💳 Payment Integration

The platform supports three Pakistani payment gateways:
- **JazzCash**: Most popular in rural areas
- **EasyPaisa**: Mobile-first payments
- **XPay (Bank Alfalah)**: Best UI, recommended

All support recurring subscriptions via tokenization.

## 🌍 Internationalization

- English (default)
- Urdu (RTL support with Noto Nastaliq Urdu font)

Switch language via tenant config or user preference.

## 📱 PWA Support

Progressive Web App support will be added in Phase 7, enabling offline functionality.

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

### Custom Domain Setup

1. Add domain in Vercel
2. Configure Clerk custom domains
3. Set up CNAME records for tenant subdomains

## 📄 License

© 2024 Malik Tech. All rights reserved.

## 👨‍💻 Author

Muhammad Kashif - Malik Tech

---

**Status**: Phase 1 Complete ✅

Next: Phase 2 - Multi-Tenant Core (Clerk + Firestore Isolation)
