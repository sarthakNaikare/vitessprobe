export type IncidentType = 'tablet_failover' | 'scatter_storm' | 'replication_lag' | 'vreplication_error' | 'online_ddl_stall' | 'vtgate_overload' | 'connection_pool_exhaustion' | 'unknown'
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type IncidentStatus = 'active' | 'investigating' | 'resolved'

export interface Incident {
  id: string
  cluster_id: string
  incident_type: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  title: string
  summary?: string
  causation_graph?: CausationGraph
  recommendations?: Recommendation[]
  affected_queries?: string[]
  detected_at: string
  resolved_at?: string
  duration_seconds?: number
  share_token: string
}

export interface CausationGraph {
  root_cause_node_id: string
  nodes: CausationNode[]
  edges: CausationEdge[]
}

export interface CausationNode {
  id: string
  component: string
  event_type: string
  description: string
  is_root_cause: boolean
  confidence: number
  occurred_at: string
}

export interface CausationEdge {
  source: string
  target: string
  relationship: string
  confidence: number
}

export interface Recommendation {
  priority: 'immediate' | 'short_term' | 'long_term'
  title: string
  description: string
  action: string
  vitess_command?: string
}

export interface TabletSnapshot {
  id: string
  tablet_alias: string
  keyspace: string
  shard: string
  tablet_type: 'primary' | 'replica' | 'rdonly'
  is_healthy: boolean
  replication_lag_seconds: number
  connection_pool_used: number
  connection_pool_size: number
  connection_pool_pct: number
  qps: number
  query_kill_count: number
  snapshot_at: string
}

export interface QueryFingerprint {
  id: string
  fingerprint_hash: string
  query_pattern: string
  keyspace: string
  table_names: string[]
  shard_count_routed: number
  total_shards: number
  is_scatter: boolean
  scatter_ratio: number
  count: number
  latency_p50_ms: number
  latency_p99_ms: number
  plan_type: string
  captured_at: string
}

export interface ClusterHealth {
  overall_score: number
  vtgate_healthy: boolean
  scatter_query_rate: number
  tablets_healthy: number
  tablets_total: number
  max_replication_lag_s: number
  active_incidents: number
  checked_at: string
}

export interface RCAReport {
  id: string
  incident_id: string
  audience: string
  title: string
  executive_summary: string
  root_cause_explanation: string
  recommendations: Recommendation[]
  playbook_steps: PlaybookStep[]
  share_token: string
  generated_at: string
  incident?: { title: string; severity: string; detected_at: string }
}

export interface PlaybookStep {
  step: number
  title: string
  description: string
  command?: string
}

export interface SimulatorScenario {
  id: string
  name: string
  description: string
  icon: string
}
