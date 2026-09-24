import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { CATEGORIAS, SOCIAL_LINKS, CONTACT_EMAIL } from '../config/site';

export default function Footer() {
  const scrollTop = () => window.scrollTo(0, 0);

  return (
    <footer className="site-footer mt-5">
      <div className="container py-5">
        <div className="row gx-4 gy-5">
          <div className="col-lg-5">
            <Link to="/" onClick={scrollTop} className="footer-logo mb-3">
              <img src="/logo-sm.png" alt="Azul Mar Caribe" loading="lazy" />
            </Link>
            <p className="mb-4" style={{ maxWidth: '42ch' }}>
              Cultura, entretenimiento y actualidad de la región Caribe. Conectando nuestras tradiciones con el mundo digital.
            </p>
            <div className="d-flex gap-2">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="social-btn" aria-label={s.name} title={s.name}>
                  <s.Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <h6>Secciones</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              <li><Link to="/" onClick={scrollTop}>Portada</Link></li>
              {CATEGORIAS.map((c) => (
                <li key={c.value}><Link to={`/?cat=${c.value}`} onClick={scrollTop}>{c.label}</Link></li>
              ))}
            </ul>
          </div>

          <div className="col-sm-6 col-lg-4">
            <h6>Azul Mar Caribe</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              <li><Link to="/about" onClick={scrollTop}>Quiénes somos</Link></li>
              <li><Link to="/privacy" onClick={scrollTop}>Política de privacidad</Link></li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="d-inline-flex align-items-center gap-2 text-break">
                  <Mail size={15} /> {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container py-3 d-flex flex-column flex-md-row justify-content-between gap-2">
          <span>&copy; {new Date().getFullYear()} Azul Mar Caribe. Todos los derechos reservados.</span>
          <span>Hecho con orgullo en el Caribe colombiano</span>
        </div>
      </div>
    </footer>
  );
}
