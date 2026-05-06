import { useNavigate } from 'react-router-dom'
import { Activity, Zap, GitBranch, FileText, Upload, ArrowRight } from 'lucide-react'

const features = [
  { icon: Activity,   title: 'Live Incident Detection',    desc: 'Detects VTTablet failovers, scatter storms, replication lag spikes in real time.' },
  { icon: GitBranch,  title: 'Causation Graph Engine',     desc: 'Traces the exact causal chain across VTGate, VTTablet, MySQL, and etcd.' },
  { icon: FileText,   title: 'RCA Report Generator',       desc: 'Structured post-mortems downloadable as PDF. Technical or executive audience.' },
  { icon: Zap,        title: 'Incident Simulator',         desc: 'Inject synthetic failures and watch VitessProbe diagnose them live.' },
  { icon: Upload,     title: 'Data Import',                desc: 'Upload Prometheus scrape dumps or VTGate queryz output for offline analysis.' },
]

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-canvas-100">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="font-semibold text-stone-800">VitessProbe</span>
        </div>
        <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-1 rounded border border-stone-200">
          v1.0.0
        </span>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-indigo-600">Demo cluster running · 3 shards · 6 tablets</span>
        </div>

        <h1 className="text-5xl font-semibold text-stone-900 leading-tight mb-6">
          Autonomous Vitess<br />
          <span className="text-indigo-600">Cluster Intelligence</span>
        </h1>

        <p className="text-lg text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          VitessProbe detects incidents, traces causation chains across every component,
          and generates RCA reports — before your support ticket is even filed.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Try Demo <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/simulator')}
            className="flex items-center gap-2 border border-stone-200 bg-white text-stone-700 px-6 py-3 rounded-lg font-medium hover:border-stone-300 transition-colors"
          >
            <Zap size={16} /> Inject a Failure
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-stone-200 rounded-xl p-6 shadow-card">
              <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Icon size={17} className="text-indigo-600" />
              </div>
              <h3 className="font-medium text-stone-800 mb-2 text-sm">{title}</h3>
              <p className="text-stone-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What it monitors */}
      <section className="border-t border-stone-200 bg-white py-16">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-6">Monitors these Vitess failure modes</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Tablet Failover', 'Scatter Query Storm', 'Replication Lag', 'VReplication Error', 'Online DDL Stall', 'VTGate Overload', 'Connection Pool Exhaustion'].map(f => (
              <span key={f} className="text-xs font-mono bg-stone-50 border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
