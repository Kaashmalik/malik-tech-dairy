-- MTK Dairy - Medicines Seed Data for Pakistan
-- Based on research: Star Labs, SAMI Pharma, Hilton, Prix Pharma, DVM Pharma, etc.

-- =====================================================
-- ANTIBIOTICS - Most commonly used in Pakistan
-- =====================================================

INSERT INTO medicines (id, name, generic_name, brand_name, manufacturer, category, form, route, active_ingredients, strength, dosage_per_kg, dosage_instructions, frequency, duration_days, species_dosage, withdrawal_period_milk, withdrawal_period_meat, contraindications, side_effects, drug_interactions, pregnancy_safe, lactation_safe, storage_conditions, shelf_life_months, available_in_pakistan, prescription_required, price_range_pkr, pack_sizes, effectiveness_rating, popularity_score, is_active, notes) VALUES

-- Penicillins
('med_penicillin_g', 'Penicillin G Procaine', 'Penicillin G', 'PENIVET Forte', 'Star Labs', 'antibiotic', 'injection', 'intramuscular', 
'[{"name": "Penicillin G Procaine", "concentration": "3000000", "unit": "IU"}]', 
'3,000,000 IU/ml', '1ml per 10kg', 'Deep IM injection', 'Once daily', 3,
'{"cow": {"dose": "1ml per 10kg", "route": "IM"}, "buffalo": {"dose": "1ml per 10kg", "route": "IM"}, "goat": {"dose": "1ml per 10kg", "route": "IM"}, "sheep": {"dose": "1ml per 10kg", "route": "IM"}}',
3, 7, ARRAY['Penicillin allergy'], ARRAY['Anaphylaxis', 'Local reactions'], ARRAY['Tetracyclines'], TRUE, FALSE, 'Cool dark place', 24, TRUE, TRUE, '200-500', ARRAY['10ml', '50ml', '100ml'], 4.2, 85, TRUE, 'First-line for many infections'),

('med_amoxicillin', 'Amoxicillin', 'Amoxicillin Trihydrate', 'AMOXIVET', 'SAMI Pharma', 'antibiotic', 'injection', 'intramuscular',
'[{"name": "Amoxicillin Trihydrate", "concentration": "150", "unit": "mg/ml"}]',
'150mg/ml', '1ml per 10kg', 'IM injection', 'Once daily', 5,
'{"cow": {"dose": "1ml per 10kg", "route": "IM"}, "buffalo": {"dose": "1ml per 10kg", "route": "IM"}, "goat": {"dose": "1.5ml per 10kg", "route": "IM"}}',
2, 14, ARRAY['Penicillin allergy'], ARRAY['GI upset', 'Allergic reaction'], ARRAY['Tetracyclines'], TRUE, TRUE, 'Room temp', 24, TRUE, TRUE, '300-800', ARRAY['10ml', '30ml', '50ml'], 4.3, 88, TRUE, 'Broad spectrum antibiotic'),

('med_ampicillin', 'Ampicillin Sodium', 'Ampicillin', 'AMPICILIN-S', 'Prix Pharma', 'antibiotic', 'injection', 'intravenous',
'[{"name": "Ampicillin Sodium", "concentration": "250", "unit": "mg/ml"}]',
'250mg/ml', '1ml per 10kg', 'Slow IV/IM', '2-3 times daily', 5,
'{"cow": {"dose": "1ml per 10kg", "route": "IV/IM"}, "buffalo": {"dose": "1ml per 10kg", "route": "IV/IM"}}',
2, 10, ARRAY['Penicillin allergy'], ARRAY['Phlebitis', 'Allergic reaction'], ARRAY['Bacteriostatic antibiotics'], TRUE, TRUE, 'Refrigerate', 24, TRUE, TRUE, '250-600', ARRAY['10ml', '20ml'], 4.1, 75, TRUE, 'For severe infections'),

-- Cephalosporins
('med_ceftiofur', 'Ceftiofur Sodium', 'Ceftiofur', 'CEFTI-200', 'Star Labs', 'antibiotic', 'injection', 'intramuscular',
'[{"name": "Ceftiofur Sodium", "concentration": "200", "unit": "mg/ml"}]',
'200mg/ml', '1ml per 20kg', 'IM injection', 'Once daily', 3-5,
'{"cow": {"dose": "1ml per 20kg", "route": "IM"}, "buffalo": {"dose": "1ml per 20kg", "route": "IM"}, "goat": {"dose": "1ml per 20kg", "route": "IM"}}',
0, 3, ARRAY['Cephalosporin allergy'], ARRAY['Injection site swelling', 'GI upset'], ARRAY['Probenecid'], FALSE, FALSE, 'Room temp', 24, TRUE, TRUE, '800-2000', ARRAY['50ml', '100ml'], 4.6, 90, TRUE, 'Third generation cephalosporin'),

