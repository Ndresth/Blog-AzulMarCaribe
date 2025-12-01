import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import BlogForm from '../components/BlogForm';
// Importamos los íconos de Lucide
import { 
  Gauge, Eye, LogOut, BookOpen, PenTool, MessageSquare, 
  Trash2, Edit, X, CheckCircle, AlertTriangle 
} from 'lucide-react';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  
  // ESTADOS PARA LA NAVEGACIÓN
  const [activeTab, setActiveTab] = useState('list');
  const [editingPost, setEditingPost] = useState(null);
  
  const [viewingComments, setViewingComments] = useState(null); 
  const [commentsList, setCommentsList] = useState([]);
  
  // ESTADOS PARA UI
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, type: null });

  const showToast = (mensaje, type = 'success') => {
    setToast({ show: true, msg: mensaje, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  // Cargar Posts
  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("fecha", "desc"));
      const snapshot = await getDocs(q);
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) { console.error(error); }
  };

  useEffect(() => { 
    fetchPosts();
  }, []); 

  // Acciones
  const handleDeletePost = (id) => {
    setDeleteModal({ show: true, id: id, type: 'post' });
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setActiveTab('create');
  };

  const handlePostSuccess = () => {
    fetchPosts();
    setEditingPost(null);
    setActiveTab('list');
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setActiveTab('list');
  };

  // Comentarios
  const loadComments = async (postId) => {
    setViewingComments(postId);
    const ref = collection(db, "posts", postId, "comments");
    const snap = await getDocs(ref);
    setCommentsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleDeleteComment = (id) => {
    setDeleteModal({ show: true, id: id, type: 'comment' });
  };

  // Ejecutar borrado real
  const executeDelete = async () => {
    try {
        if (deleteModal.type === 'post') {
            await deleteDoc(doc(db, "posts", deleteModal.id));
            fetchPosts();
            showToast("Noticia eliminada correctamente");
        } else if (deleteModal.type === 'comment') {
            await deleteDoc(doc(db, "posts", viewingComments, "comments", deleteModal.id));
            loadComments(viewingComments);
            showToast("Comentario eliminado correctamente");
        }
    } catch (error) {
        console.error("Error al eliminar:", error); 
        showToast("Error al eliminar", "error");
    } finally {
        setDeleteModal({ show: false, id: null, type: null });
    }
  };

  return (
    <div className="container py-5">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-4 rounded shadow-sm">
        <div>
            <h2 className="mb-0 text-primary fw-bold d-flex align-items-center gap-2">
                <Gauge size={28} /> Panel de Control
            </h2>
            <small className="text-muted">Bienvenido, Admin</small>
        </div>
        <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => navigate('/')}>
                <Eye size={18} /> Ver Blog
            </button>
            <button className="btn btn-danger d-flex align-items-center gap-2" onClick={() => { signOut(auth); navigate('/'); }}>
                <LogOut size={18} /> Cerrar Sesión
            </button>
        </div>
      </div>

      {/* PESTAÑAS */}
      <ul className="nav nav-pills mb-4 nav-justified bg-white p-2 rounded shadow-sm">
        <li className="nav-item">
            <button 
                className={`nav-link fw-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'list' ? 'active' : ''}`} 
                onClick={() => setActiveTab('list')}
            >
                <BookOpen size={18} /> Mis Noticias Publicadas
            </button>
        </li>
        <li className="nav-item">
            <button 
                className={`nav-link fw-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'create' ? 'active' : ''}`} 
                onClick={() => { setEditingPost(null); setActiveTab('create'); }}
            >
                <PenTool size={18} /> {editingPost ? 'Editando Noticia' : 'Escribir Nueva Noticia'}
            </button>
        </li>
      </ul>

      {/* CONTENIDO PESTAÑAS */}
      
      {/* PESTAÑA 1: LISTA DE NOTICIAS */}
      {activeTab === 'list' && (
        <div className="row justify-content-center">
            <div className="col-lg-10">
                {viewingComments ? (
                    /* PANEL DE COMENTARIOS */
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                <MessageSquare size={20} /> Moderando Comentarios
                            </h5>
                            <button className="btn btn-sm btn-dark d-flex align-items-center gap-1" onClick={() => setViewingComments(null)}>
                                <X size={16} /> Cerrar
                            </button>
                        </div>
                        <div className="card-body">
                            {commentsList.length === 0 ? <p className="text-muted text-center py-3">No hay comentarios en este post.</p> : (
                                <ul className="list-group list-group-flush">
                                    {commentsList.map(c => (
                                        <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div><strong className="text-primary">{c.autor}:</strong> {c.texto}</div>
                                            <button onClick={() => handleDeleteComment(c.id)} className="btn btn-sm btn-outline-danger border-0" title="Eliminar">
                                                <Trash2 size={18} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ) : (
                    /* LISTA DE POSTS */
                    <div className="card shadow-sm border-0">
                        <div className="list-group list-group-flush">
                            {posts.length === 0 && <p className="text-center py-5 text-muted">No has escrito noticias aún.</p>}
                            
                            {posts.map(post => (
                                <div key={post.id} className="list-group-item p-3 d-flex justify-content-between align-items-center hover-effect border-bottom">
                                    <div className="d-flex align-items-center gap-3">
                                        <img src={post.imagen} alt="img" className="rounded shadow-sm" style={{width:'60px', height:'60px', objectFit:'cover'}} onError={(e) => e.target.src = "https://via.placeholder.com/60"} />
                                        <div>
                                            <h6 className="mb-1 fw-bold text-dark">{post.titulo}</h6>
                                            <div className="d-flex gap-2">
                                                <span className={`badge ${post.categoria === 'Cultural' ? 'bg-info' : 'bg-warning text-dark'}`}>{post.categoria}</span>
                                                <small className="text-muted">{post.fecha ? new Date(post.fecha).toLocaleDateString() : '-'}</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button onClick={() => loadComments(post.id)} className="btn btn-sm btn-outline-secondary" title="Ver Comentarios">
                                            <MessageSquare size={18} />
                                        </button>
                                        <button onClick={() => handleEditPost(post)} className="btn btn-sm btn-outline-primary" title="Editar">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDeletePost(post.id)} className="btn btn-sm btn-outline-danger" title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* PESTAÑA 2: FORMULARIO */}
      {activeTab === 'create' && (
        <div className="row justify-content-center">
            <div className="col-lg-8">
                <BlogForm 
                    onPostCreated={handlePostSuccess} 
                    postToEdit={editingPost}
                    onCancel={handleCancelEdit}
                    onNotify={showToast} 
                />
            </div>
        </div>
      )}

      {/* NOTIFICACIONES Y MODALES */}
      {toast.show && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{zIndex: 2000}}>
            <div className={`toast show text-white ${toast.type === 'error' ? 'bg-danger' : 'bg-dark'}`}>
                <div className="toast-body d-flex align-items-center gap-2">
                    {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                    {toast.msg}
                </div>
            </div>
        </div>
      )}

      {deleteModal.show && (
        <>
            <div className="modal-backdrop fade show" style={{zIndex: 1050}}></div>
            <div className="modal fade show d-block" style={{zIndex: 1060}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0">
                            <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                                <AlertTriangle size={24} /> Confirmar Eliminación
                            </h5>
                            <button type="button" className="btn-close" onClick={() => setDeleteModal({show:false})}></button>
                        </div>
                        <div className="modal-body">
                            <p>¿Estás seguro de que quieres borrar esto? No se puede deshacer.</p>
                        </div>
                        <div className="modal-footer border-0">
                            <button type="button" className="btn btn-light" onClick={() => setDeleteModal({show:false})}>Cancelar</button>
                            <button type="button" className="btn btn-danger fw-bold d-flex align-items-center gap-2" onClick={executeDelete}>
                                <Trash2 size={18} /> Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
      )}

    </div>
  );
}