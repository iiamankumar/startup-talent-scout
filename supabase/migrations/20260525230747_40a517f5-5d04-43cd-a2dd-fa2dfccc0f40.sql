DROP TRIGGER IF EXISTS guard_engineer_self_update_trigger ON public.engineers;
CREATE TRIGGER guard_engineer_self_update_trigger
BEFORE UPDATE ON public.engineers
FOR EACH ROW EXECUTE FUNCTION public.guard_engineer_self_update();