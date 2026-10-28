import React from 'react';
import { Role } from '../types';
import { ShieldCheck, Store, Smartphone, ShoppingBag, FlaskConical } from 'lucide-react';

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
      icon: <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-[#4E2B01]" />,
      color: 'border-[#4E2B01]/30 hover:border-[#4E2B01]',
    },
    {
      id: 'cashier',
      name: 'Cajero de Oficina (POS)',
      operator: 'Cajero Mostrador',
      icon: <Store className="w-10 h-10 sm:w-12 sm:h-12 text-[#ECB769]" />,
      color: 'border-[#ECB769]/50 hover:border-[#ECB769]',
    },
    {
      id: 'laboratorio',
      name: 'Laboratorio (Órdenes & Fotos)',
      operator: 'Técnico Laboratorio',
      icon: <FlaskConical className="w-10 h-10 sm:w-12 sm:h-12 text-[#4E2B01]" />,
      color: 'border-[#4E2B01]/40 hover:border-[#4E2B01]',
    },
    {
      id: 'field',
      name: 'Cobrador / Ventas en Campo',
      operator: 'Vendedor Móvil',
      icon: <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 text-[#4E2B01]" />,
      color: 'border-[#4E2B01]/30 hover:border-[#4E2B01]',
    },
    {
      id: 'client',
      name: 'Cliente (Catálogo)',
      operator: 'Cliente Invitado',
      icon: <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-[#202020]" />,
      color: 'border-[#ECB769]/50 hover:border-[#4E2B01]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FCF9F2] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 select-none">
      {/* Central branding with unencapsulated full-size logo */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-6 sm:mb-10 text-center">
        <img
          src={brandLogo || 'https://xqggdnoxvskotwlcuwgd.supabase.co/storage/v1/object/public/logo/minifotologo.png'}
          alt="Minifoto Logo"
          className="h-16 sm:h-24 md:h-28 max-w-full object-contain drop-shadow-sm mb-3"
        />
        <div className="h-1.5 w-24 bg-[#ECB769] rounded-full"></div>
      </div>

      {/* Grid: 2 columns on mobile, 5 columns on desktop */}
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {rolesList.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => onSelectRole(item.id, item.operator)}
              className={`group bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md hover:shadow-2xl hover:-translate-y-1.5 active:translate-y-0 transition-all duration-200 border-2 ${item.color} flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px] sm:min-h-[200px] md:min-h-[220px]`}
            >
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl bg-[#FCF9F2] group-hover:scale-110 transition-transform duration-200 flex items-center justify-center border border-[#ECB769]/30">
                {item.icon}
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-black text-[#202020] group-hover:text-[#4E2B01] transition-colors leading-snug">
                {item.name}
              </h2>
            </button>
          ))}
        </div>
      </div>

      {/* Subtle indicator bottom */}
      <div className="mt-8 text-center text-xs text-[#4E2B01] font-bold">
        Selecciona un rol para ingresar al sistema Minifoto
      </div>
    </div>
  );
};
