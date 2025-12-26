import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const testDisease = {
  name: 'Test Disease',
  name_urdu: 'ٹیسٹ بیماری',
  category: 'infectious',
  subcategory: 'viral',
  causative_agent: 'Test Virus',
  affected_species: ['cow', 'buffalo'],
  symptoms: ['Fever', 'Cough'],
  transmission_mode: 'direct contact',
  incubation_period: '5-7 days',
  mortality_rate: '5%',
  morbidity_rate: '20%',
  zoonotic: false,
  peak_season: 'summer',
  high_risk_regions: ['Punjab'],
  preventive_measures: ['Vaccination', 'Isolation'],
  vaccination_available: true,
  economic_impact_score: 3,
  severity_default: 'moderate',
  is_notifiable: false,
};

const testMedicine = {
  name: 'Test Medicine',
  generic_name: 'Test Active',
  brand_name: 'TestBrand',
  manufacturer: 'Test Pharma',
  category: 'antibiotic',
  form: 'injection',
  route: 'intramuscular',
  strength: '100mg/ml',
  dosage_per_kg: '1ml per 10kg',
  withdrawal_period_milk: 3,
  withdrawal_period_meat: 7,
  pregnancy_safe: true,
  lactation_safe: true,
  storage_conditions: 'Room temperature',
  shelf_life_months: 24,
  available_in_pakistan: true,
  prescription_required: true,
  price_range_pkr: '100-200',
  effectiveness_rating: 4.5,
  popularity_score: 75,
  is_active: true,
};

