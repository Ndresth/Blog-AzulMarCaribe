import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
// IMPORTANTE: Importamos doc y getDoc para buscar el perfil
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { ShieldAlert, Home } from 'lucide-react';
import { isAdminEmail } from './config/site';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';

// Páginas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PostDetail from './pages/PostDetail';
import NotFoundPage from './pages/NotFoundPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Carga diferida: el panel y el editor solo se descargan cuando un admin los abre
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const CreateProfile = lazy(() => import('./pages/CreateProfile'));

const Spinner = () => (
  <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>
);

// --- GUARDIÁN INTELIGENTE ---
// requireProfile=false se usa en /create-profile: solo exige ser admin
const ProtectedRoute = ({ children, requireProfile = true }) => {
  const [status, setStatus] = useState('loading'); 
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuarioFirebase) => {
      if (usuarioFirebase) {
        setCurrentUser(usuarioFirebase);
        
        if (isAdminEmail(usuarioFirebase.email)) {
            if (!requireProfile) {
                setStatus('authorized');
                return;
            }
            try {
                // Buscamos si tiene perfil creado
                const docRef = doc(db, "users", usuarioFirebase.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setStatus('authorized'); // Tiene perfil, pasa.
                } else {
                    // Si no existe, o si hubo error antes, lo mandamos a crear
                    setStatus('no_profile'); 
                }
            } catch (error) {
                console.error("Error verificando perfil:", error);
                // En caso de error (como permisos), asumimos que falta perfil para no bloquear
                setStatus('no_profile');
            }

        } else {
          setStatus('unauthorized');
        }
      } else {
        setStatus('guest');
      }
    });

    return () => unsubscribe();
  }, [requireProfile]);

  if (status === 'loading') return <Spinner />;

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
      <ScrollToTop />
      <div className="d-flex flex-column min-vh-100">
        <Navbar /> 
        <div className="flex-grow-1">
          <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
            {/* RUTA PARA CREAR PERFIL */}
            <Route path="/create-profile" element={
              <ProtectedRoute requireProfile={false}>
                <CreateProfile />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;