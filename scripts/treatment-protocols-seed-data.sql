-- MTK Dairy - Treatment Protocols and Vaccination Schedules Seed Data
-- Based on Pakistan veterinary guidelines and pharmaceutical protocols

-- =====================================================
-- DISEASE TREATMENTS - Linking diseases to medicines
-- =====================================================

INSERT INTO disease_treatments (id, disease_id, medicine_id, is_primary_treatment, treatment_line, effectiveness_rating, recommended_dosage, dosage_per_kg, frequency, duration_days, for_species, special_instructions, when_to_use) VALUES

-- FMD Treatment
('dt_fmd_01', 'dis_fmd', 'md_gentian_violet', TRUE, 1, 4.0, 'Apply to lesions', NULL, '3 times daily', 7, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'Clean lesions before application', 'Early stage lesions'),

-- HS Treatment
('dt_hs_01', 'dis_hs', 'md_penicillin_g', TRUE, 1, 4.5, '1ml per 10kg', '1ml per 10kg', 'Once daily', 5, ARRAY['cow', 'buffalo'], 'Start immediately upon symptoms', 'Early diagnosis'),
('dt_hs_02', 'dis_hs', 'md_sulfadiazine_trimethoprim', FALSE, 2, 4.2, '1ml per 15kg', '1ml per 15kg', 'Once daily', 3, ARRAY['cow', 'buffalo'], 'Use if penicillin not available', 'Severe cases'),
('dt_hs_03', 'dis_hs', 'md_flunixin', FALSE, 1, 4.3, '1ml per 20kg', '1ml per 20kg', 'Once daily', 2, ARRAY['cow', 'buffalo'], 'For fever and inflammation', 'High fever cases'),

-- Blackleg Treatment
('dt_blackleg_01', 'dis_blackleg', 'md_penicillin_g', TRUE, 1, 4.0, '1ml per 10kg', '1ml per 10kg', 'Once daily', 5, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'Start immediately', 'Early stage'),
('dt_blackleg_02', 'dis_blackleg', 'md_oxytetracycline', FALSE, 2, 3.8, '1ml per 10kg', '1ml per 10kg', 'Once daily', 5, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'Alternative to penicillin', 'When penicillin not available'),

-- Mastitis Treatment
('dt_mastitis_01', 'dis_mastitis', 'md_amoxicillin', TRUE, 1, 4.4, 'Intramammary infusion', NULL, 'Twice daily', 3, ARRAY['cow', 'buffalo'], 'Infuse into affected quarter', 'Clinical mastitis'),
('dt_mastitis_02', 'dis_mastitis', 'md_ceftiofur', FALSE, 2, 4.6, '1ml per 20kg', '1ml per 20kg', 'Once daily', 3, ARRAY['cow', 'buffalo'], 'Systemic therapy', 'Severe mastitis'),
('dt_mastitis_03', 'dis_mastitis', 'md_meloxicam', FALSE, 1, 4.5, '0.5ml per 10kg', '0.5ml per 10kg', 'Once daily', 3, ARRAY['cow', 'buffalo'], 'For pain and inflammation', 'Painful mastitis'),

-- Brucellosis Treatment
('dt_brucellosis_01', 'dis_brucellosis', 'md_oxytetracycline', TRUE, 1, 3.5, '1ml per 10kg', '1ml per 10kg', 'Once daily', 21, ARRAY['cow', 'buffalo'], 'Long-term therapy', 'Confirmed cases'),
('dt_brucellosis_02', 'dis_brucellosis', 'md_sulfadiazine_trimethoprim', FALSE, 1, 3.8, '1ml per 15kg', '1ml per 15kg', 'Once daily', 21, ARRAY['cow', 'buffalo'], 'Combination therapy', 'With tetracycline'),

-- Anthrax Treatment
('dt_anthrax_01', 'dis_anthrax', 'md_penicillin_g', TRUE, 1, 4.8, '1ml per 10kg', '1ml per 10kg', 'Once daily', 7, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'Start immediately', 'Early treatment'),
('dt_anthrax_02', 'dis_anthrax', 'md_ciprofloxacin', FALSE, 2, 4.5, '0.5ml per 10kg', '0.5ml per 10kg', 'Once daily', 5, ARRAY['cow', 'buffalo'], 'Alternative to penicillin', 'Penicillin allergy'),

