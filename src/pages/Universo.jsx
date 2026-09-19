import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import Estrella from '../components/Estrella.jsx'
import PanelDetalle from '../components/PanelDetalle.jsx'
import BarraBusqueda from '../components/BarraBusqueda.jsx'
import FiltroTipo from '../components/FiltroTipo.jsx'
import BarraLateral from '../components/BarraLateral.jsx'
import { COLOR_POR_TIPO, COLOR_DESCONOCIDO, TIPOS_ORDENADOS } from '../data/tipos.js'
import { EMBLEMA_POR_GENERACION, EMBLEMA_UNIVERSO_GENERAL, ID_UNIVERSO_GENERAL } from '../data/emblemas.js'
import { generarPuntosSilueta } from '../utils/silueta.js'
import { mapConLimite } from '../utils/concurrencia.js'
import { useGeneraciones } from '../hooks/useGeneraciones.js'
import { formatearNombreGeneracion } from '../utils/formato.js'
import './Universo.css'

// Máximo de pedidos /pokemon/{name} en vuelo al mismo tiempo (ver
// mapConLimite en utils/concurrencia.js: pedir los ~1025 Pokémon del
// Universo General de una sola tanda funciona casi siempre, pero se
// comprobó que bajo ciertas condiciones de carga empieza a fallar más de
// la mitad; en lotes de a 80 nunca se vio ese problema).
const TAMANO_LOTE_FETCH = 80

// Cuántos puntos de silueta pedimos siempre, sin importar el tamaño real del
// roster: 1600 es más que suficiente incluso para el Universo General (hoy
// suma poco más de 1000 Pokémon entre todas las generaciones). Pedir un
// número fijo evita tener que esperar a que el roster termine de cargar
// para saber "cuántos puntos hacen falta": el efecto de la silueta puede
// arrancar en paralelo con el del roster.
const CANTIDAD_PUNTOS_SILUETA = 1600

// Pseudo-aleatorio determinístico en [0,1) a partir de un número semilla.
// Lo usamos en vez de Math.random() para el jitter de las estrellas: React
// puede volver a ejecutar el cuerpo de un componente (o de un useMemo) más
// de una vez para una misma actualización (ej. StrictMode en desarrollo), y
// Math.random() dentro del render es una función "impura" que en ese caso
// podría devolver posiciones distintas en cada intento. Con la misma
// semilla (el id del pokémon) esta función siempre da el mismo resultado,
// así que el cálculo de la constelación sigue siendo puro y, de paso, cada
// Pokémon mantiene siempre el mismo jitter.
function pseudoAleatorio(semilla) {
  const x = Math.sin(semilla) * 10000
  return x - Math.floor(x)
}

// Cuánto se acerca la cámara al viajar hacia una estrella encontrada por búsqueda.
const ESCALA_ZOOM_BUSQUEDA = 1.3
const DURACION_ZOOM_BUSQUEDA = 700

// Cuántas sugerencias como máximo se muestran en el desplegable de la barra
// de búsqueda (aunque haya más coincidencias, para no tapar la pantalla).
const LIMITE_SUGERENCIAS = 8

