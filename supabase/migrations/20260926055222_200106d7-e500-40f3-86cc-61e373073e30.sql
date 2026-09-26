GRANT USAGE ON SCHEMA api TO authenticated;
GRANT SELECT ON api.profiles TO authenticated;
GRANT ALL ON api.profiles TO service_role;