import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { autoLandscape } from './utils/landscape'
import './index.css'


const isPhone = window.matchMedia?.('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 900
if (isPhone) {
  const once = () => {
    window.removeEventListener('pointerup', once)
    window.removeEventListener('touchend', once)
    autoLandscape()
  }
  window.addEventListener('pointerup', once)
  window.addEventListener('touchend', once)
}

createRoot(document.getElementById('root')).render(<App />)