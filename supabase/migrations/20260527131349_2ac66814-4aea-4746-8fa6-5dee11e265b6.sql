
-- 1. Engineers: add WITH CHECK and attach the guard trigger
DROP POLICY IF EXISTS "engineers: owner update" ON public.engineers;
CREATE POLICY "engineers: owner update"
ON public.engineers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_engineers_guard_self_update ON public.engineers;
CREATE TRIGGER trg_engineers_guard_self_update
BEFORE UPDATE ON public.engineers
FOR EACH ROW
EXECUTE FUNCTION public.guard_engineer_self_update();

-- 2. Realtime authorization on realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Helper: authorize topic subscriptions for our app
CREATE OR REPLACE FUNCTION public.can_subscribe_realtime_topic(_topic text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  parts text[];
  kind text;
  ident uuid;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  -- Admins can subscribe to anything
  IF public.has_role(uid, 'admin') THEN
    RETURN true;
  END IF;

  IF _topic IS NULL OR length(_topic) = 0 THEN
    RETURN false;
  END IF;

  parts := string_to_array(_topic, ':');
  kind := parts[1];

  -- Per-user channel: user:<uid>
  IF kind = 'user' AND array_length(parts, 1) = 2 THEN
    BEGIN
      ident := parts[2]::uuid;
    EXCEPTION WHEN others THEN
      RETURN false;
    END;
    RETURN ident = uid;
  END IF;

  -- Per hire request: hire_request:<id>
  IF kind = 'hire_request' AND array_length(parts, 1) = 2 THEN
    BEGIN
      ident := parts[2]::uuid;
    EXCEPTION WHEN others THEN
      RETURN false;
    END;
    RETURN EXISTS (
      SELECT 1 FROM public.hire_requests h
      WHERE h.id = ident AND h.owner_id = uid
    );
  END IF;

  -- Engineer's own channel: engineer:<user_id>
  IF kind = 'engineer' AND array_length(parts, 1) = 2 THEN
    BEGIN
      ident := parts[2]::uuid;
    EXCEPTION WHEN others THEN
      RETURN false;
    END;
    RETURN ident = uid;
  END IF;

  -- Open roles feed: only vetted engineers may subscribe to the public open-roles channel
  IF _topic = 'open_roles' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.engineers e
      WHERE e.user_id = uid AND e.vetting = 'vetted'::vetting_status
    );
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_subscribe_realtime_topic(text) TO authenticated;

DROP POLICY IF EXISTS "realtime: authorized topic read" ON realtime.messages;
CREATE POLICY "realtime: authorized topic read"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.can_subscribe_realtime_topic((realtime.topic())::text));

DROP POLICY IF EXISTS "realtime: authorized topic write" ON realtime.messages;
CREATE POLICY "realtime: authorized topic write"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (public.can_subscribe_realtime_topic((realtime.topic())::text));
