import React from 'react';
import { Role } from '../types';
import { ActiveTab } from './Sidebar';
import { 
  ShoppingBag, 
  PackageCheck, 
  GraduationCap, 
  Layers, 
  BarChart3, 
  Sliders, 
  Smartphone, 
  Receipt,
  User,
  Camera
} from 'lucide-react';

interface BottomBarProps {
  currentRole: Role;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
}) => {
  const getTabs = () => {
    switch (currentRole) {
      case 'admin':
        return [
          { id: 'work_orders' as ActiveTab, label: 'Órdenes', icon: Camera },
          { id: 'tablet_pos' as ActiveTab, label: 'Cobranza', icon: Smartphone },
          { id: 'schools' as ActiveTab, label: 'Escuelas', icon: GraduationCap },
          { id: 'catalogs' as ActiveTab, label: 'Catálogo', icon: Layers },
          { id: 'reports' as ActiveTab, label: 'Reportes', icon: BarChart3 },
          { id: 'profile' as ActiveTab, label: 'Perfil', icon: User },
        ];
      case 'cashier':
        return [
          { id: 'pos_cashier' as ActiveTab, label: 'POS', icon: ShoppingBag },
          { id: 'work_orders' as ActiveTab, label: 'Órdenes', icon: Camera },
          { id: 'tablet_pos' as ActiveTab, label: 'Cobranza', icon: Smartphone },
          { id: 'schools' as ActiveTab, label: 'Alumnos', icon: GraduationCap },
          { id: 'deliveries' as ActiveTab, label: 'Entregas', icon: PackageCheck },
          { id: 'profile' as ActiveTab, label: 'Perfil', icon: User },
        ];
      case 'laboratorio':
        return [
          { id: 'work_orders' as ActiveTab, label: 'Órdenes', icon: Camera },
          { id: 'deliveries' as ActiveTab, label: 'Entregas', icon: PackageCheck },
          { id: 'schools' as ActiveTab, label: 'Alumnos', icon: GraduationCap },
          { id: 'profile' as ActiveTab, label: 'Perfil', icon: User },
        ];
      case 'field':
        return [
          { id: 'tablet_pos' as ActiveTab, label: 'Cobro Tablet', icon: Smartphone },
          { id: 'schools' as ActiveTab, label: 'Alumnos', icon: GraduationCap },
          { id: 'catalogs' as ActiveTab, label: 'Catálogo', icon: Layers },
          { id: 'profile' as ActiveTab, label: 'Perfil', icon: User },
        ];
      case 'client':
        return [
          { id: 'catalogs' as ActiveTab, label: 'Catálogo', icon: Layers },
          { id: 'profile' as ActiveTab, label: 'Perfil', icon: User },
        ];
    }
  };

  const tabs = getTabs();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 transition-all active:scale-95 ${
                isActive
                  ? 'text-[#4E2B01] font-black'
                  : 'text-slate-500 hover:text-[#4E2B01] font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-[#FFF3BC] text-[#4E2B01] border border-[#ECB769]/50' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-[#4E2B01]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[10px] leading-tight mt-0.5 truncate max-w-[64px] ${isActive ? 'font-black text-[#4E2B01]' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
