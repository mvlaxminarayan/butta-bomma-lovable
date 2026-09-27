ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE OR REPLACE VIEW api.products AS
SELECT id, name, description, price, image_url, category, stock_quantity, in_stock,
       created_at, updated_at, images, features, specifications, is_featured
FROM public.products;