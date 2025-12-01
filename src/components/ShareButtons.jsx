import React from 'react';
import { Facebook, Twitter, MessageCircle } from 'lucide-react'; // Íconos

export default function ShareButtons({ title }) {
  // Obtenemos la URL actual de la noticia
  const url = window.location.href;
  
  // Codificamos el texto para que sirva en enlaces
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="my-4 p-3 bg-light rounded border d-flex flex-column flex-md-row align-items-center gap-3 justify-content-center">
      <span className="fw-bold text-secondary">¡Comparte esta noticia!</span>
      
      <div className="d-flex gap-2">
        {/* WHATSAPP */}
        <a 
            href={`https://api.whatsapp.com/send?text=${encodedTitle} ${encodedUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-success d-flex align-items-center gap-2 rounded-pill btn-sm fw-bold"
        >
            <MessageCircle size={18} /> WhatsApp
        </a>

        {/* FACEBOOK */}
        <a 
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary d-flex align-items-center gap-2 rounded-pill btn-sm fw-bold"
            style={{backgroundColor: '#1877F2', borderColor: '#1877F2'}}
        >
            <Facebook size={18} /> Facebook
        </a>

        {/* TWITTER / X */}
        <a 
            href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-dark d-flex align-items-center gap-2 rounded-pill btn-sm fw-bold"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/>
            </svg> X
        </a>
      </div>
    </div>
  );
}