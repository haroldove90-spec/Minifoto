import React, { useState } from 'react';
import { 
  Download, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Monitor, 
  Laptop, 
  X, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'hero' | 'card' }> = ({ variant = 'header' }) => {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isMac, 
    isWindows, 
    isInIframe, 
    browserName, 
    install 
  } = usePWAInstall();

  const [showModal, setShowModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // If already running standalone / installed PWA
  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="hidden sm:inline">Minifoto Instalada</span>
      </span>
    );
  }

  const handleButtonClick = async () => {
    // If the browser provides a direct native beforeinstallprompt, trigger it directly!
    if (isInstallable) {
      try {
        const result = await install();
        if (result === 'accepted') {
          setInstallSuccess(true);
          setTimeout(() => setInstallSuccess(false), 5000);
          return;
        } else if (result === 'dismissed') {
          return;
        }
      } catch (err) {
        console.warn('Install trigger error:', err);
      }
    }

    // If native prompt is not directly available (e.g. running in iframe, Mac Safari, or Chrome address-bar mode),
    // open the guided install assistant with 1-click open standalone window & platform instructions.
    setShowModal(true);
  };

  const handleOpenStandaloneWindow = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = window.location.href;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    } catch {
      // Fallback
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  const buttonClass =
    variant === 'header'
      ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-black text-[#FFF3BC] bg-[#4E2B01] hover:bg-[#381f01] active:scale-95 rounded-xl border border-[#ECB769]/60 shadow-xs transition-all cursor-pointer'
      : 'flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-black text-[#FFF3BC] bg-[#4E2B01] hover:bg-[#381f01] active:scale-95 rounded-xl border border-[#ECB769]/60 shadow-md transition-all cursor-pointer';

  return (
    <>
      <button
        onClick={handleButtonClick}
        type="button"
        className={buttonClass}
        title="Instalar Minifoto en tu computadora (Windows / Mac) o dispositivo móvil"
      >
        <Download className="w-4 h-4 text-[#ECB769] shrink-0" />
        <span>Instalar Minifoto</span>
      </button>

      {/* Success Notification */}
      {installSuccess && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[#4E2B01] text-[#FFF3BC] px-5 py-3 rounded-2xl shadow-2xl border-2 border-[#ECB769] animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">¡Minifoto se ha instalado correctamente en tu equipo!</span>
        </div>
      )}

      {/* Interactive Install Assistant Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#FCF9F2] rounded-2xl shadow-2xl border-2 border-[#ECB769] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#4E2B01] text-[#FFF3BC] px-5 py-4 flex items-center justify-between border-b border-[#ECB769]/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF3BC] p-1 flex items-center justify-center shadow-xs">
                  <img
                    src="https://xqggdnoxvskotwlcuwgd.supabase.co/storage/v1/object/public/logo/minifotoicono.png"
                    alt="Minifoto Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#FFF3BC] leading-tight">
                    Instalar Minifoto en tu Computadora
                  </h3>
                  <p className="text-xs text-[#ECB769] font-medium">
                    Aplicación de escritorio rápida, sin barras de navegador y con modo offline
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-[#FFF3BC]/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-[#202020]">
              
              {/* If running in an iframe (e.g. AI Studio preview), the browser blocks direct prompt. Give 1-click open standalone */}
              {isInIframe && (
                <div className="bg-[#FFF3BC]/60 border border-[#ECB769] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#4E2B01] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#4E2B01]">
                        Paso 1: Abrir en pestaña independiente
                      </p>
                      <p className="text-xs text-[#4E2B01]/80">
                        Los navegadores requieren abrir el sistema en una ventana completa para activar el botón de instalación oficial en tu computadora.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenStandaloneWindow}
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#4E2B01] hover:bg-[#381f01] text-[#FFF3BC] font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-[#ECB769]" />
                    <span>Abrir en Pestaña Nueva para Instalar</span>
                  </button>
                </div>
              )}

              {/* Operating System Specific Guide */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4E2B01] uppercase tracking-wider">
                  {isMac ? (
                    <>
                      <Laptop className="w-4 h-4 text-[#4E2B01]" />
                      <span>Instrucciones para Mac (macOS / Safari / Chrome):</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 text-[#4E2B01]" />
                      <span>Instrucciones para Windows / PC (Chrome / Edge):</span>
                    </>
                  )}
                </div>

                {/* Windows or Chrome/Edge Steps */}
                <div className="bg-white rounded-xl p-4 border border-[#ECB769]/40 shadow-xs space-y-3 text-xs sm:text-sm">
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#4E2B01] text-[#FFF3BC] font-extrabold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-[#4E2B01]">
                        Opción A: Icono en la barra de direcciones (Recomendado)
                      </p>
                      <p className="text-[#202020]/80 mt-0.5">
                        En la parte superior derecha de tu navegador (donde escribes la URL), haz clic en el icono de instalación <strong>🖥️ o ⊕ ("Instalar Minifoto")</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#4E2B01] text-[#FFF3BC] font-extrabold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-[#4E2B01]">
                        Opción B: Menú del Navegador (Google Chrome / Edge)
                      </p>
                      <p className="text-[#202020]/80 mt-0.5">
                        Haz clic en el menú de <strong>3 puntos (⋮)</strong> arriba a la derecha &gt; Selecciona <strong>"Instalar Minifoto"</strong> o <strong>"Guardar y compartir &gt; Instalar página como app"</strong>.
                      </p>
                    </div>
                  </div>

                  {isMac && (
                    <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-[#ECB769] text-[#4E2B01] font-extrabold flex items-center justify-center shrink-0 text-xs">
                        3
                      </div>
                      <div>
                        <p className="font-bold text-[#4E2B01]">
                          En Mac con Safari (macOS Sonoma en adelante):
                        </p>
                        <p className="text-[#202020]/80 mt-0.5">
                          En el menú superior de tu Mac, haz clic en <strong>Archivo &gt; "Agregar al Dock..."</strong> o en el botón <strong>Compartir &gt; "Agregar al Dock"</strong>. ¡Se creará la app con su icono oficial!
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                    <Smartphone className="w-5 h-5 text-[#4E2B01] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#4E2B01]">
                        ¿Quieres instalarlo en tu Celular o Tablet?
                      </p>
                      <p className="text-[#202020]/80 mt-0.5">
                        En Android toca el menú (⋮) &gt; "Instalar aplicación". En iPhone/iPad toca Compartir &gt; "Agregar al inicio".
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Link Copier */}
              <div className="flex items-center justify-between gap-2 p-3 bg-[#FCF9F2] border border-[#ECB769]/50 rounded-xl text-xs">
                <div className="truncate text-gray-600 font-mono text-[11px]">
                  {typeof window !== 'undefined' ? window.location.href : ''}
                </div>
                <button
                  onClick={handleCopyLink}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-[#4E2B01] text-[#FFF3BC] hover:bg-[#381f01] transition shrink-0 cursor-pointer"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#ECB769]" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-white px-5 py-3 border-t border-[#ECB769]/30 flex items-center justify-between gap-3">
              <button
                onClick={handleOpenStandaloneWindow}
                type="button"
                className="flex items-center gap-1.5 text-xs font-bold text-[#4E2B01] hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#4E2B01]" />
                <span>Abrir en ventana completa</span>
              </button>

              <button
                onClick={() => setShowModal(false)}
                type="button"
                className="px-5 py-2 bg-[#4E2B01] hover:bg-[#381f01] text-[#FFF3BC] text-xs font-black rounded-xl transition cursor-pointer"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
