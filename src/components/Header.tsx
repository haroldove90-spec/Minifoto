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
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  currentRole: Role;
  operatorName: string;
  onLogout: () => void;
  onClearSampleData: (cleanCatalogs: boolean) => Promise<{ success: boolean; supabaseDeleted?: boolean }>;
  onRestoreSampleData?: () => void;
  isSampleCleared: boolean;
  logoUrl?: string;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  operatorName,
  onLogout,
  onClearSampleData,
  onRestoreSampleData,
  isSampleCleared,
  logoUrl = 'https://appdesignproyectos.com/photologo.png',
}) => {
  const isOnline = useOnlineStatus();
  const [showClearModal, setShowClearModal] = useState(false);
  const [includeCatalogs, setIncludeCatalogs] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const roleLabels: Record<Role, { title: string; color: string; icon: React.ReactNode }> = {
    admin: {
      title: 'Administrador (Uriel)',
      color: 'bg-teal-700/10 text-[#004C59] border-teal-600/30',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    cashier: {
      title: 'Cajero de Oficina (Mostrador)',
      color: 'bg-orange-500/10 text-[#F97800] border-orange-500/30',
      icon: <Store className="w-3.5 h-3.5" />,
    },
    field: {
      title: 'Cobrador en Campo (Móvil)',
      color: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30',
      icon: <Smartphone className="w-3.5 h-3.5" />,
    },
    client: {
      title: 'Cliente (Catálogo Digital)',
      color: 'bg-orange-500/10 text-[#F97800] border-orange-500/30',
      icon: <Store className="w-3.5 h-3.5" />,
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-13 sm:h-18 flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Unencapsulated Full-Size Logo as requested */}
          <div className="flex items-center gap-2 shrink-0">
            <img
              src={logoUrl || 'https://appdesignproyectos.com/photologo.png'}
              alt="POS Fotografía"
              className="h-8 sm:h-12 md:h-14 w-auto object-contain max-w-[130px] sm:max-w-[210px] md:max-w-[260px]"
            />
          </div>

          {/* Active Role Identification Badge */}
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${roleLabels[currentRole].color}`}>
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

          {/* Actions: Install PWA + Clear Sample Data + Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Clear Sample Data Button */}
            <button
              onClick={() => setShowClearModal(true)}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-lg border border-rose-200 transition-colors"
              title="Borrar datos de muestra del sistema"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span className="hidden lg:inline">Borrar Datos Demo</span>
            </button>

            {/* If sample data was cleared, allow restoring it if desired */}
            {isSampleCleared && onRestoreSampleData && (
              <button
                onClick={onRestoreSampleData}
                type="button"
                className="hidden xl:flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                title="Recargar datos demo para pruebas"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Demo</span>
              </button>
            )}

            {/* Logout / Switch Role */}
            <button
              onClick={onLogout}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg transition-colors border border-slate-300"
              title="Cerrar sesión y cambiar de rol"
            >
              <LogOut className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Cambiar Rol</span>
            </button>
          </div>
        </div>

        {/* Mobile active role subtitle banner */}
        <div className="sm:hidden px-2.5 py-0.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
          <span className="font-semibold flex items-center gap-1 text-[#004C59] truncate max-w-[200px]">
            {roleLabels[currentRole].icon} {roleLabels[currentRole].title}
          </span>
          <span className="text-slate-500 font-mono text-[9px] shrink-0">{operatorName}</span>
        </div>
      </header>

      {/* Confirmation Modal: Clear Sample Data */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">¿Borrar datos de muestra del sistema?</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Esta acción borrará los alumnos de ejemplo, ventas y pedidos registrados para pruebas. Se guardará la configuración en su navegador para que <strong>los datos de muestra no vuelvan a aparecer</strong> nunca más.
            </p>

            <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCatalogs}
                  onChange={(e) => setIncludeCatalogs(e.target.checked)}
                  className="rounded border-slate-300 text-[#004C59] focus:ring-[#004C59] w-4 h-4"
                />
                <span>También vaciar catálogo de productos y precios (empezar desde cero)</span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6.5">
                (Si está desmarcado, se conservará la lista de servicios: Fotos infantiles, Ampliaciones, Six Party, etc., para que no tenga que crearlos de nuevo).
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
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 bg-[#004C59] text-white px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-top text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
