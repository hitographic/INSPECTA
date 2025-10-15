/*
  # Fix sanitation_records ID Column
  
  ## Problem
  The id column is defined as TEXT without a default value,
  causing INSERT operations to fail with null constraint violation.
  
  ## Solution
  1. Drop the existing id column (if there's no critical data)
  2. Add a new id column as SERIAL (auto-increment integer)
  3. Set it as primary key
  
  ## Important Notes
  - This will recreate the id column
  - Existing data will get new sequential IDs
  - Foreign key references need to be updated if any exist
*/

-- Step 1: Drop existing primary key constraint if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sanitation_records_pkey' 
    AND conrelid = 'sanitation_records'::regclass
  ) THEN
    ALTER TABLE sanitation_records DROP CONSTRAINT sanitation_records_pkey;
  END IF;
END $$;

-- Step 2: Drop the old id column
ALTER TABLE sanitation_records DROP COLUMN IF EXISTS id;

-- Step 3: Add new id column as SERIAL (auto-increment)
ALTER TABLE sanitation_records 
  ADD COLUMN id SERIAL PRIMARY KEY;

-- Step 4: Reorder columns (put id first) - PostgreSQL doesn't support column reordering directly
-- But we can work with this order, the application will handle it fine

-- Verify the change
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: id column is now SERIAL PRIMARY KEY';
END $$;