-- Tetracyclines
('med_oxytetracycline', 'Oxytetracycline', 'Oxytetracycline', 'OXYVET LA', 'Hilton Pharma', 'antibiotic', 'injection', 'intramuscular',
'[{"name": "Oxytetracycline Dihydrate", "concentration": "200", "unit": "mg/ml"}]',
'200mg/ml', '1ml per 10kg', 'IM injection', 'Once daily', 3-5,
'{"cow": {"dose": "1ml per 10kg", "route": "IM"}, "buffalo": {"dose": "1ml per 10kg", "route": "IM"}, "goat": {"dose": "1ml per 10kg", "route": "IM"}}',
7, 14, ARRAY['Pregnancy (last trimester)', 'Young animals'}, ARRAY['Yellow teeth', 'Photosensitivity'], ARRAY['Penicillins', 'Calcium supplements'], FALSE, FALSE, 'Cool dark place', 24, TRUE, TRUE, '150-400', ARRAY['10ml', '50ml', '100ml'], 4.0, 82, TRUE, 'Broad spectrum, LA formulation'),

('med_doxycycline', 'Doxycycline', 'Doxycycline Hyclate', 'DOXYVET', 'SAMI Pharma', 'antibiotic', 'oral_powder', 'oral',
'[{"name": "Doxycycline Hyclate", "concentration": "100", "unit": "mg/g"}]',
'100mg/g', '5mg per kg', 'Mix in feed/water', 'Twice daily', 7,
'{"cow": {"dose": "10g per 100kg", "route": "Oral"}, "buffalo": {"dose": "10g per 100kg", "route": "Oral"}}',
5, 14, ARRAY['Pregnancy', 'Young animals'}, ARRAY['Esophagitis in ruminants'], ARRAY['Antacids', 'Iron supplements'], FALSE, FALSE, 'Dry place', 24, TRUE, TRUE, '500-1200', ARRAY['100g', '500g', '1kg'], 4.2, 70, TRUE, 'For respiratory diseases'),

-- Sulfonamides
('med_sulfadiazine_trimethoprim', 'Sulfadiazine + Trimethoprim', 'Sulfadiazine/Trimethoprim', 'SULFATRIM', 'DVM Pharma', 'antibiotic', 'injection', 'intravenous',
'[{"name": "Sulfadiazine Sodium", "concentration": "200", "unit": "mg/ml"}, {"name": "Trimethoprim", "concentration": "40", "unit": "mg/ml"}]',
'200mg/ml + 40mg/ml', '1ml per 15kg', 'Slow IV/IM', 'Once daily', 3-5,
'{"cow": {"dose": "1ml per 15kg", "route": "IV/IM"}, "buffalo": {"dose": "1ml per 15kg", "route": "IV/IM"}}',
4, 10, ARRAY['Liver disease', 'Renal insufficiency'}, ARRAY['Crystals in urine', 'Allergic reactions'], ARRAY['NSAIDs', 'Methotrexate'], FALSE, FALSE, 'Room temp', 24, TRUE, TRUE, '300-700', ARRAY['10ml', '30ml'], 4.3, 78, TRUE, 'Synergistic combination'),

-- Fluoroquinolones
('med_enrofloxacin', 'Enrofloxacin', 'Enrofloxacin', 'ENROFAR', 'Izfaar Pharma', 'antibiotic', 'injection', 'subcutaneous',
'[{"name": "Enrofloxacin", "concentration": "100", "unit": "mg/ml"}]',
'100mg/ml', '0.5ml per 10kg', 'SC injection', 'Once daily', 3-5,
'{"cow": {"dose": "0.5ml per 10kg", "route": "SC"}, "buffalo": {"dose": "0.5ml per 10kg", "route": "SC"}, "goat": {"dose": "0.5ml per 10kg", "route": "SC"}}',
5, 14, ARRAY['Growing animals', 'Pregnancy'}, ARRAY['Cartilage damage in young', 'GI upset'], ARRAY['Theophylline', 'NSAIDs'], FALSE, FALSE, 'Room temp', 24, TRUE, TRUE, '400-1000', ARRAY['10ml', '50ml', '100ml'], 4.4, 85, TRUE, 'For severe infections'),

