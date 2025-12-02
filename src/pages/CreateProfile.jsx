import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
// Eliminamos useNavigate de aquí porque no lo usamos
import { UserCircle, Save } from 'lucide-react';

export default function CreateProfile() {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  // Eliminamos const navigate = ...

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return alert("Por favor escribe un nombre");
    
    setLoading(true);
    const user = auth.currentUser;

    try {
      // 1. Guardar tu ficha en la Base de Datos (Colección 'users')
      await setDoc(doc(db, "users", user.uid), {
        nombre: nombre,
        email: user.email,
        fechaRegistro: Date.now()
      });

      // 2. Actualizar tu perfil interno de Google (Auth)
      await updateProfile(user, {
        displayName: nombre
      });

      alert("¡Perfil creado con éxito!");
      
      // 3. Recargamos la página forzosamente para que el sistema detecte el cambio de permisos
      window.location.href = "/admin"; 

    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar perfil");
    } finally {
      setLoading(false);
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
                    required
                />
            </div>

            <button 
                type="submit" 
                className="btn btn-primary w-100 py-3 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
            >
                <Save size={20} />
                {loading ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
        </form>
      </div>
    </div>
  );
}