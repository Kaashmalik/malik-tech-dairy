# MTK Dairy Enhancement Plan - Testing Strategy

## Overview

This document provides comprehensive testing guidelines for the MTK Dairy 2025 enhancement plan implementation, covering all Phase 1 foundation features and Phase 2 core features.

## 🧪 Test Categories

### 1. Unit Tests (Jest)

#### API Route Tests

```typescript
// src/__tests__/api/animals/enhanced.test.ts
describe('Enhanced Animals API', () => {
  describe('GET /api/animals/enhanced', () => {
    it('should filter animals by age range 0-365 days', async () => {
      const response = await GET(
        new Request('http://localhost:3000/api/animals/enhanced?ageMin=0&ageMax=365')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.animals).toBeDefined();

      // Verify all returned animals are under 1 year old
      data.data.animals.forEach(animal => {
        const ageInDays =
          (Date.now() - new Date(animal.birthDate).getTime()) / (1000 * 60 * 60 * 24);
        expect(ageInDays).toBeLessThanOrEqual(365);
      });
    });

    it('should filter animals by health status', async () => {
      const response = await GET(
        new Request('http://localhost:3000/api/animals/enhanced?healthStatus=healthy')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      data.data.animals.forEach(animal => {
        expect(animal.healthStatus).toBe('healthy');
      });
    });

    it('should handle empty filter results gracefully', async () => {
      const response = await GET(
        new Request('http://localhost:3000/api/animals/enhanced?search=nonexistent_animal')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.animals).toHaveLength(0);
      expect(data.data.pagination.totalCount).toBe(0);
    });

    it('should validate tenant isolation', async () => {
      // Test that users can only access their own animals
      const mockUserId = 'user_123';
      const mockTenantId = 'tenant_456';

      jest.mocked(getTenantContext).mockResolvedValue({
        tenantId: mockTenantId,
        userId: mockUserId,
      });

      const response = await GET(new Request('http://localhost:3000/api/animals/enhanced'));
      const data = await response.json();

      // Verify all animals belong to the correct tenant
      data.data.animals.forEach(animal => {
        expect(animal.tenantId).toBe(mockTenantId);
      });
    });
  });
});
```

```typescript
// src/__tests__/api/feed-management/enhanced.test.ts
describe('Enhanced Feed Management API', () => {
  describe('GET /api/feed-management/enhanced', () => {
    it('should calculate inventory analytics correctly', async () => {
      const response = await GET(new Request('http://localhost:3000/api/feed-management/enhanced'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.analytics).toBeDefined();
      expect(data.data.analytics.totalValue).toBeGreaterThanOrEqual(0);
      expect(data.data.analytics.lowStockItems).toBeGreaterThanOrEqual(0);
      expect(data.data.analytics.expiringItems).toBeGreaterThanOrEqual(0);
    });

    it('should filter low stock items', async () => {
      const response = await GET(
        new Request('http://localhost:3000/api/feed-management/enhanced?lowStock=true')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      data.data.feedItems.forEach(item => {
        expect(item.currentStock).toBeLessThanOrEqual(item.reorderLevel);
      });
    });

    it('should identify expiring items within 30 days', async () => {
      const response = await GET(
        new Request('http://localhost:3000/api/feed-management/enhanced?expiringSoon=true')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      data.data.feedItems.forEach(item => {
        const daysUntilExpiry = Math.ceil(
          (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        expect(daysUntilExpiry).toBeLessThanOrEqual(30);
      });
    });
  });
});
```

```typescript
// src/__tests__/api/animals/batch-operations.test.ts
describe('Batch Operations API', () => {
  describe('POST /api/animals/batch-operations', () => {
    it('should handle batch vaccination successfully', async () => {
      const requestBody = {
        operation: 'vaccination',
        animalIds: ['animal_1', 'animal_2'],
        operationData: {
          vaccineName: 'Test Vaccine',
          vaccineType: 'test',
          batchNumber: 'TEST001',
          manufacturer: 'Test Lab',
          administeredBy: 'vet_123',
        },
        priority: 'medium',
        createTask: true,
      };

      const response = await POST(
        new Request('http://localhost:3000/api/animals/batch-operations', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.operationResults).toHaveLength(2);
      expect(data.data.summary.successful).toBe(2);
      expect(data.data.summary.failed).toBe(0);
    });

    it('should handle batch operation rollback on failure', async () => {
      // Mock database failure for second animal
      jest.spyOn(db, 'insert').mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const requestBody = {
        operation: 'treatment',
        animalIds: ['animal_1', 'animal_2'],
        operationData: {
          treatmentName: 'Test Treatment',
          dosage: '10ml',
          prescribedBy: 'vet_123',
        },
      };

      const response = await POST(
        new Request('http://localhost:3000/api/animals/batch-operations', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );

      const data = await response.json();
      expect(data.success).toBe(true); // Partial success
      expect(data.data.summary.successful).toBe(1);
      expect(data.data.summary.failed).toBe(1);
    });

    it('should validate animal ownership before batch operations', async () => {
      const requestBody = {
        operation: 'vaccination',
        animalIds: ['animal_from_other_tenant'],
        operationData: {
          vaccineName: 'Test Vaccine',
        },
      };

      const response = await POST(
        new Request('http://localhost:3000/api/animals/batch-operations', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found or do not belong to your tenant');
    });
  });
});
```

