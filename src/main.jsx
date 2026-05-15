import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PublicSite from './PublicSite.jsx'

const path = window.location.pathname;
const isAdmin = path.startsWith('/admin');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? <App /> : <PublicSite />}
  </StrictMode>,
)
