/*
  # Insert Initial Master Data

  ## Overview
  Inserts initial data for sanitation areas, sections (bagian), and line configurations
  based on the production facility's actual setup.

  ## Data Inserted

  ### Line Configurations
  - Lines 1-4, 7-8, 16-24, 26-28, 31-33: NN (Normal Noodle)
  - Lines 5-6: CN (Cup Noodle)
  - Line 25: GN (Glass Noodle)
  - Lines 29-30: DN (Dry Noodle)

  ### Areas & Bagian
  All production areas with their respective sections and applicable line types.

  ## Important Notes
  1. applicable_lines uses ARRAY notation: ARRAY['CN', 'NN', 'GN']
  2. display_order determines UI ordering
  3. All items are active by default
*/

-- Insert Line Configurations
INSERT INTO line_configurations (line_number, line_type, plant) VALUES
  ('1', 'NN', 'Plant-1'),
  ('2', 'NN', 'Plant-1'),
  ('3', 'NN', 'Plant-1'),
  ('4', 'NN', 'Plant-1'),
  ('5', 'CN', 'Plant-1'),
  ('6', 'CN', 'Plant-1'),
  ('7', 'NN', 'Plant-1'),
  ('8', 'NN', 'Plant-1'),
  ('16', 'NN', 'Plant-2'),
  ('17', 'NN', 'Plant-2'),
  ('18', 'NN', 'Plant-2'),
  ('19', 'NN', 'Plant-2'),
  ('20', 'NN', 'Plant-2'),
  ('21', 'NN', 'Plant-2'),
  ('22', 'NN', 'Plant-2'),
  ('23', 'NN', 'Plant-2'),
  ('24', 'NN', 'Plant-2'),
  ('25', 'GN', 'Plant-2'),
  ('26', 'NN', 'Plant-2'),
  ('27', 'NN', 'Plant-2'),
  ('28', 'NN', 'Plant-2'),
  ('29', 'DN', 'Plant-2'),
  ('30', 'DN', 'Plant-2'),
  ('31', 'NN', 'Plant-3'),
  ('32', 'NN', 'Plant-3'),
  ('33', 'NN', 'Plant-3')
ON CONFLICT (line_number) DO NOTHING;

-- Insert Areas
INSERT INTO sanitation_areas (area_name, display_order) VALUES
  ('Silo', 1),
  ('Mixer', 2),
  ('Roll Press', 3),
  ('Steambox', 4),
  ('Cutter dan Folder', 5),
  ('Fryer', 6),
  ('Cooling Box', 7),
  ('Packing', 8)
ON CONFLICT (area_name) DO NOTHING;

-- Insert Bagian for Silo
INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Silo'),
  'Sievter Silo',
  'Pembersihan body luar mixer premix ingredient dari sisa premix dikerok dan dicuci dengan penyemprotan menggunakan jet cleaner dan dilakukan pengelapan dengan semprot alkohol 70%.',
  ARRAY['CN', 'NN', 'GN'],
  1
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Sievter Silo'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Silo')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Silo'),
  'Magnet Trap',
  'Pembersihan body luar mixer premix ingredient dari sisa premix dikerok dan dicuci dengan penyemprotan menggunakan jet cleaner dan dilakukan pengelapan dengan semprot alkohol 70%.',
  ARRAY['CN', 'NN', 'GN'],
  2
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Magnet Trap'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Silo')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Silo'),
  'Pembersihan selongsong sieveter silo',
  'Pembersihan body dalam mixer premix ingredient dari sisa premix dikerok dan dicuci dengan penyemprotan menggunakan jet cleaner dan dilakukan pengelapan dengan semprot alkohol 70%.',
  ARRAY['CN', 'NN', 'GN'],
  3
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Pembersihan selongsong sieveter silo'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Silo')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Silo'),
  'Mixer Premix Ingredient',
  'Pembersihan body bagian luar dan dalam tanki induk alkali menggunakan jet cleaner, kemudian dilakukan pengelapan bodi bagian luar dengan kain kering dan alkohol 70%.',
  ARRAY['CN', 'NN', 'GN'],
  4
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Mixer Premix Ingredient'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Silo')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Silo'),
  'Tanki alkali Line',
  'Pembersihan body bagian luar dan dalam tanki induk alkali menggunakan jet cleaner, kemudian dilakukan pengelapan bodi bagian luar dengan kain kering.',
  ARRAY['CN', 'NN'],
  5
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Tanki alkali Line'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Silo')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Silo'),
  'Instalasi Pipa Alkali',
  'Pembersihan menggunakan palet launcher dan flushing dengan air hingga bersih tidak ada deposit endapan alkali dan ferro dalam pipa.',
  ARRAY['CN', 'NN', 'GN'],
  6
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Instalasi Pipa Alkali'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Silo')
);

