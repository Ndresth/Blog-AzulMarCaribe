import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { UserCircle, Save, AlertCircle, CheckCircle } from 'lucide-react';

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
        nombre: nombre,
        email: user.email,
        fechaRegistro: Date.now()
      });

      // 2. Actualizar tu perfil interno de Google
      await updateProfile(user, {
        displayName: nombre
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
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow p-5 border-0 rounded-4" style={{maxWidth: '450px', width: '100%'}}>
        
        <div className="text-center mb-4 text-primary">
            <UserCircle size={64} strokeWidth={1.5} />
        </div>

        <h2 className="mb-2 fw-bold text-center text-dark">Bienvenido al Equipo</h2>
        <p className="text-muted text-center mb-4 small">
            Antes de empezar a publicar, necesitamos saber quién eres. Este nombre aparecerá como <strong>Autor</strong> en tus noticias.
        </p>
        
        {/* MENSAJE DE ERROR */}
        {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 p-2 mb-3 small" role="alert">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        {/* MENSAJE DE ÉXITO */}
        {success && (
            <div className="alert alert-success d-flex align-items-center gap-2 p-2 mb-3 small" role="alert">
                <CheckCircle size={16} /> {success}
            </div>
        )}
        
        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label className="form-label fw-bold small text-secondary">TU NOMBRE DE AUTOR</label>
                <input 
                    type="text" 
                    className="form-control form-control-lg" 
                    placeholder=""
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    autoFocus
                    disabled={loading || success} // Bloqueamos si está cargando o ya terminó
                />
            </div>

            <button 
                type="submit" 
                className="btn btn-primary w-100 py-3 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2"
                disabled={loading || success}
            >
                {loading || success ? (
                    <>Guardando...</>
                ) : (
                    <><Save size={20} /> Guardar y Continuar</>
                )}
            </button>
        </form>
      </div>
    </div>
  );
}