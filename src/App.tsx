import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RoleAppShell } from './components/layout/RoleAppShell'
import { ToastProvider } from './components/ui/ToastProvider'
import { AssetProvider } from './context/AssetContext'
import type { Role } from './domain/types'
import { AssignAssetPage } from './pages/AssignAssetPage'
import { AssetCustodianDashboard } from './pages/AssetCustodianDashboard'
import { CreateAssetPage } from './pages/CreateAssetPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditAssetPage } from './pages/EditAssetPage'
import { EmployeeAssetsPage } from './pages/EmployeeAssetsPage'
import { ITSpecialistDashboard } from './pages/ITSpecialistDashboard'
import { LoginPage } from './pages/LoginPage'
import { ReportsPage } from './pages/ReportsPage'
import { AppStoreProvider, useAppStore } from './store/AppStore'

function defaultRouteForRole(role: Role) {
  switch (role) {
    case 'WAREHOUSE_MANAGER':
      return '/'
    case 'IT_SPECIALIST':
      return '/it-specialist'
    case 'ASSET_CUSTODIAN':
      return '/asset-custodian'
    case 'EMPLOYEE':
      return '/my-assets'
    default:
      return '/login'
  }
}

function WarehouseRoute({ element }: { element: ReactElement }) {
  const { currentUser, isBootstrapping } = useAppStore()

  if (isBootstrapping) {
    return null
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.role !== 'WAREHOUSE_MANAGER') {
    return <Navigate to={defaultRouteForRole(currentUser.role)} replace />
  }

  return (
    <AppShell>{element}</AppShell>
  )
}

function RoleRoute({ allow, element }: { allow: Role[]; element: ReactElement }) {
  const { currentUser, isBootstrapping } = useAppStore()

  if (isBootstrapping) {
    return null
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (!allow.includes(currentUser.role)) {
    return <Navigate to={defaultRouteForRole(currentUser.role)} replace />
  }

  return <RoleAppShell>{element}</RoleAppShell>
}

function AppRoutes() {
  const { currentUser, isBootstrapping } = useAppStore()

  if (isBootstrapping) {
    return null
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          currentUser ? <Navigate to={defaultRouteForRole(currentUser.role)} replace /> : <LoginPage />
        }
      />
      <Route path="/" element={<WarehouseRoute element={<DashboardPage />} />} />
      <Route path="/create" element={<WarehouseRoute element={<CreateAssetPage />} />} />
      <Route path="/assets/:assetId/edit" element={<WarehouseRoute element={<EditAssetPage />} />} />
      <Route path="/assign" element={<WarehouseRoute element={<AssignAssetPage />} />} />
      <Route path="/reports" element={<WarehouseRoute element={<ReportsPage />} />} />
      <Route
        path="/dashboard"
        element={<Navigate to={currentUser ? defaultRouteForRole(currentUser.role) : '/login'} replace />}
      />
      <Route
        path="/it-specialist"
        element={<RoleRoute allow={['IT_SPECIALIST']} element={<ITSpecialistDashboard />} />}
      />
      <Route
        path="/asset-custodian"
        element={<RoleRoute allow={['ASSET_CUSTODIAN']} element={<AssetCustodianDashboard />} />}
      />
      <Route
        path="/my-assets"
        element={<RoleRoute allow={['EMPLOYEE']} element={<EmployeeAssetsPage />} />}
      />
      <Route
        path="*"
        element={<Navigate to={currentUser ? defaultRouteForRole(currentUser.role) : '/login'} replace />}
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppStoreProvider>
          <AssetProvider>
            <AppRoutes />
          </AssetProvider>
        </AppStoreProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
