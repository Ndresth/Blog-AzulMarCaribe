import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export default function NewsTicker() {
  const [noticias, setNoticias] = useState([]);

  useEffect(() => {
    const fetchRecientes = async () => {
      try {
        const q = query(collection(db, "posts"), orderBy("fecha", "desc"), limit(5));
        const snapshot = await getDocs(q);
        setNoticias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error(error); }
    };
    fetchRecientes();
  }, []);

  if (noticias.length === 0) return null;

  // La lista se duplica para que el desplazamiento sea continuo (la animación mueve -50%)
  const items = [...noticias, ...noticias];

  return (
    <div className="ticker">
      <div className="container d-flex align-items-center gap-3 py-2">
        <span className="ticker-label d-inline-flex align-items-center gap-2">
          <span className="ticker-dot" /> Lo último
        </span>
        <div className="news-ticker-container flex-grow-1">
          <div className="news-ticker-content">
            {items.map((nota, i) => (
              <Link
                to={`/post/${nota.id}`}
                key={`${nota.id}-${i}`}
                className="ticker-item"
                aria-hidden={i >= noticias.length}
                tabIndex={i >= noticias.length ? -1 : undefined}
              >
                {nota.titulo}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
