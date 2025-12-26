-- MTK Dairy - Disease Seed Data for Pakistan
-- Based on research: PMC studies, Pakistan veterinary sources, and pharmaceutical companies

-- =====================================================
-- DISEASES DATA - Major diseases affecting livestock in Pakistan
-- =====================================================

INSERT INTO diseases (id, name, name_urdu, local_name, category, subcategory, causative_agent, affected_species, symptoms, early_signs, advanced_signs, transmission_mode, incubation_period, mortality_rate, morbidity_rate, zoonotic, peak_season, high_risk_regions, preventive_measures, vaccination_available, economic_impact_score, milk_production_impact, severity_default, is_notifiable) VALUES

-- BACTERIAL DISEASES
('dis_fmd', 'Foot and Mouth Disease (FMD)', 'منہ کھر کی بیماری', 'Muh Khur', 'infectious', 'viral', 'Aphthovirus (Picornaviridae)', ARRAY['cow', 'buffalo', 'goat', 'sheep'], 
ARRAY['Fever', 'Blisters on mouth and feet', 'Excessive salivation', 'Lameness', 'Reduced milk yield', 'Loss of appetite'],
ARRAY['Initial fever (104-106°F)', 'Smacking lips', 'Drooling'],
ARRAY['Vesicles rupture forming ulcers', 'Severe lameness', 'Hoof separation', 'Secondary infections'],
'direct contact', '2-8 days', '2-5% adults, up to 50% calves', 'High (up to 100%)', FALSE, 'Year-round, peaks in monsoon', 
ARRAY['Punjab', 'Sindh', 'KPK', 'Balochistan'], 
ARRAY['Regular vaccination', 'Quarantine infected animals', 'Disinfection', 'Movement control'], TRUE, 5, 'Reduces by 25-50%', 'severe', TRUE),

('dis_hs', 'Hemorrhagic Septicemia (HS)', 'گلگھونٹو', 'Gal Ghotu', 'infectious', 'bacterial', 'Pasteurella multocida Type B:2', ARRAY['cow', 'buffalo'],
ARRAY['High fever', 'Swelling of throat and neck', 'Difficulty breathing', 'Bloody discharge from nose', 'Sudden death'],
ARRAY['Depression', 'High fever (106-107°F)', 'Stopped rumination'],
ARRAY['Severe throat swelling', 'Respiratory distress', 'Bloody diarrhea', 'Death within 24-48 hours'],
'direct contact', '1-3 days', '80-100% if untreated', 'Variable', FALSE, 'Monsoon (July-September)',
ARRAY['Sindh', 'Punjab', 'Balochistan'],
ARRAY['Pre-monsoon vaccination', 'Avoid stress during monsoon', 'Proper drainage'], TRUE, 5, 'Fatal if not treated', 'critical', TRUE),

('dis_blackleg', 'Black Quarter (Blackleg)', 'کالا زخم', 'Kala Zakham', 'infectious', 'bacterial', 'Clostridium chauvoei', ARRAY['cow', 'buffalo', 'goat', 'sheep'],
ARRAY['High fever', 'Lameness', 'Swelling in muscles', 'Crepitation on touch', 'Rapid death'],
ARRAY['Sudden lameness', 'Fever', 'Depression'],
ARRAY['Gas-filled swellings', 'Skin turns dark', 'Death within 12-48 hours'],
'soil-borne spores', '1-5 days', '100% if untreated', 'Sporadic', FALSE, 'Post-monsoon',
ARRAY['Punjab', 'Sindh', 'KPK'],
ARRAY['Annual vaccination', 'Avoid grazing in contaminated areas', 'Proper carcass disposal'], TRUE, 5, 'Fatal', 'critical', TRUE),

