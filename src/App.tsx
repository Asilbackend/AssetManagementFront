import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AssetProvider } from './context/AssetContext'
import { AssignAssetPage } from './pages/AssignAssetPage'
import { CreateAssetPage } from './pages/CreateAssetPage'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <AssetProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/create" element={<CreateAssetPage />} />
            <Route path="/assign" element={<AssignAssetPage />} />
          </Routes>
        </AppShell>
      </AssetProvider>
    </BrowserRouter>
  )
}

export default App