-- Macrolides
('med_tylosin', 'Tylosin Tartrate', 'Tylosin', 'TYLOVET', 'Vet Line International', 'antibiotic', 'injection', 'intramuscular',
'[{"name": "Tylosin Tartrate", "concentration": "200", "unit": "mg/ml"}]',
'200mg/ml', '1ml per 10kg', 'IM injection', 'Once daily', 3-5,
'{"cow": {"dose": "1ml per 10kg", "route": "IM"}, "buffalo": {"dose": "1ml per 10kg", "route": "IM"}}',
5, 21, ARRAY['Horses', 'Rabbits'}, ARRAY['Injection site pain', 'Diarrhea'], ARRAY['Erythromycin', 'Clindamycin'], FALSE, FALSE, 'Cool place', 24, TRUE, TRUE, '250-600', ARRAY['10ml', '50ml', '100ml'], 4.1, 72, TRUE, 'For respiratory infections'),

-- =====================================================
-- ANTI-INFLAMMATORY & ANALGESIC
-- =====================================================

('med_meloxicam', 'Meloxicam', 'Meloxicam', 'MELOVET', 'Star Labs', 'anti_inflammatory', 'injection', 'intravenous',
'[{"name": "Meloxicam", "concentration": "5", "unit": "mg/ml"}]',
'5mg/ml', '0.5ml per 10kg', 'Slow IV/IM', 'Once daily', 3-5,
'{"cow": {"dose": "0.5ml per 10kg", "route": "IV/IM"}, "buffalo": {"dose": "0.5ml per 10kg", "route": "IV/IM"}}',
5, 14, ARRAY['GI ulcers', 'Renal disease', 'Pregnancy'}, ARRAY['GI upset', 'Renal toxicity'], ARRAY['NSAIDs', 'Diuretics'], FALSE, FALSE, 'Room temp', 24, TRUE, TRUE, '400-900', ARRAY['10ml', '20ml', '50ml'], 4.5, 88, TRUE, 'COX-2 selective NSAID'),

('med_flunixin', 'Flunixin Meglumine', 'Flunixin', 'FLUNIVET', 'Hilton Pharma', 'anti_inflammatory', 'injection', 'intravenous',
'[{"name": "Flunixin Meglumine", "concentration": "50", "unit": "mg/ml"}]',
'50mg/ml', '1ml per 20kg', 'Slow IV only', 'Once daily', 3,
'{"cow": {"dose": "1ml per 20kg", "route": "IV"}, "buffalo": {"dose": "1ml per 20kg", "route": "IV"}}',
4, 14, ARRAY['GI ulcers', 'Renal disease', 'Hemorrhagic disorders'}, ARRAY['GI ulcers', 'Renal toxicity'], ARRAY['NSAIDs', 'Anticoagulants'], FALSE, FALSE, 'Room temp', 24, TRUE, TRUE, '300-700', ARRAY['10ml', '50ml'], 4.4, 85, TRUE, 'Potent NSAID for pain/fever'),

('med_dexamethasone', 'Dexamethasone', 'Dexamethasone', 'DEXACYCLIN', 'Star Labs', 'anti_inflammatory', 'injection', 'intravenous',
'[{"name": "Dexamethasone Sodium Phosphate", "concentration": "2", "unit": "mg/ml"}]',
'2mg/ml', '0.5ml per 10kg', 'IV/IM', 'Once daily', 1-3,
'{"cow": {"dose": "0.5ml per 10kg", "route": "IV/IM"}, "buffalo": {"dose": "0.5ml per 10kg", "route": "IV/IM"}}',
0, 7, ARRAY['Pregnancy (induces abortion)', 'Diabetes', 'Infections'}, ARRAY['Immunosuppression', 'Delayed healing'], ARRAY['NSAIDs', 'Vaccines'], FALSE, FALSE, 'Room temp', 24, TRUE, TRUE, '200-500', ARRAY['10ml', '30ml'], 4.3, 80, TRUE, 'Corticosteroid, use with antibiotics'),

