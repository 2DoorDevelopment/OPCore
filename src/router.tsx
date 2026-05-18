import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { MiningOps } from './pages/MiningOps'
import { SalvageOps } from './pages/SalvageOps'
import { Logistics } from './pages/Logistics'
import { Hangar } from './pages/Hangar'
import { Refinery } from './pages/Refinery'
import { Toolbox } from './pages/Toolbox'
import { History } from './pages/History'
import { Settings } from './pages/Settings'
import { SessionView } from './pages/SessionView'
import { useAuth } from './lib/auth'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-accent font-heading text-xl animate-pulse">OpCore</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function Router() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-accent font-heading text-xl animate-pulse">OpCore</div>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Landing />}
        />
        <Route
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/mining" element={<MiningOps />} />
          <Route path="/session/:code" element={<SessionView />} />
          <Route path="/salvage" element={<SalvageOps />} />
          <Route path="/logistics" element={<Logistics />} />
          <Route path="/hangar" element={<Hangar />} />
          <Route path="/refinery" element={<Refinery />} />
          <Route path="/toolbox" element={<Toolbox />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
