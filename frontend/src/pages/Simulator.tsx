import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { simulatorApi } from '../api'
import { Zap, RotateCcw, ArrowRight, Loader2 } from 'lucide-react'

export default function Simulator() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [shard, setShard] = useState('-40')
  const [result, setResult] = useState<any>(null)

  const { data: scenarios } = useQuery({
    queryKey: ['scenarios'], queryFn: simulatorApi.getScenarios,
  })

  const { mutate: inject, isPending } = useMutation({
    mutationFn: () => simulatorApi.inject(selected!, intensity, shard),
    onSuccess: (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['incidents-all'] })
      queryClient.invalidateQueries({ queryKey: ['cluster-health'] })
    },
  })

  const { mutate: reset, isPending: resetting } = useMutation({
    mutationFn: simulatorApi.reset,
    onSuccess: () => {
      setResult(null)
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['cluster-health'] })
    },
  })

  const intensityColor = intensity >= 8 ? '#C0392B' : intensity >= 5 ? '#B87333' : '#27AE60'
  const intensityLabel = intensity >= 8 ? 'Critical' : intensity >= 5 ? 'High' : intensity >= 3 ? 'Medium' : 'Low'

  return (
    <div className="bg-simulator min-h-screen p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-semibold" style={{color:'#2C1810'}}>Incident Simulator</h1>
          <p className="font-mono text-xs mt-1" style={{color:'#A89880'}}>Inject synthetic failures and watch VitessProbe diagnose them</p>
        </div>
        <button onClick={() => reset()} disabled={resetting}
          className="hover-emboss flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md"
          style={{border:'0.5px solid #E8DDD0',color:'#8B7355',background:'#FFFFFF'}}>
          <RotateCcw size={12} className={resetting ? 'animate-spin' : ''} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Scenarios */}
        <div className="col-span-2 flex flex-col gap-2">
          <p style={{fontSize:10,color:'#A89880',fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Select Scenario</p>
          {(scenarios || []).map((s, i) => (
            <button key={s.id} onClick={() => setSelected(s.id)}
              className="hover-lift text-left px-4 py-3 rounded-lg animate-fade-up"
              style={{
                border: selected===s.id ? '1.5px solid #B87333' : '0.5px solid #E8DDD0',
                background: selected===s.id ? '#FEF3E2' : '#FFFFFF',
                animationDelay: `${i*0.05}s`,
                transition:'all 0.2s ease',
              }}>
              <div className="flex items-center gap-2 mb-0.5">
                <span style={{fontSize:14}}>{s.icon}</span>
                <span className="text-sm font-semibold" style={{color: selected===s.id ? '#B87333' : '#2C1810'}}>{s.name}</span>
              </div>
              <p style={{fontSize:11,color:'#8B7355',marginLeft:22,lineHeight:1.5}}>{s.description}</p>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          {/* Intensity */}
          <div className="card p-4 animate-scale-in" style={{animationDelay:'0.1s'}}>
            <p style={{fontSize:10,color:'#A89880',fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>Intensity</p>
            <div className="text-center mb-3">
              <span style={{fontSize:36,fontWeight:700,color:intensityColor,fontFamily:'Inter'}}>{intensity}</span>
              <span style={{color:'#A89880',fontSize:14}}>/10</span>
              <p style={{fontSize:11,fontFamily:'JetBrains Mono',color:intensityColor,marginTop:2}}>{intensityLabel}</p>
            </div>
            <input type="range" min={1} max={10} value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
              style={{width:'100%',accentColor:'#B87333'}} />
            <div className="flex justify-between" style={{fontSize:9,color:'#D4C4B0',fontFamily:'JetBrains Mono',marginTop:4}}>
              <span>Low</span><span>Critical</span>
            </div>
          </div>

          {/* Target shard */}
          <div className="card p-4 animate-scale-in" style={{animationDelay:'0.15s'}}>
            <p style={{fontSize:10,color:'#A89880',fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Target Shard</p>
            <div className="flex flex-col gap-1.5">
              {['-40','40-80','80-'].map(s => (
                <button key={s} onClick={() => setShard(s)}
                  className="text-xs py-1.5 rounded-md transition-colors"
                  style={{
                    fontFamily:'JetBrains Mono',
                    border: shard===s ? '1.5px solid #B87333' : '0.5px solid #E8DDD0',
                    background: shard===s ? '#FEF3E2' : '#F7F3ED',
                    color: shard===s ? '#B87333' : '#8B7355',
                  }}>
                  shard {s}
                </button>
              ))}
            </div>
          </div>

          {/* Inject */}
          <button onClick={() => inject()} disabled={!selected || isPending}
            className="hover-lift py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 animate-scale-in"
            style={{
              background: selected ? '#2C1810' : '#E8DDD0',
              color: selected ? '#F7F3ED' : '#A89880',
              animationDelay:'0.2s',
              transition:'all 0.2s ease',
              border:'none',
            }}>
            {isPending
              ? <><Loader2 size={15} className="animate-spin" /> Injecting...</>
              : <><Zap size={15} /> Inject Failure</>
            }
          </button>
        </div>
      </div>

      {result && (
        <div className="card p-5 animate-scale-in"
          style={{borderColor:'#B87333',background:'linear-gradient(135deg,#FEF3E2,#FFFBF5)'}}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{color:'#B87333'}}>✓ Incident injected successfully</p>
            <button onClick={() => navigate(`/incidents/${result.incident_id}`)}
              className="hover-lift flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md"
              style={{background:'#2C1810',color:'#F7F3ED',border:'none'}}>
              View incident <ArrowRight size={11} />
            </button>
          </div>
          <p className="font-mono text-xs" style={{color:'#8B7355'}}>{result.message}</p>
          <p style={{fontSize:9,color:'#A89880',fontFamily:'JetBrains Mono',marginTop:4}}>ID: {result.incident_id}</p>
        </div>
      )}
    </div>
  )
}
