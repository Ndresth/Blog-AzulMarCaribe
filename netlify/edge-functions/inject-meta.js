const PROJECT_ID = "blog-cultural-app";
const SITE_URL = "https://blog-azulmarcaribe.netlify.app";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

// Escapa texto para usarlo dentro de atributos/etiquetas HTML
const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const decodeEntities = (str) =>
  str
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const toPlainText = (html) =>
  decodeEntities(String(html).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

export default async (request, context) => {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/post\/([A-Za-z0-9_-]{1,128})\/?$/);

  // Solo IDs válidos de Firestore; cualquier otra ruta pasa sin tocar
  if (!match) return context.next();
  const postId = match[1];

  const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts/${postId}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return context.next();

    const data = await response.json();
    if (!data?.fields) return context.next();

    const titulo = escapeHtml(toPlainText(data.fields.titulo?.stringValue || "Azul Mar Caribe"));

    let desc = toPlainText(data.fields.contenido?.stringValue || "Noticias culturales del Caribe.");
    if (desc.length > 160) desc = desc.substring(0, 157).trimEnd() + "...";
    const descripcion = escapeHtml(desc);

    const rawImage = data.fields.imagen?.stringValue || "";
    const imagen = escapeHtml(/^https:\/\//i.test(rawImage) ? rawImage : DEFAULT_IMAGE);
    const canonical = escapeHtml(`${SITE_URL}/post/${postId}`);

    const originalResponse = await context.next();
    const page = await originalResponse.text();

    const metaTags = [
      `<meta name="description" content="${descripcion}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:title" content="${titulo}" />`,
      `<meta property="og:description" content="${descripcion}" />`,
      `<meta property="og:image" content="${imagen}" />`,
      `<meta property="og:url" content="${canonical}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${titulo}" />`,
      `<meta name="twitter:description" content="${descripcion}" />`,
      `<meta name="twitter:image" content="${imagen}" />`,
      `<link rel="canonical" href="${canonical}" />`,
    ].join("\n    ");

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
