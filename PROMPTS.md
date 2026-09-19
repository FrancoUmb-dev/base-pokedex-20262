## Prompt 1

Quiero que construyas "Pokéverso": una Pokédex interactiva en React (JavaScript, no TypeScript) 
que consume la PokeAPI (https://pokeapi.co) y visualiza los Pokémon como un universo/galaxia de 
datos, organizado por generación, no como una lista ni tarjetas.

STACK
- Vite + React (JS)
- react-router-dom para navegación
- CSS plano (o Tailwind si el proyecto ya lo trae configurado)
- Librería react-zoom-pan-pinch para el pan/zoom del "universo"
- Sin backend, sin localStorage, todo cliente puro contra la PokeAPI

ESTRUCTURA DE RUTAS (react-router-dom, anidadas)
- "/" → <SelectorMultiverso />
- "/universo/:generacionId" → <Universo /> mostrando la galaxia de esa generación
- "/universo/:generacionId/pokemon/:pokemonId" → <Universo /> con el panel de detalle abierto 
  sobre ese Pokémon (el universo de fondo NO se desmonta al abrir el panel)

SELECTORMULTIVERSO.JSX
- En un useEffect con dependencias [], hace GET https://pokeapi.co/api/v2/generation 
  (sin id) para traer la lista completa de generaciones (id + name)
- Renderiza una tarjeta clickeable por generación (nombre + color distinto por tarjeta); 
  al hacer clic usa useNavigate() para ir a "/universo/:id"
- Pantalla liviana: aquí NO se cargan Pokémon, solo la lista de generaciones

UNIVERSO.JSX
- Lee :generacionId con useParams()
- En un useEffect con dependencia [generacionId], hace GET 
  https://pokeapi.co/api/v2/generation/{generacionId} para obtener pokemon_species de esa 
  generación
- Para cada especie, hace GET /pokemon/{name} (Promise.all) trayendo: id, types, stats, 
  sprites.other['official-artwork'].front_default, y cries.latest
- Si una especie no tiene un recurso /pokemon/ con el mismo nombre exacto (formas alternas raras), 
  se omite en silencio — comentar en el código que es una decisión consciente, no un bug
- Cada vez que generacionId cambia, el useEffect se vuelve a disparar y reemplaza el roster 
  completo; muestra un loader (Pokéball girando) mientras carga
- state interno: roster de pokémon de la generación activa, filtro de tipo activo, término de 
  búsqueda

LAYOUT ("constelación", dentro de cada universo)
- Cada Pokémon es una estrella en un lienzo grande (ej. 3000x3000px) dentro del componente de 
  pan/zoom
- Agrupa por TIPO PRIMARIO: reparte los 18 tipos en sectores angulares fijos (360/18 grados c/u)
- Dentro de cada sector, coloca los Pokémon a radio creciente desde el centro 
  (radio = base + índice * incremento), con jitter aleatorio leve
- Trigonometría: x = centroX + radio * cos(angulo), y = centroY + radio * sin(angulo)
- Color por tipo:
  normal:#A8A878 fire:#F08030 water:#6890F0 electric:#F8D030 grass:#78C850 ice:#98D8D8 
  fighting:#C03028 poison:#A040A0 ground:#E0C068 flying:#A890F0 psychic:#F85888 bug:#A8B820 
  rock:#B8A038 ghost:#705898 dragon:#7038F8 dark:#705848 steel:#B8B8D0 fairy:#EE99AC
- Tamaño de la estrella proporcional a la suma de sus stats base

DISEÑO VISUAL (temática Pokémon)
- Fondo oscuro tipo espacio profundo, con un starfield sutil de fondo (puntos pequeños fijos, 
  distintos de las estrellas-Pokémon)
- Fuente pixel/retro (ej. "Press Start 2P" de Google Fonts) SOLO en títulos y HUD; el resto en 
  fuente legible normal
- Acentos amarillo/rojo (paleta clásica Pokémon) en botones y bordes
- Panel de detalle con estética de HUD/terminal de nave: fondo oscuro semitransparente, bordes 
  con glow, esquinas resaltadas
- Las tarjetas de SelectorMultiverso también con este estilo visual, coherente con el resto

ANIMACIONES
- Estrellas: parpadeo/pulso continuo vía @keyframes
- Hover sobre estrella: scale + aumento de glow (box-shadow), con transition
- Estrella encontrada por búsqueda: anillo pulsante mientras la cámara viaja hacia ella
- Panel de detalle: fade-in + scale al abrir, fade-out al cerrar
- Sprite dentro del panel: flotar sutil (translateY oscilando)
- Loader: Pokéball girando mientras carga el roster de una generación

INTERACCIÓN
- Barra de búsqueda: busca SOLO dentro de la generación cargada actualmente (placeholder tipo 
  "Buscar en esta generación..."); al encontrar, navega a 
  "/universo/{generacionId}/pokemon/{pokemonId}" y centra/zoom con react-zoom-pan-pinch
- Clic en una estrella: navega a "/universo/{generacionId}/pokemon/{pokemonId}"
- Panel de detalle: sprite oficial, nombre, número, tipos (chips de color), barras de stats base, 
  reproduce cries.latest automáticamente con <audio> en un useEffect separado (dependencia: 
  pokemonId seleccionado, distinto del useEffect de carga de generación)
- Filtro de tipo: chips clicables; al seleccionar tipos, las estrellas de otros tipos bajan 
  opacidad (ej. 0.15); este filtro vive como STATE en Universo.jsx y baja como PROPS a Estrella

NO IMPLEMENTAR
- No agregar agrupación ni filtro por hábitat — el dato viene incompleto para muchas especies 
  en la PokeAPI y generaría zonas vacías o inconsistentes

COMPONENTES (props/state explícitos)
- App.jsx: configura BrowserRouter y las rutas
- SelectorMultiverso.jsx: state de la lista de generaciones
- Universo.jsx: state del roster, filtro de tipo, término de búsqueda; pasa props a Estrella 
  (datos del pokémon, si está activa según filtro) y usa el :pokemonId de la URL para saber si 
  mostrar PanelDetalle
- Estrella.jsx: recibe todo por props (posición, color, tamaño, opacidad, onClick), sin state propio
- PanelDetalle.jsx: recibe el pokémon por props, state propio solo para animación entrada/salida
- BarraBusqueda.jsx: state local del input, comunica resultado hacia arriba vía callback prop
- FiltroTipo.jsx: recibe tipos y filtro activo por props, notifica cambios vía callback prop
- Comenta en español las partes no obvias, especialmente la fórmula de posicionamiento y por qué 
  cada useEffect tiene las dependencias que tiene — necesito poder explicar cada línea en 
  sustentación oral

VERCEL.JSON (raíz del proyecto, para que las rutas anidadas no rompan al refrescar en producción)
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}

