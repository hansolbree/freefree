-- ============================================
-- 강의 (집단상담/외부 강의) 스케줄 테이블
-- ============================================

create table public.lectures (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  series_id uuid,
  title text not null,
  center_id uuid references public.centers(id) on delete set null,
  location text,
  audience text,
  color text default '#6ECFBD' not null,
  lecture_date date not null,
  start_time time not null,
  end_time time not null,
  fee integer,
  fee_paid boolean default false not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_lectures_user_id on public.lectures(user_id);
create index idx_lectures_date on public.lectures(lecture_date);
create index idx_lectures_series_id on public.lectures(series_id);

alter table public.lectures enable row level security;

create policy "Users can view own lectures" on public.lectures
  for select using (auth.uid() = user_id);
create policy "Users can insert own lectures" on public.lectures
  for insert with check (auth.uid() = user_id);
create policy "Users can update own lectures" on public.lectures
  for update using (auth.uid() = user_id);
create policy "Users can delete own lectures" on public.lectures
  for delete using (auth.uid() = user_id);

create trigger on_lectures_updated
  before update on public.lectures
  for each row execute function public.handle_updated_at();