#### Component Tests

```typescript
// src/__tests__/components/animals/EnhancedAnimalProfile.test.tsx
describe('EnhancedAnimalProfile', () => {
  it('should display animal health score with correct color coding', async () => {
    const mockAnimal = {
      id: 'animal_1',
      name: 'Test Cow',
      healthScore: 85,
      healthStatus: 'healthy'
    };

    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: mockAnimal
      })
    } as Response);

    render(<EnhancedAnimalProfile animalId="animal_1" />);

    await waitFor(() => {
      expect(screen.getByText('85/100')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toHaveClass('text-green-600');
    });
  });

  it('should handle loading state correctly', () => {
    render(<EnhancedAnimalProfile animalId="animal_1" />);

    expect(screen.getByText('Animal not found')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading indicator
  });

  it('should display error state when animal not found', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({
        success: false,
        error: 'Animal not found'
      })
    } as Response);

    render(<EnhancedAnimalProfile animalId="nonexistent" />);

    await waitFor(() => {
      expect(screen.getByText('Animal not found')).toBeInTheDocument();
    });
  });
});
```

### 2. Integration Tests

#### Database Integration

```typescript
// src/__tests__/integration/database.test.ts
describe('Database Integration', () => {
  it('should create and retrieve genetic profiles', async () => {
    const testProfile = {
      id: 'genetic_test_1',
      tenantId: 'tenant_123',
      animalId: 'animal_123',
      breedScore: 85,
      milkYieldPotential: 90,
      geneticValueIndex: 88,
    };

    // Insert test data
    await db.insert(genetic_profiles).values(testProfile);

    // Retrieve data
    const result = await db
      .select()
      .from(genetic_profiles)
      .where(eq(genetic_profiles.id, testProfile.id));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(testProfile);

    // Cleanup
    await db.delete(genetic_profiles).where(eq(genetic_profiles.id, testProfile.id));
  });

  it('should enforce foreign key constraints', async () => {
    const invalidProfile = {
      id: 'genetic_invalid',
      tenantId: 'nonexistent_tenant',
      animalId: 'nonexistent_animal',
      breedScore: 80,
    };

    await expect(db.insert(genetic_profiles).values(invalidProfile)).rejects.toThrow();
  });

  it('should handle tenant isolation correctly', async () => {
    const tenant1Id = 'tenant_1';
    const tenant2Id = 'tenant_2';

    // Insert data for different tenants
    await db.insert(feed_inventory).values({
      id: 'feed_1',
      tenantId: tenant1Id,
      ingredientName: 'Test Feed 1',
    });

    await db.insert(feed_inventory).values({
      id: 'feed_2',
      tenantId: tenant2Id,
      ingredientName: 'Test Feed 2',
    });

    // Query tenant 1 data
    const tenant1Data = await db
      .select()
      .from(feed_inventory)
      .where(eq(feed_inventory.tenantId, tenant1Id));

    expect(tenant1Data).toHaveLength(1);
    expect(tenant1Data[0].tenantId).toBe(tenant1Id);

    // Cleanup
    await db.delete(feed_inventory).where(inArray(feed_inventory.id, ['feed_1', 'feed_2']));
  });
});
```

#### API Integration

