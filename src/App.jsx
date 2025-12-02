import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
// IMPORTANTE: Importamos doc y getDoc para buscar el perfil
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { ShieldAlert, LogOut, Home } from 'lucide-react';

// Páginas
import HomePage from './pages/HomePage';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import PostDetail from './pages/PostDetail';
import NotFoundPage from './pages/NotFoundPage';
import CreateProfile from './pages/CreateProfile'; // <--- NUEVA PÁGINA
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// --- GUARDIÁN INTELIGENTE ---
const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState('loading'); 
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // LISTA DE ADMINS
    const adminsAutorizados = [
      "yamithadresjulio@gmail.com",
      "xiomysofy24@gmail.com"
    ];

    const unsubscribe = onAuthStateChanged(auth, async (usuarioFirebase) => {
      if (usuarioFirebase) {
        setCurrentUser(usuarioFirebase);
        
        // 1. Verificar correo
        if (adminsAutorizados.includes(usuarioFirebase.email)) {
            
            // 2. VERIFICAR SI YA CREÓ SU PERFIL EN LA BASE DE DATOS
            const docRef = doc(db, "users", usuarioFirebase.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setStatus('authorized'); // Tiene perfil, pasa.
            } else {
                setStatus('no_profile'); // Correo bien, pero falta perfil.
            }

        } else {
          setStatus('unauthorized');
        }
      } else {
        setStatus('guest');
      }
    });

    return () => unsubscribe();
  }, []); 

  if (status === 'loading') {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;
  }

  if (status === 'guest') return <Navigate to="/login" />;

  // SI FALTA PERFIL, LO MANDAMOS A CREARLO
  if (status === 'no_profile') return <Navigate to="/create-profile" />;

  if (status === 'unauthorized') {
    return (
      <div className="container d-flex flex-column align-items-center justify-content-center" style={{minHeight: '70vh'}}>
        <ShieldAlert size={80} className="text-danger mb-4" strokeWidth={1.5} />
        <h2 className="fw-bold text-dark mb-3">Acceso Restringido</h2>
        <div className="alert alert-warning text-center shadow-sm" style={{maxWidth: '500px'}}>
          La cuenta <strong>{currentUser?.email}</strong> no tiene permisos.
        </div>
        <div className="mt-4">
            <button onClick={async () => { await signOut(auth); window.location.href = "/"; }} className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2 fw-bold">
                <Home size={18} /> Volver al Inicio
            </button>
        </div>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100">
        <Navbar /> 
        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* RUTA PARA CREAR PERFIL (Solo accesible si estás logueado pero sin perfil) */}
            <Route path="/create-profile" element={<CreateProfile />} />

            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;