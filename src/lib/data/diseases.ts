// Comprehensive Disease Database for Cows & Buffaloes
// Research by MTK CODEX - 2025

export type DiseaseSeverity = 'critical' | 'high' | 'moderate' | 'low';
export type DiseaseCategory = 
  | 'viral'
  | 'bacterial'
  | 'parasitic'
  | 'metabolic'
  | 'respiratory'
  | 'reproductive'
  | 'skin'
  | 'neonatal';

export interface Disease {
  id: string;
  name: string;
  localName?: string;
  nickname?: string;
  category: DiseaseCategory;
  severity: DiseaseSeverity;
  mortality: string;
  contagious: boolean;
  zoonotic: boolean;
  vaccineAvailable: boolean;
  emergencyCall: boolean;
  symptoms: string[];
  prevention: string[];
  treatment: string[];
  medicines: {
    name: string;
    purpose: string;
    dosage?: string;
    rating?: number;
  }[];
  notes?: string[];
  recoveryTime?: string;
  affectedAnimals: ('cow' | 'buffalo' | 'calf')[];
  seasonalRisk?: string;
  icon: string;
}

export interface PreventionTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

export interface VaccinationSchedule {
  age: string;
  vaccine: string;
  disease: string;
  frequency?: string;
}

export interface RecommendedProduct {
  name: string;
  category: string;
  rating: number;
  purpose: string;
}

// Disease Categories with metadata
export const diseaseCategories: Record<DiseaseCategory, { name: string; icon: string; color: string; description: string }> = {
  viral: {
    name: 'Viral Diseases',
    icon: '🦠',
    color: 'red',
    description: 'Vaccine-preventable viral infections'
  },
  bacterial: {
    name: 'Bacterial Diseases',
    icon: '🔬',
    color: 'orange',
    description: 'Monsoon killers - Vaccinate before rains!'
  },
  parasitic: {
    name: 'Parasitic Diseases',
    icon: '🪱',
    color: 'yellow',
    description: 'Tropical climate parasites - Regular deworming'
  },
  metabolic: {
    name: 'Metabolic & Nutritional',
    icon: '⚗️',
    color: 'blue',
    description: 'High-yielders & around calving'
  },
  respiratory: {
    name: 'Respiratory Diseases',
    icon: '🫁',
    color: 'cyan',
    description: 'Calf pneumonia & shipping fever'
  },
  reproductive: {
    name: 'Reproductive Diseases',
    icon: '🤰',
    color: 'pink',
    description: 'Fertility and breeding issues'
  },
  skin: {
    name: 'Skin & Eye Diseases',
    icon: '👁️',
    color: 'purple',
    description: 'External infections and conditions'
  },
  neonatal: {
    name: 'Neonatal Calf Diseases',
    icon: '🐄',
    color: 'green',
    description: 'First 3 months of life - Critical period'
  }
};