```typescript
// src/__tests__/integration/api.test.ts
describe('API Integration', () => {
  it('should handle complete animal management workflow', async () => {
    // 1. Create animal
    const createResponse = await fetch('/api/animals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Integration Test Cow',
        tag: 'INT001',
        species: 'cow',
        breed: 'Holstein',
      }),
    });

    const createData = await createResponse.json();
    expect(createData.success).toBe(true);
    const animalId = createData.data.id;

    // 2. Get enhanced animal profile
    const profileResponse = await fetch(`/api/animals/enhanced?id=${animalId}`);
    const profileData = await profileResponse.json();
    expect(profileData.success).toBe(true);
    expect(profileData.data.id).toBe(animalId);

    // 3. Perform batch operation
    const batchResponse = await fetch('/api/animals/batch-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'vaccination',
        animalIds: [animalId],
        operationData: {
          vaccineName: 'Integration Test Vaccine',
          vaccineType: 'test',
        },
      }),
    });

    const batchData = await batchResponse.json();
    expect(batchData.success).toBe(true);
    expect(batchData.data.summary.successful).toBe(1);

    // 4. Cleanup
    await fetch(`/api/animals/${animalId}`, { method: 'DELETE' });
  });
});
```

### 3. End-to-End Tests (Cypress)

```typescript
// cypress/e2e/enhanced-animal-management.cy.ts
describe('Enhanced Animal Management E2E', () => {
  beforeEach(() => {
    cy.login('kaash0542@gmail.com');
    cy.visit('/dashboard/animals');
  });

  it('should display enhanced animal profile with all tabs', () => {
    // Navigate to animal profile
    cy.get('[data-testid="animal-row"]').first().click();

    // Verify overview tab
    cy.get('[data-testid="overview-tab"]').should('be.visible');
    cy.get('[data-testid="health-score"]').should('contain.text', '/100');

    // Test health tab
    cy.get('[data-testid="health-tab"]').click();
    cy.get('[data-testid="health-chart"]').should('be.visible');

    // Test production tab
    cy.get('[data-testid="production-tab"]').click();
    cy.get('[data-testid="milk-production-chart"]').should('be.visible');

    // Test genetics tab
    cy.get('[data-testid="genetics-tab"]').click();
    cy.get('[data-testid="genetic-profile-card"]').should('be.visible');

    // Test financial tab
    cy.get('[data-testid="financial-tab"]').click();
    cy.get('[data-testid="financial-metrics-card"]').should('be.visible');
  });

  it('should perform batch operations on multiple animals', () => {
    // Select multiple animals
    cy.get('[data-testid="animal-checkbox"]').first().check();
    cy.get('[data-testid="animal-checkbox"]').eq(1).check();

    // Click batch operations
    cy.get('[data-testid="batch-operations-button"]').click();

    // Select vaccination operation
    cy.get('[data-testid="vaccination-option"]').click();

    // Fill vaccination details
    cy.get('[data-testid="vaccine-name"]').type('E2E Test Vaccine');
    cy.get('[data-testid="vaccine-type"]').type('test');

    // Execute batch operation
    cy.get('[data-testid="execute-batch-operation"]').click();

    // Verify success message
    cy.get('[data-testid="batch-operation-success"]').should(
      'contain.text',
      'Successfully processed'
    );
  });

  it('should filter animals with advanced criteria', () => {
    // Open filters
    cy.get('[data-testid="advanced-filters"]').click();

    // Set age filter
    cy.get('[data-testid="age-min"]').type('0');
    cy.get('[data-testid="age-max"]').type('365');

    // Set health status filter
    cy.get('[data-testid="health-status-filter"]').select('healthy');

    // Apply filters
    cy.get('[data-testid="apply-filters"]').click();

    // Verify filtered results
    cy.get('[data-testid="animal-row"]').each($row => {
      cy.wrap($row).find('[data-testid="health-status"]').should('contain.text', 'healthy');
    });
  });
});
```

