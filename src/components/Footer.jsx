import React from 'react';
import { Link } from 'react-router-dom';
// Importamos los íconos de Lucide
import { Home, Drama, Film, Facebook, Instagram, Twitter, Youtube, Mail } from 'lucide-react';

export default function Footer() {
  
  const scrollTop = () => window.scrollTo(0, 0);

  return (
    <footer style={{ backgroundColor: '#023e8a', color: 'white', marginTop: 'auto' }}>
      <div className="container py-5">
        <div className="row g-4">
          
          {/* COLUMNA 1 */}
          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2 mb-3">
                <img src="/logo.png" alt="Logo" style={{height: '40px', background:'white', borderRadius:'50%', padding:'2px'}} />
                <h5 className="mb-0 fw-bold">Azul Mar Caribe</h5>
            </div>
            <p className="text-white-50 small">
              Tu portal número uno para las noticias culturales y de entretenimiento de la región Caribe. Conectando tradiciones con el mundo digital.
            </p>
          </div>

          {/* COLUMNA 2 */}
          <div className="col-md-4">
            <h5 className="fw-bold mb-3">Secciones</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" onClick={scrollTop} className="text-white-50 text-decoration-none hover-white d-flex align-items-center gap-2">
                  <Home size={16} /> Inicio
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/?cat=Cultural" onClick={scrollTop} className="text-white-50 text-decoration-none hover-white d-flex align-items-center gap-2">
                  <Drama size={16} /> Cultura
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/?cat=Entretenimiento" onClick={scrollTop} className="text-white-50 text-decoration-none hover-white d-flex align-items-center gap-2">
                  <Film size={16} /> Entretenimiento
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMNA 3 */}
          <div className="col-md-4">
            <h5 className="fw-bold mb-3">Síguenos en Redes</h5>
            <div className="d-flex gap-3">
              
              {/* FACEBOOK */}
              <a 
                href="https://www.facebook.com/xiomysofy.dlosreyes" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white"
                title="Facebook"
              >
                <Facebook size={24} />
              </a>

              {/* INSTAGRAM */}
              <a 
                href="https://www.instagram.com/azulmarcaribe.link" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white"
                title="Instagram"
              >
                <Instagram size={24} />
              </a>

              {/* TWITTER (X) */}
              <a 
                href="https://x.com/xiomysofy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white"
                title="X (Twitter)"
              >
                <Twitter size={24} />
              </a>

              {/* YOUTUBE */}
              <a 
                href="https://youtube.com/@zulmarcaribe" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white"
                title="YouTube"
              >
                <Youtube size={24} />
              </a>

            </div>
            <p className="text-white-50 small mt-3 d-flex align-items-center gap-2">
              <Mail size={16} /> Contacto: Xiomysofy24@gmail.com
            </p>
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.2)' }} />

        <div className="text-center text-white-50 small">
          &copy; {new Date().getFullYear()} Azul Mar Caribe. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}