import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* We only render App here. 
        App contains the Layout and the Routes. 
        This ensures the Layout stays mounted forever.
      */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
)