import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'hero' | 'card' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-[#FFF3BC] text-[#4E2B01] border border-[#ECB769]">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#4E2B01]" />
        <span className="hidden sm:inline">Minifoto Instalada</span>
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowGuide(true);
    }
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
        title="Instalar Minifoto como aplicación nativa"
      >
        <Download className="w-4 h-4 text-[#ECB769] shrink-0" />
        <span>Instalar Minifoto</span>
      </button>

      {/* Installation Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-[#ECB769] relative text-[#202020]">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#4E2B01] rounded-full hover:bg-[#FFF3BC]/50 transition cursor-pointer"
              aria-label="Cerrar guía de instalación"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3BC] flex items-center justify-center p-1.5 border border-[#ECB769]">
                <img
                  src="https://xqggdnoxvskotwlcuwgd.supabase.co/storage/v1/object/public/logo/minifotoicono.png"
                  alt="Minifoto Icono"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#4E2B01]">Instalar Minifoto</h3>
                <p className="text-xs text-[#202020]/70 font-medium">Acceso rápido, pantalla completa y modo offline</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 bg-[#FCF9F2] border border-[#ECB769]/40 rounded-2xl p-4 text-sm text-[#202020]">
                <div className="flex items-center gap-2 font-bold text-[#4E2B01]">
                  <Smartphone className="w-4 h-4 text-[#ECB769]" />
                  Instrucciones para iPhone / iPad (Safari):
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#202020]/80">
                  <li>Toca el botón <strong>Compartir</strong> <span className="font-mono bg-[#FFF3BC] px-1 rounded text-[#4E2B01]">⎋</span> en la barra inferior de Safari.</li>
                  <li>Desplázate hacia abajo y selecciona <strong>"Agregar al inicio"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.</li>
                  <li>Confirma el nombre <strong>Minifoto</strong> y presiona <strong>Agregar</strong>.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 bg-[#FCF9F2] border border-[#ECB769]/40 rounded-2xl p-4 text-sm text-[#202020]">
                <div className="flex items-center gap-2 font-bold text-[#4E2B01]">
                  <Monitor className="w-4 h-4 text-[#ECB769]" />
                  Instrucciones para Android o PC (Chrome / Edge):
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#202020]/80">
                  <li>Haz clic en el menú de 3 puntos del navegador (arriba a la derecha).</li>
                  <li>Selecciona la opción <strong>"Instalar Minifoto"</strong> o <strong>"Crear acceso directo"</strong>.</li>
                  <li>Marca la casilla <em>"Abrir como ventana"</em> para tener experiencia nativa de escritorio o tablet.</li>
                </ol>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#4E2B01] text-[#FFF3BC] font-black text-sm rounded-xl hover:bg-[#202020] transition cursor-pointer border border-[#ECB769]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install success toast */}
      {installSuccess && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[#4E2B01] text-[#FFF3BC] px-5 py-3 rounded-2xl shadow-xl border-2 border-[#ECB769] animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-[#ECB769]" />
          <span className="text-sm font-bold">¡Minifoto se ha instalado correctamente!</span>
        </div>
      )}
    </>
  );
};
