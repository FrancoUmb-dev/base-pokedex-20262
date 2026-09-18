// Convierte la silueta de un Pokémon "emblema" en un conjunto de puntos
// (x, y), muestreando el canal alfa de su sprite oficial sobre un <canvas>
// oculto. Universo.jsx reparte las estrellas de la generación sobre esos
// puntos en vez de en sectores por tipo, así que la constelación completa
// termina "leyéndose" como la forma de ese Pokémon — igual que las
// constelaciones reales, que son solo estrellas dispersas a las que se les
// ve una figura.

// Resolución (en px) del canvas de trabajo. No es el tamaño final en
// pantalla: es solo la grilla sobre la que "leemos" qué píxeles son parte
// del dibujo. 200px alcanza de sobra para las ~1000 estrellas del Universo
// General y sigue siendo rápido de procesar.
const RESOLUCION = 200

// Debajo de este valor de alfa (0-255) consideramos el píxel transparente.
// No usamos 0 exacto porque el borde de un PNG puede traer píxeles
// semitransparentes por antialiasing.
const UMBRAL_ALFA = 20

export function urlArteOficial(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

function cargarImagen(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Sin este flag la imagen se dibuja igual en el canvas, pero lo deja
    // "contaminado": getImageData tira SecurityError aunque el servidor sí
    // permita CORS (probado: raw.githubusercontent.com sí lo permite).
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${url}`))
    img.src = url
  })
}

// Mismo truco que pseudoAleatorio en Universo.jsx (determinístico, sin
// Math.random) para poder mezclar los puntos de forma reproducible.
function pseudoAleatorio(semilla) {
  const x = Math.sin(semilla) * 10000
  return x - Math.floor(x)
}

function mezclarDeterministico(puntos) {
  return puntos
    .map((punto, indice) => ({
      punto,
      orden: pseudoAleatorio(indice * 12.9898 + punto.x * 78.233 + punto.y * 37.719),
    }))
    .sort((a, b) => a.orden - b.orden)
    .map(({ punto }) => punto)
}

// Devuelve { puntos, resolucion }, con exactamente `cantidad` puntos
// {x, y} en el rango [0, resolucion). Si la silueta tiene menos píxeles
// utilizables que `cantidad`, se reciclan (Universo.jsx les suma jitter
// después, así dos estrellas que caen en el mismo píxel no quedan
// perfectamente superpuestas).
export async function generarPuntosSilueta(idPokemon, cantidad) {
  const imagen = await cargarImagen(urlArteOficial(idPokemon))

  const canvas = document.createElement('canvas')
  canvas.width = RESOLUCION
  canvas.height = RESOLUCION
  const ctx = canvas.getContext('2d')
  ctx.drawImage(imagen, 0, 0, RESOLUCION, RESOLUCION)
  const { data } = ctx.getImageData(0, 0, RESOLUCION, RESOLUCION)

  const alfaEn = (x, y) => {
    if (x < 0 || y < 0 || x >= RESOLUCION || y >= RESOLUCION) return 0
    return data[(y * RESOLUCION + x) * 4 + 3]
  }

  // Separamos el BORDE de la silueta (píxeles opacos con al menos un vecino
  // transparente) del INTERIOR, y priorizamos el borde al armar el pool de
  // puntos. Si mezcláramos todo junto, partes finas como orejas, cola o
  // alas (pocos píxeles) quedarían opacadas por el cuerpo (muchos píxeles) y
  // la silueta resultante se leería como un blob sin forma reconocible.
  const puntosBorde = []
  const puntosInternos = []
  for (let y = 0; y < RESOLUCION; y++) {
    for (let x = 0; x < RESOLUCION; x++) {
      if (alfaEn(x, y) <= UMBRAL_ALFA) continue
      const esBorde =
        alfaEn(x - 1, y) <= UMBRAL_ALFA ||
        alfaEn(x + 1, y) <= UMBRAL_ALFA ||
        alfaEn(x, y - 1) <= UMBRAL_ALFA ||
        alfaEn(x, y + 1) <= UMBRAL_ALFA
      ;(esBorde ? puntosBorde : puntosInternos).push({ x, y })
    }
  }

  if (puntosBorde.length === 0 && puntosInternos.length === 0) {
    throw new Error('La silueta no tiene píxeles opacos')
  }

  const pool = [...mezclarDeterministico(puntosBorde), ...mezclarDeterministico(puntosInternos)]

  const puntos = []
  for (let i = 0; i < cantidad; i++) {
    puntos.push(pool[i % pool.length])
  }

  return { puntos, resolucion: RESOLUCION }
}
