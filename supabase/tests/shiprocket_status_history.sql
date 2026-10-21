-- Run against PostgreSQL after migrations; no real orders or courier calls are used.
BEGIN;
CREATE TEMP TABLE shiprocket_history_regression (
  status text,
  status_history jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz
) ON COMMIT DROP;
CREATE TRIGGER validate_history BEFORE INSERT OR UPDATE ON shiprocket_history_regression
FOR EACH ROW EXECUTE FUNCTION public.validate_order_status();

DO $$
DECLARE
  initial_status text;
  history jsonb;
BEGIN
  FOREACH initial_status IN ARRAY ARRAY['paid','packed'] LOOP
    INSERT INTO shiprocket_history_regression(status, status_history)
    VALUES (initial_status, jsonb_build_array(jsonb_build_object('status', initial_status, 'at', now())));

    UPDATE shiprocket_history_regression
    SET status = 'shipped', status_history = status_history ||
      '[{"shiprocket_shipment_id":123456,"shiprocket_order_id":654321,"at":"2026-10-21T00:00:00Z"}]'::jsonb;
    SELECT status_history INTO history FROM shiprocket_history_regression;
    IF jsonb_array_length(history) <> 3 OR
       history->0->>'status' <> initial_status OR
       history->1->>'shiprocket_shipment_id' <> '123456' OR
       history->1->>'shiprocket_order_id' <> '654321' OR
       history->2->>'status' <> 'shipped' OR
       history->2->>'at' IS NULL THEN
      RAISE EXCEPTION 'Shipment metadata lost when shipping a % order: %', initial_status, history;
    END IF;

    UPDATE shiprocket_history_regression SET status = 'delivered';
    SELECT status_history INTO history FROM shiprocket_history_regression;
    IF jsonb_array_length(history) <> 4 OR
       history->1->>'shiprocket_shipment_id' <> '123456' OR
       history->3->>'status' <> 'delivered' THEN
      RAISE EXCEPTION 'Later status update lost shipment metadata: %', history;
    END IF;

    UPDATE shiprocket_history_regression SET status = 'refunded', status_history = NULL;
    SELECT status_history INTO history FROM shiprocket_history_regression;
    IF jsonb_array_length(history) <> 5 OR history->1->>'shiprocket_shipment_id' <> '123456' THEN
      RAISE EXCEPTION 'Null incoming history did not preserve shipment metadata: %', history;
    END IF;
    DELETE FROM shiprocket_history_regression;
  END LOOP;
END;
$$;
ROLLBACK;