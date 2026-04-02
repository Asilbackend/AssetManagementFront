import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AssetProvider } from './context/AssetContext'
import { AssignAssetPage } from './pages/AssignAssetPage'
import { CreateAssetPage } from './pages/CreateAssetPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditAssetPage } from './pages/EditAssetPage'
import { ReportsPage } from './pages/ReportsPage'

function App() {
  return (
    <BrowserRouter>
      <AssetProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/create" element={<CreateAssetPage />} />
            <Route path="/assets/:assetId/edit" element={<EditAssetPage />} />
            <Route path="/assign" element={<AssignAssetPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </AppShell>
      </AssetProvider>
    </BrowserRouter>
  )
}

export default App
