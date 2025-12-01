import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import { auth } from './firebase/config';
import ScrollToTop from './components/ScrollToTop';
import { ShieldAlert, Home } from 'lucide-react';

// Importamos las páginas y componentes
import HomePage from './pages/HomePage';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import PostDetail from './pages/PostDetail';
import NotFoundPage from './pages/NotFoundPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// --- COMPONENTE GUARDIÁN ---
const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState('loading'); 
  const [currentUser, setCurrentUser] = useState(null);
  
  // (Eliminamos 'navigate' porque no lo estamos usando)

  useEffect(() => {
    // ⚠️ TU CORREO DE ADMIN AQUÍ
    const adminsAutorizados = [
      "yamithadresjulio@gmail.com",
      "xiomysofy24@gmail.com"
    ];

    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
      if (usuarioFirebase) {
        setCurrentUser(usuarioFirebase);
        
        if (adminsAutorizados.includes(usuarioFirebase.email)) {
          setStatus('authorized');
        } else {
          // NO ES ADMIN: Mostramos la pantalla de bloqueo
          setStatus('unauthorized');
        }
      } else {
        setStatus('guest');
      }
    });

    return () => unsubscribe();
  }, []); 

  // Función para limpiar sesión y volver al home
  const handleExit = async () => {
    await signOut(auth); // Cerramos la sesión incorrecta
    window.location.href = "/"; // Forzamos ir al inicio limpio
  };

  // 1. Cargando
  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  // 2. Si no está logueado -> Login
  if (status === 'guest') {
    return <Navigate to="/login" />;
  }

  // 3. PANTALLA DE ACCESO DENEGADO (Solo botón de Volver)
  if (status === 'unauthorized') {
    return (
      <div className="container d-flex flex-column align-items-center justify-content-center" style={{minHeight: '70vh'}}>
        <ShieldAlert size={80} className="text-danger mb-4" strokeWidth={1.5} />
        
        <h2 className="fw-bold text-dark mb-3">Acceso Restringido</h2>
        
        <div className="alert alert-warning text-center shadow-sm" style={{maxWidth: '500px'}}>
          La cuenta <strong>{currentUser?.email}</strong> no tiene permisos de administrador.
        </div>
        
        {/* ÚNICO BOTÓN: Cierra sesión y va al inicio */}
        <div className="mt-4">
          <button 
            onClick={handleExit} 
            className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2 fw-bold"
          >
            <Home size={18} /> Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // 4. Si es autorizado -> Panel
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Estructura Flex para que el Footer siempre baje */}
      <div className="d-flex flex-column min-vh-100">
        
        {/* 1. Barra Superior */}
        <Navbar /> 
        
        {/* 2. Contenido Central */}
        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Ruta PROTEGIDA */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>

        {/* 3. Pie de Página */}
        <Footer />

      </div>
    </BrowserRouter>
  );
}

export default App;