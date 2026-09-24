import { Drama, Film, Newspaper, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export const SITE_URL = 'https://blog-azulmarcaribe.netlify.app';
export const FALLBACK_IMAGE = '/logo.png';

// LISTA ÚNICA DE ADMINS (siempre en minúsculas: Firebase entrega el email en minúsculas)
export const ADMIN_EMAILS = [
  'yamithadresjulio@gmail.com',
  'xiomysofy24@gmail.com',
  'delosreyesxiomara75@gmail.com',
  'linaospina003@gmail.com',
];

export const isAdminEmail = (email) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());

// CATEGORÍAS: nombre guardado en Firestore, clase del badge e ícono
// color: tono de la sección (texto de etiquetas, subrayados, chips)
export const CATEGORIAS = [
  { value: 'Cultural', label: 'Cultural', badge: 'bg-success text-white', Icon: Drama, color: '#0f766e',
    descripcion: 'Tradiciones, música, arte y patrimonio de la región Caribe.' },
  { value: 'Entretenimiento', label: 'Entretenimiento', badge: 'bg-warning text-dark', Icon: Film, color: '#b45309',
    descripcion: 'Farándula, cine, series, conciertos y eventos.' },
  { value: 'Noticias', label: 'Noticias', badge: 'bg-danger text-white', Icon: Newspaper, color: '#b91c1c',
    descripcion: 'La actualidad de nuestra región, contada con cercanía.' },
];

export const getCategoriaColor = (value) => getCategoria(value)?.color || '#0369a1';

export const CONTACT_EMAIL = 'xiomysofy24@gmail.com';

export const SOCIAL_LINKS = [
  { name: 'Facebook', href: 'https://www.facebook.com/xiomysofy.dlosreyes', Icon: Facebook },
  { name: 'Instagram', href: 'https://www.instagram.com/azulmarcaribe.link', Icon: Instagram },
  { name: 'X (Twitter)', href: 'https://x.com/xiomysofy', Icon: Twitter },
  { name: 'YouTube', href: 'https://youtube.com/@zulmarcaribe', Icon: Youtube },
];

export const getCategoria = (value) => CATEGORIAS.find((c) => c.value === value);

export const getBadgeClass = (value) => getCategoria(value)?.badge || 'bg-primary text-white';

// Evita el bucle infinito de onError si el fallback también falla
export const handleImageError = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMAGE;
  e.currentTarget.classList.add('img-fallback');
};

export const formatearFecha = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatearFechaCorta = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' });
};

// "hace 5 min", "hace 3 h", "hace 2 días" o la fecha corta si pasó más de una semana
export const tiempoRelativo = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return d === 1 ? 'ayer' : `hace ${d} días`;
  return formatearFechaCorta(timestamp);
};

export const iniciales = (nombre) =>
  (nombre || 'R').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
