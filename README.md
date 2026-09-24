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
| `src/components/` | Navbar, Footer, `PostCard` (tarjeta de noticia), `PageHero`, editor (`BlogForm`), ticker, botones de compartir |
| `src/index.css` | Sistema de diseño: colores, tipografía (Inter + Source Serif 4, alojadas en el sitio) y estilos de componentes |
| `netlify/edge-functions/inject-meta.js` | Inserta título/descripción/imagen de cada noticia en el HTML para Facebook, WhatsApp y X |

- **Agregar un admin:** añadir el correo (en minúsculas) en **tres** lugares: `ADMIN_EMAILS` en `src/config/site.js`, `isAdmin()` en `firestore.rules` y `isAdmin()` en `storage.rules`. Luego publicar las reglas.
- **Agregar una categoría:** añadirla a `CATEGORIAS` en `src/config/site.js`; filtros, badges y el editor la toman de ahí.

## Reglas de seguridad (Firestore y Storage)

Las reglas viven en `firestore.rules` y `storage.rules`. Resumen:

- **Noticias:** lectura pública; crear/editar/borrar solo admins (correo verificado de la lista).
- **Me gusta:** un like por usuario; el contador solo puede cambiar ±1 en la misma operación que crea/borra el like.
- **Comentarios:** cualquier usuario con sesión, máx. 1000 caracteres, sin email; los borra el admin o su autor.
- **Pauta (`config/pauta`):** lectura pública; solo admins la crean, editan o borran (enlace vacío o `http(s)://`).
- **Storage:** lectura pública; solo admins suben a `blog_images/` y `blog_pautas/` (imágenes < 5 MB) y `blog_videos/` (videos < 100 MB).

Probarlas (requiere Java):

```bash
npm run test:rules
```

Publicarlas (una de dos):

1. **Consola:** Firebase Console → Firestore Database → Reglas → pegar `firestore.rules` → Publicar. Igual en Storage → Reglas con `storage.rules`.
2. **CLI:** `npx firebase-tools login` y luego `npx firebase-tools deploy --only firestore:rules,storage`.

## Pauta publicitaria

Desde **Panel admin → Pauta** se sube una imagen (y opcionalmente un enlace). Aparece en una ventana al entrar al sitio, una vez por visita, y se cierra con la X o Esc. Si se sube una pauta nueva, vuelve a mostrarse a todos. Para pausarla, desactivar el interruptor y guardar.

## SEO

- `/sitemap.xml` y `/rss.xml` se generan desde Firestore con la Edge Function `netlify/edge-functions/feeds.js` (caché de 1 h).
- Cada noticia incluye metadatos Open Graph, Twitter y datos estructurados `NewsArticle` (`inject-meta.js`).
- Tras publicar, conviene enviar `https://blog-azulmarcaribe.netlify.app/sitemap.xml` en Google Search Console.
