-- ============================================================
-- CarCost — Full Database Migration
-- Run this in Supabase → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------
-- CARS TABLE
-- -------------------------------------------------------
create table if not exists public.cars (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  plate_number text,
  year         integer,
  created_at   timestamptz default now() not null
);

-- -------------------------------------------------------
-- EXPENSES TABLE
-- -------------------------------------------------------
create table if not exists public.expenses (
  id         uuid primary key default uuid_generate_v4(),
  car_id     uuid references public.cars(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  amount     numeric(10,2) not null check (amount > 0),
  category   text not null check (category in ('fuel', 'maintenance', 'repairs', 'other')),
  date       date not null,
  notes      text,
  created_at timestamptz default now() not null
);

-- -------------------------------------------------------
-- REMINDERS TABLE
-- -------------------------------------------------------
create table if not exists public.reminders (
  id               uuid primary key default uuid_generate_v4(),
  car_id           uuid references public.cars(id) on delete cascade not null unique,
  insurance_date   date,
  test_date        date,
  updated_at       timestamptz default now() not null
);

-- -------------------------------------------------------
-- VEHICLE LOOKUPS CACHE TABLE  ← NEW
-- Caches results from data.gov.il to avoid redundant API calls.
-- Records expire after 7 days (handled in application layer).
-- -------------------------------------------------------
create table if not exists public.vehicle_lookups (
  id           uuid primary key default uuid_generate_v4(),
  plate_number text not null unique,          -- cleaned plate, no dashes
  data         jsonb not null,                -- full VehicleData object
  fetched_at   timestamptz default now() not null
);

-- -------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------
alter table public.cars             enable row level security;
alter table public.expenses         enable row level security;
alter table public.reminders        enable row level security;
alter table public.vehicle_lookups  enable row level security;

-- Cars RLS
create policy "Users can manage their own cars"
  on public.cars for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Expenses RLS
create policy "Users can manage their own expenses"
  on public.expenses for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reminders RLS (via car ownership)
create policy "Users can manage reminders for their cars"
  on public.reminders for all
  using (
    exists (
      select 1 from public.cars
      where cars.id = reminders.car_id
        and cars.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.cars
      where cars.id = reminders.car_id
        and cars.user_id = auth.uid()
    )
  );

-- Vehicle Lookups RLS
-- Any authenticated user can read the cache (public vehicle data).
-- Only the server-side API route writes to it (uses service role key).
create policy "Authenticated users can read vehicle lookup cache"
  on public.vehicle_lookups for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert vehicle lookups"
  on public.vehicle_lookups for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update vehicle lookups"
  on public.vehicle_lookups for update
  using (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- -------------------------------------------------------
create index if not exists idx_cars_user_id          on public.cars(user_id);
create index if not exists idx_expenses_car_id       on public.expenses(car_id);
create index if not exists idx_expenses_user_id      on public.expenses(user_id);
create index if not exists idx_expenses_date         on public.expenses(date);
create index if not exists idx_reminders_car_id      on public.reminders(car_id);
create index if not exists idx_vehicle_lookups_plate on public.vehicle_lookups(plate_number);
create index if not exists idx_vehicle_lookups_time  on public.vehicle_lookups(fetched_at);
