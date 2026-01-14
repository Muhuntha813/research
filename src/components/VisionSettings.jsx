import { useState } from 'react'

export default function VisionSettings() {
  const [enabled, setEnabled] = useState(true)
  const [sensitivity, setSensitivity] = useState(0.7)
  const [zones, setZones] = useState({ surface: true, mid: true, bottom: false })
  return (
    <div className="card p-4">
      <div className="font-medium mb-2">AI Center — Vision Settings</div>
      <div className="flex items-center gap-2 mb-2">
        <label className="muted">Enable detection</label>
        <input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} />
      </div>
      <div className="mb-3">
        <label className="muted block">Sensitivity: {Math.round(sensitivity*100)}%</label>
        <input type="range" min="0" max="1" step="0.01" value={sensitivity} onChange={e=>setSensitivity(Number(e.target.value))} className="w-full" />
      </div>
      <div className="muted mb-1">Zones</div>
      <div className="relative aspect-video bg-ocean-100 dark:bg-ocean-800 rounded">
        <div className={`absolute inset-x-0 top-0 h-1/3 ${zones.surface? 'bg-blue-400/20':'bg-transparent'} border-b`} />
        <div className={`absolute inset-x-0 top-1/3 h-1/3 ${zones.mid? 'bg-blue-400/20':'bg-transparent'} border-b`} />
        <div className={`absolute inset-x-0 bottom-0 h-1/3 ${zones.bottom? 'bg-blue-400/20':'bg-transparent'}`} />
      </div>
      <div className="flex gap-2 mt-2">
        <button className={`px-2 py-1 rounded ${zones.surface? 'bg-ocean-500 text-white':'bg-gray-200 dark:bg-gray-700'}`} onClick={()=>setZones(z=>({ ...z, surface: !z.surface }))}>surface</button>
        <button className={`px-2 py-1 rounded ${zones.mid? 'bg-ocean-500 text-white':'bg-gray-200 dark:bg-gray-700'}`} onClick={()=>setZones(z=>({ ...z, mid: !z.mid }))}>mid</button>
        <button className={`px-2 py-1 rounded ${zones.bottom? 'bg-ocean-500 text-white':'bg-gray-200 dark:bg-gray-700'}`} onClick={()=>setZones(z=>({ ...z, bottom: !z.bottom }))}>bottom</button>
      </div>
    </div>
  )
}