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
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/mining', label: 'Mining', icon: Pickaxe },
  { to: '/salvage', label: 'Salvage', icon: Recycle },
  { to: '/logistics', label: 'Cargo', icon: Package },
  { to: '/hangar', label: 'Hangar', icon: Warehouse },
  { to: '/refinery', label: 'Refinery', icon: FlaskConical },
  { to: '/toolbox', label: 'Toolbox', icon: Wrench },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-bg-panel border-t border-border z-50">
      <div className="flex overflow-x-auto scrollbar-none">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 min-w-[60px] text-xs font-medium transition-colors',
                isActive ? 'text-accent' : 'text-text-muted'
              )
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