// Complete Disease Database
export const diseases: Disease[] = [
  // ============= VIRAL DISEASES =============
  {
    id: 'fmd',
    name: 'Foot & Mouth Disease (FMD)',
    localName: 'Muh Khur',
    category: 'viral',
    severity: 'critical',
    mortality: '2-5% adults, 50% calves',
    contagious: true,
    zoonotic: false,
    vaccineAvailable: true,
    emergencyCall: true,
    symptoms: [
      'High fever (104-106°F / 40-41°C)',
      'Excessive drooling/salivation',
      'Blisters (vesicles) on tongue, gums, hooves',
      'Lameness, reluctance to move',
      'Sudden milk drop (50-90%)',
      'Smacking lips, grinding teeth'
    ],
    prevention: [
      'Raksha Trivalent/CP Vaccine - Every 6 months (MANDATORY)',
      'Best time: Before monsoon and before winter',
      'Isolate new animals for 2 weeks',
      'Foot baths at farm entrance'
    ],
    treatment: [
      'Intacef-Tazo antibiotic (prevents secondary infection)',
      'Melonex for pain and fever',
      'Wash mouth with Potassium Permanganate (KMnO4) solution',
      'Soft feed only - avoid hard roughage',
      'Isolate affected animals immediately'
    ],
    medicines: [
      { name: 'Intacef-Tazo', purpose: 'Antibiotic - secondary infection', rating: 4.8 },
      { name: 'Melonex', purpose: 'Pain and fever', rating: 4.7 },
      { name: 'KMnO4 Solution', purpose: 'Mouth wash', rating: 4.5 }
    ],
    notes: [
      'Highly contagious - reportable disease',
      'Spread through air up to 60km',
      'Virus survives in environment for weeks',
      'FREE government vaccine available (NADCP)'
    ],
    recoveryTime: '2-3 weeks',
    affectedAnimals: ['cow', 'buffalo', 'calf'],
    icon: '🦶'
  },
  {
    id: 'lsd',
    name: 'Lumpy Skin Disease (LSD)',
    category: 'viral',
    severity: 'high',
    mortality: '1-5%',
    contagious: true,
    zoonotic: false,
    vaccineAvailable: true,
    emergencyCall: true,
    symptoms: [
      'Hard nodules/lumps all over body (2-5 cm)',
      'High fever (104-107°F / 40-42°C)',
      'Swollen limbs, unable to walk',
      'Milk production drops 70-90%',
      'Loss of appetite',
      'Enlarged lymph nodes'
    ],
    prevention: [
      'Goat Pox or LSD Live Vaccine - Annual',
      '90%+ protection if vaccinated properly',
      'Vector control (flies, mosquitoes)',
      'Quarantine new animals'
    ],
    treatment: [
      'Intacef-Tazo or Enrocin antibiotic (5-7 days)',
      'Melonex for fever and pain',
      'B-complex injection daily',
      'Supportive care - good nutrition',
      'Apply wound spray on lesions'
    ],
    medicines: [
      { name: 'Intacef-Tazo', purpose: 'Antibiotic', rating: 4.8 },
      { name: 'Enrocin', purpose: 'Antibiotic alternative', rating: 4.6 },
      { name: 'Melonex', purpose: 'Pain and fever', rating: 4.7 },
      { name: 'Tribivet', purpose: 'Liver support', rating: 4.5 }
    ],
    notes: [
      'Epidemic in 2022-2024 - Now controlled by vaccination',
      'Spread by biting insects',
      'Skin damage is permanent (scars)'
    ],
    recoveryTime: '3-4 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    seasonalRisk: 'Monsoon season',
    icon: '🔴'
  },
  {
    id: 'cowpox',
    name: 'Cowpox/Buffalopox',
    category: 'viral',
    severity: 'moderate',
    mortality: '<1%',
    contagious: true,
    zoonotic: true,
    vaccineAvailable: false,
    emergencyCall: false,
    symptoms: [
      'Pox lesions on teats and udder',
      'Painful during milking',
      'Milk production drops',
      'Scabs form on lesions'
    ],
    prevention: [
      'Clean milking practices',
      'Wash teats before/after milking',
      'Use separate cloth for each animal',
      'Milker hygiene - wash hands'
    ],
    treatment: [
      'Himax ointment on lesions',
      'Antibiotics only if secondary bacterial infection',
      'Usually self-limiting in 2-3 weeks',
      'Gentle milking to prevent teat damage'
    ],
    medicines: [
      { name: 'Himax Ointment', purpose: 'Topical healing', rating: 4.3 },
      { name: 'Lorexane', purpose: 'Wound spray', rating: 4.2 }
    ],
    notes: [
      'Very common in milking animals',
      'Can spread to milkers (zoonotic)',
      'Wear gloves during milking'
    ],
    recoveryTime: '2-3 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    icon: '💧'
  },
  {
    id: 'ibr',
    name: 'Infectious Bovine Rhinotracheitis (IBR)',
    nickname: 'Red Nose Disease',
    category: 'viral',
    severity: 'high',
    mortality: '5-10%',
    contagious: true,
    zoonotic: false,
    vaccineAvailable: true,
    emergencyCall: true,
    symptoms: [
      'Very high fever (106-108°F / 41-42°C)',
      'Red, raw nose',
      'Thick nasal discharge',
      'Eye discharge and tears',
      'Abortion in pregnant cows',
      'Rapid breathing'
    ],
    prevention: [
      'Bovilis IBR Marker Vaccine - Annual',
      'Especially important in dairy farms',
      'Isolate new animals',
      'Good ventilation'
    ],
    treatment: [
      'Ceftriaxone or Enrofloxacin (7-10 days)',
      'Melonex for fever',
      'Supportive care',
      'Eye drops for conjunctivitis'
    ],
    medicines: [
      { name: 'Ceftriaxone', purpose: 'Antibiotic', rating: 4.6 },
      { name: 'Enrofloxacin', purpose: 'Antibiotic', rating: 4.5 },
      { name: 'Melonex', purpose: 'Fever control', rating: 4.7 }
    ],
    notes: [
      'Virus stays in body lifelong (latent)',
      'Nearly 100% of herd gets infected if one animal is positive',
      'Stress causes reactivation'
    ],
    recoveryTime: '2-3 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    icon: '👃'
  },
  {
    id: 'bef',
    name: 'Bovine Ephemeral Fever',
    nickname: '3-Day Sickness',
    category: 'viral',
    severity: 'moderate',
    mortality: '1-2%',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: false,
    symptoms: [
      'Sudden high fever',
      'Stiffness in muscles',
      'Drooling, unable to swallow',
      'Animal lies down, cannot stand (recumbency)',
      'Recovers in 3 days usually',
      'Temporary paralysis'
    ],
    prevention: [
      'Control mosquitoes and flies (spread by insects)',
      'No vaccine available in most areas',
      'Use fly repellents'
    ],
    treatment: [
      'Complete rest - DO NOT force animal to stand',
      'Ketoprofen or Meloxicam for 3 days',
      'Calcium injection',
      'Tribivet/Belamyl liver tonic',
      'Animal recovers on its own in 3-7 days'
    ],
    medicines: [
      { name: 'Meloxicam', purpose: 'Pain relief', rating: 4.7 },
      { name: 'Calcium injection', purpose: 'Muscle support', rating: 4.5 },
      { name: 'Tribivet', purpose: 'Liver tonic', rating: 4.4 }
    ],
    notes: [
      'Don\'t stress animal during recovery or it will relapse',
      'Usually self-limiting',
      'More severe in bulls and fat cattle'
    ],
    recoveryTime: '3-7 days',
    affectedAnimals: ['cow', 'buffalo'],
    seasonalRisk: 'Monsoon - insect season',
    icon: '🦟'
  },

  // ============= BACTERIAL DISEASES =============
  {
    id: 'hs',
    name: 'Haemorrhagic Septicemia (HS)',
    localName: 'Gal Ghotu',
    category: 'bacterial',
    severity: 'critical',
    mortality: '80-100%',
    contagious: true,
    zoonotic: false,
    vaccineAvailable: true,
    emergencyCall: true,
    symptoms: [
      'Very high fever (106-107°F / 41-42°C)',
      'Swollen throat (can\'t breathe)',
      'Respiratory distress',
      'Bloody diarrhoea',
      'Sudden death (sometimes no symptoms seen)',
      'Drooling, difficulty swallowing'
    ],
    prevention: [
      'Raksha-HS or HS+BQ Combo Vaccine - Annual',
      'MUST vaccinate 1 month before monsoon',
      'FREE government vaccine available',
      'Avoid waterlogging in sheds'
    ],
    treatment: [
      'Ceftriaxone-Tazobactam IV (high dose) - EMERGENCY',
      'Flunixin or Meloxicam IV',
      'Avil (antihistamine) injection',
      'Only works if caught very early',
      'CALL VET IMMEDIATELY'
    ],
    medicines: [
      { name: 'Intacef-Tazo', purpose: 'High dose IV antibiotic', rating: 4.9 },
      { name: 'Flunixin', purpose: 'Anti-inflammatory', rating: 4.7 },
      { name: 'Avil', purpose: 'Antihistamine', rating: 4.3 }
    ],
    notes: [
      '#1 Monsoon Killer - Acts within 24 hours',
      'Even with treatment 30-50% die',
      'Prevention is the ONLY reliable solution',
      'Buffalo more susceptible than cattle'
    ],
    recoveryTime: 'If survives: 1-2 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    seasonalRisk: 'Monsoon - Peak killer',
    icon: '💀'
  },
  {
    id: 'bq',
    name: 'Black Quarter (BQ)',
    nickname: 'Blackleg',
    category: 'bacterial',
    severity: 'critical',
    mortality: '90-100%',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: true,
    emergencyCall: true,
    symptoms: [
      'Crepitating swelling in hip/shoulder (gas under skin)',
      'Crackling sound when touched',
      'Severe lameness',
      'High fever',
      'Sudden death (often found dead in morning)',
      'Dark, blackened muscle tissue'
    ],
    prevention: [
      'HS+BQ Combo Vaccine - Annual',
      'Vaccinate calves at 6 months and annually',
      'Good drainage in pastures',
      'Avoid grazing on recently flooded land'
    ],
    treatment: [
      'High-dose Penicillin (if caught extremely early)',
      'Melonex for pain',
      'Success rate very low',
      'Prevention is key - treatment rarely works'
    ],
    medicines: [
      { name: 'Penicillin G', purpose: 'High dose antibiotic', rating: 3.5 },
      { name: 'Melonex', purpose: 'Pain relief', rating: 4.7 }
    ],
    notes: [
      'Sudden death in young animals (6 months - 2 years)',
      'Spores live in soil for decades',
      'DO NOT open carcass - bury with lime'
    ],
    recoveryTime: 'Rarely survives',
    affectedAnimals: ['cow', 'buffalo', 'calf'],
    seasonalRisk: 'Monsoon',
    icon: '⚫'
  },
  {
    id: 'brucellosis',
    name: 'Brucellosis',
    nickname: 'Contagious Abortion',
    category: 'bacterial',
    severity: 'high',
    mortality: 'Low in adults',
    contagious: true,
    zoonotic: true,
    vaccineAvailable: true,
    emergencyCall: false,
    symptoms: [
      'Abortion in 5-8 months of pregnancy',
      'Retained placenta (doesn\'t come out)',
      'Weak calves born',
      'Repeat breeding failures',
      'Swollen joints in some animals',
      'Infertility'
    ],
    prevention: [
      'RB51 or S19 Vaccine (only in female calves before breeding)',
      'Buy animals only after testing',
      'Cannot vaccinate pregnant animals',
      'Test herd annually'
    ],
    treatment: [
      'Oxytetracycline LA + Streptomycin-Penicillin (long course)',
      'Not effective - Better to cull positive animals',
      'No cure - lifelong carrier'
    ],
    medicines: [
      { name: 'Oxytetracycline LA', purpose: 'Antibiotic', rating: 3.0 },
      { name: 'Streptomycin', purpose: 'Antibiotic', rating: 3.0 }
    ],
    notes: [
      'Dangerous to humans - Causes undulant fever in people',
      'Test your herd annually, cull positive animals',
      'Wear gloves when handling aborted material',
      'Report to authorities'
    ],
    affectedAnimals: ['cow', 'buffalo'],
    icon: '🤰'
  },
  {
    id: 'anthrax',
    name: 'Anthrax',
    category: 'bacterial',
    severity: 'critical',
    mortality: '100%',
    contagious: true,
    zoonotic: true,
    vaccineAvailable: true,
    emergencyCall: true,
    symptoms: [
      'Sudden death (most common finding)',
      'Bleeding from nose, mouth, anus after death',
      'Blood doesn\'t clot',
      'Bloating after death',
      'High fever before death (if seen alive)'
    ],
    prevention: [
      'Anthrax Spore Vaccine - Annual',
      'In endemic areas, vaccinate every 6 months',
      'Don\'t graze in known anthrax areas'
    ],
    treatment: [
      'Penicillin G IV (only if caught alive and very early)',
      'Usually animal found dead',
      'Treatment rarely possible'
    ],
    medicines: [
      { name: 'Penicillin G', purpose: 'Emergency antibiotic', rating: 3.0 }
    ],
    notes: [
      'DO NOT perform post-mortem (spores spread)',
      'Burn or bury carcass deeply with lime',
      'Reportable disease - inform authorities',
      'Spores survive in soil for 100+ years',
      'Highly dangerous to humans'
    ],
    affectedAnimals: ['cow', 'buffalo'],
    icon: '☠️'
  },
  {
    id: 'mastitis',
    name: 'Mastitis',
    category: 'bacterial',
    severity: 'moderate',
    mortality: '<1%',
    contagious: true,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: false,
    symptoms: [
      'Hot, swollen udder (one or more quarters)',
      'Clots or flakes in milk',
      'Watery or bloody milk',
      'Fever (in acute cases)',
      'Pain when touched',
      'Reduced milk yield'
    ],
    prevention: [
      'J-Boom Dry Cow Therapy (seal teats at dry-off)',
      'Pre-milking and post-milking teat dip',
      'Clean, dry bedding',
      'Proper milking hygiene',
      'Regular California Mastitis Test (CMT)'
    ],
    treatment: [
      'Masticef-Plus or Cefpet intramammary (in udder)',
      'Systemic Melonex for pain and inflammation',
      'Strip out infected quarter 3-4 times daily',
      'Do NOT use hot fomentation (makes it worse)',
      'Complete full course of antibiotics'
    ],
    medicines: [
      { name: 'Masticef-Plus', purpose: 'Intramammary antibiotic', rating: 4.8 },
      { name: 'Cefpet', purpose: 'Intramammary antibiotic', rating: 4.6 },
      { name: 'Melonex', purpose: 'Pain and inflammation', rating: 4.7 },
      { name: 'J-Boom', purpose: 'Dry cow therapy', rating: 4.5 }
    ],
    notes: [
      '#1 Production Disease - Costs Lakhs in Milk Loss',
      'Sub-clinical mastitis reduces yield by 20-30%',
      'Regular CMT testing prevents major losses'
    ],
    recoveryTime: '3-7 days with treatment',
    affectedAnimals: ['cow', 'buffalo'],
    icon: '🥛'
  },

  // ============= PARASITIC DISEASES =============
  {
    id: 'theileriosis',
    name: 'Theileriosis (Tick Fever)',
    category: 'parasitic',
    severity: 'critical',
    mortality: '40-90% in exotic breeds',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: true,
    emergencyCall: true,
    symptoms: [
      'High fever (104-107°F / 40-42°C)',
      'Swollen lymph nodes (especially under ear)',
      'Severe anaemia (pale gums)',
      'Red/coffee-colored urine (haemoglobinuria)',
      'Jaundice (yellow eyes)',
      'Weight loss and weakness'
    ],
    prevention: [
      'Butox or Flumethrin spray weekly during tick season',
      'Buparvaquone vaccine (if available)',
      'Regular tick checks',
      'Keep grass short around sheds'
    ],
    treatment: [
      'Forva or Butalex (Buparvaquone) - Single injection',
      'Oxytetracycline LA as support',
      'Blood tonics (haematinics)',
      'IV fluids if severe',
      'Iron supplements'
    ],
    medicines: [
      { name: 'Forva/Butalex', purpose: 'Anti-protozoal', rating: 4.9 },
      { name: 'Oxytetracycline LA', purpose: 'Support antibiotic', rating: 4.5 },
      { name: 'Imferon', purpose: 'Iron supplement', rating: 4.4 }
    ],
    notes: [
      '#1 Killer of Exotic and Crossbred Cattle',
      'Local breeds more resistant',
      'Early treatment critical for survival',
      'Check for ticks daily during monsoon'
    ],
    recoveryTime: '2-3 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    seasonalRisk: 'Monsoon - tick season',
    icon: '🕷️'
  },
  {
    id: 'babesiosis',
    name: 'Babesiosis (Red Water Disease)',
    category: 'parasitic',
    severity: 'high',
    mortality: '10-30%',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: true,
    symptoms: [
      'High fever',
      'Red or dark brown urine (characteristic sign)',
      'Anaemia (pale gums)',
      'Jaundice (yellow eyes)',
      'Rapid breathing',
      'Weakness'
    ],
    prevention: [
      'Same tick control as Theileriosis',
      'Butox spray weekly',
      'Avoid tick-infested pastures'
    ],
    treatment: [
      'Imizol or Berenil (Diminazene) injection',
      'Blood tonics and vitamins',
      'Supportive care',
      'IV fluids if needed'
    ],
    medicines: [
      { name: 'Imizol', purpose: 'Anti-protozoal', rating: 4.7 },
      { name: 'Berenil', purpose: 'Anti-protozoal', rating: 4.5 }
    ],
    notes: [
      'Often occurs with Theileriosis',
      'Red urine is characteristic sign',
      'Transmitted by ticks'
    ],
    recoveryTime: '1-2 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    seasonalRisk: 'Monsoon',
    icon: '🔴'
  },
  {
    id: 'liver-fluke',
    name: 'Liver Fluke (Fascioliasis)',
    nickname: 'Bottle Jaw Disease',
    category: 'parasitic',
    severity: 'moderate',
    mortality: '5-10%',
    contagious: false,
    zoonotic: true,
    vaccineAvailable: false,
    emergencyCall: false,
    symptoms: [
      'Bottle jaw (swelling under jaw due to fluid)',
      'Weight loss despite good appetite',
      'Diarrhoea',
      'Anaemia',
      'Poor coat',
      'Reduced milk production'
    ],
    prevention: [
      'Avoid grazing in marshy/waterlogged areas',
      'Deworm regularly',
      'Drain wet areas in pastures',
      'Control snails (intermediate host)'
    ],
    treatment: [
      'Triclabendazole + Ivermectin (Triclomax/Fasimec)',
      'Repeat after 2-3 months',
      'Iron and B12 supplements'
    ],
    medicines: [
      { name: 'Triclomax', purpose: 'Flukicide', rating: 4.6 },
      { name: 'Fasimec', purpose: 'Flukicide + dewormer', rating: 4.5 }
    ],
    notes: [
      'Common in areas with ponds/marshes',
      'Chronic infection causes liver damage',
      'Can spread to humans via raw vegetables'
    ],
    recoveryTime: '4-6 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    seasonalRisk: 'Post-monsoon',
    icon: '🪱'
  },
  {
    id: 'roundworms',
    name: 'Roundworms (Intestinal Worms)',
    category: 'parasitic',
    severity: 'low',
    mortality: '<5%',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: false,
    symptoms: [
      'Pot belly in calves',
      'Diarrhoea (sometimes with worms visible)',
      'Poor growth despite feeding',
      'Rough, dull coat',
      'Coughing (lung worms)'
    ],
    prevention: [
      'Deworm every 3-4 months',
      'Keep calves on clean, dry ground',
      'Rotate pastures',
      'Don\'t overstock'
    ],
    treatment: [
      'Albendazole + Ivermectin (Wormicide/Almex)',
      'Panacur (Fenbendazole)',
      'Repeat after 21 days for heavy infestation'
    ],
    medicines: [
      { name: 'Wormicide', purpose: 'Broad spectrum dewormer', rating: 4.5 },
      { name: 'Panacur', purpose: 'Dewormer', rating: 4.4 },
      { name: 'Ivermectin', purpose: 'Endo/Ectoparasiticide', rating: 4.6 }
    ],
    notes: [
      'Very common in calves',
      'Regular deworming is cost-effective',
      'Reduces growth rate by 20-30%'
    ],
    recoveryTime: '2-4 weeks',
    affectedAnimals: ['cow', 'buffalo', 'calf'],
    icon: '🐛'
  },

  // ============= METABOLIC DISEASES =============
  {
    id: 'milk-fever',
    name: 'Milk Fever (Hypocalcemia)',
    nickname: 'Downer Cow',
    category: 'metabolic',
    severity: 'critical',
    mortality: '10-20% if untreated',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: true,
    symptoms: [
      'Cannot stand up (downer)',
      'Cold ears and legs',
      'S-shaped neck (head turned to side)',
      'Weak, drowsy',
      'Occurs 12-72 hours after calving',
      'Dilated pupils'
    ],
    prevention: [
      'Anionic salts in feed 2-3 weeks before calving',
      'Oral calcium supplements before calving',
      'Don\'t overfeed calcium in dry period',
      'Vitamin D supplementation'
    ],
    treatment: [
      'Mifex or Cal-Rose 450ml slow IV',
      'NEVER under skin (causes tissue death)',
      'Magnesium injection',
      'Usually stands within 1-2 hours if treated properly',
      'May need repeat dose'
    ],
    medicines: [
      { name: 'Mifex', purpose: 'IV Calcium', rating: 4.8 },
      { name: 'Cal-Rose', purpose: 'IV Calcium', rating: 4.7 },
      { name: 'Cal-D-Mag', purpose: 'Calcium + Magnesium', rating: 4.6 }
    ],
    notes: [
      'EMERGENCY - Call vet immediately',
      'More common in high-yielding cows',
      'Third calving onwards - highest risk',
      'Don\'t give IV calcium too fast - can cause heart failure'
    ],
    recoveryTime: '1-2 hours with treatment',
    affectedAnimals: ['cow', 'buffalo'],
    icon: '⬇️'
  },
  {
    id: 'ketosis',
    name: 'Ketosis (Acetonemia)',
    nickname: 'Sweet Breath Disease',
    category: 'metabolic',
    severity: 'moderate',
    mortality: '<5%',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: false,
    symptoms: [
      'Sweet, fruity breath (like nail polish remover)',
      'Refuses to eat concentrates',
      'Sudden weight loss',
      'Milk production drops',
      'Dull, depressed',
      'Constipation'
    ],
    prevention: [
      'Propylene glycol (50-100ml daily) in transition period',
      'Avoid overfeeding dry cows',
      'Ensure adequate energy intake after calving',
      'Maintain body condition score 3.0-3.5'
    ],
    treatment: [
      'Dextrose 50% (500ml) IV daily for 3-5 days',
      'Dexamethasone injection',
      'Tribivet or Belamyl for 5-7 days',
      'Force-feed if necessary',
      'Propylene glycol oral'
    ],
    medicines: [
      { name: 'Dextrose 50%', purpose: 'IV energy', rating: 4.5 },
      { name: 'Tribivet', purpose: 'Liver tonic', rating: 4.6 },
      { name: 'Propylene Glycol', purpose: 'Oral energy', rating: 4.4 }
    ],
    notes: [
      'Occurs 2-6 weeks after calving',
      'More common in high yielders',
      'Associated with fatty liver syndrome'
    ],
    recoveryTime: '1-2 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    icon: '🍬'
  },
  {
    id: 'bloat',
    name: 'Bloat',
    category: 'metabolic',
    severity: 'critical',
    mortality: '100% if untreated',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: true,
    symptoms: [
      'Severely distended left side (stomach bulges out)',
      'Respiratory distress',
      'Animal stretches neck, opens mouth',
      'Kicks at belly',
      'Can collapse and die within 30-60 minutes'
    ],
    prevention: [
      'Poloxalene drench before grazing legumes',
      'Gradual introduction to new pasture',
      'Avoid grazing wet clover/alfalfa',
      'Feed dry hay before legume grazing'
    ],
    treatment: [
      'Poloxalene 25-50g oral drench',
      'Vegetable oil (250-500ml) by mouth',
      'If severe: Trocar and cannula (stab rumen to release gas) - VET ONLY',
      'Massage left side',
      'Walk animal if possible'
    ],
    medicines: [
      { name: 'Poloxalene', purpose: 'Anti-bloat', rating: 4.7 },
      { name: 'Vegetable Oil', purpose: 'Emergency anti-foaming', rating: 4.0 }
    ],
    notes: [
      'Can kill in 30-60 minutes - EMERGENCY',
      'Frothy bloat from legumes is worst',
      'Free gas bloat - can insert tube',
      'Keep trocar ready during grazing season'
    ],
    recoveryTime: 'Immediate if gas released',
    affectedAnimals: ['cow', 'buffalo'],
    icon: '🎈'
  },
  {
    id: 'acidosis',
    name: 'Rumen Acidosis',
    category: 'metabolic',
    severity: 'high',
    mortality: '10-30%',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: true,
    symptoms: [
      'Off feed',
      'Watery, frothy diarrhoea',
      'Laminitis (founder - sore feet)',
      'Kicking at belly',
      'Lies down frequently',
      'Grinding teeth'
    ],
    prevention: [
      'Gradual grain increase (over 2-3 weeks)',
      'Add buffers (sodium bicarbonate) to feed',
      'Ensure adequate long fiber',
      'Don\'t exceed 60% concentrate in diet'
    ],
    treatment: [
      'Rumen lavage (pump out rumen contents)',
      'Magnesium hydroxide oral drench',
      'Feed only hay for 2-3 days',
      'Probiotics (curd, B-complex)',
      'IV fluids for severe cases'
    ],
    medicines: [
      { name: 'Magnesium Hydroxide', purpose: 'Antacid', rating: 4.3 },
      { name: 'Sodium Bicarbonate', purpose: 'Buffer', rating: 4.2 }
    ],
    notes: [
      'Common in feedlots and high-grain feeding',
      'Causes permanent hoof damage (laminitis)',
      'Prevention easier than cure'
    ],
    recoveryTime: '1-2 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    icon: '🧪'
  },
  {
    id: 'da',
    name: 'Displaced Abomasum (DA)',
    nickname: 'Ping Sound Disease',
    category: 'metabolic',
    severity: 'high',
    mortality: '5-10%',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: true,
    symptoms: [
      '"Ping" or "ting" sound on left side when tapped',
      'Milk production suddenly drops 50%',
      'Off feed',
      'Signs of ketosis',
      '80% cases in first month after calving'
    ],
    prevention: [
      'Maintain proper body condition (not too fat)',
      'Feed adequate long fiber',
      'Prevent milk fever',
      'Avoid abrupt diet changes'
    ],
    treatment: [
      'Surgery (omentopexy or abomasopexy) - 90% success rate',
      'Rolling technique + calcium (temporary fix, 50% recurrence)',
      'Treat concurrent ketosis'
    ],
    medicines: [
      { name: 'Surgical intervention', purpose: 'Definitive treatment', rating: 4.8 }
    ],
    notes: [
      'Surgical condition - needs vet',
      'Associated with other transition diseases',
      'Left DA (LDA) more common than right (RDA)'
    ],
    recoveryTime: '1-2 weeks post-surgery',
    affectedAnimals: ['cow', 'buffalo'],
    icon: '🔔'
  },

  // ============= RESPIRATORY DISEASES =============
  {
    id: 'brd',
    name: 'Bovine Respiratory Disease (BRD)',
    nickname: 'Shipping Fever',
    category: 'respiratory',
    severity: 'high',
    mortality: '20-50% in calves',
    contagious: true,
    zoonotic: false,
    vaccineAvailable: true,
    emergencyCall: true,
    symptoms: [
      'Fever (103-106°F / 39.5-41°C)',
      'Cough (moist or harsh)',
      'Thick nasal discharge',
      'Rapid, labored breathing (dyspnoea)',
      'Off feed',
      'Droopy ears, dull appearance'
    ],
    prevention: [
      'Minimize stress during transport and weaning',
      'Multivalent respiratory vaccines',
      'Good ventilation (avoid drafts)',
      'Reduce overcrowding'
    ],
    treatment: [
      'Draxxin (Tulathromycin) - Single injection',
      'Nuflor (Florfenicol) or Excenel (Ceftiofur)',
      'Flunixin or Meloxicam for fever',
      'Early treatment critical - Mortality high if delayed'
    ],
    medicines: [
      { name: 'Draxxin', purpose: 'Long-acting antibiotic', rating: 4.7 },
      { name: 'Nuflor', purpose: 'Antibiotic', rating: 4.5 },
      { name: 'Excenel', purpose: 'Ceftiofur antibiotic', rating: 4.6 },
      { name: 'Flunixin', purpose: 'Anti-inflammatory', rating: 4.4 }
    ],
    notes: [
      '#1 Cause of Calf Death',
      'Often triggered by stress (transport, weaning)',
      'Multiple organisms involved',
      'Treat early for best results'
    ],
    recoveryTime: '1-2 weeks',
    affectedAnimals: ['cow', 'buffalo', 'calf'],
    seasonalRisk: 'Winter, transport stress',
    icon: '🫁'
  },

  // ============= REPRODUCTIVE DISEASES =============
  {
    id: 'endometritis',
    name: 'Endometritis (Uterine Infection)',
    category: 'reproductive',
    severity: 'moderate',
    mortality: '<1%',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: false,
    symptoms: [
      'Purulent (pus) discharge from vagina',
      'Continues beyond 21 days after calving',
      'Repeat breeding failures',
      'No heat or irregular heat cycles',
      'Foul smell'
    ],
    prevention: [
      'Clean calving environment',
      'No manual interference unless necessary',
      'Remove placenta gently if retained',
      'Proper AI hygiene'
    ],
    treatment: [
      'Cephapirin intrauterine (Metricure)',
      'Systemic Enrofloxacin or Ceftiofur',
      'PGF2α (Lutalyse) - helps clear infection',
      'Wait 2-3 cycles before breeding'
    ],
    medicines: [
      { name: 'Metricure', purpose: 'Intrauterine antibiotic', rating: 4.5 },
      { name: 'Enrofloxacin', purpose: 'Systemic antibiotic', rating: 4.4 },
      { name: 'Lutalyse', purpose: 'PGF2α hormone', rating: 4.3 }
    ],
    notes: [
      '20-30% of dairy cows affected after calving',
      'Major cause of repeat breeding',
      'Delays conception by 30-60 days'
    ],
    recoveryTime: '3-6 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    icon: '🩺'
  },
  {
    id: 'pyometra',
    name: 'Pyometra (Pus in Uterus)',
    category: 'reproductive',
    severity: 'high',
    mortality: '<5%',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: false,
    symptoms: [
      'No heat cycles (anestrus)',
      'Pus accumulation in uterus',
      'Persistent corpus luteum (CL)',
      'Sometimes thick discharge',
      'Enlarged uterus on palpation'
    ],
    prevention: [
      'Same as endometritis',
      'Treat uterine infections early',
      'Good calving hygiene'
    ],
    treatment: [
      'Cloprostenol or Lutalyse (PGF2α) to break down CL',
      'Systemic Ciprofloxacin or Gentamicin after drainage',
      'May require uterine lavage',
      'Repeat PGF2α if needed'
    ],
    medicines: [
      { name: 'Cloprostenol', purpose: 'PGF2α to lyse CL', rating: 4.5 },
      { name: 'Lutalyse', purpose: 'PGF2α hormone', rating: 4.4 }
    ],
    notes: [
      'Severe form of uterine infection',
      'CL keeps uterus closed, trapping pus',
      'Can cause permanent infertility if not treated'
    ],
    recoveryTime: '4-8 weeks',
    affectedAnimals: ['cow', 'buffalo'],
    icon: '⚠️'
  },

  // ============= SKIN & EYE DISEASES =============
  {
    id: 'ringworm',
    name: 'Ringworm (Fungal Infection)',
    category: 'skin',
    severity: 'low',
    mortality: '0%',
    contagious: true,
    zoonotic: true,
    vaccineAvailable: false,
    emergencyCall: false,
    symptoms: [
      'Circular crusty patches',
      'Hair loss in round areas',
      'Usually on face, neck, shoulders',
      'Itching (animal rubs against walls)'
    ],
    prevention: [
      'Sunlight exposure',
      'Clean, dry housing',
      'Isolate affected animals',
      'Good ventilation'
    ],
    treatment: [
      'Clove oil (eugenol) spray 3 times daily (87% cure rate)',
      'Whitfield ointment',
      'Self-limiting but takes 4-6 weeks',
      'Topical antifungals (Miconazole)'
    ],
    medicines: [
      { name: 'Clove Oil Spray', purpose: 'Natural antifungal', rating: 4.5 },
      { name: 'Whitfield Ointment', purpose: 'Topical antifungal', rating: 4.2 }
    ],
    notes: [
      'Zoonotic - Spreads to humans',
      'Wear gloves when treating',
      'Common in calves and young stock',
      'More prevalent in winter (less sunlight)'
    ],
    recoveryTime: '4-6 weeks',
    affectedAnimals: ['cow', 'buffalo', 'calf'],
    icon: '🔵'
  },
  {
    id: 'pinkeye',
    name: 'Pink Eye (IBK)',
    nickname: 'Infectious Bovine Keratoconjunctivitis',
    category: 'skin',
    severity: 'moderate',
    mortality: '0%',
    contagious: true,
    zoonotic: false,
    vaccineAvailable: true,
    emergencyCall: false,
    symptoms: [
      'Excessive tearing',
      'Light sensitivity (photophobia)',
      'Corneal ulcer (white spot on eye)',
      'Swollen eyelids',
      'Can cause permanent blindness if untreated'
    ],
    prevention: [
      'Fly control',
      'Moraxella bovis vaccine',
      'Provide shade',
      'Reduce dust'
    ],
    treatment: [
      'Draxxin or Oxytetracycline LA - Single injection',
      'Terramycin eye ointment in BOTH eyes',
      'Patch eye to reduce light exposure',
      'Treat both eyes even if only one affected'
    ],
    medicines: [
      { name: 'Draxxin', purpose: 'Systemic antibiotic', rating: 4.6 },
      { name: 'Terramycin Eye Ointment', purpose: 'Topical antibiotic', rating: 4.5 }
    ],
    notes: [
      'Highly contagious - spread by flies',
      'Treat early to prevent blindness',
      'More common in summer'
    ],
    recoveryTime: '2-3 weeks',
    affectedAnimals: ['cow', 'buffalo', 'calf'],
    seasonalRisk: 'Summer - fly season',
    icon: '👁️'
  },

  // ============= NEONATAL CALF DISEASES =============
  {
    id: 'calf-scours',
    name: 'Calf Scours (Neonatal Diarrhoea)',
    category: 'neonatal',
    severity: 'critical',
    mortality: '50%+ if untreated',
    contagious: true,
    zoonotic: false,
    vaccineAvailable: true,
    emergencyCall: true,
    symptoms: [
      'Watery diarrhoea (white, yellow, or bloody)',
      'Severe dehydration (sunken eyes)',
      'Weakness, unable to stand',
      'Cold ears and legs',
      'Depression, not suckling'
    ],
    prevention: [
      '4 liters of good quality colostrum within 6 hours of birth',
      'Dam vaccination (Rotavirus, Coronavirus, E. coli)',
      'Clean calving area',
      'Individual calf pens'
    ],
    treatment: [
      'DO NOT withhold milk (old advice - now proven wrong)',
      'Oral electrolytes (Lectade, Revive) between milk feeds',
      'Enrofloxacin or Ceftiofur for bacterial scours',
      'Azithromycin for Cryptosporidium (most effective)',
      'IV fluids if 8%+ dehydrated'
    ],
    medicines: [
      { name: 'Lectade', purpose: 'Oral electrolytes', rating: 4.8 },
      { name: 'Revive', purpose: 'Oral electrolytes', rating: 4.6 },
      { name: 'Azithromycin', purpose: 'For Cryptosporidium', rating: 4.7 },
      { name: 'Enrofloxacin', purpose: 'Antibiotic', rating: 4.5 }
    ],
    notes: [
      '50%+ mortality if untreated',
      'Colostrum within 6 hours is critical',
      'Multiple causes: bacteria, virus, parasites',
      'Keep giving milk - calves need energy'
    ],
    recoveryTime: '3-7 days',
    affectedAnimals: ['calf'],
    icon: '💩'
  },
  {
    id: 'navel-ill',
    name: 'Navel Ill / Septicemia',
    category: 'neonatal',
    severity: 'critical',
    mortality: '70-90% if untreated',
    contagious: false,
    zoonotic: false,
    vaccineAvailable: false,
    emergencyCall: true,
    symptoms: [
      'Swollen, wet, smelly navel',
      'Swollen joints (cannot stand)',
      'High fever',
      'Weak, recumbent calf',
      'Appears within 1-5 days of birth'
    ],
    prevention: [
      '7% iodine dip on navel immediately after birth',
      'Ensure calf gets colostrum',
      'Clean, dry calving area',
      'Don\'t cut umbilical cord'
    ],
    treatment: [
      'IV Ceftriaxone-Tazobactam for 7-10 days',
      'IV fluids',
      'Meloxicam for pain',
      'Drain abscess if formed',
      'Intensive nursing care'
    ],
    medicines: [
      { name: 'Intacef-Tazo', purpose: 'IV antibiotic', rating: 4.8 },
      { name: 'Meloxicam', purpose: 'Pain relief', rating: 4.6 }
    ],
    notes: [
      '70-90% mortality if untreated',
      'Prevention is key - navel dip at birth',
      'Can lead to joint ill, meningitis',
      'Treatment is expensive and prolonged'
    ],
    recoveryTime: '2-3 weeks if survives',
    affectedAnimals: ['calf'],
    icon: '🔴'
  }
];

