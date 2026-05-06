import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { incidentApi } from '../api'
import { AlertTriangle, CheckCircle, Clock, ChevronRight, Filter } from 'lucide-react'
import { RowSkeleton } from '../components/Skeleton'
import type { Incident } from '../types'

const TYPE_LABELS: Record<string, string> = {
  scatter_storm: 'Scatter Storm', tablet_failover: 'Tablet Failover',
  replication_lag: 'Replication Lag', online_ddl_stall: 'Online DDL Stall',
  vtgate_overload: 'VTGate Overload', connection_pool_exhaustion: 'Pool Exhaustion',
  unknown: 'Unknown',
}

const TYPE_COLORS: Record<string, string> = {
  scatter_storm: '#B87333', tablet_failover: '#C0392B',
  replication_lag: '#D4924A', online_ddl_stall: '#8A5520',
  vtgate_overload: '#C0392B', connection_pool_exhaustion: '#B87333',
  unknown: '#A89880',
}

function IncidentCard({ inc, onClick }: { inc: Incident; onClick: () => void }) {
  const dot = TYPE_COLORS[inc.incident_type] || '#A89880'
  return (
    <div onClick={onClick} className="flex gap-4 cursor-pointer group animate-fade-up">
      <div className="flex flex-col items-center flex-shrink-0">
        <div style={{
          width:12, height:12, borderRadius:'50%', background:dot,
          marginTop:4, flexShrink:0,
          boxShadow:`0 0 0 3px rgba(${dot==='#C0392B'?'192,57,43':'184,115,51'},0.15)`,
        }} />
        <div style={{width:1,flex:1,background:'#E8DDD0',marginTop:6}} />
      </div>
      <div className="card hover-lift flex-1 mb-4 p-4 group-hover:border-copper"
        style={{transition:'all 0.2s ease'}}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span style={{fontSize:10,color:'#A89880',fontFamily:'JetBrains Mono'}}>
                {TYPE_LABELS[inc.incident_type]}
              </span>
              {inc.status === 'active' && (
                <span style={{
                  fontSize:9,fontFamily:'JetBrains Mono',padding:'1px 6px',borderRadius:3,
                  background:'#FEF2F2',color:'#C0392B',border:'0.5px solid #FECACA',
                  animation:'pulse 2s infinite',
                }}>LIVE</span>
              )}
            </div>
            <p className="text-sm font-semibold" style={{color:'#2C1810'}}>{inc.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge-${inc.severity}`}>{inc.severity}</span>
            <ChevronRight size={14} style={{color:'#D4C4B0',transition:'color 0.2s'}} className="group-hover:text-copper" />
          </div>
        </div>

        {inc.summary && (
          <p style={{fontSize:11,color:'#8B7355',lineHeight:1.6,marginBottom:10,
            display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {inc.summary}
          </p>
        )}

        <div className="flex items-center gap-4" style={{fontSize:10,color:'#A89880',fontFamily:'JetBrains Mono'}}>
          <span className="flex items-center gap-1">
            <Clock size={9} /> {new Date(inc.detected_at).toLocaleString()}
          </span>
          {inc.duration_seconds && <span>duration {inc.duration_seconds}s</span>}
          {inc.status === 'resolved'
            ? <span className="flex items-center gap-1" style={{color:'#27AE60'}}><CheckCircle size={9} /> resolved</span>
            : <span className="flex items-center gap-1" style={{color:'#C0392B'}}><AlertTriangle size={9} /> active</span>
          }
        </div>

        {inc.causation_graph && (
          <div style={{marginTop:10,paddingTop:10,borderTop:'0.5px solid #F0E8DC'}}>
            <p style={{fontSize:9,color:'#A89880',fontFamily:'JetBrains Mono',marginBottom:6,letterSpacing:'0.06em'}}>CAUSATION CHAIN</p>
            <div className="flex items-center gap-1 flex-wrap">
              {inc.causation_graph.nodes.map((node, i) => (
                <div key={node.id} className="flex items-center gap-1">
                  <span style={{
                    fontSize:9,fontFamily:'JetBrains Mono',padding:'2px 6px',borderRadius:3,
                    background: node.is_root_cause ? '#FEF3E2' : '#F7F3ED',
                    color: node.is_root_cause ? '#B87333' : '#8B7355',
                    border: `0.5px solid ${node.is_root_cause ? '#FCD9A0' : '#E8DDD0'}`,
                    fontWeight: node.is_root_cause ? 600 : 400,
                  }}>
                    {node.component.replace('vttablet-zone1-','').replace('zone1-','')}
                  </span>
                  {i < inc.causation_graph!.nodes.length - 1 && (
                    <span style={{color:'#D4C4B0',fontSize:10}}>→</span>
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
  const [filter, setFilter] = useState<'all'|'active'|'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState('all')

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
    <div className="bg-timeline min-h-screen p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-semibold" style={{color:'#2C1810'}}>Incident Timeline</h1>
          <p className="font-mono text-xs mt-1" style={{color:'#A89880'}}>{incidents?.length ?? 0} total incidents</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={12} style={{color:'#A89880'}} />
          <div className="flex overflow-hidden rounded-md" style={{border:'0.5px solid #E8DDD0'}}>
            {(['all','active','resolved'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 text-xs capitalize transition-colors"
                style={{
                  background: filter===f ? '#2C1810' : '#FFFFFF',
                  color: filter===f ? '#F7F3ED' : '#8B7355',
                }}>
                {f}
              </button>
            ))}
          </div>
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-md"
            style={{border:'0.5px solid #E8DDD0',color:'#8B7355',background:'#FFFFFF',fontFamily:'JetBrains Mono'}}>
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[0,1,2].map(i => <div key={i} className="card p-5"><RowSkeleton /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{color:'#A89880'}}>
          <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No incidents match the current filter</p>
        </div>
      ) : (
        filtered.map((inc, i) => (
          <div key={inc.id} style={{animationDelay:`${i*0.06}s`}}>
            <IncidentCard inc={inc} onClick={() => navigate(`/incidents/${inc.id}`)} />
          </div>
        ))
      )}
    </div>
  )
}
