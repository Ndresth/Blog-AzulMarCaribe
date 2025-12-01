import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container text-center py-5 my-5">
        <div className="text-primary mb-3">
            <Compass size={80} strokeWidth={1} />
        </div>
        <h1 className="display-1 fw-bold text-dark">404</h1>
        <h2 className="h4 text-muted mb-4">Ups... Parece que te perdiste en el mar.</h2>
        <p className="mb-4">La página que buscas no existe o ha sido movida.</p>
        
        <Link to="/" className="btn btn-primary rounded-pill px-4 fw-bold">
            Volver al Inicio
        </Link>
    </div>
  );
}