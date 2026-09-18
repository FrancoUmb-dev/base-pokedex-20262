import { useNavigate } from 'react-router-dom'
import { idDesdeUrlGeneracion } from '../hooks/useGeneraciones.js'
import { ID_UNIVERSO_GENERAL } from '../data/emblemas.js'
import { formatearNombreGeneracion } from '../utils/formato.js'
import './BarraLateral.css'

// Navegación entre universos, separada del HUD superior (que antes tenía
// que compartir espacio con el botón de volver y el título): acá vive el
// botón para volver al selector Y la lista para saltar directo a cualquier
// otra generación (o al Universo General) sin pasar primero por "/".
//
// No tiene state propio: `abierta` y su callback de cierre los controla
// Universo, igual que hace con el desplegable de tipos, para que sea ese
// componente el único que sabe qué partes del HUD están abiertas.
function BarraLateral({ generaciones, generacionActivaId, abierta, onCerrar }) {
  const navigate = useNavigate()

  function irA(id) {
    navigate(`/universo/${id}`)
    onCerrar()
  }

  return (
    <>
      {abierta && <div className="barra-lateral__overlay" onClick={onCerrar} />}

      <aside className={`barra-lateral ${abierta ? 'barra-lateral--abierta' : ''}`}>
        <button type="button" className="barra-lateral__inicio boton-pixel" onClick={() => navigate('/')}>
          ← Multiverso
        </button>

        <p className="barra-lateral__subtitulo">Ir directo a...</p>

        <nav className="barra-lateral__lista">
          <button
            type="button"
            className={`barra-lateral__item${generacionActivaId === ID_UNIVERSO_GENERAL ? ' barra-lateral__item--activo' : ''}`}
            onClick={() => irA(ID_UNIVERSO_GENERAL)}
          >
            Universo General
          </button>

          {generaciones.map((generacion) => {
            const id = idDesdeUrlGeneracion(generacion.url)
            return (
              <button
                type="button"
                key={generacion.name}
                className={`barra-lateral__item${generacionActivaId === id ? ' barra-lateral__item--activo' : ''}`}
                onClick={() => irA(id)}
              >
                {formatearNombreGeneracion(generacion.name)}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default BarraLateral
