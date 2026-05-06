import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryApi } from '../api'
import { Search, AlertTriangle, CheckCircle, ArrowUpDown } from 'lucide-react'

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

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-stone-800">Query Intelligence</h1>
        <p className="text-sm text-stone-400 font-mono mt-0.5">
          Scatter query detection from VTGate /debug/queryz
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Patterns', value: stats?.total_fingerprints ?? 0, sub: 'unique query fingerprints' },
          { label: 'Scatter Queries', value: stats?.scatter_fingerprints ?? 0, sub: `${stats?.scatter_pct ?? 0}% of patterns`, danger: (stats?.scatter_pct ?? 0) > 30 },
          { label: 'Total Executions', value: (stats?.total_query_count ?? 0).toLocaleString(), sub: 'across all patterns' },
          { label: 'Avg P99 Latency', value: `${stats?.avg_p99_ms ?? 0}ms`, sub: 'across all queries' },
        ].map(({ label, value, sub, danger }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-stone-400 font-mono uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-semibold mb-0.5 ${danger ? 'text-red-600' : 'text-stone-800'}`}>{value}</p>
            <p className="text-xs text-stone-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Ad-hoc query analyzer */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-medium text-stone-700 mb-3 flex items-center gap-2">
          <Search size={14} /> Analyze a Query for Scatter Risk
        </h3>
        <div className="flex gap-2">
          <input
            value={analyzeText}
            onChange={e => setAnalyzeText(e.target.value)}
            placeholder="SELECT * FROM order_items WHERE customer_id = :id"
            className="flex-1 text-xs font-mono border border-stone-200 rounded-md px-3 py-2 bg-stone-50 focus:outline-none focus:border-indigo-300"
          />
          <button
            onClick={handleAnalyze}
            className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Analyze
          </button>
        </div>
        {analysis && (
          <div className={`mt-3 p-3 rounded-md border ${
            analysis.scatter_risk_label === 'high' ? 'bg-red-50 border-red-200' :
            analysis.scatter_risk_label === 'medium' ? 'bg-yellow-50 border-yellow-200' :
            'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-mono font-medium ${
                analysis.scatter_risk_label === 'high' ? 'text-red-700' :
                analysis.scatter_risk_label === 'medium' ? 'text-yellow-700' : 'text-green-700'
              }`}>
                Scatter risk: {analysis.scatter_risk_label.toUpperCase()} ({Math.round(analysis.scatter_risk * 100)}%)
              </span>
            </div>
            <p className="text-xs text-stone-600">{analysis.explanation}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setScatterOnly(!scatterOnly)}
          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
            scatterOnly
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
          }`}
        >
          {scatterOnly ? '✓ ' : ''}Scatter Only
        </button>
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
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
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              sortBy === opt.value
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Query table */}
      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="px-4 py-3 text-left font-medium text-stone-500 font-sans">Query Pattern</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500 font-sans">Plan</th>
              <th className="px-4 py-3 text-right font-medium text-stone-500 font-sans">Shards</th>
              <th className="px-4 py-3 text-right font-medium text-stone-500 font-sans">Count</th>
              <th className="px-4 py-3 text-right font-medium text-stone-500 font-sans">P50</th>
              <th className="px-4 py-3 text-right font-medium text-stone-500 font-sans">P99</th>
              <th className="px-4 py-3 text-center font-medium text-stone-500 font-sans">Scatter</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {(queries || []).map(q => (
              <tr key={q.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-mono text-stone-700 truncate" title={q.query_pattern}>
                    {q.query_pattern}
                  </p>
                  <p className="text-stone-400 mt-0.5">{q.table_names?.join(', ')}</p>
                </td>
                <td className="px-4 py-3 font-mono text-stone-500">{q.plan_type}</td>
                <td className="px-4 py-3 text-right font-mono text-stone-600">
                  {q.shard_count_routed}/{q.total_shards}
                </td>
                <td className="px-4 py-3 text-right font-mono text-stone-600">
                  {q.count?.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono text-stone-600">{q.latency_p50_ms}ms</td>
                <td className={`px-4 py-3 text-right font-mono font-medium ${
                  q.latency_p99_ms > 1000 ? 'text-red-600' :
                  q.latency_p99_ms > 200 ? 'text-yellow-600' : 'text-stone-600'
                }`}>
                  {q.latency_p99_ms}ms
                </td>
                <td className="px-4 py-3 text-center">
                  {q.is_scatter
                    ? <AlertTriangle size={13} className="text-red-500 mx-auto" />
                    : <CheckCircle size={13} className="text-green-500 mx-auto" />
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
