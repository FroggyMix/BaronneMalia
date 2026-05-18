-- ============================================================
-- SUPABASE SCHEMA - Baronne Malia
-- ============================================================
-- 1. Créez un projet sur https://supabase.com (gratuit)
-- 2. Allez dans l'éditeur SQL (SQL Editor → New query)
-- 3. Copiez-collez ce script et exécutez-le
-- 4. Trouvez votre URL et clé dans : Project Settings → API
-- ============================================================

-- Activer l'extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
create table if not exists public.profiles (
  id integer primary key default 1,
  name text not null default 'Baronne Malia',
  breed text not null default 'Golden Retriever',
  gender text not null default 'female' check (gender in ('female', 'male')),
  birth_date text not null default '2026-02-02',
  target_adult_weight_kg numeric default 27,
  neutered boolean default false,
  activity_level text not null default 'moderate' check (activity_level in ('sedentary', 'moderate', 'active', 'very_active')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS: n'importe qui peut lire/écrire (auth anonyme)
alter table public.profiles enable row level security;

create policy "Allow all operations on profiles"
  on public.profiles
  for all
  to authenticated, anon
  using (true)
  with check (true);

-- ============================================================
-- TABLE: weight_entries
-- ============================================================
create table if not exists public.weight_entries (
  id uuid primary key default uuid_generate_v4(),
  date text not null,
  weight_kg numeric not null check (weight_kg > 0 and weight_kg < 100),
  body_condition_score integer check (body_condition_score >= 1 and body_condition_score <= 9),
  notes text,
  created_at timestamp with time zone default now()
);

-- Index pour accélérer les requêtes par date
create index if not exists idx_weight_entries_date on public.weight_entries(date);

alter table public.weight_entries enable row level security;

create policy "Allow all operations on weight_entries"
  on public.weight_entries
  for all
  to authenticated, anon
  using (true)
  with check (true);

-- ============================================================
-- TABLE: feeding_entries
-- ============================================================
create table if not exists public.feeding_entries (
  id uuid primary key default uuid_generate_v4(),
  date text not null,
  meals_per_day integer not null check (meals_per_day >= 1 and meals_per_day <= 6),
  quantity_per_meal_grams integer not null check (quantity_per_meal_grams > 0),
  food_type text not null default 'croquettes',
  food_calories_per_100g numeric,
  brand text,
  notes text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_feeding_entries_date on public.feeding_entries(date);

alter table public.feeding_entries enable row level security;

create policy "Allow all operations on feeding_entries"
  on public.feeding_entries
  for all
  to authenticated, anon
  using (true)
  with check (true);

-- ============================================================
-- INSERT DES DONNEES REALES DE MALIA
-- ============================================================
insert into public.weight_entries (date, weight_kg, body_condition_score, notes)
values
  ('2026-04-04', 3.8, 5, '2 mois et 2 jours'),
  ('2026-04-09', 4.4, 5, '2 mois et 7 jours'),
  ('2026-04-13', 4.8, 5, '2 mois et 11 jours'),
  ('2026-04-17', 5.6, 4, '2 mois et 16 jours'),
  ('2026-04-20', 5.8, 4, '2 mois et 18 jours'),
  ('2026-04-24', 6.6, 4, '2 mois et 22 jours'),
  ('2026-04-26', 7.1, 4, '2 mois et 24 jours'),
  ('2026-04-30', 7.8, 4, '2 mois et 28 jours'),
  ('2026-05-02', 8.0, 4, '3 mois'),
  ('2026-05-07', 8.4, 4, '3 mois et 5 jours')
on conflict do nothing;

insert into public.profiles (id, name, breed, gender, birth_date, target_adult_weight_kg, neutered, activity_level)
values (1, 'Baronne Malia', 'Golden Retriever', 'female', '2026-02-02', 27, false, 'moderate')
on conflict (id) do nothing;
