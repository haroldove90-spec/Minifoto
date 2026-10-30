import React from 'react';
import { Role } from '../types';
import { 
  ShoppingBag, 
  Layers, 
  GraduationCap, 
  PackageCheck, 
  BarChart3, 
  Sliders, 
  Smartphone, 
  Receipt, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Home,
  User,
  Camera,
  Tag,
  DollarSign
} from 'lucide-react';

export type ActiveTab = 
  | 'home'
  | 'pos_cashier'
  | 'price_list'
  | 'work_orders'
  | 'field_collector'
  | 'tablet_pos'
  | 'deliveries'
  | 'catalogs'
  | 'schools'
  | 'reports'
  | 'config'
  | 'history'
  | 'profile';

interface SidebarProps {
  currentRole: Role;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onLogout,
}) => {
  // Navigation items specific to active role
  const getNavItems = () => {
    switch (currentRole) {
      case 'admin':
        return [
          { id: 'work_orders' as ActiveTab, label: 'Órdenes de Trabajo & Fotos', icon: Camera, color: 'text-[#ECB769]' },
          { id: 'pos_cashier' as ActiveTab, label: 'Punto de Venta Touch (POS)', icon: ShoppingBag, color: 'text-[#ECB769]' },
          { id: 'price_list' as ActiveTab, label: 'Lista de Precios Oficial', icon: Tag, color: 'text-[#ECB769]' },
          { id: 'tablet_pos' as ActiveTab, label: 'Cobranza Escolar (8 Tablets)', icon: Smartphone, color: 'text-[#ECB769]' },
          { id: 'schools' as ActiveTab, label: 'Gestión Escolar & Alumnos', icon: GraduationCap, color: 'text-[#FFF3BC]' },
          { id: 'catalogs' as ActiveTab, label: 'Catálogo & Fotos', icon: Layers, color: 'text-[#ECB769]' },
          { id: 'deliveries' as ActiveTab, label: 'Entrega y Liquidación', icon: PackageCheck, color: 'text-[#ECB769]' },
          { id: 'reports' as ActiveTab, label: 'Reportes y Métricas', icon: BarChart3, color: 'text-[#ECB769]' },
          { id: 'config' as ActiveTab, label: 'Configuración & Terminales', icon: Sliders, color: 'text-slate-300' },
          { id: 'profile' as ActiveTab, label: 'Mi Perfil', icon: User, color: 'text-[#FFF3BC]' },
          { id: 'home' as ActiveTab, label: 'Resumen General', icon: Home, color: 'text-[#ECB769]' },
        ];
      case 'cashier':
        return [
          { id: 'pos_cashier' as ActiveTab, label: 'POS (Productos & Calculadora)', icon: ShoppingBag, color: 'text-[#ECB769]' },
          { id: 'work_orders' as ActiveTab, label: 'Órdenes de Trabajo & Fotos', icon: Camera, color: 'text-[#ECB769]' },
          { id: 'tablet_pos' as ActiveTab, label: 'Cobranza Escolar (Oficinas)', icon: Smartphone, color: 'text-[#ECB769]' },
          { id: 'schools' as ActiveTab, label: 'Alumnos y Padrón Escolar', icon: GraduationCap, color: 'text-[#ECB769]' },
          { id: 'deliveries' as ActiveTab, label: 'Entregas & Liquidación', icon: PackageCheck, color: 'text-[#FFF3BC]' },
          { id: 'history' as ActiveTab, label: 'Historial de Cobros', icon: Receipt, color: 'text-slate-300' },
          { id: 'profile' as ActiveTab, label: 'Mi Perfil', icon: User, color: 'text-[#FFF3BC]' },
        ];
      case 'impresor':
        return [
          { id: 'work_orders' as ActiveTab, label: 'Órdenes de Trabajo & Escáner', icon: Camera, color: 'text-[#ECB769]' },
          { id: 'profile' as ActiveTab, label: 'Mi Perfil', icon: User, color: 'text-[#FFF3BC]' },
        ];
      case 'laboratorio':
        return [
          { id: 'work_orders' as ActiveTab, label: 'Órdenes de Trabajo & Fotos', icon: Camera, color: 'text-[#ECB769]' },
          { id: 'deliveries' as ActiveTab, label: 'Entregas & Liquidación', icon: PackageCheck, color: 'text-[#FFF3BC]' },
          { id: 'schools' as ActiveTab, label: 'Alumnos y Padrón', icon: GraduationCap, color: 'text-[#ECB769]' },
          { id: 'catalogs' as ActiveTab, label: 'Catálogo de Productos', icon: Layers, color: 'text-[#ECB769]' },
          { id: 'profile' as ActiveTab, label: 'Mi Perfil', icon: User, color: 'text-[#FFF3BC]' },
        ];
      case 'field':
        return [
          { id: 'tablet_pos' as ActiveTab, label: 'Cobro en Tablet (POS)', icon: Smartphone, color: 'text-[#ECB769]' },
          { id: 'schools' as ActiveTab, label: 'Directorio de Alumnos', icon: Users, color: 'text-[#FFF3BC]' },
          { id: 'catalogs' as ActiveTab, label: 'Catálogo de Productos', icon: Layers, color: 'text-[#ECB769]' },
          { id: 'history' as ActiveTab, label: 'Recibos Emitidos', icon: Receipt, color: 'text-[#ECB769]' },
          { id: 'profile' as ActiveTab, label: 'Mi Perfil', icon: User, color: 'text-[#FFF3BC]' },
        ];
      case 'client':
        return [
          { id: 'catalogs' as ActiveTab, label: 'Catálogo de Productos', icon: Layers, color: 'text-[#ECB769]' },
          { id: 'profile' as ActiveTab, label: 'Mi Perfil', icon: User, color: 'text-[#FFF3BC]' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#202020] text-slate-200 border-r border-[#333333] transition-all duration-300 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Header */}
      <div className="p-3.5 border-b border-[#333333] flex items-center justify-between">
        {!collapsed && (
          <span className="text-xs font-bold uppercase tracking-wider text-[#ECB769]">
            Navegación
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-[#2c2c2c] text-slate-300 hover:text-white transition mx-auto cursor-pointer"
          title={collapsed ? 'Expandir panel' : 'Contraer panel'}
          aria-label={collapsed ? 'Expandir panel lateral' : 'Contraer panel lateral'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5 text-[#ECB769]" /> : <ChevronLeft className="w-5 h-5 text-[#ECB769]" />}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-2.5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#4E2B01] text-[#FFF3BC] border border-[#ECB769]/60 shadow-md'
                  : 'text-slate-300 hover:bg-[#2c2c2c] hover:text-[#FFF3BC]'
              } ${collapsed ? 'justify-center' : ''}`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#ECB769]' : item.color}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Session Section */}
      <div className="p-3 border-t border-[#333333] space-y-2">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-[#ECB769] hover:bg-[#2c2c2c] transition cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Cambiar de Rol / Salir"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
          {!collapsed && <span>Cambiar de Rol</span>}
        </button>
      </div>
    </aside>
  );
};
