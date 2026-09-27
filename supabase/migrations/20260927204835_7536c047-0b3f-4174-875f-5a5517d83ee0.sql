ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS story_title text,
  ADD COLUMN IF NOT EXISTS story_text text,
  ADD COLUMN IF NOT EXISTS story_image text;

UPDATE public.store_settings SET
  story_title = 'Our Story',
  story_text = E'Welcome to Buttabomma Shop — a small studio where every piece is made by hand, one at a time.\n\nWhat began as a love for traditional crafts has grown into a collection of ceramics, textiles and decor, each item shaped by skilled artisans using time-honored techniques. No two pieces are exactly alike — that''s what makes them special.\n\nThis is sample content. Replace it with your own story from the Admin Dashboard.'
WHERE id = 1;

CREATE OR REPLACE VIEW api.store_settings WITH (security_invoker = true) AS SELECT * FROM public.store_settings;
GRANT SELECT ON api.store_settings TO anon, authenticated;
GRANT UPDATE ON api.store_settings TO authenticated;
GRANT ALL ON api.store_settings TO service_role;