import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testQuery() {
  console.log('=== Testing KlipingRecordsScreen Query ===\n');
  
  // Simulate the exact query from loadRecords
  console.log('1. Testing exact query from loadRecords (Plant-2):');
  const { data, error } = await supabase
    .from('kliping_records')
    .select('id, id_unik, plant, tanggal, line, regu, shift, flavor, pengamatan_ke, mesin, created_by, created_at, updated_at, is_complete, pengamatan_timestamp')
    .eq('plant', 'Plant-2')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('   ❌ Error:', error);
  } else {
    console.log(`   ✅ Success! Found ${data?.length || 0} records`);
    
    // Filter for Dec 13
    const dec13 = data?.filter(r => r.tanggal === '2025-12-13');
    console.log(`   📅 Records for 2025-12-13: ${dec13?.length || 0}`);
    
    if (dec13 && dec13.length > 0) {
      dec13.forEach(record => {
        console.log(`      - ${record.tanggal} | ${record.line} | Regu ${record.regu} | Shift ${record.shift} | P${record.pengamatan_ke} | ${record.flavor} | ${record.mesin}`);
      });
    }
    
    // Show all unique dates
    const dates = [...new Set(data?.map(r => r.tanggal))].sort();
    console.log(`   📆 Unique dates found: ${dates.join(', ')}`);
  }
  
  console.log('\n2. Testing RPC count_kliping_photos (Plant-2):');
  const { data: countData, error: countError } = await supabase.rpc('count_kliping_photos', {
    p_plant: 'Plant-2'
  });
  
  if (countError) {
    console.error('   ❌ Error:', countError);
  } else {
    console.log(`   ✅ Success! Got ${countData?.length || 0} photo count entries`);
    const dec13Counts = countData?.filter(r => r.tanggal === '2025-12-13');
    console.log(`   📅 Photo counts for 2025-12-13: ${dec13Counts?.length || 0}`);
    if (dec13Counts && dec13Counts.length > 0) {
      dec13Counts.forEach(c => {
        console.log(`      - ${c.tanggal} | ${c.line} | Regu ${c.regu} | Shift ${c.shift} | P${c.pengamatan_ke} | ${c.mesin} | Photos: ${c.photo_count}`);
      });
    }
  }
  
  console.log('\n3. Comparing Plant-1 vs Plant-2 vs Plant-3:');
  for (const plant of ['Plant-1', 'Plant-2', 'Plant-3']) {
    const { data: plantData, error: plantError } = await supabase
      .from('kliping_records')
      .select('tanggal')
      .eq('plant', plant)
      .eq('tanggal', '2025-12-13');
    
    if (plantError) {
      console.log(`   ${plant}: ❌ Error - ${plantError.message}`);
    } else {
      console.log(`   ${plant}: ${plantData?.length || 0} records on 2025-12-13`);
    }
  }
}

testQuery()
  .then(() => {
    console.log('\n=== Test completed ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
