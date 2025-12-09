export default async (request, context) => {
  const url = new URL(request.url);
  
  // Solo actuamos si es una ruta de post
  if (!url.pathname.startsWith("/post/")) {
    return context.next();
  }

  // Obtenemos el ID (última parte de la URL)
  const pathParts = url.pathname.split("/");
  const postId = pathParts[pathParts.length - 1];
  
  console.log(`>>> 🚀 INTENTO DE INYECCIÓN PARA POST: ${postId}`);

  // ID DEL PROYECTO (Asegúrate que sea el tuyo)
  const PROJECT_ID = "blog-cultural-app"; 
  const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts/${postId}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.log(`>>> ❌ Error fetching Firebase: ${response.status}`);
      return context.next();
    }

    const data = await response.json();

    if (data && data.fields) {
      console.log(">>> ✅ DATOS ENCONTRADOS. INYECTANDO...");

      const titulo = data.fields.titulo?.stringValue || "Azul Mar Caribe";
      // Limpiamos un poco la descripción para que no rompa el HTML con comillas
      let rawDesc = data.fields.contenido?.stringValue || "Noticias culturales.";
      const descripcion = rawDesc.replace(/"/g, "'").substring(0, 150);

      // Si no hay imagen, usamos el logo por defecto
      const imagen = data.fields.imagen?.stringValue || "https://blog-azulmarcaribe.netlify.app/logo.png";
      const currentUrl = request.url; // La URL actual completa

      // Obtenemos el HTML original
      const originalResponse = await context.next();
      const page = await originalResponse.text();

      // --- REEMPLAZO QUIRÚRGICO MEJORADO ---
      // Reemplazamos las meta tags por defecto del index.html con las nuevas
      const updatedPage = page
        .replace(/<title>.*?<\/title>/, `<title>${titulo} | Azul Mar Caribe</title>`)
        .replace(/content="Azul Mar Caribe - Cultura y Entretenimiento"/, `content="${titulo}"`)
        .replace(/content="El mejor blog de noticias.*?"/, `content="${descripcion}..."`)
        
        // CORRECCIÓN CLAVE: Agregamos la bandera 'g' al final del regex (/.../g)
        // Esto asegura que reemplace TODAS las apariciones de la imagen por defecto
        .replace(/content="https:\/\/blog-azulmarcaribe.netlify.app\/logo.png"/g, `content="${imagen}"`)
        
        // IMPORTANTE: Cambiamos la URL canónica para que Facebook no se confunda
        .replace(/content="https:\/\/blog-azulmarcaribe.netlify.app\/"/, `content="${currentUrl}"`);

      return new Response(updatedPage, {
        headers: { "content-type": "text/html" },
      });
    }
  } catch (error) {
    console.log(">>> ❌ ERROR FATAL EN EDGE FUNCTION:", error);
  }

  return context.next();
};