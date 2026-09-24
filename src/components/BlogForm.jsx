import React, { useState, useEffect } from 'react';
import { app, db, auth } from '../firebase/config';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Editor, EditorProvider, Toolbar, 
  BtnBold, BtnItalic, BtnUnderline, 
  BtnBulletList, BtnNumberedList, 
  BtnClearFormatting 
} from 'react-simple-wysiwyg';
import { Link as LinkIcon, Send, RefreshCw, UploadCloud, Video, CheckCircle } from 'lucide-react'; 

import { CATEGORIAS } from '../config/site';
import { sanitizeHtml } from '../utils/html';

const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 100;

const EMPTY_FORM = { titulo: '', categoria: 'Cultural', imagen: '', videoUrl: '', contenido: '' };

const storage = getStorage(app);

const uploadFile = async (file, folder) => {
  const safeName = file.name.replace(/[^\w.-]/g, '_');
  const storageRef = ref(storage, `${folder}/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export default function BlogForm({ onPostCreated, postToEdit, onCancel, onNotify }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState(null);

  useEffect(() => {
    if (postToEdit) {
      setFormData({
        titulo: postToEdit.titulo || '',
        categoria: postToEdit.categoria || 'Cultural',
        imagen: postToEdit.imagen || '',
        videoUrl: postToEdit.videoUrl || '',
        contenido: sanitizeHtml(postToEdit.contenido || '')
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setImageFile(null);
    setVideoFile(null);
  }, [postToEdit]);

  // Libera la URL temporal de la vista previa
  useEffect(() => {
    if (!formData.imagen?.startsWith('blob:')) return;
    const url = formData.imagen;
    return () => URL.revokeObjectURL(url);
  }, [formData.imagen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // El sanitizado completo se hace al guardar; aquí no se toca para no mover el cursor
  const handleEditorChange = (e) => {
    const contenido = e.target.value;
    setFormData(prev => ({ ...prev, contenido }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
      onNotify(`❌ La imagen supera ${MAX_IMAGE_MB} MB`);
      return;
    }
    setImageFile(f);
    setFormData(prev => ({ ...prev, imagen: URL.createObjectURL(f) }));
  };

  const handleVideoFileChange = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) {
      onNotify(`❌ El video supera ${MAX_VIDEO_MB} MB`);
      return;
    }
    setVideoFile(f);
    setFormData(prev => ({ ...prev, videoUrl: '' }));
  };

  const applyBlockStyle = (tag) => {
    document.execCommand('formatBlock', false, tag);
  };

  const openLinkModal = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0));
    }
    setShowLinkModal(true);
    setLinkUrl('https://');
  };

  const insertLink = () => {
    if (/^(https?:\/\/|mailto:)\S+$/i.test(linkUrl) && savedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
      document.execCommand('createLink', false, linkUrl);
    }
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // SANITIZACIÓN FINAL ANTES DE GUARDAR
    const contenidoFinal = sanitizeHtml(formData.contenido || '');
    if (!contenidoFinal.replace(/<[^>]+>/g, '').trim()) {
      onNotify("❌ El contenido de la noticia está vacío");
      return;
    }

    setLoading(true);

    try {
      // 1. Subida de archivos (imagen y/o video)
      const [imageUrl, videoLink] = await Promise.all([
        imageFile ? uploadFile(imageFile, 'blog_images') : formData.imagen,
        videoFile ? uploadFile(videoFile, 'blog_videos') : formData.videoUrl,
      ]);
      
      // 2. Preparar datos
      const user = auth.currentUser;
      const autor = user.displayName || user.email;

      // 3. Preparar datos para Firestore
      const datosFinales = {
        titulo: formData.titulo.trim(),
        categoria: formData.categoria,
        imagen: imageUrl, 
        videoUrl: videoLink || '',
        contenido: contenidoFinal,
        autor: autor
      };

      // 4. Guardar en Firestore
      if (postToEdit) {
        // Para edición: NO incluir fecha
        const docRef = doc(db, "posts", postToEdit.id);
        await updateDoc(docRef, datosFinales);
        onNotify("✅ Noticia actualizada correctamente");
      } else {
        // Para nuevo post: incluir fecha
        await addDoc(collection(db, "posts"), {
          ...datosFinales,
          fecha: Date.now()
        });
        onNotify("✅ Noticia publicada con éxito");
      }

      // 5. Limpiar
      setFormData(EMPTY_FORM);
      setImageFile(null);
      setVideoFile(null);
      
      if(onPostCreated) onPostCreated();

    } catch (error) {
      console.error("Error:", error);
      onNotify("❌ Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card shadow-sm p-4 mb-4 border-0">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
              <div className="col-md-8">
                  <label className="form-label fw-bold small text-muted">TÍTULO</label>
                  <input 
                    type="text" 
                    name="titulo" 
                    className="form-control" 
                    required 
                    value={formData.titulo} 
                    onChange={handleChange}
                    maxLength={200}
                  />
              </div>

              <div className="col-md-4">
                  <label className="form-label fw-bold small text-muted">SECCIÓN</label>
                  <select name="categoria" className="form-select" value={formData.categoria} onChange={handleChange}>
                      {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
              </div>

              <div className="col-12">
                  <label className="form-label fw-bold small text-muted">IMAGEN DE PORTADA</label>
                  <div className="border rounded p-3 text-center bg-light" style={{borderStyle: 'dashed'}}>
                      <input 
                        type="file" 
                        id="imageFileInput" 
                        className="d-none" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        disabled={loading}
                      />
                      
                      {formData.imagen ? (
                          <div className="position-relative d-inline-block">
                              <img src={formData.imagen} alt="Preview" className="img-fluid rounded shadow-sm" style={{maxHeight: '200px'}} />
                              <button 
                                type="button"
                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                                title="Cambiar imagen"
                                onClick={() => { 
                                  setImageFile(null); 
                                  setFormData(prev => ({ ...prev, imagen: '' }));
                                }}
                              >
                                <RefreshCw size={14}/>
                              </button>
                          </div>
                      ) : (
                          <label htmlFor="imageFileInput" className="btn btn-outline-primary cursor-pointer d-flex align-items-center justify-content-center gap-2" style={{cursor: 'pointer'}}>
                              <UploadCloud size={20} /> Subir Imagen desde PC (máx. {MAX_IMAGE_MB} MB)
                          </label>
                      )}
                  </div>
              </div>

              <div className="col-12">
                  <label className="form-label fw-bold small text-muted d-flex align-items-center gap-2">
                    <Video size={18} /> VIDEO OPCIONAL
                  </label>
                  <div className="input-group">
                    <input 
                        type="url" 
                        name="videoUrl" 
                        className="form-control" 
                        placeholder="Pegar URL de YouTube..." 
                        value={formData.videoUrl} 
                        onChange={handleChange} 
                        disabled={loading || !!videoFile}
                    />
                    
                    {videoFile && (
                        <button type="button" className="btn btn-outline-danger" title="Quitar video" onClick={() => setVideoFile(null)} disabled={loading}>
                            <RefreshCw size={16} />
                        </button>
                    )}
                    <label htmlFor="videoFileInput" className={`btn ${videoFile ? 'btn-success' : 'btn-outline-dark'} d-flex align-items-center gap-2`} title={videoFile?.name}>
                        {videoFile ? <CheckCircle size={20} /> : <UploadCloud size={20} />} 
                        {videoFile ? 'Video Seleccionado' : 'Subir Video'}
                    </label>
                    <input 
                        type="file" 
                        id="videoFileInput" 
                        className="d-none" 
                        accept="video/*" 
                        onChange={handleVideoFileChange} 
                        disabled={loading || !!formData.videoUrl}
                    />
                  </div>
              </div>

              <div className="col-12">
                  <label className="form-label fw-bold small text-muted d-flex justify-content-between align-items-center">
                    <span>CONTENIDO</span>
                    <small className="text-warning fw-normal">
                      Se eliminarán automáticamente etiquetas HTML peligrosas
                    </small>
                  </label>
                  <div style={{border: '1px solid #ced4da', borderRadius: '0.375rem', overflow: 'hidden'}}>
                      <EditorProvider>
                        <Editor 
                          value={formData.contenido} 
                          onChange={handleEditorChange}
                          style={{minHeight: '350px', backgroundColor: 'white'}}
                          containerProps={{ style: { height: '100%' } }}
                        >
                          <Toolbar>
                            <button type="button" onClick={() => applyBlockStyle('h2')} className="rsw-btn fw-bold">H1</button>
                            <button type="button" onClick={() => applyBlockStyle('h3')} className="rsw-btn fw-bold">H2</button>
                            <button type="button" onClick={() => applyBlockStyle('p')} className="rsw-btn">P</button>
                            <span style={{width:'1px', background:'#ddd', margin:'0 5px'}}></span>
                            <BtnBold /><BtnItalic /><BtnUnderline /><BtnBulletList /><BtnNumberedList />
                            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={openLinkModal} className="rsw-btn">
                                <LinkIcon size={18} />
                            </button>
                            <BtnClearFormatting />
                          </Toolbar>
                        </Editor>
                      </EditorProvider>
                  </div>
              </div>

              <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                  {postToEdit && (
                      <button type="button" className="btn btn-secondary px-4 rounded-pill" onClick={onCancel}>
                          <RefreshCw size={18} className="me-1" /> Cancelar
                      </button>
                  )}
                  <button type="submit" className={`btn ${postToEdit ? 'btn-warning' : 'btn-primary'} fw-bold px-4 rounded-pill d-flex align-items-center gap-2`} disabled={loading}>
                      {loading ? <><RefreshCw className="animate-spin" size={18} /> Subiendo...</> : <><Send size={18} /> {postToEdit ? 'Actualizar' : 'Publicar'}</>}
                  </button>
              </div>
          </div>
        </form>
      </div>

      {showLinkModal && (
        <>
            <div className="modal-backdrop fade show" style={{zIndex: 1060}}></div>
            <div className="modal fade show d-block" style={{zIndex: 1070}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header"><h5 className="modal-title">Insertar Enlace</h5></div>
                        <div className="modal-body">
                            <input 
                              type="text" 
                              className="form-control" 
                              value={linkUrl} 
                              onChange={(e) => setLinkUrl(e.target.value)} 
                              autoFocus 
                              placeholder="https://..." 
                            />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>Cancelar</button>
                            <button type="button" className="btn btn-primary" onClick={insertLink}>Insertar</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
      )}
    </>
  );
}