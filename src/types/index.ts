export type Role = 'admin' | 'cashier' | 'field';

export type Category = 
  | 'foto_estudio'
  | 'iglesias'
  | 'ampliaciones'
  | 'minilab'
  | 'fotoacabado'
  | 'salon_seis_party'
  | 'fuente_sodas'
  | 'graduaciones';

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

export interface GraduationStudent {
  id: string;
  folio: string;
  schoolId: string;
  schoolName: string;
  seasonYear: string;
  studentName: string;
  gradeGroup: string;
  packageName: string;
  totalPhotos: number | string;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  deliveryStatus: 'pendiente' | 'listo' | 'entregado';
  deliveryDate?: string;
  contactPhone?: string;
  notes?: string;
  createdAt: string;
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
