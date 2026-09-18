import { useState } from 'react'
import { capitalizarNombre, formatearNumero } from '../utils/formato.js'
import './BarraBusqueda.css'

// Mantiene el texto del input y si el desplegable debe verse (state local,
// es el único dueño de esos dos valores). No decide QUÉ Pokémon coinciden
// con lo escrito: esa lógica vive en Universo (la única que tiene el
// roster), que le manda ya armada la lista de `sugerencias` por props.
function BarraBusqueda({ onBuscar, onSeleccionar, sugerencias, placeholder = 'Buscar en esta generación...' }) {
  const [valor, setValor] = useState('')
  // Separado de "sugerencias.length > 0" a propósito: después de elegir una
  // sugerencia (o de que el input pierda el foco) queremos poder ocultar el
  // desplegable aunque la lista de sugerencias siga teniendo elementos.
  const [mostrarLista, setMostrarLista] = useState(false)

  function manejarCambio(evento) {
    const nuevoValor = evento.target.value
    setValor(nuevoValor)
    setMostrarLista(true)
    onBuscar(nuevoValor)
  }

  function manejarClicSugerencia(pokemon) {
    setValor(capitalizarNombre(pokemon.name))
    setMostrarLista(false)
    onSeleccionar(pokemon)
  }

  const hayListaVisible = mostrarLista && sugerencias.length > 0

  return (
    <div className="barra-busqueda-contenedor">
      <input
        type="text"
        className="barra-busqueda"
        placeholder={placeholder}
        value={valor}
        onChange={manejarCambio}
        onFocus={() => setMostrarLista(true)}
        onBlur={() => setMostrarLista(false)}
      />

      {hayListaVisible && (
        <ul className="barra-busqueda__sugerencias">
          {sugerencias.map((pokemon) => (
            <li key={pokemon.id}>
              <button
                type="button"
                className="barra-busqueda__sugerencia"
                // onMouseDown (no onClick) + preventDefault: el mousedown se
                // dispara ANTES que el onBlur del input de arriba. Sin esto,
                // el input perdería el foco y ocultaría la lista justo antes
                // de que el click llegue a registrarse.
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => manejarClicSugerencia(pokemon)}
              >
                <span className="barra-busqueda__sugerencia-numero">{formatearNumero(pokemon.id)}</span>
                <span className="barra-busqueda__sugerencia-nombre">{capitalizarNombre(pokemon.name)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BarraBusqueda
