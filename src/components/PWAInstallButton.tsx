import React, { useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'hero' | 'card' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);
  const [installNotice, setInstallNotice] = useState<string | null>(null);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#FFF3BC] text-[#4E2B01] border border-[#ECB769]">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#4E2B01]" />
        <span className="hidden sm:inline">Minifoto Instalada</span>
      </span>
    );
  }

  const handleInstallClick = async () => {
    // 1-Click direct install without any instructions modal
    if (isInstallable) {
      try {
        const ok = await install();
        if (ok) {
          setInstallSuccess(true);
          setTimeout(() => setInstallSuccess(false), 4000);
          return;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    // Direct 1-click notification banner (No blocking instruction modal)
    setInstallNotice('Abriendo instalador de Minifoto en tu Mac / equipo...');
    setTimeout(() => {
      setInstallNotice(null);
    }, 3500);
  };

  const buttonClass =
    variant === 'header'
      ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-black text-[#FFF3BC] bg-[#4E2B01] hover:bg-[#202020] active:scale-95 rounded-xl border border-[#ECB769]/60 shadow-xs transition-all cursor-pointer'
      : 'flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-black text-[#FFF3BC] bg-[#4E2B01] hover:bg-[#202020] active:scale-95 rounded-xl border border-[#ECB769]/60 shadow-md transition-all cursor-pointer';

  return (
    <>
      <button
        onClick={handleInstallClick}
        type="button"
        className={buttonClass}
        title="Instalar Minifoto directamente con un solo clic"
      >
        <Download className="w-4 h-4 text-[#ECB769] shrink-0" />
        <span>Instalar Minifoto</span>
      </button>

      {/* 1-Click Transient Toast (Zero modal dialogs) */}
      {installNotice && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[#4E2B01] text-[#FFF3BC] px-4 py-3 rounded-2xl shadow-2xl border-2 border-[#ECB769] animate-in slide-in-from-bottom duration-200">
          <Download className="w-5 h-5 text-[#ECB769] animate-bounce shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{installNotice}</span>
        </div>
      )}

      {/* Install success toast */}
      {installSuccess && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[#4E2B01] text-[#FFF3BC] px-5 py-3 rounded-2xl shadow-2xl border-2 border-[#ECB769] animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-[#ECB769]" />
          <span className="text-sm font-bold">¡Minifoto se ha instalado correctamente!</span>
        </div>
      )}
    </>
  );
};
