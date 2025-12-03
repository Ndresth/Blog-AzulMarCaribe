import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase/config';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Editor, EditorProvider, Toolbar, 
  BtnBold, BtnItalic, BtnUnderline, 
  BtnBulletList, BtnNumberedList, 
  BtnClearFormatting 
} from 'react-simple-wysiwyg';
import { Link as LinkIcon, Send, RefreshCw, UploadCloud, Video, CheckCircle } from 'lucide-react'; 

export default function BlogForm({ onPostCreated, postToEdit, onCancel, onNotify }) {
  const [formData, setFormData] = useState(() => {
    if (postToEdit) {
      return { ...postToEdit };
    } 
    return {
      id: Date.now(), 
      titulo: '',
      categoria: 'Cultural',
      imagen: '',
      videoUrl: '',
      contenido: ''
    };
  });
  
  const [file, setFile] = useState(null); 
  const [loading, setLoading] = useState(false);
  
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState(null);

  useEffect(() => {
    if (postToEdit) {
      setFormData({
        titulo: postToEdit.titulo,
        categoria: postToEdit.categoria,
        imagen: postToEdit.imagen,
        videoUrl: postToEdit.videoUrl || '',
        contenido: postToEdit.contenido
      });
    } else {
        setFormData({ titulo: '', categoria: 'Cultural', imagen: '', videoUrl: '', contenido: '' });
        setFile(null);
    }
  }, [postToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditorChange = (e) => {
    setFormData({ ...formData, contenido: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
        setFile(e.target.files[0]);
        setFormData({ ...formData, imagen: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleVideoFileChange = (e) => {
    if (e.target.files[0]) {
        setFile(e.target.files[0]); 
        setFormData({ ...formData, videoUrl: '' }); 
    }
  };

  const applyBlockStyle = (tag) => document.execCommand('formatBlock', false, tag);

  const openLinkModal = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0));
    }
    setShowLinkModal(true);
    setLinkUrl('https://');
  };

  const insertLink = () => {
    if (linkUrl && savedRange) {
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
    setLoading(true);

    try {
      let imageUrl = formData.imagen;
      let videoLink = formData.videoUrl;

      // 1. Subida de archivos (Imagen o Video)
      if (file) {
        const folder = file.type.startsWith('video/') ? 'blog_videos' : 'blog_images';
        const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        if (file.type.startsWith('video/')) {
            videoLink = downloadUrl;
        } else {
            imageUrl = downloadUrl;
        }
      }
      
      // 2. Preparar datos
      const user = auth.currentUser;
      const autor = user.displayName || user.email;

      // CLONAMOS EL OBJETO PARA NO MUTAR EL ESTADO
      const datosFinales = {
        ...formData,
        imagen: imageUrl, 
        videoUrl: videoLink,
        autor: autor
      };

      // --- CORRECCIÓN AQUÍ: Borramos el ID explícitamente ---
      delete datosFinales.id; 
      // -----------------------------------------------------

      // 3. Guardar en Firestore
      if (postToEdit) {
        const docRef = doc(db, "posts", postToEdit.id);
        await updateDoc(docRef, datosFinales);
        onNotify("✅ Noticia actualizada correctamente");
      } else {
        await addDoc(collection(db, "posts"), {
          ...datosFinales,
          fecha: Date.now()
        });
        onNotify("✅ Noticia publicada con éxito");
      }

      // 4. Limpiar
      setFormData({ titulo: '', categoria: 'Cultural', imagen: '', videoUrl: '', contenido: '' });
      setFile(null);
      
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
                  <input type="text" name="titulo" className="form-control" required value={formData.titulo} onChange={handleChange} />
              </div>

              <div className="col-md-4">
                  <label className="form-label fw-bold small text-muted">SECCIÓN</label>
                  <select name="categoria" className="form-select" value={formData.categoria} onChange={handleChange}>
                      <option value="Cultural">Cultural</option>
                      <option value="Entretenimiento">Entretenimiento</option>
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
                      
                      {formData.imagen && !file?.type.startsWith('video/') ? (
                          <div className="position-relative d-inline-block">
                              <img src={formData.imagen} alt="Preview" className="img-fluid rounded shadow-sm" style={{maxHeight: '200px'}} />
                              <button 
                                type="button"
                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                                onClick={() => { setFile(null); setFormData({...formData, imagen: ''}) }}
                              >
                                <RefreshCw size={14}/>
                              </button>
                          </div>
                      ) : (
                          <label htmlFor="imageFileInput" className="btn btn-outline-primary cursor-pointer d-flex align-items-center justify-content-center gap-2" style={{cursor: 'pointer'}}>
                              <UploadCloud size={20} /> {file?.type.startsWith('video/') ? 'Video seleccionado en otro campo' : 'Subir Imagen desde PC'}
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
                        disabled={loading || (file && file.type.startsWith('video/'))}
                    />
                    
                    <label htmlFor="videoFileInput" className={`btn ${file?.type.startsWith('video/') ? 'btn-success' : 'btn-outline-dark'} d-flex align-items-center gap-2`}>
                        {file?.type.startsWith('video/') ? <CheckCircle size={20} /> : <UploadCloud size={20} />} 
                        {file?.type.startsWith('video/') ? 'Video Seleccionado' : 'Subir Video'}
                    </label>
                    <input 
                        type="file" 
                        id="videoFileInput" 
                        className="d-none" 
                        accept="video/*" 
                        onChange={handleVideoFileChange} 
                        disabled={loading || formData.videoUrl}
                    />
                  </div>
              </div>

              <div className="col-12">
                  <label className="form-label fw-bold small text-muted">CONTENIDO</label>
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
                            <input type="text" className="form-control" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} autoFocus placeholder="https://..." />
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