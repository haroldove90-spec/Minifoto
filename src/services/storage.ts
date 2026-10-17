import { 
  Product, 
  School, 
  GraduationStudent, 
  Sale, 
  PaymentGatewayConfig, 
  SupabaseConfig, 
  BrandConfig, 
  Role 
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SCHOOLS, 
  INITIAL_STUDENTS, 
  INITIAL_GATEWAYS, 
  INITIAL_SUPABASE, 
  INITIAL_BRAND 
} from './initialData';

const KEYS = {
  SAMPLE_CLEARED: 'pos_photo_sample_data_cleared_v1',
  PRODUCTS: 'pos_photo_products_v1',
  SCHOOLS: 'pos_photo_schools_v1',
  STUDENTS: 'pos_photo_students_v1',
  SALES: 'pos_photo_sales_v1',
  GATEWAYS: 'pos_photo_gateways_v1',
  SUPABASE: 'pos_photo_supabase_v1',
  BRAND: 'pos_photo_brand_v1',
  ROLE: 'pos_photo_active_role_v1',
  OPERATOR: 'pos_photo_operator_name_v1',
};

// Check if sample data has been permanently cleared
export const isSampleDataCleared = (): boolean => {
  return localStorage.getItem(KEYS.SAMPLE_CLEARED) === 'true';
};

export const getStoredProducts = (): Product[] => {
  const data = localStorage.getItem(KEYS.PRODUCTS);
  if (data) {
    try {
      const parsed: Product[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Enrich any stored product with image and isActive if missing
        const initialMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
        return parsed.map((p) => ({
          ...p,
          imageUrl: p.imageUrl || initialMap.get(p.id)?.imageUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
          isActive: p.isActive !== false,
        }));
      }
    } catch {
      // fallback
    }
  }
  // If sample data was explicitly cleared, start empty
  if (isSampleDataCleared()) {
    return [];
  }
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
};

export const saveStoredProducts = (products: Product[]) => {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
};

export const getStoredSchools = (): School[] => {
  const data = localStorage.getItem(KEYS.SCHOOLS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  if (isSampleDataCleared()) {
    return [];
  }
  localStorage.setItem(KEYS.SCHOOLS, JSON.stringify(INITIAL_SCHOOLS));
  return INITIAL_SCHOOLS;
};

export const saveStoredSchools = (schools: School[]) => {
  localStorage.setItem(KEYS.SCHOOLS, JSON.stringify(schools));
};

export const getStoredStudents = (): GraduationStudent[] => {
  const data = localStorage.getItem(KEYS.STUDENTS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  if (isSampleDataCleared()) {
    return [];
  }
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  return INITIAL_STUDENTS;
};

export const saveStoredStudents = (students: GraduationStudent[]) => {
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
};

export const getStoredSales = (): Sale[] => {
  const data = localStorage.getItem(KEYS.SALES);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  return [];
};

export const saveStoredSales = (sales: Sale[]) => {
  localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
};

export const addStoredSale = (sale: Sale) => {
  const current = getStoredSales();
  const updated = [sale, ...current];
  saveStoredSales(updated);
  return updated;
};

export const getStoredGateways = (): PaymentGatewayConfig[] => {
  const data = localStorage.getItem(KEYS.GATEWAYS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  return INITIAL_GATEWAYS;
};

export const saveStoredGateways = (gateways: PaymentGatewayConfig[]) => {
  localStorage.setItem(KEYS.GATEWAYS, JSON.stringify(gateways));
};

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  const data = localStorage.getItem(KEYS.SUPABASE);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.url && parsed.url.includes('xqggdnoxvskotwlcuwgd')) {
        return parsed;
      }
    } catch {}
  }
  localStorage.setItem(KEYS.SUPABASE, JSON.stringify(INITIAL_SUPABASE));
  return INITIAL_SUPABASE;
};

export const saveStoredSupabaseConfig = (config: SupabaseConfig) => {
  localStorage.setItem(KEYS.SUPABASE, JSON.stringify(config));
};

export const getStoredBrandConfig = (): BrandConfig => {
  const data = localStorage.getItem(KEYS.BRAND);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  return INITIAL_BRAND;
};

export const saveStoredBrandConfig = (config: BrandConfig) => {
  localStorage.setItem(KEYS.BRAND, JSON.stringify(config));
};

export const getStoredRole = (): Role | null => {
  return (localStorage.getItem(KEYS.ROLE) as Role) || null;
};

export const saveStoredRole = (role: Role | null) => {
  if (role) {
    localStorage.setItem(KEYS.ROLE, role);
  } else {
    localStorage.removeItem(KEYS.ROLE);
  }
};

export const getStoredOperator = (): string => {
  return localStorage.getItem(KEYS.OPERATOR) || '';
};

export const saveStoredOperator = (name: string) => {
  localStorage.setItem(KEYS.OPERATOR, name);
};

// Clear sample data and permanently flag it so the browser NEVER shows demo data again
export const clearSampleDataSystem = async (cleanCatalogsToo = false): Promise<{ success: boolean; supabaseDeleted?: boolean }> => {
  // Set flag so future reloads won't repopulate demo data
  localStorage.setItem(KEYS.SAMPLE_CLEARED, 'true');

  // Clear students and sales
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify([]));
  localStorage.setItem(KEYS.SALES, JSON.stringify([]));
  localStorage.setItem(KEYS.SCHOOLS, JSON.stringify([]));

  if (cleanCatalogsToo) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
  }

  // Attempt Supabase deletion if credentials configured
  const supabase = getStoredSupabaseConfig();
  let supabaseDeleted = false;
  if (supabase.syncEnabled && supabase.url && supabase.anonKey) {
    try {
      // Send delete command to REST endpoint
      const headers = {
        'apikey': supabase.anonKey,
        'Authorization': `Bearer ${supabase.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      };
      
      await Promise.allSettled([
        fetch(`${supabase.url}/rest/v1/sales?id=neq.00000000-0000-0000-0000-000000000000`, {
          method: 'DELETE',
          headers
        }),
        fetch(`${supabase.url}/rest/v1/graduation_students?id=neq.00000000-0000-0000-0000-000000000000`, {
          method: 'DELETE',
          headers
        })
      ]);
      supabaseDeleted = true;
    } catch {
      // Network or CORS issue; handled gracefully
    }
  }

  return { success: true, supabaseDeleted };
};

// Restore demo data (if user wants to test with samples again)
export const restoreSampleDataSystem = () => {
  localStorage.removeItem(KEYS.SAMPLE_CLEARED);
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(KEYS.SCHOOLS, JSON.stringify(INITIAL_SCHOOLS));
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(KEYS.SALES, JSON.stringify([]));
};
