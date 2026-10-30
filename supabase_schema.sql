-- =========================================================================
-- ESQUEMA COMPLETO Y MIGRACIÓN AUTOMÁTICA PARA SUPABASE (IDEMPOTENTE Y SEGURO)
-- Proyecto: Minifoto POS
-- Project ID: xqggdnoxvskotwlcuwgd
-- =========================================================================

-- =========================================================================
-- PASO 1: CREAR TABLAS (SI NO EXISTEN)
-- =========================================================================

-- 1.1 CATÁLOGO DE PRODUCTOS Y SERVICIOS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  description TEXT,
  unit TEXT DEFAULT 'pza',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  has_extras BOOLEAN DEFAULT FALSE,
  default_retoque_price NUMERIC(10,2) DEFAULT 30.00,
  default_autoadherible_price NUMERIC(10,2) DEFAULT 20.00,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 CATEGORÍAS DINÁMICAS DEL CATÁLOGO
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 VENTAS Y TICKETS DE CAJA (CON FOTO ESTUDIO Y ESCÁNER)
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  folio TEXT NOT NULL,
  date TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier',
  operator_name TEXT NOT NULL,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  school_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  change NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  deposit_amount NUMERIC(10,2) DEFAULT 0.00,
  remaining_amount NUMERIC(10,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'completado',
  notes TEXT,
  photo_specs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 CONFIGURACIÓN DE FOLIOS PERSONALIZADOS (ADMIN)
CREATE TABLE IF NOT EXISTS public.folio_config (
  id TEXT PRIMARY KEY,
  prefix TEXT NOT NULL DEFAULT 'TK-',
  next_number INTEGER NOT NULL DEFAULT 1001,
  padding INTEGER NOT NULL DEFAULT 6,
  suffix TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 ALUMNOS Y PAQUETES DE GRADUACIÓN (CON CONCILIACIÓN SANTANDER)
CREATE TABLE IF NOT EXISTS public.graduation_students (
  id TEXT PRIMARY KEY,
  folio TEXT NOT NULL,
  student_name TEXT NOT NULL,
  school_id TEXT,
  school_name TEXT NOT NULL,
  season_year TEXT DEFAULT '2026',
  grade_group TEXT,
  grade TEXT,
  group_name TEXT,
  matricula TEXT,
  tutor_name TEXT,
  tutor_whatsapp TEXT,
  tutor_phone TEXT,
  consent_whatsapp BOOLEAN DEFAULT TRUE,
  package_name TEXT,
  total_photos TEXT,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  remaining_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  santander_reference TEXT,
  delivery_status TEXT DEFAULT 'pendiente',
  delivery_date TEXT,
  next_due_date TEXT,
  next_due_amount NUMERIC(10,2) DEFAULT 0.00,
  payment_history JSONB DEFAULT '[]'::jsonb,
  whatsapp_logs JSONB DEFAULT '[]'::jsonb,
  contact_phone TEXT,
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 ESCUELAS Y CONVENIOS
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  season_year TEXT DEFAULT '2026',
  active BOOLEAN DEFAULT TRUE,
  representative TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 PERFILES DE USUARIO (MULTI-ROL)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  notes TEXT,
  address TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 REGISTROS DE TRANSFERENCIAS BANCARIAS SANTANDER
CREATE TABLE IF NOT EXISTS public.bank_transfers (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  student_id TEXT,
  student_name TEXT,
  school_name TEXT,
  santander_reference TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pendiente',
  terminal_id TEXT,
  operator_name TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,
  bank_transaction_folio TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 LOGS DE AUDITORÍA
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT,
  role TEXT,
  terminal_id TEXT,
  action TEXT,
  details TEXT,
  student_folio TEXT
);

-- =========================================================================
-- PASO 2: MIGRACIÓN AUTOMÁTICA DE COLUMNAS (AGREGA CAMPOS A TABLAS PREVIAS)
-- Evita el error "column does not exist" si la tabla ya existía anteriormente
-- =========================================================================

-- Columnas en graduation_students (¡Soluciona santander_reference y anexos!)
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS santander_reference TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS package_name TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS total_photos TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS matricula TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS grade_group TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS tutor_name TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS tutor_whatsapp TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS tutor_phone TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS consent_whatsapp BOOLEAN DEFAULT TRUE;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS next_due_date TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS next_due_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS whatsapp_logs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pendiente';
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS delivery_date TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.graduation_students ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Columnas en sales (Datos de cliente, foto estudio y escáner)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS photo_specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completado';

-- Columnas en products (Extras, precios y orden)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_extras BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_retoque_price NUMERIC(10,2) DEFAULT 30.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_autoadherible_price NUMERIC(10,2) DEFAULT 20.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pza';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================================
-- PASO 3: HABILITAR SEGURIDAD A NIVEL DE FILA (RLS)
-- =========================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduation_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- PASO 4: POLÍTICAS DE ACCESO TOTAL (ANON) PARA LECTURA Y ESCRITURA
-- =========================================================================
DROP POLICY IF EXISTS "Anon full access products" ON public.products;
CREATE POLICY "Anon full access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access categories" ON public.categories;
CREATE POLICY "Anon full access categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access sales" ON public.sales;
CREATE POLICY "Anon full access sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access folio_config" ON public.folio_config;
CREATE POLICY "Anon full access folio_config" ON public.folio_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access students" ON public.graduation_students;
CREATE POLICY "Anon full access students" ON public.graduation_students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access schools" ON public.schools;
CREATE POLICY "Anon full access schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access user_profiles" ON public.user_profiles;
CREATE POLICY "Anon full access user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access bank_transfers" ON public.bank_transfers;
CREATE POLICY "Anon full access bank_transfers" ON public.bank_transfers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access audit_logs" ON public.audit_logs;
CREATE POLICY "Anon full access audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- PASO 5: ÍNDICES DE ALTO RENDIMIENTO (AHORA CON COLUMNAS ASEGURADAS)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_order ON public.products (display_order);

CREATE INDEX IF NOT EXISTS idx_sales_folio ON public.sales (folio);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales (date);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_client_phone ON public.sales (client_phone);

CREATE INDEX IF NOT EXISTS idx_students_folio ON public.graduation_students (folio);
CREATE INDEX IF NOT EXISTS idx_students_santander ON public.graduation_students (santander_reference);
CREATE INDEX IF NOT EXISTS idx_students_school ON public.graduation_students (school_id, delivery_status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles (role);

-- =========================================================================
-- PASO 6: POBLAR CATEGORÍAS INICIALES Y CONFIGURACIÓN DE FOLIO
-- =========================================================================
INSERT INTO public.categories (id, label, icon, color) VALUES
  ('foto_estudio', 'Foto Estudio', 'Camera', 'text-yellow-600'),
  ('ampliaciones', 'Ampliaciones', 'Maximize2', 'text-lime-600'),
  ('minilab', 'Minilab', 'Film', 'text-yellow-500'),
  ('iglesias', 'Iglesias / Eventos', 'Church', 'text-amber-600'),
  ('fotoacabado', 'Fotoacabado', 'Sparkles', 'text-lime-500'),
  ('salon_seis_party', 'Salón Six Party', 'PartyPopper', 'text-emerald-600'),
  ('fuente_sodas', 'Fuente de Sodas / Cafetería', 'Coffee', 'text-orange-600'),
  ('graduaciones', 'Graduaciones 2026', 'GraduationCap', 'text-teal-600')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

INSERT INTO public.folio_config (id, prefix, next_number, padding, suffix)
VALUES ('default', 'TK-', 1001, 6, '')
ON CONFLICT (id) DO NOTHING;

-- POBLAR O ACTUALIZAR PRODUCTOS PRINCIPALES CON FORMULARIOS ACTIVOS (CARITAS, FOTO ESTUDIO, AMPLIACIONES, CAMBIOS DE FONDO)
INSERT INTO public.products (id, name, category, price, description, unit, is_active, has_extras, default_retoque_price, default_autoadherible_price, display_order)
VALUES
  ('car-1', 'Caritas', 'foto_estudio', 100.00, 'Fotografía Caritas Tamaño: 16 x 20. Opciones y ticket', 'pza', true, true, 30.00, 20.00, 1),
  ('cf-1', 'Cambios de Fondo', 'foto_estudio', 120.00, 'Servicio de cambio de fondo, vestimenta y texto personalizado (8x10 a 16x24)', 'pza', true, true, 30.00, 20.00, 2),
  ('amp-selector', 'Ampliaciones', 'ampliaciones', 85.00, 'Seleccionar formato del menor al mayor (8x10 a 16x24)', 'pza', true, true, 30.00, 20.00, 3),
  ('amp-11x16', 'Ampliación 11x16"', 'ampliaciones', 210.00, 'Formato oficial de ampliación fotográfica 11x16 pulgadas', 'pza', true, true, 30.00, 20.00, 4),
  ('fe-1', 'Foto Infantil (x6 pzas)', 'foto_estudio', 110.00, 'Fotografía infantil b/n o color con papel mate', 'pza', true, true, 30.00, 20.00, 5),
  ('fe-2', 'Foto Óvalos (x4 pzas)', 'foto_estudio', 140.00, 'Tamaño mignon u óvalo institucional', 'pza', true, true, 30.00, 20.00, 6),
  ('fe-3', 'Foto Diploma (x4 pzas)', 'foto_estudio', 150.00, 'Formato oficial para certificado o diploma', 'pza', true, true, 30.00, 20.00, 7),
  ('fe-4', 'Foto Título Profesional (x6 pzas)', 'foto_estudio', 220.00, 'Papel mate 6x9cm, retoque digital fino', 'pza', true, true, 30.00, 20.00, 8),
  ('fe-5', 'Foto Cartilla Militar (x4 pzas)', 'foto_estudio', 120.00, 'Fondo blanco mate sin brillo reglamentaria', 'pza', true, true, 30.00, 20.00, 9),
  ('fe-6', 'Foto Pasaporte Mexicano (x4 pzas)', 'foto_estudio', 130.00, 'Medidas oficiales Secretaría de Relaciones Exteriores', 'pza', true, true, 30.00, 20.00, 10),
  ('fe-7', 'Foto Visa Americana / Internacional (x2 pzas)', 'foto_estudio', 140.00, 'Fondo 100% blanco 2x2 pulgadas 5x5cm', 'pza', true, true, 30.00, 20.00, 11)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  has_extras = EXCLUDED.has_extras,
  default_retoque_price = EXCLUDED.default_retoque_price,
  default_autoadherible_price = EXCLUDED.default_autoadherible_price;

-- =========================================================================
-- PASO 7: POBLAR PERFILES DE USUARIO INICIALES (MULTI-ROL CON IMPRESOR)
-- =========================================================================
INSERT INTO public.user_profiles (id, role, name, email, phone, notes)
VALUES
  ('usr-admin', 'admin', 'Administrador Principal', 'admin@minifoto.com', '+52 55 1234 5678', 'Acceso total y configuración'),
  ('usr-cashier', 'cashier', 'Cajero Minifoto', 'caja@minifoto.com', '+52 55 8765 4321', 'Cobro POS y registro'),
  ('usr-field', 'field', 'Fotógrafo en Campo', 'campo@minifoto.com', '+52 55 9999 8888', 'Sesiones escolares'),
  ('usr-client', 'client', 'Portal Cliente / Alumno', 'cliente@minifoto.com', '', 'Consulta de paquetes'),
  ('usr-lab', 'laboratorio', 'Técnico de Laboratorio', 'lab@minifoto.com', '+52 55 4444 3333', 'Órdenes de revelado y edición'),
  ('usr-impresor', 'impresor', 'Operador Impresor', 'impresion@minifoto.com', '+52 55 5555 2222', 'Órdenes de trabajo, escáner e impresión')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  notes = EXCLUDED.notes;

-- =========================================================================
-- PASO 8: BUCKET DE SUPABASE STORAGE PARA FOTOGRAFÍAS DE CLIENTES
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket client-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access to client-photos'
  ) THEN
    CREATE POLICY "Public Access to client-photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'client-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow Upload to client-photos'
  ) THEN
    CREATE POLICY "Allow Upload to client-photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'client-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow Delete to client-photos'
  ) THEN
    CREATE POLICY "Allow Delete to client-photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'client-photos');
  END IF;
END $$;