// Vaccination Schedule
export const vaccinationSchedule: VaccinationSchedule[] = [
  { age: '0 days', vaccine: 'Navel dip + Colostrum', disease: 'Navel ill prevention' },
  { age: '4-6 months', vaccine: 'BQ + HS Combo', disease: 'Black Quarter, HS' },
  { age: '6 months (females)', vaccine: 'Brucella S19/RB51', disease: 'Brucellosis' },
  { age: '9-12 months', vaccine: 'FMD Trivalent', disease: 'Foot & Mouth Disease' },
  { age: 'Annual', vaccine: 'FMD (repeat 6 monthly)', disease: 'Foot & Mouth Disease', frequency: 'Every 6 months' },
  { age: 'Annual', vaccine: 'HS + BQ Combo', disease: 'Haemorrhagic Septicemia', frequency: 'Before monsoon' },
  { age: 'Annual', vaccine: 'LSD Live Vaccine', disease: 'Lumpy Skin Disease' },
  { age: 'Annual', vaccine: 'Bovilis IBR', disease: 'Red Nose (IBR)' },
  { age: 'Before monsoon', vaccine: 'HS Booster', disease: 'Haemorrhagic Septicemia' },
];

// Recommended Products
export const recommendedProducts: RecommendedProduct[] = [
  // Calcium
  { name: 'Mifex', category: 'Calcium', rating: 4.9, purpose: 'IV Calcium for milk fever' },
  { name: 'Cal-D-Mag', category: 'Calcium', rating: 4.8, purpose: 'Calcium + Magnesium combo' },
  { name: 'Cal-Rose', category: 'Calcium', rating: 4.7, purpose: 'IV Calcium' },
  { name: 'Sumo Ultra Calcium', category: 'Calcium', rating: 4.7, purpose: 'Oral calcium supplement' },
  // Minerals
  { name: 'Virtamin Gold', category: 'Minerals', rating: 4.9, purpose: 'Complete mineral mixture' },
  { name: 'Refit Minvos Forte', category: 'Minerals', rating: 4.7, purpose: 'Mineral supplement' },
  { name: 'Agrimin Forte', category: 'Minerals', rating: 4.6, purpose: 'Mineral bolus' },
  // Liver Tonics
  { name: 'Liv-52 Vet', category: 'Liver Tonic', rating: 4.8, purpose: 'Hepatoprotective' },
  { name: 'Tribivet', category: 'Liver Tonic', rating: 4.7, purpose: 'B-complex + Liver tonic' },
  { name: 'Belamyl', category: 'Liver Tonic', rating: 4.6, purpose: 'B-complex injection' },
  // Bypass Fat
  { name: 'Rumifat Gold', category: 'Bypass Fat', rating: 4.8, purpose: 'Energy supplement for high yielders' },
  { name: 'AuroUS', category: 'Bypass Fat', rating: 4.7, purpose: 'Bypass fat' },
  // Tick Control
  { name: 'Butox Delta', category: 'Tick Control', rating: 4.9, purpose: 'Best tick killer spray' },
  { name: 'Taktic (Flumethrin)', category: 'Tick Control', rating: 4.7, purpose: 'Pour-on tick control' },
  // Respiratory
  { name: 'Draxxin', category: 'Respiratory', rating: 4.8, purpose: 'Single dose pneumonia treatment' },
  { name: 'Nuflor', category: 'Respiratory', rating: 4.6, purpose: 'Florfenicol antibiotic' },
  // Calf Products
  { name: 'Lectade', category: 'Calf Care', rating: 4.9, purpose: 'Oral electrolytes for scours' },
  { name: 'Revive', category: 'Calf Care', rating: 4.7, purpose: 'Electrolyte powder' },
  // Mastitis
  { name: 'Masticef-Plus', category: 'Mastitis', rating: 4.8, purpose: 'Intramammary antibiotic' },
  { name: 'J-Boom', category: 'Mastitis', rating: 4.7, purpose: 'Dry cow therapy' },
];

