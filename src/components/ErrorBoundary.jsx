import React from 'react';
import { RefreshCw } from 'lucide-react';

const esErrorDeCarga = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i
    .test(`${error?.name} ${error?.message}`);

// Tras un deploy, los archivos JS antiguos dejan de existir. Si una pestaña vieja intenta
// cargarlos, se recarga la página una sola vez para traer la versión nueva.
export const recargarUnaVez = () => {
  try {
    const ultimo = Number(sessionStorage.getItem('reload-tras-deploy') || 0);
    if (Date.now() - ultimo < 30000) return false;
    sessionStorage.setItem('reload-tras-deploy', String(Date.now()));
  } catch { /* sin sessionStorage: se recarga igual */ }
  window.location.reload();
  return true;
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error en la interfaz:', error, info);
    if (esErrorDeCarga(error)) recargarUnaVez();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container text-center py-5 my-5">
        <h1 className="h3 font-serif fw-bold mb-3">Algo salió mal</h1>
        <p className="text-secondary mb-4">
          {esErrorDeCarga(this.state.error)
            ? 'Hay una versión nueva del sitio. Recarga la página para verla.'
            : 'Ocurrió un error inesperado al mostrar esta página.'}
        </p>
        <button className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-2" onClick={() => window.location.reload()}>
          <RefreshCw size={17} /> Recargar
        </button>
      </div>
    );
  }
}
