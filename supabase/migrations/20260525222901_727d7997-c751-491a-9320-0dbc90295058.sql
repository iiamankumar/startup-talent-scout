CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_intent text;
  v_role app_role;
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  v_intent := lower(coalesce(new.raw_user_meta_data->>'intent', 'founder'));
  if v_intent = 'engineer' then
    v_role := 'engineer'::app_role;
  else
    v_role := 'founder'::app_role;
  end if;

  insert into public.user_roles (user_id, role)
  values (new.id, v_role)
  on conflict do nothing;

  insert into public.referral_codes (user_id, code)
  values (new.id, public.gen_referral_code())
  on conflict (user_id) do nothing;

  return new;
end; $function$;