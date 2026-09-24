import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, orderBy, query, limit, startAfter, where } from 'firebase/firestore';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, ArrowDown, Newspaper } from 'lucide-react';
import PostSkeleton from '../components/PostSkeleton';
import NewsTicker from '../components/NewsTicker';
import PostCard, { CategoryLabel, PostMeta } from '../components/PostCard';
import { CATEGORIAS, getCategoria, handleImageError, FALLBACK_IMAGE } from '../config/site';
import { resumen } from '../utils/html';

// Primera carga: 1 destacada + 3 laterales + 6 en la grilla. Luego de a 9 (3 filas de 3).
const PRIMERA_PAGINA = 10;
const SIGUIENTES = 9;

const construirQuery = (categoria, cantidad, despuesDe) => {
  const filtros = [];
  if (categoria !== 'Todas') filtros.push(where("categoria", "==", categoria));
  filtros.push(orderBy("fecha", "desc"));
  if (despuesDe) filtros.push(startAfter(despuesDe));
  filtros.push(limit(cantidad));
  return query(collection(db, "posts"), ...filtros);
};

function HeroDestacada({ post }) {
  return (
    <Link to={`/post/${post.id}`} className="hero-card">
      <img src={post.imagen || FALLBACK_IMAGE} alt="" onError={handleImageError} fetchPriority="high" />
      <div className="hero-body">
        <CategoryLabel categoria={post.categoria} chip />
        <h2>{post.titulo}</h2>
        <p className="d-none d-md-block">{resumen(post.contenido, 200)}</p>
        <PostMeta post={post} />
      </div>
    </Link>
  );
}

function ItemLateral({ post }) {
  return (
    <Link to={`/post/${post.id}`} className="side-item">
      <div className="thumb">
        <img src={post.imagen || FALLBACK_IMAGE} alt="" loading="lazy" onError={handleImageError} />
      </div>
      <div className="flex-grow-1 min-w-0">
        <CategoryLabel categoria={post.categoria} />
        <h3>{post.titulo}</h3>
        <PostMeta post={post} showAuthor={false} />
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [hayMas, setHayMas] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaActual = searchParams.get('cat') || 'Todas';
  const categoriaInfo = getCategoria(categoriaActual);

  // 1. CARGA INICIAL
  useEffect(() => {
    const cargarNoticiasIniciales = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(construirQuery(categoriaActual, PRIMERA_PAGINA));
        setUltimoDoc(snapshot.empty ? null : snapshot.docs[snapshot.docs.length - 1]);
        setHayMas(snapshot.docs.length === PRIMERA_PAGINA);
        setNoticias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      const snapshot = await getDocs(construirQuery(categoriaActual, SIGUIENTES, ultimoDoc));
      if (!snapshot.empty) {
        setUltimoDoc(snapshot.docs[snapshot.docs.length - 1]);
        const nuevas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNoticias(prev => [...prev, ...nuevas]);
      }
      if (snapshot.docs.length < SIGUIENTES) setHayMas(false);
    } catch (error) {
      console.error("Error cargando más:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Búsqueda sin distinguir mayúsculas ni tildes ("musica" encuentra "Música")
  const normalizar = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const termino = normalizar(busqueda.trim());
  const buscando = termino.length > 0;

  const noticiasFiltradas = buscando
    ? noticias.filter((nota) => normalizar(nota.titulo).includes(termino))
    : noticias;

  // Portada: destacada + laterales (solo cuando no se está buscando)
  const destacada = !buscando ? noticiasFiltradas[0] : null;
  const laterales = !buscando ? noticiasFiltradas.slice(1, 4) : [];
  const grilla = !buscando ? noticiasFiltradas.slice(4) : noticiasFiltradas;

  const cambiarCategoria = (cat) => {
    setBusqueda('');
    setSearchParams(cat ? { cat } : {});
  };

  const titulo = categoriaInfo ? categoriaInfo.label : 'Actualidad Caribe';
  const descripcion = categoriaInfo
    ? categoriaInfo.descripcion
    : 'Cultura, entretenimiento y noticias de la región Caribe colombiana.';

  return (
    <div>
      <Helmet>
        <title>{categoriaInfo ? `${categoriaInfo.label} | Azul Mar Caribe` : 'Azul Mar Caribe - Cultura y Entretenimiento'}</title>
        <meta name="description" content={descripcion} />
      </Helmet>

      <NewsTicker />

      <main id="contenido" className="container py-4 py-lg-5">
        {/* ENCABEZADO + FILTROS */}
        <div className="page-intro d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
          <div>
            <h1 className="mb-2">{titulo}</h1>
            <p className="text-secondary mb-0">{descripcion}</p>
          </div>
          <div className="search-box">
            <Search size={17} />
            <input
              type="search"
              placeholder="Buscar noticias…"
              aria-label="Buscar noticias por título"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="cat-tabs mb-4 mb-lg-5" aria-label="Filtrar por sección">
          <button aria-pressed={categoriaActual === 'Todas'} onClick={() => cambiarCategoria(null)} className={`cat-tab${categoriaActual === 'Todas' ? ' active' : ''}`}>
            <Newspaper size={16} /> Todas
          </button>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.value}
              aria-pressed={categoriaActual === cat.value}
              onClick={() => cambiarCategoria(cat.value)}
              className={`cat-tab${categoriaActual === cat.value ? ' active' : ''}`}
              style={{ '--cat-color': cat.color }}
            >
              <cat.Icon size={16} /> {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="row g-4">
            {[1, 2, 3, 4, 5, 6].map((n) => <PostSkeleton key={n} />)}
          </div>
        ) : (
          <>
            {noticiasFiltradas.length === 0 && (
              <div className="empty-state">
                <Search size={36} className="mb-3" />
                <h2 className="h5 text-dark">No encontramos noticias</h2>
                <p className="mb-0">
                  {buscando
                    ? (hayMas ? 'La búsqueda revisa las noticias cargadas. Prueba con "Cargar más noticias".' : 'Prueba con otras palabras.')
                    : 'Aún no hay publicaciones en esta sección.'}
                </p>
              </div>
            )}

            {/* DESTACADAS */}
            {destacada && (
              <section className="row g-4 mb-5" aria-label="Noticias destacadas">
                <div className={laterales.length ? 'col-lg-8' : 'col-12'}>
                  <HeroDestacada post={destacada} />
                </div>
                {laterales.length > 0 && (
                  <div className="col-lg-4">
                    <div className="side-list">
                      {laterales.map((nota) => <ItemLateral key={nota.id} post={nota} />)}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* GRILLA */}
            {grilla.length > 0 && (
              <section aria-label={buscando ? 'Resultados de búsqueda' : 'Más noticias'}>
                <h2 className="section-title" style={{ '--cat-color': categoriaInfo?.color }}>
                  <span className="bar" />
                  {buscando ? `Resultados (${grilla.length})` : 'Más noticias'}
                </h2>
                <div className="row g-4">
                  {grilla.map((nota) => (
                    <div key={nota.id} className="col-md-6 col-lg-4">
                      <PostCard post={nota} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CARGAR MÁS */}
            {hayMas && noticias.length > 0 && (
              <div className="text-center mt-5">
                <button onClick={cargarMasNoticias} className="btn-load-more d-inline-flex align-items-center gap-2" disabled={loadingMore}>
                  {loadingMore ? <span className="spinner-border spinner-border-sm" /> : <ArrowDown size={18} />}
                  {loadingMore ? 'Cargando…' : 'Cargar más noticias'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
