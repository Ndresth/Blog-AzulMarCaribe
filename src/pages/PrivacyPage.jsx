import React from 'react';
import { Helmet } from 'react-helmet-async';
import PageHero from '../components/PageHero';
import { CONTACT_EMAIL } from '../config/site';

export default function PrivacyPage() {
  return (
    <main id="contenido">
      <Helmet>
        <title>Política de Privacidad | Azul Mar Caribe</title>
      </Helmet>

      <PageHero eyebrow="Legal" title="Política de Privacidad">
        Cómo tratamos la información que compartes con nosotros.
      </PageHero>

      <div className="container py-5" style={{ maxWidth: 820 }}>
        <div className="content-card prose">
          <h2>1. Introducción</h2>
          <p>
            En <strong>Azul Mar Caribe</strong>, respetamos su privacidad y estamos comprometidos a proteger
            la información personal que usted pueda compartir con nosotros.
          </p>

          <h2>2. Datos que recopilamos</h2>
          <p>
            Nuestro sitio web utiliza autenticación mediante Google. Cuando usted inicia sesión o comenta,
            recopilamos su nombre público y correo electrónico únicamente para identificar su autoría.
            No compartimos estos datos con terceros.
          </p>

          <h2>3. Cookies</h2>
          <p>
            Utilizamos cookies esenciales para mantener su sesión activa y mejorar su experiencia de navegación.
          </p>

          <h2>4. Contacto</h2>
          <p className="mb-0">
            Si tiene preguntas sobre esta política, puede contactarnos a: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
