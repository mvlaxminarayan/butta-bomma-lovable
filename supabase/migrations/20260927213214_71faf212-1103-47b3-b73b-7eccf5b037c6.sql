alter view api.active_coupons set (security_invoker = true);
alter table public.coupons enable row level security;
create policy "Anyone can view active coupons"
  on public.coupons
  for select
  to anon, authenticated
  using (active = true
    and (expires_at is null or expires_at > now())
    and (max_uses is null or times_used < max_uses));