-- Babesiosis Treatment
('dt_babesiosis_01', 'dis_babesiosis', 'md_diminazene', TRUE, 1, 4.7, '3mg per kg', '3mg per kg', 'Single dose', 1, ARRAY['cow', 'buffalo'], 'IM injection only', 'Acute cases'),
('dt_babesiosis_02', 'dis_babesiosis', 'md_imidocarb', FALSE, 2, 4.5, '2mg per kg', '2mg per kg', 'Single dose', 1, ARRAY['cow', 'buffalo'], 'Split dose if needed', 'Severe cases'),
('dt_babesiosis_03', 'dis_babesiosis', 'md_flunixin', FALSE, 1, 4.2, '1ml per 20kg', '1ml per 20kg', 'Once daily', 2, ARRAY['cow', 'buffalo'], 'For fever', 'High fever'),

-- Theileriosis Treatment
('dt_theileriosis_01', 'dis_theileriosis', 'md_buparvaquone', TRUE, 1, 4.6, '2.5mg per kg', '2.5mg per kg', 'Single dose', 1, ARRAY['cow', 'buffalo'], 'IM injection', 'Early treatment'),
('dt_theileriosis_02', 'dis_theileriosis', 'md_oxytetracycline', FALSE, 2, 3.8, '1ml per 10kg', '1ml per 10kg', 'Once daily', 5, ARRAY['cow', 'buffalo'], 'Supportive therapy', 'Secondary infections'),

-- Anaplasmosis Treatment
('dt_anaplasmosis_01', 'dis_anaplasmosis', 'md_oxytetracycline', TRUE, 1, 4.3, '1ml per 10kg', '1ml per 10kg', 'Once daily', 5, ARRAY['cow', 'buffalo'], 'Long-acting preferred', 'Acute phase'),
('dt_anaplasmosis_02', 'dis_anaplasmosis', 'md_imidocarb', FALSE, 2, 4.0, '2mg per kg', '2mg per kg', 'Single dose', 1, ARRAY['cow', 'buffalo'], 'Alternative therapy', 'Chronic cases'),

-- Fasciolosis Treatment
('dt_fasciolosis_01', 'dis_fasciolosis', 'md_oxfendazole', TRUE, 1, 4.5, '4.5mg per kg', '4.5mg per kg', 'Single dose', 1, ARRAY['cow', 'buffalo'], 'Strategic deworming', 'Post-monsoon'),
('dt_fasciolosis_02', 'dis_fasciolosis', 'md_albendazole', FALSE, 2, 4.3, '5mg per kg', '5mg per kg', 'Single dose', 1, ARRAY['cow', 'buffalo'], 'Alternative', 'When oxfendazole not available'),
('dt_fasciolosis_03', 'dis_fasciolosis', 'md_triclabendazole', FALSE, 1, 4.7, '10mg per kg', '10mg per kg', 'Single dose', 1, ARRAY['cow', 'buffalo'], 'Most effective', 'All stages'),

-- GI Parasites Treatment
('dt_gi_parasites_01', 'dis_gi_parasites', 'md_ivermectin', TRUE, 1, 4.6, '1ml per 50kg', '1ml per 50kg', 'Single dose', 1, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'Broad spectrum', 'Regular deworming'),
('dt_gi_parasites_02', 'dis_gi_parasites', 'md_fenbendazole', FALSE, 2, 4.3, '5mg per kg', '5mg per kg', 'Single dose', 1, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'Safe for pregnant', 'Pregnant animals'),
('dt_gi_parasites_03', 'dis_gi_parasites', 'md_albendazole', FALSE, 1, 4.4, '5mg per kg', '5mg per kg', 'Single dose', 1, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'Broad spectrum', 'Strategic deworming'),

-- Milk Fever Treatment
('dt_milk_fever_01', 'dis_milk_fever', 'md_calcium_borogluconate', TRUE, 1, 4.8, '1ml per 10kg', '1ml per 10kg', 'Single dose', 1, ARRAY['cow', 'buffalo'], 'Slow IV', 'At calving'),
('dt_milk_fever_02', 'dis_milk_fever', 'md_calcium_borogluconate', FALSE, 1, 4.8, '1ml per 10kg', '1ml per 10kg', 'Repeat after 12h', 1, ARRAY['cow', 'buffalo'], 'If symptoms persist', 'Recurrent cases'),
('dt_milk_fever_03', 'dis_milk_fever', 'md_vitamin_a_d_e', FALSE, 2, 4.0, '1ml per 20kg', '1ml per 20kg', 'Single dose', 1, ARRAY['cow', 'buffalo'], 'Supportive therapy', 'Prevention'),

