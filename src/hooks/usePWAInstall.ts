import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __minifotoPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== 'undefined' ? window.__minifotoPwaPrompt || null : null)
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [browserName, setBrowserName] = useState<'chrome' | 'edge' | 'safari' | 'firefox' | 'other'>('chrome');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode (already installed or running as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect if inside an iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Detect OS & Browser
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isMacDevice = /macintosh|mac os x/.test(ua) && !isIOSDevice;
    const isWinDevice = /windows|win32|win64/.test(ua);

    setIsIOS(isIOSDevice);
    setIsMac(isMacDevice);
    setIsWindows(isWinDevice);

    if (ua.includes('edg/')) {
      setBrowserName('edge');
    } else if (ua.includes('chrome') && !ua.includes('edg/')) {
      setBrowserName('chrome');
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      setBrowserName('safari');
    } else if (ua.includes('firefox')) {
      setBrowserName('firefox');
    } else {
      setBrowserName('other');
    }

    // Event listener for Chrome / Edge / Chromium PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const pEvent = e as BeforeInstallPromptEvent;
      window.__minifotoPwaPrompt = pEvent;
      setDeferredPrompt(pEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__minifotoPwaPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__minifotoPwaPrompt : null);
    if (!promptEvent) {
      return 'unavailable';
    }

    try {
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.__minifotoPwaPrompt = null;
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('Error executing PWA install prompt:', err);
      return 'unavailable';
    }
  }, [deferredPrompt]);

  return {
    isInstallable: !!deferredPrompt || (typeof window !== 'undefined' && !!window.__minifotoPwaPrompt),
    isInstalled,
    isIOS,
    isMac,
    isWindows,
    isInIframe,
    browserName,
    install,
  };
}
