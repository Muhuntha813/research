import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'

export default function VitalsCard({ label, value, unit, updatedAt, status = 'good', icon, sparkData = [] }) {
  const prev = useRef(value)
  const changed = prev.current !== value
  useEffect(() => { prev.current = value }, [value])

  const color = status === 'bad' ? 'bg-red-500' : status === 'warn' ? 'bg-amber-500' : 'bg-green-500'
  const textColor = status === 'bad' ? 'text-red-600' : status === 'warn' ? 'text-amber-600' : 'text-green-600'

  return (
    <motion.div className={`card card-strong p-4 ${changed ? 'pulse-glow' : ''}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl" aria-hidden>{icon}</span>}
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200" aria-label={`${label} label`}>{label}</div>
        </div>
        <div className={`h-2 w-10 rounded-full ${color}`} aria-label={`${label} status indicator`} />
      </div>
      <motion.div
        className={`mt-2 text-2xl font-semibold ${textColor}`}
        animate={changed ? { scale: [1, 1.04, 1] } : {}}
        transition={{ duration: 0.3 }}
        aria-label={`${label} value`}
      >
        {typeof value === 'number' ? Number(value).toFixed(2) : value}
        {unit && <span className="ml-1 text-base text-gray-500 dark:text-gray-400">{unit}</span>}
      </motion.div>
      <div className="muted mt-1" aria-label={`${label} last updated`}>last updated: {new Date(updatedAt).toLocaleTimeString()}</div>
      <div style={{ width: '100%', height: 60 }} className="mt-2">
        <ResponsiveContainer>
          <LineChart data={sparkData}>
            <Tooltip labelFormatter={(t) => new Date(t).toLocaleTimeString()} />
            <Line type="monotone" dataKey="v" stroke="#60a5fa" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}