import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase/config'; 
import { doc, getDoc, collection, addDoc, deleteDoc, onSnapshot, query, orderBy, where, limit, getDocs } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
// Componentes
import ShareButtons from '../components/ShareButtons';
import PostSkeleton from '../components/PostSkeleton'; // Reutilizamos el skeleton para carga suave
// Íconos
import { ArrowLeft, MessageSquare, Send, User, Trash2, Calendar, Sparkles } from 'lucide-react';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relacionadas, setRelacionadas] = useState([]); // Estado para noticias sugeridas
  
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState({ autor: '', texto: '' });

  const user = auth.currentUser;
  const isAdmin = !!user; 

  // 1. CARGAR NOTICIA ACTUAL
  useEffect(() => {
    const getPost = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            setPost(data);
            // Una vez tenemos el post, cargamos las relacionadas
            fetchRelacionadas(data.categoria, data.id);
        } else {
            console.log("No existe el documento");
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    getPost();
    
    // Scrollear arriba al cambiar de noticia
    window.scrollTo(0, 0);
  }, [id]);

  // 2. FUNCIÓN PARA CARGAR RELACIONADAS
  const fetchRelacionadas = async (categoria, currentId) => {
    try {
        const postsRef = collection(db, "posts");
        // Buscamos noticias de la misma categoría
        const q = query(
            postsRef, 
            where("categoria", "==", categoria),
            orderBy("fecha", "desc"),
            limit(4) // Traemos 4 por si una es la actual
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(doc => doc.id !== currentId) // Quitamos la noticia actual
            .slice(0, 3); // Dejamos solo 3

        setRelacionadas(docs);
    } catch (error) {
        console.error("Error cargando relacionadas (Posible falta de índice):", error);
    }
  };

  // 3. CARGAR COMENTARIOS (Realtime)
  useEffect(() => {
    const commentsRef = collection(db, "posts", id, "comments");
    const q = query(commentsRef, orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComentarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  const handleSubmitComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.autor || !nuevoComentario.texto) return alert("Llena ambos campos");
    try {
      await addDoc(collection(db, "posts", id, "comments"), { ...nuevoComentario, fecha: Date.now() });
      setNuevoComentario({ autor: '', texto: '' });
    } catch (error) { console.error(error); }
  };

  const handleDeleteComment = async (commentId) => {
    if(window.confirm("¿Borrar este comentario?")) {
        await deleteDoc(doc(db, "posts", id, "comments", commentId));
    }
  }

  const formatearFecha = (timestamp) => {
    if(!timestamp) return "";
    return new Date(timestamp).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // --- RENDER ---

  if (loading) return <div className="container py-5"><div className="spinner-border text-primary"></div></div>;
  if (!post) return <div className="container py-5 text-center"><h3>Noticia no encontrada</h3><Link to="/">Volver</Link></div>;

  return (
    <div className="container py-5">
      
      {/* SEO AVANZADO (Open Graph para WhatsApp) */}
      <Helmet>
        <title>{post.titulo} | Azul Mar Caribe</title>
        <meta name="description" content={post.contenido.substring(0, 150)} />
        
        {/* Facebook / WhatsApp */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.titulo} />
        <meta property="og:description" content={post.contenido.substring(0, 150)} />
        <meta property="og:image" content={post.imagen || "https://via.placeholder.com/800"} />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      <div className="row justify-content-center">
        <div className="col-lg-8">
            
            {/* BOTÓN VOLVER */}
            <Link to="/" className="btn btn-light mb-4 shadow-sm fw-bold text-primary px-4 rounded-pill d-inline-flex align-items-center gap-2">
                <ArrowLeft size={18} /> Volver al Inicio
            </Link>

            {/* ARTÍCULO PRINCIPAL */}
            <article className="mb-5 bg-white p-4 p-md-5 rounded-4 shadow-sm border-0">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className={`badge ${post.categoria === 'Cultural' ? 'bg-info text-dark' : 'bg-warning text-dark'} fs-6 px-3 py-2 rounded-pill`}>
                        {post.categoria}
                    </span>
                    <small className="text-muted d-flex align-items-center gap-1">
                        <Calendar size={14} /> {formatearFecha(post.fecha)}
                    </small>
                </div>
                
                <h1 className="fw-bold mb-4 display-5 text-dark" style={{letterSpacing: '-1px'}}>{post.titulo}</h1>
                
                {post.imagen && (
                    <img src={post.imagen} className="img-fluid rounded-4 shadow-sm mb-4 w-100" style={{maxHeight:'500px', objectFit:'cover'}} alt={post.titulo} onError={(e) => e.target.src = "https://via.placeholder.com/800x400?text=Azul+Mar+Caribe"} />
                )}
                
                <div style={{lineHeight: '1.9', fontSize: '1.15rem', color: '#333'}} dangerouslySetInnerHTML={{ __html: post.contenido }} />

                <div className="mt-5">
                    <ShareButtons title={post.titulo} />
                </div>
            </article>

            {/* --- SECCIÓN NOTICIAS RELACIONADAS --- */}
            {relacionadas.length > 0 && (
                <section className="mb-5">
                    <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
                        <Sparkles className="text-warning" /> También te podría interesar
                    </h4>
                    <div className="row g-3">
                        {relacionadas.map(rel => (
                            <div key={rel.id} className="col-md-4">
                                <Link to={`/post/${rel.id}`} className="text-decoration-none text-dark">
                                    <div className="card h-100 border-0 shadow-sm hover-effect">
                                        <img src={rel.imagen} alt={rel.titulo} className="card-img-top" style={{height:'120px', objectFit:'cover'}} />
                                        <div className="card-body p-3">
                                            <h6 className="card-title fw-bold mb-0" style={{fontSize: '0.9rem'}}>{rel.titulo}</h6>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* SECCIÓN DE COMENTARIOS */}
            <section className="bg-white p-4 rounded-4 shadow-sm border-0">
                <h3 className="mb-4 fw-bold text-primary d-flex align-items-center gap-2 border-bottom pb-3">
                    <MessageSquare size={24} /> Comentarios ({comentarios.length})
                </h3>

                <form onSubmit={handleSubmitComentario} className="mb-5 bg-light p-4 rounded-3 border">
                    <h6 className="fw-bold mb-3 text-secondary">Deja tu opinión:</h6>
                    <div className="mb-3">
                        <input type="text" className="form-control border-0 shadow-sm" placeholder="Tu Nombre" value={nuevoComentario.autor} onChange={(e) => setNuevoComentario({...nuevoComentario, autor: e.target.value})} />
                    </div>
                    <div className="mb-3">
                        <textarea className="form-control border-0 shadow-sm" rows="3" placeholder="¿Qué opinas?" value={nuevoComentario.texto} onChange={(e) => setNuevoComentario({...nuevoComentario, texto: e.target.value})}></textarea>
                    </div>
                    <div className="text-end">
                        <button type="submit" className="btn btn-primary fw-bold px-4 rounded-pill d-inline-flex align-items-center gap-2">
                            <Send size={16} /> Publicar
                        </button>
                    </div>
                </form>

                <div className="d-flex flex-column gap-3">
                    {comentarios.map(c => (
                        <div key={c.id} className="card border-0 bg-light rounded-3 p-3">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                                        <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white" style={{width:'30px', height:'30px'}}><User size={16} /></div> {c.autor}
                                    </h6>
                                    <small className="text-muted d-block mb-2 ms-5" style={{fontSize:'0.75rem', marginTop: '-5px'}}>{formatearFecha(c.fecha)}</small>
                                    <p className="mb-0 text-secondary ms-5">{c.texto}</p>
                                </div>
                                {isAdmin && (
                                    <button onClick={() => handleDeleteComment(c.id)} className="btn btn-outline-danger btn-sm border-0 p-2 rounded-circle hover-bg-danger" title="Eliminar"><Trash2 size={18} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                    {comentarios.length === 0 && <p className="text-center text-muted py-3">Sé el primero en opinar.</p>}
                </div>
            </section>

        </div>
      </div>
    </div>
  );
}