-- Insert Bagian for Mixer
INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Mixer'),
  'Bagian dalam mixer, dan flexible hose',
  'Kebersihan body dalam mixer dengan cara dikerok menggunakan kape, semprot angin dan wet cleaning menggunakan vosen lalu semprot alkohol 70%, pada bagian: 1. Bodi bagian dalam 2. Baling-Baling mixer 3. Pipa distribusi alkali 4. Flexible hose',
  ARRAY['CN', 'NN', 'GN'],
  1
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Bagian dalam mixer, dan flexible hose'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Mixer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Mixer'),
  'Bagian luar mixer, corong mixer',
  'Kebersihan body luar mixer dengan cara semprot angin dan lap dengan kain basah, lalu semprot alkohol 70%. Flexible Host dibersihkan dari akumulasi tepung.',
  ARRAY['CN', 'NN', 'GN'],
  2
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Bagian luar mixer, corong mixer'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Mixer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Mixer'),
  'Motor penggerak mixer bagian depan',
  'Pembersihan motor penggerak/hidrolik bagian depan mixer.',
  ARRAY['CN', 'NN', 'GN'],
  3
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Motor penggerak mixer bagian depan'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Mixer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Mixer'),
  'Motor penggerak mixer bagian belakang',
  'Pembersihan motor penggerak bagian belakang mixer.',
  ARRAY['CN', 'NN', 'GN'],
  4
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Motor penggerak mixer bagian belakang'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Mixer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Mixer'),
  'Weighing Tank Alkali dan filter alkali',
  'Weighing tank alkali bagian luar dan dalam dilakukan pembersihan dengan pengelapan basah dan flushing dengan air dengan tujuan agar deposit fero dan alkali tidak tertinggal didalam weighing tank alkali dan dilanjutkan dengan pengelapan dengan alkohol 70%. Filter alkali dilakukan pembersihan.',
  ARRAY['CN', 'NN', 'GN'],
  5
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Weighing Tank Alkali dan filter alkali'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Mixer')
);

-- Insert Bagian for Roll Press
INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Roll Press'),
  'Feeder doughsheet',
  'Pembersihan bak feeder dan jarum feeder dengan cara kerok menggunakan kape lalu lap dengan kain basah dan kering atau alkohol 70%.',
  ARRAY['CN', 'NN', 'GN'],
  1
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Feeder doughsheet'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Roll Press')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Roll Press'),
  'Chute feeder',
  'Pembersihan bagian chute dumper bagian dalam dengan pengerokan, dilanjutkan dengan pembuangan sisa tepung dan adonan serta dilap basah dan kering atau dengan alkohol 70%. Pembersihan sarang laba-laba pada bagian bawah dumper mixer.',
  ARRAY['CN', 'NN', 'GN'],
  2
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Chute feeder'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Roll Press')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Roll Press'),
  'Doughsheet',
  'Pembersihan roll press ganda, scrapper roll ganda, belt kolak dan Pembersihan belt cangkulan press dari sisa adonan.',
  ARRAY['CN', 'NN', 'GN'],
  3
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Doughsheet'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Roll Press')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Roll Press'),
  'Roll press continous',
  'All cover dibuka dan dibersihkan. Pembersihan bagian dalam waving belt dari akumulasi adonan kering. Pembersihan roll continues dengan semprot angin dan dilakukan pengelapan dengan kain basah alkohol 70%.',
  ARRAY['CN', 'NN', 'GN'],
  4
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Roll press continous'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Roll Press')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Roll Press'),
  'Slitter dan waving net',
  'Pembersihan slitter, waving net, roll sykolax dan roll pemisah untaian dari sisa adonan. Waving net dilakukan pembersihan dengan disemprot dengan air mengalir dan dilakukan penyikatan dengan sikat dengan tujuan tidak ada akumulasi gumpalan untaian mi yang menempel pada waving net steam.',
  ARRAY['CN', 'NN', 'GN'],
  5
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Slitter dan waving net'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Roll Press')
);

