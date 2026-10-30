import { 
  Product, 
  School, 
  GraduationStudent, 
  Sale, 
  PaymentGatewayConfig, 
  SupabaseConfig, 
  BrandConfig, 
  Role,
  TerminalId,
  PaymentRecord,
  WhatsAppLog,
  BankTransferRecord,
  AuditLogItem,
  PaymentMethod,
  CategoryItem,
  UserProfile,
  FolioConfig,
  ClientPhoto,
  WorkOrder,
  LabOrderStatus
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SCHOOLS, 
  INITIAL_STUDENTS, 
  INITIAL_GATEWAYS, 
  INITIAL_SUPABASE, 
  INITIAL_BRAND,
  INITIAL_CATEGORIES,
  INITIAL_USER_PROFILES
} from './initialData';

const KEYS = {
  SAMPLE_CLEARED: 'pos_photo_sample_data_cleared_v1',
  PRODUCTS: 'pos_photo_products_v1',
  PRODUCT_ORDER: 'pos_photo_product_order_v1',
  FOLIO_CONFIG: 'pos_photo_folio_config_v1',
  SCHOOLS: 'pos_photo_schools_v1',
  STUDENTS: 'pos_photo_students_v1',
  SALES: 'pos_photo_sales_v1',
  GATEWAYS: 'pos_photo_gateways_v1',
  SUPABASE: 'pos_photo_supabase_v1',
  BRAND: 'pos_photo_brand_v1',
  ROLE: 'pos_photo_active_role_v1',
  OPERATOR: 'pos_photo_operator_name_v1',
  ACTIVE_TAB: 'pos_photo_active_tab_v1',
  EXPLICIT_LOGOUT: 'pos_photo_explicit_logout_v1',
  POS_CART: 'pos_photo_cart_v1',
  POS_CLIENT_NAME: 'pos_photo_client_name_v1',
  POS_ACTIVE_CATEGORY: 'pos_photo_pos_category_v1',
  DELETED_PRODUCT_IDS: 'pos_photo_deleted_product_ids_v1',
  CATEGORIES: 'pos_photo_categories_v1',
  USER_PROFILES: 'pos_photo_user_profiles_v1',
  ACTIVE_TERMINAL: 'pos_photo_active_terminal_v1',
  BANK_TRANSFERS: 'pos_photo_bank_transfers_v1',
  AUDIT_LOGS: 'pos_photo_audit_logs_v1',
  WORK_ORDERS: 'pos_photo_work_orders_v1',
};

// Check if sample data has been permanently cleared
export const isSampleDataCleared = (): boolean => {
  return localStorage.getItem(KEYS.SAMPLE_CLEARED) === 'true';
};

