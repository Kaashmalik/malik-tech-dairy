-- MTK Dairy - Comprehensive Multi-Tenant Realistic Seed Data
-- Primary Tenant: Green Valley Dairy (org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc)
-- Owner: user_36OD5mI59b8m6dHyG8S3q6x4tmD

-- 1. Seed Animals
INSERT INTO public.animals (
  id, tenant_id, tag, name, species, breed, date_of_birth, gender, status, purchase_date, purchase_price, weight, color, notes, created_by
) VALUES
('anim_sah_001', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'SAH-001', 'Rani', 'cow', 'Sahiwal', '2021-03-15', 'female', 'active', '2023-01-10', 280000, 420, 'Reddish Brown', 'High yield milker, calm temperament', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('anim_buf_002', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'BUF-002', 'Neeli', 'buffalo', 'Nili-Ravi', '2020-07-20', 'female', 'active', '2022-11-05', 350000, 560, 'Black', 'Premier dairy buffalo, 14L average', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('anim_hf_003', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'HF-003', 'Bella', 'cow', 'Holstein Friesian Cross', '2021-11-12', 'female', 'active', '2023-04-18', 320000, 490, 'Black and White', 'Top producer, requires heat stress cooling', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('anim_sah_004', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'SAH-004', 'Sheru', 'cow', 'Sahiwal', '2019-05-10', 'male', 'active', '2022-02-14', 400000, 680, 'Deep Red', 'Breeding stud bull with verified pedigree', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('anim_sah_005', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'SAH-005', 'Champa', 'cow', 'Sahiwal', '2023-08-01', 'female', 'active', '2023-08-01', 0, 240, 'Light Brown', 'Heifer offspring of Rani, scheduled for first breeding', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  weight = EXCLUDED.weight,
  status = EXCLUDED.status;

-- 2. Seed Milk Production Logs
INSERT INTO public.milk_logs (
  id, tenant_id, animal_id, date, session, quantity, fat, notes, recorded_by
) VALUES
('mlk_001', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_sah_001', '2026-09-18', 'morning', 12, 42, 'Good appetite, healthy yield', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('mlk_002', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_sah_001', '2026-09-18', 'evening', 10, 45, 'Evening milking routine', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('mlk_003', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_buf_002', '2026-09-18', 'morning', 14, 68, 'High butterfat content', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('mlk_004', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_buf_002', '2026-09-18', 'evening', 13, 70, 'Normal session', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('mlk_005', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_hf_003', '2026-09-18', 'morning', 18, 36, 'Excellent morning yield', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('mlk_006', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_hf_003', '2026-09-18', 'evening', 16, 38, 'Consistent production', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('mlk_007', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_sah_001', '2026-09-19', 'morning', 13, 44, 'Peak morning output', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('mlk_008', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_buf_002', '2026-09-19', 'morning', 15, 69, 'Superior milk quality', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('mlk_009', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_hf_003', '2026-09-19', 'morning', 19, 35, 'Highest farm producer', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('mlk_010', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_sah_001', '2026-09-19', 'evening', 11, 46, 'Steady evening yield', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Farm Expenses
INSERT INTO public.expenses (
  id, tenant_id, date, category, description, amount, currency, vendor_name, recorded_by
) VALUES
('exp_001', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', '2026-09-10', 'feed', 'Concentrate Wafers & Silage Bales (50 bags)', 55000, 'PKR', 'Punjab Agro Feeds Lahore', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('exp_002', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', '2026-09-14', 'veterinary', 'Quarterly Herd Vaccination & Vitamin ADE Administration', 12500, 'PKR', 'Dr. Tariq Veterinary Services', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('exp_003', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', '2026-09-17', 'maintenance', 'Milking Machine Servicing and Teat Liner Replacement', 8200, 'PKR', 'DeLaval Service Center Multan Road', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Milk Sales
INSERT INTO public.sales (
  id, tenant_id, date, type, quantity, unit, price_per_unit, total, currency, buyer_name, recorded_by
) VALUES
('sal_001', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', '2026-09-15', 'milk', 450, 'liters', 185, 83250, 'PKR', 'Engro Foods Chilling Center Raiwind', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('sal_002', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', '2026-09-18', 'milk', 120, 'liters', 200, 24000, 'PKR', 'Al-Fazal Sweets Thokar Niaz Baig', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('sal_003', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', '2026-09-19', 'milk', 85, 'liters', 210, 17850, 'PKR', 'Farm Gate Fresh Consumers', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Vaccinations
INSERT INTO public.vaccinations (
  id, tenant_id, animal_id, vaccine_name, vaccine_type, vaccination_date, next_due_date, administered_by, notes, status
) VALUES
('vac_001', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_sah_001', 'Foot and Mouth Disease (FMD)', 'inactivated', '2026-08-15', '2027-02-15', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD', 'Administered by Dr. Tariq Vet', 'administered'),
('vac_002', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_buf_002', 'Hemorrhagic Septicemia (HS)', 'inactivated', '2026-07-20', '2027-07-20', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD', 'Administered by Dr. Tariq Vet', 'administered'),
('vac_003', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_hf_003', 'Black Quarter (Blackleg)', 'inactivated', '2026-09-01', '2027-09-01', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD', 'Administered by Dr. Tariq Vet', 'administered')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Breeding Records
INSERT INTO public.breeding_records (
  id, tenant_id, animal_id, sire_id, breeding_date, expected_due_date, status, breeding_method, pregnancy_confirmed, pregnancy_confirmed_date, recorded_by
) VALUES
('brd_001', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_sah_001', 'anim_sah_004', '2026-08-05 06:30:00+05', '2027-05-15 00:00:00+05', 'pregnant', 'natural', true, '2026-09-15 10:00:00+05', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD'),
('brd_002', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_buf_002', NULL, '2026-08-12 18:00:00+05', '2027-06-18 00:00:00+05', 'pregnant', 'artificial_insemination', true, '2026-09-17 11:30:00+05', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Heat Detections & Pregnancy Checks
INSERT INTO public.heat_detections (
  id, tenant_id, animal_id, detection_date, detection_method, heat_intensity, standing_heat_observed, action_taken, detected_by
) VALUES
('a0000000-0000-0000-0000-000000000001', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_sah_001', '2026-08-05 06:30:00+05', 'visual_observation', 'strong', true, 'artificial_insemination', 'Staff Supervisor'),
('a0000000-0000-0000-0000-000000000002', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'anim_buf_002', '2026-08-12 18:00:00+05', 'visual_observation', 'moderate', true, 'artificial_insemination', 'Staff Supervisor')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pregnancy_checks (
  id, tenant_id, breeding_record_id, animal_id, check_date, check_method, result, vet_name, cost
) VALUES
('b0000000-0000-0000-0000-000000000001', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'c0000000-0000-0000-0000-000000000001', 'anim_sah_001', '2026-09-15 10:00:00+05', 'ultrasound', 'pregnant', 'Dr. Tariq Vet', 2500),
('b0000000-0000-0000-0000-000000000002', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'c0000000-0000-0000-0000-000000000002', 'anim_buf_002', '2026-09-17 11:30:00+05', 'rectal_palpation', 'pregnant', 'Dr. Tariq Vet', 1500)
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Notifications
INSERT INTO public.notifications (
  id, tenant_id, user_id, type, title, message, read, created_at
) VALUES
('notif_001', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD', 'pregnancy_confirmed', 'Pregnancy Confirmed: Rani (SAH-001)', 'Dr. Tariq confirmed pregnancy via ultrasound on 2026-09-15. Expected calving: May 2027.', false, NOW() - INTERVAL '4 days'),
('notif_002', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc', 'user_36OD5mI59b8m6dHyG8S3q6x4tmD', 'vaccination_due', 'Upcoming Vaccination: FMD Booster Due in October', 'Semi-annual FMD booster scheduled for the Sahiwal herd.', false, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
