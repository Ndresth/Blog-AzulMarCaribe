export default async (request, context) => {
  const url = new URL(request.url);
  
  if (!url.pathname.startsWith("/post/")) {
    return context.next();
  }

  const pathParts = url.pathname.split("/");
  const postId = pathParts[pathParts.length - 1];
  
  const PROJECT_ID = "blog-cultural-app"; 
  const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts/${postId}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return context.next();

    const data = await response.json();

    if (data && data.fields) {
      // --- LIMPIEZA DEL TÍTULO ---
      const rawTitle = data.fields.titulo?.stringValue || "Azul Mar Caribe";
      // Quitamos etiquetas HTML si las hubiera en el título y comillas
      const titulo = rawTitle.replace(/<[^>]+>/g, "").replace(/"/g, "'");

      // --- LIMPIEZA PROFUNDA DE LA DESCRIPCIÓN (EL CAMBIO CLAVE) ---
      let rawDesc = data.fields.contenido?.stringValue || "Noticias culturales.";
      
      const descripcion = rawDesc
        .replace(/<[^>]+>/g, " ")  // 1. Reemplaza CUALQUIER etiqueta (<p>, <h2>, </div>) por un espacio
        .replace(/&nbsp;/g, " ")   // 2. Reemplaza el código de espacio html
        .replace(/["\n\r]/g, " ")  // 3. Quita comillas y saltos de línea para no romper el meta
        .replace(/\s+/g, " ")      // 4. Si quedaron muchos espacios juntos, déjalos como uno solo
        .trim()                    // 5. Quita espacios al inicio y final
        .substring(0, 150) + "..."; // 6. Cortar

      const imagen = data.fields.imagen?.stringValue || "https://blog-azulmarcaribe.netlify.app/logo.png";
      const currentUrl = request.url;

      const originalResponse = await context.next();
      const page = await originalResponse.text();

      // --- REEMPLAZO EN EL HTML ---
      const updatedPage = page
        .replace(/<title>.*?<\/title>/s, `<title>${titulo} | Azul Mar Caribe</title>`)
        .replace(
          /<meta[^>]*property=["']og:title["'][^>]*>/i, 
          `<meta property="og:title" content="${titulo}" />`
        )
        .replace(
          /<meta[^>]*property=["']og:description["'][^>]*>/i, 
          `<meta property="og:description" content="${descripcion}" />`
        )
        .replace(
          /<meta[^>]*property=["']og:image["'][^>]*>/gi, 
          `<meta property="og:image" content="${imagen}" />`
        )
        .replace(
          /<meta[^>]*property=["']og:url["'][^>]*>/i, 
          `<meta property="og:url" content="${currentUrl}" />`
        );

      return new Response(updatedPage, {
        headers: { "content-type": "text/html" },
      });
    }
  } catch (error) {
    console.log("Error Edge Function:", error);
  }

  return context.next();
};