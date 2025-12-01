import React from 'react';
import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react'; // Ícono de olas para acompañar el texto

export default function Navbar() {
  return (
    // Navbar Azul Gradiente
    <nav className="navbar navbar-expand-lg navbar-dark shadow-lg sticky-top" 
         style={{background: 'linear-gradient(90deg, #005f99 0%, #00a8cc 100%)'}}>
      <div className="container">
        
        {/* LOGO Y NOMBRE (Clic lleva al inicio) */}
        <Link className="navbar-brand d-flex align-items-center gap-3" to="/">
          
          {/* Tu imagen de logo */}
          <div className="bg-white rounded-pill px-2 py-1 shadow-sm d-flex align-items-center">
             <img src="/logo.png" alt="Logo" height="45" />
          </div>

          {/* Texto con Ícono de Lucide */}
          <span className="fw-bold text-white d-flex align-items-center gap-2" style={{letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>
            <Waves size={24} /> {/* Ícono vectorial en vez de emoji */}
            AZUL MAR CARIBE
          </span>
        </Link>

        {/* Sin botones de Admin (Público general) */}
        
      </div>
    </nav>
  );
}