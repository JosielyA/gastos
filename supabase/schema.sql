-- ============================================================================
-- Gastos — Esquema de base de datos (Supabase / Postgres)
-- Ejecuta este archivo en el SQL Editor de tu proyecto Supabase.
-- Es seguro ejecutarlo varias veces (idempotente).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Perfiles
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  role       text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------

-- Indica si el usuario autenticado es administrador (evita recursión en RLS).
-- Se define DESPUÉS de `profiles` porque es una función `language sql` y
-- PostgreSQL valida el cuerpo (la referencia a la tabla) al crearla.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles
  for select using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Categorías (antes del trigger, que inserta categorías por defecto)
-- ----------------------------------------------------------------------------

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  type       text not null default 'expense' check (type in ('income', 'expense')),
  icon       text not null default 'tag',
  color      text not null default '#888888',
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories for select using (auth.uid() = user_id);
drop policy if exists "categories_insert" on public.categories;
create policy "categories_insert" on public.categories for insert with check (auth.uid() = user_id);
drop policy if exists "categories_update" on public.categories;
create policy "categories_update" on public.categories for update using (auth.uid() = user_id);
drop policy if exists "categories_delete" on public.categories;
create policy "categories_delete" on public.categories for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Función disparadora: crea perfil y categorías por defecto al registrarse
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  -- El primer usuario registrado se convierte en administrador.
  select case when not exists (select 1 from public.profiles limit 1)
              then 'admin' else 'user' end
    into v_role;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    v_role
  );

  -- Categorías por defecto
  insert into public.categories (user_id, name, type, icon, color) values
    (new.id, 'Comida',        'expense', 'utensils',    '#f97316'),
    (new.id, 'Transporte',    'expense', 'car',         '#3b82f6'),
    (new.id, 'Servicios',     'expense', 'zap',         '#eab308'),
    (new.id, 'Vivienda',      'expense', 'home',        '#8b5cf6'),
    (new.id, 'Salud',         'expense', 'heart-pulse', '#ef4444'),
    (new.id, 'Ocio',          'expense', 'gamepad-2',   '#ec4899'),
    (new.id, 'Educación',     'expense', 'book-open',   '#06b6d4'),
    (new.id, 'Ropa',          'expense', 'shirt',       '#a855f7'),
    (new.id, 'Otros',         'expense', 'shapes',      '#64748b'),
    (new.id, 'Salario',       'income',  'briefcase',   '#22c55e'),
    (new.id, 'Freelance',     'income',  'laptop',      '#14b8a6'),
    (new.id, 'Ventas',        'income',  'store',       '#84cc16'),
    (new.id, 'Otros ingresos','income',  'coins',       '#10b981');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Cuentas (bancos y billeteras)
-- ----------------------------------------------------------------------------

create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  type            text not null default 'bank' check (type in ('bank', 'wallet')),
  currency        text not null default 'USD' check (currency in ('USD', 'VES')),
  initial_balance double precision not null default 0,
  created_at      timestamptz not null default now()
);

alter table public.accounts enable row level security;

drop policy if exists "accounts_select" on public.accounts;
create policy "accounts_select" on public.accounts for select using (auth.uid() = user_id);
drop policy if exists "accounts_insert" on public.accounts;
create policy "accounts_insert" on public.accounts for insert with check (auth.uid() = user_id);
drop policy if exists "accounts_update" on public.accounts;
create policy "accounts_update" on public.accounts for update using (auth.uid() = user_id);
drop policy if exists "accounts_delete" on public.accounts;
create policy "accounts_delete" on public.accounts for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Movimientos (ingresos y egresos)
-- ----------------------------------------------------------------------------

create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  type          text not null check (type in ('income', 'expense')),
  amount        double precision not null check (amount > 0),
  currency      text not null check (currency in ('USD', 'VES')),
  account_id    uuid references public.accounts (id) on delete set null,
  category_id   uuid references public.categories (id) on delete set null,
  date          date not null default current_date,
  note          text,
  rate_bcv      double precision,
  rate_parallel double precision,
  created_at    timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;

drop policy if exists "transactions_select" on public.transactions;
create policy "transactions_select" on public.transactions for select using (auth.uid() = user_id);
drop policy if exists "transactions_insert" on public.transactions;
create policy "transactions_insert" on public.transactions for insert with check (auth.uid() = user_id);
drop policy if exists "transactions_update" on public.transactions;
create policy "transactions_update" on public.transactions for update using (auth.uid() = user_id);
drop policy if exists "transactions_delete" on public.transactions;
create policy "transactions_delete" on public.transactions for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Deudas
-- ----------------------------------------------------------------------------

