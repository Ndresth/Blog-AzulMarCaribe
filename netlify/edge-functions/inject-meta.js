export default async (request, context) => {
  const url = new URL(request.url);
  // Obtenemos el ID de la noticia desde la URL
  const pathParts = url.pathname.split("/");
  const postId = pathParts[pathParts.length - 1];

  // PON AQUÍ TU PROJECT ID EXACTO (búscalo en tu .env)
  const PROJECT_ID = "blog-cultural-app"; 

  // Buscamos la noticia directamente en la API de Google (es más rápido)
  const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts/${postId}`;
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Si encontramos la noticia, sacamos sus datos
    if (data && data.fields) {
      const titulo = data.fields.titulo?.stringValue || "Azul Mar Caribe";
      const descripcion = data.fields.contenido?.stringValue?.substring(0, 150) || "Noticias culturales.";
      const imagen = data.fields.imagen?.stringValue || "https://blog-azulmarcaribe.netlify.app/logo.png";

      // Obtenemos la página web original
      const originalResponse = await context.next();
      const page = await originalResponse.text();

      // Reemplazamos las etiquetas por defecto con las reales de la noticia
      const updatedPage = page
        .replace(/<title>.*?<\/title>/, `<title>${titulo} | Azul Mar Caribe</title>`)
        .replace(/content="Azul Mar Caribe - Cultura y Entretenimiento"/g, `content="${titulo}"`)
        .replace(/content="El mejor blog de noticias.*?"/g, `content="${descripcion}..."`)
        .replace(/content="https:\/\/blog-azulmarcaribe.netlify.app\/logo.png"/g, `content="${imagen}"`);

      return new Response(updatedPage, originalResponse);
    }
  } catch (error) {
    console.log("Error buscando metadatos:", error);
  }

  // Si algo falla, mostramos la página normal
  return context.next();
};