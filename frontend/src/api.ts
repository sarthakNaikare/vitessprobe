import axios from 'axios'
import type { Incident, TabletSnapshot, QueryFingerprint, ClusterHealth, RCAReport, SimulatorScenario } from './types'

const api = axios.create({
  baseURL: '',
  timeout: 30_000,
})

export const clusterApi = {
  getHealth: () => api.get<ClusterHealth>('/api/cluster/health').then(r => r.data),
  getConfig: () => api.get('/api/cluster/config').then(r => r.data),
  getMetrics: (component: string, metric: string, minutes = 60) =>
    api.get('/api/cluster/metrics', { params: { component, metric, minutes } }).then(r => r.data),
}

export const incidentApi = {
  list: (params?: { limit?: number; severity?: string; status?: string }) =>
    api.get<Incident[]>('/api/incidents', { params }).then(r => r.data),
  get: (id: string) => api.get<Incident>(`/api/incidents/${id}`).then(r => r.data),
  getByToken: (token: string) => api.get<Incident>(`/api/incidents/share/${token}`).then(r => r.data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/incidents/${id}/status`, { status }).then(r => r.data),
}

export const tabletApi = {
  list: () => api.get<TabletSnapshot[]>('/api/tablets').then(r => r.data),
  get: (alias: string) => api.get<TabletSnapshot>(`/api/tablets/${alias}`).then(r => r.data),
  getHistory: (alias: string, minutes = 60) =>
    api.get<TabletSnapshot[]>(`/api/tablets/${alias}/history`, { params: { minutes } }).then(r => r.data),
}

export const queryApi = {
  list: (params?: { scatter_only?: boolean; sort_by?: string; limit?: number }) =>
    api.get<QueryFingerprint[]>('/api/queries', { params }).then(r => r.data),
  getStats: () => api.get('/api/queries/stats').then(r => r.data),
  analyze: (query: string) => api.post('/api/queries/analyze', { query }).then(r => r.data),
}

export const simulatorApi = {
  getScenarios: () => api.get<SimulatorScenario[]>('/api/simulator/scenarios').then(r => r.data),
  inject: (scenario: string, intensity: number, target_shard?: string) =>
    api.post('/api/simulator/inject', { scenario, intensity, target_shard }).then(r => r.data),
  reset: () => api.post('/api/simulator/reset').then(r => r.data),
}

export const reportApi = {
  generate: (incident_id: string, audience: string) =>
    api.post<RCAReport>('/api/reports/generate', { incident_id, audience }).then(r => r.data),
  get: (id: string) => api.get<RCAReport>(`/api/reports/${id}`).then(r => r.data),
  getByToken: (token: string) => api.get<RCAReport>(`/api/reports/share/${token}`).then(r => r.data),
}

export const importApi = {
  paste: (text: string, format = 'auto') =>
    api.post('/api/import/paste', { text, format }).then(r => r.data),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/import/upload', form).then(r => r.data)
  },
}
