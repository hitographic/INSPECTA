import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkData() {
  console.log('=== Checking Plant-2 Data ===\n');
  
  // Check for 2025-12-13 specifically
  console.log('1. Checking for Plant-2 records on 2025-12-13:');
  const { data: dec13Data, error: dec13Error } = await supabase
    .from('kliping_records')
    .select('*')
    .eq('plant', 'Plant-2')
    .eq('tanggal', '2025-12-13')
    .order('created_at', { ascending: false });
  
  if (dec13Error) {
    console.error('   Error:', dec13Error.message);
  } else {
    console.log(`   Found ${dec13Data?.length || 0} records`);
    if (dec13Data && dec13Data.length > 0) {
      dec13Data.forEach((record, idx) => {
        console.log(`   Record ${idx + 1}:`, {
          id: record.id,
          plant: record.plant,
          tanggal: record.tanggal,
          line: record.line,
          regu: record.regu,
          shift: record.shift,
          pengamatan_ke: record.pengamatan_ke,
          flavor: record.flavor,
          mesin: record.mesin,
          created_by: record.created_by
        });
      });
    }
  }
  
  console.log('\n2. Checking all Plant-2 records (any date):');
  const { data: allPlant2, error: allError } = await supabase
    .from('kliping_records')
    .select('plant, tanggal, line, regu, shift, pengamatan_ke, flavor, created_at')
    .eq('plant', 'Plant-2')
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (allError) {
    console.error('   Error:', allError.message);
  } else {
    console.log(`   Found ${allPlant2?.length || 0} records total`);
    allPlant2?.forEach((record, idx) => {
      console.log(`   ${idx + 1}. ${record.tanggal} | Line: ${record.line} | Regu: ${record.regu} | Shift: ${record.shift} | P${record.pengamatan_ke} | ${record.flavor}`);
    });
  }
  
  console.log('\n3. Checking for ANY records on 2025-12-13 (all plants):');
  const { data: allDec13, error: allDec13Error } = await supabase
    .from('kliping_records')
    .select('plant, line, regu, shift, pengamatan_ke, created_at')
    .eq('tanggal', '2025-12-13')
    .order('plant', { ascending: true });
    
  if (allDec13Error) {
    console.error('   Error:', allDec13Error.message);
  } else {
    console.log(`   Found ${allDec13?.length || 0} records total`);
    const byPlant = {};
    allDec13?.forEach(record => {
      if (!byPlant[record.plant]) byPlant[record.plant] = 0;
      byPlant[record.plant]++;
    });
    console.log('   Records by plant:', byPlant);
  }
  
  console.log('\n4. Checking if Plant-2 filter is working in query:');
  const { data: filterTest, error: filterError } = await supabase
    .from('kliping_records')
    .select('id, plant, tanggal, line')
    .eq('plant', 'Plant-2')
    .limit(5);
    
  if (filterError) {
    console.error('   Error:', filterError.message);
  } else {
    console.log(`   Query with .eq('plant', 'Plant-2') returned ${filterTest?.length || 0} records`);
    filterTest?.forEach(r => console.log(`   - ${r.plant} | ${r.tanggal} | ${r.line}`));
  }
}

checkData()
  .then(() => {
    console.log('\n=== Check completed ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
