import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clusterApi, incidentApi, tabletApi, queryApi } from '../api'
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Zap, ArrowRight, RefreshCw } from 'lucide-react'

function severityClass(s: string) {
  if (s === 'critical') return 'badge-critical'
  if (s === 'high')     return 'badge-high'
  if (s === 'medium')   return 'badge-medium'
  return 'badge-low'
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626'
  const r = 36, cx = 44, cy = 44, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={88} height={88}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E8E7E0" strokeWidth={6} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={18} fontWeight={600} fill={color}>
        {score}
      </text>
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: health, isLoading: hLoading, refetch } = useQuery({
    queryKey: ['cluster-health'],
    queryFn: clusterApi.getHealth,
    refetchInterval: 15000,
  })
  const { data: incidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => incidentApi.list({ limit: 5 }),
    refetchInterval: 15000,
  })
  const { data: tablets } = useQuery({
    queryKey: ['tablets'],
    queryFn: tabletApi.list,
    refetchInterval: 15000,
  })
  const { data: qStats } = useQuery({
    queryKey: ['query-stats'],
    queryFn: queryApi.getStats,
  })

  if (hLoading) return (
    <div className="p-8 flex items-center gap-2 text-stone-400 text-sm font-mono">
      <RefreshCw size={14} className="animate-spin" /> Loading cluster state...
    </div>
  )

  const activeIncidents = incidents?.filter(i => i.status === 'active') || []
  const resolvedIncidents = incidents?.filter(i => i.status === 'resolved') || []

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Cluster Overview</h1>
          <p className="text-sm text-stone-400 font-mono mt-0.5">
            commerce keyspace · 3 shards · demo-cluster-001
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-stone-500 border border-stone-200 px-3 py-1.5 rounded-md hover:bg-stone-50 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Health score + key metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Score */}
        <div className="card p-5 flex items-center gap-4 col-span-1">
          <ScoreRing score={health?.overall_score ?? 0} />
          <div>
            <p className="text-xs text-stone-400 font-mono uppercase tracking-wide mb-1">Health Score</p>
            <p className="text-sm text-stone-600">
              {(health?.overall_score ?? 0) >= 80 ? 'Healthy' : (health?.overall_score ?? 0) >= 60 ? 'Degraded' : 'Critical'}
            </p>
          </div>
        </div>

        {/* Active incidents */}
        <div className="card p-5">
          <p className="text-xs text-stone-400 font-mono uppercase tracking-wide mb-2">Active Incidents</p>
          <p className="text-3xl font-semibold text-stone-800 mb-1">{health?.active_incidents ?? 0}</p>
          <p className="text-xs text-stone-400">{resolvedIncidents.length} resolved recently</p>
        </div>

        {/* Scatter rate */}
        <div className="card p-5">
          <p className="text-xs text-stone-400 font-mono uppercase tracking-wide mb-2">Scatter Query Rate</p>
          <p className="text-3xl font-semibold text-stone-800 mb-1">
            {Math.round((health?.scatter_query_rate ?? 0) * 100)}%
          </p>
          <p className="text-xs text-stone-400">{qStats?.scatter_fingerprints ?? 0} of {qStats?.total_fingerprints ?? 0} patterns</p>
        </div>

        {/* Max replication lag */}
        <div className="card p-5">
          <p className="text-xs text-stone-400 font-mono uppercase tracking-wide mb-2">Max Replica Lag</p>
          <p className={`text-3xl font-semibold mb-1 ${(health?.max_replication_lag_s ?? 0) > 10 ? 'text-red-600' : 'text-stone-800'}`}>
            {health?.max_replication_lag_s ?? 0}s
          </p>
          <p className="text-xs text-stone-400">
            {health?.tablets_healthy ?? 0}/{health?.tablets_total ?? 0} tablets healthy
          </p>
        </div>
      </div>

      {/* Incidents + Tablets */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Recent incidents */}
        <div className="card">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-stone-400" />
              <span className="text-sm font-medium text-stone-700">Recent Incidents</span>
            </div>
            <button
              onClick={() => navigate('/timeline')}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {incidents && incidents.length > 0 ? incidents.slice(0, 5).map(inc => (
              <div
                key={inc.id}
                onClick={() => navigate(`/incidents/${inc.id}`)}
                className="px-5 py-3 hover:bg-stone-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-medium text-stone-700 leading-snug flex-1">{inc.title}</p>
                  <span className={severityClass(inc.severity)}>{inc.severity}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-2xs font-mono px-1.5 py-0.5 rounded border ${
                    inc.status === 'active'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-green-50 text-green-600 border-green-200'
                  }`}>
                    {inc.status}
                  </span>
                  <span className="text-2xs text-stone-400 font-mono">
                    {new Date(inc.detected_at).toLocaleString()}
                  </span>
                </div>
              </div>
            )) : (
              <div className="px-5 py-8 text-center text-stone-400 text-sm">No incidents</div>
            )}
          </div>
        </div>

        {/* Tablet health */}
        <div className="card">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-stone-400" />
              <span className="text-sm font-medium text-stone-700">Tablet Health</span>
            </div>
            <button
              onClick={() => navigate('/tablets')}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Inspect <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {tablets && tablets.map(t => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {t.is_healthy
                      ? <CheckCircle size={12} className="text-green-500" />
                      : <AlertTriangle size={12} className="text-red-500" />
                    }
                    <span className="text-xs font-mono text-stone-700">{t.tablet_alias}</span>
                    <span className={`text-2xs font-mono px-1 py-0.5 rounded ${
                      t.tablet_type === 'primary'
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        : 'bg-stone-100 text-stone-500 border border-stone-200'
                    }`}>
                      {t.tablet_type}
                    </span>
                  </div>
                  <p className="text-2xs text-stone-400 font-mono ml-5">
                    shard {t.shard} · {t.qps} QPS
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-mono ${t.replication_lag_seconds > 10 ? 'text-red-600' : 'text-stone-500'}`}>
                    lag {t.replication_lag_seconds.toFixed(1)}s
                  </p>
                  <p className="text-2xs text-stone-400">
                    pool {t.connection_pool_pct}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/simulator')}
          className="card p-4 text-left hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <Zap size={16} className="text-indigo-500 mb-2" />
          <p className="text-sm font-medium text-stone-700 mb-1">Inject a Failure</p>
          <p className="text-xs text-stone-400">Simulate a VTTablet crash, scatter storm, or replication lag spike</p>
        </button>
        <button
          onClick={() => navigate('/queries')}
          className="card p-4 text-left hover:border-indigo-200 hover:shadow-md transition-all"
        >
          <Activity size={16} className="text-indigo-500 mb-2" />
          <p className="text-sm font-medium text-stone-700 mb-1">Query Intelligence</p>
          <p className="text-xs text-stone-400">Find scatter queries and analyze execution plan risks</p>
        </button>
        <button
          onClick={() => navigate('/reports')}
          className="card p-4 text-left hover:border-indigo-200 hover:shadow-md transition-all"
        >
          <Clock size={16} className="text-indigo-500 mb-2" />
          <p className="text-sm font-medium text-stone-700 mb-1">Generate RCA Report</p>
          <p className="text-xs text-stone-400">Turn any incident into a downloadable post-mortem</p>
        </button>
      </div>
    </div>
  )
}