// Persistent record of products explicitly deleted by the user
export const getDeletedProductIds = (): string[] => {
  const data = localStorage.getItem(KEYS.DELETED_PRODUCT_IDS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const markProductAsDeleted = (productIds: string | string[]) => {
  const current = getDeletedProductIds();
  const toAdd = Array.isArray(productIds) ? productIds : [productIds];
  const updated = Array.from(new Set([...current, ...toAdd]));
  localStorage.setItem(KEYS.DELETED_PRODUCT_IDS, JSON.stringify(updated));
};

export const getDeletedCategoryIds = (): string[] => {
  const data = localStorage.getItem('pos_photo_deleted_category_ids_v1');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const markCategoryAsDeleted = (categoryIds: string | string[]) => {
  const current = getDeletedCategoryIds();
  const toAdd = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
  const updated = Array.from(new Set([...current, ...toAdd]));
  localStorage.setItem('pos_photo_deleted_category_ids_v1', JSON.stringify(updated));
};

export const removeStoredProduct = (productId: string): Product[] => {
  markProductAsDeleted(productId);
  const current = getStoredProducts();
  const updated = current.filter((p) => p.id !== productId);
  saveStoredProducts(updated);
  return updated;
};

export const removeStoredCategory = (categoryId: string): CategoryItem[] => {
  markCategoryAsDeleted(categoryId);
  const current = getStoredCategories();
  const updated = current.filter((c) => c.id !== categoryId);
  saveStoredCategories(updated);
  return updated;
};

export const getStoredProducts = (): Product[] => {
  const data = localStorage.getItem(KEYS.PRODUCTS);
  const deletedIds = new Set(getDeletedProductIds());

  if (data !== null) {
    try {
      const parsed: Product[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Exclude any product ID marked as deleted
        const existingIds = new Set(parsed.map((p) => p.id));
        const filtered = parsed.filter((p) => !deletedIds.has(p.id));
        const initialMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
        
        // Auto-merge newly added core studio products (e.g. Caritas, Cambios de Fondo)
        const missingInitial = INITIAL_PRODUCTS.filter(
          (p) => !existingIds.has(p.id) && !deletedIds.has(p.id)
        );

        return [...filtered, ...missingInitial].map((p) => ({
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

  // Filter out any deleted products even on first load
  const initialFiltered = INITIAL_PRODUCTS.filter((p) => !deletedIds.has(p.id));
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(initialFiltered));
  return initialFiltered;
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

// Generate Santander bank reference (e.g. MF-015-000123)
export const generateSantanderReference = (schoolName: string, idOrFolio: string): string => {
  const cleanSchool = schoolName.replace(/[^0-9]/g, '');
  const schoolCode = cleanSchool ? cleanSchool.padStart(3, '0').slice(-3) : '015';
  const cleanNum = idOrFolio.replace(/[^0-9]/g, '');
  const folioCode = cleanNum ? cleanNum.padStart(6, '0').slice(-6) : Math.floor(100000 + Math.random() * 900000).toString();
  return `MF-${schoolCode}-${folioCode}`;
};

export const getStoredStudents = (): GraduationStudent[] => {
  const data = localStorage.getItem(KEYS.STUDENTS);
  let students: GraduationStudent[] = [];

  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        students = parsed;
      }
    } catch {}
  }

  if (students.length === 0) {
    if (isSampleDataCleared()) {
      return [];
    }
    students = INITIAL_STUDENTS;
  } else {
    // If stored students does not have the mockup student 'std-sec15-01', prepend initial students
    const hasSec15 = students.some(s => s.id === 'std-sec15-01' || s.schoolId === 'sch-sec15');
    if (!hasSec15 && !isSampleDataCleared()) {
      students = [...INITIAL_STUDENTS.filter(s => s.schoolId === 'sch-sec15'), ...students];
    }
  }

  // Ensure all students have santanderReference, grade, group and payment history
  const enriched = students.map((s, idx) => {
    const parts = (s.gradeGroup || '').trim().split(' ');
    const grade = s.grade || parts[0] || '1°';
    const group = s.group || parts[1] || 'A';
    const ref = s.santanderReference || generateSantanderReference(s.schoolName, s.matricula || s.folio || String(idx + 100));
    return {
      ...s,
      grade,
      group,
      santanderReference: ref,
      consentWhatsapp: s.consentWhatsapp !== false,
      paymentHistory: Array.isArray(s.paymentHistory) ? s.paymentHistory : [],
      whatsappLogs: Array.isArray(s.whatsappLogs) ? s.whatsappLogs : [],
    };
  });

  return enriched;
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
      const parsed = JSON.parse(data);
      if (parsed.logoUrl && !parsed.logoUrl.includes('appdesignproyectos.com') && parsed.primaryColor === '#4E2B01') {
        return parsed;
      }
    } catch {}
  }
  localStorage.setItem(KEYS.BRAND, JSON.stringify(INITIAL_BRAND));
  return INITIAL_BRAND;
};

export const saveStoredBrandConfig = (config: BrandConfig) => {
  localStorage.setItem(KEYS.BRAND, JSON.stringify(config));
};

export const getStoredRole = (): Role | null => {
  const isExplicitLogout = localStorage.getItem(KEYS.EXPLICIT_LOGOUT) === 'true';
  if (isExplicitLogout) {
    return null;
  }
  const role = (localStorage.getItem(KEYS.ROLE) as Role) || null;
  if (role && ['admin', 'cashier', 'field', 'client', 'laboratorio', 'impresor'].includes(role)) {
    return role;
  }
  // Default to admin so browser refresh NEVER accidentally logs out the user
  localStorage.setItem(KEYS.ROLE, 'admin');
  return 'admin';
};

export const saveStoredRole = (role: Role | null) => {
  if (role) {
    localStorage.setItem(KEYS.ROLE, role);
    localStorage.removeItem(KEYS.EXPLICIT_LOGOUT);
  } else {
    localStorage.removeItem(KEYS.ROLE);
    localStorage.setItem(KEYS.EXPLICIT_LOGOUT, 'true');
  }
};

export const getStoredOperator = (): string => {
  const op = localStorage.getItem(KEYS.OPERATOR);
  if (op) return op;
  const role = localStorage.getItem(KEYS.ROLE);
  if (role === 'admin') return 'Uriel';
  if (role === 'cashier') return 'Cajero Mostrador';
  if (role === 'field') return 'Cobrador Móvil';
  if (role === 'client') return 'Cliente Invitado';
  if (role === 'laboratorio') return 'Técnico Laboratorio';
  if (role === 'impresor') return 'Operador Impresor';
  return 'Uriel';
};

export const saveStoredOperator = (name: string) => {
  localStorage.setItem(KEYS.OPERATOR, name);
};

export const getStoredActiveTab = (): string | null => {
  return localStorage.getItem(KEYS.ACTIVE_TAB) || null;
};

export const saveStoredActiveTab = (tab: string) => {
  localStorage.setItem(KEYS.ACTIVE_TAB, tab);
};

export const getStoredPOSCart = (): any[] => {
  try {
    const data = localStorage.getItem(KEYS.POS_CART);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveStoredPOSCart = (cart: any[]) => {
  try {
    localStorage.setItem(KEYS.POS_CART, JSON.stringify(cart));
  } catch {}
};

export const getStoredPOSClientName = (): string => {
  return localStorage.getItem(KEYS.POS_CLIENT_NAME) || '';
};

export const saveStoredPOSClientName = (name: string) => {
  localStorage.setItem(KEYS.POS_CLIENT_NAME, name);
};

export const getStoredPOSCategory = (): string => {
  return localStorage.getItem(KEYS.POS_ACTIVE_CATEGORY) || 'foto_estudio';
};

export const saveStoredPOSCategory = (cat: string) => {
  localStorage.setItem(KEYS.POS_ACTIVE_CATEGORY, cat);
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

// ==========================================
// CATEGORIES STORAGE
// ==========================================
export const getStoredCategories = (): CategoryItem[] => {
  const data = localStorage.getItem(KEYS.CATEGORIES);
  const deletedCatIds = new Set(getDeletedCategoryIds());

  if (data !== null) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((c: CategoryItem) => !deletedCatIds.has(c.id));
      }
    } catch {}
  }
  const initial = INITIAL_CATEGORIES.filter((c) => !deletedCatIds.has(c.id));
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(initial));
  return initial;
};

export const saveStoredCategories = (categories: CategoryItem[]) => {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
};

// ==========================================
// USER PROFILE STORAGE (BY ROLE)
// ==========================================
export const getStoredUserProfile = (role: Role): UserProfile => {
  const data = localStorage.getItem(`${KEYS.USER_PROFILES}_${role}`);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  const defaultProfile = INITIAL_USER_PROFILES[role] || {
    id: `user-${role}`,
    role,
    name: 'Usuario',
    email: '',
    phone: '',
    avatarUrl: '',
    notes: '',
  };
  return defaultProfile;
};

export const saveStoredUserProfile = (profile: UserProfile) => {
  localStorage.setItem(`${KEYS.USER_PROFILES}_${profile.role}`, JSON.stringify(profile));
  const activeRole = getStoredRole();
  if (activeRole === profile.role) {
    saveStoredOperator(profile.name);
  }
};

// ==========================================
// ACTIVE TERMINAL (POS-01 to POS-08 / OFICINA-01)
// ==========================================
export const getActiveTerminal = (): TerminalId => {
  const terminal = localStorage.getItem(KEYS.ACTIVE_TERMINAL);
  if (terminal && ['POS-01', 'POS-02', 'POS-03', 'POS-04', 'POS-05', 'POS-06', 'POS-07', 'POS-08', 'OFICINA-01'].includes(terminal)) {
    return terminal as TerminalId;
  }
  return 'POS-01';
};

export const setActiveTerminal = (terminalId: TerminalId) => {
  localStorage.setItem(KEYS.ACTIVE_TERMINAL, terminalId);
};

// ==========================================
// AUDIT LOGS
// ==========================================
export const getStoredAuditLogs = (): AuditLogItem[] => {
  const data = localStorage.getItem(KEYS.AUDIT_LOGS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  return [];
};

export const addAuditLog = (entry: Omit<AuditLogItem, 'id' | 'timestamp'>) => {
  const current = getStoredAuditLogs();
  const newLog: AuditLogItem = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
    ...entry,
  };
  const updated = [newLog, ...current].slice(0, 500); // keep last 500
  localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(updated));
  return newLog;
};

// ==========================================
// BANK TRANSFERS (SANTANDER RECONCILIATION)
// ==========================================
export const getStoredBankTransfers = (): BankTransferRecord[] => {
  const data = localStorage.getItem(KEYS.BANK_TRANSFERS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  // Initialize with any pending transfer from students
  const students = getStoredStudents();
  const initialTransfers: BankTransferRecord[] = [];
  students.forEach((s) => {
    (s.paymentHistory || []).forEach((p) => {
      if (p.method === 'transferencia') {
        initialTransfers.push({
          id: `tr-${p.id}`,
          date: p.date,
          studentId: s.id,
          studentName: s.studentName,
          schoolName: s.schoolName,
          santanderReference: s.santanderReference,
          amount: p.amount,
          status: p.status === 'completado' ? 'confirmado' : 'pendiente',
          terminalId: p.terminalId || 'POS-01',
          operatorName: p.operatorName || 'Cobrador',
          notes: p.notes,
        });
      }
    });
  });
  localStorage.setItem(KEYS.BANK_TRANSFERS, JSON.stringify(initialTransfers));
  return initialTransfers;
};

export const saveStoredBankTransfers = (transfers: BankTransferRecord[]) => {
  localStorage.setItem(KEYS.BANK_TRANSFERS, JSON.stringify(transfers));
};

export const registerBankTransfer = (transfer: Omit<BankTransferRecord, 'id' | 'date'>) => {
  const current = getStoredBankTransfers();
  const newTransfer: BankTransferRecord = {
    id: `tr-${Date.now()}`,
    date: new Date().toLocaleDateString('es-MX'),
    ...transfer,
  };
  const updated = [newTransfer, ...current];
  saveStoredBankTransfers(updated);
  return newTransfer;
};

export const confirmBankTransfer = (
  transferId: string, 
  confirmedBy: string, 
  bankFolio?: string
): { success: boolean; studentName?: string; amount?: number } => {
  const transfers = getStoredBankTransfers();
  const transfer = transfers.find(t => t.id === transferId);
  if (!transfer) return { success: false };

  transfer.status = 'confirmado';
  transfer.confirmedAt = new Date().toLocaleString('es-MX');
  transfer.confirmedBy = confirmedBy;
  if (bankFolio) transfer.bankTransactionFolio = bankFolio;
  saveStoredBankTransfers(transfers);

  // Update student payment status and balance
  const students = getStoredStudents();
  const student = students.find(s => s.id === transfer.studentId || s.santanderReference === transfer.santanderReference);
  if (student) {
    const payment = (student.paymentHistory || []).find(p => p.method === 'transferencia' && p.status === 'pendiente_confirmacion');
    if (payment) {
      payment.status = 'completado';
    } else {
      // Create completed payment record
      const newPay: PaymentRecord = {
        id: `pay-${Date.now()}`,
        date: new Date().toLocaleDateString('es-MX'),
        concept: student.remainingAmount - transfer.amount <= 0 ? 'Liquidación Total' : 'Abono Transferencia',
        amount: transfer.amount,
        balanceAfter: Math.max(0, student.remainingAmount - transfer.amount),
        method: 'transferencia',
        santanderReference: transfer.santanderReference,
        status: 'completado',
        terminalId: 'OFICINA-01',
        operatorName: confirmedBy,
        notes: `Conciliado en Santander ref ${bankFolio || 'SPEI'}`,
      };
      student.paymentHistory = [newPay, ...(student.paymentHistory || [])];
      student.depositAmount += transfer.amount;
      student.remainingAmount = Math.max(0, student.totalAmount - student.depositAmount);
      if (student.remainingAmount === 0) {
        student.deliveryStatus = 'listo';
      }
    }
    saveStoredStudents(students);
  }

  addAuditLog({
    user: confirmedBy,
    role: 'admin',
    action: 'CONCILIACION_TRANSFERENCIA',
    details: `Transferencia confirmada por $${transfer.amount} Ref ${transfer.santanderReference} - Alumno: ${transfer.studentName}`,
    studentFolio: transfer.santanderReference,
  });

  return { success: true, studentName: transfer.studentName, amount: transfer.amount };
};

// ==========================================
// STUDENT PAYMENTS AND INSTALLMENTS
// ==========================================
export const recordStudentPayment = (params: {
  studentId: string;
  amount: number;
  method: PaymentMethod;
  concept?: string;
  terminalId: string;
  operatorName: string;
  notes?: string;
}): { success: boolean; student?: GraduationStudent; payment?: PaymentRecord } => {
  const students = getStoredStudents();
  const studentIndex = students.findIndex(s => s.id === params.studentId);
  if (studentIndex === -1) return { success: false };

  const student = students[studentIndex];
  const isPendingTransfer = params.method === 'transferencia';
  const newDeposit = isPendingTransfer ? student.depositAmount : student.depositAmount + params.amount;
  const newRemaining = isPendingTransfer ? student.remainingAmount : Math.max(0, student.totalAmount - newDeposit);

  const concept = params.concept || (
    newRemaining === 0 ? 'Liquidación Total' : (student.depositAmount === 0 ? 'Anticipo' : 'Abono')
  );

  const paymentRecord: PaymentRecord = {
    id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: new Date().toLocaleDateString('es-MX'),
    concept,
    amount: params.amount,
    balanceAfter: isPendingTransfer ? student.remainingAmount : newRemaining,
    method: params.method,
    terminalId: params.terminalId,
    operatorName: params.operatorName,
    status: isPendingTransfer ? 'pendiente_confirmacion' : 'completado',
    santanderReference: student.santanderReference,
    notes: params.notes,
  };

  const updatedStudent: GraduationStudent = {
    ...student,
    depositAmount: newDeposit,
    remainingAmount: newRemaining,
    deliveryStatus: newRemaining === 0 ? 'listo' : student.deliveryStatus,
    paymentHistory: [paymentRecord, ...(student.paymentHistory || [])],
  };

  students[studentIndex] = updatedStudent;
  saveStoredStudents(students);

  // If transfer, register in bank transfers list as pending
  if (isPendingTransfer) {
    registerBankTransfer({
      studentId: student.id,
      studentName: student.studentName,
      schoolName: student.schoolName,
      santanderReference: student.santanderReference,
      amount: params.amount,
      status: 'pendiente',
      terminalId: params.terminalId,
      operatorName: params.operatorName,
      notes: params.notes,
    });
  }

  addAuditLog({
    user: params.operatorName,
    role: 'field',
    terminalId: params.terminalId,
    action: isPendingTransfer ? 'REGISTRO_TRANSFERENCIA_PENDIENTE' : 'COBRO_ALUMNO',
    details: `${concept} de $${params.amount} (${params.method}) - Alumno: ${student.studentName}`,
    studentFolio: student.folio,
  });

  return { success: true, student: updatedStudent, payment: paymentRecord };
};

// Schedule next installment (Programar Plazo)
export const scheduleStudentDueDate = (
  studentId: string, 
  dueDate: string, 
  dueAmount: number,
  operatorName: string
): boolean => {
  const students = getStoredStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index === -1) return false;

  students[index].nextDueDate = dueDate;
  students[index].nextDueAmount = dueAmount;
  saveStoredStudents(students);

  addAuditLog({
    user: operatorName,
    role: 'field',
    action: 'PROGRAMAR_PLAZO',
    details: `Plazo acordado para el ${dueDate} por $${dueAmount} - Alumno: ${students[index].studentName}`,
    studentFolio: students[index].folio,
  });

  return true;
};

// Log WhatsApp notification
export const logStudentWhatsApp = (
  studentId: string, 
  type: WhatsAppLog['type'], 
  phone: string, 
  message: string
) => {
  const students = getStoredStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index === -1) return;

  const newLog: WhatsAppLog = {
    id: `wa-${Date.now()}`,
    date: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
    type,
    phone,
    message,
    status: 'enviado',
  };

  students[index].whatsappLogs = [newLog, ...(students[index].whatsappLogs || [])];
  saveStoredStudents(students);
};

// ==========================================
// FOLIO CONFIGURATION (CUSTOMIZABLE BY ADMIN)
// ==========================================
const DEFAULT_FOLIO_CONFIG: FolioConfig = {
  prefix: 'TK-',
  nextNumber: 149444,
  padding: 6,
  suffix: '',
};

export const getStoredFolioConfig = (): FolioConfig => {
  const data = localStorage.getItem(KEYS.FOLIO_CONFIG);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed.prefix === 'string') {
        return {
          prefix: parsed.prefix,
          nextNumber: Number(parsed.nextNumber) || 100001,
          padding: Number(parsed.padding) || 6,
          suffix: parsed.suffix || '',
        };
      }
    } catch {}
  }
  return DEFAULT_FOLIO_CONFIG;
};

