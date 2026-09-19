// Un Pokémon "emblema" por generación: su silueta es la que le da forma a
// la constelación completa de esa galaxia (ver src/utils/silueta.js). Se
// eligieron por lo reconocible/nítido de su silueta oficial, no
// necesariamente por ser la mascota "oficial" de cada juego.
export const EMBLEMA_POR_GENERACION = {
  1: 25, // Pikachu
  2: 249, // Lugia
  3: 384, // Rayquaza
  4: 448, // Lucario
  5: 644, // Zekrom
  6: 658, // Greninja
  7: 792, // Lunala
  8: 888, // Zacian
  9: 1008, // Miraidon
}

// Arceus para el Universo General: en la mitología del propio juego es "el
// Pokémon que creó el universo", así que es la silueta que le da forma a la
// galaxia que junta a todos los Pokémon de todas las generaciones.
export const EMBLEMA_UNIVERSO_GENERAL = 493

// Id especial (no numérico) para la ruta /universo/:generacionId cuando
// representa el Universo General en vez de una generación puntual.
export const ID_UNIVERSO_GENERAL = 'todos'
