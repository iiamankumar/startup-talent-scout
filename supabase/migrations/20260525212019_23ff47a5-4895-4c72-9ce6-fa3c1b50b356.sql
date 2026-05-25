-- Prevent engineers from escalating their own vetting/scoring/interview status
-- via the owner UPDATE policy. Admins (service role + has_role admin) bypass.
CREATE OR REPLACE FUNCTION public.guard_engineer_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role and admins to change anything
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- For owner self-updates, lock down internal fields
  IF NEW.vetting IS DISTINCT FROM OLD.vetting
     OR NEW.aveiq_score IS DISTINCT FROM OLD.aveiq_score
     OR NEW.resume_score IS DISTINCT FROM OLD.resume_score
     OR NEW.resume_feedback IS DISTINCT FROM OLD.resume_feedback
     OR NEW.ai_interview_status IS DISTINCT FROM OLD.ai_interview_status
     OR NEW.ai_interview_score IS DISTINCT FROM OLD.ai_interview_score
     OR NEW.ai_interview_summary IS DISTINCT FROM OLD.ai_interview_summary
     OR NEW.ai_interview_transcript IS DISTINCT FROM OLD.ai_interview_transcript
     OR NEW.ai_interview_completed_at IS DISTINCT FROM OLD.ai_interview_completed_at
     OR NEW.main_interview_status IS DISTINCT FROM OLD.main_interview_status
     OR NEW.main_interview_scheduled_at IS DISTINCT FROM OLD.main_interview_scheduled_at
     OR NEW.main_interview_notes IS DISTINCT FROM OLD.main_interview_notes
     OR NEW.main_interview_verdict IS DISTINCT FROM OLD.main_interview_verdict
     OR NEW.main_interviewer_id IS DISTINCT FROM OLD.main_interviewer_id
     OR NEW.work_authorization IS DISTINCT FROM OLD.work_authorization
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to modify protected engineer fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_engineer_self_update ON public.engineers;
CREATE TRIGGER trg_guard_engineer_self_update
BEFORE UPDATE ON public.engineers
FOR EACH ROW
EXECUTE FUNCTION public.guard_engineer_self_update();

REVOKE EXECUTE ON FUNCTION public.guard_engineer_self_update() FROM PUBLIC, anon, authenticated;