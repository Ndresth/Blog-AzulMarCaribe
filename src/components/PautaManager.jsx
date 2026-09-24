import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ImagePlus, RefreshCw, Trash2, Save, Loader2, Megaphone, ExternalLink, X } from 'lucide-react';
import { app, db } from '../firebase/config';
import { borrarArchivo } from '../utils/firebaseAdmin';
import { comprimirImagen } from '../utils/imagen';

const MAX_MB = 5;
const storage = getStorage(app);
const pautaRef = doc(db, 'config', 'pauta');

const subir = (file, onProgress) => new Promise((resolve, reject) => {
  const nombre = file.name.replace(/[^\w.-]/g, '_');
  const task = uploadBytesResumable(ref(storage, `blog_pautas/${Date.now()}_${nombre}`), file);
  task.on('state_changed',
    (s) => onProgress(s.totalBytes ? (s.bytesTransferred / s.totalBytes) * 100 : 0),
    reject,
    async () => resolve(await getDownloadURL(task.snapshot.ref))
  );
});

export default function PautaManager({ onNotify }) {
  const [guardada, setGuardada] = useState(null);   // lo que está en Firestore
  const [cargando, setCargando] = useState(true);
  const [imagen, setImagen] = useState('');          // URL (remota o blob de vista previa)
  const [archivo, setArchivo] = useState(null);
  const [enlace, setEnlace] = useState('');
  const [activa, setActiva] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [confirmarQuitar, setConfirmarQuitar] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(pautaRef);
        if (snap.exists()) {
          const d = snap.data();
          setGuardada(d);
          setImagen(d.imagen || '');
          setEnlace(d.enlace || '');
          setActiva(!!d.activa);
        }
      } catch (error) {
        console.error(error);
        onNotify('No se pudo cargar la pauta', 'error');
      } finally {
        setCargando(false);
      }
    })();
  }, [onNotify]);

  // Libera la URL temporal de la vista previa
  useEffect(() => {
    if (!imagen.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(imagen);
  }, [imagen]);

  const elegir = async (original) => {
    if (!original) return;
    if (!original.type.startsWith('image/')) { onNotify('El archivo no es una imagen', 'error'); return; }
    const f = await comprimirImagen(original);
    if (f.size > MAX_MB * 1024 * 1024) { onNotify(`La imagen supera ${MAX_MB} MB incluso optimizada`, 'error'); return; }
    setArchivo(f);
    setImagen(URL.createObjectURL(f));
  };

  const enlaceValido = !enlace.trim() || /^https?:\/\/\S+\.\S+/i.test(enlace.trim());
  const cambios = !!archivo
    || enlace.trim() !== (guardada?.enlace || '')
    || activa !== !!guardada?.activa
    || (!guardada && !!imagen);

  const guardar = async () => {
    if (!imagen) { onNotify('Sube una imagen para la pauta', 'error'); return; }
    if (!enlaceValido) { onNotify('El enlace debe empezar por https://', 'error'); return; }
    setGuardando(true);
    try {
      let url = imagen;
      if (archivo) {
        setProgreso(0);
        url = await subir(archivo, setProgreso);
      }
      const data = { activa, imagen: url, enlace: enlace.trim(), actualizado: Date.now() };
      await setDoc(pautaRef, data);
      // Si se reemplazó la imagen, se borra la anterior de Storage
      if (guardada?.imagen && guardada.imagen !== url) borrarArchivo(guardada.imagen);
      setGuardada(data);
      setImagen(url);
      setArchivo(null);
      onNotify(activa ? 'Pauta publicada: aparecerá al entrar al sitio' : 'Pauta guardada (desactivada)');
    } catch (error) {
      console.error(error);
      onNotify('Error al guardar la pauta: ' + error.message, 'error');
    } finally {
      setGuardando(false);
      setProgreso(null);
    }
  };

  const quitar = async () => {
    setGuardando(true);
    try {
      await deleteDoc(pautaRef);
      if (guardada?.imagen) borrarArchivo(guardada.imagen);
      setGuardada(null);
      setImagen('');
      setArchivo(null);
      setEnlace('');
      setActiva(true);
      onNotify('Pauta eliminada');
    } catch (error) {
      console.error(error);
      onNotify('Error al eliminar la pauta', 'error');
    } finally {
      setGuardando(false);
      setConfirmarQuitar(false);
    }
  };

  if (cargando) return <div className="p-5 text-center"><div className="spinner-border text-primary" /></div>;

  const estado = !guardada
    ? { txt: 'Sin pauta', cls: 'text-bg-light border' }
    : guardada.activa
      ? { txt: 'Activa en el sitio', cls: 'text-bg-success' }
      : { txt: 'Desactivada', cls: 'text-bg-secondary' };

  return (
    <div className="row g-4 align-items-start">
      <div className="col-lg-7">
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="d-flex align-items-center gap-2"><Megaphone size={17} /> Imagen de la pauta</h2>
            <span className={`badge rounded-pill ${estado.cls}`}>{estado.txt}</span>
          </div>
          <div className="admin-card-body">
            <input type="file" id="pautaInput" className="d-none" accept="image/*" disabled={guardando}
              onChange={(e) => { elegir(e.target.files[0]); e.target.value = ''; }} />

            {imagen ? (
              <div className="cover-preview" style={{ background: '#0b2545' }}>
                <img src={imagen} alt="Pauta" style={{ aspectRatio: 'auto', maxHeight: 480, objectFit: 'contain' }} />
                <div className="actions">
                  <label htmlFor="pautaInput"><RefreshCw size={13} /> Cambiar imagen</label>
                </div>
              </div>
            ) : (
              <label
                htmlFor="pautaInput"
                className={`dropzone${dragging ? ' dragging' : ''}`}
                style={{ padding: '3rem 1rem' }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); elegir(e.dataTransfer.files[0]); }}
              >
                <ImagePlus size={32} className="mb-2" />
                <div className="fw-semibold">Arrastra la imagen de la pauta o haz clic</div>
                <small>Vertical o cuadrada funciona mejor (ej. 1080×1350) · se optimiza automáticamente</small>
              </label>
            )}

            <label htmlFor="pautaEnlace" className="field-label mt-4">Enlace al hacer clic <span className="text-muted fw-normal">(opcional)</span></label>
            <input
              id="pautaEnlace"
              type="url"
              className={`form-control${enlaceValido ? '' : ' is-invalid'}`}
              placeholder="https://wa.me/57300... o la página del anunciante"
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              disabled={guardando}
            />
            {!enlaceValido && <div className="invalid-feedback">Debe empezar por https://</div>}

            <div className="form-check form-switch mt-4">
              <input className="form-check-input" type="checkbox" role="switch" id="pautaActiva" checked={activa} onChange={(e) => setActiva(e.target.checked)} disabled={guardando} />
              <label className="form-check-label fw-semibold" htmlFor="pautaActiva">Mostrar la pauta al entrar al sitio</label>
            </div>

            {progreso !== null && (
              <div className="mt-3">
                <div className="d-flex justify-content-between small text-muted mb-1"><span>Subiendo imagen…</span><span>{Math.round(progreso)}%</span></div>
                <div className="upload-progress"><span style={{ width: `${progreso}%` }} /></div>
              </div>
            )}

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button className="btn btn-primary rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-2" onClick={guardar} disabled={guardando || !cambios || !imagen}>
                {guardando ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />} Guardar pauta
              </button>
              {imagen && (
                <button className="btn btn-light border rounded-pill px-3 d-inline-flex align-items-center gap-2" onClick={() => setPreview(true)} disabled={guardando}>
                  <ExternalLink size={16} /> Ver cómo se verá
                </button>
              )}
              {guardada && (
                <button className="btn btn-outline-danger rounded-pill px-3 d-inline-flex align-items-center gap-2 ms-auto" onClick={() => setConfirmarQuitar(true)} disabled={guardando}>
                  <Trash2 size={16} /> Quitar pauta
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-5">
        <div className="admin-card">
          <div className="admin-card-head"><h2>¿Cómo funciona?</h2></div>
          <div className="admin-card-body small text-secondary">
            <ul className="ps-3 mb-0 d-flex flex-column gap-2">
              <li>La imagen aparece en una ventana al entrar al blog. El visitante la cierra con la <strong>X</strong> (o la tecla Esc).</li>
              <li>Se muestra <strong>una vez por visita</strong>, no en cada página.</li>
              <li>Si subes una pauta nueva, la verán de nuevo incluso quienes cerraron la anterior.</li>
              <li>Con enlace, al hacer clic en la imagen se abre la página del anunciante en otra pestaña.</li>
              <li>Para pausarla sin borrarla, desactiva el interruptor y guarda.</li>
              <li>No aparece en el panel admin ni en el login.</li>
            </ul>
          </div>
        </div>
      </div>

      {preview && imagen && (
        <div className="pauta-backdrop" onClick={() => setPreview(false)}>
          <div className="pauta-box" onClick={(e) => e.stopPropagation()}>
            <button className="pauta-close" onClick={() => setPreview(false)} aria-label="Cerrar vista previa"><X size={22} /></button>
            <img src={imagen} alt="Vista previa de la pauta" />
            <span className="pauta-tag">Publicidad</span>
          </div>
        </div>
      )}

      {confirmarQuitar && (
        <div className="confirm-modal" onClick={() => !guardando && setConfirmarQuitar(false)}>
          <div className="box" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <span className="danger-icon mb-3"><Trash2 size={22} /></span>
            <h2 className="h5 fw-bold">¿Quitar la pauta?</h2>
            <p className="text-secondary mb-4">Dejará de aparecer en el sitio y la imagen se borrará.</p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-light border rounded-pill px-3" onClick={() => setConfirmarQuitar(false)} disabled={guardando}>Cancelar</button>
              <button className="btn btn-danger rounded-pill px-3" onClick={quitar} disabled={guardando}>{guardando ? 'Quitando…' : 'Sí, quitar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
