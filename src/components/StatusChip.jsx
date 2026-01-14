export default function StatusChip({ label, on, changedAt, onToggle }) {
  const color = on ? 'bg-green-500/90 text-white' : 'bg-gray-300/70 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
  return (
    <button
      className={`card-outline card px-3 py-2 flex items-center justify-between ${color} ${on ? 'border-green-300' : 'border-gray-400 dark:border-gray-500'}`}
      onClick={onToggle}
      aria-label={`${label} ${on ? 'ON' : 'OFF'}`}
    >
      <span className="font-medium flex items-center gap-2">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${on ? 'bg-green-300 shadow-[0_0_10px_2px_rgba(34,197,94,0.7)]' : 'bg-gray-400'}`}></span>
        {label}
      </span>
      <span className="text-xs opacity-80">{on ? 'ON' : 'OFF'}</span>
      <span className="text-[11px] opacity-70 ml-2">changed {timeAgo(changedAt)}</span>
    </button>
  )
}

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - new Date(ts).getTime())
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  return `${min} min ago`
}