# Pokéverso

**Nombre:** Sebastian Franco Umbacia

## Demo desplegada
(pegar aquí el link de Vercel una vez desplegado)

## Descripción

Pokéverso es una Pokédex interactiva construida en React que en vez de mostrar a los Pokémon
como una lista o una grilla de tarjetas, los dibuja como estrellas dentro de la galaxia de su
generación. La posición de cada estrella sale de la silueta de un Pokémon "emblema" de esa
generación (Pikachu para la I, Rayquaza para la III, etc.): se muestrea el canal alfa de su
sprite oficial sobre un `<canvas>` oculto y esos puntos son donde se ubican las estrellas, así
que alejando la cámara la constelación completa se lee como la forma de ese Pokémon — igual que
las constelaciones reales. El tamaño de cada estrella es proporcional a la suma de sus stats
base y su color depende de su tipo primario. Si por algún motivo la silueta no se puede generar
(sin conexión, o el navegador bloquea el canvas), la app cae de vuelta a un layout de respaldo
por sectores de tipo.

Además de las 9 generaciones también existe el **Universo General** (`/universo/todos`), que
junta a todos los Pokémon de todas las generaciones en una sola galaxia con forma de Arceus:
sirve para buscar un Pokémon sin saber de antemano en qué generación está.

Todo el universo se puede recorrer con pan y zoom, tiene buscador (que centra la cámara sobre el
Pokémon encontrado) y filtro por tipo. Al hacer clic en una estrella se abre un panel de
detalle con estética de HUD/terminal de nave, con sprite, tipos, stats y el grito del Pokémon.
El fondo tiene nebulosas y galaxias lejanas decorativas para que el espacio no se sienta vacío.

La app consume exclusivamente la [PokeAPI](https://pokeapi.co) desde el cliente: no hay backend
propio ni persistencia en localStorage.

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

Luego abrir la URL que muestra la terminal (por defecto `http://localhost:5173`).

Para generar el build de producción:

```bash
npm run build
npm run preview
```

## Estructura de carpetas

```
├── index.html
├── vercel.json              # rewrites para que las rutas anidadas sobrevivan al refresh en Vercel
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx              # punto de entrada, monta <App />
    ├── App.jsx                # BrowserRouter + definición de rutas + <FondoEspacial />
    ├── index.css              # tema global (fondo espacial, starfield, tipografías, variables CSS)
    ├── data/
    │   ├── tipos.js           # colores oficiales por tipo y su orden fijo (sectores angulares)
    │   └── emblemas.js        # Pokémon "emblema" por generación (le da forma a cada constelación)
    ├── utils/
    │   ├── formato.js         # helpers de texto (capitalizar nombre, número de pokédex, etc.)
    │   ├── silueta.js         # muestrea el sprite del emblema en un <canvas> -> puntos (x,y)
    │   └── concurrencia.js    # helper para pedir la PokeAPI en lotes, no todo junto
    ├── pages/
    │   ├── SelectorMultiverso.jsx / .css   # "/" — órbita de generaciones + Universo General
    │   └── Universo.jsx / .css             # "/universo/:generacionId" — la galaxia de una generación
    └── components/
        ├── FondoEspacial.jsx / .css  # nebulosas y galaxias lejanas decorativas (fondo fijo)
        ├── Estrella.jsx / .css       # cada Pokémon-estrella dentro de la constelación
        ├── PanelDetalle.jsx / .css   # panel HUD con el detalle del Pokémon seleccionado
        ├── BarraBusqueda.jsx / .css  # input de búsqueda dentro de la generación activa
        └── FiltroTipo.jsx / .css     # chips de filtro por tipo
```

## Stack

- [Vite](https://vite.dev) + React 19 (JavaScript)
- [react-router-dom](https://reactrouter.com) para el ruteo anidado
- [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch) para el pan/zoom del universo
- CSS plano (sin frameworks de estilos)
