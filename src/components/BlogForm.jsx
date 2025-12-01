import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { 
  Editor, EditorProvider, Toolbar, 
  BtnBold, BtnItalic, BtnUnderline, 
  BtnBulletList, BtnNumberedList, 
  BtnClearFormatting 
} from 'react-simple-wysiwyg';
// Importamos íconos de Lucide
import { Link as LinkIcon, Send, RefreshCw } from 'lucide-react';

export default function BlogForm({ onPostCreated, postToEdit, onCancel, onNotify }) {
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: 'Cultural',
    imagen: '',
    contenido: ''
  });
  const [loading, setLoading] = useState(false);
  
  // Estado para el Modal de Insertar Link
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState(null);

  useEffect(() => {
    if (postToEdit) {
      setFormData({
        titulo: postToEdit.titulo,
        categoria: postToEdit.categoria,
        imagen: postToEdit.imagen,
        contenido: postToEdit.contenido
      });
    } else {
        setFormData({ titulo: '', categoria: 'Cultural', imagen: '', contenido: '' });
    }
  }, [postToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditorChange = (e) => {
    setFormData({ ...formData, contenido: e.target.value });
  };

  // --- LÓGICA DE FORMATO ---
  const applyBlockStyle = (tag) => {
    document.execCommand('formatBlock', false, tag);
  };

  // --- LÓGICA DE LINK PERSONALIZADO ---
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
  // ---------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (postToEdit) {
        const docRef = doc(db, "posts", postToEdit.id);
        await updateDoc(docRef, { ...formData });
        onNotify("Noticia actualizada correctamente");
      } else {
        await addDoc(collection(db, "posts"), {
          ...formData,
          fecha: Date.now()
        });
        onNotify("Noticia publicada con éxito");
      }

      setFormData({ titulo: '', categoria: 'Cultural', imagen: '', contenido: '' });
      if(onPostCreated) onPostCreated();

    } catch (error) {
      console.error("Error:", error);
      onNotify("Error al guardar la noticia");
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
                      <option value="Cultural">🎭 Cultural</option>
                      <option value="Entretenimiento">🎬 Entretenimiento</option>
                  </select>
              </div>

              <div className="col-12">
                  <label className="form-label fw-bold small text-muted">IMAGEN (URL)</label>
                  <input type="text" name="imagen" className="form-control" placeholder="https://..." value={formData.imagen} onChange={handleChange} />
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
                            <button type="button" onClick={() => applyBlockStyle('h2')} className="rsw-btn fw-bold" title="Título Grande">H1</button>
                            <button type="button" onClick={() => applyBlockStyle('h3')} className="rsw-btn fw-bold" title="Subtítulo">H2</button>
                            <button type="button" onClick={() => applyBlockStyle('p')} className="rsw-btn" title="Texto Normal">P</button>
                            <span style={{width:'1px', background:'#ddd', margin:'0 5px'}}></span>
                            
                            <BtnBold title="Negrita"/>
                            <BtnItalic title="Cursiva"/>
                            <BtnUnderline title="Subrayado"/>
                            <BtnBulletList title="Lista puntos"/>
                            <BtnNumberedList title="Lista numérica"/>
                            
                            {/* BOTÓN DE LINK PERSONALIZADO */}
                            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={openLinkModal} className="rsw-btn" title="Insertar Enlace">
                                <LinkIcon size={18} />
                            </button>
                            
                            <BtnClearFormatting title="Limpiar"/>
                          </Toolbar>
                        </Editor>
                      </EditorProvider>
                  </div>
              </div>

              <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                  {postToEdit && (
                      <button type="button" className="btn btn-secondary px-4 rounded-pill" onClick={onCancel}>
                          Cancelar Edición
                      </button>
                  )}
                  <button type="submit" className={`btn ${postToEdit ? 'btn-warning' : 'btn-primary'} fw-bold px-4 rounded-pill d-flex align-items-center gap-2`} disabled={loading}>
                      {loading ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} /> Guardando...
                        </>
                      ) : (
                        <>
                          {postToEdit ? 'Actualizar Noticia' : 'Publicar Noticia'} <Send size={18} />
                        </>
                      )}
                  </button>
              </div>
          </div>
        </form>
      </div>

      {/* MODAL LINK */}
      {showLinkModal && (
        <>
            <div className="modal-backdrop fade show" style={{zIndex: 1060}}></div>
            <div className="modal fade show d-block" style={{zIndex: 1070}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title d-flex align-items-center gap-2">
                              <LinkIcon size={20} /> Insertar Enlace
                            </h5>
                            <button type="button" className="btn-close" onClick={() => setShowLinkModal(false)}></button>
                        </div>
                        <div className="modal-body">
                            <label className="form-label">URL del enlace:</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={linkUrl} 
                                onChange={(e) => setLinkUrl(e.target.value)}
                                autoFocus
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