# Azul Mar Caribe

Blog de cultura, entretenimiento y noticias de la región Caribe. React 19 + Vite, Firebase (Firestore, Auth, Storage) y despliegue en Netlify.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run lint     # ESLint
npm run build    # build de producción en dist/
```

Variables de entorno en `.env` (no se suben al repo):

```
VITE_API_KEY=
VITE_AUTH_DOMAIN=
VITE_PROJECT_ID=
VITE_STORAGE_BUCKET=
VITE_MESSAGING_SENDER_ID=
VITE_APP_ID=
VITE_MEASUREMENT_ID=
```

## Estructura

| Ruta | Qué contiene |
|------|--------------|
| `src/config/site.js` | Lista de admins, categorías (color e ícono), imagen de respaldo, formato de fecha |
| `src/utils/html.js` | Sanitizador de HTML, HTML→texto y conversión de enlaces de YouTube |
| `src/pages/` | Páginas (inicio, detalle, panel admin, login, etc.) |
| `src/components/` | Navbar, Footer, editor (`BlogForm`), ticker, botones de compartir |
| `netlify/edge-functions/inject-meta.js` | Inserta título/descripción/imagen de cada noticia en el HTML para Facebook, WhatsApp y X |

- **Agregar un admin:** añadir el correo (en minúsculas) a `ADMIN_EMAILS` en `src/config/site.js`. Las reglas de Firestore también deben permitirlo.
- **Agregar una categoría:** añadirla a `CATEGORIAS` en `src/config/site.js`; filtros, badges y el editor la toman de ahí.
