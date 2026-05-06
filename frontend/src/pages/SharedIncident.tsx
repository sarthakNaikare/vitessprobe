import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { incidentApi } from '../api'
import { Activity, Clock, CheckCircle, AlertTriangle, Terminal } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  scatter_storm: 'Scatter Storm', tablet_failover: 'Tablet Failover',
  replication_lag: 'Replication Lag', online_ddl_stall: 'Online DDL Stall',
  vtgate_overload: 'VTGate Overload', connection_pool_exhaustion: 'Pool Exhaustion',
}

export default function SharedIncident() {
  const { token } = useParams<{ token: string }>()
  const { data: incident, isLoading, isError } = useQuery({
    queryKey: ['shared-incident', token],
    queryFn: () => incidentApi.getByToken(token!),
  })

  if (isLoading) return (
    <div className="min-h-screen bg-canvas-100 flex items-center justify-center">
      <p className="text-stone-400 text-sm font-mono">Loading incident...</p>
    </div>
  )

  if (isError || !incident) return (
    <div className="min-h-screen bg-canvas-100 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle size={32} className="text-stone-300 mx-auto mb-3" />
        <p className="text-stone-500 text-sm">Incident not found</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-canvas-100">
      <header className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="font-semibold text-stone-800 text-sm">VitessProbe</span>
          <span className="text-stone-300 mx-2">·</span>
          <span className="text-xs text-stone-400 font-mono">Shared Incident Report</span>
        </div>
        <span className="text-2xs font-mono text-stone-400 bg-stone-100 px-2 py-1 rounded border">
          Read-only · Public link
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono text-stone-400">
              {TYPE_LABELS[incident.incident_type] || incident.incident_type}
            </span>
            <span className={`badge-${incident.severity}`}>{incident.severity}</span>
            <span className={`text-2xs font-mono px-1.5 py-0.5 rounded border ${
              incident.status === 'active'
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-green-50 text-green-600 border-green-200'
            }`}>{incident.status}</span>
          </div>
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">{incident.title}</h1>
          <p className="text-stone-500 leading-relaxed mb-4">{incident.summary}</p>
          <div className="flex items-center gap-6 text-xs text-stone-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Clock size={11} /> {new Date(incident.detected_at).toLocaleString()}
            </span>
            {incident.duration_seconds && <span>Duration: {incident.duration_seconds}s</span>}
            {incident.resolved_at && (
              <span className="flex items-center gap-1.5 text-green-600">
                <CheckCircle size={11} /> Resolved {new Date(incident.resolved_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {incident.causation_graph && (
          <div className="card p-6 mb-6">
            <h2 className="text-sm font-semibold text-stone-700 mb-4">Causation Chain</h2>
            <div className="flex flex-col gap-3">
              {incident.causation_graph.nodes.map((node, i) => (
                <div key={node.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                      node.is_root_cause ? 'bg-red-500' : 'bg-indigo-300'
                    }`} />
                    {i < incident.causation_graph!.nodes.length - 1 && (
                      <div className="w-px flex-1 bg-stone-200 mt-1" />
                    )}
                  </div>
                  <div className={`flex-1 pb-3 ${
                    node.is_root_cause ? 'bg-red-50 border border-red-100 rounded-lg p-3 -mt-0.5' : ''
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-medium text-stone-700">
                        {node.component}
                      </span>
                      {node.is_root_cause && (
                        <span className="text-2xs bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-mono">
                          ROOT CAUSE
                        </span>
                      )}
                      <span className="text-2xs text-stone-400 font-mono">
                        {Math.round(node.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">{node.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {incident.recommendations && incident.recommendations.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="text-sm font-semibold text-stone-700 mb-4">Recommendations</h2>
            <div className="flex flex-col gap-4">
              {incident.recommendations.map((r: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-2xs font-mono px-1.5 py-0.5 rounded border ${
                      r.priority === 'immediate' ? 'bg-red-50 text-red-600 border-red-200' :
                      r.priority === 'short_term' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                      'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>{r.priority}</span>
                    <p className="text-xs font-medium text-stone-700">{r.title}</p>
                  </div>
                  <p className="text-xs text-stone-500 mb-2">{r.description}</p>
                  {r.vitess_command && (
                    <div className="flex items-start gap-2 bg-stone-900 rounded-md px-3 py-2">
                      <Terminal size={11} className="text-stone-400 mt-0.5 flex-shrink-0" />
                      <code className="text-2xs text-green-400 font-mono break-all">
                        {r.vitess_command}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-stone-400 font-mono">
            Generated by VitessProbe · Autonomous Vitess cluster intelligence
          </p>
          <a href="/" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
            Try VitessProbe
          </a>
        </div>
      </div>
    </div>
  )
}