('dis_mastitis', 'Mastitis', 'تھنوں کی سوزش', 'Thanon Ki Sozish', 'infectious', 'bacterial', 'Staphylococcus, Streptococcus, E. coli', ARRAY['cow', 'buffalo', 'goat'],
ARRAY['Swollen udder', 'Hot and painful udder', 'Abnormal milk', 'Reduced milk production', 'Fever', 'Clots in milk'],
ARRAY['Slight swelling', 'Flakes in milk', 'Reduced milk flow'],
ARRAY['Hardened quarter', 'Bloody/purulent milk', 'Systemic illness', 'Gangrenous tissue'],
'environmental/contagious', 'Variable', 'Low mortality, high morbidity', 'Very high', FALSE, 'Year-round',
ARRAY['Punjab', 'Sindh', 'KPK', 'Balochistan'],
ARRAY['Proper milking hygiene', 'Teat dipping', 'Dry cow therapy', 'Clean housing'], FALSE, 5, 'Reduces 25-100% per quarter', 'moderate', FALSE),

('dis_brucellosis', 'Brucellosis', 'بروسیلوسس', 'Rang', 'infectious', 'bacterial', 'Brucella abortus, B. melitensis', ARRAY['cow', 'buffalo', 'goat', 'sheep'],
ARRAY['Abortion', 'Retained placenta', 'Infertility', 'Orchitis in males', 'Weak calves'],
ARRAY['Repeat breeding', 'Late-term abortion'],
ARRAY['Chronic infertility', 'Hygroma', 'Arthritis'],
'direct contact with abortion material', 'Variable (weeks-months)', 'Low', 'Moderate', TRUE, 'Year-round',
ARRAY['Punjab', 'Sindh'],
ARRAY['Test and slaughter', 'Vaccination of young animals', 'Hygiene during calving'], TRUE, 4, 'Through abortion and infertility', 'moderate', TRUE),

('dis_anthrax', 'Anthrax', 'انتھراکس', 'Taka', 'infectious', 'bacterial', 'Bacillus anthracis', ARRAY['cow', 'buffalo', 'goat', 'sheep', 'horse'],
ARRAY['Sudden death', 'Blood from orifices', 'Swelling', 'High fever', 'Difficulty breathing'],
ARRAY['High fever', 'Excitement', 'Trembling'],
ARRAY['Bloody discharge', 'Rapid death', 'No rigor mortis'],
'soil spores', '1-14 days', '80-100%', 'Sporadic', TRUE, 'Summer',
ARRAY['Punjab', 'Sindh', 'Balochistan'],
ARRAY['Annual vaccination', 'Proper carcass disposal (burn/bury deep)', 'Avoid opening carcass'], TRUE, 5, 'Fatal', 'critical', TRUE),

-- PARASITIC DISEASES
('dis_babesiosis', 'Babesiosis (Tick Fever/Redwater)', 'ٹک بخار', 'Tick Fever', 'parasitic', 'blood_parasite', 'Babesia bigemina, B. bovis', ARRAY['cow', 'buffalo'],
ARRAY['High fever', 'Red/coffee-colored urine', 'Anemia', 'Jaundice', 'Weakness', 'Reduced milk'],
ARRAY['Fever', 'Reduced appetite', 'Dull coat'],
ARRAY['Hemoglobinuria', 'Severe anemia', 'Jaundice', 'Death'],
'tick-borne (Rhipicephalus)', '7-21 days', '20-50% if untreated', 'Moderate-High', FALSE, 'Summer (May-August)',
ARRAY['Punjab', 'Sindh', 'KPK'],
ARRAY['Tick control', 'Dipping/spraying', 'Prophylactic treatment'], FALSE, 4, 'Reduces significantly', 'severe', FALSE),

