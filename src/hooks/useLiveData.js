import { useEffect, useRef, useState } from 'react'

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)
const jitter = (val, amt = 0.1) => val + (Math.random() * 2 - 1) * amt

const nowIso = () => new Date().toISOString()

const initialSensors = () => ({
  ph: 7.2,
  tds: 220,
  do: 6.5,
  sound: 45,
  waterTemp: 26.0,
  airTemp: 25.0,
  humidity: 55,
  waterLevel: 12.0,
  flow: 1.2,
  ts: nowIso(),
})

const initialActuators = () => ({
  pump: 1,
  filter: 1,
  air: 0,
  heater: 0,
  lights: 1,
  uv: 0,
  feeder: 0,
  ts: nowIso(),
})

const rulesRecommendation = (actuators) => ({
  pumpShouldBeOn: actuators.pump === 1,
})

export function useLiveData(mode = 'mock') {
  const [currentMode, setCurrentMode] = useState(mode)
  const [sensors, setSensors] = useState(initialSensors())
  const [actuators, setActuators] = useState(initialActuators())
  const [alerts, setAlerts] = useState([])
  const [lastFedAt, setLastFedAt] = useState(Date.now() - 1000 * 60 * 23)
  const wsRef = useRef(null)
  const pollRef = useRef(null)

  // Generate mock updates every 2s
  useEffect(() => {
    if (currentMode !== 'mock') return
    const id = setInterval(() => {
      setSensors((prev) => {
        const next = {
          ph: clamp(jitter(prev.ph, 0.05), 6.5, 8.5),
          tds: clamp(Math.round(jitter(prev.tds, 3)), 150, 350),
          do: clamp(jitter(prev.do, 0.1), 4.0, 9.0),
          sound: clamp(Math.round(jitter(prev.sound, 1.5)), 30, 90),
          waterTemp: clamp(jitter(prev.waterTemp, 0.2), 22, 30),
          airTemp: clamp(jitter(prev.airTemp, 0.3), 18, 33),
          humidity: clamp(Math.round(jitter(prev.humidity, 1.5)), 30, 80),
          waterLevel: clamp(jitter(prev.waterLevel, 0.2), 8, 18),
          flow: clamp(jitter(prev.flow, 0.1), 0.5, 2.5),
          ts: nowIso(),
        }

        const nextAlerts = []
        if (next.ph < 6.8 || next.ph > 7.8) nextAlerts.push({ type: 'pH', msg: 'pH out of range', ts: nowIso() })
        if (next.do < 5.5) nextAlerts.push({ type: 'DO', msg: 'Dissolved oxygen low', ts: nowIso() })
        if (next.sound > 70) nextAlerts.push({ type: 'Noise', msg: 'Sound level high', ts: nowIso() })
        if (next.waterLevel < 10) nextAlerts.push({ type: 'Level', msg: 'Water level low', ts: nowIso() })
        setAlerts(nextAlerts)

        return next
      })
    }, 2000)
    return () => clearInterval(id)
  }, [currentMode])

  // Real mode: WebSocket subscription stub, fallback to HTTP poll
  useEffect(() => {
    if (currentMode === 'ws') {
      try {
        const ws = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws')
        wsRef.current = ws
        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data)
            // Expect topics and payloads per data contract
            if (msg.topic?.includes('aquarium/sensors/water')) {
              const p = msg.payload
              setSensors((prev) => ({
                ...prev,
                ph: p.ph ?? prev.ph,
                tds: p.tds ?? prev.tds,
                do: p.do ?? prev.do,
                sound: (p.sound ?? p.noise ?? p.ntu) ?? prev.sound,
                waterTemp: p.temp ?? prev.waterTemp,
                ts: p.ts ?? nowIso(),
              }))
            }
            if (msg.topic?.includes('aquarium/sensors/lvl')) {
              const p = msg.payload
              setSensors((prev) => ({ ...prev, waterLevel: p.cm ?? prev.waterLevel, ts: p.ts ?? nowIso() }))
            }
            if (msg.topic?.includes('aquarium/actuators/state')) {
              const p = msg.payload
              setActuators((prev) => ({ ...prev, ...p, ts: p.ts ?? nowIso() }))
            }
          } catch {}
        }
        ws.onerror = () => {
          // fallback to poll
          setCurrentMode('poll')
        }
      } catch {
        setCurrentMode('poll')
      }
      return () => {
        if (wsRef.current) {
          wsRef.current.close()
          wsRef.current = null
        }
      }
    }

    if (currentMode === 'poll') {
      const poll = setInterval(async () => {
        try {
          const res = await fetch('/api/v1/live')
          if (!res.ok) return
          const data = await res.json()
          // Merge payloads if provided similarly to contracts
          setSensors((prev) => ({
            ...prev,
            ph: data.ph ?? prev.ph,
            tds: data.tds ?? prev.tds,
            do: data.do ?? prev.do,
            sound: (data.sound ?? data.noise ?? data.ntu) ?? prev.sound,
            waterTemp: data.temp ?? prev.waterTemp,
            ts: data.ts ?? nowIso(),
          }))
          if (data.cm) setSensors((prev) => ({ ...prev, waterLevel: data.cm ?? prev.waterLevel }))
          if (data.actuators) setActuators((prev) => ({ ...prev, ...data.actuators }))
        } catch {
          // ignore
        }
      }, 2000)
      pollRef.current = poll
      return () => {
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      }
    }
  }, [currentMode])

  const sendCommand = async (device, state) => {
    // Optimistic update
    setActuators((prev) => ({ ...prev, [device]: state, ts: nowIso() }))
    try {
      const res = await fetch('/api/v1/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device, state }),
      })
      if (!res.ok) throw new Error('Command failed')
      return { ok: true }
    } catch (e) {
      // revert on failure
      setActuators((prev) => ({ ...prev, [device]: state ? 0 : 1, ts: nowIso() }))
      return { ok: false, error: e.message }
    }
  }

  const feedNow = async () => {
    setLastFedAt(Date.now())
    return sendCommand('feeder', 1)
  }

  const recommendation = rulesRecommendation(actuators)

  return {
    sensors,
    actuators,
    alerts,
    lastFedAt,
    recommendation,
    mode: currentMode,
    setMode: setCurrentMode,
    sendCommand,
    feedNow,
  }
}