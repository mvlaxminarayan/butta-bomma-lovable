ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_grams numeric;
CREATE OR REPLACE FUNCTION public.validate_product_weight() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN IF NEW.weight_grams IS NOT NULL AND (NEW.weight_grams <= 0 OR NEW.weight_grams > 1000000 OR NEW.weight_grams::text IN ('NaN','Infinity','-Infinity')) THEN RAISE EXCEPTION 'Weight must be greater than zero and at most 1000 kg.'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER validate_product_weight_before_write BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.validate_product_weight();
CREATE OR REPLACE VIEW api.products WITH (security_invoker = true) AS SELECT id,name,description,price,image_url,category,stock_quantity,in_stock,created_at,updated_at,images,features,specifications,is_featured,weight_grams FROM public.products;
GRANT SELECT ON api.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON api.products TO authenticated;
GRANT ALL ON api.products TO service_role;