('dis_theileriosis', 'Theileriosis (East Coast Fever)', 'تھیلیریوسس', 'Motia', 'parasitic', 'blood_parasite', 'Theileria annulata, T. parva', ARRAY['cow', 'buffalo'],
ARRAY['High fever', 'Enlarged lymph nodes', 'Anemia', 'Difficulty breathing', 'Watery eyes'],
ARRAY['Fever', 'Swollen parotid lymph nodes'],
ARRAY['Severe anemia', 'Respiratory distress', 'Death'],
'tick-borne (Hyalomma)', '10-25 days', '30-70%', 'High in endemic areas', FALSE, 'Summer',
ARRAY['Punjab', 'Sindh'],
ARRAY['Tick control', 'Vaccination in endemic areas'], TRUE, 4, 'Severe reduction', 'severe', FALSE),

('dis_anaplasmosis', 'Anaplasmosis', 'اناپلاسموسس', 'Peela Bukhar', 'parasitic', 'blood_parasite', 'Anaplasma marginale', ARRAY['cow', 'buffalo'],
ARRAY['Fever', 'Anemia', 'Jaundice', 'Weight loss', 'Weakness', 'Pale mucous membranes'],
ARRAY['Mild fever', 'Reduced appetite'],
ARRAY['Severe anemia', 'Icterus', 'Constipation', 'Aggression'],
'tick-borne/mechanical', '7-60 days', '20-50%', 'High', FALSE, 'Summer',
ARRAY['Punjab', 'Sindh', 'KPK'],
ARRAY['Tick control', 'Proper needle hygiene'], FALSE, 4, 'Reduced by 30-50%', 'moderate', FALSE),

('dis_fasciolosis', 'Fasciolosis (Liver Fluke)', 'جگر کا کیڑا', 'Jigar Ka Keera', 'parasitic', 'helminth', 'Fasciola hepatica, F. gigantica', ARRAY['cow', 'buffalo', 'goat', 'sheep'],
ARRAY['Weight loss', 'Poor coat', 'Bottle jaw (edema)', 'Anemia', 'Diarrhea', 'Reduced milk'],
ARRAY['Gradual weight loss', 'Rough coat'],
ARRAY['Severe anemia', 'Submandibular edema', 'Ascites', 'Death'],
'ingestion of metacercariae from pasture', '6-12 weeks', 'Variable', 'High in wet areas', FALSE, 'Post-monsoon',
ARRAY['Punjab', 'Sindh'],
ARRAY['Strategic deworming', 'Drainage of wet areas', 'Snail control'], FALSE, 4, 'Reduced by 20-30%', 'moderate', FALSE),

('dis_gi_parasites', 'Gastrointestinal Parasites', 'معدے کے کیڑے', 'Pet Ke Keeray', 'parasitic', 'helminth', 'Haemonchus, Ostertagia, Cooperia spp.', ARRAY['cow', 'buffalo', 'goat', 'sheep'],
ARRAY['Weight loss', 'Diarrhea', 'Poor growth', 'Rough coat', 'Anemia', 'Bottle jaw'],
ARRAY['Reduced growth', 'Soft feces'],
ARRAY['Severe diarrhea', 'Extreme weight loss', 'Death in young'],
'fecal-oral', '2-4 weeks', 'Low-moderate', 'Very high', FALSE, 'Monsoon and post-monsoon',
ARRAY['Punjab', 'Sindh', 'KPK', 'Balochistan'],
ARRAY['Regular deworming', 'Rotational grazing', 'Good nutrition'], FALSE, 3, 'Reduced by 10-20%', 'mild', FALSE),

-- METABOLIC DISEASES
('dis_milk_fever', 'Milk Fever (Hypocalcemia)', 'دودھ بخار', 'Doodh Bukhar', 'metabolic', 'mineral_deficiency', 'Calcium deficiency', ARRAY['cow', 'buffalo'],
ARRAY['Weakness', 'Inability to stand', 'Cold ears', 'Muscle tremors', 'Constipation', 'S-shaped neck'],
ARRAY['Restlessness', 'Reduced appetite', 'Stiff gait'],
ARRAY['Recumbency', 'Coma', 'Death if untreated'],
'non-infectious', 'Hours post-calving', '10-20% if untreated', 'Common in high yielders', FALSE, 'Year-round',
ARRAY['Punjab', 'Sindh', 'KPK'],
ARRAY['Proper dry cow nutrition', 'Calcium supplements pre-calving', 'Avoid high calcium before calving'], FALSE, 4, 'Animal unable to produce', 'severe', FALSE),

