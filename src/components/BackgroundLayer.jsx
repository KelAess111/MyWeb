import backgroundImage from '../assets/background/Reset_graden.png'
import '../styles/background-layer.css'

function BackgroundLayer({ mode = 'base' }) {
  return (
    <div className={`background-layer background-layer--${mode}`} aria-hidden="true">
      <div className="background-layer__image" style={{ backgroundImage: `url(${backgroundImage})` }} />
      {mode === 'glass' ? <div className="background-layer__overlay" /> : null}
    </div>
  )
}

export default BackgroundLayer
