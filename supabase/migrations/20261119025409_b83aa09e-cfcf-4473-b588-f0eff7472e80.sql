CREATE OR REPLACE FUNCTION public.validate_new_product_details()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.name IS NULL OR length(btrim(NEW.name)) = 0 OR length(btrim(NEW.name)) > 200 THEN
    RAISE EXCEPTION 'Enter a product name (at most 200 characters).';
  END IF;
  IF NEW.category IS NULL OR length(btrim(NEW.category)) = 0 OR length(btrim(NEW.category)) > 200 THEN
    RAISE EXCEPTION 'Choose a product category (at most 200 characters).';
  END IF;
  IF NEW.price IS NULL OR NEW.price <= 0 OR NEW.price::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION 'Enter a price greater than zero.';
  END IF;
  IF NEW.stock_quantity IS NULL OR NEW.stock_quantity < 0 THEN
    RAISE EXCEPTION 'Enter a whole stock quantity of zero or more.';
  END IF;
  IF NEW.weight_grams IS NULL OR NEW.weight_grams <= 0 OR NEW.weight_grams > 1000000 OR NEW.weight_grams::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION 'Enter a shipping weight greater than zero and at most 1000 kg.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM unnest(COALESCE(NEW.images, '{}'::text[])) AS photo WHERE photo IS NOT NULL AND length(btrim(photo)) > 0)
     AND (NEW.image_url IS NULL OR length(btrim(NEW.image_url)) = 0) THEN
    RAISE EXCEPTION 'Upload at least one product photo before saving.';
  END IF;
  IF length(COALESCE(NEW.description, '')) > 10000 THEN
    RAISE EXCEPTION 'Description must be at most 10000 characters.';
  END IF;
  NEW.name := btrim(NEW.name);
  NEW.category := btrim(NEW.category);
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_new_product_details_before_insert
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.validate_new_product_details();