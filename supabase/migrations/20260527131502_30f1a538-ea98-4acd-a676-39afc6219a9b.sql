
DROP POLICY IF EXISTS "realtime: authorized topic read" ON realtime.messages;
DROP POLICY IF EXISTS "realtime: authorized topic write" ON realtime.messages;
DROP FUNCTION IF EXISTS public.can_subscribe_realtime_topic(text);

CREATE POLICY "realtime: authenticated read"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "realtime: authenticated write"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);
