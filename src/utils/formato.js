// Pequeñas funciones de formateo de texto, compartidas por varios
// componentes de presentación (tarjetas del selector, panel de detalle).

// Los nombres de la PokeAPI vienen en minúscula y con guiones para las
// formas ("mr-mime", "deoxys-normal"). Los mostramos con mayúscula inicial
// en cada palabra y sin guiones.
export function capitalizarNombre(nombre) {
  return nombre
    .split('-')
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ')
}

// Número de Pokédex con ceros a la izquierda: 1 -> "#001".
export function formatearNumero(id) {
  return `#${String(id).padStart(3, '0')}`
}

// La API entrega los nombres de generación como "generation-i",
// "generation-ii", etc. Los mostramos en español: "Generación I". El
// Universo General no viene de la API (ver ID_UNIVERSO_GENERAL en
// data/emblemas.js), así que se resuelve aparte.
export function formatearNombreGeneracion(nombreApi) {
  if (nombreApi === 'todos') return 'Universo General'
  const numeroRomano = nombreApi.split('-')[1]?.toUpperCase() ?? '?'
  return `Generación ${numeroRomano}`
}