-- =====================================================
-- ANTI-PARASITIC MEDICINES
-- =====================================================

-- Anthelmintics
('med_ivermectin', 'Ivermectin', 'Ivermectin', 'IVERVET', 'SAMI Pharma', 'antiparasitic', 'injection', 'subcutaneous',
'[{"name": "Ivermectin", "concentration": "1", "unit": "mg/ml"}]',
'1mg/ml', '1ml per 50kg', 'SC injection', 'Once', 1,
'{"cow": {"dose": "1ml per 50kg", "route": "SC"}, "buffalo": {"dose": "1ml per 50kg", "route": "SC"}, "goat": {"dose": "0.5ml per 10kg", "route": "SC"}, "sheep": {"dose": "0.5ml per 10kg", "route": "SC"}}',
35, 28, ARRAY['Collie breeds', 'Young animals'}, ARRAY['Swelling at injection site', 'Neurological signs'], ARRAY['None significant'], FALSE, FALSE, 'Room temp', 24, TRUE, TRUE, '100-300', ARRAY['10ml', '50ml', '100ml'], 4.6, 95, TRUE, 'Broad spectrum dewormer'),

('med_albendazole', 'Albendazole', 'Albendazole', 'ALBENDAZOLE', 'DVM Pharma', 'anthelmintic', 'bolus', 'oral',
'[{"name": "Albendazole", "concentration": "600", "unit": "mg"}]',
'600mg', '5mg per kg', 'Oral bolus', 'Single dose', 1,
'{"cow": {"dose": "1 bolus per 120kg", "route": "Oral"}, "buffalo": {"dose": "1 bolus per 120kg", "route": "Oral"}, "goat": {"dose": "1/2 bolus per 60kg", "route": "Oral"}}',
3, 14, ARRAY['Pregnancy (first 45 days)', 'Liver disease'}, ARRAY['Teratogenicity', 'Bone marrow suppression'], ARRAY['None significant'], FALSE, FALSE, 'Room temp', 24, TRUE, TRUE, '50-150', ARRAY['10 tablets', '100 tablets'], 4.4, 90, TRUE, 'For flukes and worms'),

('med_fenbendazole', 'Fenbendazole', 'Fenbendazole', 'FENBENDAZOLE', 'Prix Pharma', 'anthelmintic', 'oral_powder', 'oral',
'[{"name": "Fenbendazole", "concentration": "100", "unit": "mg/g"}]',
'100mg/g', '5mg per kg', 'Mix in feed', 'Single dose', 1,
'{"cow": {"dose": "5g per 100kg", "route": "Oral"}, "buffalo": {"dose": "5g per 100kg", "route": "Oral"}}',
3, 14, ARRAY['None significant'}, ARRAY['None significant'], ARRAY['None significant'], TRUE, TRUE, 'Room temp', 24, TRUE, TRUE, '200-500', ARRAY['100g', '500g', '1kg'], 4.3, 85, TRUE, 'Safe dewormer'),

('med_oxfendazole', 'Oxfendazole', 'Oxfendazole', 'OXFENDAZOLE', 'Hilton Pharma', 'anthelmintic', 'oral_suspension', 'oral',
'[{"name": "Oxfendazole", "concentration": "45", "unit": "mg/ml"}]',
'45mg/ml', '4.5mg per kg', 'Oral drench', 'Single dose', 1,
'{"cow": {"dose": "10ml per 100kg", "route": "Oral"}, "buffalo": {"dose": "10ml per 100kg", "route": "Oral"}}',
7, 21, ARRAY['Pregnancy (first trimester)'}, ARRAY['None significant'], ARRAY['None significant'], FALSE, TRUE, 'Room temp', 24, TRUE, TRUE, '300-800', ARRAY['100ml', '500ml'], 4.5, 88, TRUE, 'For flukes, especially fasciola'),

('med_praziquantel', 'Praziquantel', 'Praziquantel', 'PRAZIVET', 'Star Labs', 'anthelmintic', 'tablet', 'oral',
'[{"name": "Praziquantel", "concentration": "600", "unit": "mg"}]',
'600mg', '10mg per kg', 'Oral tablet', 'Single dose', 1,
'{"cow": {"dose": "1 tablet per 60kg", "route": "Oral"}, "buffalo": {"dose": "1 tablet per 60kg", "route": "Oral"}}',
0, 14, ARRAY['None significant'}, ARRAY['Salivation', 'Vomiting'], ARRAY['None significant'], FALSE, FALSE, 'Room temp', 24, TRUE, TRUE, '100-250', ARRAY['10 tablets', '100 tablets'], 4.2, 70, TRUE, 'For tapeworms'),

