import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { UserCircle, Save, AlertCircle, CheckCircle } from 'lucide-react';
import './admin.css';

export default function CreateProfile() {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para mensajes visuales en lugar de alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nombre.trim()) {
        setError("Por favor escribe un nombre válido.");
        return;
    }
    
    setLoading(true);
    const user = auth.currentUser;

    try {
      // 1. Guardar tu ficha en la Base de Datos
      await setDoc(doc(db, "users", user.uid), {
        nombre: nombre.trim(),
        email: user.email,
        fechaRegistro: Date.now()
      });

      // 2. Actualizar tu perfil interno de Google
      await updateProfile(user, {
        displayName: nombre.trim()
      });

      // Mensaje de éxito visual
      setSuccess("¡Perfil creado con éxito! Entrando al panel...");
      
      // Esperamos un poco para que el usuario lea el mensaje antes de recargar
      setTimeout(() => {
          window.location.href = "/admin"; 
      }, 1500);

    } catch (error) {
      console.error("Error:", error);
      setError("Ocurrió un error al guardar el perfil. Intenta de nuevo.");
      setLoading(false); // Solo quitamos loading si falló
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card text-start">
        <div className="text-center">
          <span className="d-inline-flex align-items-center justify-content-center rounded-4 mb-3" style={{ width: 60, height: 60, background: 'var(--ocean-light)', color: 'var(--ocean)' }}>
            <UserCircle size={32} strokeWidth={1.5} />
          </span>
          <h1 className="h4 fw-bold mb-2">Bienvenido al equipo</h1>
          <p className="text-secondary small mb-4">
            Antes de publicar, dinos cómo quieres firmar. Este nombre aparecerá como <strong>autor</strong> en tus noticias.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success d-flex align-items-center gap-2 py-2 small" role="status">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="nombre" className="field-label">Nombre de autor</label>
          <input
            id="nombre"
            type="text"
            className="form-control form-control-lg mb-4"
            placeholder="Ej. Xiomara De los Reyes"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={60}
            autoFocus
            disabled={loading || !!success}
          />
          <button
            type="submit"
            className="btn btn-primary w-100 py-2 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2"
            disabled={loading || !!success || !nombre.trim()}
          >
            {loading || success ? <><span className="spinner-border spinner-border-sm" /> Guardando…</> : <><Save size={18} /> Guardar y continuar</>}
          </button>
        </form>
      </div>
    </div>
  );
}
