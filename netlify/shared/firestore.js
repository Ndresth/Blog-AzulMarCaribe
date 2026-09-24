// Lectura pública de Firestore vía REST (sin SDK) para las Edge Functions
export const PROJECT_ID = "blog-cultural-app";
export const SITE_URL = "https://blog-azulmarcaribe.netlify.app";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export const escapeXml = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const toPlainText = (html) =>
  String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

// Convierte los valores tipados de Firestore REST ({stringValue}, {integerValue}...) a JS
const valor = (v) => {
  if (!v) return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("timestampValue" in v) return Date.parse(v.timestampValue);
  if ("booleanValue" in v) return v.booleanValue;
  return undefined;
};

export const docToPost = (d) => {
  const out = { id: d.name.split("/").pop() };
  for (const [k, v] of Object.entries(d.fields || {})) out[k] = valor(v);
  return out;
};

export async function getPost(id) {
  const res = await fetch(`${BASE}/posts/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.fields ? docToPost(data) : null;
}

// Lista noticias ordenadas por fecha (más recientes primero)
export async function listPosts({ max = 500, fields = ["titulo", "fecha"] } = {}) {
  const posts = [];
  let pageToken = "";
  while (posts.length < max) {
    const params = new URLSearchParams({ pageSize: String(Math.min(300, max - posts.length)), orderBy: "fecha desc" });
    fields.forEach((f) => params.append("mask.fieldPaths", f));
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`${BASE}/posts?${params}`);
    if (!res.ok) throw new Error(`Firestore ${res.status}`);
    const data = await res.json();
    (data.documents || []).forEach((d) => posts.push(docToPost(d)));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return posts;
}
