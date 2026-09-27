CREATE OR REPLACE VIEW api.products
WITH (security_invoker = true) AS
SELECT id, name, description, price, image_url, category, stock_quantity, in_stock,
       created_at, updated_at, images, features, specifications, is_featured
FROM public.products;