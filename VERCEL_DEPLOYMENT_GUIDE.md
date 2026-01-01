# Vercel Deployment Guide - MTK Dairy

## Quick Start

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [https://vercel.com/kaash0542-6365s-projects](https://vercel.com/kaash0542-6365s-projects)
   - Click **"Add New..."** → **"Project"**
   - Import your Git repository
   - Select the `malik-tech-dairy` repository

3. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   Go to **Settings** → **Environment Variables** and add all variables from the list below.

5. **Deploy**
   Click **"Deploy"** and wait for the build to complete.

---

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Preview**
   ```bash
   vercel
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## Required Environment Variables

Add these in **Vercel Dashboard** → **Settings** → **Environment Variables**:

### 🔐 Clerk Authentication (Required)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/apply
```

### 🗄️ Supabase Database (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://gdditqkvzlpnklcoxspj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.gdditqkvzlpnklcoxspj.supabase.co:5432/postgres
```

### 🔥 Firebase (Required - for activity feeds)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mtk-dairy.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mtk-dairy
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mtk-dairy.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://mtk-dairy-default-rtdb.firebaseio.com
FIREBASE_ADMIN_PROJECT_ID=mtk-dairy
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@mtk-dairy.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

### ☁️ Cloudinary (Required - for image storage)
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dujpst04m
CLOUDINARY_CLOUD_NAME=dujpst04m
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123def456
```

### 📧 Email Service (Optional - for notifications)
```
RESEND_API_KEY=re_abc123def456...
```

### 💳 Payment Gateways (Optional)
```
JAZZCASH_MERCHANT_ID=...
JAZZCASH_API_KEY=...
JAZZCASH_API_SECRET=...
EASYPAISA_STORE_ID=...
EASYPAISA_API_KEY=...
EASYPAISA_API_SECRET=...
XPAY_MERCHANT_ID=...
XPAY_API_KEY=...
XPAY_API_SECRET=...
```

### 🔄 Redis/Upstash (Optional - for rate limiting)
```
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 🌐 App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### 🚀 Feature Flags
```
REQUIRE_ADMIN_APPROVAL=true
FREE_PLAN_ANIMAL_LIMIT=5
PROFESSIONAL_PLAN_ANIMAL_LIMIT=100
FARM_PLAN_ANIMAL_LIMIT=500
```

### 📊 Analytics (Optional)
```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...
```

### 🤖 AI/ML (Optional)
```
OPENAI_API_KEY=sk-...
```

---

## Environment Variable Setup Instructions

### Step-by-Step in Vercel Dashboard:

1. Go to your project: [https://vercel.com/kaash0542-6365s-projects](https://vercel.com/kaash0542-6365s-projects)
2. Click on your project name
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. For each variable:
   - Enter the **Name** (e.g., `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
   - Enter the **Value** (your actual key/secret)
   - Select **Environment(s)**:
     - ✅ Production
     - ✅ Preview
     - ✅ Development (optional)
   - Click **"Save"**

### Important Notes:

- **NEXT_PUBLIC_*** variables are exposed to the browser
- **Secret keys** should NEVER be prefixed with `NEXT_PUBLIC_`
- Set variables for **Production** and **Preview** environments
- After adding variables, **redeploy** your application

---

## Build Configuration

Vercel will auto-detect Next.js, but verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto)
- **Install Command**: `npm install`
- **Node.js Version**: 18.x or 20.x (recommended)

---

## Post-Deployment Steps

### 1. Update Clerk Webhook URL

After deployment, update your Clerk webhook:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks**
3. Update webhook URL to: `https://your-app.vercel.app/api/webhooks/clerk`
4. Verify the webhook secret matches `CLERK_WEBHOOK_SECRET`

### 2. Update NEXT_PUBLIC_APP_URL

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` to your actual domain:
   ```
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
3. Redeploy the application

### 3. Verify Deployment

Test these endpoints:
- Homepage: `https://your-app.vercel.app`
- Sign In: `https://your-app.vercel.app/sign-in`
- API Health: `https://your-app.vercel.app/api/health`
- Super Admin: `https://your-app.vercel.app/super-admin`

### 4. Test Super Admin Login

- Email: `mtkdairy@gmail.com`
- Password: `MTKKaash297$`
- Should redirect to `/super-admin` dashboard

---

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `maliktechdairy.com`)
4. Follow DNS configuration instructions

### 2. Update DNS Records

Add these DNS records to your domain provider:

**For Root Domain:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For WWW Subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Update Environment Variables

After domain is verified, update:
```
NEXT_PUBLIC_APP_URL=https://maliktechdairy.com
```

---

## Cron Jobs Configuration

The project includes cron jobs configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/migration/schedule",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

These will run automatically on Vercel. No additional configuration needed.

---

## Troubleshooting

### Build Fails

1. **Check Build Logs** in Vercel Dashboard
2. **Common Issues**:
   - Missing environment variables
   - TypeScript errors
   - Memory issues (increase Node.js memory)

### Environment Variables Not Working

1. **Redeploy** after adding variables
2. **Check variable names** (case-sensitive)
3. **Verify NEXT_PUBLIC_*** prefix for client-side variables

### Database Connection Issues

1. **Verify Supabase credentials** are correct
2. **Check database URL** format
3. **Ensure RLS policies** are configured
4. **Test connection** from Supabase dashboard

### Clerk Authentication Issues

1. **Verify webhook URL** is correct
2. **Check webhook secret** matches
3. **Ensure Organizations** are enabled in Clerk
4. **Test authentication** flow

---

## Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are set in Vercel
- [ ] Code is pushed to Git repository
- [ ] Build passes locally (`npm run build`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Clerk webhook URL is updated
- [ ] Supabase database is accessible
- [ ] Firebase project is configured
- [ ] Cloudinary credentials are set
- [ ] Super admin user exists in database

---

## Quick Deploy Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs
```

---

## Support

If you encounter issues:

1. Check **Vercel Build Logs** for errors
2. Verify all **Environment Variables** are set
3. Test **API endpoints** manually
4. Check **Supabase Dashboard** for database issues
5. Review **Clerk Dashboard** for auth issues

---

**Ready to deploy?** Follow the steps above and your MTK Dairy application will be live on Vercel! 🚀

