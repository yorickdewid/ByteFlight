import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FlightPlanner from './pages/FlightPlanner.tsx'

document.title = 'ByteFlight - Flight Planner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlightPlanner />
  </StrictMode>,
)