-- Ketosis Treatment
('dt_ketosis_01', 'dis_ketosis', 'md_dextrose_50', TRUE, 1, 4.5, '500ml', NULL, 'Single dose', 1, ARRAY['cow', 'buffalo'], 'Slow IV', 'Acute ketosis'),
('dt_ketosis_02', 'dis_ketosis', 'md_propylene_glycol', FALSE, 1, 4.2, '250ml', NULL, 'Twice daily', 5, ARRAY['cow', 'buffalo'], 'Oral drench', 'Mild cases'),
('dt_ketosis_03', 'dis_ketosis', 'md_corticosteroid', FALSE, 2, 4.0, '10mg', NULL, 'Single dose', 1, ARRAY['cow', 'buffalo'], 'IM injection', 'Severe cases'),

-- Bloat Treatment
('dt_bloat_01', 'dis_bloat', 'md_antacid', TRUE, 1, 4.3, '1ml per 10kg', '1ml per 10kg', 'Single dose', 1, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'Oral drench', 'Frothy bloat'),
('dt_bloat_02', 'dis_bloat', 'md_trocar_cannula', FALSE, 1, 4.8, 'Surgical', NULL, 'Emergency', 1, ARRAY['cow', 'buffalo'], 'Left flank puncture', 'Severe bloat'),
('dt_bloat_03', 'dis_bloat', 'md_oil_mineral', FALSE, 2, 4.0, '500ml', NULL, 'Single dose', 1, ARRAY['cow', 'buffalo'], 'Oral', 'Feedlot bloat'),

-- Pneumonia Treatment
('dt_pneumonia_01', 'dis_pneumonia', 'md_oxytetracycline', TRUE, 1, 4.2, '1ml per 10kg', '1ml per 10kg', 'Once daily', 5, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'Broad spectrum', 'Bacterial pneumonia'),
('dt_pneumonia_02', 'dis_pneumonia', 'md_enrofloxacin', FALSE, 2, 4.4, '0.5ml per 10kg', '0.5ml per 10kg', 'Once daily', 3, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'For severe cases', 'Complicated pneumonia'),
('dt_pneumonia_03', 'dis_pneumonia', 'md_flunixin', FALSE, 1, 4.3, '1ml per 20kg', '1ml per 20kg', 'Once daily', 3, ARRAY['cow', 'buffalo', 'goat', 'sheep'], 'For fever', 'High fever'),

-- PPR Treatment
('dt_ppr_01', 'dis_ppr', 'md_oxytetracycline', TRUE, 1, 4.0, '1ml per 10kg', '1ml per 10kg', 'Once daily', 5, ARRAY['goat', 'sheep'], 'Prevent secondary infection', 'Supportive therapy'),
('dt_ppr_02', 'dis_ppr', 'md_vitamin_a_d_e', FALSE, 1, 4.2, '0.5ml per 10kg', '0.5ml per 10kg', 'Single dose', 1, ARRAY['goat', 'sheep'], 'Supportive therapy', 'All cases'),
('dt_ppr_03', 'dis_ppr', 'md_sulfadiazine_trimethoprim', FALSE, 2, 4.1, '1ml per 15kg', '1ml per 15kg', 'Once daily', 3, ARRAY['goat', 'sheep'], 'For diarrhea', 'With diarrhea'),

-- CCPP Treatment
('dt_ccpp_01', 'dis_ccpp', 'md_tylosin', TRUE, 1, 4.5, '1ml per 10kg', '1ml per 10kg', 'Once daily', 5, ARRAY['goat'], 'Long-acting preferred', 'Early treatment'),
('dt_ccpp_02', 'dis_ccpp', 'md_enrofloxacin', FALSE, 2, 4.3, '0.5ml per 10kg', '0.5ml per 10kg', 'Once daily', 3, ARRAY['goat'], 'Alternative', 'Severe cases'),

