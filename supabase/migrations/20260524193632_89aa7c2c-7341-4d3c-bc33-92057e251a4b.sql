create table public.engineer_reviews (
  id uuid primary key default gen_random_uuid(),
  engineer_id uuid not null,
  reviewer_user_id uuid,
  reviewer_name text not null,
  reviewer_role text,
  reviewer_company text,
  rating int not null check (rating between 1 and 5),
  quote text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.engineer_reviews(engineer_id);

alter table public.engineer_reviews enable row level security;

create policy "reviews: public read approved"
  on public.engineer_reviews for select
  using (approved = true);

create policy "reviews: reviewer read own"
  on public.engineer_reviews for select
  using (auth.uid() = reviewer_user_id);

create policy "reviews: authenticated insert"
  on public.engineer_reviews for insert
  with check (auth.uid() = reviewer_user_id);

create policy "reviews: admin all"
  on public.engineer_reviews for all
  using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));

create trigger reviews_updated_at
  before update on public.engineer_reviews
  for each row execute function public.set_updated_at();