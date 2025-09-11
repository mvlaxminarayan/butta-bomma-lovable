-- Fix security definer issue by recreating the view without security definer
DROP VIEW IF EXISTS api.products;

-- Create api.products view without security definer (uses invoker's permissions)
CREATE VIEW api.products AS
SELECT * FROM public.products;

-- Ensure proper permissions are granted
GRANT SELECT ON api.products TO anon, authenticated;