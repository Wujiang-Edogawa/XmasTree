
-- Add is_draft column to christmas_trees table
ALTER TABLE christmas_trees 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;
