export type Role = 'admin' | 'cashier' | 'field' | 'client';

export type Category = string;

export interface CategoryItem {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  notes?: string;
  address?: string;
  updatedAt?: string;
}

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  description?: string;
  unit?: string;
  icon?: string;
  imageUrl?: string;
  isActive?: boolean;
  hasExtras?: boolean;
  defaultRetoquePrice?: number;
  defaultAutoAdheriblePrice?: number;
}

export interface CartItemOption {
  retoque?: boolean;
  retoquePrice?: number;
  autoAdherible?: boolean;
  autoAdheriblePrice?: number;
  notes?: string;
  size?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  category: Category;
  unitPrice: number;
  quantity: number;
  options: CartItemOption;
  totalPrice: number;
}

export type PaymentMethod = 'efectivo' | 'clip' | 'mercadopago' | 'transferencia' | 'stripe';

export interface Sale {
  id: string;
  folio: string;
  date: string;
  role: Role;
  operatorName: string;
  clientName?: string;
  clientPhone?: string;
  schoolName?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  depositAmount?: number;
  remainingAmount?: number;
  status: 'completado' | 'anticipo' | 'liquidado' | 'cancelado';
  notes?: string;
}

export interface School {
  id: string;
  name: string;
  seasonYear: string;
  active: boolean;
  representative?: string;
  phone?: string;
}

export type TerminalId = 'POS-01' | 'POS-02' | 'POS-03' | 'POS-04' | 'POS-05' | 'POS-06' | 'POS-07' | 'POS-08' | 'OFICINA-01';

export interface PaymentRecord {
  id: string;
  date: string;
  concept: string; // 'Anticipo' | 'Abono' | 'Liquidación'
  amount: number;
  balanceAfter: number;
  method: PaymentMethod;
  terminalId?: string;
  operatorName?: string;
  status: 'completado' | 'pendiente_confirmacion' | 'cancelado';
  santanderReference?: string;
  notes?: string;
}

export interface WhatsAppLog {
  id: string;
  date: string;
  type: 'recordatorio' | 'vencimiento' | 'comprobante' | 'datos_bancarios';
  phone: string;
  message: string;
  status: 'enviado';
}

export interface GraduationStudent {
  id: string;
  folio: string;
  schoolId: string;
  schoolName: string;
  seasonYear: string;
  studentName: string;
  matricula?: string;
  grade?: string; // '1°', '2°', '3°', etc.
  group?: string; // 'A', 'B', 'C', etc.
  gradeGroup: string; // '1° A'
  tutorName?: string;
  tutorWhatsapp?: string;
  tutorPhone?: string;
  consentWhatsapp?: boolean;
  avatarUrl?: string;
  packageName: string;
  totalPhotos: number | string;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  santanderReference: string; // e.g. MF-015-000123
  deliveryStatus: 'pendiente' | 'listo' | 'entregado';
  deliveryDate?: string;
  nextDueDate?: string; // '2026-10-20'
  nextDueAmount?: number;
  paymentHistory?: PaymentRecord[];
  whatsappLogs?: WhatsAppLog[];
  contactPhone?: string;
  notes?: string;
  createdAt: string;
}

export interface BankTransferRecord {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  schoolName: string;
  santanderReference: string;
  amount: number;
  status: 'pendiente' | 'confirmado' | 'rechazado';
  terminalId?: string;
  operatorName?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  bankTransactionFolio?: string;
  notes?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  terminalId?: string;
  action: string;
  details: string;
  studentFolio?: string;
}

export interface PaymentGatewayConfig {
  provider: 'clip' | 'mercadopago' | 'stripe' | 'paypal';
  name: string;
  active: boolean;
  apiKey: string;
  terminalId: string;
  commissionPercent: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  syncEnabled: boolean;
  autoSync: boolean;
  lastSyncTime?: string;
}

export interface BrandConfig {
  primaryColor: string;
  secondaryColor: string;
  businessName: string;
  address: string;
  phone: string;
  ticketFooter: string;
  logoUrl: string;
  iconUrl: string;
}

