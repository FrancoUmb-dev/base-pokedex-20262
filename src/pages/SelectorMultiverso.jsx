import { useNavigate } from 'react-router-dom'
import { formatearNombreGeneracion } from '../utils/formato.js'
import { ID_UNIVERSO_GENERAL } from '../data/emblemas.js'
import { useGeneraciones, idDesdeUrlGeneracion } from '../hooks/useGeneraciones.js'
import './SelectorMultiverso.css'

// Un color distinto por nodo, en ciclo. Es solo decorativo (no tiene
// relación con los tipos de Pokémon) así que vive acá y no en data/tipos.js.
const COLORES_NODO = [
  '#F08030', '#6890F0', '#78C850', '#F8D030', '#A040A0',
  '#F85888', '#7038F8', '#B8A038', '#EE99AC', '#98D8D8',
]

// Radio fijo (en % del contenedor) al que orbitan las generaciones
// alrededor del Universo General. Es porcentaje y no píxeles para que la
// órbita se reacomode sola con el tamaño del contenedor, sin JS extra.
const RADIO_ORBITA_PCT = 38

function SelectorMultiverso() {
  // Esta pantalla es liviana a propósito: el hook solo trae { id, name } de
  // cada generación. Los Pokémon de cada una se cargan recién en Universo,
  // cuando el usuario efectivamente entra a esa galaxia.
  const { generaciones, cargando, error } = useGeneraciones()
  const navigate = useNavigate()

  // Posición orbital de cada nodo alrededor del centro: la misma idea
  // trigonométrica que usa Universo para ubicar las estrellas (ángulo +
  // radio -> x,y con cos/sin), pero acá en PORCENTAJE del contenedor en vez
  // de píxeles absolutos, así la órbita entera se reacomoda sola con el
  // tamaño de pantalla sin necesitar JS de resize.
  const anguloPorNodo = 360 / (generaciones.length || 1)

  return (
    <div className="selector-multiverso">
      <h1 className="selector-multiverso__titulo">POKÉVERSO</h1>
      <p className="selector-multiverso__subtitulo">
        Elegí una galaxia para explorarla, o el Universo General para verlas todas juntas
      </p>

      {cargando && <p className="selector-multiverso__estado">Cargando multiverso...</p>}
      {error && <p className="selector-multiverso__estado selector-multiverso__estado--error">{error}</p>}

      {!cargando && !error && (
        <div className="selector-multiverso__orbita">
          <button
            type="button"
            className="nodo-universo nodo-universo--general"
            onClick={() => navigate(`/universo/${ID_UNIVERSO_GENERAL}`)}
            title="Universo General: todos los Pokémon de todas las generaciones juntos"
          >
            <span className="nodo-universo__circulo">
              <span className="nodo-universo__espiral" aria-hidden="true" />
              <span className="nodo-universo__etiqueta">TODOS</span>
            </span>
          </button>

          {generaciones.map((generacion, indice) => {
            const id = idDesdeUrlGeneracion(generacion.url)
            const color = COLORES_NODO[indice % COLORES_NODO.length]

            // -90° para que la primera generación arranque arriba (a las 12)
            // en vez de a la derecha (a las 3), que es el 0° matemático.
            const angulo = indice * anguloPorNodo - 90
            const anguloRad = (angulo * Math.PI) / 180
            const left = 50 + RADIO_ORBITA_PCT * Math.cos(anguloRad)
            const top = 50 + RADIO_ORBITA_PCT * Math.sin(anguloRad)
            const numeroRomano = formatearNombreGeneracion(generacion.name).replace('Generación ', '')

            return (
              <button
                key={generacion.name}
                type="button"
                className="nodo-universo"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  '--color-nodo': color,
                  animationDelay: `${(indice % 5) * 0.5}s`,
                }}
                onClick={() => navigate(`/universo/${id}`)}
                title={formatearNombreGeneracion(generacion.name)}
              >
                <span className="nodo-universo__circulo">
                  <span className="nodo-universo__espiral" aria-hidden="true" />
                  <span className="nodo-universo__etiqueta">{numeroRomano}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SelectorMultiverso
