import { useEffect, useState } from 'react'
import { COLOR_POR_TIPO, COLOR_DESCONOCIDO } from '../data/tipos.js'
import { capitalizarNombre, formatearNumero } from '../utils/formato.js'
import './PanelDetalle.css'

// Nombres cortos "estilo competitivo" para las barras de stats, más legibles
// que los que devuelve la API tal cual (ej. "special-attack").
const ETIQUETA_STAT = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SPA',
  'special-defense': 'SPD',
  speed: 'SPE',
}

// El stat base máximo posible en la PokeAPI es 255; lo usamos para expresar
// cada barra como porcentaje de ese tope.
const STAT_MAXIMO = 255

function PanelDetalle({ pokemon, onCerrar }) {
  // Único state propio del componente: controla si está en la animación de
  // entrada o de salida. No guarda nada del pokémon en sí (eso llega por
  // props), solo la fase de la transición visual.
  //
  // Si el usuario salta de un pokémon a otro (ej. busca uno nuevo mientras
  // el panel ya está abierto) este componente necesita "olvidarse" de que
  // venía saliendo y arrancar de nuevo en modo entrada. En vez de resetear
  // "saliendo" a mano con un useEffect (dispararía un render extra), le
  // pedimos a Universo que renderice este panel con key={pokemon.id}: así
  // React directamente desmonta el componente viejo y monta uno nuevo ante
  // cada pokémon distinto, y useState(false) vuelve a arrancar en false solo.
  const [saliendo, setSaliendo] = useState(false)

  // Único useEffect del componente: reproduce el grito del pokémon
  // seleccionado. Depende de pokemon.id (y pokemon.cry), tal como pide la
  // consigna, para no reproducirlo de nuevo si el panel se re-renderiza por
  // otro motivo que no sea un cambio de pokémon (ej. cambia el filtro de
  // tipo en el fondo, lo que re-renderiza Universo pero no este panel).
  useEffect(() => {
    if (!pokemon?.cry) return

    const audio = new Audio(pokemon.cry)
    audio.volume = 0.4
    audio.play().catch(() => {
      // Algunos navegadores bloquean el autoplay de audio sin gesto previo
      // del usuario; si eso pasa, simplemente no suena (no rompe la UI).
    })

    return () => {
      audio.pause()
    }
  }, [pokemon?.id, pokemon?.cry])

  // Espera a que termine la animación CSS de salida (0.25s, ver
  // ".panel-detalle--saliendo" en PanelDetalle.css) antes de avisarle a
  // Universo que cierre el panel de verdad, lo que dispara la navegación de
  // vuelta a la galaxia. Si navegáramos de inmediato, React desmontaría este
  // componente a mitad del fade-out y el usuario nunca llegaría a verlo.
  function manejarCierre() {
    setSaliendo(true)
    setTimeout(onCerrar, 250)
  }

  const sumaStats = pokemon.stats.reduce((total, s) => total + s.base_stat, 0)

  return (
    <div className="panel-overlay" onClick={manejarCierre}>
      <div
        className={`panel-detalle ${saliendo ? 'panel-detalle--saliendo' : 'panel-detalle--entrando'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="panel-detalle__esquina panel-detalle__esquina--tl" />
        <span className="panel-detalle__esquina panel-detalle__esquina--tr" />
        <span className="panel-detalle__esquina panel-detalle__esquina--bl" />
        <span className="panel-detalle__esquina panel-detalle__esquina--br" />

        <button type="button" className="panel-detalle__cerrar" onClick={manejarCierre} aria-label="Cerrar">
          ✕
        </button>

        <p className="panel-detalle__numero">{formatearNumero(pokemon.id)}</p>

        {pokemon.sprite && (
          <img className="panel-detalle__sprite" src={pokemon.sprite} alt={pokemon.name} />
        )}

        <h2 className="panel-detalle__nombre">{capitalizarNombre(pokemon.name)}</h2>

        <div className="panel-detalle__tipos">
          {pokemon.types.map(({ type }) => (
            <span
              key={type.name}
              className="panel-detalle__chip-tipo"
              style={{ backgroundColor: COLOR_POR_TIPO[type.name] ?? COLOR_DESCONOCIDO }}
            >
              {type.name}
            </span>
          ))}
        </div>

        <div className="panel-detalle__stats">
          {pokemon.stats.map((stat) => (
            <div className="panel-detalle__stat-fila" key={stat.stat.name}>
              <span className="panel-detalle__stat-etiqueta">
                {ETIQUETA_STAT[stat.stat.name] ?? stat.stat.name}
              </span>
              <div className="panel-detalle__stat-barra-fondo">
                <div
                  className="panel-detalle__stat-barra-relleno"
                  style={{ width: `${Math.min(100, (stat.base_stat / STAT_MAXIMO) * 100)}%` }}
                />
              </div>
              <span className="panel-detalle__stat-valor">{stat.base_stat}</span>
            </div>
          ))}
          <p className="panel-detalle__stat-total">Total: {sumaStats}</p>
        </div>
      </div>
    </div>
  )
}

export default PanelDetalle
