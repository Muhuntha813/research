import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useLiveData } from './hooks/useLiveData'
import VitalsCard from './components/VitalsCard'
import StatusChip from './components/StatusChip'
import CameraPanel from './components/CameraPanel'
import QuickActions from './components/QuickActions'
import AlertsBar from './components/AlertsBar'
import FeedInfoCard from './components/FeedInfoCard'
import HistoryChart from './components/HistoryChart'
import MiniSparkline from './components/MiniSparkline'
import RulesEditor from './components/RulesEditor'
import RuleSimulator from './components/RuleSimulator'
import AIEventViewer from './components/AIEventViewer'
import VisionSettings from './components/VisionSettings'
import CalibrationWizard from './components/CalibrationWizard'
import NotificationsPanel from './components/NotificationsPanel'
import GooeyNav from './components/GooeyNav'
import ClickSpark from './components/ClickSpark'
import FishSelector from './components/FishSelector'
import TankProfileCard from './components/TankProfileCard'
import SpeciesWarningBar from './components/SpeciesWarningBar'
import ChatWidget from './components/ChatWidget'

const Header = ({ dark, setDark, mode, setMode, onFishSelectorOpen }) => {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-white/60 via-white/50 to-white/60 dark:from-black/40 dark:via-black/30 dark:to-black/40 backdrop-blur-md" style={{ borderBottom: '1px solid rgba(32, 178, 170, 0.2)' }}>
      <div>
        <motion.h1
          className="text-2xl md:text-3xl font-semibold text-[#2c3e50] dark:text-[#e2e8f0]"
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <span className="inline-block bg-gradient-to-r from-[#20B2AA] to-[#4682B4] bg-clip-text text-transparent">
            Smart Fish Aquarium
          </span>
        </motion.h1>
        <motion.div
          className="h-1 mt-1 bg-gradient-to-r from-[#20B2AA] via-[#40E0D0] to-[#4682B4] rounded-full"
          animate={{ opacity: [0.6, 1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="flex items-center gap-3 header-controls">
        <button
          className="fish-selector-trigger"
          onClick={onFishSelectorOpen}
          aria-label="Select fish species"
          title="Select Fish (Press F)"
        >
          <span className="text-2xl">🐠</span>
        </button>
        <select aria-label="Data mode" className="pill" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="mock">mock</option>
          <option value="ws">live</option>
          <option value="poll">poll</option>
        </select>
        <button aria-label="Toggle theme" className="pill" onClick={() => setDark((d) => !d)}>
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>
    </div>
  )
}

function App() {
  const [dark, setDark] = useState(false)
  const { sensors, actuators, alerts, lastFedAt, recommendation, mode, setMode, sendCommand, feedNow } = useLiveData('mock')
  const [toasts, setToasts] = useState([])
  const [tab, setTab] = useState('dashboard')
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState([])
  const [fishSelectorOpen, setFishSelectorOpen] = useState(false)
  const [tankId] = useState('default')
  const [showTankProfile, setShowTankProfile] = useState(false)

  const navItems = [
    { label: 'dashboard', value: 'dashboard' },
    { label: 'trends', value: 'trends' },
    { label: 'automations', value: 'automations' },
    { label: 'ai', value: 'ai' },
    { label: 'calibration', value: 'calibration' },
    { label: 'notifications', value: 'notifications' },
  ]

  const initialActiveIndex = navItems.findIndex(item => item.value === tab)

  // Load saved species selection on mount
  useEffect(() => {
    async function loadTankProfile() {
      try {
        const response = await fetch(`/api/v1/user/tank/${tankId}/profile`)
        if (response.ok) {
          const data = await response.json()
          if (data.selectedSpecies && data.selectedSpecies.length > 0) {
            setSelectedSpeciesIds(data.selectedSpecies)
          }
        }
      } catch (error) {
        // Ignore errors, will use mock fallback
      }
    }
    loadTankProfile()
  }, [tankId])

  const handleSpeciesSelectionChange = (newSelection) => {
    setSelectedSpeciesIds(newSelection)
  }

  const handleApplyPresets = async (data) => {
    setToasts((t) => [...t, { 
      id: Date.now(), 
      text: data.conflict 
        ? 'Presets applied with conflicts. Review recommendations.' 
        : 'Presets applied successfully', 
      ok: true 
    }])
    setTimeout(() => setToasts((t) => t.slice(1)), 3000)
  }

  const handleAcceptRecommendation = (warning) => {
    // Could open TankProfileCard or show recommendation details
    setToasts((t) => [...t, { 
      id: Date.now(), 
      text: `Accepted recommendation for ${warning.speciesName}: ${warning.recommendedAction}`, 
      ok: true 
    }])
    setTimeout(() => setToasts((t) => t.slice(1)), 3000)
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const vitals = useMemo(() => ([
    { key: 'ph', label: 'pH', value: sensors.ph, unit: '', status: sensors.ph < 6.8 || sensors.ph > 7.8 ? 'bad' : 'good', icon: '🧪' },
    { key: 'tds', label: 'TDS', value: sensors.tds, unit: 'ppm', status: sensors.tds > 300 ? 'warn' : 'good', icon: '💧' },
    { key: 'do', label: 'DO', value: sensors.do, unit: 'mg/L', status: sensors.do < 5.5 ? 'bad' : 'good', icon: '🫧' },
    { key: 'sound', label: 'Sound Level', value: sensors.sound, unit: 'dB', status: sensors.sound > 70 ? 'warn' : 'good', icon: '🔊' },
    { key: 'waterTemp', label: 'Water Temp', value: sensors.waterTemp, unit: '°C', status: sensors.waterTemp < 24 || sensors.waterTemp > 28 ? 'warn' : 'good', icon: '🌡️' },
    { key: 'airTempHumidity', label: 'Air Temp / Humidity', value: `${sensors.airTemp.toFixed(1)}°C / ${sensors.humidity}%`, unit: '', status: 'good', icon: '🌬️' },
    { key: 'waterLevel', label: 'Water Level', value: sensors.waterLevel, unit: 'cm', status: sensors.waterLevel < 10 ? 'bad' : 'good', icon: '📏' },
    { key: 'flow', label: 'Flow', value: sensors.flow, unit: 'L/min', status: sensors.flow < 0.8 ? 'warn' : 'good', icon: '🔁' },
  ]), [sensors])

  const statusChips = [
    { k: 'pump', label: 'Pump' },
    { k: 'filter', label: 'Filter' },
    { k: 'air', label: 'Air' },
    { k: 'heater', label: 'Heater' },
    { k: 'lights', label: 'Lights' },
    { k: 'uv', label: 'UV' },
    { k: 'feeder', label: 'Feeder' },
  ]

  const handleToggle = async (device, state) => {
    const res = await sendCommand(device, state)
    setToasts((t) => [...t, { id: Date.now(), text: res.ok ? `${device} set to ${state ? 'ON' : 'OFF'}` : `Failed: ${device}`, ok: res.ok }])
    setTimeout(() => setToasts((t) => t.slice(1)), 2500)
  }

  return (
    <ClickSpark
      sparkColor="#20B2AA"
      sparkSize={8}
      sparkRadius={20}
      sparkCount={8}
      duration={500}
      easing="ease-out"
      extraScale={1.2}
    >
      <div className="min-h-screen flex flex-col">
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <Header 
            dark={dark} 
            setDark={setDark} 
            mode={mode} 
            setMode={setMode}
            onFishSelectorOpen={() => setFishSelectorOpen(true)}
          />
          
          {/* Species Warning Bar */}
          <SpeciesWarningBar
            selectedSpeciesIds={selectedSpeciesIds}
            sensors={sensors}
            onAcceptRecommendation={handleAcceptRecommendation}
            onIgnore={() => {}}
          />

          {/* Fish Selector */}
          <FishSelector
            selectedSpeciesIds={selectedSpeciesIds}
            onSelectionChange={handleSpeciesSelectionChange}
            onApply={async (selection) => {
              try {
                const response = await fetch(`/api/v1/user/tank/${tankId}/species`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    selectedSpecies: selection,
                    overrides: {},
                  }),
                });
                if (response.ok) {
                  const data = await response.json();
                  handleApplyPresets(data);
                  return { ok: true };
                }
                throw new Error('Failed to apply');
              } catch (error) {
                console.error('Error applying species selection:', error);
                // Still update local state even if API fails
                handleSpeciesSelectionChange(selection);
                return { ok: false, error: error.message };
              }
            }}
            onCancel={() => setFishSelectorOpen(false)}
            isOpen={fishSelectorOpen}
            onOpenChange={setFishSelectorOpen}
          />

          <div className="px-6 pt-4">
            <GooeyNav
              items={navItems}
              particleCount={15}
              particleDistances={[90, 10]}
              particleR={100}
              initialActiveIndex={initialActiveIndex}
              animationTime={600}
              timeVariance={300}
              colors={[1, 2, 3, 1, 2, 3, 1, 4]}
              onTabChange={(value) => setTab(value)}
            />
          </div>

        {tab === 'dashboard' && (
          <>
            {/* Tank Profile access */}
            <div className="px-6 pt-4 flex justify-end">
              <button
                className={`px-4 py-2 rounded-full font-medium shadow-sm transition ${
                  selectedSpeciesIds.length
                    ? 'bg-ocean-500 text-white hover:bg-ocean-600'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                onClick={() => selectedSpeciesIds.length && setShowTankProfile(true)}
                disabled={selectedSpeciesIds.length === 0}
              >
                View Tank Profile
              </button>
            </div>

            {/* Alerts bar */}
            <div className="px-6 pt-4">
              <AlertsBar alerts={alerts} />
            </div>
            {/* Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vitals.map((v) => (
            <VitalsCard key={v.key} label={v.label} value={v.value} unit={v.unit} updatedAt={sensors.ts} status={v.status} icon={v.icon} sparkData={[{ ts: sensors.ts, v: typeof v.value==='number'? v.value : 0 }]}/>
          ))}
            </div>
            {/* Status chips */}
            <div className="px-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {statusChips.map((s) => (
                <StatusChip key={s.k} label={s.label} on={Boolean(actuators[s.k])} changedAt={actuators.ts} onToggle={() => handleToggle(s.k, actuators[s.k] ? 0 : 1)} />
              ))}
            </div>
            {/* Camera + Quick actions + Feed info */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <CameraPanel />
              </div>
              <div className="flex flex-col gap-4">
                <QuickActions onCommand={handleToggle} onFeed={async () => {
                  const res = await feedNow()
                  setToasts((t) => [...t, { id: Date.now(), text: res.ok ? 'Feeding command sent' : 'Feeding failed', ok: res.ok }])
                  setTimeout(() => setToasts((t) => t.slice(1)), 2500)
                }} />
                <FeedInfoCard lastFedAt={lastFedAt} recommendation={recommendation} />
              </div>
            </div>
            {/* Mini sparklines bottom */}
            <div className="px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniSparkline title="pH 3h" data={[{ ph: sensors.ph }, { ph: sensors.ph }]} dataKey="ph" color="#2a9df4" />
              <MiniSparkline title="DO 3h" data={[{ do: sensors.do }, { do: sensors.do }]} dataKey="do" color="#10b981" />
              <MiniSparkline title="Temp 3h" data={[{ temp: sensors.waterTemp }, { temp: sensors.waterTemp }]} dataKey="temp" color="#f59e0b" />
              <MiniSparkline title="NTU 3h" data={[{ ntu: sensors.ntu }, { ntu: sensors.ntu }]} dataKey="ntu" color="#ef4444" />
            </div>
          </>
        )}

        {tab === 'trends' && (
          <div className="p-6">
            <HistoryChart selectedSpeciesIds={selectedSpeciesIds} />
          </div>
        )}

        {tab === 'automations' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <RulesEditor />
            <RuleSimulator />
          </div>
        )}

        {tab === 'ai' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <VisionSettings />
            <AIEventViewer />
          </div>
        )}

        {tab === 'calibration' && (
          <div className="p-6">
            <CalibrationWizard />
          </div>
        )}

        {tab === 'notifications' && (
          <div className="p-6">
            <NotificationsPanel />
          </div>
        )}

        {/* Tank Profile Modal */}
        {showTankProfile && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowTankProfile(false)}
          >
            <div
              className="relative w-full max-w-5xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-teal-200/40"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-200 w-10 h-10 flex items-center justify-center shadow-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                onClick={() => setShowTankProfile(false)}
                aria-label="Close tank profile"
              >
                ×
              </button>
              <div className="p-6 sm:p-8">
                <TankProfileCard
                  selectedSpeciesIds={selectedSpeciesIds}
                  onApplyPresets={(data) => {
                    handleApplyPresets(data)
                    setShowTankProfile(false)
                  }}
                  tankId={tankId}
                />
              </div>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50" style={{ pointerEvents: 'none' }}>
          {toasts.map((t) => (
            <div key={t.id} className={`px-4 py-2 rounded-lg shadow-soft ${t.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`} style={{ pointerEvents: 'auto' }}>{t.text}</div>
          ))}
        </div>

        {/* AI Chat Widget */}
        <ChatWidget apiBaseUrl="http://localhost:3000" />
      </div>
    </div>
    </ClickSpark>
  )
}

export default App
