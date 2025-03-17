import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FlightPlanner from './pages/FlightPlanner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlightPlanner />
  </StrictMode>,
)
