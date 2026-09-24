import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { getCategoriaColor, handleImageError, tiempoRelativo, FALLBACK_IMAGE } from '../config/site';
import { resumen, tiempoLectura } from '../utils/html';

export function CategoryLabel({ categoria, chip = false }) {
  if (!categoria) return null;
  return (
    <span className={chip ? 'cat-chip' : 'cat-label'} style={{ '--cat-color': getCategoriaColor(categoria) }}>
      {categoria}
    </span>
  );
}

export function PostMeta({ post, showAuthor = true }) {
  return (
    <div className="post-meta">
      {showAuthor && <span className="fw-semibold">{post.autor || 'Redacción'}</span>}
      {showAuthor && <span className="sep" />}
      <time dateTime={post.fecha ? new Date(post.fecha).toISOString() : undefined}>{tiempoRelativo(post.fecha)}</time>
      <span className="sep" />
      <span className="d-inline-flex align-items-center gap-1"><Clock size={13} /> {tiempoLectura(post.contenido)} min</span>
    </div>
  );
}

export default function PostCard({ post, compact = false }) {
  return (
    <Link to={`/post/${post.id}`} className={`post-card${compact ? ' compact' : ''}`}>
      <div className="media">
        <img src={post.imagen || FALLBACK_IMAGE} alt="" loading="lazy" onError={handleImageError} />
        {!compact && <CategoryLabel categoria={post.categoria} chip />}
      </div>
      <div className="body">
        {compact && <div className="mb-2"><CategoryLabel categoria={post.categoria} /></div>}
        <h3>{post.titulo}</h3>
        {!compact && <p className="excerpt">{resumen(post.contenido, 180)}</p>}
        <PostMeta post={post} showAuthor={!compact} />
      </div>
    </Link>
  );
}
