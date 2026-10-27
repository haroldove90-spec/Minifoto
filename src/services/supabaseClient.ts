import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Sale, GraduationStudent, School } from '../types';

export const SUPABASE_CONFIG_DATA = {
  projectName: "minifoto@appdesignsoftware.com's Project",
  projectId: 'xqggdnoxvskotwlcuwgd',
  url: 'https://xqggdnoxvskotwlcuwgd.supabase.co',
  restUrl: 'https://xqggdnoxvskotwlcuwgd.supabase.co/rest/v1/',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZ2dkbm94dnNrb3R3bGN1d2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMDAyMTQsImV4cCI6MjEwNzc3NjIxNH0.c3ZAbpDk7KXnpROcsfFhoXclJ3EJAatODillp6F12YY',
};

// Complete SQL Schema Script for the user to run in Supabase SQL Editor
export const COMPLETE_SUPABASE_SQL = `-- =========================================================================
-- ESQUEMA COMPLETO Y MIGRACIÓN AUTOMÁTICA PARA SUPABASE (IDEMPOTENTE Y SEGURO)
-- Proyecto: Minifoto POS
-- Project ID: xqggdnoxvskotwlcuwgd
-- =========================================================================

-- 1. TABLA DE PRODUCTOS Y SERVICIOS (CATÁLOGO MULTINEGOCIO)
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

-- 2. CATEGORÍAS DINÁMICAS DEL CATÁLOGO
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE VENTAS Y TICKETS DE CAJA
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

-- 4. CONFIGURACIÓN DE FOLIOS PERSONALIZADOS (ROL ADMIN)
CREATE TABLE IF NOT EXISTS public.folio_config (
  id TEXT PRIMARY KEY,
  prefix TEXT NOT NULL DEFAULT 'TK-',
  next_number INTEGER NOT NULL DEFAULT 1001,
  padding INTEGER NOT NULL DEFAULT 6,
  suffix TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE ALUMNOS Y PAQUETES DE GRADUACIÓN
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

-- 6. TABLA DE ESCUELAS Y CONVENIOS
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  season_year TEXT DEFAULT '2026',
  active BOOLEAN DEFAULT TRUE,
  representative TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE PERFILES DE USUARIO (MULTI-ROL)
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

-- 8. TRANSFERENCIAS BANCARIAS SANTANDER
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

-- 9. LOGS DE AUDITORÍA
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
-- MIGRACIÓN AUTOMÁTICA DE COLUMNAS (AGREGA CAMPOS A TABLAS PREVIAS)
-- =========================================================================
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

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS photo_specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completado';

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_extras BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_retoque_price NUMERIC(10,2) DEFAULT 30.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_autoadherible_price NUMERIC(10,2) DEFAULT 20.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pza';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- HABILITAR SEGURIDAD A NIVEL DE FILA (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduation_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACCESO TOTAL (ANON) PARA LECTURA Y ESCRITURA
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

-- ÍNDICES DE ALTO RENDIMIENTO (CON COLUMNAS ASEGURADAS)
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

-- POBLAR CATEGORÍAS INICIALES Y FOLIO
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
`;

// Helper to sanitize URL
const getCleanUrl = (rawUrl?: string): string => {
  const url = rawUrl || SUPABASE_CONFIG_DATA.url;
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (customUrl?: string, customKey?: string): SupabaseClient => {
  const url = getCleanUrl(customUrl || SUPABASE_CONFIG_DATA.url);
  const key = customKey || SUPABASE_CONFIG_DATA.anonKey;

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseInstance;
};

// Test connection
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string; tablesExist: boolean }> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error, status } = await supabase.from('products').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return {
          success: true,
          tablesExist: false,
          message: 'Conexión a Supabase exitosa, pero las tablas aún no se han creado. Por favor ejecuta el script SQL en el Editor SQL de Supabase.',
        };
      }
      return {
        success: false,
        tablesExist: false,
        message: `Error al conectar: ${error.message} (Código ${error.code})`,
      };
    }

    return {
      success: true,
      tablesExist: true,
      message: `¡Conexión y tablas verificadas en Supabase! (${status === 200 ? 'Tabla products activa' : 'OK'})`,
    };
  } catch (err: any) {
    return {
      success: false,
      tablesExist: false,
      message: `Fallo de red al conectar con Supabase: ${err.message || 'Error desconocido'}`,
    };
  }
};