('dis_ketosis', 'Ketosis (Acetonemia)', 'کیٹوسس', 'Acetonemia', 'metabolic', 'energy_deficiency', 'Negative energy balance', ARRAY['cow', 'buffalo'],
ARRAY['Reduced appetite', 'Weight loss', 'Sweet acetone smell', 'Reduced milk', 'Nervous signs'],
ARRAY['Decreased feed intake', 'Selective eating'],
ARRAY['Severe weight loss', 'Nervous ketosis', 'Recumbency'],
'non-infectious', 'First 6 weeks post-calving', 'Low', 'Common in high yielders', FALSE, 'Year-round',
ARRAY['Punjab', 'Sindh'],
ARRAY['Adequate energy in diet', 'Gradual transition to lactation diet', 'Prevent fatty liver'], FALSE, 3, 'Reduced by 25-50%', 'moderate', FALSE),

('dis_bloat', 'Bloat (Ruminal Tympany)', 'اپھارہ', 'Aphara', 'digestive', 'ruminal', 'Gas accumulation', ARRAY['cow', 'buffalo', 'goat', 'sheep'],
ARRAY['Distended left flank', 'Difficulty breathing', 'Restlessness', 'Salivation', 'Reluctance to move'],
ARRAY['Visible left flank distension', 'Discomfort'],
ARRAY['Severe distension', 'Respiratory distress', 'Collapse', 'Death'],
'dietary', 'Minutes to hours', 'High if untreated', 'Common', FALSE, 'Grazing season',
ARRAY['Punjab', 'Sindh', 'KPK'],
ARRAY['Gradual diet changes', 'Avoid lush legume pastures', 'Anti-bloat supplements'], FALSE, 4, 'Death if untreated', 'severe', FALSE),

-- REPRODUCTIVE DISEASES
('dis_metritis', 'Metritis/Endometritis', 'بچہ دانی کی سوزش', 'Bacha Dani Sozish', 'reproductive', 'uterine', 'E. coli, Arcanobacterium, Fusobacterium', ARRAY['cow', 'buffalo'],
ARRAY['Foul-smelling discharge', 'Fever', 'Reduced appetite', 'Decreased milk', 'Infertility'],
ARRAY['Abnormal discharge post-calving', 'Slow involution'],
ARRAY['Toxic metritis', 'Chronic endometritis', 'Infertility'],
'ascending infection', 'Post-calving', 'Low', 'Common', FALSE, 'Year-round',
ARRAY['Punjab', 'Sindh', 'KPK'],
ARRAY['Hygienic calving', 'Proper retained placenta treatment', 'Good nutrition'], FALSE, 4, 'Through delayed breeding', 'moderate', FALSE),

('dis_rp', 'Retained Placenta', 'پھنسی نال', 'Phansa Hua Jher', 'reproductive', 'post-partum', 'Multiple factors', ARRAY['cow', 'buffalo'],
ARRAY['Placenta hanging >12-24 hours', 'Foul smell', 'Fever', 'Reduced appetite'],
ARRAY['Membranes visible at vulva'],
ARRAY['Toxic metritis', 'Septicemia'],
'non-infectious', 'Post-calving', 'Low if treated', 'Common', FALSE, 'Year-round',
ARRAY['Punjab', 'Sindh', 'KPK', 'Balochistan'],
ARRAY['Adequate nutrition', 'Selenium/Vitamin E supplementation', 'Hygienic calving'], FALSE, 3, 'Delayed breeding', 'moderate', FALSE),

