import React, { useState } from 'react';
import { Facebook, MessageCircle, Link2, Check } from 'lucide-react';

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/>
  </svg>
);

export default function ShareButtons({ title, url = window.location.href }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const redes = [
    { name: 'WhatsApp', color: '#25D366', href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`, icon: <MessageCircle size={17} /> },
    { name: 'Facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: <Facebook size={17} /> },
    { name: 'X', color: '#000', href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, icon: <XIcon /> },
  ];

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="share-bar">
      {redes.map((r) => (
        <a
          key={r.name}
          href={r.href}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn"
          style={{ '--share-color': r.color }}
          aria-label={`Compartir en ${r.name}`}
          title={`Compartir en ${r.name}`}
        >
          {r.icon}
        </a>
      ))}
      <button type="button" onClick={copiar} className="share-btn" style={{ '--share-color': 'var(--ocean)' }} aria-label="Copiar enlace" title={copied ? '¡Enlace copiado!' : 'Copiar enlace'}>
        {copied ? <Check size={17} /> : <Link2 size={17} />}
      </button>
    </div>
  );
}
