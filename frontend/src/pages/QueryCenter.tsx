import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryApi } from '../api'
import { Search, AlertTriangle, CheckCircle, ArrowUpDown, Zap } from 'lucide-react'

export default function QueryCenter() {
  const [scatterOnly, setScatterOnly] = useState(false)
  const [sortBy, setSortBy] = useState('count')
  const [analyzeText, setAnalyzeText] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)

  const { data: queries } = useQuery({
    queryKey: ['queries', scatterOnly, sortBy],
    queryFn: () => queryApi.list({ scatter_only: scatterOnly, sort_by: sortBy }),
  })
  const { data: stats } = useQuery({
    queryKey: ['query-stats'],
    queryFn: queryApi.getStats,
  })

  const handleAnalyze = async () => {
    if (!analyzeText.trim()) return
    const result = await queryApi.analyze(analyzeText)
    setAnalysis(result)
  }

  const statCards = [
    { label: 'Total Patterns', value: stats?.total_fingerprints ?? 0, sub: 'unique query fingerprints', danger: false },
    { label: 'Scatter Queries', value: stats?.scatter_fingerprints ?? 0, sub: `${stats?.scatter_pct ?? 0}% of patterns`, danger: (stats?.scatter_pct ?? 0) > 30 },
    { label: 'Total Executions', value: (stats?.total_query_count ?? 0).toLocaleString(), sub: 'across all patterns', danger: false },
    { label: 'Avg P99 Latency', value: `${stats?.avg_p99_ms ?? 0}ms`, sub: 'across all queries', danger: false },
  ]

  return (
    <div className="bg-queries min-h-screen p-8">
      <div className="max-w-6xl">

        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-3 mb-1">
            <Zap size={18} className="text-copper" />
            <h1 className="font-playfair text-2xl text-mahogany">Query Intelligence</h1>
          </div>
          <p className="text-sm font-mono text-stone-400 ml-7">
            Scatter query detection from VTGate /debug/queryz
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map(({ label, value, sub, danger }, i) => (
            <div key={label} className="card p-4 hover-lift animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">{label}</p>
              <p className={`text-2xl font-semibold font-playfair mb-0.5 ${danger ? 'text-alert' : 'text-mahogany'}`}>{value}</p>
              <p className="text-xs text-stone-400">{sub}</p>
            </div>
          ))}
        </div>

        <div className="card p-5 mb-6 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <h3 className="text-sm font-medium text-mahogany mb-3 flex items-center gap-2 font-playfair">
            <Search size={14} className="text-copper" />
            Analyze a Query for Scatter Risk
          </h3>
          <div className="flex gap-2">
            <input
              value={analyzeText}
              onChange={e => setAnalyzeText(e.target.value)}
              placeholder="SELECT * FROM order_items WHERE customer_id = :id"
              className="flex-1 text-xs font-mono border border-stone-200 rounded-md px-3 py-2 bg-parchment focus:outline-none focus:border-copper placeholder-stone-300"
            />
            <button onClick={handleAnalyze} className="bg-mahogany text-ivory text-xs px-5 py-2 rounded-md hover:bg-copper transition-colors font-medium tracking-wide">
              Analyze
            </button>
          </div>
          {analysis && (
            <div className={`mt-3 p-3 rounded-md border animate-scale-in ${
              analysis.scatter_risk_label === 'high' ? 'bg-red-50 border-red-200' :
              analysis.scatter_risk_label === 'medium' ? 'bg-amber-50 border-amber-200' :
              'bg-emerald-50 border-emerald-200'
            }`}>
              <span className={`text-xs font-mono font-semibold ${
                analysis.scatter_risk_label === 'high' ? 'text-alert' :
                analysis.scatter_risk_label === 'medium' ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                Scatter risk: {analysis.scatter_risk_label.toUpperCase()} ({Math.round(analysis.scatter_risk * 100)}%)
              </span>
              <p className="text-xs text-stone-600 mt-1">{analysis.explanation}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <button
            onClick={() => setScatterOnly(!scatterOnly)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors font-mono ${
              scatterOnly ? 'bg-red-50 border-red-300 text-alert font-semibold' : 'bg-ivory border-stone-200 text-stone-500 hover:border-copper hover:text-copper'
            }`}
          >
            {scatterOnly ? '✓ ' : ''}Scatter Only
          </button>
          <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
            <ArrowUpDown size={11} /> Sort by:
          </div>
          {[
            { value: 'count', label: 'Executions' },
            { value: 'scatter_ratio', label: 'Scatter Ratio' },
            { value: 'latency_p99', label: 'P99 Latency' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors font-mono ${
                sortBy === opt.value ? 'bg-amber-50 border-copper text-copper font-semibold' : 'bg-ivory border-stone-200 text-stone-500 hover:border-copper hover:text-copper'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden animate-fade-up" style={{ animationDelay: '360ms' }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-parchment">
                <th className="px-4 py-3 text-left font-medium text-stone-500 tracking-wide">Query Pattern</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 tracking-wide">Plan</th>
                <th className="px-4 py-3 text-right font-medium text-stone-500 tracking-wide">Shards</th>
                <th className="px-4 py-3 text-right font-medium text-stone-500 tracking-wide">Count</th>
                <th className="px-4 py-3 text-right font-medium text-stone-500 tracking-wide">P50</th>
                <th className="px-4 py-3 text-right font-medium text-stone-500 tracking-wide">P99</th>
                <th className="px-4 py-3 text-center font-medium text-stone-500 tracking-wide">Scatter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(queries || []).map((q) => (
                <tr key={q.id} className="hover:bg-amber-50/40 transition-colors group">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-mono text-mahogany truncate group-hover:text-copper transition-colors" title={q.query_pattern}>{q.query_pattern}</p>
                    <p className="text-stone-400 mt-0.5 font-mono">{q.table_names?.join(', ')}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-stone-500">{q.plan_type}</td>
                  <td className="px-4 py-3 text-right font-mono text-stone-600">{q.shard_count_routed}/{q.total_shards}</td>
                  <td className="px-4 py-3 text-right font-mono text-stone-600">{q.count?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-stone-600">{q.latency_p50_ms}ms</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${q.latency_p99_ms > 1000 ? 'text-alert' : q.latency_p99_ms > 200 ? 'text-amber-600' : 'text-stone-600'}`}>{q.latency_p99_ms}ms</td>
                  <td className="px-4 py-3 text-center">
                    {q.is_scatter ? <AlertTriangle size={13} className="text-alert mx-auto" /> : <CheckCircle size={13} className="text-emerald-500 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="fixed bottom-4 right-6 font-playfair italic text-xs text-copper/25 pointer-events-none select-none">
          VitessProbe ✦ Sarthak Naikare
        </p>
      </div>
    </div>
  )
}