// Decide si un Pokémon coincide con lo escrito. Unifica dos criterios en
// una sola función para que tanto el buscador por nombre como por número
// funcionen con el mismo texto, sin que el usuario tenga que elegir un
// "modo": si lo escrito (sacándole un '#' inicial, si lo tiene) son todos
// dígitos, se interpreta como número de Pokédex; si no, como parte del
// nombre. Así "25", "#25" y "pika" encuentran igual a Pikachu.
function coincideConBusqueda(pokemon, textoLimpio) {
  const comoNumero = textoLimpio.replace(/^#/, '')
  if (/^\d+$/.test(comoNumero)) {
    return String(pokemon.id).startsWith(comoNumero)
  }
  return pokemon.name.toLowerCase().includes(textoLimpio)
}

function Universo() {
  const { generacionId, pokemonId } = useParams()
  const navigate = useNavigate()

  // El Universo General ("/universo/todos") no es una generación real de la
  // PokeAPI: es un id especial que juntamos nosotros. Varias cuentas de acá
  // abajo (tamaño del lienzo, escala inicial, a qué generaciones pedirle el
  // roster) dependen de si estamos en ese modo o en uno normal.
  const esUniversoGeneral = generacionId === ID_UNIVERSO_GENERAL

  // Lienzo (y radio máximo del layout de respaldo) más grandes para el
  // Universo General: tiene ~7 veces más Pokémon que una generación
  // cualquiera, así que necesita más espacio para no verse amontonado.
  const tamanoLienzo = esUniversoGeneral ? 6500 : 3000
  const centro = tamanoLienzo / 2
  const escalaInicial = esUniversoGeneral ? 0.16 : 0.32

  // Límites de zoom relativos a la escala inicial (no números fijos), para
  // que el Universo General (lienzo más grande, escala inicial más chica)
  // respete los mismos márgenes que una generación individual: ni tan cerca
  // que se salga de foco al arrastrar un poco, ni tan lejos que la
  // constelación se vea como un punto perdido en la pantalla.
  const escalaMinima = escalaInicial * 0.5
  const escalaMaxima = escalaInicial * 8

  // Lista de generaciones para los enlaces directos de la barra lateral
  // (mismo hook que usa SelectorMultiverso, ver hooks/useGeneraciones.js).
  const { generaciones } = useGeneraciones()
  const [sidebarAbierta, setSidebarAbierta] = useState(false)

  const [roster, setRoster] = useState([])
  const [nombreGeneracion, setNombreGeneracion] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState([]) // tipos activos; [] = sin filtro (se ven todos)
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [siluetaPool, setSiluetaPool] = useState(null)

  // Referencia a la API de react-zoom-pan-pinch (zoomToElement, etc.) para
  // poder mover la cámara "a mano" cuando el buscador encuentra un Pokémon.
  const transformRef = useRef(null)

  // Dependencia [generacionId]: cada vez que cambia el segmento de la URL
  // (el usuario entra a otra generación, o al Universo General) hay que
  // descartar el roster viejo y traer uno nuevo. Si dejáramos el array
  // vacío, nunca se recargaría al navegar entre universos.
  useEffect(() => {
    let cancelado = false // corta carreras: si el usuario cambia de generación
    // antes de que termine este fetch, ignoramos la respuesta vieja.

    // Trae { name, pokemon_species } de UNA generación puntual.
    async function obtenerGeneracion(id) {
      const res = await fetch(`https://pokeapi.co/api/v2/generation/${id}`)
      if (!res.ok) throw new Error('Generación no encontrada')
      return res.json()
    }

    // Universo General: primero pedimos la lista completa de generaciones y
    // después el detalle de cada una (Promise.all), para juntar todas sus
    // pokemon_species en un solo array. Es la misma idea que pedir una sola
    // generación, solo que agregada.
    async function obtenerTodasLasEspecies() {
      const resLista = await fetch('https://pokeapi.co/api/v2/generation')
      if (!resLista.ok) throw new Error('No se pudo listar las generaciones')
      const { results } = await resLista.json()
      const generaciones = await Promise.all(results.map((g) => fetch(g.url).then((r) => r.json())))
      return generaciones.flatMap((g) => g.pokemon_species)
    }

    async function cargarRoster() {
      setCargando(true)
      setError(null)
      setFiltroTipo([])
      setTerminoBusqueda('')

      try {
        let especies
        let nombreParaTitulo
        if (esUniversoGeneral) {
          especies = await obtenerTodasLasEspecies()
          nombreParaTitulo = ID_UNIVERSO_GENERAL
        } else {
          const datosGeneracion = await obtenerGeneracion(generacionId)
          especies = datosGeneracion.pokemon_species
          nombreParaTitulo = datosGeneracion.name
        }

        // Sigue siendo "un GET por especie con Promise.all", solo que en
        // lotes de TAMANO_LOTE_FETCH en vez de una tanda gigante con las
        // ~1025 especies del Universo General de una sola vez (ver
        // mapConLimite en utils/concurrencia.js para el motivo).
        const detalles = await mapConLimite(especies, TAMANO_LOTE_FETCH, async (especie) => {
          try {
            const resPokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${especie.name}`)

            // Decisión consciente, no un bug: algunas especies (formas
            // alternas raras) no tienen un recurso /pokemon/ con exactamente
            // su mismo nombre. En vez de romper la carga de toda la
            // generación por esos casos puntuales, los omitimos en silencio.
            if (!resPokemon.ok) return null

            const datos = await resPokemon.json()
            return {
              id: datos.id,
              name: datos.name,
              types: datos.types,
              tipoPrimario: datos.types[0].type.name,
              stats: datos.stats,
              sprite: datos.sprites?.other?.['official-artwork']?.front_default ?? null,
              cry: datos.cries?.latest ?? null,
            }
          } catch {
            return null
          }
        })

        if (!cancelado) {
          // En el Universo General puede haber especies repetidas entre
          // generaciones (formas regionales listadas más de una vez); nos
          // quedamos con un solo Pokémon por id para no duplicar estrellas.
          const vistos = new Set()
          const rosterSinDuplicados = detalles.filter((pokemon) => {
            if (pokemon === null || vistos.has(pokemon.id)) return false
            vistos.add(pokemon.id)
            return true
          })
          setRoster(rosterSinDuplicados)
          setNombreGeneracion(nombreParaTitulo)
        }
      } catch {
        if (!cancelado) setError('No se pudo cargar este universo. Intenta de nuevo.')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargarRoster()
    return () => {
      cancelado = true
    }
  }, [generacionId, esUniversoGeneral])

  // Efecto separado del de arriba (y con la misma dependencia) porque
  // sincroniza con un sistema distinto: no trae datos de Pokémon, sino que
  // procesa la imagen del Pokémon emblema para convertir su silueta en
  // puntos (ver src/utils/silueta.js). Corre en paralelo al fetch del
  // roster, no en cadena con él, así que no lo hacemos esperar.
  useEffect(() => {
    let cancelado = false
    const idEmblema = esUniversoGeneral ? EMBLEMA_UNIVERSO_GENERAL : EMBLEMA_POR_GENERACION[generacionId]

    async function cargarSilueta() {
      // Mientras se genera la nueva (o si no hay emblema para este id),
      // usamos el layout de respaldo por sectores.
      setSiluetaPool(null)
      if (!idEmblema) return

      try {
        const resultado = await generarPuntosSilueta(idEmblema, CANTIDAD_PUNTOS_SILUETA)
        if (!cancelado) setSiluetaPool(resultado)
      } catch {
        // Si falla (red, o el navegador bloquea el canvas por CORS), nos
        // quedamos con el layout de respaldo en vez de romper la pantalla.
        if (!cancelado) setSiluetaPool(null)
      }
    }

    cargarSilueta()
    return () => {
      cancelado = true
    }
  }, [generacionId, esUniversoGeneral])

  // useMemo en vez de calcular esto en cada render: construir "estrellas"
  // recorre todo el roster y hace bastantes cuentas por cada Pokémon. Si no
  // memorizáramos el resultado, cada re-render de Universo (por ejemplo, al
  // escribir en el buscador o tocar un filtro de tipo) repetiría todo ese
  // trabajo de nuevo sin necesidad. Se recalcula cuando cambia el roster, la
  // silueta (llega un instante después que el roster) o el tamaño del lienzo.
  const estrellas = useMemo(() => {
    const sumaStatsDe = (pokemon) => pokemon.stats.reduce((total, s) => total + s.base_stat, 0)
    // Tamaño proporcional a la suma de stats base. 720 es aprox. el total de
    // un legendario tope de línea; 15 es solo la constante de escala elegida
    // para que el rango de tamaños se vea bien en pantalla.
    const tamanoDe = (sumaStats) => Math.min(48, Math.max(16, sumaStats / 15))

    // Camino principal: ubicar cada estrella sobre un punto de la silueta
    // del Pokémon emblema de esta generación (ver silueta.js). El resultado
    // es que, alejando la cámara, el conjunto de estrellas se lee como la
    // forma de ese Pokémon — una "constelación" real, no una lista de
    // puntos al azar.
    if (siluetaPool) {
      const { puntos, resolucion } = siluetaPool
      // La silueta ocupa el 70% del lienzo; el resto queda de margen para
      // que el pan/zoom tenga "aire" alrededor de la figura.
      const escala = (tamanoLienzo * 0.7) / resolucion
      const desplazamiento = (tamanoLienzo - resolucion * escala) / 2

      return roster.map((pokemon, indice) => {
        // Reciclamos los puntos si el roster tiene más Pokémon que puntos
        // únicos generó la silueta (no pasa con CANTIDAD_PUNTOS_SILUETA en
        // la práctica, pero es una salvaguarda barata).
        const punto = puntos[indice % puntos.length]

        // Jitter leve, en píxeles de PANTALLA (ya escalados): separa
        // levemente estrellas que cayeron en el mismo píxel de la silueta,
        // sin que se note como un desplazamiento del dibujo general.
        const jitterX = (pseudoAleatorio(pokemon.id) - 0.5) * escala * 2.5
        const jitterY = (pseudoAleatorio(pokemon.id * 7.13) - 0.5) * escala * 2.5

        const x = desplazamiento + punto.x * escala + jitterX
        const y = desplazamiento + punto.y * escala + jitterY

        return { ...pokemon, x, y, tamano: tamanoDe(sumaStatsDe(pokemon)) }
      })
    }

    // Camino de respaldo (mientras la silueta todavía está generándose, o si
    // falló): el layout original por sectores de tipo. Agrupa por TIPO
    // PRIMARIO repartiendo los 18 tipos en sectores angulares fijos
    // (360°/18 = 20° cada uno) y, dentro de cada sector, coloca los Pokémon
    // a radio creciente desde el centro.
    const ANCHO_SECTOR = 360 / TIPOS_ORDENADOS.length
    const RADIO_BASE = 110
    const RADIO_MAXIMO = tamanoLienzo * 0.45 // deja margen dentro del lienzo

    const totalPorTipo = {}
    roster.forEach((pokemon) => {
      totalPorTipo[pokemon.tipoPrimario] = (totalPorTipo[pokemon.tipoPrimario] ?? 0) + 1
    })

    const contadorPorTipo = {}

    return roster.map((pokemon) => {
      const indiceTipo = TIPOS_ORDENADOS.indexOf(pokemon.tipoPrimario)
      const anguloBaseSector = (indiceTipo >= 0 ? indiceTipo : 0) * ANCHO_SECTOR

      const indiceEnTipo = contadorPorTipo[pokemon.tipoPrimario] ?? 0
      contadorPorTipo[pokemon.tipoPrimario] = indiceEnTipo + 1

      const totalEnTipo = totalPorTipo[pokemon.tipoPrimario] ?? 1
      const incrementoRadio = (RADIO_MAXIMO - RADIO_BASE) / totalEnTipo

      // Jitter leve: mueve un poco el ángulo (sin salirse del sector propio)
      // y el radio, para que los Pokémon de un mismo tipo no queden en una
      // línea perfectamente recta. Se usan dos semillas distintas (basadas
      // en el id) para que el jitter del ángulo y el del radio no queden
      // correlacionados entre sí.
      const jitterAngulo = (pseudoAleatorio(pokemon.id) - 0.5) * (ANCHO_SECTOR - 4)
      const jitterRadio = (pseudoAleatorio(pokemon.id * 7.13) - 0.5) * 20

      const angulo = anguloBaseSector + ANCHO_SECTOR / 2 + jitterAngulo
      const anguloRad = (angulo * Math.PI) / 180
      const radio = RADIO_BASE + indiceEnTipo * incrementoRadio + jitterRadio

      // Fórmula de posicionamiento polar -> cartesiano: cada estrella se
      // ubica a `radio` píxeles del centro del lienzo, en la dirección que
      // marca `angulo`. cos() da el desplazamiento horizontal y sin() el
      // vertical; por eso alcanza con estas dos cuentas para convertir
      // (ángulo, radio) en un punto (x, y) del lienzo.
      const x = centro + radio * Math.cos(anguloRad)
      const y = centro + radio * Math.sin(anguloRad)

      return { ...pokemon, x, y, tamano: tamanoDe(sumaStatsDe(pokemon)) }
    })
  }, [roster, siluetaPool, tamanoLienzo, centro])

  // Busca dentro del roster ya cargado (nunca fuera del universo activo),
  // devolviendo TODAS las coincidencias (no solo la primera): las usamos
  // tanto para el auto-viaje de la cámara como para las sugerencias del
  // desplegable de BarraBusqueda.
  function buscarCoincidencias(texto) {
    const limpio = texto.trim().toLowerCase()
    if (!limpio) return []
    return estrellas.filter((pokemon) => coincideConBusqueda(pokemon, limpio))
  }

  const coincidencias = buscarCoincidencias(terminoBusqueda)
  const pokemonEncontrado = coincidencias[0] ?? null
  const sugerencias = coincidencias.slice(0, LIMITE_SUGERENCIAS)

  // Centra/zoomea la cámara sobre la estrella de `pokemon` y navega a su
  // panel de detalle (si no es ya el que está abierto). La comparten el
  // auto-viaje al escribir y el clic sobre una sugerencia del desplegable.
  function viajarHacia(pokemon) {
    if (String(pokemon.id) === pokemonId) return
    navigate(`/universo/${generacionId}/pokemon/${pokemon.id}`)
    transformRef.current?.zoomToElement(`estrella-${pokemon.id}`, ESCALA_ZOOM_BUSQUEDA, DURACION_ZOOM_BUSQUEDA)
  }

  // Este manejador reacciona a una acción puntual del usuario (escribir en
  // el buscador), no a una sincronización derivada del render: por eso es
  // una función normal y no un useEffect.
  function manejarBusqueda(texto) {
    setTerminoBusqueda(texto)
    const [primero] = buscarCoincidencias(texto)
    if (primero) viajarHacia(primero)
  }

  // Clic directo sobre una de las sugerencias del desplegable: viaja a ESE
  // Pokémon en particular, sin importar si es o no el primer resultado.
  function manejarSeleccionSugerencia(pokemon) {
    setTerminoBusqueda(pokemon.name)
    viajarHacia(pokemon)
  }

  function alternarTipo(tipo) {
    setFiltroTipo((anterior) =>
      anterior.includes(tipo) ? anterior.filter((t) => t !== tipo) : [...anterior, tipo]
    )
  }

  const pokemonSeleccionado = pokemonId
    ? estrellas.find((pokemon) => String(pokemon.id) === pokemonId) ?? null
    : null

  if (cargando) {
    return (
      <div className="universo universo--cargando">
        <div className="pokebola-loader" />
        <p className="universo__texto-carga">Cargando universo...</p>
        {esUniversoGeneral && (
          <p className="universo__texto-carga universo__texto-carga--nota">
            El Universo General junta todos los Pokémon de todas las generaciones: puede tardar
            bastante más que una galaxia individual.
          </p>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="universo universo--cargando">
        <p className="universo__texto-carga universo__texto-carga--error">{error}</p>
        <button type="button" className="boton-pixel" onClick={() => navigate('/')}>
          Volver al multiverso
        </button>
      </div>
    )
  }

  return (
    <div className="universo">
      <BarraLateral
        generaciones={generaciones}
        generacionActivaId={generacionId}
        abierta={sidebarAbierta}
        onCerrar={() => setSidebarAbierta(false)}
      />

      <header className="universo__hud">
        <div className="universo__hud-fila">
          <button
            type="button"
            className="boton-pixel universo__boton-menu"
            onClick={() => setSidebarAbierta(true)}
            aria-label="Abrir menú de navegación entre universos"
          >
            ☰
          </button>
          <h1 className="universo__titulo">{formatearNombreGeneracion(nombreGeneracion)}</h1>
        </div>

        <BarraBusqueda
          onBuscar={manejarBusqueda}
          onSeleccionar={manejarSeleccionSugerencia}
          sugerencias={sugerencias}
          placeholder={
            esUniversoGeneral
              ? 'Buscar en todo el universo... (nombre o #número)'
              : 'Buscar en esta generación... (nombre o #número)'
          }
        />

        <FiltroTipo tipos={TIPOS_ORDENADOS} filtroActivo={filtroTipo} onCambiarFiltro={alternarTipo} />
      </header>

      <TransformWrapper
        ref={transformRef}
        initialScale={escalaInicial}
        minScale={escalaMinima}
        maxScale={escalaMaxima}
        // limitToBounds: antes se podía arrastrar la constelación fuera de
        // la pantalla y quedar mirando el vacío sin saber cómo volver. Con
        // esto, react-zoom-pan-pinch no deja panear más allá de los bordes
        // del lienzo, así que la constelación completa siempre queda a
        // rastra de un arrastre de vuelta.
        limitToBounds
        // Si el zoom-out (limitado por minScale) deja el lienzo más chico
        // que la pantalla, esto lo recentra en vez de dejarlo pegado a una
        // esquina.
        centerZoomedOut
        centerOnInit
      >
        {/* wrapperStyle (inline) en vez de wrapperClass: react-zoom-pan-pinch
            inyecta su propio CSS con "width/height: fit-content" en una
            hoja de estilos que carga después de la nuestra, y con la misma
            especificidad (una sola clase) esa regla termina ganando. Un
            estilo inline siempre le gana a cualquier regla de hoja de
            estilos sin importar el orden de carga, así que es la forma
            confiable de asegurar que el visor ocupe toda la pantalla. */}
        <TransformComponent wrapperStyle={{ width: '100%', height: '100dvh' }}>
          <div className="constelacion" style={{ width: tamanoLienzo, height: tamanoLienzo }}>
            {estrellas.map((pokemon) => {
              const activaPorFiltro = filtroTipo.length === 0 || filtroTipo.includes(pokemon.tipoPrimario)
              return (
                <Estrella
                  key={pokemon.id}
                  id={pokemon.id}
                  nombre={pokemon.name}
                  x={pokemon.x}
                  y={pokemon.y}
                  color={COLOR_POR_TIPO[pokemon.tipoPrimario] ?? COLOR_DESCONOCIDO}
                  tamano={pokemon.tamano}
                  opacidad={activaPorFiltro ? 1 : 0.15}
                  esEncontrada={pokemonEncontrado?.id === pokemon.id}
                  onClick={() => navigate(`/universo/${generacionId}/pokemon/${pokemon.id}`)}
                />
              )
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {pokemonSeleccionado && (
        <PanelDetalle
          key={pokemonSeleccionado.id}
          pokemon={pokemonSeleccionado}
          onCerrar={() => navigate(`/universo/${generacionId}`)}
        />
      )}
    </div>
  )
}

export default Universo