-- RESPIRATORY DISEASES
('dis_pneumonia', 'Pneumonia', 'نمونیا', 'Numonia', 'respiratory', 'lower_respiratory', 'Pasteurella, Mannheimia, viruses', ARRAY['cow', 'buffalo', 'goat', 'sheep'],
ARRAY['Coughing', 'Nasal discharge', 'Fever', 'Difficulty breathing', 'Reduced appetite'],
ARRAY['Dry cough', 'Mild fever', 'Slight nasal discharge'],
ARRAY['Labored breathing', 'Mouth breathing', 'Blue tongue'],
'airborne', '2-10 days', '5-30%', 'High', FALSE, 'Winter, early spring',
ARRAY['Punjab', 'Sindh', 'KPK'],
ARRAY['Good ventilation', 'Reduce stress', 'Vaccination', 'Colostrum management'], TRUE, 4, 'Reduced significantly', 'moderate', FALSE),

-- GOAT & SHEEP SPECIFIC
('dis_ppr', 'Peste des Petits Ruminants (PPR)', 'بکریوں کا طاعون', 'Bakri Ka Taoon', 'infectious', 'viral', 'Morbillivirus', ARRAY['goat', 'sheep'],
ARRAY['High fever', 'Nasal/ocular discharge', 'Mouth ulcers', 'Diarrhea', 'Pneumonia', 'Death'],
ARRAY['Fever', 'Watery eyes', 'Depression'],
ARRAY['Bloody diarrhea', 'Severe pneumonia', 'Death within week'],
'direct contact, aerosol', '3-6 days', '50-90%', 'High', FALSE, 'Year-round, peaks in winter',
ARRAY['Punjab', 'Sindh', 'KPK', 'Balochistan'],
ARRAY['Vaccination', 'Quarantine', 'Movement control'], TRUE, 5, 'High mortality in goats', 'critical', TRUE),

('dis_ccpp', 'Contagious Caprine Pleuropneumonia', 'چھوت دار پھیپھڑوں کی بیماری', 'Phephron Ki Bimari', 'infectious', 'bacterial', 'Mycoplasma capricolum', ARRAY['goat'],
ARRAY['Severe coughing', 'Difficulty breathing', 'Nasal discharge', 'Fever', 'Reluctance to move'],
ARRAY['Mild cough', 'Fever'],
ARRAY['Severe respiratory distress', 'Open-mouth breathing', 'Death'],
'aerosol', '6-10 days', '60-100%', 'High', FALSE, 'Any season',
ARRAY['KPK', 'Balochistan', 'Gilgit-Baltistan'],
ARRAY['Vaccination', 'Quarantine new animals'], TRUE, 5, 'High mortality', 'critical', TRUE),

('dis_enterotoxemia', 'Enterotoxemia (Pulpy Kidney)', 'بھیڑ بکریوں کا فوری موت', 'Achanak Maut', 'infectious', 'bacterial', 'Clostridium perfringens Type D', ARRAY['goat', 'sheep'],
ARRAY['Sudden death', 'Convulsions', 'Diarrhea', 'Bloat'],
ARRAY['Isolation from flock', 'Reduced appetite'],
ARRAY['Sudden death', 'Convulsions', 'Opisthotonus'],
'ingestion', 'Hours', 'Near 100%', 'Sporadic', FALSE, 'After feed change',
ARRAY['Punjab', 'Sindh', 'KPK'],
ARRAY['Vaccination', 'Gradual feed changes', 'Avoid overeating'], TRUE, 4, 'Sudden death', 'critical', FALSE),

('dis_orf', 'Orf (Contagious Ecthyma)', 'بکریوں کا منہ پکنا', 'Muh Pakna', 'infectious', 'viral', 'Parapoxvirus', ARRAY['goat', 'sheep'],
ARRAY['Scabs on lips/mouth', 'Difficulty eating', 'Weight loss', 'Lesions on udder'],
ARRAY['Small papules on lips'],
ARRAY['Large proliferative scabs', 'Secondary bacterial infection'],
'direct contact', '3-8 days', 'Low', 'High', TRUE, 'Year-round',
ARRAY['Punjab', 'Sindh', 'KPK', 'Balochistan'],
ARRAY['Vaccination in endemic areas', 'Avoid rough feeds', 'Hygiene'], TRUE, 2, 'Through reduced feeding', 'mild', FALSE),