-- Anti-tick
('med_deltamethrin', 'Deltamethrin', 'Deltamethrin', 'DELTICIDE', 'Vet Line International', 'antiparasitic', 'pour_on', 'topical',
'[{"name": "Deltamethrin", "concentration": "1", "unit": "mg/ml"}]',
'1mg/ml', '1ml per 10kg', 'Pour along backline', 'Every 2 weeks', 1,
'{"cow": {"dose": "10ml per 100kg", "route": "Topical"}, "buffalo": {"dose": "10ml per 100kg", "route": "Topical"}}',
7, 30, ARRAY['Cats', 'Fish'}, ARRAY['Local skin irritation'], ARRAY['None significant'], FALSE, FALSE, 'Cool dark place', 24, TRUE, TRUE, '150-400', ARRAY['100ml', '500ml', '1L'], 4.3, 85, TRUE, 'For tick and fly control'),

('med_cypermethrin', 'Cypermethrin', 'Cypermethrin', 'CYPERVET', 'SAMI Pharma', 'antiparasitic', 'spray', 'topical',
'[{"name": "Cypermethrin", "concentration": "10", "unit": "mg/ml"}]',
'10mg/ml', '1ml per liter water', 'Spray entire body', 'Weekly', 1,
'{"cow": {"dose": "2-3L per animal", "route": "Topical"}, "buffalo": {"dose": "2-3L per animal", "route": "Topical"}}',
3, 28, ARRAY['Cats', 'Aquatic life'}, ARRAY['Skin irritation', 'Sneezing'], ARRAY['None significant'], FALSE, FALSE, 'Cool dark place', 24, TRUE, TRUE, '200-500', ARRAY['100ml', '500ml', '1L'], 4.0, 75, TRUE, 'For tick, lice, mite control'),

-- =====================================================
-- VACCINES
-- =====================================================

('md_fmd_vaccine', 'FMD Vaccine', 'Foot and Mouth Disease Vaccine', 'FMDVAC', 'VRI Pakistan', 'vaccine', 'injection', 'subcutaneous',
'[{"name": "Inactivated FMD Virus", "concentration": "1", "unit": "dose"}]',
'1 dose', 'Standard dose', 'SC injection', 'Once, booster annually', 1,
'{"cow": {"dose": "1ml", "route": "SC"}, "buffalo": {"dose": "1ml", "route": "SC"}, "goat": {"dose": "1ml", "route": "SC"}, "sheep": {"dose": "1ml", "route": "SC"}}',
0, 0, ARRAY['Pregnant animals (avoid if possible)'}, ARRAY['Local swelling', 'Transient fever'], ARRAY['None'], TRUE, TRUE, '2-8°C', 12, TRUE, TRUE, '150-300', ARRAY['10 dose', '25 dose', '50 dose'], 4.5, 95, TRUE, 'Essential vaccine'),

('md_hs_vaccine', 'HS Vaccine', 'Hemorrhagic Septicemia Vaccine', 'HSVAC', 'VRI Pakistan', 'vaccine', 'injection', 'subcutaneous',
'[{"name": "Inactivated P. multocida", "concentration": "1", "unit": "dose"}]',
'1 dose', 'Standard dose', 'SC injection', 'Pre-monsoon, booster annually', 1,
'{"cow": {"dose": "1ml", "route": "SC"}, "buffalo": {"dose": "1ml", "route": "SC"}}',
0, 0, ARRAY['None significant'}, ARRAY['Local swelling'], ARRAY['None'], TRUE, TRUE, '2-8°C', 12, TRUE, TRUE, '100-250', ARRAY['10 dose', '25 dose'], 4.4, 90, TRUE, 'Pre-monsoon essential'),

