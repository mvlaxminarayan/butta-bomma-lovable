-- Create api schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS api;

-- Create api.products view that exposes public.products
CREATE OR REPLACE VIEW api.products AS
SELECT * FROM public.products;

-- Grant usage on api schema to anon and authenticated roles
GRANT USAGE ON SCHEMA api TO anon, authenticated;

-- Grant select on api.products view to anon and authenticated roles
GRANT SELECT ON api.products TO anon, authenticated;

-- Set default privileges for future views in api schema
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT SELECT ON TABLES TO anon, authenticated;