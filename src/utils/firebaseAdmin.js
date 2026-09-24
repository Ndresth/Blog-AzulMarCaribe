// Utilidades que solo usa el panel admin (se cargan con su chunk diferido)
import { collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { app, db } from '../firebase/config';

const storage = getStorage(app);
const BUCKET = import.meta.env.VITE_STORAGE_BUCKET;

// Solo archivos subidos a nuestro bucket (no enlaces externos ni de YouTube)
export const esArchivoPropio = (url) =>
  typeof url === 'string'
  && url.startsWith('https://firebasestorage.googleapis.com/')
  && (!BUCKET || url.includes(`/b/${BUCKET}/o/`));

// Borra un archivo de Storage sin interrumpir el flujo si falla (ya borrado, sin permiso, etc.)
export const borrarArchivo = async (url) => {
  if (!esArchivoPropio(url)) return false;
  try {
    await deleteObject(ref(storage, url));
    return true;
  } catch (error) {
    if (error?.code !== 'storage/object-not-found') console.warn('No se pudo borrar el archivo:', error);
    return false;
  }
};

// Elimina la noticia con sus comentarios, sus likes y sus archivos en Storage.
// Primero las subcolecciones y después el documento principal.
export async function eliminarNoticiaCompleta(post) {
  let comentarios = 0, likes = 0, pendientes = false;

  // Si las reglas publicadas aún no permiten borrar comentarios/likes, la noticia se borra igual
  try {
    const [cs, ls] = await Promise.all([
      getDocs(collection(db, 'posts', post.id, 'comments')),
      getDocs(collection(db, 'posts', post.id, 'likes')),
    ]);
    const refs = [...cs.docs, ...ls.docs].map((d) => d.ref);
    for (let i = 0; i < refs.length; i += 450) {
      const batch = writeBatch(db);
      refs.slice(i, i + 450).forEach((r) => batch.delete(r));
      await batch.commit();
    }
    comentarios = cs.size;
    likes = ls.size;
  } catch (error) {
    console.warn('No se pudieron borrar comentarios/likes:', error);
    pendientes = true;
  }

  await deleteDoc(doc(db, 'posts', post.id));

  const archivos = await Promise.all([post.imagen, post.videoUrl].map(borrarArchivo));

  return { comentarios, likes, archivos: archivos.filter(Boolean).length, pendientes };
}
