import React, { useState, useEffect, useRef } from 'react';
import { app, db, auth } from '../firebase/config';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  Editor, EditorProvider, Toolbar,
  BtnBold, BtnItalic, BtnUnderline,
  BtnBulletList, BtnNumberedList,
  BtnClearFormatting, BtnUndo, BtnRedo, Separator
} from 'react-simple-wysiwyg';
import {
  Link as LinkIcon, Send, UploadCloud, Video, ImagePlus, Trash2, RefreshCw,
  Quote, Save, Eye, Loader2, X
} from 'lucide-react';

import PostCard from './PostCard';
import { CATEGORIAS } from '../config/site';
import { sanitizeHtml, htmlToText, getYouTubeEmbedUrl } from '../utils/html';

const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 100;
const MAX_TITULO = 200;

const EMPTY_FORM = { titulo: '', categoria: 'Cultural', imagen: '', videoUrl: '', contenido: '' };

const storage = getStorage(app);

// Sube un archivo reportando el progreso (0-100)
const uploadFile = (file, folder, onProgress) => new Promise((resolve, reject) => {
  const safeName = file.name.replace(/[^\w.-]/g, '_');
  const task = uploadBytesResumable(ref(storage, `${folder}/${Date.now()}_${safeName}`), file);
  task.on('state_changed',
    (s) => onProgress?.(s.totalBytes ? (s.bytesTransferred / s.totalBytes) * 100 : 0),
    reject,
    async () => resolve(await getDownloadURL(task.snapshot.ref))
  );
});

const formDesdePost = (post) => post ? {
  titulo: post.titulo || '',
  categoria: post.categoria || 'Cultural',
  imagen: post.imagen || '',
  videoUrl: post.videoUrl || '',
  contenido: sanitizeHtml(post.contenido || '')
} : EMPTY_FORM;

