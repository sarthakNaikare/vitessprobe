import { useQuery } from '@tanstack/react-query'
import { tabletApi } from '../api'
import { CheckCircle, AlertTriangle, Database, Server } from 'lucide-react'

export default function TabletInspector() {
  const { data: tablets } = useQuery({
    queryKey: ['tablets'],
    queryFn: tabletApi.list,
    refetchInterval: 15000,
  })

  const maxLag = Math.max(...(tablets?.map(t => t.replication_lag_seconds) || [0]))

  return (
    <div className="bg-tablets min-h-screen p-8">
      <div className="max-w-5xl">

        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-3 mb-1">
            <Server size={18} className="text-copper" />
            <h1 className="font-playfair text-2xl text-mahogany">Tablet Inspector</h1>
          </div>
          <p className="text-sm font-mono text-stone-400 ml-7">
            Live health state for all VTTablets — commerce keyspace
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Tablets', value: tablets?.length ?? 0, sub: 'across 3 shards', danger: false },
            { label: 'Healthy', value: tablets?.filter(t => t.is_healthy).length ?? 0, sub: 'serving queries', danger: false },
            { label: 'Max Lag', value: `${maxLag.toFixed(1)}s`, sub: 'replication lag', danger: maxLag > 10 },
          ].map(({ label, value, sub, danger }, i) => (
            <div key={label} className="card p-4 hover-lift animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">{label}</p>
              <p className={`text-2xl font-semibold font-playfair mb-0.5 ${danger ? 'text-alert' : 'text-mahogany'}`}>{value}</p>
              <p className="text-xs text-stone-400">{sub}</p>
            </div>
          ))}
        </div>

        {['-40', '40-80', '80-'].map((shard, si) => {
          const shardTablets = tablets?.filter(t => t.shard === shard) || []
          return (
            <div key={shard} className="card mb-4 overflow-hidden animate-fade-up" style={{ animationDelay: `${180 + si * 80}ms` }}>
              <div className="px-5 py-3 bg-parchment border-b border-stone-200 flex items-center gap-2">
                <Database size={13} className="text-copper" />
                <span className="text-xs font-mono font-semibold text-mahogany">shard {shard}</span>
                <span className="text-xs text-stone-400">· commerce keyspace</span>
              </div>
              <div className="divide-y divide-stone-100">
                {shardTablets.map(t => (
                  <div key={t.id} className="px-5 py-4 hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {t.is_healthy
                          ? <CheckCircle size={14} className="text-emerald-500" />
                          : <AlertTriangle size={14} className="text-alert" />
                        }
                        <span className="text-sm font-mono text-mahogany">{t.tablet_alias}</span>
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${
                          t.tablet_type === 'primary'
                            ? 'bg-amber-50 text-copper border-copper/30'
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                        }`}>
                          {t.tablet_type}
                        </span>
                      </div>
                      <span className={`text-xs font-mono font-semibold ${
                        t.replication_lag_seconds > 10 ? 'text-alert' : 'text-emerald-600'
                      }`}>
                        {t.tablet_type === 'primary' ? '— primary' : `lag ${t.replication_lag_seconds.toFixed(1)}s`}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'QPS', value: `${t.qps}`, danger: false },
                        { label: 'Pool used', value: `${t.connection_pool_pct}%`, danger: t.connection_pool_pct > 80 },
                        { label: 'Pool size', value: `${t.connection_pool_used}/${t.connection_pool_size}`, danger: false },
                        { label: 'Kill count', value: `${t.query_kill_count}`, danger: t.query_kill_count > 0 },
                      ].map(({ label, value, danger }) => (
                        <div key={label} className="bg-parchment rounded-md px-3 py-2 border border-stone-100">
                          <p className="text-xs text-stone-400 font-mono mb-0.5">{label}</p>
                          <p className={`text-xs font-mono font-semibold ${danger ? 'text-alert' : 'text-mahogany'}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3">
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            t.connection_pool_pct > 80 ? 'bg-alert' :
                            t.connection_pool_pct > 60 ? 'bg-amber-400' : 'bg-emerald-400'
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

        <p className="fixed bottom-4 right-6 font-playfair italic text-xs text-copper/25 pointer-events-none select-none">
          VitessProbe ✦ Sarthak Naikare
        </p>
      </div>
    </div>
  )
}
