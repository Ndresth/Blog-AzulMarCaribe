export default async (request, context) => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const postId = pathParts[pathParts.length - 1];

  // CORRECCIÓN: Entre comillas para que sea texto
  const PROJECT_ID = "blog-cultural-app"; 

  const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts/${postId}`;
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data && data.fields) {
      const titulo = data.fields.titulo?.stringValue || "Azul Mar Caribe";
      const descripcion = data.fields.contenido?.stringValue?.substring(0, 150) || "Noticias culturales.";
      const imagen = data.fields.imagen?.stringValue || "https://blog-azulmarcaribe.netlify.app/logo.png";

      const originalResponse = await context.next();
      const page = await originalResponse.text();

      const updatedPage = page
        .replace(/<title>.*?<\/title>/, `<title>${titulo} | Azul Mar Caribe</title>`)
        .replace(/content="Azul Mar Caribe - Cultura y Entretenimiento"/g, `content="${titulo}"`)
        .replace(/content="El mejor blog de noticias.*?"/g, `content="${descripcion}..."`)
        .replace(/content="https:\/\/blog-azulmarcaribe.netlify.app\/logo.png"/g, `content="${imagen}"`);

      return new Response(updatedPage, {
        headers: { "content-type": "text/html" },
      });
    }
  } catch (error) {
    console.log("Error buscando metadatos:", error);
  }

  return context.next();
};