-- SKIN DISEASES
('dis_lsd', 'Lumpy Skin Disease', 'گانٹھ دار جلد کی بیماری', 'Ganth Dar Jild', 'infectious', 'viral', 'Lumpy skin disease virus', ARRAY['cow', 'buffalo'],
ARRAY['Skin nodules', 'Fever', 'Enlarged lymph nodes', 'Edema', 'Reduced milk'],
ARRAY['Fever', 'Watery eyes'],
ARRAY['Large skin nodules', 'Secondary infections', 'Severe edema'],
'insect vectors, direct contact', '4-14 days', '1-5%', 'Variable', FALSE, 'Summer-monsoon',
ARRAY['Punjab', 'Sindh', 'KPK'],
ARRAY['Vaccination', 'Vector control', 'Quarantine'], TRUE, 4, 'Reduced by 40-65%', 'moderate', TRUE),

('dis_ringworm', 'Ringworm (Dermatophytosis)', 'داد', 'Daad', 'infectious', 'fungal', 'Trichophyton, Microsporum spp.', ARRAY['cow', 'buffalo', 'goat', 'sheep'],
ARRAY['Circular hair loss', 'Scaly skin', 'Itching', 'Gray crusty patches'],
ARRAY['Small circular lesions'],
ARRAY['Large spreading lesions', 'Secondary infection'],
'direct contact, fomites', '1-4 weeks', 'Nil', 'High in housed animals', TRUE, 'Winter',
ARRAY['Punjab', 'Sindh', 'KPK', 'Balochistan'],
ARRAY['Good hygiene', 'Sunlight exposure', 'Isolation of infected'], FALSE, 2, 'Minimal direct impact', 'mild', FALSE),

-- CALF DISEASES
('dis_calf_scour', 'Calf Scours (Neonatal Diarrhea)', 'بچھڑوں کا دست', 'Bachra Dast', 'digestive', 'neonatal', 'E. coli, Rotavirus, Cryptosporidium', ARRAY['cow', 'buffalo'],
ARRAY['Watery diarrhea', 'Dehydration', 'Weakness', 'Sunken eyes', 'Death'],
ARRAY['Loose feces', 'Reduced suckling'],
ARRAY['Severe dehydration', 'Collapse', 'Death within 24-48 hours'],
'fecal-oral', '1-7 days', '25-75% if untreated', 'Very high', FALSE, 'Year-round, peak in calving season',
ARRAY['Punjab', 'Sindh', 'KPK', 'Balochistan'],
ARRAY['Adequate colostrum', 'Clean calving area', 'Good hygiene'], TRUE, 4, 'Calf mortality', 'severe', FALSE),

('dis_navel_ill', 'Navel Ill (Omphalitis)', 'ناف کی سوزش', 'Naaf Sozish', 'infectious', 'bacterial', 'Staphylococcus, Streptococcus, E. coli', ARRAY['cow', 'buffalo', 'goat', 'sheep'],
ARRAY['Swollen navel', 'Pus discharge', 'Fever', 'Joint swelling', 'Lameness'],
ARRAY['Wet, swollen navel'],
ARRAY['Abscess', 'Septicemia', 'Joint ill'],
'umbilical infection', '3-7 days', '20-50%', 'Common', FALSE, 'Year-round',
ARRAY['Punjab', 'Sindh', 'KPK', 'Balochistan'],
ARRAY['Naval dipping with iodine', 'Clean calving area', 'Early colostrum'], FALSE, 3, 'Calf mortality/morbidity', 'moderate', FALSE)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    symptoms = EXCLUDED.symptoms,
    updated_at = NOW();
