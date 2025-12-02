import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react'; // Ícono para decorar

export default function NewsTicker() {
  const [noticias, setNoticias] = useState([]);

  useEffect(() => {
    const fetchRecientes = async () => {
      try {
        const q = query(
            collection(db, "posts"), 
            orderBy("fecha", "desc"), 
            limit(5) // Traemos las 5 últimas
        );
        const snapshot = await getDocs(q);
        setNoticias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error(error); }
    };
    fetchRecientes();
  }, []);

  if (noticias.length === 0) return null; // No mostrar si no hay noticias

  return (
    <div className="bg-light border-bottom">
      <div className="container-fluid p-0 d-flex">
        
        {/* ETIQUETA FIJA "RECIENTES" */}
        <div className="bg-primary text-white px-3 py-2 fw-bold d-flex align-items-center z-index-1 position-relative shadow-sm" style={{zIndex: 10}}>
            <span className="d-none d-md-inline me-2">RECIENTES</span>
            <Bell size={16} className="animate-pulse" />
            {/* Triangulito decorativo (opcional) */}
            <div style={{
                position: 'absolute', right: '-10px', top: 0, bottom: 0, 
                width: 0, height: 0, 
                borderTop: '20px solid transparent', 
                borderBottom: '20px solid transparent', 
                borderLeft: '10px solid #0d6efd' /* Color primary de bootstrap */
            }}></div>
        </div>

        {/* ZONA DE MOVIMIENTO */}
        <div className="news-ticker-container flex-grow-1 d-flex align-items-center bg-white overflow-hidden">
            <div className="news-ticker-content py-2">
                {noticias.map(nota => (
                    <Link to={`/post/${nota.id}`} key={nota.id} className="ticker-item">
                        {/* Miniatura de la foto */}
                        <img 
                            src={nota.imagen} 
                            alt="" 
                            className="rounded-circle me-2 border" 
                            style={{width: '25px', height: '25px', objectFit: 'cover'}}
                            onError={(e) => e.target.style.display = 'none'}
                        />
                        {nota.titulo}
                        <span className="mx-3 text-muted opacity-50">|</span>
                    </Link>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}