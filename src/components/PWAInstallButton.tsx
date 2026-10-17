import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'hero' | 'card' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">PWA Instalada</span>
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
      ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[#F97800] hover:bg-[#e06c00] active:scale-95 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F97800]/50'
      : 'flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#F97800] hover:bg-[#e06c00] active:scale-95 rounded-xl shadow-md transition-all';

  return (
    <>
      <button
        onClick={handleInstallClick}
        type="button"
        className={buttonClass}
        title="Instalar POS Fotografía como aplicación"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Instalar App</span>
      </button>

      {/* Installation Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 relative text-slate-800">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              aria-label="Cerrar guía de instalación"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#004C59]/10 flex items-center justify-center p-1.5 border border-[#004C59]/20">
                <img
                  src="https://appdesignproyectos.com/photoicono.png"
                  alt="POS Fotografía Icono"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#004C59]">Instalar POS Fotografía</h3>
                <p className="text-xs text-slate-500">Acceso rápido, pantalla completa y modo offline</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-semibold text-amber-800">
                  <Smartphone className="w-4 h-4" />
                  Instrucciones para iPhone / iPad (Safari):
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700">
                  <li>Toca el botón <strong>Compartir</strong> <span className="font-mono bg-amber-100 px-1 rounded">⎋</span> en la barra inferior de Safari.</li>
                  <li>Desplázate hacia abajo y selecciona <strong>"Agregar al inicio"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.</li>
                  <li>Confirma el nombre <strong>POS Fotografía</strong> y presiona <strong>Agregar</strong>.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 bg-teal-50/70 border border-teal-200 rounded-xl p-4 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-semibold text-[#004C59]">
                  <Monitor className="w-4 h-4" />
                  Instrucciones para Android o PC (Chrome / Edge):
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700">
                  <li>Haz clic en el menú de 3 puntos del navegador (arriba a la derecha).</li>
                  <li>Selecciona la opción <strong>"Instalar POS Fotografía"</strong> o <strong>"Crear acceso directo"</strong>.</li>
                  <li>Marca la casilla <em>"Abrir como ventana"</em> para tener experiencia nativa de escritorio o tablet.</li>
                </ol>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#004C59] text-white font-semibold text-sm rounded-xl hover:bg-[#003842] transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install success toast */}
      {installSuccess && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[#004C59] text-white px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">¡POS Fotografía se ha instalado correctamente!</span>
        </div>
      )}
    </>
  );
};
