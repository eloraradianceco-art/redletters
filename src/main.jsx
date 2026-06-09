import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ResetPassword from './components/ResetPassword.jsx'

// Detect password recovery — Supabase appends #access_token=...&type=recovery to redirectTo URL
const hash = window.location.hash
const isReset = hash.includes('type=recovery') || hash.includes('access_token') && hash.includes('recovery')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isReset ? <ResetPassword /> : <App />}
  </React.StrictMode>
)
