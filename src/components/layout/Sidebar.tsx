import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Pickaxe,
  Recycle,
  Package,
  Warehouse,
  FlaskConical,
  Wrench,
  History,
  Settings,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/mining', label: 'Mining Ops', icon: Pickaxe },
  { to: '/salvage', label: 'Salvage Ops', icon: Recycle },
  { to: '/logistics', label: 'Logistics', icon: Package },
  { to: '/hangar', label: 'Hangar', icon: Warehouse },
  { to: '/refinery', label: 'Refinery', icon: FlaskConical },
  { to: '/toolbox', label: 'Toolbox', icon: Wrench },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-bg-panel min-h-screen">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <span className="text-accent text-2xl font-heading font-bold tracking-wide">OpCore</span>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-accent bg-bg-elevated border-r-2 border-accent'
                  : 'text-text-muted hover:text-text hover:bg-bg-elevated'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-border">
        <p className="text-text-dim text-xs leading-relaxed">
          OpCore is an unofficial fan-made tool. Star Citizen® is © Cloud Imperium Rights LLC.
        </p>
      </div>
    </aside>
  )
}
