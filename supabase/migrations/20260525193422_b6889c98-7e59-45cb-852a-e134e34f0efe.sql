
-- 1) Drop public-read RLS on engineers (was exposing sensitive columns).
-- Public profile data is served via server functions using the admin client with explicit projection.
DROP POLICY IF EXISTS "engineers: public read vetted" ON public.engineers;

-- Also drop the dependent public-read on profiles (which joined to vetted engineers).
-- Profile info is exposed through server functions instead.
DROP POLICY IF EXISTS "profiles: public read minimal via engineers" ON public.profiles;

-- 2) Tighten applications insert: require the engineer to be vetted.
DROP POLICY IF EXISTS "applications: engineer insert own" ON public.applications;
CREATE POLICY "applications: engineer insert own"
ON public.applications
FOR INSERT
WITH CHECK (
  auth.uid() = engineer_id
  AND EXISTS (
    SELECT 1 FROM public.engineers e
    WHERE e.user_id = auth.uid()
      AND e.vetting = 'vetted'::vetting_status
  )
);

-- 3) Fix mutable search_path on email queue helpers and revoke public execute.
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 4) Restrict gen_referral_code (definer) to trusted backend only.
REVOKE EXECUTE ON FUNCTION public.gen_referral_code() FROM PUBLIC, anon, authenticated;
