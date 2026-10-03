import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // El frontend se sirve desde la raíz del dominio (https://fxinversors.com/),
  // así que los assets se piden como /assets/... Es el valor por defecto de
  // Vite; se deja explícito para que nadie lo cambie sin querer.
  base: '/',
  plugins: [react()],
})
