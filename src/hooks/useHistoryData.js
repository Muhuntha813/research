import { useEffect, useMemo, useState } from 'react'

const ranges = {
  '6h': 6 * 3600_000,
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
}

// Default values and noise amplitudes for mock history generation
const metricDefaults = {
  ph: { base: 7.2, noise: 0.05, round: 2 },
  tds: { base: 220, noise: 3, round: 0 },
  do: { base: 6.5, noise: 0.1, round: 2 },
  waterTemp: { base: 26.0, noise: 0.2, round: 2 },
  temp: { base: 26.0, noise: 0.2, round: 2 },
  airTemp: { base: 25.0, noise: 0.3, round: 2 },
  humidity: { base: 55, noise: 1.5, round: 0 },
  sound: { base: 45, noise: 1.5, round: 0 },
  level: { base: 12.0, noise: 0.2, round: 2 },
  ntu: { base: 4.0, noise: 0.3, round: 2 },
}

function generateMockHistory(metric, from, to) {
  const { base = 10, noise = 1, round = 2 } = metricDefaults[metric] || {}
  const startMs = from.getTime()
  const endMs = to.getTime()
  const duration = Math.max(endMs - startMs, 60_000) // at least 1 minute span
  const desiredPoints = 240 // roughly 4 points per hour
  const step = Math.max(Math.floor(duration / desiredPoints), 60_000) // minimum 1 minute

  let current = base
  const points = []
  for (let ts = startMs; ts <= endMs; ts += step) {
    // Random walk with bounding
    const delta = (Math.random() * 2 - 1) * noise
    current += delta

    // Keep values within reasonable bounds
    if (metric === 'ph') current = Math.min(Math.max(current, 6.2), 8.8)
    if (metric === 'waterTemp' || metric === 'temp' || metric === 'airTemp') current = Math.min(Math.max(current, 18), 32)
    if (metric === 'humidity') current = Math.min(Math.max(current, 30), 85)
    if (metric === 'sound') current = Math.min(Math.max(current, 30), 95)
    if (metric === 'level') current = Math.min(Math.max(current, 8), 18)

    const value =
      round === 0 ? Math.round(current) : Number(current.toFixed(round))
    points.push({ ts: new Date(ts).toISOString(), value })
  }

  return points
}

export function useHistoryData(metrics = ['ph'], rangeKey = '24h') {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const windowMs = ranges[rangeKey] ?? ranges['24h']
  const to = new Date()
  const from = new Date(to.getTime() - windowMs)

  useEffect(() => {
    let cancelled = false
    async function fetchMetric(metric) {
      const url = `/api/v1/history?metric=${encodeURIComponent(metric)}&from=${from.toISOString()}&to=${to.toISOString()}`
      try {
        const res = await fetch(url)
        const text = await res.text()

        if (!res.ok) {
          throw new Error(`history fetch failed (${res.status})`)
        }

        let json
        try {
          json = JSON.parse(text)
        } catch (parseError) {
          throw new Error(`Invalid JSON from history API: ${parseError.message}`)
        }

        if (!json || !Array.isArray(json.points) || json.points.length === 0) {
          return {
            metric,
            points: generateMockHistory(metric, from, to),
            fallback: true,
          }
        }

        return json
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(
            `[useHistoryData] Falling back to mock data for metric "${metric}":`,
            err,
          )
        }
        return {
          metric,
          points: generateMockHistory(metric, from, to),
          fallback: true,
        }
      }
    }
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const results = await Promise.all(metrics.map(fetchMetric))
        if (!cancelled) {
          const byMetric = {}
          results.forEach(r => { byMetric[r.metric] = r.points })
          setData(byMetric)
        }
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [rangeKey, metrics.map(m => m).join('|')])

  const timeDomain = useMemo(() => ({ from, to }), [rangeKey])

  return { data, loading, error, timeDomain }
}