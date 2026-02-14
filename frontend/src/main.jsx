import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import base44 from './api/base44Client' // ADICIONAR ESTA LINHA

// Tornar base44 disponível globalmente
window.base44 = base44; // ADICIONAR ESTA LINHA

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)