import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase/config'; 
import { 
  doc, getDoc, collection, addDoc, deleteDoc, setDoc, 
  onSnapshot, query, orderBy, where, limit, getDocs, 
  updateDoc, increment 
} from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { Helmet } from 'react-helmet-async';
import ShareButtons from '../components/ShareButtons';
import { ArrowLeft, MessageSquare, Send, User, Trash2, Calendar, Sparkles, Heart, LogIn, Video } from 'lucide-react';
import { isAdminEmail, getBadgeClass, handleImageError, formatearFecha, SITE_URL, FALLBACK_IMAGE } from '../config/site';
import { sanitizeHtml, htmlToText, getYouTubeEmbedUrl } from '../utils/html';

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
  const handleLike = async () => {
    if (!currentUser) return handleLogin(); 
    const postRef = doc(db, "posts", id);
    const likeRef = doc(db, "posts", id, "likes", currentUser.uid);
    try {
        if (hasLiked) {
            setLikes(prev => prev - 1); 
            setHasLiked(false);
            await deleteDoc(likeRef);
            await updateDoc(postRef, { likes: increment(-1) });
        } else {
            setLikes(prev => prev + 1);
            setHasLiked(true);
            await setDoc(likeRef, { uid: currentUser.uid });
            await updateDoc(postRef, { likes: increment(1) });
        }
    } catch (error) {
        console.error("Error like:", error);
        setLikes(prev => hasLiked ? prev + 1 : prev - 1);
        setHasLiked(!hasLiked);
    }
  };

  // COMENTAR
  const handleSubmitComentario = async (e) => {
    e.preventDefault();
    const texto = nuevoComentario.trim().slice(0, MAX_COMENTARIO);
    if (!texto || !currentUser) return;
    try {
      await addDoc(collection(db, "posts", id, "comments"), {
        autor: currentUser.displayName || "Usuario", 
        email: currentUser.email, 
        texto, 
        fecha: Date.now()
      });
      setNuevoComentario('');
    } catch (error) { console.error("Error:", error); }
  };

  const handleDeleteComment = async (commentId) => {
    if(window.confirm("¿Borrar comentario?")) {
        try { await deleteDoc(doc(db, "posts", id, "comments", commentId)); } catch (error) { console.error(error); }
    }
  }

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary"></div></div>;
  if (!post) return <div className="container py-5 text-center"><h3>Noticia no encontrada</h3><Link to="/">Volver</Link></div>;

  // APLICAMOS LA LIMPIEZA PARA SEO
  const seoTitle = htmlToText(post.titulo);
  const seoDesc = htmlToText(post.contenido).substring(0, 160);
  const seoImage = post.imagen || `${SITE_URL}${FALLBACK_IMAGE}`;
  const canonicalUrl = `${SITE_URL}/post/${id}`;
  const youtubeEmbed = post.videoUrl ? getYouTubeEmbedUrl(post.videoUrl) : null;

  return (
    <div className="container py-5" style={{maxWidth: '900px'}}>
      
      <Helmet>
        <title>{seoTitle} | Azul Mar Caribe</title>
        <meta name="description" content={seoDesc} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Link to="/" className="btn btn-light mb-4 shadow-sm fw-bold text-primary px-4 rounded-pill d-inline-flex align-items-center gap-2">
        <ArrowLeft size={18} /> Volver al Inicio
      </Link>

      <article className="mb-5 bg-white p-4 p-md-5 rounded-4 shadow-sm border-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <span className={`badge fs-6 px-3 py-2 rounded-pill ${getBadgeClass(post.categoria)}`}>
                {post.categoria}
            </span>
            <small className="text-muted d-flex align-items-center gap-1"><Calendar size={14} /> {formatearFecha(post.fecha)}</small>
        </div>
        
        <h1 className="fw-bold mb-4 display-5 text-dark">{post.titulo}</h1>
        <div className="d-flex align-items-center gap-2 mb-4 text-muted">
            <div className="bg-light rounded-circle p-2"><User size={18} /></div>
            <span className="small fw-bold">Por: {post.autor || "Redacción"}</span>
        </div>
        
        {post.imagen && <img src={post.imagen} className="img-fluid rounded-4 shadow-sm mb-4 w-100" style={{maxHeight:'500px', objectFit:'cover'}} alt={post.titulo} onError={handleImageError} />}
        
        {/* CONTENIDO YA SANITIZADO */}
        <div 
          className="post-content"
          style={{lineHeight: '1.9', fontSize: '1.15rem', color: '#333'}} 
          dangerouslySetInnerHTML={{ __html: post.contenido || '' }}
        />

        {/* VIDEO - CON LLAVE ÚNICA */}
        {post.videoUrl && (
            <div className="mt-5 pt-4 border-top" key={`video-section-${id}`}>
                <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <Video size={20} /> Video Relacionado
                </h5>
                <div className="ratio ratio-16x9 rounded-4 overflow-hidden shadow" style={{background:'#000'}}>
                    {youtubeEmbed ? (
                        <iframe 
                            src={youtubeEmbed} 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            title={`Video: ${post.titulo}`}
                            className="w-100 h-100"
                            key={`video-${id}`}
                            loading="lazy"
                        />
                    ) : (
                        <video controls className="w-100 h-100" key={`video-local-${id}`}>
                            <source src={post.videoUrl} />
                            Tu navegador no soporta la reproducción de video.
                        </video>
                    )}
                </div>
            </div>
        )}

        {/* LIKES Y COMPARTIR */}
        <div className="mt-5 d-flex flex-column flex-md-row gap-3 align-items-center justify-content-between border-top pt-4">
            <button 
                onClick={handleLike}
                className={`btn rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 transition-all ${hasLiked ? 'btn-danger' : 'btn-outline-danger'}`}
            >
                <Heart size={20} fill={hasLiked ? "currentColor" : "none"} />
                {hasLiked ? 'Te gusta' : 'Me gusta'} 
                <span className="badge bg-white text-danger ms-1 rounded-pill border border-danger">{likes}</span>
            </button>
            <div className="w-100 w-md-auto"><ShareButtons title={seoTitle} url={canonicalUrl} /></div>
        </div>
      </article>

      {/* RELACIONADAS */}
      {relacionadas.length > 0 && (
        <section className="mb-5">
            <h4 className="fw-bold mb-4 d-flex align-items-center gap-2 text-dark">
              <Sparkles className="text-warning" fill="orange" /> También te podría interesar
            </h4>
            <div className="row g-3">
                {relacionadas.map(rel => (
                    <div key={rel.id} className="col-md-4">
                        <Link to={`/post/${rel.id}`} className="text-decoration-none text-dark">
                            <div className="card h-100 border-0 shadow-sm hover-effect">
                                <img src={rel.imagen} alt={rel.titulo} className="card-img-top" style={{height:'120px', objectFit:'cover'}} loading="lazy" onError={handleImageError} />
                                <div className="card-body p-3"><h6 className="card-title fw-bold mb-0" style={{fontSize: '0.9rem'}}>{rel.titulo}</h6></div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </section>
      )}

      {/* COMENTARIOS */}
      <section className="bg-white p-4 rounded-4 shadow-sm border-0">
        <h3 className="mb-4 fw-bold text-primary d-flex align-items-center gap-2 border-bottom pb-3">
            <MessageSquare size={24} /> Comentarios ({comentarios.length})
        </h3>

        {currentUser ? (
            <form onSubmit={handleSubmitComentario} className="mb-5 bg-light p-4 rounded-3 border">
                <div className="d-flex align-items-center gap-2 mb-3">
                    <img src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'U')}`} alt="Avatar" className="rounded-circle" width="30" height="30" referrerPolicy="no-referrer" />
                    <span className="fw-bold text-dark">Comentando como: {currentUser.displayName}</span>
                </div>
                <div className="mb-3">
                    <textarea className="form-control border-0 shadow-sm" rows="3" placeholder="¿Qué opinas?" maxLength={MAX_COMENTARIO} value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)}></textarea>
                    <small className="text-muted d-block text-end mt-1">{nuevoComentario.length}/{MAX_COMENTARIO}</small>
                </div>
                <div className="text-end">
                    <button type="submit" className="btn btn-primary fw-bold px-4 rounded-pill d-inline-flex align-items-center gap-2"><Send size={16} /> Publicar</button>
                </div>
            </form>
        ) : (
            <div className="text-center py-4 mb-5 bg-light rounded-3 border">
                <p className="text-muted mb-3">Para dejar un comentario o dar Like, necesitas iniciar sesión.</p>
                <button onClick={handleLogin} className="btn btn-dark rounded-pill px-4 d-inline-flex align-items-center gap-2">
                    <LogIn size={20} /> Iniciar sesión con Google
                </button>
            </div>
        )}

        <div className="d-flex flex-column gap-3">
            {comentarios.map(c => (
                <div key={c.id} className="card border-0 bg-light rounded-3 p-3">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                                <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white" style={{width:'30px', height:'30px'}}><User size={16} /></div> {c.autor}
                            </h6>
                            <small className="text-muted d-block mb-2 ms-5" style={{fontSize:'0.75rem', marginTop: '-5px'}}>{formatearFecha(c.fecha)}</small>
                            <p className="mb-0 text-secondary ms-5" style={{whiteSpace: 'pre-line', wordBreak: 'break-word'}}>{c.texto}</p>
                        </div>
                        {isAdmin && (
                            <button onClick={() => handleDeleteComment(c.id)} className="btn btn-outline-danger btn-sm border-0 p-2 rounded-circle hover-bg-danger" title="Eliminar"><Trash2 size={18} /></button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}