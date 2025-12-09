# Deployment Guide - Malik Tech Dairy SaaS

## Prerequisites

1. **Node.js 18+** installed
2. **Git** installed
3. **Vercel account** (free tier works)
4. **Firebase project** created
5. **Clerk account** with Organizations enabled
6. **Upstash Redis** account (for rate limiting)
7. **Payment gateway accounts** (JazzCash/EasyPaisa/XPay)

---

## Step 1: Environment Setup

### 1.1 Clone Repository

```bash
git clone <your-repo-url>
cd malik-tech-dairy
npm install
```

### 1.2 Create `.env.local`

Copy from `env.example` and fill in all values:

```bash
cp env.example .env.local
```

Required variables:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=https://maliktechdairy.com

# Payment Gateways (optional for dev)
JAZZCASH_MERCHANT_ID=...
EASYPAISA_STORE_ID=...
XPAY_MERCHANT_ID=...

# SMS (optional)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Email (optional)
RESEND_API_KEY=...
```

---

## Step 2: Firebase Setup

### 2.1 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project: "Malik Tech Dairy"
3. Enable **Firestore Database** (start in **datastore mode**)
4. Enable **Storage**
5. Go to Project Settings → Service Accounts
6. Generate new private key → Save as JSON
7. Copy JSON content to `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`

### 2.2 Deploy Firestore Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### 2.3 Configure Storage Rules

In Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tenants/{tenantId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

---

## Step 3: Clerk Setup

### 3.1 Create Clerk Application

1. Go to https://dashboard.clerk.com
2. Create new application
3. Enable **Organizations** (for multi-tenancy)
4. Enable **Phone** authentication (for Pakistan)
5. Enable **Email** authentication
6. Copy keys to `.env.local`

### 3.2 Configure Webhook

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Subscribe to events:
   - `organization.created`
   - `organization.deleted`
   - `organizationMembership.created`
   - `organizationMembership.deleted`
4. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

---

## Step 4: Upstash Redis Setup

1. Go to https://console.upstash.com
2. Create Redis database
3. Copy REST URL and token to `.env.local`

---

## Step 5: Vercel Deployment

### 5.1 Connect Repository

1. Go to https://vercel.com
2. Import Git repository
3. Select project: `malik-tech-dairy`

### 5.2 Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add all variables from `.env.local`

### 5.3 Configure Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 5.4 Deploy

Click "Deploy" - Vercel will:

1. Install dependencies
2. Build the project
3. Deploy to production

### 5.5 Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add domain: `maliktechdairy.com`
3. Follow DNS instructions
4. Update `NEXT_PUBLIC_APP_URL` in environment variables

---

## Step 6: Post-Deployment

### 6.1 Verify Deployment

1. Visit your Vercel URL
2. Test sign-up flow
3. Create a test organization
4. Verify tenant isolation

### 6.2 Create Super Admin

In Firestore Console, manually create super admin user:

```javascript
// Collection: users
// Document ID: <clerk-user-id>
{
  email: "admin@maliktechdairy.com",
  name: "Admin",
  platformRole: "super_admin",
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### 6.3 Test Payment Integration

1. Use test mode for payment gateways
2. Test subscription flow
3. Verify webhooks

---

## Step 7: Monitoring & Maintenance

### 7.1 Add Monitoring (Recommended)

- **Sentry**: Error tracking
- **Vercel Analytics**: Performance
- **PostHog**: Product analytics

### 7.2 Set Up Backups

- **Firestore**: Daily exports to Cloud Storage
- **Database**: Automated backups via Firebase

### 7.3 SSL Certificate

Vercel automatically provides SSL certificates for all domains.

---

## Troubleshooting

### Build Fails

- Check Node.js version (18+)
- Verify all environment variables are set
- Check build logs in Vercel

### Authentication Issues

- Verify Clerk keys are correct
- Check webhook configuration
- Ensure Organizations are enabled

### Database Errors

- Verify Firebase service account key
- Check Firestore security rules
- Ensure database is in datastore mode

### Rate Limiting Not Working

- Verify Upstash Redis credentials
- Check Redis connection
- Review rate limit configuration

---

## Production Checklist

- [ ] All environment variables set
- [ ] Firestore rules deployed
- [ ] Clerk webhooks configured
- [ ] Payment gateways in production mode
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Monitoring tools set up
- [ ] Backups configured
- [ ] Super admin account created
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Documentation updated

---

## Support

For issues or questions:

- Email: support@maliktechdairy.com
- Documentation: `/docs`
- GitHub Issues: (if public repo)

---

**Last Updated**: 2024
