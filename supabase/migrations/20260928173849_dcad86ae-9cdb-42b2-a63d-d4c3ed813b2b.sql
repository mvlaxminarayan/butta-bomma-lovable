CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid,
  email text,
  customer_name text,
  phone text,
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_fee numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  coupon_code text,
  status text NOT NULL DEFAULT 'paid',
  courier text,
  tracking_number text,
  status_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.validate_order_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('paid','packed','shipped','out_for_delivery','delivered','cancelled','refunded') THEN
    RAISE EXCEPTION 'Invalid order status: %', NEW.status;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_history = COALESCE(OLD.status_history,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('status', NEW.status, 'at', now()));
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END; $$;
CREATE TRIGGER orders_validate BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order_status();

CREATE VIEW api.orders WITH (security_invoker = true) AS SELECT * FROM public.orders;
GRANT SELECT, UPDATE ON api.orders TO authenticated;
GRANT ALL ON api.orders TO service_role;