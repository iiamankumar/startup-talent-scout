ALTER TABLE public.hire_requests REPLICA IDENTITY FULL;
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hire_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;