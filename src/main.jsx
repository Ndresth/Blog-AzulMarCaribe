import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fontsource-variable/inter'
import '@fontsource-variable/source-serif-4'
import './index.css'
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary, { recargarUnaVez } from './components/ErrorBoundary.jsx';

// Vite avisa cuando no puede precargar un chunk (típico tras un deploy nuevo)
window.addEventListener('vite:preloadError', (event) => {
  if (recargarUnaVez()) event.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
)