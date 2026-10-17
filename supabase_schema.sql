-- =========================================================================
-- ESQUEMA COMPLETO SQL PARA SUPABASE
-- Proyecto: minifoto@appdesignsoftware.com's Project
-- Project ID: xqggdnoxvskotwlcuwgd
-- URL: https://xqggdnoxvskotwlcuwgd.supabase.co
-- =========================================================================

-- 1. TABLA DE PRODUCTOS Y SERVICIOS (CATÁLOGO MULTINEGOCIO)
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(10,2) not null default 0.00,
  description text,
  unit text default 'pza',
  image_url text,
  is_active boolean default true,
  has_extras boolean default false,
  default_retoque_price numeric(10,2) default 30.00,
  default_autoadherible_price numeric(10,2) default 20.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. TABLA DE VENTAS Y TICKETS DE CAJA
create table if not exists public.sales (
  id text primary key,
  folio text not null,
  date text not null,
  role text not null default 'cashier',
  operator_name text not null,
  client_name text,
  client_phone text,
  school_name text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0.00,
  discount numeric(10,2) not null default 0.00,
  total numeric(10,2) not null default 0.00,
  payment_method text not null default 'efectivo',
  amount_paid numeric(10,2) not null default 0.00,
  change numeric(10,2) not null default 0.00,
  status text not null default 'completado',
  notes text,
  created_at timestamptz default now()
);

-- 3. TABLA DE ALUMNOS Y PAQUETES DE GRADUACIÓN
create table if not exists public.graduation_students (
  id text primary key,
  folio text not null,
  student_name text not null,
  school_id text,
  school_name text not null,
  season_year text default '2026',
  grade_group text,
  package_name text,
  total_photos text,
  total_amount numeric(10,2) not null default 0.00,
  deposit_amount numeric(10,2) not null default 0.00,
  remaining_amount numeric(10,2) not null default 0.00,
  delivery_status text default 'pendiente',
  delivery_date text,
  contact_phone text,
  notes text,
  created_at timestamptz default now()
);

-- 4. TABLA DE ESCUELAS Y CONVENIOS
create table if not exists public.schools (
  id text primary key,
  name text not null,
  season_year text default '2026',
  active boolean default true,
  representative text,
  phone text,
  created_at timestamptz default now()
);

-- HABILITAR SEGURIDAD A NIVEL DE FILA (RLS)
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.graduation_students enable row level security;
alter table public.schools enable row level security;

-- POLÍTICAS DE ACCESO PÚBLICO (ANON) PARA LECTURA Y ESCRITURA
drop policy if exists "Anon full access products" on public.products;
create policy "Anon full access products" on public.products for all using (true) with check (true);

drop policy if exists "Anon full access sales" on public.sales;
create policy "Anon full access sales" on public.sales for all using (true) with check (true);

drop policy if exists "Anon full access students" on public.graduation_students;
create policy "Anon full access students" on public.graduation_students for all using (true) with check (true);

drop policy if exists "Anon full access schools" on public.schools;
create policy "Anon full access schools" on public.schools for all using (true) with check (true);

-- ÍNDICES PARA BÚSQUEDA RÁPIDA
create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_active on public.products (is_active);
create index if not exists idx_sales_created_at on public.sales (created_at desc);
create index if not exists idx_students_school on public.graduation_students (school_id, delivery_status);
