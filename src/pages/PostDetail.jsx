import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase/config'; 
import { 
  doc, getDoc, collection, addDoc, deleteDoc,
  onSnapshot, query, orderBy, where, limit, getDocs,
  writeBatch, increment
} from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { Helmet } from 'react-helmet-async';
import ShareButtons from '../components/ShareButtons';
import PostCard from '../components/PostCard';
import { ChevronRight, MessageSquare, Send, Trash2, Heart, LogIn, Clock, Compass } from 'lucide-react';
import { isAdminEmail, getCategoriaColor, handleImageError, formatearFecha, tiempoRelativo, iniciales, SITE_URL } from '../config/site';
import { sanitizeHtml, htmlToText, getYouTubeEmbedUrl, tiempoLectura } from '../utils/html';

// Barra fina que indica cuánto del artículo se ha leído
function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div className="reading-progress" style={{ width: `${progress}%` }} aria-hidden="true" />;
}

const MAX_COMENTARIO = 1000;

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relacionadas, setRelacionadas] = useState([]); 
  
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [errorComentario, setErrorComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = isAdminEmail(currentUser?.email);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (error) { console.error("Error login:", error); }
  };

  // CARGAR NOTICIA
  useEffect(() => {
    const getPost = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            // SANITIZAR EL CONTENIDO AL CARGAR
            data.contenido = sanitizeHtml(data.contenido || '');
            setPost(data);
            setLikes(data.likes || 0); 
            fetchRelacionadas(data.categoria, data.id);
        } else { setPost(null); }
      } catch (error) { console.error("Error cargando post:", error); } finally { setLoading(false); }
    };
    getPost();
  }, [id]);

  // VERIFICAR LIKE
  useEffect(() => {
    if (currentUser && id) {
        const checkUserLike = async () => {
            const likeRef = doc(db, "posts", id, "likes", currentUser.uid);
            const likeSnap = await getDoc(likeRef);
            if (likeSnap.exists()) { setHasLiked(true); } else { setHasLiked(false); }
        };
        checkUserLike();
    } else {
        setHasLiked(false);
    }
  }, [currentUser, id]);

  // RELACIONADAS
  const fetchRelacionadas = async (categoria, currentId) => {
    try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("categoria", "==", categoria), orderBy("fecha", "desc"), limit(4));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.id !== currentId).slice(0, 3);
        setRelacionadas(docs);
    } catch (error) { console.error("Error cargando relacionadas:", error); }
  };

  // COMENTARIOS
  useEffect(() => {
    const commentsRef = collection(db, "posts", id, "comments");
    const q = query(commentsRef, orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComentarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  // LIKE
  // El like y el contador se escriben en una sola operación atómica (lo exigen las reglas)
  const handleLike = async () => {
    if (!currentUser) return handleLogin();
    if (likePending) return;
    const postRef = doc(db, "posts", id);
    const likeRef = doc(db, "posts", id, "likes", currentUser.uid);
    const quitar = hasLiked;
    setLikePending(true);
    setLikes(prev => prev + (quitar ? -1 : 1));
    setHasLiked(!quitar);
    try {
      const batch = writeBatch(db);
      if (quitar) batch.delete(likeRef);
      else batch.set(likeRef, { uid: currentUser.uid });
      batch.update(postRef, { likes: increment(quitar ? -1 : 1) });
      await batch.commit();
    } catch (error) {
      console.error("Error like:", error);
      setLikes(prev => prev + (quitar ? 1 : -1));
      setHasLiked(quitar);
    } finally {
      setLikePending(false);
    }
  };

  // COMENTAR
  const handleSubmitComentario = async (e) => {
    e.preventDefault();
    const texto = nuevoComentario.trim().slice(0, MAX_COMENTARIO);
    if (!texto || !currentUser) return;
    try {
      setErrorComentario('');
      setEnviando(true);
      // Ya no se guarda el email: los comentarios son de lectura pública
      await addDoc(collection(db, "posts", id, "comments"), {
        autor: (currentUser.displayName || "Usuario").slice(0, 80),
        uid: currentUser.uid,
        texto,
        fecha: Date.now()
      });
      setNuevoComentario('');
    } catch (error) {
      console.error("Error:", error);
      setErrorComentario('No se pudo publicar el comentario. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if(window.confirm("¿Borrar comentario?")) {
        try { await deleteDoc(doc(db, "posts", id, "comments", commentId)); } catch (error) { console.error(error); }
    }
  }

  if (loading) {
    return (
      <div className="container py-5" aria-busy="true">
        <div className="article-header">
          <div className="skeleton mb-3" style={{ height: 14, width: 120 }}></div>
          <div className="skeleton mb-2" style={{ height: 44, width: '95%' }}></div>
          <div className="skeleton mb-4" style={{ height: 44, width: '70%' }}></div>
          <div className="skeleton mb-5" style={{ height: 44, width: 260, borderRadius: 999 }}></div>
        </div>
        <div className="article-figure skeleton" style={{ aspectRatio: '16 / 8' }}></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-5 my-5 text-center">
        <Compass size={56} strokeWidth={1.5} className="text-primary mb-3" />
        <h1 className="h3 font-serif">No encontramos esta noticia</h1>
        <p className="text-secondary mb-4">Puede que haya sido eliminada o que el enlace esté incompleto.</p>
        <Link to="/" className="btn btn-primary rounded-pill px-4">Ir a la portada</Link>
      </div>
    );
  }

  const seoTitle = htmlToText(post.titulo);
  const seoDesc = htmlToText(post.contenido).substring(0, 160) || `${seoTitle} - Azul Mar Caribe`;
  const seoImage = post.imagen || `${SITE_URL}/og-image.jpg`;
  const canonicalUrl = `${SITE_URL}/post/${id}`;
  const youtubeEmbed = post.videoUrl ? getYouTubeEmbedUrl(post.videoUrl) : null;
  const autor = post.autor || 'Redacción';

  return (
    <main id="contenido">
      <ReadingProgress />

      <Helmet>
        <title>{`${seoTitle} | Azul Mar Caribe`}</title>
        <meta name="description" content={seoDesc} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <article>
        {/* ENCABEZADO */}
        <header className="container pt-4 pt-lg-5">
          <div className="article-header">
            <nav className="breadcrumb-lite mb-4" aria-label="Ruta">
              <Link to="/">Portada</Link>
              <ChevronRight size={14} />
              <Link to={`/?cat=${encodeURIComponent(post.categoria || '')}`} style={{ color: getCategoriaColor(post.categoria) }} className="fw-semibold">
                {post.categoria}
              </Link>
            </nav>

            <h1 className="article-title mb-4">{post.titulo}</h1>

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 pb-4 mb-4 border-bottom">
              <div className="d-flex align-items-center gap-3">
                <span className="author-avatar" aria-hidden="true">{iniciales(autor)}</span>
                <div>
                  <div className="fw-semibold text-dark">Por {autor}</div>
                  <div className="post-meta">
                    <time dateTime={post.fecha ? new Date(post.fecha).toISOString() : undefined}>{formatearFecha(post.fecha)}</time>
                    <span className="sep" />
                    <span className="d-inline-flex align-items-center gap-1"><Clock size={13} /> {tiempoLectura(post.contenido)} min de lectura</span>
                  </div>
                </div>
              </div>
              <ShareButtons title={seoTitle} url={canonicalUrl} />
            </div>
          </div>
        </header>

        {post.imagen && (
          <figure className="article-figure container mb-5">
            <img src={post.imagen} alt={seoTitle} onError={handleImageError} fetchPriority="high" />
          </figure>
        )}

        {/* CONTENIDO YA SANITIZADO */}
        <div className="container">
          <div className="post-content" dangerouslySetInnerHTML={{ __html: post.contenido || '' }} />

          {post.videoUrl && (
            <div className="article-narrow mt-5" key={`video-section-${id}`}>
              <h2 className="section-title"><span className="bar" /> Video</h2>
              <div className="ratio ratio-16x9 video-frame">
                {youtubeEmbed ? (
                  <iframe
                    src={youtubeEmbed}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Video: ${seoTitle}`}
                    loading="lazy"
                  />
                ) : (
                  <video controls preload="metadata">
                    <source src={post.videoUrl} />
                    Tu navegador no soporta la reproducción de video.
                  </video>
                )}
              </div>
            </div>
          )}

          {/* LIKES Y COMPARTIR */}
          <div className="article-narrow d-flex flex-column flex-sm-row gap-3 align-items-sm-center justify-content-between border-top border-bottom py-4 my-5">
            <button onClick={handleLike} className={`like-btn${hasLiked ? ' liked' : ''}`} aria-pressed={hasLiked} disabled={likePending}>
              <Heart size={19} fill={hasLiked ? 'currentColor' : 'none'} />
              {hasLiked ? 'Te gusta' : 'Me gusta'}
              <span className="count">{likes}</span>
            </button>
            <div className="d-flex align-items-center gap-3">
              <span className="small text-secondary fw-semibold">Compartir</span>
              <ShareButtons title={seoTitle} url={canonicalUrl} />
            </div>
          </div>
        </div>
      </article>

      <div className="container">
        {/* RELACIONADAS */}
        {relacionadas.length > 0 && (
          <section className="mb-5" aria-label="Noticias relacionadas" style={{ maxWidth: 1040, margin: '0 auto' }}>
            <h2 className="section-title" style={{ '--cat-color': getCategoriaColor(post.categoria) }}>
              <span className="bar" /> Más de {post.categoria}
            </h2>
            <div className="row g-4">
              {relacionadas.map(rel => (
                <div key={rel.id} className="col-md-4">
                  <PostCard post={rel} compact />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* COMENTARIOS */}
        <section className="comments-card article-narrow" aria-label="Comentarios" style={{ maxWidth: 760 }}>
          <h2 className="h4 font-serif fw-bold mb-4 d-flex align-items-center gap-2">
            <MessageSquare size={22} className="text-primary" /> Comentarios
            <span className="badge rounded-pill text-bg-light border fw-semibold">{comentarios.length}</span>
          </h2>

          {currentUser ? (
            <form onSubmit={handleSubmitComentario} className="comment-form mb-4">
              <div className="d-flex gap-3">
                <img
                  src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'U')}`}
                  alt=""
                  className="rounded-circle flex-shrink-0"
                  width="38" height="38"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-grow-1">
                  <label htmlFor="comentario" className="visually-hidden">Escribe tu comentario</label>
                  <textarea
                    id="comentario"
                    className="form-control"
                    rows="3"
                    placeholder={`Comenta como ${currentUser.displayName || 'usuario'}…`}
                    maxLength={MAX_COMENTARIO}
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                  ></textarea>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <small className="text-muted">{nuevoComentario.length}/{MAX_COMENTARIO}</small>
                    <button type="submit" className="btn btn-primary btn-sm fw-semibold px-3 rounded-pill d-inline-flex align-items-center gap-2" disabled={!nuevoComentario.trim() || enviando}>
                      <Send size={15} /> Publicar
                    </button>
                  </div>
                </div>
              </div>
              {errorComentario && <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">{errorComentario}</div>}
            </form>
          ) : (
            <div className="text-center py-4 px-3 mb-4 rounded-3" style={{ background: 'var(--bg)' }}>
              <p className="text-secondary mb-3">Inicia sesión para comentar y dar “Me gusta”.</p>
              <button onClick={handleLogin} className="btn btn-dark rounded-pill px-4 d-inline-flex align-items-center gap-2">
                <LogIn size={18} /> Continuar con Google
              </button>
            </div>
          )}

          {comentarios.length === 0 ? (
            <p className="text-muted text-center mb-0 pt-3 border-top">Sé el primero en comentar.</p>
          ) : (
            <div>
              {comentarios.map(c => (
                <div key={c.id} className="comment">
                  <span className="avatar" aria-hidden="true">{iniciales(c.autor)}</span>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <span className="fw-semibold text-dark">{c.autor}</span>
                        <span className="text-muted small ms-2">{tiempoRelativo(c.fecha)}</span>
                      </div>
                      {(isAdmin || (currentUser && c.uid === currentUser.uid)) && (
                        <button onClick={() => handleDeleteComment(c.id)} className="btn btn-sm btn-link text-danger p-0" title="Eliminar comentario" aria-label="Eliminar comentario">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="mb-0 mt-1 text-secondary" style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{c.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
