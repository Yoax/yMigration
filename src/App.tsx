import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { MapShellProvider } from './contexts/MapShellContext'
import { AboutPage } from './pages/AboutPage'
import { AdminPage } from './pages/AdminPage'
import { MapPage } from './pages/MapPage'
import { TutorialPage } from './pages/TutorialPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <MapShellProvider>
              <AppLayout />
            </MapShellProvider>
          }
        >
          <Route index element={<MapPage />} />
          <Route path="tutoriel" element={<TutorialPage />} />
          <Route path="a-propos" element={<AboutPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