-- Enterotoxemia Treatment
('dt_enterotoxemia_01', 'dis_enterotoxemia', 'md_penicillin_g', TRUE, 1, 4.2, '1ml per 10kg', '1ml per 10kg', 'Once daily', 5, ARRAY['goat', 'sheep'], 'Start immediately', 'Early cases'),
('dt_enterotoxemia_02', 'dis_enterotoxemia', 'md_antitoxin', FALSE, 1, 4.5, '5000 IU', NULL, 'Single dose', 1, ARRAY['goat', 'sheep'], 'IV injection', 'All cases'),
('dt_enterotoxemia_03', 'dis_enterotoxemia', 'md_vitamin_b_complex', FALSE, 2, 4.0, '5ml', NULL, 'Once daily', 3, ARRAY['goat', 'sheep'], 'Supportive therapy', 'Recovery phase'),

-- Calf Scours Treatment
('dt_calf_scour_01', 'dis_calf_scour', 'md_electrolyte_solution', TRUE, 1, 4.6, '2-4 liters', NULL, 'Multiple times', 2, ARRAY['cow', 'buffalo'], 'Oral electrolytes', 'All cases'),
('dt_calf_scour_02', 'dis_calf_scour', 'md_sulfadiazine_trimethoprim', FALSE, 2, 4.1, '1ml per 15kg', '1ml per 15kg', 'Once daily', 3, ARRAY['cow', 'buffalo'], 'For bacterial scours', 'With fever'),
('dt_calf_scour_03', 'dis_calf_scour', 'md_probiotics', FALSE, 1, 4.3, '10g', NULL, 'Once daily', 5, ARRAY['cow', 'buffalo'], 'Mix in milk', 'Recovery phase')

ON CONFLICT (disease_id, medicine_id) DO UPDATE SET
    effectiveness_rating = EXCLUDED.effectiveness_rating,
    special_instructions = EXCLUDED.special_instructions;

-- =====================================================
-- VACCINATION SCHEDULES
-- =====================================================

INSERT INTO vaccination_schedules (id, disease_id, vaccine_medicine_id, species, animal_age_start_months, animal_age_start_label, dose_number, interval_from_previous_days, booster_interval_months, recommended_season, recommended_months, route, dosage, priority, government_program, notes) VALUES

-- FMD Vaccination
('vs_fmd_01', 'dis_fmd', 'md_fmd_vaccine', 'cow', 4, '4 months', 1, 0, 6, 'Pre-monsoon', ARRAY['February', 'March', 'August', 'September'], 'subcutaneous', '1ml', 'essential', TRUE, 'Biannual vaccination in endemic areas'),
('vs_fmd_02', 'dis_fmd', 'md_fmd_vaccine', 'buffalo', 4, '4 months', 1, 0, 6, 'Pre-monsoon', ARRAY['February', 'March', 'August', 'September'], 'subcutaneous', '1ml', 'essential', TRUE, 'Biannual vaccination'),
('vs_fmd_03', 'dis_fmd', 'md_fmd_vaccine', 'goat', 3, '3 months', 1, 0, 6, 'Pre-monsoon', ARRAY['February', 'March', 'August', 'September'], 'subcutaneous', '1ml', 'essential', TRUE, 'Biannual vaccination'),
('vs_fmd_04', 'dis_fmd', 'md_fmd_vaccine', 'sheep', 3, '3 months', 1, 0, 6, 'Pre-monsoon', ARRAY['February', 'March', 'August', 'September'], 'subcutaneous', '1ml', 'essential', TRUE, 'Biannual vaccination'),

-- HS Vaccination
('vs_hs_01', 'dis_hs', 'md_hs_vaccine', 'cow', 6, '6 months', 1, 0, 12, 'Pre-monsoon', ARRAY['April', 'May'], 'subcutaneous', '1ml', 'essential', TRUE, 'Annual vaccination before monsoon'),
('vs_hs_02', 'dis_hs', 'md_hs_vaccine', 'buffalo', 6, '6 months', 1, 0, 12, 'Pre-monsoon', ARRAY['April', 'May'], 'subcutaneous', '1ml', 'essential', TRUE, 'Annual vaccination'),