// Save a single product
export const saveProductToSupabase = async (product: Product): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const payload = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description || null,
      unit: product.unit || 'pza',
      image_url: product.imageUrl || null,
      is_active: product.isActive !== false,
      has_extras: !!product.hasExtras,
      default_retoque_price: product.defaultRetoquePrice || 30,
      default_autoadherible_price: product.defaultAutoAdheriblePrice || 20,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase product upsert warning:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Error saving product to Supabase:', e);
    return false;
  }
};

// Batch save products to Supabase
export const saveProductsBatchToSupabase = async (products: Product[]): Promise<{ savedCount: number; error?: string }> => {
  try {
    const supabase = getSupabaseClient();
    const rows = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description || null,
      unit: product.unit || 'pza',
      image_url: product.imageUrl || null,
      is_active: product.isActive !== false,
      has_extras: !!product.hasExtras,
      default_retoque_price: product.defaultRetoquePrice || 30,
      default_autoadherible_price: product.defaultAutoAdheriblePrice || 20,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' });
    if (error) {
      return { savedCount: 0, error: error.message };
    }
    return { savedCount: rows.length };
  } catch (e: any) {
    return { savedCount: 0, error: e.message || 'Error de red' };
  }
};

// Fetch products from Supabase
export const fetchProductsFromSupabase = async (): Promise<Product[] | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      description: row.description || undefined,
      unit: row.unit || undefined,
      imageUrl: row.image_url || undefined,
      isActive: row.is_active !== false,
      hasExtras: !!row.has_extras,
      defaultRetoquePrice: row.default_retoque_price ? Number(row.default_retoque_price) : undefined,
      defaultAutoAdheriblePrice: row.default_autoadherible_price ? Number(row.default_autoadherible_price) : undefined,
    }));
  } catch {
    return null;
  }
};

// Save a sale to Supabase
export const saveSaleToSupabase = async (sale: Sale): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const payload = {
      id: sale.id,
      folio: sale.folio,
      date: sale.date,
      role: sale.role,
      operator_name: sale.operatorName,
      client_name: sale.clientName || null,
      client_phone: sale.clientPhone || null,
      client_email: sale.clientEmail || null,
      school_name: sale.schoolName || null,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      payment_method: sale.paymentMethod,
      amount_paid: sale.amountPaid,
      change: sale.change,
      deposit_amount: sale.depositAmount || 0,
      remaining_amount: sale.remainingAmount || 0,
      status: sale.status,
      notes: sale.notes || null,
      photo_specs: sale.photoSpecs || {},
    };

    const { error } = await supabase.from('sales').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase sale upsert warning:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Error saving sale to Supabase:', e);
    return false;
  }
};

// Save student to Supabase
export const saveStudentToSupabase = async (student: GraduationStudent): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const payload = {
      id: student.id,
      folio: student.folio,
      student_name: student.studentName,
      school_id: student.schoolId || null,
      school_name: student.schoolName,
      season_year: student.seasonYear || '2026',
      grade_group: student.gradeGroup || null,
      package_name: student.packageName || null,
      total_photos: String(student.totalPhotos || ''),
      total_amount: student.totalAmount,
      deposit_amount: student.depositAmount,
      remaining_amount: student.remainingAmount,
      delivery_status: student.deliveryStatus,
      delivery_date: student.deliveryDate || null,
      contact_phone: student.contactPhone || null,
      notes: student.notes || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('graduation_students').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase student upsert warning:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Error saving student to Supabase:', e);
    return false;
  }
};