create table if not exists public.debts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  description text not null,
  amount      double precision not null default 0 check (amount >= 0),
  currency    text not null default 'USD' check (currency in ('USD', 'VES')),
  due_date    date,
  status      text not null default 'pending' check (status in ('pending', 'partial', 'paid')),
  amount_paid double precision not null default 0 check (amount_paid >= 0),
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.debts enable row level security;

drop policy if exists "debts_select" on public.debts;
create policy "debts_select" on public.debts for select using (auth.uid() = user_id);
drop policy if exists "debts_insert" on public.debts;
create policy "debts_insert" on public.debts for insert with check (auth.uid() = user_id);
drop policy if exists "debts_update" on public.debts;
create policy "debts_update" on public.debts for update using (auth.uid() = user_id);
drop policy if exists "debts_delete" on public.debts;
create policy "debts_delete" on public.debts for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Deseos (wishlist)
-- ----------------------------------------------------------------------------

create table if not exists public.wishes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  price      double precision,
  currency   text check (currency in ('USD', 'VES')),
  priority   text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  goal       double precision,
  link       text,
  status     text not null default 'wishlist' check (status in ('wishlist', 'saving', 'bought')),
  created_at timestamptz not null default now()
);

alter table public.wishes enable row level security;

drop policy if exists "wishes_select" on public.wishes;
create policy "wishes_select" on public.wishes for select using (auth.uid() = user_id);
drop policy if exists "wishes_insert" on public.wishes;
create policy "wishes_insert" on public.wishes for insert with check (auth.uid() = user_id);
drop policy if exists "wishes_update" on public.wishes;
create policy "wishes_update" on public.wishes for update using (auth.uid() = user_id);
drop policy if exists "wishes_delete" on public.wishes;
create policy "wishes_delete" on public.wishes for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Presupuestos por categoría y mes
-- ----------------------------------------------------------------------------

create table if not exists public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete cascade,
  month        text not null, -- formato 'YYYY-MM'
  limit_amount double precision not null default 0 check (limit_amount >= 0),
  currency     text not null default 'USD' check (currency in ('USD', 'VES')),
  created_at   timestamptz not null default now(),
  unique (user_id, category_id, month)
);

alter table public.budgets enable row level security;

drop policy if exists "budgets_select" on public.budgets;
create policy "budgets_select" on public.budgets for select using (auth.uid() = user_id);
drop policy if exists "budgets_insert" on public.budgets;
create policy "budgets_insert" on public.budgets for insert with check (auth.uid() = user_id);
drop policy if exists "budgets_update" on public.budgets;
create policy "budgets_update" on public.budgets for update using (auth.uid() = user_id);
drop policy if exists "budgets_delete" on public.budgets;
create policy "budgets_delete" on public.budgets for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Gastos / ingresos recurrentes
-- ----------------------------------------------------------------------------

create table if not exists public.recurring (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  description text not null,
  amount      double precision not null check (amount > 0),
  currency    text not null default 'USD' check (currency in ('USD', 'VES')),
  type        text not null check (type in ('income', 'expense')),
  account_id  uuid references public.accounts (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  frequency   text not null default 'monthly' check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  next_date   date not null default current_date,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.recurring enable row level security;

drop policy if exists "recurring_select" on public.recurring;
create policy "recurring_select" on public.recurring for select using (auth.uid() = user_id);
drop policy if exists "recurring_insert" on public.recurring;
create policy "recurring_insert" on public.recurring for insert with check (auth.uid() = user_id);
drop policy if exists "recurring_update" on public.recurring;
create policy "recurring_update" on public.recurring for update using (auth.uid() = user_id);
drop policy if exists "recurring_delete" on public.recurring;
create policy "recurring_delete" on public.recurring for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Tasas de cambio (globales, caché de DolarApi)
-- ----------------------------------------------------------------------------

create table if not exists public.exchange_rates (
  id         uuid primary key default gen_random_uuid(),
  source     text not null check (source in ('bcv', 'parallel')),
  value      double precision not null,
  updated_at timestamptz not null default now(),
  unique (source)
);

alter table public.exchange_rates enable row level security;

-- Cualquier usuario autenticado puede leer las tasas; solo el backend (service role) escribe.
drop policy if exists "exchange_rates_select" on public.exchange_rates;
create policy "exchange_rates_select" on public.exchange_rates for select using (true);
