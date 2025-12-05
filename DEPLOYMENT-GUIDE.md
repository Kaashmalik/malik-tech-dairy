# MTK Dairy Enhancement Plan - Deployment Guide

## Overview

This guide provides comprehensive deployment instructions for the MTK Dairy 2025 enhancement plan implementation, covering Phase 1 foundation and Phase 2 core features.

## 🏗️ Implementation Status

### ✅ Phase 1: Foundation (Complete)
- **Database Schema**: 9 new tables via MCP for AI features, genetics, inventory, compliance
- **Enhanced Animal API**: Advanced filtering with 15+ filter types, performance metrics integration
- **Batch Operations API**: Multi-select animal management for vaccination, treatment, movement, feeding
- **Enhanced Animal Profile**: 360° view with 6 tabs (overview, health, production, breeding, genetics, financial)
- **Chart Components**: Real-time data visualization with health trends, production analytics
- **Component Architecture**: Complete UI components with responsive design

### ✅ Phase 2: Core Value Features (Partial)
- **Feed Management API**: Advanced inventory tracking with analytics, expiry monitoring, cost optimization
- **Feed Management Dashboard**: Comprehensive overview with category breakdown, efficiency metrics
- **Nutrition Optimizer**: AI-powered feed formulation and cost optimization
- **Database Integration**: All new tables properly exported and integrated

### 🔄 Remaining Features (Estimated Effort)
- **Production Dashboards**: 2-3 days
- **Breeding Management**: 2-3 days  
- **IoT Integration**: 5-7 days
- **AI/ML Features**: 7-10 days
- **Blockchain Traceability**: 3-5 days
- **Drone Integration**: 5-7 days

---

## 🚀 Deployment Steps

### 1. Environment Setup

#### Required Environment Variables

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://gdditqkvzlpnklcoxspj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase (Legacy - for activity feeds)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mtk-dairy.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mtk-dairy
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mtk-dairy.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Cloudinary Storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dujpst04m
NEXT_PUBLIC_CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123def456

# Email Service (Resend)
RESEND_API_KEY=re_abc123def456...

# Payment Gateways
JAZZCASH_API_KEY=test_key_123
JAZZCASH_API_SECRET=test_secret_123
EASYPAISA_API_KEY=test_key_456
EASYPAISA_API_SECRET=test_secret_456

# Feature Flags
REQUIRE_ADMIN_APPROVAL=true
FREE_PLAN_ANIMAL_LIMIT=5
PROFESSIONAL_PLAN_ANIMAL_LIMIT=100
FARM_PLAN_ANIMAL_LIMIT=500
```

### 2. Database Migration

#### Apply MCP Migrations

The new database tables have been applied via MCP tools. Verify they exist:

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'genetic_profiles',
  'feed_inventory', 
  'nutrition_requirements',
  'computer_vision_records',
  'financial_accounts',
  'staff_certifications',
  'regulatory_compliance',
  'blockchain_transactions',
  'drone_flights'
);
```

#### Run Schema Updates

```bash
# Push Drizzle schema to ensure all relations are properly set up
npm run db:push

# Or run the complete migration script
psql $DATABASE_URL -f scripts/supabase-complete-migration.sql
```

### 3. Application Deployment

#### Build and Deploy to Vercel

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
# Copy all variables from .env.local
```

#### Verify Deployment

```bash
# Test API endpoints
curl https://your-domain.vercel.app/api/animals/enhanced
curl https://your-domain.vercel.app/api/feed-management/enhanced
curl https://your-domain.vercel.app/api/animals/batch-operations
```

---

## 🧪 Testing Strategy

### 1. Unit Tests (Jest)

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Key test files to create:
# - src/__tests__/api/animals/enhanced.test.ts
# - src/__tests__/api/feed-management/enhanced.test.ts
# - src/__tests__/components/animals/EnhancedAnimalProfile.test.ts
# - src/__tests__/components/feed/FeedManagementDashboard.test.ts
```

### 2. Integration Tests

```bash
# Test API integration
npm run test:integration

# Test database operations
npm run test:db

# Test authentication flow
npm run test:auth
```

### 3. E2E Tests (Cypress)

```bash
# Run E2E tests
npm run cypress:run

# Key test scenarios:
# - User registration and farm onboarding
# - Enhanced animal profile viewing
# - Batch operations execution
# - Feed management dashboard
# - Nutrition optimizer workflow
```

### 4. Load Testing (k6)

```bash
# Run load tests
k6 run scripts/load-tests/api-load-test.js

# Test scenarios:
# - Concurrent API requests (1000 users)
# - Database query performance
# - File upload performance
# - Real-time data streaming
```

---

## 🔧 Configuration

### 1. Feature Flags

Enable/disable features based on subscription plans:

