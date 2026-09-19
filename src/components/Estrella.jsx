import './Estrella.css'

// Componente puramente presentacional: no tiene useState ni useEffect
// propios. Toda su apariencia (posición, color, tamaño, opacidad) y su
// comportamiento (onClick) llegan resueltos desde Universo, que es quien
// conoce el roster completo y el filtro activo.
//
// Color y tamaño se pasan como variables CSS (--color-estrella,
// --tamano-estrella) en vez de como "style" directo de background/boxShadow:
// así el hover y el parpadeo, definidos en Estrella.css, pueden seguir
// animando esas propiedades (un estilo inline pisa cualquier regla del
// stylesheet, así que si el brillo estuviera inline el hover no podría
// aumentarlo).
function Estrella({ id, nombre, x, y, color, tamano, opacidad, esEncontrada, onClick }) {
  // Delay de animación derivado del id (determinístico): así el parpadeo no
  // se ve repetido a simple vista sin necesidad de Math.random() en cada
  // render (lo que además rompería la memoización de posiciones si viviera
  // en Universo).
  const retrasoParpadeo = `${(id % 20) / 10}s`

  return (
    <button
      type="button"
      id={`estrella-${id}`}
      className={`estrella${esEncontrada ? ' estrella--encontrada' : ''}`}
      style={{
        left: x,
        top: y,
        opacity: opacidad,
        animationDelay: retrasoParpadeo,
        '--color-estrella': color,
        '--tamano-estrella': `${tamano}px`,
      }}
      title={nombre}
      aria-label={nombre}
      onClick={onClick}
    />
  )
}

export default Estrella
