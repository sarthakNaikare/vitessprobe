import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { incidentApi } from '../api'
import { AlertTriangle, CheckCircle, Clock, ChevronRight, Filter } from 'lucide-react'
import type { Incident } from '../types'

const TYPE_LABELS: Record<string, string> = {
  scatter_storm: 'Scatter Storm',
  tablet_failover: 'Tablet Failover',
  replication_lag: 'Replication Lag',
  online_ddl_stall: 'Online DDL Stall',
  vtgate_overload: 'VTGate Overload',
  connection_pool_exhaustion: 'Pool Exhaustion',
  vreplication_error: 'VReplication Error',
  unknown: 'Unknown',
}

const TYPE_COLORS: Record<string, string> = {
  scatter_storm: 'bg-orange-400',
  tablet_failover: 'bg-red-500',
  replication_lag: 'bg-yellow-400',
  online_ddl_stall: 'bg-purple-400',
  vtgate_overload: 'bg-red-400',
  connection_pool_exhaustion: 'bg-amber-400',
  unknown: 'bg-stone-400',
}

function IncidentCard({ inc, onClick }: { inc: Incident; onClick: () => void }) {
  const dot = TYPE_COLORS[inc.incident_type] || 'bg-stone-400'
  return (
    <div
      onClick={onClick}
      className="flex gap-4 cursor-pointer group"
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${dot} ring-2 ring-white`} />
        <div className="w-px flex-1 bg-stone-200 mt-1" />
      </div>

      {/* Card */}
      <div className="card p-4 mb-4 flex-1 group-hover:border-indigo-200 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xs font-mono text-stone-400">
                {TYPE_LABELS[inc.incident_type] || inc.incident_type}
              </span>
              {inc.status === 'active' && (
                <span className="text-2xs font-mono bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-stone-800">{inc.title}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`badge-${inc.severity}`}>{inc.severity}</span>
            <ChevronRight size={14} className="text-stone-300 group-hover:text-indigo-400 transition-colors" />
          </div>
        </div>

        {inc.summary && (
          <p className="text-xs text-stone-500 leading-relaxed mb-3 line-clamp-2">{inc.summary}</p>
        )}

        <div className="flex items-center gap-4 text-2xs text-stone-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {new Date(inc.detected_at).toLocaleString()}
          </span>
          {inc.duration_seconds && (
            <span>duration {inc.duration_seconds}s</span>
          )}
          {inc.status === 'resolved'
            ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={10} /> resolved</span>
            : <span className="flex items-center gap-1 text-red-500"><AlertTriangle size={10} /> active</span>
          }
        </div>

        {/* Causation graph preview */}
        {inc.causation_graph && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <p className="text-2xs text-stone-400 font-mono mb-1.5">CAUSATION CHAIN</p>
            <div className="flex items-center gap-1 flex-wrap">
              {inc.causation_graph.nodes.map((node, i) => (
                <div key={node.id} className="flex items-center gap-1">
                  <span className={`text-2xs font-mono px-1.5 py-0.5 rounded border ${
                    node.is_root_cause
                      ? 'bg-red-50 text-red-600 border-red-200 font-medium'
                      : 'bg-stone-50 text-stone-500 border-stone-200'
                  }`}>
                    {node.component.replace('vttablet-', '').replace('zone1-', '')}
                  </span>
                  {i < inc.causation_graph!.nodes.length - 1 && (
                    <span className="text-stone-300 text-2xs">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Timeline() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents-all'],
    queryFn: () => incidentApi.list({ limit: 50 }),
    refetchInterval: 15000,
  })

  const filtered = (incidents || []).filter(i => {
    if (filter === 'active' && i.status !== 'active') return false
    if (filter === 'resolved' && i.status !== 'resolved') return false
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false
    return true
  })

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Incident Timeline</h1>
          <p className="text-sm text-stone-400 font-mono mt-0.5">
            {incidents?.length ?? 0} total incidents
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-stone-400" />
          <div className="flex border border-stone-200 rounded-md overflow-hidden text-xs">
            {(['all', 'active', 'resolved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  filter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-stone-500 hover:bg-stone-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="text-xs border border-stone-200 rounded-md px-2 py-1.5 text-stone-500 bg-white"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <p className="text-stone-400 text-sm font-mono">Loading incidents...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No incidents match the current filter</p>
        </div>
      ) : (
        <div>
          {filtered.map(inc => (
            <IncidentCard
              key={inc.id}
              inc={inc}
              onClick={() => navigate(`/incidents/${inc.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
