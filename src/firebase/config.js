// Importamos las funciones necesarias de Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Configuración usando las variables de entorno (Seguridad)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// 1. Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 2. Exportar las herramientas que usaremos en la app
export const db = getFirestore(app);   // Base de Datos
export const auth = getAuth(app);      // Login de Admin
export const storage = getStorage(app); // Fotos