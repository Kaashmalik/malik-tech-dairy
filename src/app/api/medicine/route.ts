// API Route: Medicine Inventory Management (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schemas
const createMedicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  category: z.enum([
    'antibiotic',
    'antiparasitic',
    'vaccine',
    'supplement',
    'painkiller',
    'anti-inflammatory',
    'hormonal',
    'other',
  ]),
  stock: z.number().min(0).default(0),
  unit: z.string().default('ml'),
  expiryDate: z.string().optional(),
  supplier: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  batchNumber: z.string().optional(),
  storageLocation: z.string().optional(),
  minimumStock: z.number().min(0).default(10),
  notes: z.string().optional(),
});

// GET: List all medicines for tenant
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const { searchParams } = new URL(req.url);
      
      const category = searchParams.get('category');
      const status = searchParams.get('status'); // 'low', 'adequate', 'expired'
      const search = searchParams.get('search');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('medicine_inventory')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: medicines, error } = await query as { data: any[] | null; error: any };

      if (error) {
        // Handle table not existing gracefully
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({
            success: true,
            medicines: [],
            stats: { total: 0, lowStock: 0, expiringSoon: 0, expired: 0, totalValue: 0 },
            message: 'Medicine inventory not yet configured',
          });
        }
        if (process.env.NODE_ENV === 'development') {
        }
        return NextResponse.json(
          { success: true, medicines: [], stats: { total: 0, lowStock: 0, expiringSoon: 0, expired: 0, totalValue: 0 } },
          { status: 200 }
        );
      }

      // Transform and add status based on stock levels
      const now = new Date();
      const transformedMedicines = (medicines || []).map((med: any) => {
        const expiryDate = med.expiry_date ? new Date(med.expiry_date) : null;
        const isExpired = expiryDate && expiryDate < now;
        const isExpiringSoon = expiryDate && !isExpired && 
          (expiryDate.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000; // 30 days
        
        let stockStatus = 'adequate';
        if (med.stock <= 0) {
          stockStatus = 'out_of_stock';
        } else if (med.stock <= (med.minimum_stock || 10)) {
          stockStatus = 'low';
        }

        return {
          id: med.id,
          tenantId: med.tenant_id,
          name: med.name,
          category: med.category,
          stock: med.stock,
          unit: med.unit,
          expiryDate: med.expiry_date,
          supplier: med.supplier,
          purchasePrice: med.purchase_price,
          sellingPrice: med.selling_price,
          batchNumber: med.batch_number,
          storageLocation: med.storage_location,
          minimumStock: med.minimum_stock,
          notes: med.notes,
          status: stockStatus,
          isExpired,
          isExpiringSoon,
          createdAt: med.created_at,
          updatedAt: med.updated_at,
        };
      });

      // Filter by status if requested
      let filteredMedicines = transformedMedicines;
      if (status === 'low') {
        filteredMedicines = transformedMedicines.filter((m: any) => m.status === 'low' || m.status === 'out_of_stock');
      } else if (status === 'expired') {
        filteredMedicines = transformedMedicines.filter((m: any) => m.isExpired);
      } else if (status === 'expiring') {
        filteredMedicines = transformedMedicines.filter((m: any) => m.isExpiringSoon);
      }

      // Calculate stats
      const stats = {
        total: transformedMedicines.length,
        lowStock: transformedMedicines.filter((m: any) => m.status === 'low' || m.status === 'out_of_stock').length,
        expiringSoon: transformedMedicines.filter((m: any) => m.isExpiringSoon).length,
        expired: transformedMedicines.filter((m: any) => m.isExpired).length,
        totalValue: transformedMedicines.reduce((sum: number, m: any) => 
          sum + ((m.stock || 0) * (m.purchasePrice || 0)), 0),
      };

      return NextResponse.json({
        success: true,
        medicines: filteredMedicines,
        stats,
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Internal server error', medicines: [] },
        { status: 500 }
      );
    }
  })(request);
}

// POST: Create new medicine
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const body = await req.json();

      // Validate with Zod
      let validated;
      try {
        validated = createMedicineSchema.parse(body);
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      const medicineId = uuidv4();

      const medicineData = {
        id: medicineId,
        tenant_id: context.tenantId,
        name: validated.name,
        category: validated.category,
        stock: validated.stock,
        unit: validated.unit,
        expiry_date: validated.expiryDate || null,
        supplier: validated.supplier || null,
        purchase_price: validated.purchasePrice || null,
        selling_price: validated.sellingPrice || null,
        batch_number: validated.batchNumber || null,
        storage_location: validated.storageLocation || null,
        minimum_stock: validated.minimumStock,
        notes: validated.notes || null,
        created_at: now,
        updated_at: now,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newMedicine, error } = (await (supabase as any)
        .from('medicine_inventory')
        .insert(medicineData)
        .select()
        .single()) as { data: any; error: any };

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to create medicine', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Medicine added successfully',
        medicine: {
          id: newMedicine.id,
          name: newMedicine.name,
          category: newMedicine.category,
          stock: newMedicine.stock,
          unit: newMedicine.unit,
        },
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