// Save school to Supabase
export const saveSchoolToSupabase = async (school: School): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const payload = {
      id: school.id,
      name: school.name,
      season_year: school.seasonYear,
      active: school.active,
      representative: school.representative || null,
      phone: school.phone || null,
    };

    const { error } = await supabase.from('schools').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase school upsert warning:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Error saving school to Supabase:', e);
    return false;
  }
};

// Batch save schools
export const saveSchoolsBatchToSupabase = async (schools: School[]): Promise<{ savedCount: number; error?: string }> => {
  try {
    const supabase = getSupabaseClient();
    const rows = schools.map((s) => ({
      id: s.id,
      name: s.name,
      season_year: s.seasonYear,
      active: s.active,
      representative: s.representative || null,
      phone: s.phone || null,
    }));
    const { error } = await supabase.from('schools').upsert(rows, { onConflict: 'id' });
    if (error) return { savedCount: 0, error: error.message };
    return { savedCount: rows.length };
  } catch (e: any) {
    return { savedCount: 0, error: e.message || 'Error de red' };
  }
};

// Batch save students
export const saveStudentsBatchToSupabase = async (students: GraduationStudent[]): Promise<{ savedCount: number; error?: string }> => {
  try {
    const supabase = getSupabaseClient();
    const rows = students.map((std) => ({
      id: std.id,
      folio: std.folio,
      student_name: std.studentName,
      school_id: std.schoolId || null,
      school_name: std.schoolName,
      season_year: std.seasonYear || '2026',
      grade_group: std.gradeGroup || null,
      package_name: std.packageName || null,
      total_photos: String(std.totalPhotos || ''),
      total_amount: std.totalAmount,
      deposit_amount: std.depositAmount,
      remaining_amount: std.remainingAmount,
      delivery_status: std.deliveryStatus,
      delivery_date: std.deliveryDate || null,
      contact_phone: std.contactPhone || null,
      notes: std.notes || null,
      created_at: std.createdAt || new Date().toISOString(),
    }));
    const { error } = await supabase.from('graduation_students').upsert(rows, { onConflict: 'id' });
    if (error) return { savedCount: 0, error: error.message };
    return { savedCount: rows.length };
  } catch (e: any) {
    return { savedCount: 0, error: e.message || 'Error de red' };
  }
};

// Fetch sales from Supabase
export const fetchSalesFromSupabase = async (): Promise<Sale[] | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      folio: row.folio,
      date: row.date,
      role: row.role,
      operatorName: row.operator_name,
      clientName: row.client_name || undefined,
      clientPhone: row.client_phone || undefined,
      clientEmail: row.client_email || undefined,
      schoolName: row.school_name || undefined,
      items: row.items || [],
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      total: Number(row.total),
      paymentMethod: row.payment_method,
      amountPaid: Number(row.amount_paid),
      change: Number(row.change),
      depositAmount: row.deposit_amount ? Number(row.deposit_amount) : undefined,
      remainingAmount: row.remaining_amount ? Number(row.remaining_amount) : undefined,
      status: row.status,
      notes: row.notes || undefined,
      photoSpecs: row.photo_specs || undefined,
    }));
  } catch {
    return null;
  }
};

// Fetch students from Supabase
export const fetchStudentsFromSupabase = async (): Promise<GraduationStudent[] | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('graduation_students').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      folio: row.folio,
      studentName: row.student_name,
      matricula: row.matricula || undefined,
      grade: row.grade || (row.grade_group ? row.grade_group.split(' ')[0] : '1°'),
      group: row.group || (row.grade_group ? row.grade_group.split(' ')[1] : 'A'),
      gradeGroup: row.grade_group || '',
      schoolId: row.school_id || '',
      schoolName: row.school_name,
      seasonYear: row.season_year || '2026',
      packageName: row.package_name || '',
      totalPhotos: row.total_photos || '',
      totalAmount: Number(row.total_amount),
      depositAmount: Number(row.deposit_amount),
      remainingAmount: Number(row.remaining_amount),
      santanderReference: row.santander_reference || `MF-015-${String(row.folio || row.id || '100000').replace(/\D/g, '').padStart(6, '0').slice(-6)}`,
      tutorName: row.tutor_name || undefined,
      tutorWhatsapp: row.tutor_whatsapp || undefined,
      tutorPhone: row.tutor_phone || row.contact_phone || undefined,
      consentWhatsapp: row.consent_whatsapp !== false,
      nextDueDate: row.next_due_date || undefined,
      nextDueAmount: row.next_due_amount ? Number(row.next_due_amount) : undefined,
      paymentHistory: Array.isArray(row.payment_history) ? row.payment_history : [],
      whatsappLogs: Array.isArray(row.whatsapp_logs) ? row.whatsapp_logs : [],
      deliveryStatus: row.delivery_status || 'pendiente',
      deliveryDate: row.delivery_date || undefined,
      contactPhone: row.contact_phone || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch {
    return null;
  }
};

