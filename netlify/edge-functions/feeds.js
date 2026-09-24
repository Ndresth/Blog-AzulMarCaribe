import { listPosts, escapeXml, toPlainText, SITE_URL } from "../shared/firestore.js";

const xml = (body, type) =>
  new Response(body, {
    headers: {
      "content-type": `${type}; charset=utf-8`,
      // 1 h en la CDN; se regenera solo
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });

async function sitemap() {
  const posts = await listPosts({ max: 2000, fields: ["fecha"] });
  const ultima = posts[0]?.fecha;
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: ultima, freq: "daily", prio: "1.0" },
    { loc: `${SITE_URL}/about`, freq: "monthly", prio: "0.4" },
    { loc: `${SITE_URL}/privacy`, freq: "yearly", prio: "0.2" },
    ...posts.map((p) => ({ loc: `${SITE_URL}/post/${p.id}`, lastmod: p.fecha, freq: "weekly", prio: "0.8" })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `
    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""}
    <changefreq>${u.freq}</changefreq>
    <priority>${u.prio}</priority>
  </url>`).join("\n")}
</urlset>`;
  return xml(body, "application/xml");
}

async function rss() {
  const posts = await listPosts({ max: 30, fields: ["titulo", "fecha", "contenido", "imagen", "categoria", "autor"] });
  const items = posts.map((p) => {
    let desc = toPlainText(p.contenido) || toPlainText(p.titulo);
    if (desc.length > 300) desc = desc.substring(0, 297).trimEnd() + "...";
    const url = `${SITE_URL}/post/${p.id}`;
    return `    <item>
      <title>${escapeXml(toPlainText(p.titulo))}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${p.fecha ? `<pubDate>${new Date(p.fecha).toUTCString()}</pubDate>` : ""}
      ${p.categoria ? `<category>${escapeXml(p.categoria)}</category>` : ""}
      <dc:creator>${escapeXml(p.autor || "Redacción")}</dc:creator>
      <description>${escapeXml(desc)}</description>
      ${/^https:\/\//.test(p.imagen || "") ? `<media:content url="${escapeXml(p.imagen)}" medium="image" />` : ""}
    </item>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Azul Mar Caribe</title>
    <link>${SITE_URL}/</link>
    <description>Cultura, entretenimiento y noticias de la región Caribe colombiana.</description>
    <language>es-CO</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${posts[0]?.fecha ? `<lastBuildDate>${new Date(posts[0].fecha).toUTCString()}</lastBuildDate>` : ""}
${items.join("\n")}
  </channel>
</rss>`;
  return xml(body, "application/rss+xml");
}

export default async (request, context) => {
  const { pathname } = new URL(request.url);
  try {
    if (pathname === "/sitemap.xml") return await sitemap();
    if (pathname === "/rss.xml") return await rss();
  } catch (error) {
    console.log("Error generando feed:", error);
    return new Response("Servicio no disponible temporalmente", { status: 503 });
  }
  return context.next();
};
