// MSW Request Handlers for Testing MTK Dairy APIs
import { http, HttpResponse } from 'msw';

// Mock data
const mockAnimals = [
  {
    id: 'animal-1',
    tenantId: 'tenant-1',
    tag: 'COW-001',
    name: 'Bessie',
    species: 'cow',
    breed: 'Holstein',
    gender: 'female',
    status: 'active',
    dateOfBirth: '2020-03-15',
    weight: 450,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'animal-2',
    tenantId: 'tenant-1',
    tag: 'BUF-001',
    name: 'Thunder',
    species: 'buffalo',
    breed: 'Nili-Ravi',
    gender: 'female',
    status: 'active',
    dateOfBirth: '2019-06-20',
    weight: 550,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockMilkLogs = [
  {
    id: 'milk-1',
    tenantId: 'tenant-1',
    animalId: 'animal-1',
    date: '2024-12-08',
    session: 'morning',
    quantity: 15,
    quality: 8,
    fat: 4.5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'milk-2',
    tenantId: 'tenant-1',
    animalId: 'animal-1',
    date: '2024-12-08',
    session: 'evening',
    quantity: 12,
    quality: 8,
    fat: 4.2,
    createdAt: new Date().toISOString(),
  },
];

const mockHealthRecords = [
  {
    id: 'health-1',
    tenantId: 'tenant-1',
    animalId: 'animal-1',
    type: 'vaccination',
    date: '2024-11-15',
    description: 'FMD Vaccination',
    veterinarian: 'Dr. Ahmed',
    cost: 500,
    createdAt: new Date().toISOString(),
  },
];

const mockExpenses = [
  {
    id: 'expense-1',
    tenantId: 'tenant-1',
    date: '2024-12-01',
    category: 'feed',
    description: 'Monthly cattle feed',
    amount: 50000,
    currency: 'PKR',
    createdAt: new Date().toISOString(),
  },
];

const mockSales = [
  {
    id: 'sale-1',
    tenantId: 'tenant-1',
    date: '2024-12-08',
    type: 'milk',
    quantity: 100,
    unit: 'liters',
    pricePerUnit: 150,
    total: 15000,
    currency: 'PKR',
    createdAt: new Date().toISOString(),
  },
];

export const handlers = [
  // ============================================================================
  // Animals API
  // ============================================================================
  http.get('/api/animals', ({ request }) => {
    const url = new URL(request.url);
    const species = url.searchParams.get('species');
    const status = url.searchParams.get('status');

    let filtered = [...mockAnimals];
    if (species) {
      filtered = filtered.filter(a => a.species === species);
    }
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }

    return HttpResponse.json({
      success: true,
      data: filtered,
      meta: { total: filtered.length, page: 1, limit: 20 },
    });
  }),

  http.get('/api/animals/:id', ({ params }) => {
    const animal = mockAnimals.find(a => a.id === params.id);
    if (!animal) {
      return HttpResponse.json(
        { success: false, error: 'Animal not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: animal });
  }),

  http.post('/api/animals', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newAnimal = {
      id: `animal-${Date.now()}`,
      tenantId: 'tenant-1',
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(
      { success: true, data: newAnimal, message: 'Animal created successfully' },
      { status: 201 }
    );
  }),

  http.patch('/api/animals/:id', async ({ params, request }) => {
    const animal = mockAnimals.find(a => a.id === params.id);
    if (!animal) {
      return HttpResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const updated = { ...animal, ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ success: true, data: updated, message: 'Animal updated' });
  }),

  http.delete('/api/animals/:id', ({ params }) => {
    const animal = mockAnimals.find(a => a.id === params.id);
    if (!animal) {
      return HttpResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, message: 'Animal deleted' });
  }),

  // ============================================================================
  // Milk Logs API
  // ============================================================================
  http.get('/api/milk', ({ request }) => {
    const url = new URL(request.url);
    const animalId = url.searchParams.get('animalId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    let filtered = [...mockMilkLogs];
    if (animalId) {
      filtered = filtered.filter(m => m.animalId === animalId);
    }
    if (dateFrom) {
      filtered = filtered.filter(m => m.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(m => m.date <= dateTo);
    }

    return HttpResponse.json({
      success: true,
      data: filtered,
      meta: { total: filtered.length },
    });
  }),

  http.post('/api/milk', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newLog = {
      id: `milk-${Date.now()}`,
      tenantId: 'tenant-1',
      ...body,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(
      { success: true, data: newLog, message: 'Milk log created' },
      { status: 201 }
    );
  }),

  // ============================================================================
  // Health Records API
  // ============================================================================
  http.get('/api/health/records', () => {
    return HttpResponse.json({
      success: true,
      data: mockHealthRecords,
      meta: { total: mockHealthRecords.length },
    });
  }),

  http.post('/api/health/records', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newRecord = {
      id: `health-${Date.now()}`,
      tenantId: 'tenant-1',
      ...body,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(
      { success: true, data: newRecord, message: 'Health record created' },
      { status: 201 }
    );
  }),

  // ============================================================================
  // Expenses API
  // ============================================================================
  http.get('/api/expenses', () => {
    return HttpResponse.json({
      success: true,
      data: mockExpenses,
      meta: { total: mockExpenses.length },
    });
  }),

  http.post('/api/expenses', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newExpense = {
      id: `expense-${Date.now()}`,
      tenantId: 'tenant-1',
      currency: 'PKR',
      ...body,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(
      { success: true, data: newExpense, message: 'Expense recorded' },
      { status: 201 }
    );
  }),

  // ============================================================================
  // Sales API
  // ============================================================================
  http.get('/api/sales', () => {
    return HttpResponse.json({
      success: true,
      data: mockSales,
      meta: { total: mockSales.length },
    });
  }),

  http.post('/api/sales', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newSale = {
      id: `sale-${Date.now()}`,
      tenantId: 'tenant-1',
      currency: 'PKR',
      ...body,
      total: (body.quantity as number) * (body.pricePerUnit as number),
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(
      { success: true, data: newSale, message: 'Sale recorded' },
      { status: 201 }
    );
  }),

  // ============================================================================
  // Analytics API
  // ============================================================================
  http.get('/api/analytics', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalAnimals: mockAnimals.length,
        totalMilkToday: mockMilkLogs.reduce((sum, m) => sum + m.quantity, 0),
        totalExpenses: mockExpenses.reduce((sum, e) => sum + e.amount, 0),
        totalSales: mockSales.reduce((sum, s) => sum + s.total, 0),
      },
    });
  }),

  // ============================================================================
  // Health Check
  // ============================================================================
  http.get('/api/health', () => {
    return HttpResponse.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  }),
];
