# Disease and Medicine Management System

## Overview

A comprehensive disease and medicine management system for MTK Dairy SaaS platform, specifically designed for dairy farms in Pakistan. This system helps farmers manage animal diseases, medicines, treatments, and vaccination schedules effectively.

## Features

### 🏥 Disease Management
- Master database of 25+ common diseases in Pakistan
- Local names in Urdu for regional accessibility
- Detailed symptoms, transmission, and prevention information
- Seasonal disease patterns for Pakistan
- Economic impact assessment
- Zoonotic disease tracking

### 💊 Medicine Management
- 15+ essential medicines from Pakistani manufacturers
- Complete pharmacological information
- Dosage calculator by species
- Withdrawal period tracking (milk & meat)
- Safety information (pregnancy, lactation)
- Price tracking and availability

### 📋 Treatment Protocols
- Standard treatment guidelines
- Step-by-step treatment procedures
- Supportive care recommendations
- Success rate tracking
- Escalation criteria

### 💉 Vaccination Schedules
- Species-specific vaccination programs
- Government vaccination program support
- Automated reminders
- Batch tracking
- Expiry monitoring

### 📦 Inventory Management
- Real-time stock tracking
- Low stock alerts
- Expiry date monitoring
- Batch-wise management
- Supplier tracking

### 🔄 Integration
- Seamless integration with health records
- Automatic health record creation
- Treatment history tracking
- Milk production impact analysis

## Architecture

### Database Schema

```sql
-- Core Tables
diseases                 -- Master disease list
medicines               -- Master medicine list
disease_treatments      -- Disease-medicine relationships
vaccination_schedules   -- Vaccination protocols
treatment_protocols     -- Standard treatment guidelines

-- Transaction Tables
tenant_medicine_inventory -- Farm medicine stock
animal_treatments       -- Treatment records
animal_vaccinations     -- Vaccination records
```

### API Endpoints

#### Diseases
- `GET /api/diseases` - List diseases with filters
- `POST /api/diseases` - Create new disease
- `GET /api/diseases/[id]` - Get disease details
- `PUT /api/diseases/[id]` - Update disease
- `DELETE /api/diseases/[id]` - Delete disease

#### Medicines
- `GET /api/medicines` - List medicines with filters
- `POST /api/medicines` - Add new medicine
- `GET /api/medicines/[id]` - Get medicine details
- `PUT /api/medicines/[id]` - Update medicine
- `DELETE /api/medicines/[id]` - Delete medicine

#### Treatment Protocols
- `GET /api/treatment-protocols` - List protocols
- `POST /api/treatment-protocols` - Create protocol
- `GET /api/treatment-protocols/[id]` - Get protocol

#### Vaccination Schedules
- `GET /api/vaccination-schedules` - List schedules
- `POST /api/vaccination-schedules` - Create schedule

#### Animal Treatments
- `GET /api/animal-treatments` - List treatments
- `POST /api/animal-treatments` - Record treatment
- `GET /api/animal-treatments/[id]` - Get treatment details

#### Animal Vaccinations
- `GET /api/animal-vaccinations` - List vaccinations
- `POST /api/animal-vaccinations` - Record vaccination
- `GET /api/animal-vaccinations/due` - Get due vaccinations

#### Medicine Inventory
- `GET /api/medicine-inventory` - List inventory
- `POST /api/medicine-inventory` - Add stock
- `PUT /api/medicine-inventory` - Update quantity

## Frontend Components

### Disease Components
- `DiseaseList` - Browse and search diseases
- `DiseaseDetail` - View comprehensive disease information

### Medicine Components
- `MedicineList` - Browse medicines with filters
- `MedicineDetail` - View detailed medicine information
- `MedicineInventory` - Manage farm stock

### Treatment Components
- `AnimalTreatmentForm` - Record animal treatments
- `TreatmentHistory` - View treatment records

### Integration Components
- `DiseasesMedicinesPage` - Main dashboard
- `QuickActions` - Common tasks shortcuts

## Data Model

### Disease Example
```json
{
  "id": "dis_fmd",
  "name": "Foot and Mouth Disease",
  "nameUrdu": "منہ کھر کی بیماری",
  "category": "infectious",
  "symptoms": ["Fever", "Blisters", "Lameness"],
  "affectedSpecies": ["cow", "buffalo"],
  "vaccinationAvailable": true,
  "economicImpactScore": 5
}
```

### Medicine Example
```json
{
  "id": "med_penicillin_g",
  "name": "Penicillin G Procaine",
  "manufacturer": "Star Labs",
  "category": "antibiotic",
  "dosagePerKg": "1ml per 10kg",
  "withdrawalPeriodMilk": 3,
  "withdrawalPeriodMeat": 7
}
```

