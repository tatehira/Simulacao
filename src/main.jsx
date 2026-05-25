import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registrar o Service Worker do PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = `${import.meta.env.BASE_URL || '/'}sw.js`;
    navigator.serviceWorker.register(swPath)
      .then(reg => console.log('Service Worker registrado com sucesso!', reg.scope))
      .catch(err => console.error('Falha ao registrar o Service Worker:', err));
  });
}