// Prevention Tips
export const preventionTips: PreventionTip[] = [
  {
    id: '1',
    title: 'Vaccinate on Time',
    description: 'FMD every 6 months, HS+BQ annual (before monsoon), LSD annual. Use FREE government vaccines (NADCP).',
    icon: '💉',
    category: 'vaccination'
  },
  {
    id: '2',
    title: 'Detick & Deworm Regularly',
    description: 'Tick spray weekly during monsoon. Deworming every 3-4 months.',
    icon: '🕷️',
    category: 'parasites'
  },
  {
    id: '3',
    title: 'Feed Mineral Mixture Daily',
    description: 'Most diseases are due to mineral deficiency. Use Virtamin Gold or Refit (30-50g per day).',
    icon: '🧂',
    category: 'nutrition'
  },
  {
    id: '4',
    title: 'Keep Sheds Dry',
    description: 'Wet = Disease. Good ventilation but no drafts. Clean bedding daily.',
    icon: '🏠',
    category: 'housing'
  },
  {
    id: '5',
    title: 'Call Vet at First Fever',
    description: 'Don\'t wait for "home remedies". Early treatment = High survival.',
    icon: '🩺',
    category: 'health'
  },
  {
    id: '6',
    title: 'Complete Antibiotic Courses',
    description: 'Don\'t stop after 2-3 days. Incomplete treatment = Resistance.',
    icon: '💊',
    category: 'treatment'
  }
];

// Emergency Red Flags
export const emergencyRedFlags = [
  'Fever above 103°F (39.5°C)',
  'Not eating for 24 hours',
  'Difficulty breathing',
  'Cannot stand up (downer)',
  'Bloody diarrhoea',
  'Swollen throat or limbs',
  'Convulsions/seizures',
  'Any symptom in pregnant cow last month of pregnancy'
];

// Trusted Veterinary Companies
export const trustedCompanies = [
  'Intas', 'Zydus', 'Virbac', 'Zoetis', 'Hester', 'Vetoquinol'
];

// Best Antibiotics
export const bestAntibiotics = [
  { name: 'Ceftriaxone-Tazobactam (Intacef-Tazo)', purpose: 'Broad spectrum, severe infections' },
  { name: 'Enrofloxacin (Enrocin)', purpose: 'Respiratory, GI infections' },
  { name: 'Oxytetracycline LA', purpose: 'Long-acting, general infections' },
  { name: 'Ceftiofur (Excenel)', purpose: 'Respiratory infections' }
];
