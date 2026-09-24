import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Separa librerías grandes: cambian poco y el navegador las mantiene en caché entre despliegues
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\/]@?firebase[\/]storage/.test(id)) return; // solo lo usa el panel admin
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
        },
      },
    },
  },
})
