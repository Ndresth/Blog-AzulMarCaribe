import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Users, Heart, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container py-5" style={{maxWidth: '800px'}}>
      <Helmet>
        <title>Quiénes Somos | Azul Mar Caribe</title>
      </Helmet>

      <div className="text-center mb-5">
        <h1 className="fw-bold display-5 text-primary mb-3">Nuestra Historia</h1>
        <p className="lead text-muted">
          Conectando la cultura del Caribe con el mundo digital.
        </p>
      </div>

      <div className="card border-0 shadow-sm p-4 mb-4">
        <div className="d-flex gap-3">
            <div className="bg-light p-3 rounded-circle h-100 text-primary">
                <Users size={32} />
            </div>
            <div>
                <h3 className="fw-bold">¿Quiénes somos?</h3>
                <p className="text-secondary">
                    Azul Mar Caribe nació como una iniciativa para resaltar la riqueza cultural 
                    y el entretenimiento de nuestra región. Somos un equipo apasionado por 
                    las historias, la música y las tradiciones que nos hacen únicos.
                </p>
            </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
            <div className="card border-0 shadow-sm p-4 h-100">
                <Heart size={32} className="text-danger mb-3" />
                <h4 className="fw-bold">Misión</h4>
                <p className="text-secondary small">
                    Difundir los eventos y noticias más relevantes del Caribe, 
                    creando un espacio digital donde la comunidad pueda informarse y participar.
                </p>
            </div>
        </div>
        <div className="col-md-6">
            <div className="card border-0 shadow-sm p-4 h-100">
                <Target size={32} className="text-success mb-3" />
                <h4 className="fw-bold">Visión</h4>
                <p className="text-secondary small">
                    Ser el medio digital de referencia para la cultura costeña, 
                    reconocido por nuestra calidad periodística y cercanía con la gente.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}