('md_blackleg_vaccine', 'Blackleg Vaccine', 'Blackleg Vaccine', 'BLACKVAC', 'VRI Pakistan', 'vaccine', 'injection', 'subcutaneous',
'[{"name": "Inactivated C. chauvoei", "concentration": "1", "unit": "dose"}]',
'1 dose', 'Standard dose', 'SC injection', 'Annually', 1,
'{"cow": {"dose": "1ml", "route": "SC"}, "buffalo": {"dose": "1ml", "route": "SC"}, "goat": {"dose": "1ml", "route": "SC"}, "sheep": {"dose": "1ml", "route": "SC"}}',
0, 0, ARRAY['None significant'}, ARRAY['Local swelling'], ARRAY['None'], TRUE, TRUE, '2-8°C', 12, TRUE, TRUE, '100-200', ARRAY['10 dose', '25 dose'], 4.3, 85, TRUE, 'Annual vaccination'),

('md_anthrax_vaccine', 'Anthrax Vaccine', 'Anthrax Spore Vaccine', 'ANTHRAXVAC', 'VRI Pakistan', 'vaccine', 'injection', 'subcutaneous',
'[{"name": "Spore Vaccine (Sterne 34F2)", "concentration": "1", "unit": "dose"}]',
'1 dose', 'Standard dose', 'SC injection', 'Annually', 1,
'{"cow": {"dose": "1ml", "route": "SC"}, "buffalo": {"dose": "1ml", "route": "SC"}, "goat": {"dose": "1ml", "route": "SC"}, "sheep": {"dose": "1ml", "route": "SC"}}',
0, 0, ARRAY['Pregnant animals', 'Sick animals'}, ARRAY['Local abscess formation'], ARRAY['Antibiotics (within 7 days)'}, FALSE, FALSE, '2-8°C', 12, TRUE, TRUE, '150-300', ARRAY['10 dose', '25 dose'], 4.2, 80, TRUE, 'Live spore vaccine'),

('md_ppr_vaccine', 'PPR Vaccine', 'Peste des Petits Ruminants Vaccine', 'PPRVAC', 'VRI Pakistan', 'vaccine', 'injection', 'subcutaneous',
'[{"name": "Live attenuated PPR virus", "concentration": "1", "unit": "dose"}]',
'1 dose', 'Standard dose', 'SC injection', 'Annually', 1,
'{"goat": {"dose": "1ml", "route": "SC"}, "sheep": {"dose": "1ml", "route": "SC"}}',
0, 0, ARRAY['Pregnant animals'}, ARRAY['Transient fever', 'Local swelling'], ARRAY['None'], FALSE, TRUE, '2-8°C', 12, TRUE, TRUE, '50-150', ARRAY['10 dose', '25 dose', '50 dose'], 4.6, 95, TRUE, 'Essential for goats/sheep'),

-- =====================================================
-- VITAMINS & MINERALS
-- =====================================================

('med_vitamin_a_d_e', 'Vitamin ADE Injection', 'Vitamins A, D3, E', 'VITAVET ADE', 'Star Labs', 'vitamin', 'injection', 'intramuscular',
'[{"name": "Vitamin A", "concentration": "50000", "unit": "IU/ml"}, {"name": "Vitamin D3", "concentration": "10000", "unit": "IU/ml"}, {"name": "Vitamin E", "concentration": "20", "unit": "mg/ml"}]',
'50,000 IU + 10,000 IU + 20mg/ml', '1ml per 20kg', 'IM injection', 'Once, repeat after 2 weeks', 1,
'{"cow": {"dose": "1ml per 20kg", "route": "IM"}, "buffalo": {"dose": "1ml per 20kg", "route": "IM"}, "goat": {"dose": "0.5ml per 10kg", "route": "IM"}}',
0, 0, ARRAY['None significant'}, ARRAY['None significant'}, ARRAY['Anticoagulants'], TRUE, TRUE, 'Room temp', 24, TRUE, TRUE, '100-300', ARRAY['10ml', '30ml', '50ml'], 4.2, 80, TRUE, 'For deficiency, stress, postpartum'),

('med_calcium_borogluconate', 'Calcium Borogluconate', 'Calcium Borogluconate', 'CALVET', 'Hilton Pharma', 'mineral', 'injection', 'intravenous',
'[{"name": "Calcium Borogluconate", "concentration": "23", "unit": "mg/ml"}]',
'23%', '1ml per 10kg', 'Slow IV', 'Once, repeat if needed', 1,
'{"cow": {"dose": "1ml per 10kg", "route": "IV"}, "buffalo": {"dose": "1ml per 10kg", "route": "IV"}}',
0, 0, ARRAY['Heart disease', 'Hypercalcemia'}, ARRAY['Cardiac arrhythmia', 'Hypotension'}, ARRAY['Digitalis', 'Thiazides'], FALSE, TRUE, 'Room temp', 24, TRUE, TRUE, '150-400', ARRAY['10ml', '50ml'], 4.4, 90, TRUE, 'For milk fever'),

