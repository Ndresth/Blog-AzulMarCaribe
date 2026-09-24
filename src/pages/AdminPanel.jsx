import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import {
  LayoutDashboard, Newspaper, PenSquare, ExternalLink, LogOut, MessageSquare,
  Trash2, Pencil, X, CheckCircle2, AlertTriangle, Search, Heart, FileText,
  CalendarDays, Plus, Inbox, RefreshCw
} from 'lucide-react';
import BlogForm from '../components/BlogForm';
import { eliminarNoticiaCompleta } from '../utils/firebaseAdmin';
import { CategoryLabel } from '../components/PostCard';
import { CATEGORIAS, handleImageError, formatearFechaCorta, tiempoRelativo, iniciales, FALLBACK_IMAGE } from '../config/site';
import './admin.css';

const normalizar = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ---------------- Piezas pequeñas ---------------- */

function StatCard(props) {
  const { label, value, hint, color = 'var(--ocean)', bg = 'var(--ocean-light)' } = props;
  return (
    <div className="admin-card stat-card">
      <div>
        <div className="label">{label}</div>
        <div className="value">{value}</div>
        {hint && <div className="hint">{hint}</div>}
      </div>
      <span className="icon" style={{ '--stat-color': color, '--stat-bg': bg }}><props.icon size={20} /></span>
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel, loading }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="confirm-modal" onClick={onCancel}>
      <div className="box" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <span className="danger-icon mb-3"><AlertTriangle size={24} /></span>
        <h2 id="confirm-title" className="h5 fw-bold">{title}</h2>
        <p className="text-secondary mb-4">{message}</p>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light border rounded-pill px-3" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button type="button" className="btn btn-danger rounded-pill px-3 d-inline-flex align-items-center gap-2" onClick={onConfirm} disabled={loading} autoFocus>
            <Trash2 size={16} /> {loading ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Vista: Resumen ---------------- */

function Dashboard({ posts, onNew, onEdit, goToList }) {
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const esteMes = posts.filter((p) => p.fecha >= inicioMes.getTime()).length;
  const ultima = posts[0];
  const top = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);
  const max = Math.max(1, ...CATEGORIAS.map((c) => posts.filter((p) => p.categoria === c.value).length));

  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3"><StatCard label="Noticias publicadas" value={posts.length} icon={FileText} /></div>
        <div className="col-sm-6 col-xl-3"><StatCard label="Publicadas este mes" value={esteMes} hint={new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })} icon={CalendarDays} color="#0f766e" bg="#ccfbf1" /></div>
        <div className="col-sm-6 col-xl-3"><StatCard label="Me gusta totales" value={totalLikes} hint={posts.length ? `${(totalLikes / posts.length).toFixed(1)} por noticia` : null} icon={Heart} color="#e11d48" bg="#ffe4e6" /></div>
        <div className="col-sm-6 col-xl-3"><StatCard label="Última publicación" value={ultima ? tiempoRelativo(ultima.fecha) : '—'} hint={ultima?.autor} icon={Newspaper} color="#b45309" bg="#fef3c7" /></div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="admin-card h-100">
            <div className="admin-card-head">
              <h2>Publicaciones recientes</h2>
              <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={goToList}>Ver todas</button>
            </div>
            {posts.length === 0 ? (
              <div className="text-center text-muted p-5">
                <Inbox size={32} className="mb-2" />
                <p className="mb-3">Aún no hay noticias.</p>
                <button className="btn btn-primary rounded-pill px-3" onClick={onNew}>Escribir la primera</button>
              </div>
            ) : posts.slice(0, 5).map((p) => (
              <div key={p.id} className="mini-list-item">
                <img src={p.imagen || FALLBACK_IMAGE} alt="" onError={handleImageError} />
                <div className="flex-grow-1 min-w-0">
                  <CategoryLabel categoria={p.categoria} />
                  <div className="title">{p.titulo}</div>
                  <small className="text-muted">{p.autor || 'Redacción'} · {tiempoRelativo(p.fecha)}</small>
                </div>
                <button className="icon-btn" onClick={() => onEdit(p)} title="Editar" aria-label={`Editar ${p.titulo}`}><Pencil size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-5 d-flex flex-column gap-4">
          <div className="admin-card">
            <div className="admin-card-head"><h2>Noticias por sección</h2></div>
            <div className="admin-card-body">
              {CATEGORIAS.map((c) => {
                const n = posts.filter((p) => p.categoria === c.value).length;
                return (
                  <div key={c.value} className="cat-bar-row" style={{ '--cat-color': c.color }}>
                    <div className="top">
                      <span className="d-inline-flex align-items-center gap-2 fw-semibold" style={{ color: c.color }}><c.Icon size={15} /> {c.label}</span>
                      <span className="text-muted">{n}</span>
                    </div>
                    <div className="cat-bar"><span style={{ width: `${(n / max) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-head"><h2>Más gustadas</h2></div>
            {top.filter((p) => p.likes).length === 0 ? (
              <p className="text-muted small p-3 mb-0">Todavía no hay “Me gusta”.</p>
            ) : top.filter((p) => p.likes).map((p, i) => (
              <Link key={p.id} to={`/post/${p.id}`} target="_blank" className="mini-list-item text-decoration-none">
                <span className="fw-bold text-muted" style={{ width: 18 }}>{i + 1}</span>
                <div className="title flex-grow-1">{p.titulo}</div>
                <span className="d-inline-flex align-items-center gap-1 small fw-semibold" style={{ color: '#e11d48' }}>
                  <Heart size={14} fill="currentColor" /> {p.likes}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Vista: Lista de noticias ---------------- */

function PostsTable({ posts, loading, onEdit, onDelete, onComments, onNew }) {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [orden, setOrden] = useState('recientes');

  const filtrados = useMemo(() => {
    const t = normalizar(busqueda.trim());
    let lista = posts.filter((p) =>
      (categoria === 'Todas' || p.categoria === categoria) &&
      (!t || normalizar(p.titulo).includes(t) || normalizar(p.autor).includes(t))
    );
    if (orden === 'likes') lista = [...lista].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    if (orden === 'antiguas') lista = [...lista].sort((a, b) => a.fecha - b.fecha);
    return lista;
  }, [posts, busqueda, categoria, orden]);

  return (
    <div className="admin-card">
      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input type="search" placeholder="Buscar por título o autor…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar noticias" />
        </div>
        <select className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Filtrar por sección">
          <option value="Todas">Todas las secciones</option>
          {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select className="form-select" value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar">
          <option value="recientes">Más recientes</option>
          <option value="antiguas">Más antiguas</option>
          <option value="likes">Más gustadas</option>
        </select>
      </div>

      {loading ? (
        <div className="p-5 text-center"><div className="spinner-border text-primary" /></div>
      ) : filtrados.length === 0 ? (
        <div className="text-center text-muted p-5">
          <Inbox size={32} className="mb-2" />
          <p className="mb-3">{posts.length ? 'Ninguna noticia coincide con los filtros.' : 'Aún no hay noticias publicadas.'}</p>
          {!posts.length && <button className="btn btn-primary rounded-pill px-3" onClick={onNew}>Escribir la primera</button>}
        </div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Noticia</th>
                <th>Sección</th>
                <th>Fecha</th>
                <th className="text-center">Me gusta</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <img className="thumb" src={p.imagen || FALLBACK_IMAGE} alt="" loading="lazy" onError={handleImageError} />
                      <div className="min-w-0">
                        <div className="post-title">{p.titulo}</div>
                        <small className="text-muted">{p.autor || 'Redacción'}</small>
                      </div>
                    </div>
                  </td>
                  <td><CategoryLabel categoria={p.categoria} /></td>
                  <td className="text-muted text-nowrap small" title={p.fecha ? new Date(p.fecha).toLocaleString('es-CO') : ''}>{formatearFechaCorta(p.fecha)}</td>
                  <td className="text-center hide-sm">
                    <span className="d-inline-flex align-items-center gap-1 small text-muted"><Heart size={13} /> {p.likes || 0}</span>
                  </td>
                  <td className="cell-actions">
                    <div className="d-flex justify-content-md-end gap-1">
                      <Link to={`/post/${p.id}`} target="_blank" className="icon-btn" title="Ver en el sitio" aria-label="Ver en el sitio"><ExternalLink size={16} /></Link>
                      <button className="icon-btn" onClick={() => onComments(p)} title="Comentarios" aria-label="Ver comentarios"><MessageSquare size={16} /></button>
                      <button className="icon-btn" onClick={() => onEdit(p)} title="Editar" aria-label="Editar"><Pencil size={16} /></button>
                      <button className="icon-btn danger" onClick={() => onDelete(p)} title="Eliminar" aria-label="Eliminar"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 small text-muted border-top">{filtrados.length} de {posts.length} noticias</div>
        </>
      )}
    </div>
  );
}

/* ---------------- Panel lateral: comentarios ---------------- */

function CommentsDrawer({ post, onClose, onDeleteComment, comments, loading }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="drawer-head">
          <div className="flex-grow-1 min-w-0">
            <div className="small text-muted fw-semibold d-flex align-items-center gap-2"><MessageSquare size={14} /> Comentarios ({comments.length})</div>
            <h2 id="drawer-title" className="h6 fw-bold mb-0 mt-1">{post.titulo}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="drawer-body">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted py-5"><Inbox size={28} className="mb-2" /><p className="mb-0">Esta noticia no tiene comentarios.</p></div>
          ) : comments.map((c) => (
            <div key={c.id} className="comment">
              <span className="avatar">{iniciales(c.autor)}</span>
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex justify-content-between gap-2">
                  <div>
                    <span className="fw-semibold text-dark">{c.autor}</span>
                    <span className="text-muted small ms-2">{tiempoRelativo(c.fecha)}</span>
                  </div>
                  <button className="icon-btn danger" onClick={() => onDeleteComment(c)} title="Eliminar comentario" aria-label="Eliminar comentario"><Trash2 size={15} /></button>
                </div>
                <p className="mb-0 mt-1 text-secondary small" style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{c.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

/* ---------------- Panel principal ---------------- */

export default function AdminPanel() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [view, setView] = useState('dashboard'); // dashboard | list | editor
  const [editingPost, setEditingPost] = useState(null);
  const [dirty, setDirty] = useState(false);

  const [commentsPost, setCommentsPost] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null); // { type: 'post'|'comment', item }
  const [deleting, setDeleting] = useState(false);

  const user = auth.currentUser;

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'error' ? 6000 : 3500);
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const snapshot = await getDocs(query(collection(db, "posts"), orderBy("fecha", "desc")));
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar las noticias', 'error');
    } finally {
      setLoadingPosts(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Aviso del navegador si hay cambios sin guardar en el editor
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const cambiarVista = (next, post = null) => {
    if (view === 'editor' && dirty && !window.confirm('Tienes cambios sin guardar. ¿Salir del editor y descartarlos?')) return;
    setDirty(false);
    setEditingPost(post);
    setView(next);
    window.scrollTo(0, 0);
  };

  const handleEditPost = (post) => cambiarVista('editor', post);
  const handleNewPost = () => cambiarVista('editor', null);

  const handlePostSuccess = () => {
    setDirty(false);
    fetchPosts();
    setEditingPost(null);
    setView('list');
    window.scrollTo(0, 0);
  };

  // Comentarios
  const loadComments = async (post) => {
    setCommentsPost(post);
    setCommentsList([]);
    setLoadingComments(true);
    try {
      const snap = await getDocs(query(collection(db, "posts", post.id, "comments"), orderBy("fecha", "desc")));
      setCommentsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
      showToast('Error cargando comentarios', 'error');
    } finally {
      setLoadingComments(false);
    }
  };

  const executeDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.type === 'post') {
        const r = await eliminarNoticiaCompleta(confirm.item);
        setPosts((prev) => prev.filter((p) => p.id !== confirm.item.id));
        const extra = [
          r.comentarios && `${r.comentarios} comentario${r.comentarios === 1 ? '' : 's'}`,
          r.likes && `${r.likes} me gusta`,
          r.archivos && `${r.archivos} archivo${r.archivos === 1 ? '' : 's'}`,
        ].filter(Boolean).join(', ');
        showToast(extra ? `Noticia eliminada (con ${extra})` : 'Noticia eliminada');
        if (r.pendientes) showToast('La noticia se eliminó, pero sus comentarios/likes no (publica las nuevas reglas de Firestore).', 'error');
      } else {
        await deleteDoc(doc(db, "posts", commentsPost.id, "comments", confirm.item.id));
        setCommentsList((prev) => prev.filter((c) => c.id !== confirm.item.id));
        showToast('Comentario eliminado');
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      showToast('Error al eliminar', 'error');
    } finally {
      setDeleting(false);
      setConfirm(null);
    }
  };

  const handleLogout = async () => {
    if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Cerrar sesión de todas formas?')) return;
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { id: 'dashboard', label: 'Resumen', Icon: LayoutDashboard },
    { id: 'list', label: 'Noticias', Icon: Newspaper, count: posts.length },
    { id: 'editor', label: editingPost ? 'Editando' : 'Nueva noticia', Icon: PenSquare },
  ];

  const renderNav = () => navItems.map((item) => (
    <button
      key={item.id}
      className={`admin-nav-btn${view === item.id ? ' active' : ''}`}
      onClick={() => (item.id === 'editor' ? (view !== 'editor' && handleNewPost()) : cambiarVista(item.id))}
      aria-current={view === item.id ? 'page' : undefined}
    >
      <item.Icon size={18} /> {item.label}
      {item.count !== undefined && <span className="count">{item.count}</span>}
    </button>
  ));

  const heads = {
    dashboard: { title: `Hola, ${(user?.displayName || 'Admin').split(' ')[0]}`, sub: 'Así va Azul Mar Caribe.' },
    list: { title: 'Noticias', sub: 'Busca, edita, modera comentarios o elimina publicaciones.' },
    editor: { title: editingPost ? 'Editar noticia' : 'Nueva noticia', sub: editingPost ? `Publicada ${tiempoRelativo(editingPost.fecha)} por ${editingPost.autor || 'Redacción'}` : 'Escribe, elige la sección y añade una portada.' },
  };

  return (
    <div className="admin-shell">
      <Helmet>
        <title>Panel de control | Azul Mar Caribe</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* BARRA LATERAL (escritorio) */}
      <aside className="admin-sidebar">
        <Link to="/" className="brand" title="Ir al sitio">
          <img src="/logo-sm.png" alt="" />
          <div>
            <strong>Panel admin</strong>
            <small>Azul Mar Caribe</small>
          </div>
        </Link>
        <div className="admin-nav-label">Gestión</div>
        <nav className="d-flex flex-column gap-1" aria-label="Panel">{renderNav()}</nav>
        <div className="admin-nav-label mt-3">Sitio</div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-nav-btn"><ExternalLink size={18} /> Ver blog</a>
        <button className="admin-nav-btn" onClick={handleLogout}><LogOut size={18} /> Cerrar sesión</button>

        <div className="admin-user">
          <span className="avatar">{iniciales(user?.displayName || user?.email)}</span>
          <div className="min-w-0">
            <div className="name">{user?.displayName || 'Admin'}</div>
            <div className="email">{user?.email}</div>
          </div>
        </div>
      </aside>

      {/* BARRA SUPERIOR (móvil) */}
      <nav className="admin-mobile-bar" aria-label="Panel">
        {renderNav()}
        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-nav-btn" aria-label="Ver blog"><ExternalLink size={18} /></a>
        <button className="admin-nav-btn" onClick={handleLogout} aria-label="Cerrar sesión"><LogOut size={18} /></button>
      </nav>

      <main className="admin-main">
        <div className="admin-page-head">
          <div>
            <h1>{heads[view].title}</h1>
            <p>{heads[view].sub}</p>
          </div>
          {view !== 'editor' && (
            <div className="d-flex gap-2">
              <button className="btn btn-light border rounded-pill d-inline-flex align-items-center gap-2" onClick={fetchPosts} disabled={loadingPosts} title="Recargar">
                <RefreshCw size={16} className={loadingPosts ? 'animate-spin' : ''} />
              </button>
              <button className="btn btn-primary rounded-pill px-3 d-inline-flex align-items-center gap-2" onClick={handleNewPost}>
                <Plus size={18} /> Nueva noticia
              </button>
            </div>
          )}
        </div>

        {view === 'dashboard' && (
          loadingPosts
            ? <div className="p-5 text-center"><div className="spinner-border text-primary" /></div>
            : <Dashboard posts={posts} onNew={handleNewPost} onEdit={handleEditPost} goToList={() => cambiarVista('list')} />
        )}

        {view === 'list' && (
          <PostsTable
            posts={posts}
            loading={loadingPosts}
            onEdit={handleEditPost}
            onDelete={(p) => setConfirm({ type: 'post', item: p })}
            onComments={loadComments}
            onNew={handleNewPost}
          />
        )}

        {view === 'editor' && (
          <BlogForm
            key={editingPost?.id || 'nuevo'}
            postToEdit={editingPost}
            onPostCreated={handlePostSuccess}
            onCancel={() => cambiarVista('list')}
            onNotify={showToast}
            onDirtyChange={setDirty}
          />
        )}
      </main>

      {commentsPost && (
        <CommentsDrawer
          post={commentsPost}
          comments={commentsList}
          loading={loadingComments}
          onClose={() => setCommentsPost(null)}
          onDeleteComment={(c) => setConfirm({ type: 'comment', item: c })}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.type === 'post' ? '¿Eliminar esta noticia?' : '¿Eliminar este comentario?'}
          message={confirm.type === 'post'
            ? `Se borrará “${confirm.item.titulo}” junto con sus comentarios, sus “Me gusta” y su portada/video subidos. Esta acción no se puede deshacer.`
            : 'El comentario se borrará definitivamente.'}
          onConfirm={executeDelete}
          onCancel={() => !deleting && setConfirm(null)}
          loading={deleting}
        />
      )}

      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`admin-toast${t.type === 'error' ? ' error' : ''}`} role={t.type === 'error' ? 'alert' : 'status'}>
            {t.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