-- Blackleg Vaccination
('vs_blackleg_01', 'dis_blackleg', 'md_blackleg_vaccine', 'cow', 3, '3 months', 1, 0, 12, 'Post-monsoon', ARRAY['October', 'November'], 'subcutaneous', '1ml', 'recommended', FALSE, 'Annual vaccination'),
('vs_blackleg_02', 'dis_blackleg', 'md_blackleg_vaccine', 'buffalo', 3, '3 months', 1, 0, 12, 'Post-monsoon', ARRAY['October', 'November'], 'subcutaneous', '1ml', 'recommended', FALSE, 'Annual vaccination'),
('vs_blackleg_03', 'dis_blackleg', 'md_blackleg_vaccine', 'goat', 2, '2 months', 1, 0, 12, 'Post-monsoon', ARRAY['October', 'November'], 'subcutaneous', '1ml', 'recommended', FALSE, 'Annual vaccination'),
('vs_blackleg_04', 'dis_blackleg', 'md_blackleg_vaccine', 'sheep', 2, '2 months', 1, 0, 12, 'Post-monsoon', ARRAY['October', 'November'], 'subcutaneous', '1ml', 'recommended', FALSE, 'Annual vaccination'),

-- Anthrax Vaccination
('vs_anthrax_01', 'dis_anthrax', 'md_anthrax_vaccine', 'cow', 6, '6 months', 1, 0, 12, 'Summer', ARRAY['March', 'April'], 'subcutaneous', '1ml', 'essential', TRUE, 'Annual vaccination in endemic areas'),
('vs_anthrax_02', 'dis_anthrax', 'md_anthrax_vaccine', 'buffalo', 6, '6 months', 1, 0, 12, 'Summer', ARRAY['March', 'April'], 'subcutaneous', '1ml', 'essential', TRUE, 'Annual vaccination'),
('vs_anthrax_03', 'dis_anthrax', 'md_anthrax_vaccine', 'goat', 6, '6 months', 1, 0, 12, 'Summer', ARRAY['March', 'April'], 'subcutaneous', '1ml', 'essential', TRUE, 'Annual vaccination'),
('vs_anthrax_04', 'dis_anthrax', 'md_anthrax_vaccine', 'sheep', 6, '6 months', 1, 0, 12, 'Summer', ARRAY['March', 'April'], 'subcutaneous', '1ml', 'essential', TRUE, 'Annual vaccination'),

-- PPR Vaccination
('vs_ppr_01', 'dis_ppr', 'md_ppr_vaccine', 'goat', 3, '3 months', 1, 0, 12, 'Winter', ARRAY['November', 'December'], 'subcutaneous', '1ml', 'essential', TRUE, 'Annual vaccination campaign'),
('vs_ppr_02', 'dis_ppr', 'md_ppr_vaccine', 'sheep', 3, '3 months', 1, 0, 12, 'Winter', ARRAY['November', 'December'], 'subcutaneous', '1ml', 'essential', TRUE, 'Annual vaccination campaign'),

-- Brucellosis Vaccination
('vs_brucellosis_01', 'dis_brucellosis', 'md_brucellosis_vaccine', 'cow', 4, '4 months', 1, 0, NULL, 'Any season', ARRAY['January', 'February', 'March'], 'subcutaneous', '2ml', 'recommended', FALSE, 'Only female calves, single dose'),
('vs_brucellosis_02', 'dis_brucellosis', 'md_brucellosis_vaccine', 'buffalo', 4, '4 months', 1, 0, NULL, 'Any season', ARRAY['January', 'February', 'March'], 'subcutaneous', '2ml', 'recommended', FALSE, 'Only female calves, single dose')

ON CONFLICT (disease_id, vaccine_medicine_id, species, dose_number) DO UPDATE SET
    recommended_months = EXCLUDED.recommended_months,
    notes = EXCLUDED.notes;

-- =====================================================
-- TREATMENT PROTOCOLS
-- =====================================================

INSERT INTO treatment_protocols (id, disease_id, name, protocol_type, severity_level, steps, medicines_required, supportive_care, dietary_recommendations, isolation_required, expected_recovery_days, success_rate, escalation_signs, refer_to_vet_when, source, is_active) VALUES

