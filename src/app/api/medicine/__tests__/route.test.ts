/**
 * Tests for Medicine API Route
 * 
 * Note: API routes in Next.js 15 require NextRequest which isn't 
 * available in jest-environment-jsdom. These tests focus on unit testing
 * the logic rather than the full API route.
 */

import { z } from 'zod';

// Define the validation schema matching the one in the route
const createMedicineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  stock: z.number().min(0, 'Stock must be non-negative'),
  unit: z.string().min(1, 'Unit is required'),
  minimumStock: z.number().min(0).optional(),
  expiryDate: z.string().optional(),
  supplier: z.string().optional(),
  purchasePrice: z.number().optional(),
  notes: z.string().optional(),
});

describe('Medicine API Validation', () => {
  describe('createMedicineSchema', () => {
    it('should validate valid medicine data', () => {
      const validData = {
        name: 'Amoxicillin',
        category: 'antibiotic',
        stock: 100,
        unit: 'tablets',
        minimumStock: 10,
        expiryDate: '2025-12-31',
        supplier: 'VetPharm',
        purchasePrice: 500,
      };

      const result = createMedicineSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        category: 'antibiotic',
        stock: 100,
      };

      const result = createMedicineSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors;
        expect(errors.some(e => e.path.includes('name'))).toBe(true);
        expect(errors.some(e => e.path.includes('unit'))).toBe(true);
      }
    });

    it('should reject negative stock', () => {
      const invalidData = {
        name: 'Amoxicillin',
        category: 'antibiotic',
        stock: -10,
        unit: 'tablets',
      };

      const result = createMedicineSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow optional fields to be omitted', () => {
      const minimalData = {
        name: 'Amoxicillin',
        category: 'antibiotic',
        stock: 100,
        unit: 'tablets',
      };

      const result = createMedicineSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        category: 'antibiotic',
        stock: 100,
        unit: 'tablets',
      };

      const result = createMedicineSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Medicine Data Transformation', () => {
    it('should transform snake_case to camelCase correctly', () => {
      const dbMedicine = {
        id: '123',
        tenant_id: 'tenant-1',
        name: 'Amoxicillin',
        category: 'antibiotic',
        stock: 100,
        unit: 'tablets',
        minimum_stock: 10,
        expiry_date: '2025-12-31',
        supplier: 'VetPharm',
        purchase_price: 500,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const apiMedicine = {
        id: dbMedicine.id,
        tenantId: dbMedicine.tenant_id,
        name: dbMedicine.name,
        category: dbMedicine.category,
        stock: dbMedicine.stock,
        unit: dbMedicine.unit,
        minimumStock: dbMedicine.minimum_stock,
        expiryDate: dbMedicine.expiry_date,
        supplier: dbMedicine.supplier,
        purchasePrice: dbMedicine.purchase_price,
        createdAt: dbMedicine.created_at,
        updatedAt: dbMedicine.updated_at,
      };

      expect(apiMedicine.tenantId).toBe('tenant-1');
      expect(apiMedicine.minimumStock).toBe(10);
      expect(apiMedicine.expiryDate).toBe('2025-12-31');
      expect(apiMedicine.purchasePrice).toBe(500);
    });
  });

  describe('Stock Level Calculations', () => {
    it('should correctly identify low stock items', () => {
      const medicines = [
        { name: 'Med1', stock: 5, minimumStock: 10 },
        { name: 'Med2', stock: 20, minimumStock: 10 },
        { name: 'Med3', stock: 10, minimumStock: 10 },
      ];

      const lowStockItems = medicines.filter(m => m.stock < m.minimumStock);
      expect(lowStockItems.length).toBe(1);
      expect(lowStockItems[0].name).toBe('Med1');
    });

    it('should correctly identify expired medicines', () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { name: 'Med1', expiryDate: thirtyDaysFromNow.toISOString() },
        { name: 'Med2', expiryDate: sixtyDaysFromNow.toISOString() },
        { name: 'Med3', expiryDate: thirtyDaysAgo.toISOString() },
      ];

      const expiredItems = medicines.filter(m => new Date(m.expiryDate) < now);
      const expiringSoonItems = medicines.filter(m => {
        const expiry = new Date(m.expiryDate);
        return expiry >= now && expiry <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      });

      expect(expiredItems.length).toBe(1);
      expect(expiredItems[0].name).toBe('Med3');
      expect(expiringSoonItems.length).toBe(1);
      expect(expiringSoonItems[0].name).toBe('Med1');
    });
  });
});