```typescript
// src/lib/feature-flags.ts
export const FEATURE_FLAGS = {
  ENHANCED_ANIMAL_MANAGEMENT: true,
  FEED_MANAGEMENT: true,
  NUTRITION_OPTIMIZER: true,
  AI_HEALTH_PREDICTIONS: false, // Phase 3
  BLOCKCHAIN_TRACEABILITY: false, // Phase 3
  DRONE_MONITORING: false, // Phase 3
};
```

### 2. Subscription Plan Limits

```typescript
// src/lib/subscription-limits.ts
export const PLAN_LIMITS = {
  free: {
    animals: 5,
    users: 1,
    features: ['basic_animal_management', 'basic_milk_tracking']
  },
  professional: {
    animals: 100,
    users: 5,
    features: ['enhanced_animal_management', 'feed_management', 'basic_analytics']
  },
  farm: {
    animals: 500,
    users: 15,
    features: ['all_professional', 'iot_integration', 'advanced_analytics']
  },
  enterprise: {
    animals: -1, // unlimited
    users: -1, // unlimited
    features: ['all_features']
  }
};
```

### 3. Database Connection Pooling

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      poolSize: 10, // Adjust based on expected load
      connectionTimeoutMillis: 10000,
    }
  }
);
```

---

## 📊 Monitoring and Analytics

### 1. Application Monitoring

```typescript
// src/lib/monitoring.ts
import { Analytics } from '@vercel/analytics/react';

// Track key metrics:
// - API response times
// - Database query performance
// - User engagement with new features
// - Error rates and types
```

### 2. Database Performance

```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC;

-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Health Check Endpoints

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      enhanced_animal_management: true,
      feed_management: true,
      nutrition_optimizer: true,
    }
  });
}
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check Supabase connection
   npm run db:check
   
   # Verify environment variables
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Authentication Issues**
   ```bash
   # Verify Clerk configuration
   curl https://api.clerk.dev/v1/users -H "Authorization: Bearer $CLERK_SECRET_KEY"
   ```

3. **Missing Database Tables**
   ```sql
   -- Run migration check
   SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;
   ```

4. **Performance Issues**
   ```sql
   -- Check query performance
   EXPLAIN ANALYZE SELECT * FROM animals WHERE tenant_id = 'tenant_123';
   ```

### Rollback Procedures

```bash
# Database rollback
npm run db:rollback -- --version 20241201000000

# Application rollback
vercel rollback [deployment-url]

# Feature flag rollback
# Update src/lib/feature-flags.ts to disable problematic features
```

---

## 📈 Performance Optimization

### 1. Database Indexes

```sql
-- Create indexes for performance
CREATE INDEX idx_animals_tenant_health ON animals(tenant_id, health_status);
CREATE INDEX idx_feed_inventory_tenant_expiry ON feed_inventory(tenant_id, expiry_date);
CREATE INDEX idx_genetic_profiles_animal_id ON genetic_profiles(animal_id);
```

### 2. Caching Strategy

```typescript
// src/lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache frequently accessed data
export const cacheFeedInventory = async (tenantId: string, data: any) => {
  await redis.set(`feed:${tenantId}`, JSON.stringify(data), { ex: 300 }); // 5 minutes
};
```

### 3. CDN Configuration

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['dujpst04m.cloudinary.com'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=60' }
        ]
      }
    ];
  }
};
```

---

## 🔄 Continuous Deployment

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📞 Support and Maintenance

### Monitoring Checklist

- [ ] Daily: Check error rates and API response times
- [ ] Weekly: Review database performance and storage usage
- [ ] Monthly: Analyze user engagement and feature adoption
- [ ] Quarterly: Security audit and performance optimization

### Backup Strategy

```bash
# Database backup (Supabase handles automatically)
# Verify backup retention: 30 days

# File backup (Cloudinary handles automatically)
# Verify backup retention: 90 days

# Code backup (GitHub handles automatically)
# Ensure all branches are properly protected
```

### Security Considerations

- [ ] Rotate API keys quarterly
- [ ] Review access logs monthly
- [ ] Update dependencies regularly
- [ ] Conduct security penetration testing bi-annually

---

## 🎯 Next Steps

1. **Immediate (This Week)**
   - Deploy to staging environment
   - Run comprehensive testing suite
   - Set up monitoring and alerts

2. **Short Term (Next 2 Weeks)**
   - Deploy to production
   - Train users on new features
   - Collect feedback and iterate

3. **Medium Term (Next Month)**
   - Implement remaining Phase 2 features
   - Begin Phase 3 AI/ML development
   - Optimize performance based on usage

4. **Long Term (Next Quarter)**
   - Complete all 16 enhancement areas
   - Scale infrastructure based on growth
   - Explore advanced AI capabilities

---

## 📞 Contact

For deployment support or technical issues:
- **Development Team**: dev@maliktechdairy.com
- **Infrastructure**: infra@maliktechdairy.com
- **Product**: product@maliktechdairy.com

---

*This deployment guide covers the systematic implementation approach for the MTK Dairy 2025 enhancement plan. All Phase 1 foundation features are complete and ready for production deployment.*
