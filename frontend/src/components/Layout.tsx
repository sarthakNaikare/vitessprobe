import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useKeyboardShortcuts } from '../hooks/useKeyboard'
import {
  LayoutDashboard, Clock, Search, Server,
  Zap, FileText, Upload, ChevronRight, Activity
} from 'lucide-react'

const nav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/timeline',   icon: Clock,           label: 'Timeline' },
  { to: '/queries',    icon: Search,          label: 'Query Intel' },
  { to: '/tablets',    icon: Server,          label: 'Tablets' },
  { to: '/simulator',  icon: Zap,             label: 'Simulator' },
  { to: '/reports',    icon: FileText,        label: 'Reports' },
  { to: '/import',     icon: Upload,          label: 'Import' },
]

export default function Layout() {
  const navigate = useNavigate()
  useKeyboardShortcuts()
  return (
    <div className="min-h-screen bg-canvas-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-stone-200 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div
          className="px-5 py-4 border-b border-stone-200 cursor-pointer flex items-center gap-2"
          onClick={() => navigate('/')}
        >
          <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="font-semibold text-stone-800 text-sm">VitessProbe</span>
        </div>

        {/* Demo badge */}
        <div className="px-5 py-2 border-b border-stone-200">
          <span className="text-2xs font-mono bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded">
            DEMO MODE
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200">
          <p className="text-2xs text-stone-400 font-mono">v1.0.0 · commerce keyspace</p>
          <p className="text-2xs text-stone-300 font-mono mt-1">G+D/T/Q/S shortcuts</p>
          <p className="text-2xs text-stone-400 font-mono">3 shards · 6 tablets</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
