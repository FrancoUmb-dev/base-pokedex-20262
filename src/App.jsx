import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SelectorMultiverso from './pages/SelectorMultiverso.jsx'
import Universo from './pages/Universo.jsx'
import FondoEspacial from './components/FondoEspacial.jsx'

function App() {
  return (
    // basename: en GitHub Pages la app vive bajo "/base-pokedex-20262/" en
    // vez de la raíz del dominio. import.meta.env.BASE_URL ya trae ese
    // mismo prefijo (lo define "base" en vite.config.js), así que
    // reutilizarlo acá evita escribir el nombre del repo dos veces y que
    // se desincronicen. En local o en Vercel BASE_URL es "/", así que esto
    // no cambia nada ahí.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* Se monta una sola vez acá arriba, fuera de <Routes>, para que las
          nebulosas/galaxias de fondo no se reinicien (ni se note el cambio)
          al navegar entre el selector y un universo. */}
      <FondoEspacial />
      <Routes>
        <Route path="/" element={<SelectorMultiverso />} />

        {/* Las dos rutas de abajo renderizan el MISMO elemento <Universo />.
            Esto es a propósito: como React reconcilia por tipo de componente
            y no por la ruta que lo generó, al navegar de una a otra React NO
            desmonta Universo (mismo lugar del árbol, mismo tipo). Así el
            roster ya cargado y la posición del pan/zoom se conservan cuando
            se abre o cierra el panel de detalle. Universo lee :pokemonId con
            useParams() para decidir si ese panel debe mostrarse. */}
        <Route path="/universo/:generacionId" element={<Universo />} />
        <Route path="/universo/:generacionId/pokemon/:pokemonId" element={<Universo />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
