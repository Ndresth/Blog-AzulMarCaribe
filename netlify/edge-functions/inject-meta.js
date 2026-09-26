import { getPost, toPlainText, SITE_URL } from "../shared/firestore.js";

const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const LOGO = `${SITE_URL}/logo.png`;

// Escapa texto para usarlo dentro de atributos/etiquetas HTML
const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// JSON seguro dentro de <script>: evita que "</script>" o "<!--" cierren la etiqueta
const safeJson = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");

export default async (request, context) => {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/post\/([A-Za-z0-9_-]{1,128})\/?$/);

  // Solo IDs válidos de Firestore; cualquier otra ruta pasa sin tocar
  if (!match) return context.next();
  const postId = match[1];

  try {
    const post = await getPost(postId);
    if (!post) return context.next();

    const tituloTexto = toPlainText(post.titulo || "Azul Mar Caribe");
    let desc = toPlainText(post.contenido) || `${tituloTexto} - Azul Mar Caribe`;
    if (desc.length > 160) desc = desc.substring(0, 157).trimEnd() + "...";

    const imagenUrl = /^https:\/\//i.test(post.imagen || "") ? post.imagen : DEFAULT_IMAGE;
    const canonicalUrl = `${SITE_URL}/post/${postId}`;
    const fechaIso = post.fecha ? new Date(post.fecha).toISOString() : undefined;

    const titulo = escapeHtml(tituloTexto);
    const descripcion = escapeHtml(desc);
    const imagen = escapeHtml(imagenUrl);
    const canonical = escapeHtml(canonicalUrl);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: tituloTexto.substring(0, 110),
      description: desc,
      image: [imagenUrl],
      datePublished: fechaIso,
      articleSection: post.categoria,
      author: [{ "@type": "Person", name: post.autor || "Redacción" }],
      publisher: {
        "@type": "Organization",
        name: "Azul Mar Caribe",
        logo: { "@type": "ImageObject", url: LOGO },
      },
      mainEntityOfPage: canonicalUrl,
    };

    const originalResponse = await context.next();
    const page = await originalResponse.text();

    const metaTags = [
      `<meta name="description" content="${descripcion}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:title" content="${titulo}" />`,
      `<meta property="og:description" content="${descripcion}" />`,
      `<meta property="og:image" content="${imagen}" />`,
      `<meta property="og:url" content="${canonical}" />`,
      fechaIso ? `<meta property="article:published_time" content="${fechaIso}" />` : "",
      post.categoria ? `<meta property="article:section" content="${escapeHtml(post.categoria)}" />` : "",
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${titulo}" />`,
      `<meta name="twitter:description" content="${descripcion}" />`,
      `<meta name="twitter:image" content="${imagen}" />`,
      `<link rel="canonical" href="${canonical}" />`,
      `<script type="application/ld+json">${safeJson(jsonLd)}</script>`,
    ].filter(Boolean).join("\n    ");

    // Quitamos las meta genéricas del index.html y ponemos las de la noticia
    const updatedPage = page
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${titulo} | Azul Mar Caribe</title>`)
      .replace(/<meta[^>]*(property|name)=["'](og:(type|title|description|image|url)|description|twitter:[a-z]+)["'][^>]*>\s*/gi, "")
      .replace(/<link[^>]*rel=["']canonical["'][^>]*>\s*/gi, "")
      .replace(/<\/head>/i, `    ${metaTags}\n  </head>`);

    const headers = new Headers(originalResponse.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.delete("content-length");
    headers.set("cache-control", "public, max-age=0, must-revalidate");

    return new Response(updatedPage, { status: originalResponse.status, headers });
  } catch (error) {
    console.log("Error Edge Function:", error);
  }

  return context.next();
};
