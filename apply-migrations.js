import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase URL or Anon Key tidak ditemukan di .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration(filePath, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Applying: ${description}`);
  console.log('='.repeat(60));

  try {
    const sql = readFileSync(filePath, 'utf-8');

    console.log(`Reading SQL from: ${filePath}`);
    console.log(`SQL length: ${sql.length} characters`);

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      if (error.message.includes('function exec_sql') || error.message.includes('does not exist')) {
        console.log('\n⚠️  Supabase RPC function tidak tersedia.');
        console.log('📋 Silakan apply migration secara manual:');
        console.log('\n1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/uwxeduhjnkvgynvexyau');
        console.log('2. Klik "SQL Editor" di menu kiri');
        console.log('3. Copy-paste SQL berikut:\n');
        console.log('--- START SQL ---');
        console.log(sql);
        console.log('--- END SQL ---\n');
        console.log('4. Klik "Run" untuk execute SQL');
        return false;
      }
      throw error;
    }

    console.log('✅ Migration berhasil diapply!');
    if (data) {
      console.log('Result:', JSON.stringify(data, null, 2));
    }
    return true;
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Starting Migration Process...\n');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Using Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

  const migrations = [
    {
      file: join(__dirname, 'supabase/migrations/20251010000000_create_master_data_tables.sql'),
      description: 'Create Master Data Tables (Areas, Bagian, Line Configurations)'
    },
    {
      file: join(__dirname, 'supabase/migrations/20251010000001_insert_initial_master_data.sql'),
      description: 'Insert Initial Master Data (80+ bagian, 26 lines)'
    }
  ];

  let successCount = 0;
  let failCount = 0;
  let manualRequired = false;

  for (const migration of migrations) {
    const success = await applyMigration(migration.file, migration.description);
    if (success === false) {
      manualRequired = true;
      failCount++;
    } else {
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (manualRequired) {
    console.log('\n⚠️  MANUAL ACTION REQUIRED');
    console.log('\nKarena tidak bisa apply otomatis, ikuti langkah berikut:');
    console.log('\n1. Buka: https://supabase.com/dashboard/project/uwxeduhjnkvgynvexyau/sql');
    console.log('2. Klik "+ New query" atau pilih "New query"');
    console.log('3. Copy-paste isi file berikut secara BERURUTAN:\n');
    migrations.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.file}`);
    });
    console.log('\n4. Execute setiap SQL dengan klik "Run" atau Ctrl+Enter');
    console.log('\n📝 File SQL ada di folder: ./supabase/migrations/');
  } else {
    console.log('\n🎉 All migrations applied successfully!');
  }

  console.log('\n✨ Done!\n');
}

main();
