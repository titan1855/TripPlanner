-- ============================================================
-- TripPlanner v2 — 0001_v2_full_reset.sql
-- 破壞性重置：drop 所有 v1 舊表，重建 8 張新表 + RLS + user trigger
-- ⚠️ 僅可在 TripPlanner 專用的 Supabase 專案執行（內含測試資料）
-- ============================================================

-- ---------- 1. Drop 舊表與舊物件 ----------
drop table if exists public.spot_photos cascade;
drop table if exists public.expense_splits cascade;
drop table if exists public.expenses cascade;
drop table if exists public.budgets cascade;
drop table if exists public.checklist_items cascade;
drop table if exists public.tickets cascade;
drop table if exists public.accommodations cascade;
drop table if exists public.spots cascade;
drop table if exists public.trip_days cascade;
drop table if exists public.trip_members cascade;
drop table if exists public.trips cascade;
drop table if exists public.users cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_trip_owner(uuid) cascade;
drop function if exists public.is_trip_member(uuid) cascade;
drop function if exists public.set_updated_at() cascade;

-- ---------- 2. users ----------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

-- 註冊時自動建立 public.users（沿用舊版 trigger 做法）
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 3. trips ----------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  destination text,
  start_date date not null,
  end_date date not null,
  key_reminders text,
  status text not null default 'planning'
    check (status in ('planning', 'ongoing', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

-- ---------- 4. trip_members ----------
create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  nickname text not null,
  avatar_color text,
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);
create index trip_members_trip_id_idx on public.trip_members (trip_id);
create index trip_members_user_id_idx on public.trip_members (user_id);

-- ---------- 5. trip_days ----------
create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_number int not null,
  date date not null,
  area_summary text,
  highlight text,
  plan_b text,
  memo text,
  unique (trip_id, date)
);
create index trip_days_trip_id_idx on public.trip_days (trip_id);

-- ---------- 6. spots（口袋名單與已排程景點共用）----------
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  trip_day_id uuid references public.trip_days (id) on delete set null, -- NULL = 口袋名單
  name text not null,
  address text,
  category text not null default 'other'
    check (category in ('sight', 'food', 'shopping', 'hotel', 'transport_hub', 'other')),
  priority text not null default 'want'
    check (priority in ('must', 'want', 'optional')),
  visit_status text not null default 'pending'
    check (visit_status in ('pending', 'done', 'skipped')),
  arrival_time time,
  departure_time time,
  duration_note text,
  sort_order int not null default 0,
  alternative_group uuid,
  booking_status text not null default 'none'
    check (booking_status in ('none', 'need_booking', 'suggested', 'booked', 'on_site', 'tbd')),
  opening_hours_note text,
  est_cost_per_person numeric,
  cost_currency text,
  notes text,
  -- 到下一站的交通銜接（皆選填）
  transport_mode text
    check (transport_mode in ('walk', 'metro', 'train', 'bus', 'car', 'taxi', 'ferry', 'flight', 'other')),
  transport_line text,
  transport_departures text,
  transport_board_at text,
  transport_alight_at text,
  transport_minutes int,
  transport_frequency_note text,
  transport_booking_status text
    check (transport_booking_status in ('none', 'need_booking', 'suggested', 'booked', 'on_site', 'tbd')),
  transport_cost_per_person numeric,
  transport_notes text,
  created_at timestamptz not null default now()
);
create index spots_trip_id_idx on public.spots (trip_id);
create index spots_trip_day_id_idx on public.spots (trip_day_id);
create index spots_alternative_group_idx on public.spots (alternative_group);

-- ---------- 7. accommodations ----------
create table public.accommodations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  address text,
  check_in_date date,
  check_out_date date,
  booking_reference text,
  booking_status text not null default 'tbd'
    check (booking_status in ('booked', 'tbd', 'cancelled')),
  est_cost numeric,
  cost_currency text,
  notes text,
  created_at timestamptz not null default now()
);
create index accommodations_trip_id_idx on public.accommodations (trip_id);

-- ---------- 8. tickets ----------
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null,
  ticket_type text not null default 'other'
    check (ticket_type in ('transport', 'admission', 'pass', 'other')),
  price numeric,
  currency text,
  needs_booking text not null default 'required'
    check (needs_booking in ('required', 'on_site', 'included')),
  booking_status text not null default 'not_booked'
    check (booking_status in ('not_booked', 'booked', 'collected')),
  booking_deadline text,
  booking_reference text,
  linked_spot_id uuid references public.spots (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index tickets_trip_id_idx on public.tickets (trip_id);

-- ---------- 9. checklist_items ----------
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  category text not null default 'other'
    check (category in ('document', 'transport', 'ticket', 'packing', 'other')),
  title text not null,
  status text not null default 'todo'
    check (status in ('todo', 'done')),
  due_date date,
  importance text not null default 'medium'
    check (importance in ('high', 'medium', 'low')),
  assignee_member_id uuid references public.trip_members (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index checklist_items_trip_id_idx on public.checklist_items (trip_id);

-- ---------- 10. RLS helper functions（security definer 避免遞迴）----------
create function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trips
    where id = p_trip_id and owner_id = auth.uid()
  );
$$;

create function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

-- ---------- 11. RLS policies ----------
alter table public.users enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_days enable row level security;
alter table public.spots enable row level security;
alter table public.accommodations enable row level security;
alter table public.tickets enable row level security;
alter table public.checklist_items enable row level security;

-- users：只能讀寫自己
create policy users_select_self on public.users
  for select using (id = auth.uid());
create policy users_update_self on public.users
  for update using (id = auth.uid());

-- trips：owner 全權限；成員可 SELECT / UPDATE
create policy trips_select on public.trips
  for select using (owner_id = auth.uid() or public.is_trip_member(id));
create policy trips_insert on public.trips
  for insert with check (owner_id = auth.uid());
create policy trips_update on public.trips
  for update using (owner_id = auth.uid() or public.is_trip_member(id));
create policy trips_delete on public.trips
  for delete using (owner_id = auth.uid());

-- trip_members：owner 可增刪；成員可讀
create policy trip_members_select on public.trip_members
  for select using (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id));
create policy trip_members_insert on public.trip_members
  for insert with check (public.is_trip_owner(trip_id));
create policy trip_members_update on public.trip_members
  for update using (public.is_trip_owner(trip_id));
create policy trip_members_delete on public.trip_members
  for delete using (public.is_trip_owner(trip_id));

-- 其餘表：owner 與成員皆可 SELECT / INSERT / UPDATE / DELETE
create policy trip_days_all on public.trip_days
  for all using (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id))
  with check (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id));

create policy spots_all on public.spots
  for all using (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id))
  with check (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id));

create policy accommodations_all on public.accommodations
  for all using (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id))
  with check (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id));

create policy tickets_all on public.tickets
  for all using (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id))
  with check (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id));

create policy checklist_items_all on public.checklist_items
  for all using (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id))
  with check (public.is_trip_owner(trip_id) or public.is_trip_member(trip_id));
