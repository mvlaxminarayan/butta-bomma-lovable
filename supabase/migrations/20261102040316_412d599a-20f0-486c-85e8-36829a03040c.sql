GRANT DELETE ON public.categories TO authenticated;
GRANT DELETE ON api.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON api.categories TO service_role;

CREATE POLICY "Admins remove categories" ON public.categories
FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_used_category()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.products WHERE lower(btrim(category)) = lower(btrim(OLD.name))) THEN
    RAISE EXCEPTION 'This category is used by products. Move those products to another category before removing it.';
  END IF;
  RETURN OLD;
END;
$$;
CREATE TRIGGER protect_used_category_before_delete
BEFORE DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.protect_used_category();