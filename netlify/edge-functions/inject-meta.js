export default async (request, context) => {
  // 1. GRITO INICIAL: Para saber si la función despierta
  console.log(">>> 🚀 ¡EL PORTERO ESTÁ VIVO! URL: " + request.url);

  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const postId = pathParts[pathParts.length - 1];
  
  console.log(">>> ID DETECTADO: " + postId);

  // REEMPLAZA CON TU ID REAL SI ES DIFERENTE
  const PROJECT_ID = "blog-cultural-app"; 
  const apiUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts/${postId}`;
  
  try {
    console.log(">>> CONSULTANDO FIREBASE...");
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Vemos qué respondió Google (solo los primeros caracteres para no llenar la pantalla)
    console.log(">>> RESPUESTA FIREBASE: ", JSON.stringify(data).substring(0, 50) + "...");

    if (data && data.fields) {
      console.log(">>> ¡HAY DATOS! CAMBIANDO ETIQUETAS...");
      
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
    } else {
        console.log(">>> ⚠️ NO SE ENCONTRÓ LA NOTICIA O EL FORMATO ES INCORRECTO");
    }
  } catch (error) {
    console.log(">>> ❌ ERROR FATAL EN EL PORTERO:", error);
  }

  return context.next();
};