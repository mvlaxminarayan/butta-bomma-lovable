ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (lower(username));

CREATE OR REPLACE FUNCTION public.normalize_username() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username := lower(trim(NEW.username));
    IF NEW.username = '' THEN NEW.username := NULL;
    ELSIF NEW.username !~ '^[a-z0-9_]{3,20}$' THEN
      RAISE EXCEPTION 'Username must be 3-20 letters, numbers or underscores';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS profiles_normalize_username ON public.profiles;
CREATE TRIGGER profiles_normalize_username BEFORE INSERT OR UPDATE OF username ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.normalize_username();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u text := lower(trim(NEW.raw_user_meta_data->>'username'));
BEGIN
  IF u IS NULL OR u !~ '^[a-z0-9_]{3,20}$' OR EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = u) THEN
    u := NULL;
  END IF;
  INSERT INTO public.profiles (user_id, email, full_name, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), u);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.username_available(_username text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(trim(_username)))
$$;
CREATE OR REPLACE FUNCTION api.username_available(_username text) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$ SELECT public.username_available(_username) $$;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.username_available(text) TO anon, authenticated;

CREATE OR REPLACE VIEW api.profiles WITH (security_invoker = true) AS
  SELECT id, user_id, email, full_name, role, username FROM public.profiles;
GRANT SELECT ON api.profiles TO authenticated;
GRANT ALL ON api.profiles TO service_role;