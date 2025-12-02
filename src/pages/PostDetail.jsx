import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase/config'; 
import { doc, getDoc, collection, addDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
// Componentes
import ShareButtons from '../components/ShareButtons';
// Íconos
import { ArrowLeft, MessageSquare, Send, User, Trash2, Calendar } from 'lucide-react';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState({ autor: '', texto: '' });

  // --- LÓGICA DE ADMIN CORREGIDA ---
  const user = auth.currentUser;
  
  // Lista de correos permitidos (Igual que en App.jsx)
  const adminsAutorizados = [
    "yamithadresjulio@gmail.com",
    "xiomysofy24@gmail.com"
  ];

  // Solo es admin si existe el usuario Y su correo está en la lista
  const isAdmin = user && adminsAutorizados.includes(user.email); 
  // --------------------------------
<Helmet>
        <title>{post.titulo} | Azul Mar Caribe</title>
        <meta name="description" content={post.contenido.substring(0, 150)} />
        
        {/* ESTO ES LO QUE HACE LA MAGIA EN WHATSAPP */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.titulo} />
        <meta property="og:description" content={post.contenido.substring(0, 150)} />
        <meta property="og:image" content={post.imagen} /> {/* Aquí va la foto */}
        <meta property="og:url" content={window.location.href} />
      </Helmet>
  // 1. Cargar Noticia
  useEffect(() => {
    const getPost = async () => {
      try {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setPost({ id: docSnap.id, ...docSnap.data() });
        } else {
            console.log("No existe el documento");
        }
      } catch (error) { console.error(error); }
    };
    getPost();
  }, [id]);

  // 2. Cargar Comentarios
  useEffect(() => {
    const commentsRef = collection(db, "posts", id, "comments");
    const q = query(commentsRef, orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComentarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  // 3. Crear Comentario
  const handleSubmitComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.autor || !nuevoComentario.texto) return alert("Llena ambos campos");
    try {
      await addDoc(collection(db, "posts", id, "comments"), {
        ...nuevoComentario,
        fecha: Date.now()
      });
      setNuevoComentario({ autor: '', texto: '' });
    } catch (error) { console.error(error); }
  };

  // 4. Borrar Comentario (Solo Admin)
  const handleDeleteComment = async (commentId) => {
    if(window.confirm("¿Borrar este comentario?")) {
        await deleteDoc(doc(db, "posts", id, "comments", commentId));
    }
  }

  const formatearFecha = (timestamp) => {
    if(!timestamp) return "";
    return new Date(timestamp).toLocaleString('es-CO');
  }

  if (!post) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;

  return (
    <div className="container py-5" style={{maxWidth: '900px'}}>
      
      <Helmet>
        <title>{post.titulo} | Azul Mar Caribe</title>
        <meta name="description" content={post.contenido.substring(0, 150)} />
        <meta property="og:title" content={post.titulo} />
        <meta property="og:description" content={post.contenido.substring(0, 150)} />
        <meta property="og:image" content={post.imagen || "https://via.placeholder.com/800"} />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

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

        {/* AUTOR */}
        <div className="d-flex align-items-center gap-2 mb-4 text-muted">
            <div className="bg-light rounded-circle p-2"><User size={18} /></div>
            <span className="small fw-bold">Por: {post.autor || "Redacción"}</span>
        </div>
        
        {post.imagen && (
            <img src={post.imagen} className="img-fluid rounded-4 shadow-sm mb-4 w-100" style={{maxHeight:'500px', objectFit:'cover'}} alt={post.titulo} onError={(e) => e.target.src = "https://via.placeholder.com/800x400?text=Azul+Mar+Caribe"} />
        )}
        
        {/* Contenido HTML */}
        <div 
            style={{lineHeight: '1.9', fontSize: '1.15rem', color: '#333'}}
            dangerouslySetInnerHTML={{ __html: post.contenido }}
        />

        {/* BOTONES DE COMPARTIR */}
        <div className="mt-5">
            <ShareButtons title={post.titulo} />
        </div>
      </article>

      {/* SECCIÓN DE COMENTARIOS */}
      <section className="bg-white p-4 rounded-4 shadow-sm border-0">
        <h3 className="mb-4 fw-bold text-primary d-flex align-items-center gap-2 border-bottom pb-3">
            <MessageSquare size={24} /> Comentarios ({comentarios.length})
        </h3>

        <form onSubmit={handleSubmitComentario} className="mb-5 bg-light p-4 rounded-3 border">
            <h6 className="fw-bold mb-3 text-secondary">Deja tu opinión:</h6>
            <div className="mb-3">
                <input 
                    type="text" className="form-control border-0 shadow-sm" placeholder="Tu Nombre" 
                    value={nuevoComentario.autor}
                    onChange={(e) => setNuevoComentario({...nuevoComentario, autor: e.target.value})}
                />
            </div>
            <div className="mb-3">
                <textarea 
                    className="form-control border-0 shadow-sm" rows="3" placeholder="¿Qué opinas?" 
                    value={nuevoComentario.texto}
                    onChange={(e) => setNuevoComentario({...nuevoComentario, texto: e.target.value})}
                ></textarea>
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
                        
                        {/* Botón Eliminar: Solo si isAdmin es verdadero */}
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
  );
}