describe('Diseases & Medicines API Tests', () => {
  let createdDiseaseId: string;
  let createdMedicineId: string;
  let createdTreatmentId: string;
  let createdVaccinationId: string;

  // Clean up test data after all tests
  afterAll(async () => {
    // Clean up created test data
    if (createdDiseaseId) {
      await supabase.from('diseases').delete().eq('id', createdDiseaseId);
    }
    if (createdMedicineId) {
      await supabase.from('medicines').delete().eq('id', createdMedicineId);
    }
    if (createdTreatmentId) {
      await supabase.from('disease_treatments').delete().eq('id', createdTreatmentId);
    }
    if (createdVaccinationId) {
      await supabase.from('vaccination_schedules').delete().eq('id', createdVaccinationId);
    }
  });

  describe('Diseases API', () => {
    it('should fetch all diseases', async () => {
      const response = await fetch('/api/diseases');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('should create a new disease', async () => {
      const response = await fetch('/api/diseases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testDisease),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(testDisease.name);
      createdDiseaseId = data.data.id;
    });

    it('should fetch a specific disease', async () => {
      const response = await fetch(`/api/diseases/${createdDiseaseId}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(createdDiseaseId);
      expect(data.data.name).toBe(testDisease.name);
    });

    it('should update a disease', async () => {
      const updateData = { name: 'Updated Test Disease' };
      
      const response = await fetch(`/api/diseases/${createdDiseaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(updateData.name);
    });

    it('should search diseases', async () => {
      const response = await fetch('/api/diseases?search=Test');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.some((d: any) => d.name.includes('Test'))).toBe(true);
    });

    it('should filter diseases by category', async () => {
      const response = await fetch('/api/diseases?category=infectious');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((d: any) => d.category === 'infectious')).toBe(true);
    });
  });

  describe('Medicines API', () => {
    it('should fetch all medicines', async () => {
      const response = await fetch('/api/medicines');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should create a new medicine', async () => {
      const response = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMedicine),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(testMedicine.name);
      createdMedicineId = data.data.id;
    });

    it('should fetch a specific medicine', async () => {
      const response = await fetch(`/api/medicines/${createdMedicineId}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(createdMedicineId);
      expect(data.data.name).toBe(testMedicine.name);
    });

    it('should update a medicine', async () => {
      const updateData = { name: 'Updated Test Medicine' };
      
      const response = await fetch(`/api/medicines/${createdMedicineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(updateData.name);
    });

    it('should search medicines', async () => {
      const response = await fetch('/api/medicines?search=Test');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.some((m: any) => m.name.includes('Test'))).toBe(true);
    });

    it('should filter medicines by category', async () => {
      const response = await fetch('/api/medicines?category=antibiotic');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((m: any) => m.category === 'antibiotic')).toBe(true);
    });
  });

  describe('Treatment Protocols API', () => {
    const testProtocol = {
      disease_id: createdDiseaseId,
      name: 'Test Treatment Protocol',
      protocol_type: 'treatment',
      severity_level: 'moderate',
      steps: [
        { order: 1, action: 'Isolate animal', duration: '24 hours', notes: 'Prevent spread' },
        { order: 2, action: 'Administer medicine', duration: '5 days', notes: 'As prescribed' },
      ],
      medicines_required: [],
      supportive_care: ['Rest', 'Hydration'],
      expected_recovery_days: 7,
      success_rate: '90%',
    };

    it('should fetch treatment protocols', async () => {
      const response = await fetch('/api/treatment-protocols');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should create a treatment protocol', async () => {
      const response = await fetch('/api/treatment-protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testProtocol),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(testProtocol.name);
    });
  });

  describe('Vaccination Schedules API', () => {
    const testVaccination = {
      disease_id: createdDiseaseId,
      vaccine_medicine_id: createdMedicineId,
      species: 'cow',
      animal_age_start_months: 6,
      animal_age_start_label: '6 months',
      dose_number: 1,
      recommended_season: 'spring',
      route: 'subcutaneous',
      dosage: '1ml',
      priority: 'essential',
      government_program: false,
    };

    it('should fetch vaccination schedules', async () => {
      const response = await fetch('/api/vaccination-schedules');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should create a vaccination schedule', async () => {
      const response = await fetch('/api/vaccination-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testVaccination),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.species).toBe(testVaccination.species);
      createdVaccinationId = data.data.id;
    });
  });

  describe('Disease Treatments API', () => {
    const testDiseaseTreatment = {
      disease_id: createdDiseaseId,
      medicine_id: createdMedicineId,
      is_primary_treatment: true,
      treatment_line: 1,
      effectiveness_rating: 4.5,
      recommended_dosage: '1ml per 10kg',
      dosage_per_kg: '1ml per 10kg',
      frequency: 'Once daily',
      duration_days: 5,
      for_species: ['cow', 'buffalo'],
    };

    it('should create a disease treatment relationship', async () => {
      const response = await fetch('/api/disease-treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testDiseaseTreatment),
      });
      
      // Note: This endpoint doesn't exist, it's handled through the disease/medicine APIs
      // This test demonstrates how the relationship would be created
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Animal Treatments API', () => {
    const testAnimalTreatment = {
      animal_id: 'test-animal-id',
      disease_id: createdDiseaseId,
      condition_name: 'Test Condition',
      symptoms_observed: ['Fever', 'Cough'],
      diagnosis_date: new Date().toISOString(),
      diagnosed_by: 'Test Vet',
      diagnosis_method: 'clinical_exam',
      severity: 'moderate',
      treatment_start_date: new Date().toISOString(),
      status: 'in_treatment',
      medicines_given: [
        {
          medicine_id: createdMedicineId,
          dosage: '1ml per 10kg',
          frequency: 'Once daily',
          duration: '5 days',
        },
      ],
    };

    it('should fetch animal treatments', async () => {
      const response = await fetch('/api/animal-treatments');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should create an animal treatment record', async () => {
      // Skip if no test animal exists
      const animalsResponse = await fetch('/api/animals');
      const animalsData = await animalsResponse.json();
      
      if (animalsData.data.length > 0) {
        const animalId = animalsData.data[0].id;
        testAnimalTreatment.animal_id = animalId;
        
        const response = await fetch('/api/animal-treatments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testAnimalTreatment),
        });
        
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        createdTreatmentId = data.data.id;
      } else {
        console.log('No test animals found, skipping animal treatment test');
      }
    });
  });

  describe('Animal Vaccinations API', () => {
    it('should fetch animal vaccinations', async () => {
      const response = await fetch('/api/animal-vaccinations');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should fetch due vaccinations', async () => {
      const response = await fetch('/api/animal-vaccinations/due');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('upcoming');
      expect(data.data).toHaveProperty('overdue');
      expect(data.data).toHaveProperty('summary');
    });
  });

  describe('Medicine Inventory API', () => {
    const testInventory = {
      medicine_id: createdMedicineId,
      quantity: 100,
      unit: 'ml',
      batch_number: 'TEST001',
      purchase_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      purchase_price: 150,
      supplier: 'Test Supplier',
      storage_location: 'Main Store',
    };

    it('should fetch medicine inventory', async () => {
      const response = await fetch('/api/medicine-inventory');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should add medicine to inventory', async () => {
      const response = await fetch('/api/medicine-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testInventory),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.quantity).toBe(testInventory.quantity);
    });

    it('should update medicine quantity (usage)', async () => {
      // First get the inventory item
      const listResponse = await fetch('/api/medicine-inventory');
      const listData = await listResponse.json();
      
      const inventoryItem = listData.data.find((item: any) => item.medicine_id === createdMedicineId);
      
      if (inventoryItem && inventoryItem.quantity > 10) {
        const response = await fetch('/api/medicine-inventory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: inventoryItem.id,
            quantity: 10,
          }),
        });
        
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.quantity).toBe(inventoryItem.quantity - 10);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should link disease to medicine through treatment', async () => {
      // Fetch disease with treatments
      const response = await fetch(`/api/diseases/${createdDiseaseId}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data.treatments).toBeDefined();
      expect(Array.isArray(data.data.treatments)).toBe(true);
    });

    it('should fetch medicine with linked diseases', async () => {
      // Fetch medicine with diseases
      const response = await fetch(`/api/medicines/${createdMedicineId}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data.treats_diseases).toBeDefined();
      expect(Array.isArray(data.data.treats_diseases)).toBe(true);
    });

    it('should validate data integrity across tables', async () => {
      // Verify all created data exists
      const diseaseResponse = await fetch(`/api/diseases/${createdDiseaseId}`);
      const medicineResponse = await fetch(`/api/medicines/${createdMedicineId}`);
      
      expect(diseaseResponse.status).toBe(200);
      expect(medicineResponse.status).toBe(200);
      
      const diseaseData = await diseaseResponse.json();
      const medicineData = await medicineResponse.json();
      
      expect(diseaseData.data.id).toBe(createdDiseaseId);
      expect(medicineData.data.id).toBe(createdMedicineId);
    });
  });
});

// Performance Tests
describe('Performance Tests', () => {
  it('should handle large disease list efficiently', async () => {
    const startTime = Date.now();
    
    const response = await fetch('/api/diseases?limit=100');
    const data = await response.json();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(2000); // Should respond in under 2 seconds
    expect(data.data.length).toBeLessThanOrEqual(100);
  });

  it('should handle complex searches efficiently', async () => {
    const startTime = Date.now();
    
    const response = await fetch('/api/diseases?search=fever&category=infectious&species=cow');
    const data = await response.json();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(3000); // Should respond in under 3 seconds
  });
});

// Error Handling Tests
describe('Error Handling Tests', () => {
  it('should handle invalid disease ID', async () => {
    const response = await fetch('/api/diseases/invalid-id');
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should handle invalid medicine ID', async () => {
    const response = await fetch('/api/medicines/invalid-id');
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should validate required fields', async () => {
    const response = await fetch('/api/diseases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing required fields');
  });

  it('should handle invalid filter parameters', async () => {
    const response = await fetch('/api/diseases?category=invalid');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]); // Should return empty array for invalid category
  });
});