```typescript
// cypress/e2e/feed-management.cy.ts
describe('Feed Management E2E', () => {
  beforeEach(() => {
    cy.login('kaash0542@gmail.com');
    cy.visit('/dashboard/feed-management');
  });

  it('should display feed analytics dashboard', () => {
    // Verify key metrics
    cy.get('[data-testid="total-inventory-value"]').should('be.visible');
    cy.get('[data-testid="low-stock-alerts"]').should('be.visible');
    cy.get('[data-testid="expiring-items"]').should('be.visible');

    // Test category breakdown
    cy.get('[data-testid="category-chart"]').should('be.visible');

    // Test efficiency metrics
    cy.get('[data-testid="efficiency-metrics"]').should('be.visible');
  });

  it('should manage feed inventory items', () => {
    // Navigate to inventory tab
    cy.get('[data-testid="inventory-tab"]').click();

    // Add new feed item
    cy.get('[data-testid="add-feed-item"]').click();
    cy.get('[data-testid="ingredient-name"]').type('E2E Test Feed');
    cy.get('[data-testid="category"]').select('concentrate');
    cy.get('[data-testid="current-stock"]').type('1000');
    cy.get('[data-testid="unit-cost"]').type('50');

    // Save item
    cy.get('[data-testid="save-feed-item"]').click();

    // Verify item appears in table
    cy.get('[data-testid="feed-table"]').should('contain.text', 'E2E Test Feed');
  });

  it('should optimize nutrition plans', () => {
    // Navigate to nutrition tab
    cy.get('[data-testid="nutrition-tab"]').click();

    // Create new nutrition plan
    cy.get('[data-testid="create-nutrition-plan"]').click();
    cy.get('[data-testid="plan-name"]').type('E2E Test Plan');
    cy.get('[data-testid="animal-group"]').select('Lactating Cows');
    cy.get('[data-testid="target-production"]').type('30+ L/day');

    // Run optimization
    cy.get('[data-testid="run-optimization"]').click();

    // Verify optimization results
    cy.get('[data-testid="optimization-results"]').should('be.visible');
    cy.get('[data-testid="efficiency-score"]').should('be.visible');
  });
});
```

### 4. Load Testing (k6)

```javascript
// scripts/load-tests/enhanced-animals-api.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'], // Error rate under 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test enhanced animals API
  let response = http.get(`${BASE_URL}/api/animals/enhanced?page=1&limit=20`, {
    headers: {
      Authorization: 'Bearer test_token',
      'Content-Type': 'application/json',
    },
  });

  let success = check(response, {
    'enhanced animals status is 200': r => r.status === 200,
    'enhanced animals response time < 500ms': r => r.timings.duration < 500,
    'enhanced animals has data': r => JSON.parse(r.body).success === true,
  });

  errorRate.add(!success);

  // Test feed management API
  response = http.get(`${BASE_URL}/api/feed-management/enhanced`, {
    headers: {
      Authorization: 'Bearer test_token',
      'Content-Type': 'application/json',
    },
  });

  success = check(response, {
    'feed management status is 200': r => r.status === 200,
    'feed management response time < 500ms': r => r.timings.duration < 500,
    'feed management has analytics': r => JSON.parse(r.body).data.analytics !== undefined,
  });

  errorRate.add(!success);

  sleep(1);
}

export function handleSummary(data) {
  console.log('Enhanced Animals API Load Test Results:');
  console.log(`95th percentile response time: ${data.http_req_duration['p(95)']}ms`);
  console.log(`Error rate: ${(data.http_req_failed.rate * 100).toFixed(2)}%`);
  console.log(`Requests per second: ${data.http_reqs_per_second.mean}`);
}
```

```javascript
// scripts/load-tests/batch-operations.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 concurrent users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 0 }, // Ramp down
  ],
};

export default function () {
  const batchPayload = JSON.stringify({
    operation: 'vaccination',
    animalIds: ['animal_1', 'animal_2', 'animal_3'],
    operationData: {
      vaccineName: 'Load Test Vaccine',
      vaccineType: 'test',
      batchNumber: 'LT001',
      manufacturer: 'Load Test Lab',
    },
    priority: 'medium',
    createTask: true,
  });

  const response = http.post('http://localhost:3000/api/animals/batch-operations', batchPayload, {
    headers: {
      Authorization: 'Bearer test_token',
      'Content-Type': 'application/json',
    },
  });

  check(response, {
    'batch operations status is 200': r => r.status === 200,
    'batch operations completed successfully': r => {
      const data = JSON.parse(r.body);
      return data.success === true && data.data.summary.successful > 0;
    },
    'batch operations response time < 1000ms': r => r.timings.duration < 1000,
  });

  sleep(2);
}
```

### 5. Performance Tests

