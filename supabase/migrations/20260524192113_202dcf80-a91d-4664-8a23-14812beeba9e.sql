
-- Enums
create type public.app_role as enum ('admin', 'engineer', 'founder');
create type public.vetting_status as enum ('pending', 'in_review', 'vetted', 'rejected');
create type public.hire_status as enum ('open', 'matched', 'closed');
create type public.application_status as enum ('submitted', 'shortlisted', 'rejected', 'hired');
create type public.company_stage as enum ('idea', 'pre_seed', 'seed', 'series_a', 'series_b_plus');

-- Updated-at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  headline text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- Security definer role check
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Engineers
create table public.engineers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  headline text,
  bio text,
  location text,
  years_experience int check (years_experience >= 0 and years_experience <= 60),
  hourly_rate_usd int check (hourly_rate_usd >= 0 and hourly_rate_usd <= 10000),
  skills text[] not null default '{}',
  github_url text,
  linkedin_url text,
  website_url text,
  available boolean not null default true,
  avyra_score int check (avyra_score between 0 and 100),
  vetting public.vetting_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.engineers enable row level security;
create index engineers_vetting_available_idx on public.engineers (vetting, available);
create index engineers_skills_idx on public.engineers using gin (skills);
create trigger trg_engineers_updated before update on public.engineers
  for each row execute function public.set_updated_at();

-- Companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website text,
  stage public.company_stage,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.companies enable row level security;
create index companies_owner_idx on public.companies (owner_id);
create trigger trg_companies_updated before update on public.companies
  for each row execute function public.set_updated_at();

-- Hire requests
create table public.hire_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role_title text not null,
  stack text[] not null default '{}',
  budget_monthly_usd int check (budget_monthly_usd >= 0),
  urgency text check (urgency in ('72h', '1w', '2w', 'flex')),
  notes text,
  status public.hire_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hire_requests enable row level security;
create index hire_requests_owner_idx on public.hire_requests (owner_id);
create index hire_requests_status_idx on public.hire_requests (status);
create trigger trg_hire_requests_updated before update on public.hire_requests
  for each row execute function public.set_updated_at();

-- Applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  hire_request_id uuid not null references public.hire_requests(id) on delete cascade,
  engineer_id uuid not null references public.engineers(user_id) on delete cascade,
  note text,
  status public.application_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hire_request_id, engineer_id)
);
alter table public.applications enable row level security;
create index applications_engineer_idx on public.applications (engineer_id);
create index applications_request_idx on public.applications (hire_request_id);
create trigger trg_applications_updated before update on public.applications
  for each row execute function public.set_updated_at();

-- Auto-create profile + default 'founder' role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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

  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- RLS POLICIES
-- =====================================================================

-- profiles
create policy "profiles: owner can view" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: owner can update" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: public read minimal via engineers"
  on public.profiles for select using (
    exists (select 1 from public.engineers e
            where e.user_id = profiles.id and e.vetting = 'vetted')
  );
create policy "profiles: admin all" on public.profiles
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- user_roles
create policy "user_roles: self read" on public.user_roles
  for select using (auth.uid() = user_id);
create policy "user_roles: admin all" on public.user_roles
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- engineers — public read for vetted+available; owner manages own; admin all
create policy "engineers: public read vetted" on public.engineers
  for select using (vetting = 'vetted');
create policy "engineers: owner read own" on public.engineers
  for select using (auth.uid() = user_id);
create policy "engineers: owner insert" on public.engineers
  for insert with check (auth.uid() = user_id);
create policy "engineers: owner update" on public.engineers
  for update using (auth.uid() = user_id);
create policy "engineers: admin all" on public.engineers
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- companies — owner only + admin
create policy "companies: owner read" on public.companies
  for select using (auth.uid() = owner_id);
create policy "companies: owner write" on public.companies
  for insert with check (auth.uid() = owner_id);
create policy "companies: owner update" on public.companies
  for update using (auth.uid() = owner_id);
create policy "companies: owner delete" on public.companies
  for delete using (auth.uid() = owner_id);
create policy "companies: admin all" on public.companies
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- hire_requests — owner manages; engineers can read open requests
create policy "hire_requests: owner read" on public.hire_requests
  for select using (auth.uid() = owner_id);
create policy "hire_requests: engineers read open"
  on public.hire_requests for select using (
    status = 'open' and exists (
      select 1 from public.engineers e
      where e.user_id = auth.uid() and e.vetting = 'vetted'
    )
  );
create policy "hire_requests: owner insert" on public.hire_requests
  for insert with check (auth.uid() = owner_id);
create policy "hire_requests: owner update" on public.hire_requests
  for update using (auth.uid() = owner_id);
create policy "hire_requests: owner delete" on public.hire_requests
  for delete using (auth.uid() = owner_id);
create policy "hire_requests: admin all" on public.hire_requests
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- applications
create policy "applications: engineer read own" on public.applications
  for select using (auth.uid() = engineer_id);
create policy "applications: engineer insert own" on public.applications
  for insert with check (auth.uid() = engineer_id);
create policy "applications: founder read for own requests"
  on public.applications for select using (
    exists (select 1 from public.hire_requests h
            where h.id = applications.hire_request_id and h.owner_id = auth.uid())
  );
create policy "applications: founder update for own requests"
  on public.applications for update using (
    exists (select 1 from public.hire_requests h
            where h.id = applications.hire_request_id and h.owner_id = auth.uid())
  );
create policy "applications: admin all" on public.applications
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
