import { useQuery } from '@tanstack/react-query'
import { tabletApi } from '../api'
import { CheckCircle, AlertTriangle, Database } from 'lucide-react'

export default function TabletInspector() {
  const { data: tablets, isLoading } = useQuery({
    queryKey: ['tablets'],
    queryFn: tabletApi.list,
    refetchInterval: 15000,
  })

  const primaries = tablets?.filter(t => t.tablet_type === 'primary') || []
  const replicas = tablets?.filter(t => t.tablet_type === 'replica') || []

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-stone-800">Tablet Inspector</h1>
        <p className="text-sm text-stone-400 font-mono mt-0.5">
          Live health state for all VTTablets — commerce keyspace
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-stone-400 font-mono uppercase tracking-wide mb-1">Total Tablets</p>
          <p className="text-2xl font-semibold text-stone-800">{tablets?.length ?? 0}</p>
          <p className="text-xs text-stone-400">across 3 shards</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-stone-400 font-mono uppercase tracking-wide mb-1">Healthy</p>
          <p className="text-2xl font-semibold text-green-600">
            {tablets?.filter(t => t.is_healthy).length ?? 0}
          </p>
          <p className="text-xs text-stone-400">serving queries</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-stone-400 font-mono uppercase tracking-wide mb-1">Max Lag</p>
          <p className={`text-2xl font-semibold ${
            Math.max(...(tablets?.map(t => t.replication_lag_seconds) || [0])) > 10
              ? 'text-red-600' : 'text-stone-800'
          }`}>
            {Math.max(...(tablets?.map(t => t.replication_lag_seconds) || [0])).toFixed(1)}s
          </p>
          <p className="text-xs text-stone-400">replication lag</p>
        </div>
      </div>

      {/* Shards */}
      {['-40', '40-80', '80-'].map(shard => {
        const shardTablets = tablets?.filter(t => t.shard === shard) || []
        return (
          <div key={shard} className="card mb-4 overflow-hidden">
            <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
              <Database size={13} className="text-stone-400" />
              <span className="text-xs font-mono font-medium text-stone-600">
                shard {shard}
              </span>
              <span className="text-2xs text-stone-400">· commerce keyspace</span>
            </div>
            <div className="divide-y divide-stone-100">
              {shardTablets.map(t => (
                <div key={t.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {t.is_healthy
                        ? <CheckCircle size={14} className="text-green-500" />
                        : <AlertTriangle size={14} className="text-red-500" />
                      }
                      <span className="text-sm font-mono text-stone-700">{t.tablet_alias}</span>
                      <span className={`text-2xs font-mono px-1.5 py-0.5 rounded border ${
                        t.tablet_type === 'primary'
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}>
                        {t.tablet_type}
                      </span>
                    </div>
                    <span className={`text-xs font-mono font-medium ${
                      t.replication_lag_seconds > 10 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {t.tablet_type === 'primary' ? '— primary' : `lag ${t.replication_lag_seconds.toFixed(1)}s`}
                    </span>
                  </div>

                  {/* Metrics bar */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'QPS', value: `${t.qps}` },
                      { label: 'Pool used', value: `${t.connection_pool_pct}%`,
                        danger: t.connection_pool_pct > 80 },
                      { label: 'Pool size', value: `${t.connection_pool_used}/${t.connection_pool_size}` },
                      { label: 'Kill count', value: `${t.query_kill_count}`,
                        danger: t.query_kill_count > 0 },
                    ].map(({ label, value, danger }) => (
                      <div key={label} className="bg-stone-50 rounded-md px-3 py-2">
                        <p className="text-2xs text-stone-400 font-mono mb-0.5">{label}</p>
                        <p className={`text-xs font-mono font-medium ${danger ? 'text-red-600' : 'text-stone-700'}`}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Connection pool bar */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          t.connection_pool_pct > 80 ? 'bg-red-400' :
                          t.connection_pool_pct > 60 ? 'bg-yellow-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${t.connection_pool_pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
