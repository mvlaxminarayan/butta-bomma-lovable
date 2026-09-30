CREATE TABLE public.product_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL CHECK (length(trim(customer_name)) BETWEEN 1 AND 80),
  question text NOT NULL CHECK (length(trim(question)) BETWEEN 5 AND 1000),
  answer text,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.product_questions TO authenticated;
GRANT SELECT ON public.product_questions TO anon;
GRANT ALL ON public.product_questions TO service_role;
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read answered product questions" ON public.product_questions FOR SELECT TO anon, authenticated USING (answer IS NOT NULL);
CREATE POLICY "Shoppers read their own product questions" ON public.product_questions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read product questions" ON public.product_questions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Shoppers ask product questions" ON public.product_questions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND answer IS NULL AND answered_at IS NULL);
CREATE POLICY "Admins answer product questions" ON public.product_questions FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER update_product_questions_updated_at BEFORE UPDATE ON public.product_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX product_questions_product_created_idx ON public.product_questions (product_id, created_at DESC);
CREATE INDEX product_questions_user_idx ON public.product_questions (user_id);
CREATE OR REPLACE VIEW api.product_questions WITH (security_invoker = true) AS SELECT id, product_id, user_id, customer_name, question, answer, answered_at, created_at, updated_at FROM public.product_questions;
GRANT SELECT ON api.product_questions TO anon, authenticated;
GRANT INSERT, UPDATE ON api.product_questions TO authenticated;
GRANT ALL ON api.product_questions TO service_role;