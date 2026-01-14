import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ResponsiveContainer, ReferenceDot, ReferenceLine } from 'recharts'
import { useHistoryData } from '../hooks/useHistoryData'
import { useSpeciesProfile } from '../hooks/useSpeciesProfile'

// Metrics list: pH, TDS, Sound Level, Water Temp, Air Temp, Humidity, Water Level
const metricsList = ['ph', 'tds', 'sound', 'waterTemp', 'airTemp', 'humidity', 'level']

export default function HistoryChart({ selectedSpeciesIds = [] }) {
  const [range, setRange] = useState('24h')
  const [visible, setVisible] = useState(new Set(metricsList))
  const { data, loading, error, timeDomain } = useHistoryData(metricsList, range)
  const { speciesProfiles, mergedRanges } = useSpeciesProfile(selectedSpeciesIds)

  // Merge to a unified dataset by ts
  const merged = mergeByTs(data)
  
  // Debug logging
  useEffect(() => {
    console.log('[HistoryChart] Data:', data)
    console.log('[HistoryChart] Merged length:', merged.length)
    console.log('[HistoryChart] Loading:', loading, 'Error:', error)
    if (merged.length > 0) {
      console.log('[HistoryChart] Sample merged data:', merged.slice(0, 3))
    }
  }, [data, merged, loading, error])

  const toggle = (m) => {
    const s = new Set(visible)
    if (s.has(m)) s.delete(m); else s.add(m)
    setVisible(s)
  }

  const events = sampleEvents(timeDomain)

  // Generate reference lines for fish preset values
  const getReferenceLines = () => {
    const lines = []
    if (selectedSpeciesIds.length === 0 || !mergedRanges) return lines

    // High-contrast color palette for different species
    const speciesColors = ['#166534', '#1d4ed8', '#7c3aed', '#c2410c', '#b91c1c', '#0f766e', '#be185d']
    
    // Get selected species
    const selectedSpecies = speciesProfiles.filter(s => selectedSpeciesIds.includes(s.id))
    
    // Metrics that have species profile ranges (ph, temp, do, tds, ntu)
    // Map chart metrics to species profile keys
    const metricToSpeciesKey = {
      'ph': 'ph',
      'tds': 'tds',
      'waterTemp': 'temp',
      'level': null, // Not in species profiles
      'sound': null, // Not in species profiles
      'airTemp': null, // Not in species profiles
      'humidity': null, // Not in species profiles
    }
    
    // For each metric that has species profile data, show reference lines
    Object.entries(metricToSpeciesKey).forEach(([chartMetric, speciesKey]) => {
      if (!speciesKey) return // Skip metrics not in species profiles
      
      selectedSpecies.forEach((species, speciesIdx) => {
        const range = species.ranges?.[speciesKey]
        if (range && Array.isArray(range) && range.length === 2) {
          // Calculate midpoint of the range as the "normal" value
          const midpoint = (range[0] + range[1]) / 2
          const color = speciesColors[speciesIdx % speciesColors.length]
          const label = `${species.name} ${chartMetric === 'waterTemp' ? 'temp' : chartMetric}`
          
          lines.push({
            key: `${species.id}-${chartMetric}-mid`,
            y: midpoint,
            stroke: color,
            strokeDasharray: '5 5',
            strokeWidth: 2,
            label: { value: label, position: 'right', fill: color, fontSize: 10 },
            yAxisId: chartMetric === 'tds' || chartMetric === 'level' ? 'right' : 'left'
          })
        }
      })
    })
    
    return lines
  }

  const referenceLines = getReferenceLines()

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Trends & History</div>
        <div className="flex items-center gap-2">
          {['6h','24h','7d','30d'].map(k => (
            <button key={k} className={`px-2 py-1 rounded ${range===k?'bg-ocean-500 text-white':'bg-gray-200 dark:bg-gray-700'}`} onClick={() => setRange(k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {metricsList.map(m => (
          <button key={m} className={`px-2 py-1 rounded text-sm ${visible.has(m)?'bg-ocean-400 text-white':'bg-gray-200 dark:bg-gray-700'}`} onClick={() => toggle(m)}>
            {m === 'waterTemp' ? 'water temp' : m === 'airTemp' ? 'air temp' : m}
          </button>
        ))}
      </div>
      {loading && <div className="text-center py-4 text-gray-500">Loading chart data...</div>}
      {error && <div className="text-center py-4 text-red-500">Error loading data: {error.message}</div>}
      {!loading && !error && merged.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No data available. Make sure the backend is running and generating history data.
        </div>
      )}
      <div style={{ width: '100%', height: 360 }}>
        {merged.length > 0 && (
        <ResponsiveContainer>
          <LineChart data={merged} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ts" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
            <Legend />
            {/* Fish preset reference lines */}
            {referenceLines.map((line) => (
              <ReferenceLine
                key={line.key}
                yAxisId={line.yAxisId}
                y={line.y}
                stroke={line.stroke}
                strokeDasharray={line.strokeDasharray}
                label={line.label}
              />
            ))}
            {/* Data lines */}
            {visible.has('ph') && <Line yAxisId="left" type="monotone" dataKey="ph" stroke="#2a9df4" name="pH" dot={false} />}
            {visible.has('tds') && <Line yAxisId="right" type="monotone" dataKey="tds" stroke="#7c3aed" name="TDS" dot={false} />}
            {visible.has('sound') && <Line yAxisId="left" type="monotone" dataKey="sound" stroke="#ef4444" name="Sound" dot={false} />}
            {visible.has('waterTemp') && <Line yAxisId="left" type="monotone" dataKey="waterTemp" stroke="#f59e0b" name="Water Temp" dot={false} />}
            {visible.has('airTemp') && <Line yAxisId="left" type="monotone" dataKey="airTemp" stroke="#fb923c" name="Air Temp" dot={false} />}
            {visible.has('humidity') && <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#14b8a6" name="Humidity" dot={false} />}
            {visible.has('level') && <Line yAxisId="right" type="monotone" dataKey="level" stroke="#64748b" name="Water Level" dot={false} />}
            {events.map((e, i) => (
              <ReferenceDot key={i} x={e.ts} y={e.y} r={4} fill={e.color} stroke="none" />
            ))}
            <Brush dataKey="ts" height={24} travellerWidth={12} />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function mergeByTs(byMetric) {
  const map = new Map()
  Object.entries(byMetric).forEach(([metric, points]) => {
    points.forEach(p => {
      const rec = map.get(p.ts) || { ts: p.ts }
      rec[metric] = p.value
      map.set(p.ts, rec)
    })
  })
  return Array.from(map.values()).sort((a,b) => new Date(a.ts)-new Date(b.ts))
}

function sampleEvents({ from, to }) {
  const out = []
  const types = [
    { label: 'feed', color: '#3b82f6' },
    { label: 'water-change', color: '#22c55e' },
    { label: 'UV', color: '#a855f7' },
    { label: 'filter', color: '#ef4444' },
  ]
  for (let t = from.getTime(); t < to.getTime(); t += 8 * 3600_000) {
    out.push({ ts: new Date(t).toISOString(), y: 0, color: types[Math.floor(Math.random()*types.length)].color })
  }
  return out
}