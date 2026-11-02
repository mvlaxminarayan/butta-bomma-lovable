ALTER TABLE public.categories ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Seed official and in-use categories so every category is managed in one list.
INSERT INTO public.categories (name)
SELECT n FROM (
  SELECT unnest(ARRAY['Etikoppaka toys','Kondapalli toys','Chiriyal paintings','Wooden stools','Brass collection','Table lamps','Traditional dolls','Wedding crafts']) AS n
  UNION
  SELECT DISTINCT btrim(category) FROM public.products WHERE category IS NOT NULL AND btrim(category) <> ''
) s
ON CONFLICT DO NOTHING;

WITH official AS (
  SELECT n, ord FROM unnest(ARRAY['Etikoppaka toys','Kondapalli toys','Chiriyal paintings','Wooden stools','Brass collection','Table lamps','Traditional dolls','Wedding crafts']) WITH ORDINALITY AS t(n, ord)
), ranked AS (
  SELECT c.id, row_number() OVER (ORDER BY COALESCE(o.ord, 1000), c.created_at, c.name) AS rn
  FROM public.categories c LEFT JOIN official o ON lower(o.n) = lower(c.name)
)
UPDATE public.categories c SET sort_order = r.rn FROM ranked r WHERE r.id = c.id;

GRANT UPDATE ON public.categories TO authenticated;
CREATE POLICY "Admins update categories" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE VIEW api.categories WITH (security_invoker = true) AS
  SELECT id, name, created_at, updated_at, sort_order FROM public.categories;
GRANT UPDATE ON api.categories TO authenticated;

-- Rename a category and move its products to the new name in one step.
CREATE OR REPLACE FUNCTION public.rename_category(_old text, _new text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v text := btrim(_new);
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF v = '' THEN RAISE EXCEPTION 'Category name cannot be empty'; END IF;
  IF EXISTS (SELECT 1 FROM public.categories WHERE lower(name) = lower(v) AND lower(name) <> lower(btrim(_old))) THEN
    RAISE EXCEPTION 'This category already exists.';
  END IF;
  UPDATE public.categories SET name = v WHERE lower(name) = lower(btrim(_old));
  IF NOT FOUND THEN
    INSERT INTO public.categories (name, sort_order) VALUES (v, (SELECT COALESCE(max(sort_order),0)+1 FROM public.categories));
  END IF;
  UPDATE public.products SET category = v WHERE lower(btrim(category)) = lower(btrim(_old));
  RETURN v;
END; $$;
REVOKE ALL ON FUNCTION public.rename_category(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rename_category(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION api.rename_category(_old text, _new text)
RETURNS text LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$ SELECT public.rename_category(_old, _new) $$;
REVOKE ALL ON FUNCTION api.rename_category(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION api.rename_category(text, text) TO authenticated;