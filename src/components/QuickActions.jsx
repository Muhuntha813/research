import { useState } from 'react'
import QuickActionButton from './QuickActionButton'

export default function QuickActions({ onCommand, onFeed }) {
  const [busy, setBusy] = useState('')
  const run = async (label, fn) => {
    setBusy(label)
    try { await fn() } finally { setBusy('') }
  }
  return (
    <div className="card p-4">
      <div className="font-medium mb-2">Quick actions</div>
      <div className="grid grid-cols-2 gap-3">
        <QuickActionButton label="Feed now" colorClass="bg-gradient-to-r from-sky-500 to-cyan-500" onClick={() => run('feed', onFeed)} busy={busy==='feed'} />
        <QuickActionButton label="Sanitize UV (15m)" colorClass="bg-gradient-to-r from-purple-500 to-fuchsia-500" onClick={() => run('uv', () => onCommand('uv', 1))} busy={busy==='uv'} />
        <QuickActionButton label="Refill" colorClass="bg-gradient-to-r from-cyan-500 to-teal-500" onClick={() => run('refill', () => onCommand('pump', 1))} busy={busy==='refill'} />
        <QuickActionButton label="Toggle relays" colorClass="bg-gradient-to-r from-amber-500 to-orange-500" onClick={() => run('relays', () => onCommand('lights', 0))} busy={busy==='relays'} />
      </div>
    </div>
  )
}