import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    configureServer(server) {
      // In-memory mock data stores
      const rules = [
        {
          id: 'r1', name: 'Level pump',
          condition: { type: 'composite', op: 'or', clauses: [{ metric: 'level', op: '>', value: 10 }] },
          action: { device: 'pump', state: 1, min_runtime_s: 600 },
          hysteresis: { on: 12, off: 9 },
          enabled: true,
        },
        {
          id: 'r2', name: 'pH-based filter',
          condition: { type: 'composite', op: 'or', clauses: [{ metric: 'ph', op: '<', value: 6.8 }] },
          action: { device: 'filter', state: 1, min_runtime_s: 900 },
          hysteresis: { on: 6.7, off: 7.0 },
          enabled: true,
        },
        {
          id: 'r3', name: 'DO → air',
          condition: { type: 'composite', op: 'or', clauses: [{ metric: 'do', op: '<', value: 5.5 }] },
          action: { device: 'air', state: 1, min_runtime_s: 600 },
          hysteresis: { on: 5.4, off: 6.0 },
          enabled: true,
        },
      ]

      const aiEvents = Array.from({ length: 40 }, (_, i) => ({
        type: i % 3 === 0 ? 'gasping' : i % 3 === 1 ? 'erratic' : 'count',
        score: Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
        frame: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=600&auto=format&fit=crop',
        ts: new Date(Date.now() - i * 3600_000).toISOString(),
        bbox: [{ x: 0.1, y: 0.2, w: 0.2, h: 0.2 }],
      }))

      const genSeries = (metric) => {
        // Generate data for the last 30 days
        const start = Date.now() - 30 * 24 * 3600_000
        const points = []
        const step = 5 * 60 * 1000 // 5 min
        // Base values for each metric
        let base = metric === 'ph' ? 7.2 
          : metric === 'tds' ? 220 
          : metric === 'do' ? 6.5 
          : metric === 'temp' ? 26.0 
          : metric === 'waterTemp' ? 26.0
          : metric === 'airTemp' ? 25.0
          : metric === 'humidity' ? 55
          : metric === 'sound' ? 45
          : metric === 'ntu' ? 4.0 
          : metric === 'level' ? 12.0 
          : 0
        // Noise amounts for each metric
        const noiseAmt = metric === 'ph' ? 0.05 
          : metric === 'tds' ? 3 
          : metric === 'do' ? 0.1 
          : metric === 'temp' ? 0.2
          : metric === 'waterTemp' ? 0.2
          : metric === 'airTemp' ? 0.3
          : metric === 'humidity' ? 1.5
          : metric === 'sound' ? 1.5
          : metric === 'ntu' ? 0.3 
          : metric === 'level' ? 0.2 
          : 0.1
        for (let t = start; t <= Date.now(); t += step) {
          const noise = (Math.random() * 2 - 1) * noiseAmt
          base = base + noise
          points.push({ ts: new Date(t).toISOString(), value: Number(base.toFixed(2)) })
        }
        console.log(`[genSeries] Generated ${points.length} points for ${metric}, from ${new Date(start).toISOString()} to ${new Date().toISOString()}`)
        return points
      }

      const historyCache = new Map()

      // Load species profiles for dev server
      let speciesProfiles = []
      try {
        const speciesData = readFileSync(join(process.cwd(), 'src/data/speciesProfiles.mock.json'), 'utf-8')
        speciesProfiles = JSON.parse(speciesData)
      } catch (e) {
        console.warn('Could not load species profiles:', e)
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        
        // Species API
        if (url.pathname === '/api/v1/species' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(speciesProfiles))
          return
        }
        if (url.pathname.startsWith('/api/v1/species/') && req.method === 'GET') {
          const id = url.pathname.split('/').pop()
          const species = speciesProfiles.find(s => s.id === id)
          if (species) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(species))
          } else {
            res.statusCode = 404
            res.end(JSON.stringify({ ok: false, error: 'Species not found' }))
          }
          return
        }

        // Tank profile API (mock implementation)
        if (url.pathname.startsWith('/api/v1/user/tank/') && url.pathname.endsWith('/profile') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ selectedSpecies: [], mergedRanges: {}, conflicts: [], recommendations: [] }))
          return
        }
        if (url.pathname.startsWith('/api/v1/user/tank/') && url.pathname.endsWith('/species') && req.method === 'POST') {
          let body = ''
          req.on('data', (c) => body += c)
          req.on('end', () => {
            try {
              const payload = JSON.parse(body)
              const selected = speciesProfiles.filter(s => payload.selectedSpecies?.includes(s.id) || [])
              
              // Compute merged ranges
              const metrics = ['ph', 'temp', 'do', 'tds', 'ntu']
              const mergedRanges = {}
              const conflicts = []
              const recommendations = []

              metrics.forEach(metric => {
                const ranges = selected.map(s => s.ranges[metric])
                if (ranges.length === 0) {
                  mergedRanges[metric] = null
                  return
                }

                const maxMin = Math.max(...ranges.map(r => r[0]))
                const minMax = Math.min(...ranges.map(r => r[1]))

                if (maxMin > minMax) {
                  mergedRanges[metric] = null
                  conflicts.push({
                    metric,
                    species: selected.map(s => s.name),
                    ranges,
                  })

                  const mins = ranges.map(r => r[0]).sort((a, b) => a - b)
                  const maxs = ranges.map(r => r[1]).sort((a, b) => a - b)
                  const suggestedMin = mins[Math.floor(mins.length / 2)]
                  const suggestedMax = maxs[Math.floor(maxs.length / 2)]

                  recommendations.push({
                    metric,
                    suggested_range: [suggestedMin, suggestedMax],
                  })
                } else {
                  mergedRanges[metric] = [maxMin, minMax]
                }
              })

              const calibrationPresets = {
                ph_offset: selected.reduce((sum, s) => sum + s.calibration_presets.ph_offset, 0) / selected.length,
                temp_offset: selected.reduce((sum, s) => sum + s.calibration_presets.temp_offset, 0) / selected.length,
                do_calibration: selected.reduce((sum, s) => sum + s.calibration_presets.do_calibration, 0) / selected.length,
              }

              const suggestedRules = []
              if (mergedRanges.ph) {
                suggestedRules.push({
                  type: 'ph',
                  condition: `ph < ${mergedRanges.ph[0]} || ph > ${mergedRanges.ph[1]}`,
                  action: 'alert',
                })
              }
              if (mergedRanges.temp) {
                suggestedRules.push({
                  type: 'temp',
                  condition: `temp < ${mergedRanges.temp[0]} || temp > ${mergedRanges.temp[1]}`,
                  action: 'adjust_heater',
                })
              }
              if (mergedRanges.do) {
                suggestedRules.push({
                  type: 'do',
                  condition: `do < ${mergedRanges.do[0]}`,
                  action: 'turn_on_air',
                })
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                ok: true,
                conflict: conflicts.length > 0,
                conflicts,
                recommendations,
                suggestedRules,
                calibrationPresets,
                mergedRanges,
              }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: e.message }))
            }
          })
          return
        }

        // history
        if (url.pathname === '/api/v1/history') {
          const metric = url.searchParams.get('metric') || 'ph'
          const from = url.searchParams.get('from')
          const to = url.searchParams.get('to')
          let points = historyCache.get(metric)
          if (!points) { 
            points = genSeries(metric)
            historyCache.set(metric, points)
          }
          // Parse date range - if dates are provided, filter; otherwise return all
          let filtered = points
          if (from || to) {
            const fromTs = from ? new Date(from).getTime() : 0
            const toTs = to ? new Date(to).getTime() : Date.now()
            filtered = points.filter(p => {
              const ts = new Date(p.ts).getTime()
              return ts >= fromTs && ts <= toTs
            })
          }
          console.log(`[History API] Metric: ${metric}, Total: ${points.length}, Filtered: ${filtered.length}, From: ${from || 'all'}, To: ${to || 'all'}`)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ metric, points: filtered }))
          return
        }

        // rules
        if (url.pathname === '/api/v1/rules' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(rules))
          return
        }
        if (url.pathname === '/api/v1/rules' && req.method === 'POST') {
          let body = ''
          req.on('data', (c) => body += c)
          req.on('end', () => {
            try {
              const rule = JSON.parse(body)
              const idx = rules.findIndex(r => r.id === rule.id)
              if (idx >= 0) rules[idx] = rule; else rules.push(rule)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, rule }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false }))
            }
          })
          return
        }

        // simulate
        if (url.pathname === '/api/v1/rules/simulate' && req.method === 'POST') {
          let body = ''
          req.on('data', (c) => body += c)
          req.on('end', () => {
            try {
              const { ruleId, from, to } = JSON.parse(body)
              const rule = rules.find(r => r.id === ruleId)
              const actions = []
              if (rule) {
                // naive mock: generate a few actions across window
                const fromTs = new Date(from).getTime()
                const toTs = new Date(to).getTime()
                for (let t = fromTs; t < toTs; t += 6 * 3600_000) {
                  actions.push({ ts: new Date(t).toISOString(), device: rule.action.device, state: rule.action.state })
                }
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, actions }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false }))
            }
          })
          return
        }

        // AI events
        if (url.pathname === '/api/v1/ai/events' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ items: aiEvents, next: null }))
          return
        }
        if (url.pathname === '/api/v1/ai/events' && req.method === 'POST') {
          let body = ''
          req.on('data', (c) => body += c)
          req.on('end', () => {
            try {
              const ev = JSON.parse(body)
              aiEvents.unshift(ev)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false }))
            }
          })
          return
        }

        // Predict
        if (url.pathname === '/api/v1/predict' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ unsafe_prob: 0.34, recommendation: 'filter 15m tonight' }))
          return
        }

        // Calibrate
        if (url.pathname.startsWith('/api/v1/calibrate/') && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
          return
        }

        // Notify test
        if (url.pathname === '/api/v1/notify/test' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
          return
        }

        next()
      })
    }
  }
})
