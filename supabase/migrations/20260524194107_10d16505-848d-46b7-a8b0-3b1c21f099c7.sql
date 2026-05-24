
-- enums
do $$ begin
  create type public.work_auth as enum (
    'us_citizen','us_green_card','us_h1b','us_opt_cpt','us_tn','other_visa','india_resident','eu_resident','remote_only','unspecified'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.interview_status as enum ('not_started','in_progress','completed','passed','failed','skipped');
exception when duplicate_object then null; end $$;

-- engineer columns
alter table public.engineers
  add column if not exists resume_url text,
  add column if not exists resume_text text,
  add column if not exists resume_score integer,
  add column if not exists resume_feedback text,
  add column if not exists work_authorization public.work_auth not null default 'unspecified',
  add column if not exists ai_interview_status public.interview_status not null default 'not_started',
  add column if not exists ai_interview_score integer,
  add column if not exists ai_interview_summary text,
  add column if not exists ai_interview_transcript jsonb not null default '[]'::jsonb,
  add column if not exists ai_interview_completed_at timestamptz,
  add column if not exists main_interview_status public.interview_status not null default 'not_started',
  add column if not exists main_interview_scheduled_at timestamptz,
  add column if not exists main_interview_notes text,
  add column if not exists main_interview_verdict text,
  add column if not exists main_interviewer_id uuid;

-- private resumes bucket
insert into storage.buckets (id, name, public)
values ('resumes','resumes', false)
on conflict (id) do nothing;

-- engineers can manage their own resume folder ({user_id}/...)
drop policy if exists "resumes: owner read" on storage.objects;
create policy "resumes: owner read" on storage.objects for select
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "resumes: owner write" on storage.objects;
create policy "resumes: owner write" on storage.objects for insert
  with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "resumes: owner update" on storage.objects;
create policy "resumes: owner update" on storage.objects for update
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "resumes: owner delete" on storage.objects;
create policy "resumes: owner delete" on storage.objects for delete
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "resumes: admin all" on storage.objects;
create policy "resumes: admin all" on storage.objects for all
  using (bucket_id = 'resumes' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'resumes' and public.has_role(auth.uid(),'admin'));
