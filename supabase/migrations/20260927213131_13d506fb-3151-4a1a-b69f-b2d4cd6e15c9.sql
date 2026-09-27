create or replace view api.active_coupons as select code, discount_type, discount_value, min_order, expires_at from public.coupons where active = true and (expires_at is null or expires_at > now()) and (max_uses is null or times_used < max_uses) order by created_at desc;

grant select on api.active_coupons to anon, authenticated;