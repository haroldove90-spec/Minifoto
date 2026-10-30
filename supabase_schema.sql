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

-- 1.3 VENTAS Y TICKETS DE CAJA
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

-- 1.5 ALUMNOS Y PAQUETES DE GRADUACIÓN
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

-- 1.7 PERFILES DE USUARIO
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

-- 1.8 TRANSFERENCIAS BANCARIAS SANTANDER
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

-- 1.9 AUDITORÍA
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

-- 1.10 ÓRDENES DE TRABAJO (LABORATORIO & IMPRESIÓN)
CREATE TABLE IF NOT EXISTS public.work_orders (
  id TEXT PRIMARY KEY,
  sale_id TEXT,
  folio TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  school_name TEXT,
  date TEXT NOT NULL,
  delivery_date TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  deposit_amount NUMERIC(10,2) DEFAULT 0.00,
  remaining_amount NUMERIC(10,2) DEFAULT 0.00,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  lab_status TEXT NOT NULL DEFAULT 'pendiente',
  urgency TEXT DEFAULT 'normal',
  notes TEXT,
  photo_specs JSONB DEFAULT '{}'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  operator_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.11 FOTOGRAFÍAS DE CLIENTES
CREATE TABLE IF NOT EXISTS public.client_photos (
  id TEXT PRIMARY KEY,
  client_folio TEXT NOT NULL,
  url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- PASO 2: MIGRACIÓN AUTOMÁTICA DE COLUMNAS (TABLAS EXISTENTES)
-- =========================================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_extras BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_retoque_price NUMERIC(10,2) DEFAULT 30.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_autoadherible_price NUMERIC(10,2) DEFAULT 20.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pza';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS photo_specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completado';

-- =========================================================================
-- PASO 3: POLÍTICAS DE ACCESO TOTAL (RLS ANÓNIMO)
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
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_photos ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Anon full access work_orders" ON public.work_orders;
CREATE POLICY "Anon full access work_orders" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access client_photos" ON public.client_photos;
CREATE POLICY "Anon full access client_photos" ON public.client_photos FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- PASO 4: ÍNDICES DE RENDIMIENTO
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_sales_folio ON public.sales (folio);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_orders_folio ON public.work_orders (folio);
CREATE INDEX IF NOT EXISTS idx_client_photos_folio ON public.client_photos (client_folio);

-- =========================================================================
-- PASO 5: POBLAR CATEGORÍAS Y FOLIOS
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

-- =========================================================================
-- PASO 6: POBLAR O ACTUALIZAR LOS 42 PRODUCTOS Y SERVICIOS
-- =========================================================================
INSERT INTO public.products (id, name, category, price, description, unit, is_active, has_extras, default_retoque_price, default_autoadherible_price, display_order)
VALUES
  -- 1. FOTO ESTUDIO & ESPECIALES
  ('car-1', 'Caritas', 'foto_estudio', 100.00, 'Fotografía Caritas Tamaño: 16 x 20. Opciones y ticket', 'pza', true, true, 30.00, 20.00, 1),
  ('cf-1', 'Cambios de Fondo', 'foto_estudio', 120.00, 'Servicio de cambio de fondo, vestimenta y texto personalizado (8x10 a 16x24)', 'pza', true, true, 30.00, 20.00, 2),
  ('fe-1', 'Foto Infantil (x6 pzas)', 'foto_estudio', 110.00, 'Fotografía infantil b/n o color con papel mate', 'pza', true, true, 30.00, 20.00, 3),
  ('fe-2', 'Foto Óvalos (x4 pzas)', 'foto_estudio', 140.00, 'Tamaño mignon u óvalo institucional', 'pza', true, true, 30.00, 20.00, 4),
  ('fe-3', 'Foto Diploma (x4 pzas)', 'foto_estudio', 150.00, 'Formato oficial para certificado o diploma', 'pza', true, true, 30.00, 20.00, 5),
  ('fe-4', 'Foto Título Profesional (x6 pzas)', 'foto_estudio', 220.00, 'Papel mate 6x9cm, retoque digital fino', 'pza', true, true, 30.00, 20.00, 6),
  ('fe-5', 'Foto Cartilla Militar (x4 pzas)', 'foto_estudio', 120.00, 'Fondo blanco mate sin brillo reglamentaria', 'pza', true, true, 30.00, 20.00, 7),
  ('fe-6', 'Foto Pasaporte Mexicano (x4 pzas)', 'foto_estudio', 130.00, 'Medidas oficiales Secretaría de Relaciones Exteriores', 'pza', true, true, 30.00, 20.00, 8),
  ('fe-7', 'Foto Visa Americana / Internacional (x2 pzas)', 'foto_estudio', 140.00, 'Fondo 100% blanco 2x2 pulgadas 5x5cm', 'pza', true, true, 30.00, 20.00, 9),

  -- 2. AMPLIACIONES
  ('amp-selector', 'Ampliaciones', 'ampliaciones', 85.00, 'Seleccionar formato del menor al mayor (8x10 a 16x24)', 'pza', true, true, 30.00, 20.00, 10),
  ('amp-1', 'Ampliación 4x6"', 'ampliaciones', 25.00, 'Ampliación fotográfica profesional 4x6 pulgadas', 'pza', true, false, 0.00, 0.00, 11),
  ('amp-2', 'Ampliación 6x8.5"', 'ampliaciones', 55.00, 'Ampliación fotográfica profesional 6x8.5 pulgadas', 'pza', true, false, 0.00, 0.00, 12),
  ('amp-3', 'Ampliación 8x10"', 'ampliaciones', 85.00, 'Ampliación fotográfica profesional 8x10 pulgadas', 'pza', true, true, 30.00, 20.00, 13),
  ('amp-4', 'Ampliación 8x12"', 'ampliaciones', 110.00, 'Ampliación fotográfica profesional 8x12 pulgadas', 'pza', true, true, 30.00, 20.00, 14),
  ('amp-5', 'Ampliación 11x14"', 'ampliaciones', 180.00, 'Ampliación fotográfica profesional 11x14 pulgadas', 'pza', true, true, 30.00, 20.00, 15),
  ('amp-11x16', 'Ampliación 11x16"', 'ampliaciones', 210.00, 'Formato oficial de ampliación fotográfica 11x16 pulgadas', 'pza', true, true, 30.00, 20.00, 16),
  ('amp-6', 'Ampliación 12x18"', 'ampliaciones', 260.00, 'Ampliación fotográfica profesional 12x18 pulgadas', 'pza', true, true, 30.00, 20.00, 17),
  ('amp-7', 'Ampliación 16x20"', 'ampliaciones', 390.00, 'Ampliación fotográfica profesional 16x20 pulgadas', 'pza', true, true, 30.00, 20.00, 18),
  ('amp-8', 'Ampliación 16x24"', 'ampliaciones', 480.00, 'Ampliación fotográfica profesional 16x24 pulgadas', 'pza', true, true, 30.00, 20.00, 19),

  -- 3. MINILAB
  ('mini-1', 'Minilab 4x6" Estándar', 'minilab', 15.00, 'Impresión fotográfica en papel químico brillante o mate 4x6"', 'pza', true, false, 0.00, 0.00, 20),
  ('mini-2', 'Minilab 6x8"', 'minilab', 35.00, 'Impresión minilab tamaño 6x8"', 'pza', true, false, 0.00, 0.00, 21),
  ('mini-3', 'Minilab 6x8.5"', 'minilab', 40.00, 'Impresión minilab tamaño 6x8.5"', 'pza', true, false, 0.00, 0.00, 22),
  ('mini-4', 'Minilab 6x9"', 'minilab', 45.00, 'Impresión minilab tamaño 6x9"', 'pza', true, false, 0.00, 0.00, 23),
  ('mini-5', 'Minilab 6x12" Panorámica', 'minilab', 65.00, 'Impresión fotográfica formato panorámico 6x12"', 'pza', true, false, 0.00, 0.00, 24),
  ('mini-6', 'Minilab 8x10"', 'minilab', 75.00, 'Impresión minilab tamaño 8x10"', 'pza', true, false, 0.00, 0.00, 25),
  ('mini-7', 'Minilab 8x12"', 'minilab', 95.00, 'Impresión minilab tamaño 8x12"', 'pza', true, false, 0.00, 0.00, 26),
  ('mini-8', 'Minilab 11x14"', 'minilab', 150.00, 'Impresión minilab tamaño 11x14"', 'pza', true, false, 0.00, 0.00, 27),
  ('mini-9', 'Minilab 12x18"', 'minilab', 220.00, 'Impresión minilab tamaño 12x18"', 'pza', true, false, 0.00, 0.00, 28),

  -- 4. FOTOACABADO
  ('fac-1', 'Acabado Autoadherible', 'fotoacabado', 25.00, 'Película adhesiva para fácil montaje en cualquier superficie', 'pza', true, false, 0.00, 0.00, 29),
  ('fac-2', 'Acabado Textura Lino/Mate', 'fotoacabado', 45.00, 'Laminado texturizado mate o lino anti-reflejo', 'pza', true, false, 0.00, 0.00, 30),
  ('fac-3', 'Montado en Macocel', 'fotoacabado', 95.00, 'Montaje rígido sobre madera macocel con sellador', 'pza', true, false, 0.00, 0.00, 31),
  ('fac-4', 'Cuadros Poliestireno / Madera', 'fotoacabado', 250.00, 'Enmarcado elegante en moldura ligera poliestireno o madera', 'pza', true, false, 0.00, 0.00, 32),
  ('fac-5', 'Llaveros Acrílico Personalizado', 'fotoacabado', 35.00, 'Llavero acrílico transparente doble vista con fotografía', 'pza', true, false, 0.00, 0.00, 33),

  -- 5. IGLESIAS / EVENTOS
  ('ig-1', 'Cobertura Bautizo', 'iglesias', 1200.00, 'Templo + fotos familiares + sesión previa', 'evento', true, false, 0.00, 0.00, 34),
  ('ig-2', 'Paquete Bodas Religioso', 'iglesias', 4500.00, 'Misa completa, sesión nupcial y entregables impresos', 'evento', true, false, 0.00, 0.00, 35),
  ('ig-3', 'Sesión XV Años Templo', 'iglesias', 2800.00, 'Ceremonia de acción de gracias + fotos familiares', 'evento', true, false, 0.00, 0.00, 36),
  ('ig-4', 'Primera Comunión', 'iglesias', 950.00, 'Fotos en altar, vela, biblia y entrega digital e impresa', 'evento', true, false, 0.00, 0.00, 37),
  ('ig-5', 'Confirmación', 'iglesias', 850.00, 'Cobertura solemne individual y con padrinos', 'evento', true, false, 0.00, 0.00, 38),
  ('ig-6', 'Presentación al Templo (3 Años)', 'iglesias', 900.00, 'Sesión de bendición y fotos familiares', 'evento', true, false, 0.00, 0.00, 39),

  -- 6. GRADUACIONES 2026
  ('grad-1', 'Paquete Graduación Básico 2026 (6 Fotos + Carpeta)', 'graduaciones', 450.00, 'Foto panorámica de grupo + 4 fotos individuales + carpeta conmemorativa', 'paquete', true, false, 0.00, 0.00, 40),
  ('grad-2', 'Paquete Graduación Deluxe 2026 (10 Fotos + Cuadro)', 'graduaciones', 750.00, 'Foto grupal, fotos de diploma, fotos con toga, medalla y cuadro montado', 'paquete', true, false, 0.00, 0.00, 41),
  ('grad-3', 'Foto Grupal Panorámica Escolar 2026', 'graduaciones', 200.00, 'Ampliación 8x12 con nombres impresos de generación', 'pza', true, false, 0.00, 0.00, 42),

  -- 7. SALÓN SIX PARTY
  ('six-1', 'Renta de Mesas (10 comensales)', 'salon_seis_party', 120.00, 'Mesa redonda o rectangular para 10 personas con mantel', 'pza', true, false, 0.00, 0.00, 43),
  ('six-2', 'Renta de Sillas Acojinadas', 'salon_seis_party', 15.00, 'Silla plegable o tiffany acojinada', 'pza', true, false, 0.00, 0.00, 44),
  ('six-3', 'Sistema de Sonido & DJ', 'salon_seis_party', 1800.00, 'Audio profesional, micrófonos y DJ amenizador 5 horas', 'evento', true, false, 0.00, 0.00, 45),
  ('six-4', 'Pista de Baile Iluminada', 'salon_seis_party', 2200.00, 'Módulos LED de cristal templado multicolor', 'evento', true, false, 0.00, 0.00, 46),
  ('six-5', 'Pantalla Gigante & Proyector', 'salon_seis_party', 800.00, 'Pantalla de proyección para video semblanza', 'evento', true, false, 0.00, 0.00, 47),
  ('six-6', 'Decoración Temática', 'salon_seis_party', 1500.00, 'Arco de globos, backdrops y telas temáticas', 'servicio', true, false, 0.00, 0.00, 48),
  ('six-7', 'Arreglos Florales / Centros de Mesa', 'salon_seis_party', 180.00, 'Arreglos con flores naturales de temporada', 'pza', true, false, 0.00, 0.00, 49),
  ('six-8', 'Vajilla y Cristalería (Juego)', 'salon_seis_party', 25.00, 'Plato base, plato extendido, cubiertos y copa', 'juego', true, false, 0.00, 0.00, 50),
  ('six-9', 'Paquete de Fotos Especial Salón', 'salon_seis_party', 3200.00, 'Cobertura completa de fiesta de 5 horas + photobook digital', 'paquete', true, false, 0.00, 0.00, 51),

  -- 8. FUENTE DE SODAS
  ('sod-1', 'Aguas Frescas Naturales', 'fuente_sodas', 25.00, 'Horchata, jamaica, limón o frutas frescas 500ml', 'pza', true, false, 0.00, 0.00, 52),
  ('sod-2', 'Refresco Embotellado 600ml', 'fuente_sodas', 22.00, 'Variedad de sabores y marcas en presentación 600ml', 'pza', true, false, 0.00, 0.00, 53),
  ('sod-3', 'Palomitas de Maíz (Bolsa)', 'fuente_sodas', 30.00, 'Palomitas calientes con mantequilla o sal natural', 'pza', true, false, 0.00, 0.00, 54),
  ('sod-4', 'Sandwich Especial', 'fuente_sodas', 45.00, 'Jamón, queso, verduras frescas y aderezos', 'pza', true, false, 0.00, 0.00, 55),
  ('sod-5', 'Pambazos Caseros', 'fuente_sodas', 50.00, 'Rellenos de papa con chorizo, lechuga, queso y crema', 'pza', true, false, 0.00, 0.00, 56),
  ('sod-6', 'Dulces, Botanas y Snacks', 'fuente_sodas', 18.00, 'Papas, cacahuates, chocolates y golosinas surtidas', 'pza', true, false, 0.00, 0.00, 57)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  is_active = EXCLUDED.is_active,
  has_extras = EXCLUDED.has_extras,
  default_retoque_price = EXCLUDED.default_retoque_price,
  default_autoadherible_price = EXCLUDED.default_autoadherible_price;

-- =========================================================================
-- PASO 7: POBLAR USUARIOS INICIALES (MULTI-ROL CON IMPRESOR)
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
-- PASO 8: STORAGE BUCKETS
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO NOTHING;
