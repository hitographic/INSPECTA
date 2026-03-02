/*
  # Fix sanitation_records ID Column Auto-Increment

  1. Problem
    - The `id` column in `sanitation_records` table lost its auto-increment behavior
    - Column is defined as `bigint NOT NULL` without a default value
    - The original BIGSERIAL sequence is missing

  2. Solution
    - Create a new sequence for the id column
    - Set the sequence to start from the maximum existing id + 1 (minimum 1)
    - Set the id column default to use the new sequence
    - Associate the sequence with the column for proper ownership

  3. Security
    - No RLS changes needed
    - This is a structural fix only
*/

-- Create a sequence for sanitation_records id
CREATE SEQUENCE IF NOT EXISTS sanitation_records_id_seq;

-- Set the sequence to start from the max id + 1 (minimum 1 if no records exist)
DO $$
DECLARE
  max_id bigint;
  start_value bigint;
BEGIN
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM sanitation_records;
  start_value := GREATEST(max_id, 1);
  PERFORM setval('sanitation_records_id_seq', start_value, false);
END $$;

-- Set the default value for id column to use the sequence
ALTER TABLE sanitation_records 
  ALTER COLUMN id SET DEFAULT nextval('sanitation_records_id_seq');

-- Set the sequence ownership to the id column (for proper CASCADE behavior)
ALTER SEQUENCE sanitation_records_id_seq OWNED BY sanitation_records.id;