```typescript
// src/__tests__/performance/database-queries.test.ts
describe('Database Query Performance', () => {
  it('should execute complex animal queries within time limits', async () => {
    const startTime = performance.now();

    const result = await db
      .select({
        animal: animals,
        genetic: genetic_profiles,
        health: sql`(
          SELECT JSON_BUILD_OBJECT(
            'lastCheck', MAX(${health_records.date}),
            'vaccinationCount', COUNT(CASE WHEN ${health_records.type} = 'vaccination' THEN 1 END)
          )
        )`,
      })
      .from(animals)
      .leftJoin(genetic_profiles, eq(animals.id, genetic_profiles.animal_id))
      .leftJoin(health_records, eq(animals.id, health_records.animalId))
      .where(eq(animals.tenantId, 'test_tenant'))
      .limit(100);

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('should handle large feed inventory queries efficiently', async () => {
    const startTime = performance.now();

    const result = await db
      .select()
      .from(feed_inventory)
      .where(
        and(
          eq(feed_inventory.tenantId, 'test_tenant'),
          eq(feed_inventory.isActive, true),
          sql`${feed_inventory.currentStock} <= ${feed_inventory.reorderLevel}`
        )
      )
      .orderBy(desc(feed_inventory.expiryDate));

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    expect(queryTime).toBeLessThan(500); // Should complete within 500ms
  });
});
```

### 6. Security Tests

```typescript
// src/__tests__/security/tenant-isolation.test.ts
describe('Security - Tenant Isolation', () => {
  it('should prevent cross-tenant data access', async () => {
    const tenant1User = { userId: 'user_1', tenantId: 'tenant_1' };
    const tenant2User = { userId: 'user_2', tenantId: 'tenant_2' };

    // Mock tenant 1 user
    jest.mocked(getTenantContext).mockResolvedValue(tenant1User);

    const response1 = await GET(new Request('http://localhost:3000/api/animals/enhanced'));
    const data1 = await response1.json();

    // Mock tenant 2 user
    jest.mocked(getTenantContext).mockResolvedValue(tenant2User);

    const response2 = await GET(new Request('http://localhost:3000/api/animals/enhanced'));
    const data2 = await response2.json();

    // Verify data isolation
    const tenant1AnimalIds = data1.data.animals.map((a: any) => a.id);
    const tenant2AnimalIds = data2.data.animals.map((a: any) => a.id);

    expect(tenant1AnimalIds).not.toEqual(expect.arrayContaining(tenant2AnimalIds));
  });

  it('should validate authentication on all API endpoints', async () => {
    const endpoints = [
      '/api/animals/enhanced',
      '/api/feed-management/enhanced',
      '/api/animals/batch-operations',
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      expect(response.status).toBe(401);
    }
  });
});
```

## 🚀 Test Execution

### Running Tests

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# Integration tests
npm run test:integration

# E2E tests
npm run cypress:run

# Load tests
k6 run scripts/load-tests/enhanced-animals-api.js

# Performance tests
npm run test:performance

# Security tests
npm run test:security

# All tests
npm run test:all
```

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run E2E tests
        run: npm run cypress:run

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 📊 Test Coverage Requirements

### Minimum Coverage Targets

- **API Routes**: 90% line coverage, 85% branch coverage
- **Components**: 85% line coverage, 80% branch coverage
- **Database Operations**: 95% line coverage
- **Utility Functions**: 100% line coverage

### Critical Test Scenarios

1. **Tenant Isolation**: All data access must be tenant-scoped
2. **Authentication**: All endpoints must validate auth tokens
3. **Data Validation**: All inputs must be validated and sanitized
4. **Error Handling**: All error paths must be tested
5. **Performance**: Critical queries must meet performance benchmarks
6. **Batch Operations**: Partial failures must be handled correctly

## 🔧 Test Data Management

### Test Database Setup

```typescript
// scripts/setup-test-db.ts
export async function setupTestDatabase() {
  // Create test schema
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS test_schema`);

  // Seed test data
  await seedTestData();

  // Create test users
  await createTestUsers();
}

export async function cleanupTestDatabase() {
  // Clean up test data
  await db.execute(sql`DROP SCHEMA IF EXISTS test_schema CASCADE`);
}
```

### Mock Data Generation

```typescript
// scripts/generate-mock-data.ts
export function generateMockAnimals(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `test_animal_${i}`,
    name: `Test Animal ${i}`,
    tag: `TEST${String(i).padStart(3, '0')}`,
    species: 'cow',
    breed: 'Holstein',
    birthDate: new Date(2023 - Math.floor(Math.random() * 5), 0, 1),
    healthScore: 70 + Math.floor(Math.random() * 30),
    tenantId: 'test_tenant',
  }));
}
```

---

## 📞 Test Support

For testing issues or questions:

- **Development Team**: dev@maliktechdairy.com
- **QA Team**: qa@maliktechdairy.com

---

_This testing strategy ensures comprehensive coverage of all Phase 1 and Phase 2 features, guaranteeing production readiness for the MTK Dairy enhancement plan._
