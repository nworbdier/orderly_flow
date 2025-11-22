-- Drop the old update table to allow schema migration
-- This will delete all existing updates, but they referenced old JSONB data anyway
DROP TABLE IF EXISTS "update" CASCADE;

