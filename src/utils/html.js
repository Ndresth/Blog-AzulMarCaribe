// DOMParser crea un documento inerte: no ejecuta scripts ni carga imágenes
// (a diferencia de asignar innerHTML a un <div>, que sí dispara onerror).
const parse = (html) => new DOMParser().parseFromString(html || '', 'text/html');

export const htmlToText = (html) =>
  (parse(html).body.textContent || '').replace(/\s+/g, ' ').trim();

export const resumen = (html, max = 140) => {
  const texto = htmlToText(html);
  return texto.length > max ? texto.substring(0, max).replace(/\s+\S*$/, '') + '…' : texto;
};

// Minutos de lectura estimados (≈200 palabras por minuto)
export const tiempoLectura = (html) => {
  const palabras = htmlToText(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
};

const ALLOWED_TAGS = new Set(['P', 'BR', 'B', 'I', 'U', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4', 'A', 'BLOCKQUOTE']);
const DROP_WITH_CONTENT = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT', 'HEAD', 'TITLE', 'META', 'LINK']);
const SAFE_HREF = /^(https?:|mailto:)/i;

const cleanNode = (node, doc) => {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) return;
    if (child.nodeType !== Node.ELEMENT_NODE) { child.remove(); return; }

    const tag = child.tagName;
    if (DROP_WITH_CONTENT.has(tag)) { child.remove(); return; }

    cleanNode(child, doc);

    if (!ALLOWED_TAGS.has(tag)) {
      // Etiqueta no permitida (div, span, font...): se conserva solo su contenido
      child.replaceWith(...child.childNodes);
      return;
    }

    const href = tag === 'A' ? (child.getAttribute('href') || '').trim() : null;
    [...child.attributes].forEach((attr) => child.removeAttribute(attr.name));

    if (tag === 'A') {
      if (SAFE_HREF.test(href)) {
        child.setAttribute('href', href);
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer nofollow');
      } else {
        child.replaceWith(...child.childNodes);
      }
    }
  });
};

// Deja solo etiquetas de texto básicas y enlaces http/https/mailto, sin atributos peligrosos
export const sanitizeHtml = (html) => {
  if (!html) return '';
  const doc = parse(html);
  cleanNode(doc.body, doc);
  return doc.body.innerHTML.trim();
};

// Soporta youtube.com/watch?v=, youtu.be/, /shorts/, /live/ y /embed/
export const getYouTubeEmbedUrl = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www\.|m\.)/, '');
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else {
        const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/);
        if (m) id = m[2];
      }
    }
    if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch {
    return null;
  }
};
