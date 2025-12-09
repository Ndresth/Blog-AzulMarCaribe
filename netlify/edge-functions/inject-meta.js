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
      const titulo = data.fields.titulo?.stringValue || "Azul Mar Caribe";
      
      // Limpieza de descripción para evitar romper el HTML
      let rawDesc = data.fields.contenido?.stringValue || "Noticias culturales.";
      // Quitamos comillas dobles y saltos de línea
      const descripcion = rawDesc.replace(/["\n\r]/g, " ").substring(0, 150) + "...";
      
      const imagen = data.fields.imagen?.stringValue || "https://blog-azulmarcaribe.netlify.app/logo.png";
      const currentUrl = request.url;

      const originalResponse = await context.next();
      const page = await originalResponse.text();

      // --- REEMPLAZO ROBUSTO (No importa el orden de los atributos) ---
      const updatedPage = page
        // Reemplazar <title>
        .replace(/<title>.*?<\/title>/s, `<title>${titulo} | Azul Mar Caribe</title>`)
        
        // Reemplazar og:title (busca cualquier meta con property="og:title")
        .replace(
          /<meta[^>]*property=["']og:title["'][^>]*>/i, 
          `<meta property="og:title" content="${titulo}" />`
        )
        
        // Reemplazar og:description
        .replace(
          /<meta[^>]*property=["']og:description["'][^>]*>/i, 
          `<meta property="og:description" content="${descripcion}" />`
        )
        
        // Reemplazar og:image (¡Ojo! Bandera 'g' por si sale varias veces)
        .replace(
          /<meta[^>]*property=["']og:image["'][^>]*>/gi, 
          `<meta property="og:image" content="${imagen}" />`
        )
        
        // Reemplazar og:url
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