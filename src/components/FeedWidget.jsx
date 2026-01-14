export default function FeedWidget({ lastFedAt, recommendation }) {
  const last = new Date(lastFedAt)
  const diffMin = Math.floor((Date.now() - last.getTime()) / 60000)
  const next = new Date(lastFedAt + 1000 * 60 * 60) // simplistic next in 60 min
  return (
    <div className="card p-4">
      <div className="font-medium">Feed info</div>
      <div className="mt-1">Last fed: {last.toLocaleTimeString()} ({diffMin} min ago)</div>
      <div className="muted">Next scheduled: {next.toLocaleTimeString()}</div>
      <div className="mt-2">Pump should be ON: <span className="font-semibold">{recommendation.pumpShouldBeOn ? 'yes' : 'no'}</span></div>
    </div>
  )
}