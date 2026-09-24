import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import PostDetail from './pages/PostDetail';
import NotFoundPage from './pages/NotFoundPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import PautaModal from './components/PautaModal';

// Carga diferida: el panel y el editor solo se descargan cuando un admin los abre
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const CreateProfile = lazy(() => import('./pages/CreateProfile'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Estas rutas tienen su propio diseño, sin la cabecera ni el pie del sitio público
const RUTAS_SIN_LAYOUT = ['/admin', '/login', '/create-profile'];

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
    const salir = async (destino) => { await signOut(auth); window.location.href = destino; };
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'var(--navy)' }}>
        <div className="bg-white rounded-4 shadow p-4 p-md-5 text-center" style={{ maxWidth: 440 }}>
          <span className="d-inline-flex align-items-center justify-content-center rounded-4 mb-3" style={{ width: 56, height: 56, background: '#fef2f2', color: '#dc2626' }}>
            <ShieldAlert size={28} />
          </span>
          <h1 className="h4 fw-bold mb-2">Acceso restringido</h1>
          <p className="text-secondary mb-4">
            La cuenta <strong className="text-dark">{currentUser?.email}</strong> no tiene permisos de administración.
          </p>
          <div className="d-flex flex-column gap-2">
            <button onClick={() => salir('/login')} className="btn btn-primary rounded-pill fw-semibold">Usar otra cuenta</button>
            <button onClick={() => salir('/')} className="btn btn-light border rounded-pill d-inline-flex align-items-center justify-content-center gap-2">
              <Home size={17} /> Volver al sitio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

function Layout({ children }) {
  const { pathname } = useLocation();
  const sinLayout = RUTAS_SIN_LAYOUT.some((r) => pathname.startsWith(r));
  if (sinLayout) return children;
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="flex-grow-1">{children}</div>
      <Footer />
      <PautaModal />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
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
      </Layout>
    </BrowserRouter>
  );
}

export default App;