// Fetch schools from Supabase
export const fetchSchoolsFromSupabase = async (): Promise<School[] | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('schools').select('*').order('name', { ascending: true });
    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      seasonYear: row.season_year || '2026',
      active: row.active !== false,
      representative: row.representative || undefined,
      phone: row.phone || undefined,
    }));
  } catch {
    return null;
  }
};

// Delete single product from Supabase
export const deleteProductFromSupabase = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.warn('Supabase product delete warning:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Error deleting product from Supabase:', e);
    return false;
  }
};

// Batch delete products from Supabase
export const deleteProductsBatchFromSupabase = async (ids: string[]): Promise<{ count: number; error?: string }> => {
  try {
    if (!ids || ids.length === 0) return { count: 0 };
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('products').delete().in('id', ids);
    if (error) {
      return { count: 0, error: error.message };
    }
    return { count: ids.length };
  } catch (e: any) {
    return { count: 0, error: e.message || 'Error de red' };
  }
};

// Save category to Supabase
export const saveCategoryToSupabase = async (cat: { id: string; label: string; icon?: string; color?: string }): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('categories').upsert({
      id: cat.id,
      label: cat.label,
      icon: cat.icon || null,
      color: cat.color || null,
    }, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase category save error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.warn('Supabase category save exception:', e);
    return { success: false, error: e.message || 'Error de red' };
  }
};

// Batch save categories to Supabase
export const saveCategoriesBatchToSupabase = async (cats: { id: string; label: string; icon?: string; color?: string }[]): Promise<{ savedCount: number; error?: string }> => {
  try {
    if (!cats || cats.length === 0) return { savedCount: 0 };
    const supabase = getSupabaseClient();
    const rows = cats.map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon || null,
      color: c.color || null,
    }));
    const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'id' });
    if (error) {
      return { savedCount: 0, error: error.message };
    }
    return { savedCount: rows.length };
  } catch (e: any) {
    return { savedCount: 0, error: e.message || 'Error de red' };
  }
};

// Delete category from Supabase
export const deleteCategoryFromSupabase = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.warn('Supabase category delete error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error de red' };
  }
};

// Fetch categories from Supabase
export const fetchCategoriesFromSupabase = async (): Promise<{ id: string; label: string; icon?: string; color?: string }[] | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      label: row.label,
      icon: row.icon || undefined,
      color: row.color || undefined,
    }));
  } catch {
    return null;
  }
};

// Save user profile to Supabase
export const saveUserProfileToSupabase = async (profile: { id: string; role: string; name: string; email?: string; phone?: string; avatarUrl?: string; notes?: string; address?: string }): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const payload = {
      id: profile.id,
      role: profile.role,
      name: profile.name,
      email: profile.email || null,
      phone: profile.phone || null,
      avatar_url: profile.avatarUrl || null,
      notes: profile.notes || null,
      address: profile.address || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('user_profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase profile upsert warning:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// Fetch user profile from Supabase
export const fetchUserProfileFromSupabase = async (role: string): Promise<any | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('user_profiles').select('*').eq('role', role).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      role: data.role,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      avatarUrl: data.avatar_url || '',
      notes: data.notes || '',
      address: data.address || '',
      updatedAt: data.updated_at,
    };
  } catch {
    return null;
  }
};
