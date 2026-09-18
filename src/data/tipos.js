// Fuente única de verdad para los colores de tipo y su orden.
// La usan Universo (color/sector de cada estrella), Estrella (glow) y
// FiltroTipo (color de cada chip), así evitamos repetir los 18 códigos
// hexadecimales en cada componente.

export const COLOR_POR_TIPO = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
}

// Orden fijo de los 18 tipos: define a qué sector angular (360° / 18 = 20°
// por tipo) pertenece cada uno dentro de la constelación. Tiene que ser un
// array (no solo las keys de un objeto cualquiera) porque el índice de cada
// tipo dentro de este orden es justamente el número de sector que le toca.
export const TIPOS_ORDENADOS = Object.keys(COLOR_POR_TIPO)

// Color de respaldo por si algún pokémon llegara sin tipo reconocido.
export const COLOR_DESCONOCIDO = '#4a4a6a'
