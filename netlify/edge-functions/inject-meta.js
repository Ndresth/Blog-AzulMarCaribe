export default async (request, context) => {
  const url = new URL(request.url);
  
  // 1. Validar si es un post
  if (!url.pathname.startsWith("/post/")) {
    return context.next();
  }

  const pathParts = url.pathname.split("/");
  const postId = pathParts[pathParts.length - 1];
  
  // 2. Obtener datos de Firebase
  const PROJECT_ID = "blog-cultural-app"; 
  const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts/${postId}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return context.next();

    const data = await response.json();

    if (data && data.fields) {
      // 3. Preparar los nuevos datos
      const titulo = data.fields.titulo?.stringValue || "Azul Mar Caribe";
      
      let rawDesc = data.fields.contenido?.stringValue || "Noticias culturales.";
      // Limpiamos comillas dobles para no romper el HTML
      const descripcion = rawDesc.replace(/"/g, "'").substring(0, 150) + "...";
      
      const imagen = data.fields.imagen?.stringValue || "https://blog-azulmarcaribe.netlify.app/logo.png";
      const currentUrl = request.url;

      // 4. Obtener HTML original
      const originalResponse = await context.next();
      const page = await originalResponse.text();

      // 5. REEMPLAZO SEGURO (Reemplazamos toda la etiqueta meta para evitar errores)
      const updatedPage = page
        // Reemplazar Título
        .replace(
          /<title>.*?<\/title>/, 
          `<title>${titulo} | Azul Mar Caribe</title>`
        )
        .replace(
          /<meta property="og:title" content=".*?" \/>/, 
          `<meta property="og:title" content="${titulo}" />`
        )
        // Reemplazar Descripción
        .replace(
          /<meta property="og:description" content=".*?" \/>/, 
          `<meta property="og:description" content="${descripcion}" />`
        )
        // Reemplazar Imagen (Bandera 'g' por si aparece más de una vez)
        .replace(
          /<meta property="og:image" content=".*?" \/>/g, 
          `<meta property="og:image" content="${imagen}" />`
        )
        // Reemplazar URL Canónica
        .replace(
          /<meta property="og:url" content=".*?" \/>/, 
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