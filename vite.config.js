import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts") || id.includes("node_modules/victory")) return "recharts";
          if (id.includes("node_modules/leaflet") || id.includes("node_modules/react-leaflet")) return "leaflet";
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "vendor";
        }
      }
    }
  }
})
