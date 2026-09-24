import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main id="contenido" className="container text-center py-5 my-lg-5">
      <Helmet>
        <title>Página no encontrada | Azul Mar Caribe</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <span className="feature-icon mb-4" style={{ width: 72, height: 72, borderRadius: 20 }}>
        <Compass size={36} strokeWidth={1.5} />
      </span>
      <div className="eyebrow mb-2" style={{ color: 'var(--ocean)' }}>Error 404</div>
      <h1 className="font-serif fw-bold mb-3">Parece que te perdiste en el mar</h1>
      <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: '46ch' }}>
        La página que buscas no existe o ha sido movida. Vuelve a la portada para seguir leyendo.
      </p>
      <Link to="/" className="btn btn-primary rounded-pill px-4 py-2">Ir a la portada</Link>
    </main>
  );
}
