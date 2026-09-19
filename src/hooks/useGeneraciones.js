import { useEffect, useState } from 'react'

// Trae la lista de generaciones (id + name) de la PokeAPI. Vive en un hook
// propio porque la necesitan dos pantallas distintas: SelectorMultiverso
// (para las tarjetas/nodos de la órbita) y Universo (para los enlaces
// directos de la barra lateral). Sacarla de acá evita repetir el mismo
// fetch + estado de carga/error en los dos lugares.
export function useGeneraciones() {
  const [generaciones, setGeneraciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Dependencias []: la lista completa de generaciones no depende de nada
  // que cambie durante la vida del componente que use este hook, así que
  // alcanza con pedirla una sola vez.
  useEffect(() => {
    let cancelado = false

    async function cargarGeneraciones() {
      try {
        const respuesta = await fetch('https://pokeapi.co/api/v2/generation')
        if (!respuesta.ok) throw new Error('Respuesta no exitosa')
        const datos = await respuesta.json()
        if (!cancelado) setGeneraciones(datos.results)
      } catch {
        if (!cancelado) setError('No se pudo cargar el multiverso. Revisa tu conexión e intenta de nuevo.')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargarGeneraciones()
    return () => {
      cancelado = true
    }
  }, [])

  return { generaciones, cargando, error }
}

// La API no manda el id de la generación en la lista, solo su url, ej:
// "https://pokeapi.co/api/v2/generation/1/". Lo extraemos de ahí.
export function idDesdeUrlGeneracion(url) {
  const partes = url.split('/').filter(Boolean)
  return partes[partes.length - 1]
}
