import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for GitHub Pages
  build: {
    outDir: 'docs', // Output to docs/ for easy deployment
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Three.js + Drei is naturally large (~800kb+)
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor_react': ['react', 'react-dom'],
          'vendor_three': ['three', '@react-three/fiber'],
          'vendor_extras': ['@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
          'vendor_ui': ['leva']
        }
      }
    }
  }
})
