# 🚀 MTK Dairy - Complete Setup Guide

> **Comprehensive guide to set up the entire project from scratch**
> 
> Estimated Time: 45-60 minutes
> 
> Cost: $0/month (All free tiers)

---

## 📑 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Account Setup](#3-account-setup)
   - [Clerk Authentication](#31-clerk-authentication)
   - [Supabase Database](#32-supabase-database)
   - [Firebase (Limited Use)](#33-firebase-limited-use)
   - [Cloudinary Storage](#34-cloudinary-storage)
   - [Upstash Redis](#35-upstash-redis)
   - [Resend Email](#36-resend-email)
   - [PostHog Analytics](#37-posthog-analytics)
   - [Sentry Error Tracking](#38-sentry-error-tracking)
4. [Environment Configuration](#4-environment-configuration)
5. [Database Setup](#5-database-setup)
6. [Create Super Admin](#6-create-super-admin)
7. [Run the Application](#7-run-the-application)
8. [Deployment](#8-deployment)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| **Node.js** | 18.x or 20.x | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.x+ | Comes with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or v20.x.x

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check Git version
git --version
# Expected: git version 2.x.x
```

### Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Prisma (for SQL highlighting)

---

## 2. Clone & Install

### Step 2.1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/malik-tech-dairy.git

# Navigate to project directory
cd malik-tech-dairy
```

### Step 2.2: Install Dependencies

```bash
# Install all dependencies
npm install

# If you encounter peer dependency issues, use:
npm install --legacy-peer-deps
```

### Step 2.3: Create Environment File

```bash
# Copy the example environment file
cp env.example .env.local

# On Windows (Command Prompt):
copy env.example .env.local

# On Windows (PowerShell):
Copy-Item env.example .env.local
```

---

## 3. Account Setup

### 3.1 Clerk Authentication

**Free Tier:** 10,000 Monthly Active Users

#### Step 1: Create Account
1. Go to [clerk.com](https://clerk.com)
2. Click **"Start Building for Free"**
3. Sign up with GitHub, Google, or Email

#### Step 2: Create Application
1. Click **"Create Application"**
2. Enter Application Name: `MTK Dairy`
3. Select sign-in options:
   - ✅ Email
   - ✅ Google
   - ✅ Phone Number (optional)
4. Click **"Create Application"**

#### Step 3: Get API Keys
1. Go to **"API Keys"** in the sidebar
2. Copy the following keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx
```

#### Step 4: Configure Webhooks (Optional but Recommended)
1. Go to **"Webhooks"** in sidebar
2. Click **"Add Endpoint"**
3. Enter URL: `https://your-domain.com/api/webhooks/clerk`
4. Select events:
   - `user.created`
   - `user.updated`
   - `organization.created`
5. Copy the **Signing Secret**:

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxx
```

#### Step 5: Configure URLs
1. Go to **"Paths"** in sidebar
2. Set the following:

| Setting | Value |
|---------|-------|
| Sign-in URL | `/sign-in` |
| Sign-up URL | `/sign-up` |
| After sign-in URL | `/dashboard` |
| After sign-up URL | `/apply` |

---

### 3.2 Supabase Database

**Free Tier:** 500MB Database, 1GB File Storage, 50MB File Uploads

#### Step 1: Create Account
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub

#### Step 2: Create Project
1. Click **"New Project"**
2. Fill in details:
   - **Name:** `malik-tech-dairy`
   - **Database Password:** Generate a strong password (SAVE THIS!)
   - **Region:** Choose closest to Pakistan (e.g., `ap-south-1` Mumbai)
3. Click **"Create new project"**
4. Wait 2-3 minutes for project setup

#### Step 3: Get Connection Details
1. Go to **"Settings"** → **"API"**
2. Copy the following:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxx
```

3. Go to **"Settings"** → **"Database"**
4. Copy the **Connection String** (URI):

```env
SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxx.supabase.co:5432/postgres
```

> ⚠️ **Important:** Replace `[YOUR-PASSWORD]` with your actual database password

#### Step 4: Run Database Migration
1. Go to **"SQL Editor"** in sidebar
2. Click **"New Query"**
3. Copy and paste the contents of `scripts/supabase-schema-update.sql`
4. Click **"Run"**
5. You should see "Success. No rows returned"

---

### 3.3 Firebase (Limited Use)

**Free Tier:** 50K reads/day, 20K writes/day, 1GB storage

> ⚠️ **Important:** Firebase is ONLY used for real-time activity feeds. All other data is stored in Supabase.

#### Step 1: Create Account
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Sign in with Google account

#### Step 2: Create Project
1. Click **"Create a project"**
2. Enter Project Name: `malik-tech-dairy`
3. Disable Google Analytics (optional, saves complexity)
4. Click **"Create Project"**

#### Step 3: Enable Firestore
1. In sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose location: `asia-south1` (Mumbai)
5. Click **"Enable"**

#### Step 4: Get Web App Credentials
1. Click the gear icon → **"Project settings"**
2. Scroll down to **"Your apps"**
3. Click **"Web"** icon (`</>`)
4. Register app name: `malik-tech-dairy-web`
5. Copy the configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=malik-tech-dairy.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=malik-tech-dairy
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=malik-tech-dairy.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxxx
```

#### Step 5: Set Up Firestore Rules
1. Go to **"Firestore Database"** → **"Rules"**
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Activity feeds - read only for authenticated users
    match /activity_feeds/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write
    }
  }
}
```

3. Click **"Publish"**

#### Step 6: Get Admin SDK Credentials (Server-side)
1. Go to **"Project settings"** → **"Service accounts"**
2. Click **"Generate new private key"**
3. Download the JSON file
4. Extract values for:

```env
FIREBASE_ADMIN_PROJECT_ID=malik-tech-dairy
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@malik-tech-dairy.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **Important:** Keep the `\n` characters in the private key

---

### 3.4 Cloudinary Storage

**Free Tier:** 25GB Storage, 25GB Bandwidth/month

#### Step 1: Create Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up For Free"**
3. Sign up with Google or Email

#### Step 2: Get API Credentials
1. After login, you'll see the Dashboard
2. Copy the credentials from **"Account Details"**:

```env
CLOUDINARY_CLOUD_NAME=dxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxxxxxx
```

#### Step 3: Create Upload Preset (Optional)
1. Go to **"Settings"** → **"Upload"**
2. Scroll to **"Upload presets"**
3. Click **"Add upload preset"**
4. Configure:
   - **Preset name:** `malik-tech-dairy`
   - **Signing Mode:** `Signed`
   - **Folder:** `malik-tech-dairy`
5. Click **"Save"**

---

### 3.5 Upstash Redis

**Free Tier:** 10,000 commands/day, 256MB storage

#### Step 1: Create Account
1. Go to [upstash.com](https://upstash.com)
2. Click **"Start for Free"**
3. Sign up with GitHub, Google, or Email

#### Step 2: Create Database
1. Click **"Create Database"**
2. Configure:
   - **Name:** `malik-tech-dairy`
   - **Type:** `Regional`
   - **Region:** `ap-south-1-1` (Mumbai)
3. Click **"Create"**

#### Step 3: Get Credentials
1. In the database dashboard, find **"REST API"** section
2. Copy:

```env
UPSTASH_REDIS_REST_URL=https://xxxxxxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=Axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 3.6 Resend Email

**Free Tier:** 100 emails/day, 3,000 emails/month

#### Step 1: Create Account
1. Go to [resend.com](https://resend.com)
2. Click **"Get Started"**
3. Sign up with GitHub or Google

#### Step 2: Verify Domain (Recommended) or Use Default
**Option A: Use Default (Quick Start)**
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Option B: Verify Your Domain (Production)**
1. Go to **"Domains"** in sidebar
2. Click **"Add Domain"**
3. Enter your domain: `maliktechdairy.com`
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually 5-10 minutes)
6. Set:
```env
RESEND_FROM_EMAIL=MTK Dairy <noreply@maliktechdairy.com>
```

#### Step 3: Get API Key
1. Go to **"API Keys"** in sidebar
2. Click **"Create API Key"**
3. Name: `malik-tech-dairy-production`
4. Permission: `Full access`
5. Copy the key:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 3.7 PostHog Analytics

**Free Tier:** 1 Million events/month

#### Step 1: Create Account
1. Go to [posthog.com](https://posthog.com)
2. Click **"Get Started - Free"**
3. Sign up with Google or GitHub

#### Step 2: Create Project
1. Enter Organization name: `Malik Tech`
2. Enter Project name: `MTK Dairy`
3. Select region: **EU** or **US**

#### Step 3: Get API Key
1. Go to **"Settings"** → **"Project"**
2. Copy the **Project API Key**:

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

> Use `https://eu.i.posthog.com` if you selected EU region

---

### 3.8 Sentry Error Tracking

**Free Tier:** 5,000 errors/month

#### Step 1: Create Account
1. Go to [sentry.io](https://sentry.io)
2. Click **"Start for Free"**
3. Sign up with GitHub or Google

#### Step 2: Create Project
1. Click **"Create Project"**
2. Select platform: **Next.js**
3. Project name: `malik-tech-dairy`
4. Click **"Create Project"**

#### Step 3: Get DSN
1. Go to **"Settings"** → **"Projects"** → **"malik-tech-dairy"**
2. Click **"Client Keys (DSN)"**
3. Copy the DSN:

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxx@o123456.ingest.sentry.io/1234567
SENTRY_DSN=https://xxxxxxxxxx@o123456.ingest.sentry.io/1234567
```

#### Step 4: Get Auth Token (For Source Maps)
1. Go to **"Settings"** → **"Auth Tokens"**
2. Click **"Create New Token"**
3. Select scopes: `project:releases`, `org:read`
4. Copy the token:

```env
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENTRY_ORG=your-org-name
SENTRY_PROJECT=malik-tech-dairy
```

---

## 4. Environment Configuration

### Complete `.env.local` File

Create or update your `.env.local` file with all the credentials you've collected:

```env
# =============================================================================
# MALIK TECH DAIRY - ENVIRONMENT CONFIGURATION
# =============================================================================

# -----------------------------------------------------------------------------
# CLERK AUTHENTICATION
# -----------------------------------------------------------------------------
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/apply

# -----------------------------------------------------------------------------
# SUPABASE DATABASE
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxx
SUPABASE_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxx.supabase.co:5432/postgres

# -----------------------------------------------------------------------------
# FIREBASE (Limited Use - Activity Feeds Only)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=malik-tech-dairy.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=malik-tech-dairy
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=malik-tech-dairy.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxxx
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://malik-tech-dairy.firebaseio.com

FIREBASE_ADMIN_PROJECT_ID=malik-tech-dairy
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@malik-tech-dairy.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# -----------------------------------------------------------------------------
# CLOUDINARY STORAGE
# -----------------------------------------------------------------------------
CLOUDINARY_CLOUD_NAME=dxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxxxxxx

# -----------------------------------------------------------------------------
# UPSTASH REDIS
# -----------------------------------------------------------------------------
UPSTASH_REDIS_REST_URL=https://xxxxxxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=Axxxxxxxxxx

# -----------------------------------------------------------------------------
# RESEND EMAIL
# -----------------------------------------------------------------------------
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=MTK Dairy <noreply@maliktechdairy.com>

# -----------------------------------------------------------------------------
# POSTHOG ANALYTICS
# -----------------------------------------------------------------------------
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# -----------------------------------------------------------------------------
# SENTRY ERROR TRACKING
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxx@o123456.ingest.sentry.io/1234567
SENTRY_DSN=https://xxxxxxxxxx@o123456.ingest.sentry.io/1234567
SENTRY_ORG=your-org
SENTRY_PROJECT=malik-tech-dairy
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxx

# -----------------------------------------------------------------------------
# PAYMENT GATEWAYS (Pakistan)
# -----------------------------------------------------------------------------
# JazzCash
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_INTEGRETY_SALT=your_salt
JAZZCASH_RETURN_URL=https://maliktechdairy.com/api/payments/jazzcash/callback

# EasyPaisa
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_HASH_KEY=your_hash_key
EASYPAISA_RETURN_URL=https://maliktechdairy.com/api/payments/easypaisa/callback

# Bank Transfer Details
BANK_ACCOUNT_NAME=MTK Dairy Pvt Ltd
BANK_ACCOUNT_NUMBER=1234567890123
BANK_NAME=Bank Alfalah
BANK_IBAN=PK12ALFH1234567890123456
BANK_BRANCH=Main Branch, Lahore

# -----------------------------------------------------------------------------
# APP CONFIGURATION
# -----------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MTK Dairy
NEXT_PUBLIC_SUPPORT_EMAIL=support@maliktechdairy.com

# Encryption Key (Generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_32_byte_hex_key_here

# Environment
NODE_ENV=development
```

### Generate Encryption Key

```bash
# On Mac/Linux:
openssl rand -hex 32

# On Windows (PowerShell):
-join ((1..32) | ForEach-Object { '{0:X2}' -f (Get-Random -Maximum 256) })

# Copy the output and paste it as ENCRYPTION_KEY
```

---

## 5. Database Setup

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project
2. Click **"SQL Editor"** in sidebar
3. Click **"New Query"**
4. Open `scripts/supabase-schema-update.sql` from this project
5. Copy the entire contents
6. Paste into the SQL editor
7. Click **"Run"** (or press Ctrl+Enter)
8. Wait for completion - should see "Success. No rows returned"

### Option B: Using Drizzle ORM

```bash
# Generate migration
npm run db:generate

# Push to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### Verify Database Setup

In Supabase SQL Editor, run:

```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:
- `animals`
- `api_keys`
- `audit_logs`
- `breeding_records`
- `custom_fields_config`
- `expenses`
- `farm_applications`
- `farm_id_sequence`
- `file_uploads`
- `health_records`
- `milk_logs`
- `payments`
- `platform_users`
- `sales`
- `subscriptions`
- `tenant_members`
- `tenants`

---

## 6. Create Super Admin

### Step 1: Sign Up as Normal User

1. Start your app: `npm run dev`
2. Go to `http://localhost:3000/sign-up`
3. Create an account with your email
4. Complete the sign-up process

### Step 2: Promote to Super Admin

In Supabase SQL Editor, run:

```sql
-- First, check your user exists
SELECT * FROM platform_users WHERE email = 'your-email@example.com';

-- If not exists, the user will be created on first login
-- After signing in once, run this to promote to super admin:
UPDATE platform_users 
SET platform_role = 'super_admin' 
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, name, platform_role 
FROM platform_users 
WHERE email = 'your-email@example.com';
```

### Step 3: Access Super Admin Dashboard

1. Sign out and sign back in
2. Navigate to `http://localhost:3000/super-admin`
3. You should now see the Super Admin dashboard

---

## 7. Run the Application

### Development Mode

```bash
# Start development server
npm run dev

# The app will be available at:
# http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run type-check` | Run TypeScript check |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run test` | Run tests |
| `npm run test:e2e` | Run E2E tests |

### Test the Application

1. **Home Page:** `http://localhost:3000`
2. **Sign Up:** `http://localhost:3000/sign-up`
3. **Sign In:** `http://localhost:3000/sign-in`
4. **Apply for Farm:** `http://localhost:3000/apply`
5. **Super Admin:** `http://localhost:3000/super-admin`
6. **Dashboard:** `http://localhost:3000/dashboard`

---

## 8. Deployment

### Deploy to Vercel (Recommended)

#### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your repository
5. Select **"malik-tech-dairy"**

#### Step 2: Configure Environment Variables

1. In project settings, go to **"Environment Variables"**
2. Add ALL variables from your `.env.local` file
3. Make sure to add them for all environments (Production, Preview, Development)

> ⚠️ **Important:** Change `NEXT_PUBLIC_APP_URL` to your Vercel domain

#### Step 3: Deploy

1. Click **"Deploy"**
2. Wait for build completion (2-5 minutes)
3. Your app is live!

#### Step 4: Configure Custom Domain (Optional)

1. Go to **"Settings"** → **"Domains"**
2. Add your domain: `maliktechdairy.com`
3. Follow DNS configuration instructions

### Update Environment Variables for Production

```env
# Update these for production
NEXT_PUBLIC_APP_URL=https://maliktechdairy.com
NODE_ENV=production

# Update callback URLs
JAZZCASH_RETURN_URL=https://maliktechdairy.com/api/payments/jazzcash/callback
EASYPAISA_RETURN_URL=https://maliktechdairy.com/api/payments/easypaisa/callback
```

---

## 9. Troubleshooting

### Common Issues

#### Issue: "Cannot find module 'drizzle-orm'"

```bash
# Solution: Install dependencies
npm install

# If issue persists:
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Database connection failed

1. Check your `SUPABASE_DATABASE_URL` is correct
2. Ensure password doesn't have special characters that need encoding
3. Try using the pooler connection string instead

#### Issue: Clerk authentication not working

1. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_`
2. Verify `CLERK_SECRET_KEY` starts with `sk_`
3. Check Clerk dashboard for any errors

#### Issue: File upload failing

1. Verify Cloudinary credentials are correct
2. Check file size (max 10MB for free tier)
3. Ensure file type is allowed (images, PDFs)

#### Issue: Emails not sending

1. Verify Resend API key is correct
2. Check if domain is verified (if using custom domain)
3. Check Resend dashboard for errors

#### Issue: Super Admin not accessible

1. Ensure user exists in `platform_users` table
2. Verify `platform_role` is set to `super_admin`
3. Sign out and sign back in

### Getting Help

- **GitHub Issues:** [Create an issue](https://github.com/your-username/malik-tech-dairy/issues)
- **Email Support:** support@maliktechdairy.com
- **Documentation:** Check the `docs/` folder

---

## 📋 Setup Checklist

Use this checklist to track your progress:

- [ ] Prerequisites installed (Node.js, npm, Git)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Clerk account created and configured
- [ ] Supabase account created and configured
- [ ] Firebase account created and configured
- [ ] Cloudinary account created and configured
- [ ] Upstash Redis account created and configured
- [ ] Resend account created and configured
- [ ] PostHog account created and configured
- [ ] Sentry account created and configured
- [ ] `.env.local` file created with all variables
- [ ] Database migration completed
- [ ] Super Admin user created
- [ ] Application running locally
- [ ] All features tested
- [ ] Deployed to Vercel (optional)

---

## 🎉 Congratulations!

You've successfully set up MTK Dairy. Your application should now be fully functional with:

- ✅ User authentication via Clerk
- ✅ PostgreSQL database via Supabase
- ✅ Real-time activity feeds via Firebase
- ✅ File storage via Cloudinary
- ✅ Caching via Upstash Redis
- ✅ Email notifications via Resend
- ✅ Analytics via PostHog
- ✅ Error tracking via Sentry
- ✅ Super Admin dashboard
- ✅ Farm application system

**Total Monthly Cost: $0** 🎉

---

*Last Updated: November 2024*
*Version: 1.0.0*
