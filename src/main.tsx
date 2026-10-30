import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA offline caching and installability
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegistered(r) {
      console.log('Minifoto Service Worker registrado con éxito:', r);
    },
    onRegisterError(error) {
      console.warn('Error al registrar Service Worker:', error);
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
