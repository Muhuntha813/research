import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AlertsBar({ alerts = [] }) {
  const [open, setOpen] = useState(null)
  const [visible, setVisible] = useState([])

  useEffect(() => {
    setVisible(alerts)
    const id = setTimeout(() => setVisible([]), 5000)
    return () => clearTimeout(id)
  }, [alerts])

  return (
    <div className="relative">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {alerts.length === 0 && <span className="muted">No alerts</span>}
      </div>
      <div className="absolute -top-2 left-0 right-0 flex justify-center pointer-events-none">
        <AnimatePresence>
          {visible.map((a, i) => (
              <motion.div key={i} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="pointer-events-auto px-3 py-1 rounded-full bg-red-500 text-white shadow-soft card-outline border-red-300">
              <button onClick={() => setOpen(a)} className="text-sm">⚠️ {a.type}: {a.msg}</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {open && (
        <div className="card p-3 mt-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">{open.type} alert</div>
              <div className="muted">{open.msg}</div>
              <div className="muted">{new Date(open.ts).toLocaleString()}</div>
            </div>
            <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" onClick={() => setOpen(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}