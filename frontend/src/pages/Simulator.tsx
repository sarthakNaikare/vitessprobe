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
    queryKey: ['scenarios'],
    queryFn: simulatorApi.getScenarios,
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
      queryClient.invalidateQueries({ queryKey: ['incidents-all'] })
      queryClient.invalidateQueries({ queryKey: ['cluster-health'] })
    },
  })

  const intensityColor = intensity >= 8 ? 'text-red-600' : intensity >= 5 ? 'text-yellow-600' : 'text-green-600'
  const intensityLabel = intensity >= 8 ? 'Critical' : intensity >= 5 ? 'High' : intensity >= 3 ? 'Medium' : 'Low'

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Incident Simulator</h1>
          <p className="text-sm text-stone-400 font-mono mt-0.5">
            Inject synthetic failures and watch VitessProbe diagnose them
          </p>
        </div>
        <button
          onClick={() => reset()}
          disabled={resetting}
          className="flex items-center gap-1.5 text-xs border border-stone-200 px-3 py-1.5 rounded-md hover:bg-stone-50 transition-colors text-stone-500"
        >
          <RotateCcw size={12} className={resetting ? 'animate-spin' : ''} />
          Reset simulated incidents
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Scenario selector */}
        <div className="col-span-2">
          <p className="text-xs font-mono text-stone-400 uppercase tracking-wide mb-3">Select Scenario</p>
          <div className="flex flex-col gap-2">
            {(scenarios || []).map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`text-left px-4 py-3 rounded-lg border transition-all ${
                  selected === s.id
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-stone-200 hover:border-stone-300 text-stone-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span>{s.icon}</span>
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <p className="text-xs text-current opacity-60 ml-6">{s.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {/* Intensity */}
          <div className="card p-4">
            <p className="text-xs font-mono text-stone-400 uppercase tracking-wide mb-3">Intensity</p>
            <div className="text-center mb-3">
              <span className={`text-3xl font-semibold ${intensityColor}`}>{intensity}</span>
              <span className="text-stone-400 text-sm">/10</span>
              <p className={`text-xs font-mono mt-0.5 ${intensityColor}`}>{intensityLabel}</p>
            </div>
            <input
              type="range" min={1} max={10} value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-2xs text-stone-300 font-mono mt-1">
              <span>Low</span><span>Critical</span>
            </div>
          </div>

          {/* Target shard */}
          <div className="card p-4">
            <p className="text-xs font-mono text-stone-400 uppercase tracking-wide mb-2">Target Shard</p>
            <div className="flex flex-col gap-1.5">
              {['-40', '40-80', '80-'].map(s => (
                <button
                  key={s}
                  onClick={() => setShard(s)}
                  className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${
                    shard === s
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  shard {s}
                </button>
              ))}
            </div>
          </div>

          {/* Inject button */}
          <button
            onClick={() => inject()}
            disabled={!selected || isPending}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
          >
            {isPending
              ? <><Loader2 size={15} className="animate-spin" /> Injecting...</>
              : <><Zap size={15} /> Inject Failure</>
            }
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card p-5 border-indigo-200 bg-indigo-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-indigo-800">✓ Incident injected successfully</p>
            <button
              onClick={() => navigate(`/incidents/${result.incident_id}`)}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
            >
              View incident <ArrowRight size={11} />
            </button>
          </div>
          <p className="text-xs text-indigo-600 font-mono">{result.message}</p>
          <p className="text-2xs text-indigo-400 font-mono mt-1">ID: {result.incident_id}</p>
        </div>
      )}
    </div>
  )
}
