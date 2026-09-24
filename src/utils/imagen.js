// Reduce las fotos antes de subirlas: una foto de celular (4000px, 4-8 MB) queda en ~200-400 KB.
const MAX_LADO = 1600;
const CALIDAD = 0.82;

export async function comprimirImagen(file) {
  // GIF (puede ser animado) y SVG se suben tal cual
  if (!/^image\/(jpeg|png|webp|heic|heif|bmp)$/i.test(file.type)) return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file; // formato que el navegador no puede decodificar
  }

  const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
  if (escala === 1 && file.size < 400 * 1024) { bitmap.close?.(); return file; }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const toBlob = (type) => new Promise((resolve) => canvas.toBlob(resolve, type, CALIDAD));
  // WebP si el navegador lo soporta; si no, JPEG
  let blob = await toBlob('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg');
  if (!blob || blob.size >= file.size) return file;

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const nombre = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
  return new File([blob], nombre, { type: blob.type, lastModified: Date.now() });
}
