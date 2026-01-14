export default function CameraPanel() {
  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-video">
        {/* Video placeholder */}
        <img
          src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1200&auto=format&fit=crop"
          alt="Aquarium placeholder"
          className="w-full h-full object-cover"
        />
        {/* Water ripple reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent mix-blend-overlay pointer-events-none" />
        {/* Overlay tags and neon button */}
        <div className="absolute inset-0 p-3 flex items-start justify-between">
          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs rounded bg-amber-400/90 text-white shadow-[0_0_12px_rgba(245,158,11,0.7)]">gasping: none</span>
            <span className="px-2 py-1 text-xs rounded bg-blue-500/90 text-white shadow-[0_0_12px_rgba(59,130,246,0.7)]">count: 12</span>
          </div>
          <button className="px-3 py-1 text-sm rounded bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.8)] hover:shadow-[0_0_18px_rgba(99,102,241,1)] transition">View Live</button>
        </div>
      </div>
    </div>
  )
}