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
      // 3. Preparar los datos (CON LIMPIEZA EXTRA)
      const rawTitle = data.fields.titulo?.stringValue || "Azul Mar Caribe";
      const titulo = rawTitle.replace(/[<>"&]/g, ""); // Quitamos símbolos peligrosos del título
      
      let rawDesc = data.fields.contenido?.stringValue || "Noticias culturales.";
      
      // LIMPIEZA AGRESIVA: Quitamos comillas, saltos de línea Y símbolos < >
      const descripcion = rawDesc
        .replace(/["\n\r]/g, " ")   // Quitar comillas y enters
        .replace(/[<>"&]/g, "")     // Quitar < > " & (Vital para que no rompa el HTML)
        .substring(0, 150) + "...";
      
      const imagen = data.fields.imagen?.stringValue || "https://blog-azulmarcaribe.netlify.app/logo.png";
      const currentUrl = request.url;

      const originalResponse = await context.next();
      const page = await originalResponse.text();

      // 4. REEMPLAZO ROBUSTO
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