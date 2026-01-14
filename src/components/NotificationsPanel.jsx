import { useState } from 'react'

const channels = ['push', 'email', 'telegram', 'whatsapp', 'mqtt']

export default function NotificationsPanel() {
  const [recipient, setRecipient] = useState('user@example.com')
  const [selected, setSelected] = useState(['email'])
  const [template, setTemplate] = useState('pH alert: pH {{value}} at {{ts}} — action: {{action}}')
  const toggle = (c) => setSelected(s => s.includes(c) ? s.filter(x=>x!==c) : [...s, c])
  async function sendTest() {
    await fetch('/api/v1/notify/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient, channels: selected, template }) })
  }
  return (
    <div className="card p-4">
      <div className="font-medium mb-2">Notifications & Templates</div>
      <div className="flex flex-col gap-2">
        <input className="px-2 py-1 rounded border" placeholder="recipient" value={recipient} onChange={e=>setRecipient(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          {channels.map(c => (
            <button key={c} className={`px-2 py-1 rounded text-sm ${selected.includes(c)?'bg-ocean-500 text-white':'bg-gray-200 dark:bg-gray-700'}`} onClick={()=>toggle(c)}>{c}</button>
          ))}
        </div>
        <textarea className="px-2 py-1 rounded border" rows={3} value={template} onChange={e=>setTemplate(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-2 py-1 rounded bg-ocean-500 text-white" onClick={sendTest}>Send test</button>
          <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">Quiet hours…</button>
        </div>
      </div>
    </div>
  )
}