('med_selenium_vit_e', 'Selenium + Vitamin E', 'Selenium + Vitamin E', 'SELEVIT', 'Prix Pharma', 'mineral', 'injection', 'intramuscular',
'[{"name": "Selenium", "concentration": "0.5", "unit": "mg/ml"}, {"name": "Vitamin E", "concentration": "50", "unit": "mg/ml"}]',
'0.5mg + 50mg/ml', '1ml per 20kg', 'IM injection', 'Once monthly', 1,
'{"cow": {"dose": "1ml per 20kg", "route": "IM"}, "buffalo": {"dose": "1ml per 20kg", "route": "IM"}}',
0, 0, ARRAY['Selenium toxicity areas'}, ARRAY['Selenosis if overdosed'}, ARRAY['None significant'], FALSE, TRUE, 'Room temp', 24, TRUE, TRUE, '200-500', ARRAY['10ml', '30ml'], 4.3, 85, TRUE, 'For white muscle disease, retained placenta'),

-- =====================================================
-- REPRODUCTIVE MEDICINES
-- =====================================================

('med_oxytocin', 'Oxytocin', 'Oxytocin', 'OXYVET', 'Star Labs', 'hormonal', 'injection', 'intramuscular',
'[{"name": "Oxytocin", "concentration": "10", "unit": "IU/ml"}]',
'10 IU/ml', '10-20 IU', 'IM injection', 'Once', 1,
'{"cow": {"dose": "20 IU", "route": "IM"}, "buffalo": {"dose": "20 IU", "route": "IM"}}',
0, 0, ARRAY['Dystocia due to malposition', 'Uterine rupture'}, ARRAY['Uterine rupture', 'Hypertension'}, ARRAY['None'], FALSE, FALSE, '2-8°C', 12, TRUE, TRUE, '50-150', ARRAY['10ml', '20ml'], 4.5, 90, TRUE, 'For milk letdown, uterine contraction'),

('med_pgf2_alpha', 'Prostaglandin F2 Alpha', 'Dinoprost Tromethamine', 'PROSTAVET', 'SAMI Pharma', 'hormonal', 'injection', 'intramuscular',
'[{"name": "Dinoprost Tromethamine", "concentration": "5", "unit": "mg/ml"}]',
'5mg/ml', '25mg', 'IM injection', 'Once, repeat after 10-14 days', 1,
'{"cow": {"dose": "5ml", "route": "IM"}, "buffalo": {"dose": "5ml", "route": "IM"}}',
0, 0, ARRAY['Pregnancy', 'Respiratory disease', 'Cardiovascular disease'}, ARRAY['Sweating', 'Coughing', 'Restlessness'}, ARRAY['None'], FALSE, FALSE, '2-8°C', 12, TRUE, TRUE, '300-800', ARRAY['10ml', '20ml'], 4.3, 75, TRUE, 'For estrus induction, luteolysis'),

('med_gnrh', 'GnRH', 'Buserelin Acetate', 'REPROVET', 'Hilton Pharma', 'hormonal', 'injection', 'intramuscular',
'[{"name": "Buserelin Acetate", "concentration": "20", "unit": "mcg/ml"}]',
'20mcg/ml', '20mcg', 'IM injection', 'Once', 1,
'{"cow": {"dose": "1ml", "route": "IM"}, "buffalo": {"dose": "1ml", "route": "IM"}}',
0, 0, ARRAY['Ovarian cysts', 'Pituitary disorders'}, ARRAY['Transient swelling', 'Behavioral changes'}, ARRAY['None'], FALSE, FALSE, '2-8°C', 12, TRUE, TRUE, '500-1200', ARRAY['10ml', '20ml'], 4.2, 70, TRUE, 'For ovarian cysts, breeding'),

-- =====================================================
-- DIGESTIVE MEDICINES
-- =====================================================

