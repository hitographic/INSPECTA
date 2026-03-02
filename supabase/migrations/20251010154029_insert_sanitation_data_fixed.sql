/*
  # Insert Sanitation Master Data
  
  Mengisi data master untuk:
  1. sanitation_areas - 11 area sanitasi dengan urutan yang benar
  2. sanitation_bagian - Semua bagian dengan keterangan dan line numbers
*/

-- Clear existing data
TRUNCATE TABLE sanitation_bagian CASCADE;
TRUNCATE TABLE sanitation_areas CASCADE;

-- Insert Areas dengan urutan yang benar
INSERT INTO sanitation_areas (id, name, display_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Silo', 1),
  ('a2000000-0000-0000-0000-000000000002', 'Alkali Ingredient', 2),
  ('a3000000-0000-0000-0000-000000000003', 'Mixer', 3),
  ('a4000000-0000-0000-0000-000000000004', 'Roll Press', 4),
  ('a5000000-0000-0000-0000-000000000005', 'Steambox', 5),
  ('a6000000-0000-0000-0000-000000000006', 'Cutter', 6),
  ('a7000000-0000-0000-0000-000000000007', 'Cutter dan Folder', 7),
  ('a8000000-0000-0000-0000-000000000008', 'Fryer', 8),
  ('a9000000-0000-0000-0000-000000000009', 'Dryer', 9),
  ('a1000000-0000-0000-0000-000000000010', 'Cooling Box', 10),
  ('a1100000-0000-0000-0000-000000000011', 'Packing', 11);

-- Insert Bagian untuk Area: Silo
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Sievter Silo', 'Pembersihan body luar mixer premix ingredient dari sisa premix  dikerok dan dicuci dengan penyemprotan menggunakan jet cleaner dan dilakukan pengelapan dengan semprot alkohol 70%.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 1),
  ('a1000000-0000-0000-0000-000000000001', 'Magnet Trap', 'Pembersihan body luar mixer premix ingredient dari sisa premix  dikerok dan dicuci dengan penyemprotan menggunakan jet cleaner dan dilakukan pengelapan dengan semprot alkohol 70%.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 2),
  ('a1000000-0000-0000-0000-000000000001', 'Pembersihan selongsong sieveter silo', 'Pembersihan body dalam mixer premix ingredient dari sisa premix  dikerok dan dicuci dengan penyemprotan menggunakan jet cleaner dan dilakukan pengelapan dengan semprot alkohol 70%.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 3);

-- Insert Bagian untuk Area: Alkali Ingredient
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a2000000-0000-0000-0000-000000000002', 'Mixer Premix Ingredient', 'Pembersihan body bagian luar dan dalam tanki induk alkali menggunakan jet cleaner, kemudian dilakukan pengelapan bodi bagian luar dengan kain kering dan alkohol 70%.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 1),
  ('a2000000-0000-0000-0000-000000000002', 'Tanki alkali Line', 'Pembersihan body bagian luar dan dalam tanki induk alkali menggunakan jet cleaner, kemudian dilakukan pengelapan bodi bagian luar dengan kain kering', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','31','32','33'], 2),
  ('a2000000-0000-0000-0000-000000000002', 'Instalasi Pipa Alkali', 'Pembersihan menggunakan palet launcher dan flushing dengan air hingga bersih tidak ada deposit endapan alkali dan ferro dalam pipa.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 3);

-- Insert Bagian untuk Area: Mixer
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a3000000-0000-0000-0000-000000000003', 'Bagian dalam mixer, dan flexible hose', 'Kebersihan body  dalam  mixer dengan cara dikerok menggunakan kape, semprot angin dan wet cleaning menggunakan vosen lalu semprot alkohol 70%, pada bagian:
1.  Bodi bagian dalam
2. Baling - Baling mixer 
3. Pipa distribusi alkali
4. Flexible hose', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32'], 1),
  ('a3000000-0000-0000-0000-000000000003', 'Bagian dalam mixer, dan flexible hose', 'Kebersihan body  dalam  mixer dengan cara dikerok menggunakan kape, semprot angin dan wet cleaning menggunakan vosen lalu semprot alkohol 70%, pada bagian:
1.  Bodi bagian dalam
2. Baling - Baling mixer 
3. Jetflow
4. Flexible hose', ARRAY['33'], 2),
  ('a3000000-0000-0000-0000-000000000003', 'Bagian luar mixer, corong mixer', 'Kebersihan body  luar  mixer dengan cara semprot angin dan lap dengan kain basah, lalu semprot alkohol 70%.

Flexible Hose dibersihkan dari akumulasi tepung.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 3),
  ('a3000000-0000-0000-0000-000000000003', 'Motor penggerak mixer bagian depan', 'Pembersihan motor penggerak/hidrolik bagian depan mixer', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 4),
  ('a3000000-0000-0000-0000-000000000003', 'Motor penggerak mixer bagian belakang', 'Pembersihan motor penggerak bagian belakang mixer', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 5),
  ('a3000000-0000-0000-0000-000000000003', 'Weighing Tank Alkali dan filter alkali', 'Weighing tank alkali bagian luar dan dalam dilakukan pembersihan dengan pengelapan basah dan flushing dengan air dengan tujuan agar deposit fero dan alkali tidak tertinggal didalam weighing tank alkali dan dilanjutkan dengan pengelapan dengan alkohol 70%.
Filter alkali dilakukan pembersihan', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 6);

-- Insert Bagian untuk Area: Roll Press
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a4000000-0000-0000-0000-000000000004', 'Feeder doughsheet', 'Pembersihan bak feeder dan jarum feeder dengan cara kerok menggunakan kape lalu lap dengan kain basah dan kering atau alkohol 70%.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 1),
  ('a4000000-0000-0000-0000-000000000004', 'Chute feeder', 'Pembersihan bagian chute dumper bagian dalam dengan pengerokan, dilanjutkan dengan pembuangan sisa tepung dan adonan serta dilap basah dan kering atau dengan alkohol 70%.

Pembersihan sarang laba-laba pada bagian bawah dumper mixer.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 2),
  ('a4000000-0000-0000-0000-000000000004', 'Doughsheet', 'Pembersihan roll press ganda, scrapper roll ganda, belt kolak  dan Pembersihan belt cangkulan press dari sisa adonan', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 3),
  ('a4000000-0000-0000-0000-000000000004', 'Roll press continous', 'All cover dibuka dan dibersihkan.

Pembersihan bagian dalam waving belt dari akumulasi adonan kering.

Pembersihan roll continues dengan semprot angin dan dilakukan pengelapan dengan kain basah alkohol 70%.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 4),
  ('a4000000-0000-0000-0000-000000000004', 'Slitter dan waving net', 'Pembersihan slitter, waving net, roll sykolax dan roll pemisah untaian dari sisa adonan
Waving net dilakukan pembersihan dengan disemprot dengan air mengalir dan dilakukan penyikatan dengan sikat dengan tujuan  tidak ada akumulasi gumpalan untaian mi yang menempel pada waving net steam.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 5);

-- Insert Bagian untuk Area: Steambox
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a5000000-0000-0000-0000-000000000005', 'Net steambox', 'Net steam dilakukan pembersihan dengan disemprot dengan air mengalir dan dilakukan penyikatan dengan sikat dengan tujuan  tidak ada akumulasi gumpalan untaian mi yang menempel pada waving net steam.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 1),
  ('a5000000-0000-0000-0000-000000000005', 'Bagian dalam steambox', 'Pembersihan body dalam steam box yaitu pipa steam dan box steam dari akumulasi sisa untaian mi basah.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 2),
  ('a5000000-0000-0000-0000-000000000005', 'Bodi steambox keseluruhan', 'Pembersihan body mesin steam dengan lap basah dan kering dari akumulasi debu dan kotoran.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 3),
  ('a5000000-0000-0000-0000-000000000005', 'Kipas Ex Steam', 'Pembersihan Kipas Ex. Steam dengan membuka Cover kipas dan lakukan pembersihan baik cover, baling-baling, dan dudukan kipas ex. steam dari akumulasi kotoran dan debu yang menempel.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 4),
  ('a5000000-0000-0000-0000-000000000005', 'Lantai bawah steambox', 'Pembersihan lantai bawah steambox', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 5);

-- Insert Bagian untuk Area: Cutter
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a6000000-0000-0000-0000-000000000006', 'Bodi Luar/Dalam Tangki Emulsik & Panggung Emulsik', 'Pembersihan bodi luar dan dalam tanki emulsik dilakukan semprot jet cleaner dan pengelapan dengan kain basah dan kering atau alkohol70%.  

Pembersihan panggung alkali dengan semprot jet cleaner.', ARRAY['5','6','25'], 1),
  ('a6000000-0000-0000-0000-000000000006', 'Streching net', 'Pembersihan streching net emulsik dari endaparan dan kerak emulsik dengan jet cleaner.', ARRAY['5','6','25'], 2),
  ('a6000000-0000-0000-0000-000000000006', 'Cutter dan Chute mie', 'Pembersihan cutter dan chute mi dari sisa-sisa mi dan kotoran dengan jet cleaner.', ARRAY['5','6','25'], 3);

-- Insert Bagian untuk Area: Cutter dan Folder
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a7000000-0000-0000-0000-000000000007', 'Guide Roll, Cutter , Bantalan & Net Distributor Mie', 'Pembersihan Roll As Tension, Cutter, Bantalan dan net distributor mie dengan peyemprotan air mengalir dan pembersihan sisa-sisa untaian mi yang menempel.
Pembersihan bodi luar dengan dilakukan pengelapan kain basah', ARRAY['1','2','3','4','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','31','32','33'], 1),
  ('a7000000-0000-0000-0000-000000000007', 'Bagian bawah cutter folder', 'Pembersihan bagian bawah cutter dan folder', ARRAY['1','2','3','4','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','31','32','33'], 2),
  ('a7000000-0000-0000-0000-000000000007', 'Cutter dan net distirbutor mie.', 'Pembersihan Cutter, Bantalan dan net distributor mie dengan peyemprotan air mengalir dan pembersihan sisa-sisa untaian mi yang menempel.
Pembersihan bodi luar dengan dilakukan pengelapan kain basah', ARRAY['29','30'], 3),
  ('a7000000-0000-0000-0000-000000000007', 'Conveyor distributor mie', '', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 4);

-- Insert Bagian untuk Area: Fryer
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a8000000-0000-0000-0000-000000000008', 'Kuali Fryer, Retainer dan Tutup Retainer.', 'Pembersihan sisa-sia HH didalam kuali fryer, retainer dan tutup retainer, kemudian cuci dengan air panas / dengan coustic soda.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 1),
  ('a8000000-0000-0000-0000-000000000008', 'Bagian luar & dalam kuali fryer dan Ex Fryer', 'All cover fryer dibuka dan dilakukan pengerokan stalagnit / jelaga pada bagian bodi atas fryer.
All cover dilakukan pencucian dengan sabun dan dilap dengan alkohol 70%.
Kuali fryer dilakukan flushing dengan air atau cuci dengan coustic soda agar kerak deposit pengerokan terbuang dari dalam fryer dengan air.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 2),
  ('a8000000-0000-0000-0000-000000000008', 'Strainer', 'Pembersihan strainer dari sisa mie HH/HP', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 3),
  ('a8000000-0000-0000-0000-000000000008', 'Edible oil', 'Pembersihan edible bagian luar dan dalam serta filter edible dilakukan cleaning dengan semprot jet cleaner', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 4),
  ('a8000000-0000-0000-0000-000000000008', 'Awning', 'Cover akrilik awning dilakukan pencucian dengan sabun dan dilakukan pengelapan dengan kain kering.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 5),
  ('a8000000-0000-0000-0000-000000000008', 'Talang out fryer', 'Pembersihan talang out fryer dari sisa mie HH/HP', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 6);

-- Insert Bagian untuk Area: Dryer
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a9000000-0000-0000-0000-000000000009', 'Mangkok dryer', 'Pembersihan mangkok dryer dari sisa mie HH/HP', ARRAY['29','30'], 1),
  ('a9000000-0000-0000-0000-000000000009', 'Bodi luar dan dalam dryer', 'Pembersihan bodi luar dan dalam dryer', ARRAY['29','30'], 2),
  ('a9000000-0000-0000-0000-000000000009', 'Talang out dryer', '', ARRAY['29','30'], 3);

-- Insert Bagian untuk Area: Cooling Box
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a1000000-0000-0000-0000-000000000010', 'Plat perforasi / net cooling', 'Kebersihan body dalam cooling bagian atas dari HH mi kemudian cuci dengan jet cleaner.
Lap net conveyor dan as bar conveyor dengan kain yang dibasahi alkohol 70%.
Dilakukan pengeringan dengan menyalakan blower mesin setelah pencucian dengan jet cleaner.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 1),
  ('a1000000-0000-0000-0000-000000000010', 'Cover bagian bawah cooling', 'Kebersihan body dalam cooling bagian bawah dari HH mi kemudian cuci dengan jet cleaner.
Dilakukan pengeringan dengan menyalakan blower mesin setelah pencucian dengan jet cleaner.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 2),
  ('a1000000-0000-0000-0000-000000000010', 'Bodi luar
Filter Cooling
Exhaust cooling', 'Pembersihan bodi luar cooling 
Pembersihan dan pencucian filter cooling 
Pembersihan exhaust cooling', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 3);

-- Insert Bagian untuk Area: Packing
INSERT INTO sanitation_bagian (area_id, name, keterangan, line_numbers, display_order) VALUES
  ('a1100000-0000-0000-0000-000000000011', 'Conveyor pembagi / chanilizer out cooling', 'Pembersihan channelizer dengan kain yang dibasahi alkohol 70%.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 1),
  ('a1100000-0000-0000-0000-000000000011', 'Curve Conveyor', 'Kebersihan curve conveyor dari HH/HP mi dengan semprot angin dan pengelapan dengan kain yang dibasahi alkohol 70%.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 2),
  ('a1100000-0000-0000-0000-000000000011', 'Talang penampung channelizer', 'Kebersihan talang penampung dari HH/HP mi dengan semprot angin dan pengelapan dengan kain yang dibasahi alkohol 70%.', ARRAY['29','30'], 3),
  ('a1100000-0000-0000-0000-000000000011', 'Bak penampung mie', 'Pembersihan bak penampung mie di area packing', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 4),
  ('a1100000-0000-0000-0000-000000000011', 'Anting-anting', 'Anting-anting dilepas dan dilakukan pencucian kemudian dikeringkan terlebih dahulu sebelum dipasang kembali lalu dilakukan pelumasan menggunakan chain lube food grade.
Rel Anting-anting dilakukan pembersihan dengan melakukan penyemprotan dengan angin dan dilakukan pengelapan dengan kain kering.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 5),
  ('a1100000-0000-0000-0000-000000000011', 'Autoloader', 'Pembersihan autoloader :
a. chute autoloader
b. pusher lug conveyor
c. bodi autoloader', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 6),
  ('a1100000-0000-0000-0000-000000000011', 'Meja infeed packing', 'Pembersihan meja panampung seasoning', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 7),
  ('a1100000-0000-0000-0000-000000000011', 'Infeed packing', 'Pembersihan area infeed packing', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 8),
  ('a1100000-0000-0000-0000-000000000011', 'Mesin packing', 'Pembersihan mesin packing secara menyeluruh
a. talang penampung bagian bawah mesin
b. bodi mesin packing
c. heater longsealer dan endsealer', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 9),
  ('a1100000-0000-0000-0000-000000000011', 'Carton sealer', 'Pembersihan mesin carton sealer dan FG Conveyor dengan kain dan dengan semprot angin.', ARRAY['1','2','3','4','5','6','7','8','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'], 10);