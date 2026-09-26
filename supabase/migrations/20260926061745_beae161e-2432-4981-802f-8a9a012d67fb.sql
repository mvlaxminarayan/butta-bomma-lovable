CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
$$;

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  max_uses integer,
  times_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_type_chk CHECK (discount_type IN ('percent','fixed','free_shipping')),
  CONSTRAINT coupons_value_chk CHECK (discount_value >= 0)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.store_settings (
  id integer PRIMARY KEY DEFAULT 1,
  shipping_fee numeric NOT NULL DEFAULT 8.99,
  free_shipping_threshold numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.store_settings (id, shipping_fee, free_shipping_threshold) VALUES (1, 8.99, 50);
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.store_settings FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE VIEW api.coupons WITH (security_invoker = true) AS SELECT * FROM public.coupons;
CREATE VIEW api.store_settings WITH (security_invoker = true) AS SELECT * FROM public.store_settings;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.coupons TO authenticated;
GRANT SELECT ON api.store_settings TO anon, authenticated;
GRANT UPDATE ON api.store_settings TO authenticated;
GRANT ALL ON api.coupons, api.store_settings TO service_role;

CREATE OR REPLACE FUNCTION api.validate_coupon(_code text)
RETURNS TABLE (code text, discount_type text, discount_value numeric, min_order numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.code, c.discount_type, c.discount_value, c.min_order
  FROM public.coupons c
  WHERE upper(c.code) = upper(trim(_code))
    AND c.active
    AND (c.expires_at IS NULL OR c.expires_at > now())
    AND (c.max_uses IS NULL OR c.times_used < c.max_uses)
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION api.validate_coupon(text) TO anon, authenticated, service_role;