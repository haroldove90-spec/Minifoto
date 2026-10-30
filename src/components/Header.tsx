import React, { useState } from 'react';
import { Role } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { 
  LogOut, 
  Trash2, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Store, 
  Smartphone, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  User,
  FlaskConical,
  Printer
} from 'lucide-react';
import { getStoredUserProfile } from '../services/storage';

interface HeaderProps {
  currentRole: Role;
  operatorName: string;
  onLogout: () => void;
  onClearSampleData: (cleanCatalogs: boolean) => Promise<{ success: boolean; supabaseDeleted?: boolean }>;
  onRestoreSampleData?: () => void;
  isSampleCleared: boolean;
  logoUrl?: string;
  onToggleSidebar?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  operatorName,
  onLogout,
  onClearSampleData,
  onRestoreSampleData,
  isSampleCleared,
  logoUrl = 'https://xqggdnoxvskotwlcuwgd.supabase.co/storage/v1/object/public/logo/minifotologo.png',
  onOpenProfile,
}) => {
  const profile = getStoredUserProfile(currentRole);
  const isOnline = useOnlineStatus();
  const [showClearModal, setShowClearModal] = useState(false);
  const [includeCatalogs, setIncludeCatalogs] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const roleLabels: Record<Role, { title: string; color: string; icon: React.ReactNode }> = {
    admin: {
      title: 'Administrador (Uriel)',
      color: 'bg-[#4E2B01]/10 text-[#4E2B01] border-[#4E2B01]/30',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-[#4E2B01]" />,
    },
    cashier: {
      title: 'Cajero de Oficina (Mostrador)',
      color: 'bg-[#ECB769]/20 text-[#4E2B01] border-[#ECB769]/50',
      icon: <Store className="w-3.5 h-3.5 text-[#4E2B01]" />,
    },
    field: {
      title: 'Cobrador en Campo (Móvil)',
      color: 'bg-[#FFF3BC] text-[#4E2B01] border-[#ECB769]/40',
      icon: <Smartphone className="w-3.5 h-3.5 text-[#4E2B01]" />,
    },
    client: {
      title: 'Cliente (Catálogo Digital)',
      color: 'bg-[#202020]/10 text-[#202020] border-[#202020]/30',
      icon: <Store className="w-3.5 h-3.5 text-[#202020]" />,
    },
    laboratorio: {
      title: 'Laboratorio (Técnico de Revelado)',
      color: 'bg-[#FFF3BC] text-[#4E2B01] border-[#4E2B01]',
      icon: <FlaskConical className="w-3.5 h-3.5 text-[#4E2B01]" />,
    },
    impresor: {
      title: 'Impresor (Órdenes & Escáner)',
      color: 'bg-[#FFF3BC] text-[#4E2B01] border-[#4E2B01]',
      icon: <Printer className="w-3.5 h-3.5 text-[#4E2B01]" />,
    },
  };

  const handleConfirmClear = async () => {
    setIsDeleting(true);
    try {
      const res = await onClearSampleData(includeCatalogs);
      setShowClearModal(false);
      const msg = res.supabaseDeleted
        ? '¡Datos de muestra y registros de Supabase borrados permanentemente!'
        : '¡Datos de muestra borrados! El navegador no volverá a mostrarlos.';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      setToastMessage('Error al borrar datos');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Header con Pantone Oficial #FCF9F2 */}
      <header className="sticky top-0 z-40 bg-[#FCF9F2] border-b border-[#ECB769]/30 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo Minifoto Tamaño Completo - Sin encapsular */}
          <div className="flex items-center shrink-0 py-1">
            <img
              src={logoUrl || 'https://xqggdnoxvskotwlcuwgd.supabase.co/storage/v1/object/public/logo/minifotologo.png'}
              alt="Minifoto"
              className="h-10 sm:h-14 md:h-16 w-auto object-contain max-h-16 max-w-[170px] sm:max-w-[260px] md:max-w-[320px]"
            />
          </div>

          {/* Active Role Identification Badge */}
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border shadow-xs ${roleLabels[currentRole].color}`}>
              {roleLabels[currentRole].icon}
              <span className="truncate max-w-[170px] lg:max-w-none">
                {roleLabels[currentRole].title}
              </span>
            </div>

            {/* Offline/Online status badge */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${
                isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'
              }`}
              title={isOnline ? 'Conexión activa' : 'Modo Offline - Datos almacenados localmente'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden md:inline">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Actions: Mi Perfil + Install PWA + Clear Sample Data + Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Mi Perfil Button */}
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FFF3BC] bg-[#4E2B01] hover:bg-[#381f01] active:scale-95 rounded-xl border border-[#ECB769] transition-all cursor-pointer shadow-xs"
                title="Ver y editar Mi Perfil (foto y datos)"
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={operatorName}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-[#ECB769]"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#ECB769]" />
                )}
                <span className="hidden sm:inline">Mi Perfil</span>
              </button>
            )}

            {/* Quick PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Clear Sample Data Button */}
            <button
              onClick={() => setShowClearModal(true)}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-xl border border-rose-200 transition-colors"
              title="Borrar datos de muestra del sistema"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span className="hidden lg:inline">Borrar Demo</span>
            </button>

            {/* If sample data was cleared, allow restoring it if desired */}
            {isSampleCleared && onRestoreSampleData && (
              <button
                onClick={onRestoreSampleData}
                type="button"
                className="hidden xl:flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-[#202020] bg-[#FFF3BC] hover:bg-[#faeab0] rounded-xl border border-[#ECB769]/50 transition"
                title="Recargar datos demo para pruebas"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#4E2B01]" />
                <span>Restaurar Demo</span>
              </button>
            )}

            {/* Logout / Switch Role */}
            <button
              onClick={onLogout}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-[#4E2B01] bg-white hover:bg-[#FFF3BC]/50 active:scale-95 rounded-xl transition-colors border border-[#ECB769]/60 shadow-2xs"
              title="Cerrar sesión y cambiar de rol"
            >
              <LogOut className="w-4 h-4 text-[#4E2B01]" />
              <span className="hidden sm:inline">Cambiar Rol</span>
            </button>
          </div>
        </div>

        {/* Mobile active role subtitle banner */}
        <div className="sm:hidden px-3 py-1 bg-[#FCF9F2] border-t border-[#ECB769]/30 flex items-center justify-between text-[10px] text-[#202020]">
          <span className="font-bold flex items-center gap-1 text-[#4E2B01] truncate max-w-[200px]">
            {roleLabels[currentRole].icon} {roleLabels[currentRole].title}
          </span>
          <span className="text-[#4E2B01] font-mono text-[9px] shrink-0 font-bold">{operatorName}</span>
        </div>
      </header>

      {/* Confirmation Modal: Clear Sample Data */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-[#4E2B01] text-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">¿Borrar datos de muestra del sistema?</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Esta acción borrará los alumnos de ejemplo, ventas y pedidos registrados para pruebas. Se guardará la configuración en su navegador para que <strong>los datos de muestra no vuelvan a aparecer</strong> nunca más.
            </p>

            <div className="mb-5 bg-[#FCF9F2] border border-[#ECB769]/40 rounded-2xl p-3.5 space-y-2">
              <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCatalogs}
                  onChange={(e) => setIncludeCatalogs(e.target.checked)}
                  className="rounded border-slate-300 text-[#4E2B01] focus:ring-[#4E2B01] w-4 h-4"
                />
                <span>También vaciar catálogo de productos y precios (empezar desde cero)</span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6.5">
                (Si está desmarcado, se conservará la lista de servicios para no tener que crearlos de nuevo).
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-sm font-bold rounded-xl transition shadow-md"
              >
                {isDeleting ? 'Borrando...' : 'Confirmar y Borrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 bg-[#4E2B01] text-[#FFF3BC] px-4 py-3 rounded-2xl shadow-xl border border-[#ECB769] animate-in slide-in-from-top text-xs sm:text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-[#ECB769] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
