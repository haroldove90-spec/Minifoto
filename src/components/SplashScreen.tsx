import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDisplayTimeMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDisplayTimeMs = 1200,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 400);
      return () => clearTimeout(hideTimer);
    }, minDisplayTimeMs);

    return () => clearTimeout(timer);
  }, [minDisplayTimeMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FCF9F2] transition-opacity duration-400 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center animate-in fade-in zoom-in-95 duration-500">
        {/* Full Size Unencapsulated Logo */}
        <div className="mb-6 flex items-center justify-center">
          <img
            src="https://xqggdnoxvskotwlcuwgd.supabase.co/storage/v1/object/public/logo/minifotologo.png"
            alt="Minifoto"
            className="h-20 sm:h-28 w-auto max-w-[280px] sm:max-w-[340px] object-contain drop-shadow-sm"
          />
        </div>

        {/* App Icon badge with glowing warm palette */}
        <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-md border-2 border-[#ECB769]/50 flex items-center justify-center mb-6">
          <img
            src="https://xqggdnoxvskotwlcuwgd.supabase.co/storage/v1/object/public/logo/minifotoicono.png"
            alt="Minifoto Icon"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Subtle animated bar in official brand colors */}
        <div className="w-48 h-1.5 bg-[#FFF3BC] rounded-full overflow-hidden mb-3 border border-[#ECB769]/30">
          <div className="h-full bg-gradient-to-r from-[#4E2B01] via-[#ECB769] to-[#4E2B01] rounded-full animate-pulse w-full"></div>
        </div>

        <p className="text-xs font-black uppercase tracking-widest text-[#4E2B01]">
          Minifoto Punto de Venta
        </p>
        <span className="text-[11px] font-medium text-[#202020]/70 mt-0.5">
          Cargando catálogo y módulos...
        </span>
      </div>
    </div>
  );
};
