import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 pb-20 md:pb-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
