import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="container py-5" style={{maxWidth: '800px'}}>
      <Helmet>
        <title>Política de Privacidad | Azul Mar Caribe</title>
      </Helmet>

      <div className="mb-4 text-center">
        <ShieldCheck size={48} className="text-primary mb-2" />
        <h1 className="fw-bold">Política de Privacidad</h1>
        <p className="text-muted">Última actualización: {new Date().getFullYear()}</p>
      </div>

      <div className="bg-white p-5 rounded-4 shadow-sm">
        <h4>1. Introducción</h4>
        <p className="text-secondary mb-4">
            En <strong>Azul Mar Caribe</strong>, respetamos su privacidad y estamos comprometidos a proteger 
            la información personal que usted pueda compartir con nosotros.
        </p>

        <h4>2. Datos que recopilamos</h4>
        <p className="text-secondary mb-4">
            Nuestro sitio web utiliza autenticación mediante Google. Cuando usted inicia sesión o comenta, 
            recopilamos su nombre público y correo electrónico únicamente para identificar su autoría. 
            No compartimos estos datos con terceros.
        </p>

        <h4>3. Cookies</h4>
        <p className="text-secondary mb-4">
            Utilizamos cookies esenciales para mantener su sesión activa y mejorar su experiencia de navegación.
        </p>

        <h4>4. Contacto</h4>
        <p className="text-secondary">
            Si tiene preguntas sobre esta política, puede contactarnos a: <strong>xiomysofy24@gmail.com</strong>.
        </p>
      </div>
    </div>
  );
}