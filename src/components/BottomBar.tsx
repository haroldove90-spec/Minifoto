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
  Receipt 
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
          { id: 'pos_cashier' as ActiveTab, label: 'POS Touch', icon: ShoppingBag },
          { id: 'deliveries' as ActiveTab, label: 'Entregas', icon: PackageCheck },
          { id: 'schools' as ActiveTab, label: 'Escuelas', icon: GraduationCap },
          { id: 'catalogs' as ActiveTab, label: 'Catálogos', icon: Layers },
          { id: 'reports' as ActiveTab, label: 'Reportes', icon: BarChart3 },
          { id: 'config' as ActiveTab, label: 'Ajustes', icon: Sliders },
        ];
      case 'cashier':
        return [
          { id: 'pos_cashier' as ActiveTab, label: 'POS Touch', icon: ShoppingBag },
          { id: 'deliveries' as ActiveTab, label: 'Entregas', icon: PackageCheck },
          { id: 'schools' as ActiveTab, label: 'Alumnos', icon: GraduationCap },
          { id: 'history' as ActiveTab, label: 'Ventas', icon: Receipt },
        ];
      case 'field':
        return [
          { id: 'field_collector' as ActiveTab, label: 'Cobro Campo', icon: Smartphone },
          { id: 'history' as ActiveTab, label: 'Recibos', icon: Receipt },
          { id: 'schools' as ActiveTab, label: 'Alumnos', icon: GraduationCap },
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
                  ? 'text-[#004C59] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-[#004C59]/10 text-[#004C59]' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[10px] leading-tight mt-0.5 truncate max-w-[64px] ${isActive ? 'font-bold text-[#004C59]' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
