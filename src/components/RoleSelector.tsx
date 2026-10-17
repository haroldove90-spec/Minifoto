import React from 'react';
import { Role } from '../types';
import { ShieldCheck, Store, Smartphone, ShoppingBag } from 'lucide-react';

interface RoleSelectorProps {
  onSelectRole: (role: Role, operatorName: string) => void;
  brandLogo: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole, brandLogo }) => {
  const rolesList: {
    id: Role;
    name: string;
    operator: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'admin',
      name: 'Administrador / Dueño',
      operator: 'Uriel',
      icon: <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-[#004C59]" />,
      color: 'border-teal-700/30 hover:border-[#004C59]',
    },
    {
      id: 'cashier',
      name: 'Cajero de Oficina',
      operator: 'Cajero Mostrador',
      icon: <Store className="w-10 h-10 sm:w-12 sm:h-12 text-[#F97800]" />,
      color: 'border-orange-500/30 hover:border-[#F97800]',
    },
    {
      id: 'field',
      name: 'Cobrador / Vendedor en Campo',
      operator: 'Vendedor Móvil',
      icon: <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 text-[#004C59]" />,
      color: 'border-teal-700/30 hover:border-[#004C59]',
    },
    {
      id: 'client',
      name: 'Cliente (Catálogo)',
      operator: 'Cliente Invitado',
      icon: <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-[#F97800]" />,
      color: 'border-orange-500/30 hover:border-[#F97800]',
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-slate-50 to-slate-200 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 select-none">
      {/* Central branding with unencapsulated full-size logo */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-6 sm:mb-10 text-center">
        <img
          src={brandLogo || 'https://appdesignproyectos.com/photologo.png'}
          alt="POS Fotografía Logo"
          className="h-16 sm:h-20 md:h-24 max-w-full object-contain drop-shadow-sm mb-3"
        />
        <div className="h-1 w-20 bg-[#F97800] rounded-full"></div>
      </div>

      {/* Grid: 2 columns on mobile, 4 columns on desktop as requested */}
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {rolesList.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => onSelectRole(item.id, item.operator)}
              className={`group bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md hover:shadow-xl hover:-translate-y-1.5 active:translate-y-0 transition-all duration-200 border-2 ${item.color} flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px] sm:min-h-[200px] md:min-h-[220px]`}
            >
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform duration-200 flex items-center justify-center">
                {item.icon}
              </div>
              {/* Only Role Name as requested: 'Sin header, sin descripciones, solo nombre del rol' */}
              <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-800 group-hover:text-[#004C59] transition-colors leading-snug">
                {item.name}
              </h2>
            </button>
          ))}
        </div>
      </div>

      {/* Subtle indicator bottom */}
      <div className="mt-8 text-center text-xs text-slate-600 font-medium">
        Selecciona un rol para ingresar al sistema
      </div>
    </div>
  );
};
