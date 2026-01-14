import { motion } from 'framer-motion'

export default function FeedInfoCard({ lastFedAt, recommendation }) {
  const last = new Date(lastFedAt)
  const diffMin = Math.floor((Date.now() - last.getTime()) / 60000)
  const next = new Date(lastFedAt + 1000 * 60 * 60)
  return (
    <div className="card p-4">
      <div className="font-medium">Feed info</div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1">
        Last fed: {last.toLocaleTimeString()} ({diffMin} mins ago)
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="muted">
        Next scheduled: {next.toLocaleTimeString()}
      </motion.div>
      <div className="mt-2 flex items-center gap-2">
        <span>Pump should be ON:</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded ${recommendation.pumpShouldBeOn ? 'bg-green-500 text-white':'bg-gray-300'}`}>
          {recommendation.pumpShouldBeOn ? 'yes' : 'no'}
        </span>
      </div>
      <div className="mt-3 fish-line">
        <span className="fish">🐟</span>
      </div>
    </div>
  )
}