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
-- ESQUEMA COMPLETO SUPABASE PARA POS FOTOGRAFÍA
-- Proyecto: minifoto@appdesignsoftware.com's Project
-- Project ID: xqggdnoxvskotwlcuwgd
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

-- 5. TABLA DE CATEGORÍAS DEL CATÁLOGO (DINÁMICAS)
create table if not exists public.categories (
  id text primary key,
  label text not null,
  icon text,
  color text,
  created_at timestamptz default now()
);

-- 6. TABLA DE PERFILES DE USUARIO (MULTI-ROL)
create table if not exists public.user_profiles (
  id text primary key,
  role text not null,
  name text not null,
  email text,
  phone text,
  avatar_url text,
  notes text,
  address text,
  updated_at timestamptz default now()
);

-- HABILITAR SEGURIDAD A NIVEL DE FILA (RLS)
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.graduation_students enable row level security;
alter table public.schools enable row level security;
alter table public.categories enable row level security;
alter table public.user_profiles enable row level security;

-- POLÍTICAS DE ACCESO TOTAL PÚBLICO (ANON) PARA LECTURA Y ESCRITURA
drop policy if exists "Anon full access products" on public.products;
create policy "Anon full access products" on public.products for all using (true) with check (true);

drop policy if exists "Anon full access sales" on public.sales;
create policy "Anon full access sales" on public.sales for all using (true) with check (true);

drop policy if exists "Anon full access students" on public.graduation_students;
create policy "Anon full access students" on public.graduation_students for all using (true) with check (true);

drop policy if exists "Anon full access schools" on public.schools;
create policy "Anon full access schools" on public.schools for all using (true) with check (true);

drop policy if exists "Anon full access categories" on public.categories;
create policy "Anon full access categories" on public.categories for all using (true) with check (true);

drop policy if exists "Anon full access user_profiles" on public.user_profiles;
create policy "Anon full access user_profiles" on public.user_profiles for all using (true) with check (true);
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
      school_name: sale.schoolName || null,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      payment_method: sale.paymentMethod,
      amount_paid: sale.amountPaid,
      change: sale.change,
      status: sale.status,
      notes: sale.notes || null,
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
      schoolName: row.school_name || undefined,
      items: row.items || [],
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      total: Number(row.total),
      paymentMethod: row.payment_method,
      amountPaid: Number(row.amount_paid),
      change: Number(row.change),
      status: row.status,
      notes: row.notes || undefined,
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
export const saveCategoryToSupabase = async (cat: { id: string; label: string; icon?: string; color?: string }): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('categories').upsert({
      id: cat.id,
      label: cat.label,
      icon: cat.icon || null,
      color: cat.color || null,
    }, { onConflict: 'id' });
    if (error) return false;
    return true;
  } catch {
    return false;
  }
};

// Delete category from Supabase
export const deleteCategoryFromSupabase = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return false;
    return true;
  } catch {
    return false;
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
