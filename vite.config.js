import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// "base" define desde qué subruta se sirven los archivos generados. Por
// defecto es "/" (funciona para "npm run dev", Vercel, o cualquier hosting
// que sirva la app desde la raíz del dominio). GitHub Pages, en cambio,
// publica los "project sites" bajo "usuario.github.io/nombre-del-repo/", así
// que el build para GitHub Pages (script "build:gh-pages" en package.json)
// necesita ese prefijo para que las rutas de los archivos JS/CSS generados
// no apunten por error a la raíz del dominio.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'gh-pages' ? '/base-pokedex-20262/' : '/',
}))
