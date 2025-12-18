import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const big = 'data:image/jpeg;base64,' + 'A'.repeat(7 * 1024 * 1024);

const payload = {
  id_unik: 'TEST_BIG_' + Date.now(),
  plant: 'Plant-2',
  tanggal: '2025-12-18',
  line: 'Line 20',
  regu: 'A',
  shift: '1',
  pengamatan_ke: 98,
  flavor: 'Test',
  mesin: 'Mesin 1',
  created_by: 'diagnostic',
  is_complete: true,
  pengamatan_timestamp: new Date().toISOString(),
  foto_etiket: big
};

const { data, error } = await supabase
  .from('kliping_records')
  .insert(payload)
  .select('id')
  .single();

console.log('insert', { ok: !!data, id: data?.id, error });
