
CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  exists_check INT;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT 1 INTO exists_check FROM public.referral_codes WHERE referral_codes.code = new_code;
    IF exists_check IS NULL THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Run the previous failed parts now that the function works
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='referral_codes') THEN
    CREATE TABLE public.referral_codes (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "referral_codes: owner read" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "referral_codes: admin all" ON public.referral_codes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='referrals') THEN
    CREATE TABLE public.referrals (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      referrer_user_id UUID NOT NULL,
      referred_user_id UUID NOT NULL UNIQUE,
      referral_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reward_amount_usd INTEGER NOT NULL DEFAULT 0,
      reward_status TEXT NOT NULL DEFAULT 'none',
      converted_at TIMESTAMP WITH TIME ZONE,
      paid_at TIMESTAMP WITH TIME ZONE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "referrals: referrer read" ON public.referrals FOR SELECT USING (auth.uid() = referrer_user_id);
    CREATE POLICY "referrals: referred read" ON public.referrals FOR SELECT USING (auth.uid() = referred_user_id);
    CREATE POLICY "referrals: admin all" ON public.referrals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
    CREATE TRIGGER referrals_set_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    CREATE INDEX referrals_referrer_idx ON public.referrals(referrer_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='engineer_paste_flags') THEN
    CREATE TABLE public.engineer_paste_flags (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      turn_index INTEGER NOT NULL,
      reason TEXT NOT NULL,
      snippet TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    ALTER TABLE public.engineer_paste_flags ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "paste_flags: admin read" ON public.engineer_paste_flags FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
    CREATE POLICY "paste_flags: service role insert" ON public.engineer_paste_flags FOR INSERT WITH CHECK (auth.role() = 'service_role');
    CREATE INDEX engineer_paste_flags_user_idx ON public.engineer_paste_flags(user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'founder')
  on conflict do nothing;

  insert into public.referral_codes (user_id, code)
  values (new.id, public.gen_referral_code())
  on conflict (user_id) do nothing;

  return new;
end; $function$;

INSERT INTO public.referral_codes (user_id, code)
SELECT u.id, public.gen_referral_code()
FROM auth.users u
LEFT JOIN public.referral_codes rc ON rc.user_id = u.id
WHERE rc.id IS NULL;
