import { useEffect, useState } from 'react'

export default function RulesEditor() {
  const [rules, setRules] = useState([])
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])
  async function load() {
    const res = await fetch('/api/v1/rules')
    const json = await res.json()
    setRules(json)
  }

  function startEdit(rule) {
    setEditing(rule ?? { id: '', name: '', condition: { type: 'composite', op: 'or', clauses: [{ metric: 'ph', op: '>', value: 7.8 }] }, action: { device: 'pump', state: 1, min_runtime_s: 600 }, hysteresis: { on: 7.9, off: 7.6 }, enabled: true })
  }

  async function save() {
    const res = await fetch('/api/v1/rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    if (res.ok) { setEditing(null); load() }
  }

  return (
    <div className="card p-4">
      <div className="font-medium mb-2">Automations & Rules</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* List */}
        <div>
          <button className="px-2 py-1 rounded bg-ocean-500 text-white mb-2" onClick={() => startEdit(null)}>New rule</button>
          <ul className="space-y-2">
            {rules.map(r => (
              <li key={r.id} className="card p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="muted text-xs">{JSON.stringify(r.condition)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${r.enabled? 'bg-green-500 text-white':'bg-gray-300'}`}>{r.enabled? 'enabled':'disabled'}</span>
                  <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" onClick={() => startEdit(r)}>Edit</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Editor */}
        <div>
          {editing ? (
            <div className="card p-3 space-y-2">
              <input className="px-2 py-1 rounded border" placeholder="id" value={editing.id} onChange={e=>setEditing({ ...editing, id: e.target.value })} />
              <input className="px-2 py-1 rounded border" placeholder="name" value={editing.name} onChange={e=>setEditing({ ...editing, name: e.target.value })} />
              <div className="muted">Action</div>
              <div className="flex gap-2">
                <input className="px-2 py-1 rounded border" placeholder="device" value={editing.action.device} onChange={e=>setEditing({ ...editing, action: { ...editing.action, device: e.target.value } })} />
                <select className="px-2 py-1 rounded border" value={editing.action.state} onChange={e=>setEditing({ ...editing, action: { ...editing.action, state: Number(e.target.value) } })}>
                  <option value={1}>ON</option>
                  <option value={0}>OFF</option>
                </select>
                <input className="px-2 py-1 rounded border" type="number" placeholder="min_runtime_s" value={editing.action.min_runtime_s} onChange={e=>setEditing({ ...editing, action: { ...editing.action, min_runtime_s: Number(e.target.value) } })} />
              </div>
              <div className="muted">Hysteresis</div>
              <div className="flex gap-2">
                <input className="px-2 py-1 rounded border" type="number" placeholder="on" value={editing.hysteresis.on} onChange={e=>setEditing({ ...editing, hysteresis: { ...editing.hysteresis, on: Number(e.target.value) } })} />
                <input className="px-2 py-1 rounded border" type="number" placeholder="off" value={editing.hysteresis.off} onChange={e=>setEditing({ ...editing, hysteresis: { ...editing.hysteresis, off: Number(e.target.value) } })} />
              </div>
              <div className="muted">Condition (first clause)</div>
              <div className="flex gap-2">
                <input className="px-2 py-1 rounded border" placeholder="metric" value={editing.condition.clauses[0].metric} onChange={e=>setEditing({ ...editing, condition: { ...editing.condition, clauses: [{ ...editing.condition.clauses[0], metric: e.target.value }] } })} />
                <select className="px-2 py-1 rounded border" value={editing.condition.clauses[0].op} onChange={e=>setEditing({ ...editing, condition: { ...editing.condition, clauses: [{ ...editing.condition.clauses[0], op: e.target.value }] } })}>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                </select>
                <input className="px-2 py-1 rounded border" type="number" placeholder="value" value={editing.condition.clauses[0].value} onChange={e=>setEditing({ ...editing, condition: { ...editing.condition, clauses: [{ ...editing.condition.clauses[0], value: Number(e.target.value) }] } })} />
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded bg-ocean-500 text-white" onClick={save}>Save</button>
                <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" onClick={()=>setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="muted">Select a rule to edit or create a new one.</div>
          )}
        </div>
      </div>
    </div>
  )
}