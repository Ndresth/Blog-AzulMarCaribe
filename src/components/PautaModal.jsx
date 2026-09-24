import React, { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { X } from 'lucide-react';
import { db } from '../firebase/config';

const CLAVE = 'pauta-vista';

// Publicidad que aparece al entrar al sitio. Se muestra una vez por sesión;
// si el admin sube una pauta nueva (cambia "actualizado"), se vuelve a mostrar.
export default function PautaModal() {
  const [pauta, setPauta] = useState(null);
  const [visible, setVisible] = useState(false);
  const cerrarRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    let timer;

    const cargar = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'pauta'));
        const data = snap.exists() ? snap.data() : null;
        if (!data?.activa || !data.imagen) return;

        let vista = null;
        try { vista = sessionStorage.getItem(CLAVE); } catch { /* sin sessionStorage */ }
        if (vista === String(data.actualizado)) return;

        // Se precarga la imagen para no mostrar un recuadro vacío
        const img = new Image();
        img.onload = () => {
          if (cancelado) return;
          setPauta(data);
          timer = setTimeout(() => !cancelado && setVisible(true), 600);
        };
        img.src = data.imagen;
      } catch (error) {
        console.error('Error cargando la pauta:', error);
      }
    };

    cargar();
    return () => { cancelado = true; clearTimeout(timer); };
  }, []);

  const cerrar = useCallback(() => {
    setVisible(false);
    try { sessionStorage.setItem(CLAVE, String(pauta?.actualizado)); } catch { /* sin sessionStorage */ }
  }, [pauta]);

  // Escape cierra, se bloquea el scroll del fondo y el foco va a la X
  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => e.key === 'Escape' && cerrar();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    cerrarRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [visible, cerrar]);

  if (!visible || !pauta) return null;

  const imagen = <img src={pauta.imagen} alt="Publicidad" />;

  return (
    <div className="pauta-backdrop" role="dialog" aria-modal="true" aria-label="Publicidad">
      <div className="pauta-box">
        <button ref={cerrarRef} className="pauta-close" onClick={cerrar} aria-label="Cerrar publicidad" title="Cerrar">
          <X size={22} />
        </button>
        {pauta.enlace ? (
          <a href={pauta.enlace} target="_blank" rel="noopener noreferrer sponsored" onClick={cerrar}>{imagen}</a>
        ) : imagen}
        <span className="pauta-tag">Publicidad</span>
      </div>
    </div>
  );
}