-- Insert Bagian for Steambox
INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Steambox'),
  'Net steambox',
  'Net steam dilakukan pembersihan dengan disemprot dengan air mengalir dan dilakukan penyikatan dengan sikat dengan tujuan tidak ada akumulasi gumpalan untaian mi yang menempel pada waving net steam.',
  ARRAY['CN', 'NN', 'GN'],
  1
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Net steambox'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Steambox')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Steambox'),
  'Bagian dalam steambox',
  'Pembersihan body dalam steam box yaitu pipa steam dan box steam dari akumulasi sisa untaian mi basah.',
  ARRAY['CN', 'NN', 'GN'],
  2
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Bagian dalam steambox'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Steambox')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Steambox'),
  'Bodi steambox keseluruhan',
  'Pembersihan body mesin steam dengan lap basah dan kering dari akumulasi debu dan kotoran.',
  ARRAY['CN', 'NN', 'GN'],
  3
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Bodi steambox keseluruhan'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Steambox')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Steambox'),
  'Kipas Ex Steam',
  'Pembersihan Kipas Ex. Steam dengan membuka Cover kipas dan lakukan pembersihan baik cover, baling-baling, dan dudukan kipas ex. steam dari akumulasi kotoran dan debu yang menempel.',
  ARRAY['CN', 'NN', 'GN'],
  4
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Kipas Ex Steam'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Steambox')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Steambox'),
  'Lantai bawah steambox',
  'Pembersihan lantai bawah steambox.',
  ARRAY['CN', 'NN', 'GN'],
  5
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Lantai bawah steambox'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Steambox')
);

-- Insert Bagian for Cutter dan Folder
INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder'),
  'Bodi Luar/Dalam Tangki Emulsik & Panggung Emulsik',
  'Pembersihan bodi luar dan dalam tanki emulsik dilakukan semprot jet cleaner dan pengelapan dengan kain basah dan kering atau alkohol 70%. Pembersihan panggung alkali dengan semprot jet cleaner.',
  ARRAY['CN', 'GN'],
  1
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Bodi Luar/Dalam Tangki Emulsik & Panggung Emulsik'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder'),
  'Streching net',
  'Pembersihan streching net emulsik dari endaparan dan kerak emulsik dengan jet cleaner.',
  ARRAY['CN', 'GN'],
  2
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Streching net'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder'),
  'Cutter dan Chute mie',
  'Pembersihan cutter dan chute mi dari sisa-sisa mi dan kotoran dengan jet cleaner.',
  ARRAY['CN', 'GN'],
  3
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Cutter dan Chute mie'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder'),
  'Guide Roll, Cutter, Bantalan & Net Distributor Mie',
  'Pembersihan Roll As Tension, Cutter, Bantalan dan net distributor mie dengan peyemprotan air mengalir dan pembersihan sisa-sisa untaian mi yang menempel. Pembersihan bodi luar dengan dilakukan pengelapan kain basah.',
  ARRAY['NN'],
  4
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Guide Roll, Cutter, Bantalan & Net Distributor Mie'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder'),
  'Bagian bawah cutter folder',
  'Pembersihan bagian bawah cutter dan folder.',
  ARRAY['NN'],
  5
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Bagian bawah cutter folder'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder'),
  'Cutter dan net distirbutor mie',
  'Pembersihan Cutter, Bantalan dan net distributor mie dengan peyemprotan air mengalir dan pembersihan sisa-sisa untaian mi yang menempel. Pembersihan bodi luar dengan dilakukan pengelapan kain basah.',
  ARRAY['DN'],
  6
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Cutter dan net distirbutor mie'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder'),
  'Conveyor distributor mie',
  'Pembersihan conveyor distributor mie.',
  ARRAY['CN', 'NN', 'GN'],
  7
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Conveyor distributor mie'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Cutter dan Folder')
);

