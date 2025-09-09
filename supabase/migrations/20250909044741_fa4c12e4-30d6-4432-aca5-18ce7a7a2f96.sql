-- Fix product image URLs to use imported assets correctly  
-- Clear existing products and re-insert with proper image references
DELETE FROM public.products;

-- Insert products with proper image asset paths that will be handled by the component
INSERT INTO public.products (name, description, price, image_url, category, stock_quantity, in_stock)
VALUES 
  ('Handcrafted Ceramic Mug', 'Beautiful handmade ceramic mug perfect for your morning coffee. Each piece is unique with its own character and charm.', 28.00, 'product-mug.jpg', 'Ceramics', 25, true),
  ('Woven Storage Basket', 'Elegant woven storage basket made from natural materials. Perfect for organizing your home while adding a touch of rustic charm.', 45.00, 'product-basket.jpg', 'Home Decor', 15, true),
  ('Live Edge Cutting Board', 'Premium live edge cutting board crafted from sustainable hardwood. A beautiful and functional addition to any kitchen.', 68.00, 'product-cutting-board.jpg', 'Kitchen', 10, true),
  ('Artisan Ceramic Bowl Set', 'Set of 4 handcrafted ceramic bowls, perfect for serving or display. Each bowl is unique with beautiful glazing.', 95.00, 'product-mug.jpg', 'Ceramics', 8, true),
  ('Handwoven Placemat Set', 'Set of 6 handwoven placemats made from natural fibers. Add warmth and texture to your dining experience.', 32.00, 'product-basket.jpg', 'Home Decor', 20, true);