-- FMD Protocol
('tp_fmd_01', 'dis_fmd', 'FMD Management Protocol', 'treatment', 'moderate',
'[{"order": 1, "action": "Isolate affected animals", "duration": "14 days", "notes": "Separate housing, dedicated equipment"}, {"order": 2, "action": "Provide soft, palatable feed", "duration": "7 days", "notes": "Mashed feed, green fodder"}, {"order": 3, "action": "Apply antiseptic to lesions", "duration": "7 days", "notes": "Gentian violet or povidone iodine"}, {"order": 4, "action": "Monitor for secondary infections", "duration": "14 days", "notes": "Check for bacterial infections"}]',
'[{"medicine_id": "md_gentian_violet", "dosage": "Apply to lesions", "frequency": "3 times daily", "duration": "7 days"}]',
ARRAY['Clean water', 'Soft bedding', 'Shaded area'],
ARRAY['Soft feeds', 'Concentrates', 'Green fodder'],
TRUE, 21, '90%', ARRAY['High fever >106°F', 'Refusal to eat for 3 days', 'Severe lameness'], ARRAY['High fever', 'Multiple lesions', 'Pregnant animals'], 'Pakistan Veterinary Guidelines', TRUE),

-- HS Protocol
('tp_hs_01', 'dis_hs', 'Hemorrhagic Septicemia Emergency Protocol', 'emergency_care', 'critical',
'[{"order": 1, "action": "Immediate antibiotic therapy", "duration": "5 days", "notes": "Penicillin G or sulfonamides"}, {"order": 2, "action": "Anti-inflammatory treatment", "duration": "2 days", "notes": "Flunixin for fever"}, {"order": 3, "action": "Fluid therapy", "duration": "3 days", "notes": "IV fluids if dehydrated"}, {"order": 4, "action": "Isolate and quarantine", "duration": "14 days", "notes": "Prevent spread"}]',
'[{"medicine_id": "md_penicillin_g", "dosage": "1ml per 10kg", "frequency": "Once daily", "duration": "5 days"}, {"medicine_id": "md_flunixin", "dosage": "1ml per 20kg", "frequency": "Once daily", "duration": "2 days"}]',
ARRAY['IV fluids', 'Cool environment', 'Rest'],
ARRAY['Soft feeds', 'Electrolytes'],
TRUE, 7, '70% with early treatment', ARRAY['Difficulty breathing', 'Bloody discharge', 'Collapse'], ARRAY['All cases', 'Within 6 hours of symptoms'], 'Star Labs Protocol', TRUE),

-- Mastitis Protocol
('tp_mastitis_01', 'dis_mastitis', 'Clinical Mastitis Treatment', 'treatment', 'moderate',
'[{"order": 1, "action": "Milk out affected quarter", "duration": "Every 6 hours", "notes": "Complete milking"}, {"order": 2, "action": "Intramammary antibiotic infusion", "duration": "3 days", "notes": "After milking, clean teat end"}, {"order": 3, "action": "Systemic antibiotics if needed", "duration": "3-5 days", "notes": "For severe cases"}, {"order": 4, "action": "Anti-inflammatory therapy", "duration": "3 days", "notes": "For pain and swelling"}]',
'[{"medicine_id": "md_amoxicillin", "dosage": "Intramammary", "frequency": "Twice daily", "duration": "3 days"}, {"medicine_id": "md_meloxicam", "dosage": "0.5ml per 10kg", "frequency": "Once daily", "duration": "3 days"}]',
ARRAY['Udder massage', 'Hot compress', 'Clean bedding'],
ARRAY['Reduced concentrates', 'Increased fiber'],
FALSE, 7, '85%', ARRAY['Systemic illness', 'Gangrenous changes', 'No improvement in 48 hours'], ARRAY['Severe mastitis', 'Systemic signs', 'Repeat cases'], 'Hilton Pharma Guidelines', TRUE),

-- Babesiosis Protocol
('tp_babesiosis_01', 'dis_babesiosis', 'Tick Fever Treatment Protocol', 'treatment', 'severe',
'[{"order": 1, "action": "Specific babesiacide", "duration": "1 day", "notes": "Diminazene or imidocarb"}, {"order": 2, "action": "Supportive therapy", "duration": "5 days", "notes": "IV fluids, vitamins"}, {"order": 3, "action": "Tick control", "duration": "Continuous", "notes": "Spraying/dipping"}, {"order": 4, "action": "Blood transfusion if needed", "duration": "1 day", "notes": "PCV < 15%"}]',
'[{"medicine_id": "md_diminazene", "dosage": "3mg per kg", "frequency": "Single dose", "duration": "1 day"}, {"medicine_id": "md_flunixin", "dosage": "1ml per 20kg", "frequency": "Once daily", "duration": "2 days"}]',
ARRAY['Blood transfusion', 'IV fluids', 'Rest'],
ARRAY['High quality feed', 'Iron supplements'],
TRUE, 14, '80% with early treatment', ARRAY['PCV < 15%', 'Red urine', 'High fever >105°F'], ARRAY['All confirmed cases', 'Severe anemia'], 'Pakistan Veterinary Research Institute', TRUE),

