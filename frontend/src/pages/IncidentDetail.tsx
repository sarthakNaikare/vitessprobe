import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { incidentApi, reportApi } from '../api'
import {
  ArrowLeft, CheckCircle, Clock, Share2,
  FileText, Terminal, Loader2,
  ExternalLink, Copy, X
} from 'lucide-react'
import ForceGraph from '../components/ForceGraph'

const TYPE_LABELS: Record<string, string> = {
  scatter_storm: 'Scatter Storm', tablet_failover: 'Tablet Failover',
  replication_lag: 'Replication Lag', online_ddl_stall: 'Online DDL Stall',
  vtgate_overload: 'VTGate Overload', connection_pool_exhaustion: 'Pool Exhaustion',
}

function ShareModal({ token, onClose, title }: { token: string; onClose: () => void; title: string }) {
  const [copied, setCopied] = useState(false)
  const url = window.location.origin + '/share/incident/' + token
  const text = 'VitessProbe Incident: ' + title

  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const channels = [
    { label: 'WhatsApp', bg: '#25D366', href: 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url) },
    { label: 'Twitter/X', bg: '#000000', href: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url) },
    { label: 'LinkedIn', bg: '#0A66C2', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) },
    { label: 'Email', bg: '#EA4335', href: 'mailto:?subject=' + encodeURIComponent('VitessProbe Incident') + '&body=' + encodeURIComponent(text + '\n' + url) },
    { label: 'Telegram', bg: '#2AABEE', href: 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text) },
    { label: 'Slack', bg: '#4A154B', href: 'https://slack.com' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: 'rgba(0,0,0,0.2)'}}>
      <div className="bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="text-sm font-medium text-stone-800">Share this incident</h3>
          <button onClick={onClose} className="text-stone-300 hover:text-stone-500"><X size={16} /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 mb-3">
            <span className="text-xs font-mono text-stone-600 flex-1 truncate">{url}</span>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={copy} className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-stone-200 px-3 py-2 rounded-md hover:bg-stone-50 text-stone-600">
              <Copy size={12} />{copied ? 'Copied!' : 'Copy link'}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700">
              <ExternalLink size={12} />Open page
            </a>
          </div>
          <p className="text-2xs text-stone-400 font-mono uppercase tracking-wide mb-2">Share via</p>
          <div className="grid grid-cols-3 gap-2">
            {channels.map(c => (
              <a key={c.label} href={c.href} target="_blank" rel="noreferrer"
                style={{backgroundColor: c.bg}}
                className="text-xs text-white text-center py-2 rounded-md hover:opacity-90 transition-opacity">
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [audience, setAudience] = useState<'technical' | 'executive' | 'mixed'>('technical')
  const [reportGenerated, setReportGenerated] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [showShare, setShowShare] = useState(false)

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentApi.get(id!),
  })

  const { mutate: generateReport, isPending: generatingReport } = useMutation({
    mutationFn: () => reportApi.generate(id!, audience),
    onSuccess: setReportGenerated,
  })

  const { mutate: markResolved } = useMutation({
    mutationFn: () => incidentApi.updateStatus(id!, 'resolved'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })

  if (isLoading) return (
    <div className="p-8 flex items-center gap-2 text-stone-400 text-sm font-mono">
      <Loader2 size={14} className="animate-spin" /> Loading incident...
    </div>
  )
  if (!incident) return (
    <div className="p-8 text-stone-400 text-sm">Incident not found</div>
  )

  return (
    <div className="p-8 max-w-5xl">
      {showShare && (
        <ShareModal token={incident.share_token} title={incident.title} onClose={() => setShowShare(false)} />
      )}

      <button
        onClick={() => navigate('/timeline')}
        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 mb-6 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Timeline
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-stone-400">
              {TYPE_LABELS[incident.incident_type] || incident.incident_type}
            </span>
            <span className={"badge-" + incident.severity}>{incident.severity}</span>
            <span className={"text-2xs font-mono px-1.5 py-0.5 rounded border " + (
              incident.status === 'active'
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-green-50 text-green-600 border-green-200'
            )}>
              {incident.status}
            </span>
          </div>
          <h1 className="text-xl font-semibold text-stone-800 mb-1">{incident.title}</h1>
          <p className="text-sm text-stone-500 leading-relaxed">{incident.summary}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 text-xs border border-stone-200 px-3 py-1.5 rounded-md hover:bg-stone-50 transition-colors text-stone-500"
          >
            <Share2 size={12} /> Share
          </button>
          {incident.status === 'active' && (
            <button
              onClick={() => markResolved()}
              className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={12} /> Mark Resolved
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs text-stone-400 font-mono mb-6 pb-6 border-b border-stone-200">
        <span className="flex items-center gap-1.5">
          <Clock size={11} /> Detected {new Date(incident.detected_at).toLocaleString()}
        </span>
        {incident.duration_seconds && <span>Duration {incident.duration_seconds}s</span>}
        {incident.resolved_at && (
          <span className="flex items-center gap-1.5 text-green-600">
            <CheckCircle size={11} /> Resolved {new Date(incident.resolved_at).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 flex flex-col gap-4">
          {incident.causation_graph && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="text-sm font-medium text-stone-700">Causation Graph</h3>
                <p className="text-xs text-stone-400 mt-0.5">Drag nodes to explore. Click for details. Root cause pulses red.</p>
              </div>
              <div className="p-4 bg-stone-50">
                <ForceGraph
                  nodes={incident.causation_graph.nodes}
                  edges={incident.causation_graph.edges}
                  root_cause_node_id={incident.causation_graph.root_cause_node_id}
                  onNodeClick={setSelectedNode}
                />
              </div>
              {selectedNode && (
                <div className="px-5 py-4 border-t border-stone-100 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium text-stone-700">{selectedNode.component}</span>
                    {selectedNode.is_root_cause && (
                      <span className="text-2xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded font-mono">ROOT CAUSE</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mb-2">{selectedNode.description}</p>
                  <div className="flex items-center gap-4 text-2xs text-stone-400 font-mono">
                    <span>event: {selectedNode.event_type}</span>
                    <span>confidence: {Math.round(selectedNode.confidence * 100)}%</span>
                  </div>
                </div>
              )}
              <div className="px-5 py-4 border-t border-stone-100">
                <p className="text-2xs text-stone-400 font-mono mb-2">CAUSAL RELATIONSHIPS</p>
                <div className="flex flex-col gap-1.5">
                  {incident.causation_graph.edges.map((edge: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 text-2xs">{edge.source}</span>
                      <span className="text-stone-300">to</span>
                      <span className="text-2xs text-indigo-500 font-mono">{edge.relationship}</span>
                      <span className="text-stone-300">to</span>
                      <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 text-2xs">{edge.target}</span>
                      <span className="text-2xs text-stone-300 font-mono">({Math.round(edge.confidence * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {incident.recommendations && incident.recommendations.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="text-sm font-medium text-stone-700">Recommendations</h3>
              </div>
              <div className="divide-y divide-stone-100">
                {incident.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={"text-2xs font-mono px-1.5 py-0.5 rounded border " + (
                        rec.priority === 'immediate' ? 'bg-red-50 text-red-600 border-red-200' :
                        rec.priority === 'short_term' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        'bg-blue-50 text-blue-600 border-blue-200'
                      )}>{rec.priority}</span>
                      <p className="text-xs font-medium text-stone-700">{rec.title}</p>
                    </div>
                    <p className="text-xs text-stone-500 mb-2">{rec.description}</p>
                    {rec.vitess_command && (
                      <div className="flex items-start gap-2 bg-stone-900 rounded-md px-3 py-2">
                        <Terminal size={11} className="text-stone-400 mt-0.5 flex-shrink-0" />
                        <code className="text-2xs text-green-400 font-mono break-all">{rec.vitess_command}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {incident.affected_queries && incident.affected_queries.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="text-sm font-medium text-stone-700">Affected Queries</h3>
              </div>
              <div className="p-5 flex flex-col gap-2">
                {incident.affected_queries.map((q: string, i: number) => (
                  <div key={i} className="bg-stone-50 border border-stone-200 rounded-md px-3 py-2">
                    <code className="text-xs font-mono text-stone-600">{q}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="text-xs font-medium text-stone-700 mb-3 flex items-center gap-1.5">
              <FileText size={13} /> Generate RCA Report
            </h3>
            <div className="flex flex-col gap-2 mb-3">
              {(['technical', 'executive', 'mixed'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={"text-xs px-3 py-1.5 rounded-md border capitalize transition-colors " + (
                    audience === a
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            <button
              onClick={() => generateReport()}
              disabled={generatingReport}
              className="w-full bg-indigo-600 text-white text-xs py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {generatingReport ? 'Generating...' : 'Generate Report'}
            </button>
            {reportGenerated && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-2xs text-green-700 font-mono mb-1">Report generated</p>
                <button onClick={() => navigate('/reports')} className="text-2xs text-indigo-600 hover:underline">
                  View in Reports
                </button>
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-medium text-stone-700 mb-3">Metadata</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'ID', value: incident.id },
                { label: 'Cluster', value: incident.cluster_id },
                { label: 'Type', value: incident.incident_type },
                { label: 'Share token', value: incident.share_token },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-2xs text-stone-400 font-mono">{label}</p>
                  <p className="text-xs text-stone-600 font-mono break-all">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
