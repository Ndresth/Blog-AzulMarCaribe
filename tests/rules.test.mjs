import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, writeBatch, increment } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import fs from 'fs';

// Se ejecuta con: npm run test:rules  (requiere Java para el emulador de Firebase)
const R = new URL('../', import.meta.url).pathname;
const env = await initializeTestEnvironment({
  projectId: 'demo-blog',
  firestore: { rules: fs.readFileSync(R + 'firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  storage: { rules: fs.readFileSync(R + 'storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
});

const admin = env.authenticatedContext('admin1', { email: 'yamithadresjulio@gmail.com', email_verified: true });
const adminMayus = env.authenticatedContext('admin2', { email: 'Delosreyesxiomara75@gmail.com', email_verified: true });
const adminNoVerif = env.authenticatedContext('admin3', { email: 'xiomysofy24@gmail.com', email_verified: false });
const user = env.authenticatedContext('u1', { email: 'lector@gmail.com', email_verified: true });
const user2 = env.authenticatedContext('u2', { email: 'otro@gmail.com', email_verified: true });
const anon = env.unauthenticatedContext();

let ok = 0, bad = 0;
const t = async (name, p, expect) => {
  try { await (expect ? assertSucceeds(p) : assertFails(p)); ok++; console.log('  ✓', name); }
  catch (e) { bad++; console.log('  ✗', name, '->', e.message.split('\n')[0]); }
};
const fs_ = (c) => c.firestore();
const post = { titulo: 'Hola', categoria: 'Cultural', contenido: '<p>x</p>', fecha: Date.now(), imagen: '', videoUrl: '', autor: 'Yamith' };

await env.withSecurityRulesDisabled(async (c) => {
  await setDoc(doc(c.firestore(), 'posts/p1'), { ...post, likes: 3 });
  await setDoc(doc(c.firestore(), 'posts/legacy'), { ...post });            // sin campo likes
  await setDoc(doc(c.firestore(), 'posts/p1/comments/legacyC'), { autor: 'Viejo', email: 'a@b.c', texto: 'hola', fecha: 1 });
  await setDoc(doc(c.firestore(), 'posts/p1/likes/u9'), { uid: 'u9' });
  await uploadBytes(ref(c.storage(), 'otra_carpeta/vieja.jpg'), new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });
});

console.log('NOTICIAS');
await t('anónimo lee noticia', getDoc(doc(fs_(anon), 'posts/p1')), true);
await t('anónimo no crea', setDoc(doc(fs_(anon), 'posts/x'), post), false);
await t('lector no crea', setDoc(doc(fs_(user), 'posts/x'), post), false);
await t('admin crea', setDoc(doc(fs_(admin), 'posts/nuevo'), post), true);
await t('admin con mayúsculas en el correo crea', addDoc(collection(fs_(adminMayus), 'posts'), post), true);
await t('admin con email sin verificar no crea', addDoc(collection(fs_(adminNoVerif), 'posts'), post), false);
await t('admin: categoría inválida rechazada', setDoc(doc(fs_(admin), 'posts/y'), { ...post, categoria: 'Otra' }), false);
await t('admin: título vacío rechazado', setDoc(doc(fs_(admin), 'posts/y'), { ...post, titulo: '' }), false);
await t('admin edita', updateDoc(doc(fs_(admin), 'posts/p1'), { titulo: 'Editado' }), true);
await t('lector no edita título', updateDoc(doc(fs_(user), 'posts/p1'), { titulo: 'hack' }), false);
await t('lector no borra', deleteDoc(doc(fs_(user), 'posts/nuevo')), false);

console.log('ME GUSTA');
const like = (c, pid, sign) => { const b = writeBatch(fs_(c)); const lr = doc(fs_(c), `posts/${pid}/likes/${c === user ? 'u1' : 'u2'}`);
  if (sign > 0) b.set(lr, { uid: c === user ? 'u1' : 'u2' }); else b.delete(lr);
  b.update(doc(fs_(c), `posts/${pid}`), { likes: increment(sign) }); return b.commit(); };
await t('lector da like (batch)', like(user, 'p1', 1), true);
await t('lector no puede dar like dos veces', like(user, 'p1', 1), false);
await t('lector no sube contador sin crear su like', updateDoc(doc(fs_(user2), 'posts/p1'), { likes: increment(1) }), false);
await t('lector no suma +5', (() => { const b = writeBatch(fs_(user2)); b.set(doc(fs_(user2), 'posts/p1/likes/u2'), { uid: 'u2' }); b.update(doc(fs_(user2), 'posts/p1'), { likes: increment(5) }); return b.commit(); })(), false);
await t('lector no crea like a nombre de otro', setDoc(doc(fs_(user2), 'posts/p1/likes/u9x'), { uid: 'u9x' }), false);
await t('lector quita su like (batch)', like(user, 'p1', -1), true);
await t('lector no resta sin tener like', like(user, 'p1', -1), false);
await t('like en noticia sin campo likes', like(user2, 'legacy', 1), true);
await t('lector no cambia likes y título a la vez', (() => { const b = writeBatch(fs_(user)); b.set(doc(fs_(user), 'posts/p1/likes/u1'), { uid: 'u1' }); b.update(doc(fs_(user), 'posts/p1'), { likes: increment(1), titulo: 'x' }); return b.commit(); })(), false);
let snap; await env.withSecurityRulesDisabled(async (c) => { snap = (await getDoc(doc(c.firestore(), 'posts/p1'))).data().likes; });
console.log('  contador final p1 =', snap, '(esperado 3)');
if (snap !== 3) bad++;

console.log('COMENTARIOS');
const com = { autor: 'Lector', uid: 'u1', texto: 'Buen artículo', fecha: Date.now() };
await t('lector comenta', setDoc(doc(fs_(user), 'posts/p1/comments/c1'), com), true);
await t('anónimo no comenta', setDoc(doc(fs_(anon), 'posts/p1/comments/c2'), com), false);
await t('comentario con email rechazado', setDoc(doc(fs_(user), 'posts/p1/comments/c3'), { ...com, email: 'x@y.z' }), false);
await t('comentario con uid ajeno rechazado', setDoc(doc(fs_(user2), 'posts/p1/comments/c4'), com), false);
await t('comentario de 1001 caracteres rechazado', setDoc(doc(fs_(user), 'posts/p1/comments/c5'), { ...com, texto: 'a'.repeat(1001) }), false);
await t('comentario vacío rechazado', setDoc(doc(fs_(user), 'posts/p1/comments/c6'), { ...com, texto: '' }), false);
await t('lector no edita comentarios', updateDoc(doc(fs_(user), 'posts/p1/comments/c1'), { texto: 'x' }), false);
await t('otro lector no borra comentario ajeno', deleteDoc(doc(fs_(user2), 'posts/p1/comments/c1')), false);
await t('autor borra su comentario', deleteDoc(doc(fs_(user), 'posts/p1/comments/c1')), true);
await t('lector no borra comentario antiguo (sin uid)', deleteDoc(doc(fs_(user), 'posts/p1/comments/legacyC')), false);
await t('admin borra comentario antiguo', deleteDoc(doc(fs_(admin), 'posts/p1/comments/legacyC')), true);
await t('admin borra like ajeno (borrado completo)', deleteDoc(doc(fs_(admin), 'posts/p1/likes/u9')), true);
await t('admin borra noticia', deleteDoc(doc(fs_(admin), 'posts/nuevo')), true);

console.log('PERFILES');
await t('admin crea su perfil', setDoc(doc(fs_(admin), 'users/admin1'), { nombre: 'Y', email: 'yamithadresjulio@gmail.com', fechaRegistro: 1 }), true);
await t('admin lee su perfil', getDoc(doc(fs_(admin), 'users/admin1')), true);
await t('admin no lee perfil ajeno', getDoc(doc(fs_(admin), 'users/otro')), false);
await t('lector no crea perfil', setDoc(doc(fs_(user), 'users/u1'), { nombre: 'x' }), false);

console.log('STORAGE');
const st = (c) => c.storage();
await t('anónimo lee archivo antiguo', getBytes(ref(st(anon), 'otra_carpeta/vieja.jpg')), true);
await t('admin sube imagen', uploadBytes(ref(st(admin), 'blog_images/a.jpg'), new Uint8Array(1024), { contentType: 'image/jpeg' }), true);
await t('anónimo lee imagen', getBytes(ref(st(anon), 'blog_images/a.jpg')), true);
await t('lector no sube imagen', uploadBytes(ref(st(user), 'blog_images/b.jpg'), new Uint8Array(10), { contentType: 'image/jpeg' }), false);
await t('admin no sube .txt como imagen', uploadBytes(ref(st(admin), 'blog_images/c.txt'), new Uint8Array(10), { contentType: 'text/plain' }), false);
await t('admin no sube imagen > 5 MB', uploadBytes(ref(st(admin), 'blog_images/big.jpg'), new Uint8Array(5 * 1024 * 1024 + 1), { contentType: 'image/jpeg' }), false);
await t('admin sube video', uploadBytes(ref(st(admin), 'blog_videos/v.mp4'), new Uint8Array(2048), { contentType: 'video/mp4' }), true);
await t('admin no sube fuera de las carpetas del blog', uploadBytes(ref(st(admin), 'otra/x.jpg'), new Uint8Array(10), { contentType: 'image/jpeg' }), false);
await t('lector no borra imagen', deleteObject(ref(st(user), 'blog_images/a.jpg')), false);
await t('admin borra imagen', deleteObject(ref(st(admin), 'blog_images/a.jpg')), true);

console.log(`\n${ok} pasaron, ${bad} fallaron`);
await env.cleanup();
process.exit(bad ? 1 : 0);
