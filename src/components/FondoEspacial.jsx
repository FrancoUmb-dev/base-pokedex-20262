import './FondoEspacial.css'

// Fondo decorativo fijo (nebulosas + galaxias lejanas) para que el espacio
// profundo no se sienta tan vacío. Se monta UNA sola vez en App.jsx, por
// encima de <Routes>, así queda igual sin importar la pantalla y no se
// recrea al navegar entre rutas. Es puramente visual: sin state, sin
// props, `aria-hidden` porque no aporta nada al lector de pantalla.
function FondoEspacial() {
  return (
    <div className="fondo-espacial" aria-hidden="true">
      <span className="nebulosa nebulosa--1" />
      <span className="nebulosa nebulosa--2" />
      <span className="nebulosa nebulosa--3" />
      <span className="nebulosa nebulosa--4" />
      <span className="galaxia-lejana galaxia-lejana--1" />
      <span className="galaxia-lejana galaxia-lejana--2" />
    </div>
  )
}

export default FondoEspacial
