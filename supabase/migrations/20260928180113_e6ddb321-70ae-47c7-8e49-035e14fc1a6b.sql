CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON public.orders (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS orders_razorpay_order_idx ON public.orders (razorpay_order_id);
CREATE INDEX IF NOT EXISTS orders_search_trgm_idx ON public.orders USING gin ((coalesce(order_number,'') || ' ' || coalesce(customer_name,'') || ' ' || coalesce(email,'')) extensions.gin_trgm_ops);

CREATE OR REPLACE FUNCTION api.order_status_counts()
RETURNS TABLE(status text, n bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT status, count(*) FROM public.orders GROUP BY status $$;
REVOKE EXECUTE ON FUNCTION api.order_status_counts() FROM anon, public;
GRANT EXECUTE ON FUNCTION api.order_status_counts() TO authenticated;