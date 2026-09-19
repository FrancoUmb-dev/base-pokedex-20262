// Aplica `fn` a cada elemento de `items`, pero como máximo `tamanoLote`
// promesas en vuelo al mismo tiempo (en vez de un solo Promise.all con
// todos los elementos juntos).
//
// Por qué hace falta: se comprobó en la práctica que pedirle a la PokeAPI
// los ~1025 Pokémon del Universo General de una sola vez (un Promise.all
// con las 1025 peticiones simultáneas) funciona la mayoría de las veces,
// pero si el navegador dispara esa misma tanda dos veces en paralelo —cosa
// que React StrictMode hace a propósito en desarrollo, montando cada efecto
// dos veces— una de las dos tandas empieza a fallar en más de la mitad de
// los pedidos (probado: de 1025, una tanda sola trae 988 éxitos, pero dos
// tandas simultáneas dejan a una de ellas en apenas ~500). Cortar la carga
// en lotes más chicos evita saturar la conexión, a costa de tardar un poco
// más en total (se espera a que termine un lote antes de largar el
// siguiente).
export async function mapConLimite(items, tamanoLote, fn) {
  const resultados = []
  for (let inicio = 0; inicio < items.length; inicio += tamanoLote) {
    const lote = items.slice(inicio, inicio + tamanoLote)
    const resultadosLote = await Promise.all(lote.map(fn))
    resultados.push(...resultadosLote)
  }
  return resultados
}
