ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE OR REPLACE VIEW api.products WITH (security_invoker = true) AS
 SELECT id, name, description, price, image_url, category, stock_quantity, in_stock, created_at, updated_at, images, features, specifications FROM public.products;
GRANT SELECT ON api.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON api.products TO authenticated;
GRANT ALL ON api.products TO service_role;