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
  User
} from 'lucide-react';

export type ActiveTab = 
  | 'home'
  | 'pos_cashier'
  | 'field_collector'
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
          { id: 'catalogs' as ActiveTab, label: 'Catálogo & Fotos', icon: Layers, color: 'text-indigo-400' },
          { id: 'schools' as ActiveTab, label: 'Gestión Escolar 2026', icon: GraduationCap, color: 'text-teal-400' },
          { id: 'deliveries' as ActiveTab, label: 'Entrega y Liquidación', icon: PackageCheck, color: 'text-emerald-400' },
          { id: 'reports' as ActiveTab, label: 'Reportes y Métricas', icon: BarChart3, color: 'text-amber-400' },
          { id: 'config' as ActiveTab, label: 'Configuración & Pagos', icon: Sliders, color: 'text-slate-400' },
          { id: 'profile' as ActiveTab, label: 'Mi Perfil', icon: User, color: 'text-teal-300' },
          { id: 'home' as ActiveTab, label: 'Resumen General', icon: Home, color: 'text-teal-400' },
        ];
      case 'cashier':
        return [
          { id: 'home' as ActiveTab, label: 'Inicio / Menú', icon: Home, color: 'text-teal-400' },
          { id: 'pos_cashier' as ActiveTab, label: 'Punto de Venta Touch', icon: ShoppingBag, color: 'text-[#F97800]' },
          { id: 'deliveries' as ActiveTab, label: 'Entregas & Liquidación', icon: PackageCheck, color: 'text-emerald-600' },
          { id: 'schools' as ActiveTab, label: 'Alumnos y Paquetes', icon: GraduationCap, color: 'text-[#004C59]' },
          { id: 'history' as ActiveTab, label: 'Historial de Ventas', icon: Receipt, color: 'text-slate-600' },
          { id: 'profile' as ActiveTab, label: 'Mi Perfil', icon: User, color: 'text-teal-300' },
        ];
      case 'field':
        return [
          { id: 'catalogs' as ActiveTab, label: 'Catálogo de Productos', icon: Layers, color: 'text-indigo-400' },
          { id: 'field_collector' as ActiveTab, label: 'Cobro en Campo (Escuelas)', icon: Smartphone, color: 'text-[#004C59]' },
          { id: 'schools' as ActiveTab, label: 'Directorio de Alumnos', icon: Users, color: 'text-teal-600' },
          { id: 'history' as ActiveTab, label: 'Recibos Emitidos', icon: Receipt, color: 'text-[#F97800]' },
          { id: 'profile' as ActiveTab, label: 'Mi Perfil', icon: User, color: 'text-teal-300' },
        ];
      case 'client':
        return [
          { id: 'catalogs' as ActiveTab, label: 'Catálogo de Productos', icon: Layers, color: 'text-[#F97800]' },
          { id: 'profile' as ActiveTab, label: 'Mi Perfil', icon: User, color: 'text-teal-300' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`hidden md:flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Navegación
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition mx-auto"
          title={collapsed ? 'Expandir panel' : 'Contraer panel'}
          aria-label={collapsed ? 'Expandir panel lateral' : 'Contraer panel lateral'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
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
              className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#004C59] text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.color}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Session Section */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition ${
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
