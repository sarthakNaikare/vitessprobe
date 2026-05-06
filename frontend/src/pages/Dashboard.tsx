import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clusterApi, incidentApi, tabletApi, queryApi } from '../api'
import { AlertTriangle, CheckCircle, Database, Zap, ArrowRight, RefreshCw, TrendingUp, Clock } from 'lucide-react'
import { CardSkeleton, RowSkeleton } from '../components/Skeleton'

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#27AE60' : score >= 60 ? '#B87333' : '#C0392B'
  const r = 38, cx = 46, cy = 46, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={92} height={92}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E8DDD0" strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{transition:'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)'}}
      />
      <text x={cx} y={cy-4} textAnchor="middle" fontSize={20} fontWeight={600} fill={color} fontFamily="Inter">{score}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize={9} fill="#8B7355" fontFamily="Inter">
        {score >= 80 ? 'Healthy' : score >= 60 ? 'Degraded' : 'Critical'}
      </text>
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: health, isLoading: hLoading, refetch } = useQuery({
    queryKey: ['cluster-health'], queryFn: clusterApi.getHealth, refetchInterval: 15000,
  })
  const { data: incidents, isLoading: iLoading } = useQuery({
    queryKey: ['incidents'], queryFn: () => incidentApi.list({ limit: 5 }), refetchInterval: 15000,
  })
  const { data: tablets, isLoading: tLoading } = useQuery({
    queryKey: ['tablets'], queryFn: tabletApi.list, refetchInterval: 15000,
  })
  const { data: qStats } = useQuery({ queryKey: ['query-stats'], queryFn: queryApi.getStats })

  const resolvedCount = incidents?.filter(i => i.status === 'resolved').length || 0

  return (
    <div className="bg-dashboard min-h-screen p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-semibold" style={{color:'#2C1810'}}>Cluster Overview</h1>
          <p className="font-mono text-xs mt-1" style={{color:'#A89880'}}>commerce keyspace · 3 shards · demo-cluster-001</p>
        </div>
        <button onClick={() => refetch()} className="hover-emboss flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md"
          style={{border:'0.5px solid #E8DDD0',color:'#8B7355',background:'#FFFFFF'}}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {hLoading ? (
          [0,1,2,3].map(i => <CardSkeleton key={i} />)
        ) : (
          <>
            <div className="card hover-lift animate-fade-up" style={{padding:'20px 22px',display:'flex',alignItems:'center',gap:16,animationDelay:'0s'}}>
              <ScoreRing score={health?.overall_score ?? 0} />
              <div>
                <p style={{fontSize:10,color:'#8B7355',fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Health Score</p>
                <p style={{fontSize:12,color:'#6B5540'}}>
                  {(health?.overall_score ?? 0) >= 80 ? '✓ Nominal' : (health?.overall_score ?? 0) >= 60 ? '⚠ Degraded' : '✕ Critical'}
                </p>
              </div>
            </div>

            {[
              { label:'Active Incidents',   value: health?.active_incidents ?? 0,  sub:`${resolvedCount} resolved recently`,  danger:(health?.active_incidents??0)>0,  delay:'0.08s' },
              { label:'Scatter Query Rate', value:`${Math.round((health?.scatter_query_rate??0)*100)}%`, sub:`${qStats?.scatter_fingerprints??0} of ${qStats?.total_fingerprints??0} patterns`, danger:(health?.scatter_query_rate??0)>0.3, delay:'0.16s' },
              { label:'Max Replica Lag',    value:`${health?.max_replication_lag_s??0}s`, sub:`${health?.tablets_healthy??0}/${health?.tablets_total??0} tablets healthy`, danger:(health?.max_replication_lag_s??0)>10, delay:'0.24s' },
            ].map(({ label, value, sub, danger, delay }) => (
              <div key={label} className="card hover-lift animate-fade-up" style={{padding:'20px 22px',animationDelay:delay}}>
                <p style={{fontSize:10,color:'#8B7355',fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>{label}</p>
                <p style={{fontSize:28,fontWeight:600,color:danger?'#C0392B':'#2C1810',marginBottom:4}}>{value}</p>
                <p style={{fontSize:11,color:'#A89880'}}>{sub}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Incidents */}
        <div className="card animate-fade-up" style={{animationDelay:'0.2s'}}>
          <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'0.5px solid #F0E8DC'}}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} style={{color:'#B87333'}} />
              <span className="font-semibold text-sm" style={{color:'#2C1810'}}>Recent Incidents</span>
            </div>
            <button onClick={() => navigate('/timeline')} className="flex items-center gap-1 text-xs hover-glow px-2 py-1 rounded" style={{color:'#B87333'}}>
              View all <ArrowRight size={10} />
            </button>
          </div>
          {iLoading ? (
            [0,1,2,3].map(i => <RowSkeleton key={i} />)
          ) : (
            incidents?.slice(0,5).map((inc, i) => (
              <div key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)}
                className="hover-emboss cursor-pointer px-5 py-3.5 animate-slide-right"
                style={{borderBottom:'0.5px solid #F7F3ED', animationDelay:`${0.25+i*0.06}s`}}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-xs font-medium flex-1" style={{color:'#2C1810',lineHeight:1.4}}>{inc.title}</p>
                  <span className={`badge-${inc.severity}`}>{inc.severity}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{
                    fontSize:10,fontFamily:'JetBrains Mono',padding:'1px 6px',borderRadius:3,
                    background:inc.status==='active'?'#FEF2F2':'#F0FDF4',
                    color:inc.status==='active'?'#C0392B':'#166534',
                    border:`0.5px solid ${inc.status==='active'?'#FECACA':'#BBF7D0'}`
                  }}>{inc.status}</span>
                  <span style={{fontSize:10,color:'#A89880',fontFamily:'JetBrains Mono'}}>{new Date(inc.detected_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tablets */}
        <div className="card animate-fade-up" style={{animationDelay:'0.28s'}}>
          <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'0.5px solid #F0E8DC'}}>
            <div className="flex items-center gap-2">
              <Database size={13} style={{color:'#B87333'}} />
              <span className="font-semibold text-sm" style={{color:'#2C1810'}}>Tablet Health</span>
            </div>
            <button onClick={() => navigate('/tablets')} className="flex items-center gap-1 text-xs hover-glow px-2 py-1 rounded" style={{color:'#B87333'}}>
              Inspect <ArrowRight size={10} />
            </button>
          </div>
          {tLoading ? (
            [0,1,2,3,4,5].map(i => <RowSkeleton key={i} />)
          ) : (
            tablets?.map((t, i) => (
              <div key={t.id} className="hover-emboss px-5 py-3 animate-slide-right"
                style={{borderBottom:'0.5px solid #F7F3ED',animationDelay:`${0.3+i*0.04}s`}}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {t.is_healthy
                      ? <CheckCircle size={12} style={{color:'#27AE60'}} />
                      : <AlertTriangle size={12} style={{color:'#C0392B'}} />
                    }
                    <span className="text-xs font-mono font-medium" style={{color:'#2C1810'}}>{t.tablet_alias}</span>
                    <span style={{
                      fontSize:9,fontFamily:'JetBrains Mono',padding:'1px 5px',borderRadius:3,
                      background:t.tablet_type==='primary'?'rgba(184,115,51,0.1)':'rgba(44,24,16,0.06)',
                      color:t.tablet_type==='primary'?'#B87333':'#8B7355',
                      border:`0.5px solid ${t.tablet_type==='primary'?'rgba(184,115,51,0.3)':'#E8DDD0'}`
                    }}>{t.tablet_type}</span>
                  </div>
                  <div className="text-right">
                    <p style={{fontSize:11,fontFamily:'JetBrains Mono',color:t.replication_lag_seconds>10?'#C0392B':'#8B7355'}}>
                      {t.tablet_type==='primary'?'— primary':`lag ${t.replication_lag_seconds.toFixed(1)}s`}
                    </p>
                    <p style={{fontSize:10,color:'#A89880',fontFamily:'JetBrains Mono'}}>pool {t.connection_pool_pct}%</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon:Zap,        label:'Inject a Failure',      sub:'Simulate VTTablet crash, scatter storm, or replication lag', to:'/simulator', delay:'0.36s' },
          { icon:TrendingUp, label:'Query Intelligence',    sub:'Find scatter queries and analyze execution plan risks',       to:'/queries',   delay:'0.42s' },
          { icon:Clock,      label:'Generate RCA Report',   sub:'Turn any incident into a downloadable post-mortem',          to:'/reports',   delay:'0.48s' },
        ].map(({ icon: Icon, label, sub, to, delay }) => (
          <button key={to} onClick={() => navigate(to)}
            className="card hover-lift text-left p-5 animate-scale-in"
            style={{animationDelay:delay}}>
            <div style={{width:32,height:32,background:'rgba(184,115,51,0.1)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
              <Icon size={15} style={{color:'#B87333'}} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{color:'#2C1810'}}>{label}</p>
            <p style={{fontSize:11,color:'#A89880',lineHeight:1.5}}>{sub}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
