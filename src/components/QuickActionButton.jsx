import { motion } from 'framer-motion'

export default function QuickActionButton({ label, colorClass, onClick, busy }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`ripple card-outline px-4 py-3 rounded-2xl text-white font-medium ${colorClass}`}
    >
      {busy ? `${label}…` : label}
    </motion.button>
  )
}