export default function BlogForm({ onPostCreated, postToEdit, onCancel, onNotify, onDirtyChange }) {
  const [formData, setFormData] = useState(() => formDesdePost(postToEdit));
  const [inicial, setInicial] = useState(() => formDesdePost(postToEdit));
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const savedRange = useRef(null);

  // Nota: AdminPanel usa key={post.id}, así que al cambiar de noticia el formulario se monta de nuevo
  const dirty = !!imageFile || !!videoFile || Object.keys(EMPTY_FORM).some((k) => formData[k] !== inicial[k]);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  // Libera la URL temporal de la vista previa
  useEffect(() => {
    if (!formData.imagen?.startsWith('blob:')) return;
    const url = formData.imagen;
    return () => URL.revokeObjectURL(url);
  }, [formData.imagen]);

  const setCampo = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

  // El sanitizado completo se hace al guardar; aquí no se toca para no mover el cursor
  const handleEditorChange = (e) => setCampo('contenido', e.target.value);

  const elegirImagen = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { onNotify('El archivo no es una imagen', 'error'); return; }
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) { onNotify(`La imagen supera ${MAX_IMAGE_MB} MB`, 'error'); return; }
    setImageFile(f);
    setCampo('imagen', URL.createObjectURL(f));
  };

  const handleFileChange = (e) => {
    elegirImagen(e.target.files[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    elegirImagen(e.dataTransfer.files[0]);
  };

  const quitarImagen = () => {
    setImageFile(null);
    setCampo('imagen', '');
  };

  const handleVideoFileChange = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) { onNotify(`El video supera ${MAX_VIDEO_MB} MB`, 'error'); return; }
    setVideoFile(f);
    setCampo('videoUrl', '');
  };

  const applyBlockStyle = (tag) => document.execCommand('formatBlock', false, tag);

  const openLinkModal = () => {
    const selection = window.getSelection();
    savedRange.current = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    setShowLinkModal(true);
    setLinkUrl('https://');
  };

  const linkValido = /^(https?:\/\/|mailto:)\S+\.\S+$/i.test(linkUrl);

  const insertLink = () => {
    if (linkValido && savedRange.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
      document.execCommand('createLink', false, linkUrl);
    }
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titulo.trim()) { onNotify('Escribe un título para la noticia', 'error'); return; }

    // SANITIZACIÓN FINAL ANTES DE GUARDAR
    const contenidoFinal = sanitizeHtml(formData.contenido || '');
    if (!htmlToText(contenidoFinal)) { onNotify('El contenido de la noticia está vacío', 'error'); return; }

    setLoading(true);

    try {
      // 1. Subida de archivos (imagen y/o video) con progreso combinado
      const pesos = { img: imageFile?.size || 0, vid: videoFile?.size || 0 };
      const total = pesos.img + pesos.vid;
      const avance = { img: 0, vid: 0 };
      const actualizar = (k) => (p) => {
        avance[k] = p;
        if (total) setProgress(((avance.img * pesos.img) + (avance.vid * pesos.vid)) / total);
      };
      if (total) setProgress(0);

      const [imageUrl, videoLink] = await Promise.all([
        imageFile ? uploadFile(imageFile, 'blog_images', actualizar('img')) : formData.imagen,
        videoFile ? uploadFile(videoFile, 'blog_videos', actualizar('vid')) : formData.videoUrl,
      ]);

      // 2. Preparar datos para Firestore (mismos campos de siempre)
      const user = auth.currentUser;
      const datosFinales = {
        titulo: formData.titulo.trim(),
        categoria: formData.categoria,
        imagen: imageUrl,
        videoUrl: videoLink || '',
        contenido: contenidoFinal,
      };

      // 3. Guardar
      if (postToEdit) {
        // Al editar se conserva el autor original y la fecha
        await updateDoc(doc(db, "posts", postToEdit.id), {
          ...datosFinales,
          autor: postToEdit.autor || user.displayName || user.email,
        });
        onNotify('Noticia actualizada correctamente');
      } else {
        await addDoc(collection(db, "posts"), {
          ...datosFinales,
          autor: user.displayName || user.email,
          fecha: Date.now()
        });
        onNotify('Noticia publicada con éxito');
      }

      setFormData(EMPTY_FORM);
      setInicial(EMPTY_FORM);
      setImageFile(null);
      setVideoFile(null);
      onPostCreated?.();
    } catch (error) {
      console.error("Error:", error);
      onNotify('Error al guardar: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const palabras = htmlToText(formData.contenido).split(' ').filter(Boolean).length;
  const youtubeOk = formData.videoUrl ? !!getYouTubeEmbedUrl(formData.videoUrl) : true;
  const autorPreview = postToEdit?.autor || auth.currentUser?.displayName || 'Redacción';

  return (
    <>
      <form onSubmit={handleSubmit} className="row g-4 align-items-start">
        {/* ------- COLUMNA PRINCIPAL ------- */}
        <div className="col-xl-8">
          <div className="admin-card">
            <div className="admin-card-body">
              <label htmlFor="titulo" className="visually-hidden">Título</label>
              <textarea
                id="titulo"
                className="title-input"
                rows={2}
                placeholder="Escribe un título atractivo…"
                value={formData.titulo}
                maxLength={MAX_TITULO}
                onChange={(e) => setCampo('titulo', e.target.value.replace(/\n/g, ' '))}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                disabled={loading}
              />
              <div className="d-flex justify-content-between small text-muted mt-1 mb-3">
                <span>El título aparece en la portada y al compartir en redes.</span>
                <span className={formData.titulo.length > 120 ? 'text-warning fw-semibold' : ''}>{formData.titulo.length}/{MAX_TITULO}</span>
              </div>

              <div className="editor-wrap">
                <EditorProvider>
                  <Editor
                    value={formData.contenido}
                    onChange={handleEditorChange}
                    placeholder="Empieza a escribir la noticia…"
                    disabled={loading}
                  >
                    <Toolbar>
                      <BtnUndo /><BtnRedo />
                      <Separator />
                      <button type="button" onClick={() => applyBlockStyle('h2')} className="rsw-btn fw-bold" title="Subtítulo grande">H2</button>
                      <button type="button" onClick={() => applyBlockStyle('h3')} className="rsw-btn fw-bold" title="Subtítulo pequeño">H3</button>
                      <button type="button" onClick={() => applyBlockStyle('p')} className="rsw-btn" title="Párrafo normal">¶</button>
                      <button type="button" onClick={() => applyBlockStyle('blockquote')} className="rsw-btn" title="Cita"><Quote size={15} /></button>
                      <Separator />
                      <BtnBold /><BtnItalic /><BtnUnderline />
                      <Separator />
                      <BtnBulletList /><BtnNumberedList />
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={openLinkModal} className="rsw-btn" title="Insertar enlace">
                        <LinkIcon size={16} />
                      </button>
                      <Separator />
                      <BtnClearFormatting />
                    </Toolbar>
                  </Editor>
                </EditorProvider>
              </div>
              <div className="d-flex justify-content-between small text-muted mt-2">
                <span>Se eliminan automáticamente estilos pegados y etiquetas no permitidas.</span>
                <span>{palabras} palabras · {Math.max(1, Math.round(palabras / 200))} min de lectura</span>
              </div>
            </div>
          </div>
        </div>

        {/* ------- BARRA LATERAL ------- */}
        <div className="col-xl-4">
          <div className="editor-sidebar d-flex flex-column gap-3">
            {/* Publicar */}
            <div className="admin-card">
              <div className="admin-card-head">
                <h2>{postToEdit ? 'Actualizar noticia' : 'Publicar'}</h2>
                {dirty && <span className="badge rounded-pill text-bg-warning">Cambios sin guardar</span>}
              </div>
              <div className="admin-card-body">
                <div className="small text-muted mb-3">
                  Autor: <strong className="text-dark">{autorPreview}</strong>
                </div>

                {progress !== null && (
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Subiendo archivos…</span><span>{Math.round(progress)}%</span>
                    </div>
                    <div className="upload-progress"><span style={{ width: `${progress}%` }} /></div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  {postToEdit && (
                    <button type="button" className="btn btn-light border rounded-pill px-3" onClick={onCancel} disabled={loading}>
                      Cancelar
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary rounded-pill fw-semibold flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2" disabled={loading}>
                    {loading
                      ? <><Loader2 size={17} className="animate-spin" /> Guardando…</>
                      : postToEdit ? <><Save size={17} /> Guardar cambios</> : <><Send size={17} /> Publicar noticia</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Sección */}
            <div className="admin-card">
              <div className="admin-card-head"><h2>Sección</h2></div>
              <div className="admin-card-body">
                <div className="cat-picker" role="radiogroup" aria-label="Sección">
                  {CATEGORIAS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      role="radio"
                      aria-checked={formData.categoria === c.value}
                      className={`cat-option${formData.categoria === c.value ? ' active' : ''}`}
                      style={{ '--cat-color': c.color }}
                      onClick={() => setCampo('categoria', c.value)}
                      disabled={loading}
                    >
                      <span className="dot" /> <c.Icon size={16} /> {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Portada */}
            <div className="admin-card">
              <div className="admin-card-head"><h2>Imagen de portada</h2></div>
              <div className="admin-card-body">
                <input type="file" id="imageFileInput" className="d-none" accept="image/*" onChange={handleFileChange} disabled={loading} />
                {formData.imagen ? (
                  <div className="cover-preview">
                    <img src={formData.imagen} alt="Vista previa de la portada" />
                    <div className="actions">
                      <label htmlFor="imageFileInput"><RefreshCw size={13} /> Cambiar</label>
                      <button type="button" onClick={quitarImagen} disabled={loading}><Trash2 size={13} /> Quitar</button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="imageFileInput"
                    className={`dropzone${dragging ? ' dragging' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                  >
                    <ImagePlus size={28} className="mb-2" />
                    <div className="fw-semibold">Arrastra una imagen o haz clic</div>
                    <small>JPG, PNG o WebP · máx. {MAX_IMAGE_MB} MB · ideal 1200×750</small>
                  </label>
                )}
              </div>
            </div>

            {/* Video */}
            <div className="admin-card">
              <div className="admin-card-head"><h2 className="d-flex align-items-center gap-2"><Video size={16} /> Video <span className="text-muted fw-normal small">(opcional)</span></h2></div>
              <div className="admin-card-body">
                {videoFile ? (
                  <div className="d-flex align-items-center gap-2 p-2 rounded-3 border bg-light">
                    <Video size={18} className="text-primary flex-shrink-0" />
                    <span className="small text-truncate flex-grow-1" title={videoFile.name}>{videoFile.name}</span>
                    <button type="button" className="icon-btn danger" onClick={() => setVideoFile(null)} disabled={loading} aria-label="Quitar video"><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <label htmlFor="videoUrl" className="field-label">Enlace de YouTube</label>
                    <input
                      id="videoUrl"
                      type="url"
                      className={`form-control${!youtubeOk ? ' is-invalid' : ''}`}
                      placeholder="https://youtu.be/…"
                      value={formData.videoUrl}
                      onChange={(e) => setCampo('videoUrl', e.target.value)}
                      disabled={loading}
                    />
                    {!youtubeOk && <div className="invalid-feedback">No es un enlace de YouTube reconocido; se mostrará como video directo.</div>}
                    {!formData.videoUrl && (
                      <>
                        <div className="text-center small text-muted my-2">o</div>
                        <label htmlFor="videoFileInput" className="btn btn-light border w-100 rounded-pill d-inline-flex align-items-center justify-content-center gap-2">
                          <UploadCloud size={17} /> Subir video (máx. {MAX_VIDEO_MB} MB)
                        </label>
                        <input type="file" id="videoFileInput" className="d-none" accept="video/*" onChange={handleVideoFileChange} disabled={loading} />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Vista previa */}
            <div className="admin-card">
              <div className="admin-card-head"><h2 className="d-flex align-items-center gap-2"><Eye size={16} /> Vista previa en la portada</h2></div>
              <div className="admin-card-body" style={{ pointerEvents: 'none' }} aria-hidden="true">
                <PostCard post={{
                  id: 'preview',
                  titulo: formData.titulo || 'Título de la noticia',
                  contenido: formData.contenido || '<p>El resumen de la noticia aparecerá aquí.</p>',
                  imagen: formData.imagen,
                  categoria: formData.categoria,
                  autor: autorPreview,
                  fecha: postToEdit?.fecha || Date.now(),
                }} />
              </div>
            </div>
          </div>
        </div>
      </form>

      {showLinkModal && (
        <div className="confirm-modal" onClick={() => setShowLinkModal(false)}>
          <div className="box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="link-title">
            <h2 id="link-title" className="h5 fw-bold mb-3 d-flex align-items-center gap-2"><LinkIcon size={18} /> Insertar enlace</h2>
            <input
              type="url"
              className="form-control"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertLink(); } }}
              autoFocus
              placeholder="https://..."
            />
            <small className="text-muted d-block mt-2">Selecciona primero el texto que quieres convertir en enlace.</small>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light border rounded-pill px-3" onClick={() => setShowLinkModal(false)}>Cancelar</button>
              <button type="button" className="btn btn-primary rounded-pill px-3" onClick={insertLink} disabled={!linkValido}>Insertar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