('med_rumenator', 'Rumenator', 'Rumen Activator', 'RUMENATOR', 'DVM Pharma', 'digestive', 'oral_powder', 'oral',
'[{"name": "Yeast culture", "concentration": "50", "unit": "g"}, {"name": "Probiotics", "concentration": "10", "unit": "g"}, {"name": "Vitamins", "concentration": "5", "unit": "g"}]',
'100g sachet', '100g per animal', 'Mix in feed', 'Once daily', 10,
'{"cow": {"dose": "1 sachet", "route": "Oral"}, "buffalo": {"dose": "1 sachet", "route": "Oral"}}',
0, 0, ARRAY['None significant'}, ARRAY['None significant'}, ARRAY['Antibiotics'], TRUE, TRUE, 'Cool dry place', 24, TRUE, TRUE, '50-100', ARRAY['10 sachets', '50 sachets'], 4.0, 65, TRUE, 'For rumen health, digestion'),

('med_antacid', 'Bloat Relief', 'Simethicone + Antacid', 'BLOATVET', 'Vet Line International', 'digestive', 'oral_suspension', 'oral',
'[{"name": "Simethicone", "concentration": "40", "unit": "mg/ml"}, {"name": "Mg(OH)2", "concentration": "100", "unit": "mg/ml"}]',
'40mg + 100mg/ml', '1ml per 10kg', 'Oral drench', 'Once, repeat if needed', 1,
'{"cow": {"dose": "10ml per 100kg", "route": "Oral"}, "buffalo": {"dose": "10ml per 100kg", "route": "Oral"}}',
0, 0, ARRAY['Obstruction bloat'}, ARRAY['Diarrhea in high doses'}, ARRAY['None'], TRUE, TRUE, 'Room temp', 24, TRUE, TRUE, '100-300', ARRAY['100ml', '500ml'], 4.2, 80, TRUE, 'For frothy bloat'),

-- =====================================================
-- TOPICAL MEDICINES
-- =====================================================

('med_povidone_iodine', 'Povidone Iodine', 'Povidone Iodine', 'IODIVET', 'Star Labs', 'antiseptic', 'solution', 'topical',
'[{"name": "Povidone Iodine", "concentration": "10", "unit": "mg/ml"}]',
'10%', 'Apply to wound', 'Topical', '2-3 times daily', 5,
'{"cow": {"dose": "Apply liberally", "route": "Topical"}, "buffalo": {"dose": "Apply liberally", "route": "Topical"}}',
0, 0, ARRAY['Iodine allergy', 'Thyroid disorders'}, ARRAY['Skin irritation', 'Staining'}, ARRAY['None'], TRUE, TRUE, 'Room temp', 24, TRUE, FALSE, '50-200', ARRAY['50ml', '100ml', '500ml'], 4.3, 90, TRUE, 'For wound disinfection'),

('med_gentian_violet', 'Gentian Violet', 'Gentian Violet', 'GENTIVET', 'Hilton Pharma', 'antifungal', 'solution', 'topical',
'[{"name": "Gentian Violet", "concentration": "1", "unit": "mg/ml"}]',
'1%', 'Apply to lesion', 'Topical', 'Once daily', 5-7,
'{"cow": {"dose": "Apply to affected area", "route": "Topical"}, "buffalo": {"dose": "Apply to affected area", "route": "Topical"}}',
0, 0, ARRAY['None significant'}, ARRAY['Skin staining', 'Irritation'}, ARRAY['None'], FALSE, FALSE, 'Room temp', 24, TRUE, FALSE, '30-100', ARRAY['30ml', '100ml'], 4.0, 60, TRUE, 'For fungal infections'),

('med_zinc_oxide', 'Zinc Oxide Ointment', 'Zinc Oxide', 'ZINCOVET', 'SAMI Pharma', 'topical', 'ointment', 'topical',
'[{"name": "Zinc Oxide", "concentration": "200", "unit": "mg/g"}]',
'20%', 'Apply to wound', 'Topical', '2-3 times daily', 7,
'{"cow": {"dose": "Apply thin layer", "route": "Topical"}, "buffalo": {"dose": "Apply thin layer", "route": "Topical"}}',
0, 0, ARRAY['None significant'}, ARRAY['Skin irritation'}, ARRAY['None'], TRUE, TRUE, 'Room temp', 24, TRUE, FALSE, '50-150', ARRAY['50g', '100g'], 4.1, 75, TRUE, 'For wound healing, protection')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    effectiveness_rating = EXCLUDED.effectiveness_rating,
    popularity_score = EXCLUDED.popularity_score,
    updated_at = NOW();