## Setup Instructions

### 1. Database Migration
```sql
-- Apply the migration
\i scripts/diseases-medicines-migration.sql

-- Seed data
\i scripts/diseases-seed-data.sql
\i scripts/medicines-seed-data.sql
\i scripts/treatment-protocols-seed-data.sql
```

### 2. MCP Server Setup
```bash
# Apply migration via MCP
mcp0_apply_migration --project_id=gdditqkvzlpnklcoxspj --name=diseases_medicines_management

# Seed data via MCP
mcp0_execute_sql --project_id=gdditqkvzlpnklcoxspj --file=scripts/diseases-seed-data.sql
```

### 3. Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Usage Guide

### Viewing Diseases
1. Navigate to `/farm/diseases-medicines`
2. Click on "Diseases" tab
3. Use filters to find specific diseases
4. Click on any disease to view details

### Managing Medicine Inventory
1. Go to "Inventory" tab
2. View stock levels and expiry dates
3. Add new stock using "Add Stock" button
4. Monitor low stock alerts

### Recording Treatments
1. Select an animal or go to "Treatment" tab
2. Choose disease or condition
3. Select medicines and dosages
4. Record treatment details

### Vaccination Management
1. View upcoming vaccinations on dashboard
2. Access vaccination schedules
3. Record administered vaccinations
4. Track batch numbers and expiry

## Best Practices

### Disease Management
- Regularly update disease information
- Monitor seasonal disease patterns
- Keep preventive measures current
- Track economic impacts

### Medicine Management
- Monitor expiry dates monthly
- Maintain optimal stock levels
- Track withdrawal periods strictly
- Store medicines as per guidelines

### Treatment Recording
- Record treatments promptly
- Include all relevant details
- Track outcomes and recovery
- Document adverse reactions

### Vaccination
- Follow recommended schedules
- Use proper vaccination techniques
- Monitor for adverse reactions
- Maintain cold chain for vaccines

## Integration Points

### Health Records System
- Automatic health record creation
- Treatment history linkage
- Milk production correlation
- Breeding impact tracking

### Milk Production
- Track milk yield impact
- Withdrawal period enforcement
- Quality monitoring
- Production loss calculation

### Breeding Management
- Disease impact on fertility
- Treatment during pregnancy
- Vaccination schedules
- Genetic health tracking

## Data Security

### Tenant Isolation
- All data filtered by tenant_id
- Secure multi-tenancy
- No cross-tenant data access
- Role-based permissions

### Data Privacy
- Secure API endpoints
- Encrypted data transmission
- Audit logging
- GDPR compliance

## Performance Optimization

### Database Indexes
- Optimized queries with proper indexes
- Full-text search capabilities
- Efficient pagination
- Cached frequent queries

### Frontend Optimization
- Lazy loading components
- Optimized re-renders
- Efficient data fetching
- Responsive design

## Testing

### Unit Tests
```bash
# Run tests
npm test -- diseases-medicines.test.ts

# Coverage report
npm run test:coverage
```

### Integration Tests
- API endpoint testing
- Database integration
- Frontend component testing
- End-to-end workflows

## Troubleshooting

### Common Issues

#### Medicine Not Showing
1. Check if medicine is active
2. Verify availability in Pakistan
3. Check tenant permissions
4. Review API response

#### Treatment Not Saving
1. Verify animal exists
2. Check required fields
3. Validate medicine stock
4. Review error logs

#### Vaccination Schedule Missing
1. Check disease-vaccine linkage
2. Verify species match
3. Review schedule dates
4. Check government program status

### Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (tenant issue)
- `404` - Not Found (invalid ID)
- `500` - Server Error (contact support)

## Future Enhancements

### Planned Features
- [ ] Mobile app for field use
- [ ] Offline mode support
- [ ] AI-powered diagnosis assistance
- [ ] Integration with diagnostic labs
- [ ] Automated ordering system
- [ ] Weather-based disease prediction

### Scalability
- Multi-region support
- Advanced analytics
- Machine learning integration
- IoT sensor integration

## Support

### Documentation
- API documentation: `/api/docs`
- Component documentation: Storybook
- Database schema: ER diagrams
- User guides: Video tutorials

### Contact
- Technical support: support@maliktechdairy.com
- Documentation: docs@maliktechdairy.com
- Feature requests: feedback@maliktechdairy.com

## License

© 2024 MTK Dairy. All rights reserved.

---

**Last Updated**: December 26, 2024
**Version**: 1.0.0
**Maintainer**: MTK Dairy Development Team
