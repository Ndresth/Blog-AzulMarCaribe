import { Drama, Film, Newspaper } from 'lucide-react';

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
export const CATEGORIAS = [
  { value: 'Cultural', label: 'Cultural', badge: 'bg-success text-white', Icon: Drama },
  { value: 'Entretenimiento', label: 'Entretenimiento', badge: 'bg-warning text-dark', Icon: Film },
  { value: 'Noticias', label: 'Noticias', badge: 'bg-danger text-white', Icon: Newspaper },
];

export const getCategoria = (value) => CATEGORIAS.find((c) => c.value === value);

export const getBadgeClass = (value) => getCategoria(value)?.badge || 'bg-primary text-white';

// Evita el bucle infinito de onError si el fallback también falla
export const handleImageError = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMAGE;
};

export const formatearFecha = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
};
