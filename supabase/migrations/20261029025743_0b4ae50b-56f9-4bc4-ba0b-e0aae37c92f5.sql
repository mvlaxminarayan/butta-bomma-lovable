CREATE TABLE public.categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read categories" ON public.categories FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins create categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE UNIQUE INDEX categories_name_unique ON public.categories (lower(btrim(name)));
CREATE FUNCTION public.normalize_category_name() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 NEW.name := btrim(NEW.name);
 IF NEW.name = '' THEN RAISE EXCEPTION 'Category name cannot be empty'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER normalize_category_name BEFORE INSERT OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.normalize_category_name();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE VIEW api.categories WITH (security_invoker = true) AS SELECT id, name, created_at, updated_at FROM public.categories;
GRANT SELECT, INSERT ON api.categories TO authenticated;
GRANT ALL ON api.categories TO service_role;