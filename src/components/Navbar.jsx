import React, { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { CATEGORIAS, SOCIAL_LINKS } from '../config/site';

const hoy = () => {
  const t = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const catActual = pathname === '/' ? searchParams.get('cat') : null;

  const links = [
    { to: '/', label: 'Portada', active: pathname === '/' && !catActual },
    ...CATEGORIAS.map((c) => ({ to: `/?cat=${c.value}`, label: c.label, active: catActual === c.value, color: c.color })),
    { to: '/about', label: 'Quiénes somos', active: pathname === '/about' },
  ];

  const close = () => setOpen(false);

  return (
    <>
      <a href="#contenido" className="visually-hidden-focusable">Saltar al contenido</a>

      <div className="topbar d-none d-md-block">
        <div className="container d-flex justify-content-between align-items-center py-2">
          <span>{hoy()}</span>
          <div className="d-flex align-items-center gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name}>
                <s.Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-2 flex-wrap">
            <Link className="brand d-flex align-items-center py-1" to="/" onClick={close} aria-label="Azul Mar Caribe - Inicio">
              <img src="/logo-sm.png" alt="Azul Mar Caribe" width="134" height="54" />
            </Link>

            <button
              className="nav-toggle d-lg-none"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="main-nav"
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>

            <nav
              id="main-nav"
              className={`main-nav d-lg-flex align-items-center ${open ? 'd-flex' : 'd-none'}`}
              aria-label="Secciones"
            >
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={close}
                  className={`nav-link${l.active ? ' active' : ''}`}
                  style={l.color ? { '--nav-color': l.color } : undefined}
                  aria-current={l.active ? 'page' : undefined}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
