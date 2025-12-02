import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, orderBy, query, limit, startAfter, where } from 'firebase/firestore';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Film, Drama, Globe, BookOpen, ArrowDownCircle } from 'lucide-react'; 
import PostSkeleton from '../components/PostSkeleton'; 
import NewsTicker from '../components/NewsTicker';

export default function HomePage() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [hayMas, setHayMas] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaActual = searchParams.get('cat') || 'Todas';

  const NOTICIAS_POR_PAGINA = 6;

  // 1. CARGA INICIAL
  useEffect(() => {
    const cargarNoticiasIniciales = async () => {
      setLoading(true);
      try {
        const postsRef = collection(db, "posts");
        let q;
        if (categoriaActual === 'Todas') {
            q = query(postsRef, orderBy("fecha", "desc"), limit(NOTICIAS_POR_PAGINA));
        } else {
            q = query(postsRef, where("categoria", "==", categoriaActual), orderBy("fecha", "desc"), limit(NOTICIAS_POR_PAGINA));
        }

        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setUltimoDoc(lastVisible);
        } else {
            setUltimoDoc(null);
        }

        if (snapshot.docs.length < NOTICIAS_POR_PAGINA) {
            setHayMas(false);
        } else {
            setHayMas(true);
        }

        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNoticias(docs);

      } catch (error) { 
        console.error("Error cargando noticias:", error); 
      } finally { 
        setLoading(false); 
      }
    };

    cargarNoticiasIniciales();
  }, [categoriaActual]);

  // 2. CARGAR MÁS
  const cargarMasNoticias = async () => {
    if (!ultimoDoc) return;
    setLoadingMore(true);

    try {
        const postsRef = collection(db, "posts");
        let q;

        if (categoriaActual === 'Todas') {
            q = query(postsRef, orderBy("fecha", "desc"), startAfter(ultimoDoc), limit(NOTICIAS_POR_PAGINA));
        } else {
            q = query(postsRef, where("categoria", "==", categoriaActual), orderBy("fecha", "desc"), startAfter(ultimoDoc), limit(NOTICIAS_POR_PAGINA));
        }

        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setUltimoDoc(lastVisible);

            const nuevasNoticias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNoticias(prev => [...prev, ...nuevasNoticias]);
        }

        if (snapshot.docs.length < NOTICIAS_POR_PAGINA) {
            setHayMas(false);
        }

    } catch (error) {
        console.error("Error cargando más:", error);
    } finally {
        setLoadingMore(false);
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const stripHtml = (html) => {
      let tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
  }

  const noticiasFiltradas = noticias.filter((nota) => {
    return nota.titulo.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div>
      <Helmet>
        <title>Azul Mar Caribe | {categoriaActual}</title>
        <link rel="icon" type="image/png" href="/logo.png" />
      </Helmet>
      
      <NewsTicker />

      {/* HEADER CON FONDO (banner.jpg) */}
      <div 
        className="py-5 mb-5 shadow-sm position-relative" 
        style={{
            borderBottom: '5px solid #00b4d8',
            // AQUÍ ESTÁ LA FOTO DE FONDO
            backgroundImage: "url('/banner.jpg')", 
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}
      >
        {/* Capa blanca semitransparente para que se lean las letras */}
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(255, 255, 255, 0.85)' 
        }}></div>

        <div className="container text-center position-relative">
            <h1 className="display-4 fw-bold text-uppercase mb-2 d-flex align-items-center justify-content-center gap-3" style={{color: '#0077b6', letterSpacing:'2px'}}>
                <Globe size={48} /> Actualidad Caribe
            </h1>
            <h2 className="h4 text-uppercase mb-4 text-muted" style={{letterSpacing:'4px'}}>
                Entretenimiento y Cultura
            </h2>
            
            {/* BUSCADOR */}
            <div className="row justify-content-center mb-4">
                <div className="col-md-6">
                    <div className="input-group input-group-lg shadow-sm rounded-pill overflow-hidden">
                        <span className="input-group-text bg-white border-0 ps-4 text-muted">
                            <Search size={20} />
                        </span>
                        <input 
                            type="text" 
                            className="form-control border-0" 
                            placeholder="Buscar en las noticias cargadas..." 
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{boxShadow: 'none'}}
                        />
                    </div>
                </div>
            </div>

            {/* FILTROS */}
            <div className="d-flex justify-content-center gap-2">
                <button onClick={() => setSearchParams({})} className={`btn rounded-pill px-4 fw-bold d-flex align-items-center gap-2 ${categoriaActual === 'Todas' ? 'btn-primary' : 'btn-outline-secondary'}`}>
                    <BookOpen size={18} /> Todas
                </button>
                <button onClick={() => setSearchParams({ cat: 'Cultural' })} className={`btn rounded-pill px-4 fw-bold d-flex align-items-center gap-2 ${categoriaActual === 'Cultural' ? 'btn-primary' : 'btn-outline-secondary'}`}>
                    <Drama size={18} /> Cultural
                </button>
                <button onClick={() => setSearchParams({ cat: 'Entretenimiento' })} className={`btn rounded-pill px-4 fw-bold d-flex align-items-center gap-2 ${categoriaActual === 'Entretenimiento' ? 'btn-primary' : 'btn-outline-secondary'}`}>
                    <Film size={18} /> Entretenimiento
                </button>
            </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="container pb-5">
        
        {loading ? (
            <div className="row g-4">
                {[1, 2, 3, 4, 5, 6].map((n) => <PostSkeleton key={n} />)}
            </div>
        ) : (
            <>
                {noticiasFiltradas.length === 0 && (
                    <div className="text-center py-5">
                        <h3 className="text-muted d-flex align-items-center justify-content-center gap-2"><Search size={32} /> No encontramos noticias</h3>
                    </div>
                )}

                <div className="row g-4">
                {noticiasFiltradas.map(nota => (
                    <div key={nota.id} className="col-md-6 col-lg-4">
                    <div className="card news-card h-100 border-0 shadow-sm hover-effect">
                        <div style={{height: '220px', overflow: 'hidden', position: 'relative'}}>
                        <img 
                            src={nota.imagen} 
                            alt="Portada" 
                            style={{height: '100%', width: '100%', objectFit: 'cover'}}
                            onError={(e) => e.target.src = "https://via.placeholder.com/400?text=Azul+Mar+Caribe"}
                        />
                        <span className={`position-absolute top-0 end-0 m-3 badge rounded-pill ${nota.categoria === 'Cultural' ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2 shadow d-flex align-items-center gap-1`}>
                            {nota.categoria === 'Cultural' ? <Drama size={14} /> : <Film size={14} />}
                            {nota.categoria}
                        </span>
                        </div>

                        <div className="card-body d-flex flex-column p-4">
                        <small className="text-muted mb-2 d-flex align-items-center gap-1">
                            <BookOpen size={14} /> {formatearFecha(nota.fecha)}
                        </small>
                        <h4 className="card-title fw-bold mb-3 text-dark" style={{lineHeight:'1.3'}}>
                            {nota.titulo}
                        </h4>
                        <p className="card-text text-secondary flex-grow-1" style={{fontSize:'0.95rem'}}>
                            {stripHtml(nota.contenido).substring(0, 100)}...
                        </p>
                        
                        <Link to={`/post/${nota.id}`} className="btn btn-outline-primary mt-3 text-center text-decoration-none rounded-pill fw-bold">
                            Leer Noticia
                        </Link>
                        </div>
                    </div>
                    </div>
                ))}
                </div>

                {/* BOTÓN CARGAR MÁS */}
                {hayMas && noticiasFiltradas.length > 0 && (
                    <div className="text-center mt-5">
                        <button 
                            onClick={cargarMasNoticias} 
                            className="btn btn-light shadow-sm text-primary fw-bold px-5 py-3 rounded-pill d-inline-flex align-items-center gap-2"
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                                <><ArrowDownCircle size={20} /> Cargar más noticias</>
                            )}
                        </button>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}