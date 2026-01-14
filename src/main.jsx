import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import MatchView from './components/MatchView.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* The Admin/Scorer Route (Default) */}
        <Route path="/" element={<App />} />
        
        {/* The Public Viewer Route */}
        <Route path="/view" element={<MatchView />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)