-- Insert Bagian for Fryer
INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer'),
  'Kuali Fryer, Retainer dan Tutup Retainer',
  'Pembersihan sisa-sia HH didalam kuali fryer, retainer dan tutup retainer, kemudian cuci dengan air panas / dengan coustic soda.',
  ARRAY['CN', 'NN', 'GN'],
  1
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Kuali Fryer, Retainer dan Tutup Retainer'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer'),
  'Bagian luar & dalam kuali fryer dan Ex Fryer',
  'All cover fryer dibuka dan dilakukan pengerokan stalagnit / jelaga pada bagian bodi atas fryer. All cover dilakukan pencucian dengan sabun dan dilap dengan alkohol 70%. Kuali fryer dilakukan flushing dengan air atau cuci dengan coustic soda agar kerak deposit pengerokan terbuang dari dalam fryer dengan air.',
  ARRAY['CN', 'NN', 'GN'],
  2
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Bagian luar & dalam kuali fryer dan Ex Fryer'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer'),
  'Strainer',
  'Pembersihan strainer dari sisa mie HH/HP.',
  ARRAY['CN', 'NN', 'GN'],
  3
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Strainer'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer'),
  'Edible oil',
  'Pembersihan edible bagian luar dan dalam serta filter edible dilakukan cleaning dengan semprot jet cleaner.',
  ARRAY['CN', 'NN', 'GN'],
  4
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Edible oil'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer'),
  'Awning',
  'Cover akrilik awning dilakukan pencucian dengan sabun dan dilakukan pengelapan dengan kain kering.',
  ARRAY['CN', 'NN', 'GN'],
  5
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Awning'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer'),
  'Talang out fryer',
  'Pembersihan talang out fryer dari sisa mie HH/HP.',
  ARRAY['CN', 'NN', 'GN'],
  6
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Talang out fryer'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer'),
  'Mangkok dryer',
  'Pembersihan mangkok dryer dari sisa mie HH/HP.',
  ARRAY['DN'],
  7
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Mangkok dryer'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer'),
  'Bodi luar dan dalam dryer',
  'Pembersihan bodi luar dan dalam dryer.',
  ARRAY['DN'],
  8
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Bodi luar dan dalam dryer'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer'),
  'Talang out dryer',
  'Pembersihan talang out dryer.',
  ARRAY['DN'],
  9
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Talang out dryer'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Fryer')
);

-- Insert Bagian for Cooling Box
INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Cooling Box'),
  'Plat perforasi / net cooling',
  'Kebersihan body dalam cooling bagian atas dari HH mi kemudian cuci dengan jet cleaner. Lap net conveyor dan as bar conveyor dengan kain yang dibasahi alkohol 70%. Dilakukan pengeringan dengan menyalakan blower mesin setelah pencucian dengan jet cleaner.',
  ARRAY['CN', 'NN', 'GN'],
  1
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Plat perforasi / net cooling'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Cooling Box')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Cooling Box'),
  'Cover bagian bawah cooling',
  'Kebersihan body dalam cooling bagian bawah dari HH mi kemudian cuci dengan jet cleaner. Dilakukan pengeringan dengan menyalakan blower mesin setelah pencucian dengan jet cleaner.',
  ARRAY['CN', 'NN', 'GN'],
  2
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Cover bagian bawah cooling'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Cooling Box')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Cooling Box'),
  'Bodi luar, Filter Cooling, Exhaust cooling',
  'Pembersihan bodi luar cooling. Pembersihan dan pencucian filter cooling. Pembersihan exhaust cooling.',
  ARRAY['CN', 'NN', 'GN'],
  3
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Bodi luar, Filter Cooling, Exhaust cooling'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Cooling Box')
);

