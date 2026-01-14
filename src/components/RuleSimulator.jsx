import { useState } from 'react'

export default function RuleSimulator() {
  const [ruleId, setRuleId] = useState('r1')
  const [range, setRange] = useState('24h')
  const [actions, setActions] = useState([])

  async function simulate() {
    const to = new Date()
    const from = new Date(to.getTime() - (range==='6h'? 6: range==='24h'? 24: range==='7d'? 7*24: 30*24) * 3600_000)
    const res = await fetch('/api/v1/rules/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ruleId, from: from.toISOString(), to: to.toISOString() }) })
    const json = await res.json()
    setActions(json.actions || [])
  }

  return (
    <div className="card p-4">
      <div className="font-medium mb-2">Rule Simulator</div>
      <div className="flex gap-2 mb-2">
        <input className="px-2 py-1 rounded border" value={ruleId} onChange={e=>setRuleId(e.target.value)} />
        <select className="px-2 py-1 rounded border" value={range} onChange={e=>setRange(e.target.value)}>
          <option>6h</option>
          <option>24h</option>
          <option>7d</option>
          <option>30d</option>
        </select>
        <button className="px-2 py-1 rounded bg-ocean-500 text-white" onClick={simulate}>Simulate</button>
      </div>
      <ul className="space-y-2">
        {actions.map((a,i)=>(
          <li key={i} className="card p-2 flex items-center justify-between">
            <span className="text-sm">{new Date(a.ts).toLocaleString()}</span>
            <span className="text-sm">{a.device} → {a.state ? 'ON':'OFF'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}