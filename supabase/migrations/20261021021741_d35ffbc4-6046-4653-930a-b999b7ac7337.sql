CREATE OR REPLACE FUNCTION public.validate_order_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('paid','packed','shipped','out_for_delivery','delivered','cancelled','refunded') THEN
    RAISE EXCEPTION 'Invalid order status: %', NEW.status;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_history = COALESCE(NEW.status_history, OLD.status_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('status', NEW.status, 'at', now()));
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END; $$;