-- Insert Bagian for Packing
INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Packing'),
  'Conveyor pembagi / chanilizer out cooling',
  'Pembersihan channelizer dengan kain yang dibasahi alkohol 70%.',
  ARRAY['CN', 'NN', 'GN'],
  1
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Conveyor pembagi / chanilizer out cooling'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Packing')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Packing'),
  'Curve Conveyor',
  'Kebersihan curve conveyor dari HH/HP mi dengan semprot angin dan pengelapan dengan kain yang dibasahi alkohol 70%.',
  ARRAY['CN', 'NN', 'GN'],
  2
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Curve Conveyor'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Packing')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Packing'),
  'Talang penampung channelizer',
  'Kebersihan talang penampung dari HH/HP mi dengan semprot angin dan pengelapan dengan kain yang dibasahi alkohol 70%.',
  ARRAY['DN'],
  3
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Talang penampung channelizer'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Packing')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Packing'),
  'Bak penampung mie',
  'Pembersihan bak penampung mie di area packing.',
  ARRAY['CN', 'NN', 'GN'],
  4
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Bak penampung mie'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Packing')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Packing'),
  'Anting-anting dan rel',
  'Anting-anting dilepas dan dilakukan pencucian kemudian dikeringkan terlebih dahulu sebelum dipasang kembali lalu dilakukan pelumasan menggunakan chain lube food grade. Rel Anting-anting dilakukan pembersihan dengan melakukan penyemprotan dengan angin dan dilakukan pengelapan dengan kain kering.',
  ARRAY['CN', 'NN', 'GN'],
  5
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Anting-anting dan rel'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Packing')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Packing'),
  'Autoloader',
  'Pembersihan autoloader: a. chute autoloader b. pusher lug conveyor c. bodi autoloader',
  ARRAY['CN', 'NN', 'GN'],
  6
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Autoloader'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Packing')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Packing'),
  'Meja penampung seasoning',
  'Pembersihan meja panampung seasoning.',
  ARRAY['CN', 'NN', 'GN'],
  7
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Meja penampung seasoning'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Packing')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Packing'),
  'Area infeed packing',
  'Pembersihan area infeed packing.',
  ARRAY['CN', 'NN', 'GN'],
  8
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Area infeed packing'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Packing')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Packing'),
  'Mesin packing',
  'Pembersihan mesin packing secara menyeluruh: a. talang penampung bagian bawah mesin b. bodi mesin packing c. heater longsealer dan endsealer',
  ARRAY['CN', 'NN', 'GN'],
  9
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Mesin packing'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Packing')
);

INSERT INTO sanitation_bagian (area_id, bagian_name, keterangan, applicable_lines, display_order)
SELECT
  (SELECT id FROM sanitation_areas WHERE area_name = 'Packing'),
  'Mesin carton sealer dan FG Conveyor',
  'Pembersihan mesin carton sealer dan FG Conveyor dengan kain dan dengan semprot angin.',
  ARRAY['CN', 'NN', 'GN'],
  10
WHERE NOT EXISTS (
  SELECT 1 FROM sanitation_bagian WHERE bagian_name = 'Mesin carton sealer dan FG Conveyor'
  AND area_id = (SELECT id FROM sanitation_areas WHERE area_name = 'Packing')
);
