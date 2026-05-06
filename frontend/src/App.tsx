import { Routes, Route } from 'react-router-dom'
import { useWebSocket } from './hooks/useWebSocket'
import Layout from './components/Layout'
import ToastContainer from './components/Toast'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import IncidentDetail from './pages/IncidentDetail'
import Timeline from './pages/Timeline'
import QueryCenter from './pages/QueryCenter'
import TabletInspector from './pages/TabletInspector'
import Simulator from './pages/Simulator'
import ReportGenerator from './pages/ReportGenerator'
import ImportHub from './pages/ImportHub'
import SharedIncident from './pages/SharedIncident'

export default function App() {
  useWebSocket()
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/share/incident/:token" element={<SharedIncident />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/queries" element={<QueryCenter />} />
          <Route path="/tablets" element={<TabletInspector />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/reports" element={<ReportGenerator />} />
          <Route path="/import" element={<ImportHub />} />
        </Route>
      </Routes>
    </>
  )
}