ARCHIVOS ADICIONALES

1. README.md — debe empezar EXACTAMENTE así, antes de cualquier otro contenido:

# Pokéverso

**Nombre:** Sebastian Franco Umbacia

## Demo desplegada
(pegar aquí el link de Vercel una vez desplegado)

Después agrega: descripción corta del proyecto, cómo correrlo localmente 
(npm install, npm run dev), y estructura de carpetas.

2. PROMPTS.md — crea este archivo y pega dentro este prompt completo, tal como está escrito, 
   bajo un encabezado "## Prompt 1". A partir de ahora, cada instrucción adicional que te dé 
   en esta sesión, agrégala a este mismo archivo como "## Prompt N" (numerado en orden), con 
   el texto exacto que escriba, sin resumir ni parafrasear.

Al terminar, dime exactamente qué archivos creaste y qué comando uso para correrlo localmente.

## Prompt 2

Quiero que le incluyas un universo general con todos los pokemones, ya que si intento buscar uno que no esta en esa misma generacion no va a aparecer y no voy a poder encontrarlo si no busco uno por uno. tambien cambia un poco el fondo, pon galaxias o alguna cosa para que no se vea tan vacio, tambien el orden de los "puntos/estrellas" haz que en cada generacion sea un diseño (como si fuera un tipo constelacion de algun pokemon representativo de cada generacion. Ademas de eso arregla la interfaz inicial, no me gusta que se vea todo como una lista, haz algo mas creativo y mas visualmente agradable

## Prompt 3

Si bien el sistema de busqueda me parece agredable al dar opciones cercanas, necesito que en la barra de busqueda, abajo añadas las recomendaciones parecidas a las palabras que se estan buscando, ya que en ciertos momentos puede que uno no sepa bien como se llama o lo deletree al y no aparezca, tambien ten en cuenta que no solo debe ser con nombres sino tambien con el numero del pokemon y asegurate de añadir tanto el formato "numero" y "#numero" para que no hayan equivocaciones

## Prompt 4

me di cuenta que visualmente la parte de "multiverso" y los tipos se ve bastante regado, me gustaria que hicieras un tipo de filtro y tambien una barra lateral para que no se vea tan sobrecargado, donde puedas entrar directamente a cada generacion sin volver al inicio , otro boton para volver al inicio. ademas de eso cuando estas en cualquier zona de la pagina, y al hacer un zoom sin querer se aleja demasiado o sale de la pantalla lo incial que queremos ver, limita ese zoom para que se pueda acercar lo suficiente para ver las estrellas y que se pueda alejar para que se vea bien la constelacion pero no que se aleje demasiado, tambien si intenta arrastrar el mouse y sin querer o queriendo lo hacer muy lejos, desaparece la constelacion y no se ve bien, entonces arregla que sea delimitado
