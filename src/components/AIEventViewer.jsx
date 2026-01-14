import { useEffect, useState } from 'react'

export default function AIEventViewer() {
  const [items, setItems] = useState([])
  useEffect(() => { load() }, [])
  async function load() {
    const res = await fetch('/api/v1/ai/events')
    const json = await res.json()
    setItems(json.items || [])
  }
  return (
    <div className="card p-4">
      <div className="font-medium mb-2">AI Center — Event Viewer</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((ev, i) => (
          <div key={i} className="card p-2">
            <img src={ev.frame} alt={`${ev.type} frame`} className="w-full h-32 object-cover rounded" />
            <div className="mt-1 text-sm">{ev.type} • confidence {Math.round(ev.score*100)}%</div>
            <div className="muted text-xs">{new Date(ev.ts).toLocaleString()}</div>
            <div className="mt-2 flex gap-2">
              <button className="px-2 py-1 rounded bg-blue-500 text-white text-xs">open frame</button>
              <button className="px-2 py-1 rounded bg-green-500 text-white text-xs">boost aeration</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}