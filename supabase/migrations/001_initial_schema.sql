-- ============================================
-- FreeFree 초기 스키마
-- ============================================

-- 1. profiles: 상담사 프로필 (auth.users 확장)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  phone text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. centers: 상담센터 정보
create table public.centers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  address text,
  phone text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. user_centers: 상담사-센터 관계 (색상, 활성 여부)
create table public.user_centers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  center_id uuid references public.centers(id) on delete cascade not null,
  color text default '#3B82F6' not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  unique(user_id, center_id)
);

-- 4. schedules: 센터별 근무 일정
create table public.schedules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  center_id uuid references public.centers(id) on delete cascade not null,
  title text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  is_recurring boolean default false not null,
  recurrence_rule text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. clients: 내담자 정보
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  center_id uuid references public.centers(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  birth_date date,
  gender text,
  notes text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 6. sessions: 상담 회기 기록
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  center_id uuid references public.centers(id) on delete cascade not null,
  session_number integer not null,
  session_date date not null,
  duration_minutes integer default 50 not null,
  session_type text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- 인덱스
-- ============================================
create index idx_centers_user_id on public.centers(user_id);
create index idx_user_centers_user_id on public.user_centers(user_id);
create index idx_user_centers_center_id on public.user_centers(center_id);
create index idx_schedules_user_id on public.schedules(user_id);
create index idx_schedules_center_id on public.schedules(center_id);
create index idx_schedules_date on public.schedules(date);
create index idx_clients_user_id on public.clients(user_id);
create index idx_clients_center_id on public.clients(center_id);
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_client_id on public.sessions(client_id);
create index idx_sessions_center_id on public.sessions(center_id);
create index idx_sessions_date on public.sessions(session_date);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table public.profiles enable row level security;
alter table public.centers enable row level security;
alter table public.user_centers enable row level security;
alter table public.schedules enable row level security;
alter table public.clients enable row level security;
alter table public.sessions enable row level security;

-- profiles: 본인 데이터만 접근
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- centers: 본인이 생성한 센터만
create policy "Users can view own centers" on public.centers
  for select using (auth.uid() = user_id);
create policy "Users can insert own centers" on public.centers
  for insert with check (auth.uid() = user_id);
create policy "Users can update own centers" on public.centers
  for update using (auth.uid() = user_id);
create policy "Users can delete own centers" on public.centers
  for delete using (auth.uid() = user_id);

-- user_centers: 본인 관계만
create policy "Users can view own user_centers" on public.user_centers
  for select using (auth.uid() = user_id);
create policy "Users can insert own user_centers" on public.user_centers
  for insert with check (auth.uid() = user_id);
create policy "Users can update own user_centers" on public.user_centers
  for update using (auth.uid() = user_id);
create policy "Users can delete own user_centers" on public.user_centers
  for delete using (auth.uid() = user_id);

-- schedules: 본인 스케줄만
create policy "Users can view own schedules" on public.schedules
  for select using (auth.uid() = user_id);
create policy "Users can insert own schedules" on public.schedules
  for insert with check (auth.uid() = user_id);
create policy "Users can update own schedules" on public.schedules
  for update using (auth.uid() = user_id);
create policy "Users can delete own schedules" on public.schedules
  for delete using (auth.uid() = user_id);

-- clients: 본인 내담자만
create policy "Users can view own clients" on public.clients
  for select using (auth.uid() = user_id);
create policy "Users can insert own clients" on public.clients
  for insert with check (auth.uid() = user_id);
create policy "Users can update own clients" on public.clients
  for update using (auth.uid() = user_id);
create policy "Users can delete own clients" on public.clients
  for delete using (auth.uid() = user_id);

-- sessions: 본인 상담 기록만
create policy "Users can view own sessions" on public.sessions
  for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.sessions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on public.sessions
  for update using (auth.uid() = user_id);
create policy "Users can delete own sessions" on public.sessions
  for delete using (auth.uid() = user_id);

-- ============================================
-- 트리거: updated_at 자동 갱신
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_centers_updated
  before update on public.centers
  for each row execute function public.handle_updated_at();

create trigger on_schedules_updated
  before update on public.schedules
  for each row execute function public.handle_updated_at();

create trigger on_clients_updated
  before update on public.clients
  for each row execute function public.handle_updated_at();

create trigger on_sessions_updated
  before update on public.sessions
  for each row execute function public.handle_updated_at();

-- ============================================
-- 트리거: 회원가입 시 profiles 자동 생성
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
