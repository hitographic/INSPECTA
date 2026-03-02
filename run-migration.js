import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running migration: add_menu_and_plant_permissions...');

  try {
    // Check if columns exist
    const { data: columns, error: colError } = await supabase
      .from('app_users')
      .select('*')
      .limit(1);

    if (colError) {
      console.error('Error checking columns:', colError);
      return;
    }

    // Check if we need to add columns
    const firstUser = columns?.[0];
    const needsMenuColumn = !firstUser || !('allowed_menus' in firstUser);
    const needsPlantColumn = !firstUser || !('allowed_plants' in firstUser);

    console.log('Columns check:', {
      needsMenuColumn,
      needsPlantColumn,
      firstUser: firstUser ? Object.keys(firstUser) : 'no users'
    });

    if (!needsMenuColumn && !needsPlantColumn) {
      console.log('✅ Columns already exist. Checking admin user...');

      // Update admin user
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          allowed_menus: ['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'],
          allowed_plants: ['Plant-1', 'Plant-2', 'Plant-3']
        })
        .eq('username', 'admin');

      if (updateError) {
        console.error('❌ Error updating admin user:', updateError);
      } else {
        console.log('✅ Admin user updated with full access!');
      }

      return;
    }

    console.log('⚠️  Columns do not exist yet.');
    console.log('Please run this SQL manually in Supabase SQL Editor:');
    console.log('');
    console.log('-- Add allowed_menus column');
    console.log("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS allowed_menus text[] DEFAULT ARRAY['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'];");
    console.log('');
    console.log('-- Add allowed_plants column');
    console.log("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS allowed_plants text[] DEFAULT ARRAY['Plant-1', 'Plant-2', 'Plant-3'];");
    console.log('');
    console.log('-- Update admin user');
    console.log("UPDATE app_users SET allowed_menus = ARRAY['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'], allowed_plants = ARRAY['Plant-1', 'Plant-2', 'Plant-3'] WHERE username = 'admin';");
    console.log('');
    console.log('-- Create indexes');
    console.log('CREATE INDEX IF NOT EXISTS idx_app_users_allowed_menus ON app_users USING GIN (allowed_menus);');
    console.log('CREATE INDEX IF NOT EXISTS idx_app_users_allowed_plants ON app_users USING GIN (allowed_plants);');

  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

runMigration();
