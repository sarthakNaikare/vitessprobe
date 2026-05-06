import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useKeyboardShortcuts } from '../hooks/useKeyboard'
import {
  LayoutDashboard, Clock, Search, Server,
  Zap, FileText, Upload, Activity
} from 'lucide-react'

const nav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',     key: 'D' },
  { to: '/timeline',   icon: Clock,           label: 'Timeline',      key: 'T' },
  { to: '/queries',    icon: Search,          label: 'Query Intel',   key: 'Q' },
  { to: '/tablets',    icon: Server,          label: 'Tablets',       key: 'B' },
  { to: '/simulator',  icon: Zap,             label: 'Simulator',     key: 'S' },
  { to: '/reports',    icon: FileText,        label: 'Reports',       key: 'R' },
  { to: '/import',     icon: Upload,          label: 'Import',        key: 'I' },
]

export default function Layout() {
  const navigate = useNavigate()
  useKeyboardShortcuts()

  return (
    <div className="min-h-screen flex" style={{background:'#F7F3ED'}}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col fixed h-full z-10" style={{background:'#2C1810'}}>
        {/* Logo */}
        <div
          className="px-5 py-5 cursor-pointer flex items-center gap-3"
          style={{borderBottom:'0.5px solid rgba(255,255,255,0.08)'}}
          onClick={() => navigate('/')}
        >
          <div style={{
            width:30, height:30,
            background:'linear-gradient(135deg,#B87333,#D4924A)',
            borderRadius:6,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 8px rgba(184,115,51,0.4)'
          }}>
            <Activity size={15} color="#FFF7ED" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold" style={{color:'#F7F3ED',letterSpacing:'0.02em'}}>VitessProbe</p>
            <p style={{fontSize:9,color:'rgba(247,243,237,0.4)',fontFamily:'JetBrains Mono',letterSpacing:'0.05em'}}>v1.0.0</p>
          </div>
        </div>

        {/* Demo badge */}
        <div className="px-4 py-2.5" style={{borderBottom:'0.5px solid rgba(255,255,255,0.06)'}}>
          <span style={{
            fontSize:9, fontFamily:'JetBrains Mono', letterSpacing:'0.08em',
            background:'rgba(184,115,51,0.15)', color:'#D4924A',
            border:'0.5px solid rgba(184,115,51,0.3)',
            padding:'3px 8px', borderRadius:4,
          }}>
            ◈ DEMO MODE
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {nav.map(({ to, icon: Icon, label, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => isActive ? 'nav-active' : 'nav-item'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#F7F3ED' : 'rgba(247,243,237,0.5)',
                background: isActive ? 'rgba(184,115,51,0.2)' : 'transparent',
                borderLeft: isActive ? '2px solid #B87333' : '2px solid transparent',
                transition: 'all 0.15s ease',
                textDecoration: 'none',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={14} style={{color: isActive ? '#B87333' : 'rgba(247,243,237,0.4)', flexShrink:0}} />
                  <span style={{flex:1}}>{label}</span>
                  <span style={{
                    fontSize: 8, fontFamily:'JetBrains Mono',
                    color: 'rgba(247,243,237,0.2)',
                    background:'rgba(255,255,255,0.05)',
                    padding:'1px 5px', borderRadius:3,
                  }}>G+{key}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4" style={{borderTop:'0.5px solid rgba(255,255,255,0.06)'}}>
          <p style={{fontSize:9,color:'rgba(247,243,237,0.25)',fontFamily:'JetBrains Mono',lineHeight:1.6}}>
            commerce keyspace<br/>3 shards · 6 tablets
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
