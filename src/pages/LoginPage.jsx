import React from 'react';
import { auth } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
// Importamos el ícono de seguridad de Lucide
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Si el login es exitoso, nos manda al admin
      navigate('/admin');
    } catch (error) {
      console.error("Error al entrar:", error);
      alert("Error al iniciar sesión");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card text-center shadow p-5 border-0 rounded-4" style={{maxWidth: '400px'}}>
        
        {/* ÍCONO DE SEGURIDAD (Reemplaza al emoji) */}
        <div className="mb-3 text-primary d-flex justify-content-center">
            <ShieldCheck size={64} strokeWidth={1.5} />
        </div>

        <h1 className="mb-2 fw-bold text-dark">Acceso Admin</h1>
        <p className="text-muted mb-4 small">Solo personal autorizado</p>
        
        <button 
            className="btn btn-outline-dark btn-lg d-flex align-items-center justify-content-center gap-3 w-100 py-2 rounded-pill"
            onClick={handleLogin}
        >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" style={{width:'24px'}}/>
            <span className="fw-bold fs-6">Entrar con Google</span>
        </button>
      </div>
    </div>
  );
}