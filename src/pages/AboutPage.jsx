import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, Target, Users, Mail } from 'lucide-react';
import PageHero from '../components/PageHero';
import { CATEGORIAS, CONTACT_EMAIL } from '../config/site';

const PILARES = [
  { Icon: Users, titulo: '¿Quiénes somos?', texto: 'Azul Mar Caribe nació como una iniciativa para resaltar la riqueza cultural y el entretenimiento de nuestra región. Somos un equipo apasionado por las historias, la música y las tradiciones que nos hacen únicos.' },
  { Icon: Heart, titulo: 'Misión', texto: 'Difundir los eventos y noticias más relevantes del Caribe, creando un espacio digital donde la comunidad pueda informarse y participar.' },
  { Icon: Target, titulo: 'Visión', texto: 'Ser el medio digital de referencia para la cultura costeña, reconocido por nuestra calidad periodística y cercanía con la gente.' },
];

export default function AboutPage() {
  return (
    <main id="contenido">
      <Helmet>
        <title>Quiénes Somos | Azul Mar Caribe</title>
        <meta name="description" content="Conoce al equipo de Azul Mar Caribe, nuestra misión y visión." />
      </Helmet>

      <PageHero eyebrow="Nuestra historia" title="Conectando la cultura del Caribe con el mundo digital">
        Contamos lo que pasa en nuestra región: su gente, su música, sus tradiciones y su actualidad.
      </PageHero>

      <div className="container py-5" style={{ maxWidth: 1040 }}>
        <div className="row g-4 mb-5">
          {PILARES.map((p) => (
            <div key={p.titulo} className="col-md-4">
              <div className="content-card h-100">
                <span className="feature-icon mb-3"><p.Icon size={24} /></span>
                <h2 className="h5 font-serif fw-bold">{p.titulo}</h2>
                <p className="text-secondary mb-0">{p.texto}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="content-card d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div>
            <h2 className="h4 font-serif fw-bold mb-2">¿Tienes una historia para contar?</h2>
            <p className="text-secondary mb-0">Escríbenos: eventos, talentos locales, tradiciones o noticias de tu comunidad.</p>
          </div>
          <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-primary rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2 flex-shrink-0">
            <Mail size={18} /> Contáctanos
          </a>
        </div>

        <div className="mt-5 text-center">
          <p className="text-secondary mb-3">Explora nuestras secciones</p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            {CATEGORIAS.map((c) => (
              <Link key={c.value} to={`/?cat=${c.value}`} className="cat-tab text-decoration-none" style={{ '--cat-color': c.color }}>
                <c.Icon size={16} /> {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