-- Milk Fever Protocol
('tp_milk_fever_01', 'dis_milk_fever', 'Hypocalcemia Emergency Protocol', 'emergency_care', 'critical',
'[{"order": 1, "action": "IV calcium borogluconate", "duration": "30 minutes", "notes": "Slow infusion, monitor heart"}, {"order": 2, "action": "Second injection if needed", "duration": "12 hours", "notes": "If still recumbent"}, {"order": 3, "action": "Oral calcium supplements", "duration": "3 days", "notes": "Prevent relapse"}, {"order": 4, "action": "Position animal correctly", "duration": "Continuous", "notes": "Sternum recumbency"}]',
'[{"medicine_id": "md_calcium_borogluconate", "dosage": "1ml per 10kg", "frequency": "Single dose", "duration": "1 day"}]',
ARRAY['Comfortable bedding', 'Frequent position changes', 'Warm water'],
ARRAY['Low calcium diet pre-calving', 'Anionic salts'],
FALSE, 2, '95% with prompt treatment', ARRAY['Recumbent > 12 hours', 'Bloat', 'Regurgitation'], ARRAY['All cases', 'Immediately after calving'], 'Veterinary Medicine Handbook', TRUE),

-- PPR Protocol
('tp_ppr_01', 'dis_ppr', 'PPR Supportive Care Protocol', 'treatment', 'severe',
'[{"order": 1, "action": "Isolate sick animals", "duration": "14 days", "notes": "Prevent spread"}, {"order": 2, "action": "Antibiotic therapy", "duration": "5 days", "notes": "Prevent secondary infection"}, {"order": 3, "action": "Supportive care", "duration": "7 days", "notes": "Fluids, vitamins"}, {"order": 4, "action': "Vaccinate rest of flock", "duration": "1 day", "notes": "Ring vaccination"}]',
'[{"medicine_id": "md_oxytetracycline", "dosage": "1ml per 10kg", "frequency": "Once daily", "duration": "5 days"}, {"medicine_id": "md_vitamin_a_d_e", "dosage": "0.5ml per 10kg", "frequency": "Single dose", "duration": "1 day"}]',
ARRAY['Clean water', 'Soft feeds', 'Shelter'],
ARRAY['Palatable feeds', 'Concentrates', 'Green fodder'],
TRUE, 14, '60% in outbreaks', ARRAY['Pneumonia', 'Bloody diarrhea', 'Refusal to eat'], ARRAY['All cases', 'During outbreaks'], 'FAO Guidelines', TRUE),

-- Calf Scours Protocol
('tp_calf_scour_01', 'dis_calf_scour', 'Neonatal Diarrhea Protocol', 'treatment', 'moderate',
'[{"order": 1, "action": "Fluid therapy", "duration": "2-3 days", "notes": "Electrolyte solution"}, {"order": 2, "action": "Continue milk feeding", "duration": "Continuous", "notes": "Never withold milk"}, {"order": 3, "action": "Antibiotic if bacterial", "duration": "3-5 days", "notes": "Based on fecal test"}, {"order": 4, "action": "Probiotics", "duration": "5 days", "notes": "Restore gut flora"}]',
'[{"medicine_id": "md_electrolyte_solution", "dosage": "2 liters", "frequency": "3-4 times daily", "duration": "2 days"}, {"medicine_id": "md_sulfadiazine_trimethoprim", "dosage": "1ml per 15kg", "frequency": "Once daily", "duration": "3 days"}]',
ARRAY['Warm environment', 'Clean bedding', 'Monitor hydration'],
ARRAY['Continue milk', 'Add probiotics', 'Easy to digest'],
FALSE, 5, '90% with proper care', ARRAY['Severe dehydration', 'Sunken eyes', 'Cold extremities'], ARRAY['Not improving in 24 hours', 'Severe dehydration', 'Blood in stool'], 'Calf Management Guide', TRUE)

ON CONFLICT (disease_id, name) DO UPDATE SET
    steps = EXCLUDED.steps,
    success_rate = EXCLUDED.success_rate;
