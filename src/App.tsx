import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import LoginScreen from './pages/LoginScreen'
import MenuSelectionScreen from './pages/MenuSelectionScreen'
import PlantSelectionScreen from './pages/PlantSelectionScreen'
import RecordsScreen from './pages/RecordsScreen'
import CreateRecordScreen from './pages/CreateRecordScreen'
import AdminPanel from './pages/AdminPanel'
import MasterDataManagement from './pages/MasterDataManagement'
import PlantSelectionKlipingScreen from './pages/PlantSelectionKlipingScreen'
import KlipingRecordsScreen from './pages/KlipingRecordsScreen'
import CreateKlipingScreen from './pages/CreateKlipingScreen'
import PlantSelectionMonitoringScreen from './pages/PlantSelectionMonitoringScreen'
import MonitoringRecordsScreen from './pages/MonitoringRecordsScreen'
import CreateMonitoringScreen from './pages/CreateMonitoringScreen'
import AuditLogScreen from './pages/AuditLogScreen'
import './App.css'


function App() {
  return (
    <AppProvider>
      <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<LoginScreen />} />
            <Route path="/menu" element={<MenuSelectionScreen />} />
            <Route path="/plant-selection" element={<PlantSelectionScreen />} />
            <Route path="/records" element={<RecordsScreen />} />
            <Route path="/create-record" element={<CreateRecordScreen />} />
            <Route path="/plant-selection-kliping" element={<PlantSelectionKlipingScreen />} />
            <Route path="/kliping-records" element={<KlipingRecordsScreen />} />
            <Route path="/create-kliping" element={<CreateKlipingScreen />} />
            <Route path="/create-kliping/:id" element={<CreateKlipingScreen />} />
            <Route path="/plant-selection-monitoring" element={<PlantSelectionMonitoringScreen />} />
            <Route path="/monitoring-records" element={<MonitoringRecordsScreen />} />
            <Route path="/create-monitoring" element={<CreateMonitoringScreen />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/master-data" element={<MasterDataManagement />} />
            <Route path="/audit-log" element={<AuditLogScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <footer style={{
          padding: '1rem',
          color: '#1c1c1c',
          fontSize: '0.75rem',
          textAlign: 'center',
          opacity: 0.7,
          background: 'transparent'
        }}>
          © {new Date().getFullYear()} ver.2.1.5 by DuoBingo for Indofood
        </footer>
      </div>
    </AppProvider>
  )
}

export default App