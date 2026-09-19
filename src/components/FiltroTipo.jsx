import { useState } from 'react'
import { COLOR_POR_TIPO } from '../data/tipos.js'
import './FiltroTipo.css'

// Recibe la lista de tipos y cuáles están activos por props (no guarda
// nada propio salvo si el panel de chips está desplegado o no, que es pura
// presentación) y avisa cada click hacia arriba con onCambiarFiltro; es
// Universo quien decide qué significa "activar" un tipo (agregarlo/sacarlo
// del array filtroTipo).
//
// Antes los 18 chips estaban siempre visibles y ocupaban dos filas enteras
// del HUD; ahora quedan detrás de un botón para que la pantalla no se vea
// tan recargada, y solo se despliegan cuando el usuario los pide.
function FiltroTipo({ tipos, filtroActivo, onCambiarFiltro }) {
  const [desplegado, setDesplegado] = useState(false)

  return (
    <div className="filtro-tipo-contenedor">
      <button
        type="button"
        className="filtro-tipo__boton boton-pixel"
        onClick={() => setDesplegado((anterior) => !anterior)}
      >
        Filtrar por tipo{filtroActivo.length > 0 ? ` (${filtroActivo.length})` : ''} {desplegado ? '▲' : '▼'}
      </button>

      {desplegado && (
        <div className="filtro-tipo">
          {tipos.map((tipo) => {
            const activo = filtroActivo.includes(tipo)
            return (
              <button
                key={tipo}
                type="button"
                className={`filtro-tipo__chip${activo ? ' filtro-tipo__chip--activo' : ''}`}
                style={{ '--color-tipo': COLOR_POR_TIPO[tipo] }}
                onClick={() => onCambiarFiltro(tipo)}
              >
                {tipo}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FiltroTipo