export const saveStoredFolioConfig = (config: FolioConfig) => {
  localStorage.setItem(KEYS.FOLIO_CONFIG, JSON.stringify(config));
};

export const generateNextSaleFolio = (): string => {
  const config = getStoredFolioConfig();
  const numStr = String(config.nextNumber).padStart(config.padding || 6, '0');
  const folio = `${config.prefix || 'TK-'}${numStr}${config.suffix || ''}`;
  
  // Increment nextNumber for next sale
  config.nextNumber += 1;
  saveStoredFolioConfig(config);
  return folio;
};

// ==========================================
// CUSTOM PRODUCT ORDERING (DRAG & DROP PERSISTENCE)
// ==========================================
export const getStoredProductsOrder = (): string[] => {
  const data = localStorage.getItem(KEYS.PRODUCT_ORDER);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

export const saveStoredProductsOrder = (order: string[]) => {
  localStorage.setItem(KEYS.PRODUCT_ORDER, JSON.stringify(order));
};

// ==========================================
// WORK ORDERS & CLIENT PHOTOS (LABORATORIO)
// ==========================================
export const getStoredWorkOrders = (): WorkOrder[] => {
  const data = localStorage.getItem(KEYS.WORK_ORDERS);
  if (data) {
    try {
      const parsed: WorkOrder[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }

  // If none saved yet, synthesize from current sales so all POS tickets appear in Lab
  const sales = getStoredSales();
  if (sales.length > 0) {
    const synthesized: WorkOrder[] = sales.map((sale) => {
      // Determine urgency and initial lab status
      const hasRetoque = sale.items.some((it) => it.options?.retoque);
      const isCaritaOrAmpliacion = sale.items.some((it) => 
        it.category === 'ampliaciones' || 
        it.name.toLowerCase().includes('caritas') || 
        it.options?.photoSpecs?.childName
      );

      return {
        id: `wo-${sale.id}`,
        saleId: sale.id,
        folio: sale.folio,
        clientName: sale.clientName || 'Cliente Mostrador',
        clientPhone: sale.clientPhone || '',
        clientEmail: sale.clientEmail || '',
        schoolName: sale.schoolName || '',
        date: sale.date,
        deliveryDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString('es-MX'),
        items: sale.items,
        total: sale.total,
        amountPaid: sale.amountPaid,
        depositAmount: sale.depositAmount,
        remainingAmount: sale.remainingAmount ?? Math.max(0, sale.total - sale.amountPaid),
        paymentMethod: sale.paymentMethod,
        labStatus: sale.status === 'liquidado' ? 'entregado' : 'pendiente',
        urgency: hasRetoque || isCaritaOrAmpliacion ? 'urgente' : 'normal',
        notes: sale.notes || '',
        photoSpecs: sale.photoSpecs,
        photos: [],
        operatorName: sale.operatorName,
        createdAt: new Date().toISOString(),
      };
    });

    saveStoredWorkOrders(synthesized);
    return synthesized;
  }

  return [];
};

export const saveStoredWorkOrders = (orders: WorkOrder[]) => {
  localStorage.setItem(KEYS.WORK_ORDERS, JSON.stringify(orders));
};

export const syncSaleToWorkOrder = (sale: Sale): WorkOrder => {
  const currentOrders = getStoredWorkOrders();
  const existing = currentOrders.find((wo) => wo.folio === sale.folio || wo.saleId === sale.id);

  const hasRetoque = sale.items.some((it) => it.options?.retoque);
  const isSpecial = sale.items.some((it) => 
    it.category === 'ampliaciones' || 
    it.name.toLowerCase().includes('caritas') || 
    it.options?.photoSpecs?.childName ||
    it.options?.photoSpecs?.cambioFondo
  );

  const workOrder: WorkOrder = {
    id: existing ? existing.id : `wo-${sale.id}`,
    saleId: sale.id,
    folio: sale.folio,
    clientName: sale.clientName || existing?.clientName || 'Cliente Mostrador',
    clientPhone: sale.clientPhone || existing?.clientPhone || '',
    clientEmail: sale.clientEmail || existing?.clientEmail || '',
    schoolName: sale.schoolName || existing?.schoolName || '',
    date: sale.date,
    deliveryDate: existing?.deliveryDate || new Date(Date.now() + 86400000 * 2).toLocaleDateString('es-MX'),
    items: sale.items,
    total: sale.total,
    amountPaid: sale.amountPaid,
    depositAmount: sale.depositAmount,
    remainingAmount: sale.remainingAmount ?? Math.max(0, sale.total - sale.amountPaid),
    paymentMethod: sale.paymentMethod,
    labStatus: existing?.labStatus || 'pendiente',
    urgency: existing?.urgency || (hasRetoque || isSpecial ? 'urgente' : 'normal'),
    notes: sale.notes || existing?.notes || '',
    photoSpecs: sale.photoSpecs || existing?.photoSpecs,
    photos: existing?.photos || [],
    operatorName: sale.operatorName,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedOrders = [workOrder, ...currentOrders.filter((wo) => wo.folio !== sale.folio && wo.id !== workOrder.id)];
  saveStoredWorkOrders(updatedOrders);
  return workOrder;
};

export const updateWorkOrderStatus = (orderIdOrFolio: string, newStatus: LabOrderStatus): WorkOrder[] => {
  const current = getStoredWorkOrders();
  const updated = current.map((wo) => {
    if (wo.id === orderIdOrFolio || wo.folio === orderIdOrFolio) {
      return {
        ...wo,
        labStatus: newStatus,
        updatedAt: new Date().toISOString(),
      };
    }
    return wo;
  });
  saveStoredWorkOrders(updated);
  return updated;
};

export const addClientPhotoToWorkOrder = (orderFolio: string, photo: ClientPhoto): WorkOrder | null => {
  const current = getStoredWorkOrders();
  let targetOrder: WorkOrder | null = null;

  const updated = current.map((wo) => {
    if (wo.folio.toUpperCase() === orderFolio.toUpperCase() || wo.id === orderFolio) {
      const existingPhotos = Array.isArray(wo.photos) ? wo.photos : [];
      const newPhotos = [photo, ...existingPhotos];
      targetOrder = {
        ...wo,
        photos: newPhotos,
        updatedAt: new Date().toISOString(),
      };
      return targetOrder;
    }
    return wo;
  });

  if (targetOrder) {
    saveStoredWorkOrders(updated);
  }
  return targetOrder;
};

export const deleteClientPhotoFromWorkOrder = (orderFolio: string, photoId: string): WorkOrder | null => {
  const current = getStoredWorkOrders();
  let targetOrder: WorkOrder | null = null;

  const updated = current.map((wo) => {
    if (wo.folio.toUpperCase() === orderFolio.toUpperCase() || wo.id === orderFolio) {
      const existingPhotos = Array.isArray(wo.photos) ? wo.photos : [];
      const newPhotos = existingPhotos.filter((p) => p.id !== photoId);
      targetOrder = {
        ...wo,
        photos: newPhotos,
        updatedAt: new Date().toISOString(),
      };
      return targetOrder;
    }
    return wo;
  });

  if (targetOrder) {
    saveStoredWorkOrders(updated);
  }
  return targetOrder;
};

export const getWorkOrderByFolio = (folio: string): WorkOrder | undefined => {
  if (!folio) return undefined;
  const clean = folio.trim().toUpperCase();
  const current = getStoredWorkOrders();
  return current.find((wo) => 
    wo.folio.toUpperCase() === clean || 
    wo.folio.toUpperCase().replace(/[^0-9A-Z]/g, '') === clean.replace(/[^0-9A-Z]/g, '')
  );
};


