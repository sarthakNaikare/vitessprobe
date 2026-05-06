import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { incidentApi, reportApi } from '../api'
import {
  ArrowLeft, CheckCircle, Clock, Share2,
  FileText, Terminal, Loader2,
  ExternalLink, Copy, X, AlertCircle
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: 'rgba(44, 24, 16, 0.3)'}}>
      <div className="bg-ivory rounded-xl border border-stone-200 shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-parchment">
          <h3 className="text-sm font-semibold text-mahogany font-playfair">Share this incident</h3>
          <button onClick={onClose} className="text-stone-300 hover:text-copper transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 bg-parchment border border-stone-200 rounded-lg px-3 py-2 mb-3">
            <span className="text-xs font-mono text-stone-600 flex-1 truncate">{url}</span>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={copy} className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-stone-200 px-3 py-2 rounded-md hover:bg-amber-50 hover:border-copper text-stone-600 hover:text-copper transition-colors font-mono">
              <Copy size={12} />{copied ? 'Copied!' : 'Copy link'}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-mahogany text-ivory px-3 py-2 rounded-md hover:bg-copper transition-colors font-mono">
              <ExternalLink size={12} />Open page
            </a>
          </div>
          <p className="text-xs text-stone-400 font-mono uppercase tracking-widest mb-2">Share via</p>
          <div className="grid grid-cols-3 gap-2">
            {channels.map(c => (
              <a key={c.label} href={c.href} target="_blank" rel="noreferrer"
                style={{backgroundColor: c.bg}}
                className="text-xs text-white text-center py-2 rounded-md hover:opacity-90 transition-opacity font-medium">
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
    <div className="min-h-screen bg-parchment p-8 flex items-center gap-2 text-stone-400 text-sm font-mono">
      <Loader2 size={14} className="animate-spin text-copper" /> Loading incident...
    </div>
  )
  if (!incident) return (
    <div className="min-h-screen bg-parchment p-8 text-stone-400 text-sm">Incident not found</div>
  )

  return (
    <div className="min-h-screen bg-parchment p-8">
      <div className="max-w-5xl">
        {showShare && (
          <ShareModal token={incident.share_token} title={incident.title} onClose={() => setShowShare(false)} />
        )}

        <button
          onClick={() => navigate('/timeline')}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-copper mb-6 transition-colors font-mono animate-fade-up"
        >
          <ArrowLeft size={13} /> Back to Timeline
        </button>

        <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up" style={{animationDelay: '60ms'}}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-stone-400">
                {TYPE_LABELS[incident.incident_type] || incident.incident_type}
              </span>
              <span className={"badge-" + incident.severity}>{incident.severity}</span>
              <span className={"text-xs font-mono px-1.5 py-0.5 rounded border font-semibold " + (
                incident.status === 'active'
                  ? 'bg-red-50 text-alert border-red-200'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              )}>
                {incident.status}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-mahogany mb-1 font-playfair">{incident.title}</h1>
            <p className="text-sm text-stone-600 leading-relaxed">{incident.summary}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 text-xs border border-stone-200 px-3 py-1.5 rounded-md hover:bg-amber-50 hover:border-copper transition-colors text-stone-500 hover:text-copper font-mono"
            >
              <Share2 size={12} /> Share
            </button>
            {incident.status === 'active' && (
              <button
                onClick={() => markResolved()}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 text-ivory px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors font-mono"
              >
                <CheckCircle size={12} /> Mark Resolved
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-stone-400 font-mono mb-6 pb-6 border-b border-stone-200 animate-fade-up" style={{animationDelay: '120ms'}}>
          <span className="flex items-center gap-1.5">
            <Clock size={11} /> Detected {new Date(incident.detected_at).toLocaleString()}
          </span>
          {incident.duration_seconds && <span>Duration {incident.duration_seconds}s</span>}
          {incident.resolved_at && (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle size={11} /> Resolved {new Date(incident.resolved_at).toLocaleString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 flex flex-col gap-4">
            {incident.causation_graph && (
              <div className="card overflow-hidden animate-fade-up" style={{animationDelay: '180ms'}}>
                <div className="px-5 py-4 border-b border-stone-200 bg-parchment">
                  <h3 className="text-sm font-semibold text-mahogany font-playfair">Causation Graph</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Drag nodes to explore. Click for details. Root cause pulses red.</p>
                </div>
                <div className="p-4 bg-amber-50/30">
                  <ForceGraph
                    nodes={incident.causation_graph.nodes}
                    edges={incident.causation_graph.edges}
                    root_cause_node_id={incident.causation_graph.root_cause_node_id}
                    onNodeClick={setSelectedNode}
                  />
                </div>
                {selectedNode && (
                  <div className="px-5 py-4 border-t border-stone-200 bg-ivory">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold text-mahogany">{selectedNode.component}</span>
                      {selectedNode.is_root_cause && (
                        <span className="text-xs bg-red-100 text-alert border border-red-200 px-2 py-0.5 rounded font-mono font-semibold">ROOT CAUSE</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mb-2">{selectedNode.description}</p>
                    <div className="flex items-center gap-4 text-xs text-stone-400 font-mono">
                      <span>event: {selectedNode.event_type}</span>
                      <span>confidence: {Math.round(selectedNode.confidence * 100)}%</span>
                    </div>
                  </div>
                )}
                <div className="px-5 py-4 border-t border-stone-200 bg-parchment">
                  <p className="text-xs text-stone-400 font-mono mb-2 uppercase tracking-widest">Causal Relationships</p>
                  <div className="flex flex-col gap-1.5">
                    {incident.causation_graph.edges.map((edge: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-stone-500">
                        <span className="font-mono bg-ivory px-1.5 py-0.5 rounded text-mahogany text-xs border border-stone-200">{edge.source}</span>
                        <span className="text-stone-300">→</span>
                        <span className="text-xs text-copper font-mono">{edge.relationship}</span>
                        <span className="text-stone-300">→</span>
                        <span className="font-mono bg-ivory px-1.5 py-0.5 rounded text-mahogany text-xs border border-stone-200">{edge.target}</span>
                        <span className="text-xs text-stone-300 font-mono">({Math.round(edge.confidence * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {incident.recommendations && incident.recommendations.length > 0 && (
              <div className="card overflow-hidden animate-fade-up" style={{animationDelay: '240ms'}}>
                <div className="px-5 py-4 border-b border-stone-200 bg-parchment">
                  <h3 className="text-sm font-semibold text-mahogany font-playfair">Recommendations</h3>
                </div>
                <div className="divide-y divide-stone-100">
                  {incident.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="px-5 py-4 hover:bg-amber-50/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={"text-xs font-mono px-1.5 py-0.5 rounded border font-semibold " + (
                          rec.priority === 'immediate' ? 'bg-red-50 text-alert border-red-200' :
                          rec.priority === 'short_term' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-blue-50 text-blue-600 border-blue-200'
                        )}>{rec.priority}</span>
                        <p className="text-xs font-semibold text-mahogany">{rec.title}</p>
                      </div>
                      <p className="text-xs text-stone-500 mb-2">{rec.description}</p>
                      {rec.vitess_command && (
                        <div className="flex items-start gap-2 bg-mahogany rounded-md px-3 py-2">
                          <Terminal size={11} className="text-copper mt-0.5 flex-shrink-0" />
                          <code className="text-xs text-amber-100 font-mono break-all">{rec.vitess_command}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incident.affected_queries && incident.affected_queries.length > 0 && (
              <div className="card overflow-hidden animate-fade-up" style={{animationDelay: '300ms'}}>
                <div className="px-5 py-4 border-b border-stone-200 bg-parchment">
                  <h3 className="text-sm font-semibold text-mahogany font-playfair">Affected Queries</h3>
                </div>
                <div className="p-5 flex flex-col gap-2">
                  {incident.affected_queries.map((q: string, i: number) => (
                    <div key={i} className="bg-parchment border border-stone-200 rounded-md px-3 py-2">
                      <code className="text-xs font-mono text-mahogany">{q}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="card p-4 animate-fade-up" style={{animationDelay: '180ms'}}>
              <h3 className="text-xs font-semibold text-mahogany mb-3 flex items-center gap-1.5 font-playfair">
                <FileText size={13} className="text-copper" /> Generate RCA Report
              </h3>
              <div className="flex flex-col gap-2 mb-3">
                {(['technical', 'executive', 'mixed'] as const).map(a => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    className={"text-xs px-3 py-1.5 rounded-md border capitalize transition-colors font-mono " + (
                      audience === a
                        ? 'bg-amber-50 border-copper text-copper font-semibold'
                        : 'border-stone-200 text-stone-500 hover:border-copper hover:text-copper bg-ivory'
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <button
                onClick={() => generateReport()}
                disabled={generatingReport}
                className="w-full bg-mahogany text-ivory text-xs py-2 rounded-md hover:bg-copper transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 font-medium tracking-wide"
              >
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </button>
              {reportGenerated && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                  <p className="text-xs text-emerald-700 font-mono mb-1 font-semibold">Report generated</p>
                  <button onClick={() => navigate('/reports')} className="text-xs text-copper hover:underline font-mono">
                    View in Reports
                  </button>
                </div>
              )}
            </div>

            <div className="card p-4 animate-fade-up" style={{animationDelay: '240ms'}}>
              <h3 className="text-xs font-semibold text-mahogany mb-3 font-playfair">Metadata</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'ID', value: incident.id },
                  { label: 'Cluster', value: incident.cluster_id },
                  { label: 'Type', value: incident.incident_type },
                  { label: 'Share token', value: incident.share_token },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-stone-400 font-mono uppercase tracking-widest">{label}</p>
                    <p className="text-xs text-mahogany font-mono break-all">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="fixed bottom-4 right-6 font-playfair italic text-xs text-copper/25 pointer-events-none select-none">
          VitessProbe ✦ Sarthak Naikare
        </p>
      </div>
    </div>
  )
}
