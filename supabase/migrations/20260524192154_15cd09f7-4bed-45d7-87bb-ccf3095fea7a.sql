
-- Fix search_path on trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end; $$;

-- Lock down has_role: only authenticated may call it
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Lock down handle_new_user: trigger-only, no direct callers
revoke execute on function public.handle_new_user() from public, anon, authenticated;
