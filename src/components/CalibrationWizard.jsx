import { useState } from 'react'

export default function CalibrationWizard() {
  const [metric, setMetric] = useState('ph')
  const [step, setStep] = useState(1)
  const [coeffs, setCoeffs] = useState({ a: '', b: '', c: '' })
  const [result, setResult] = useState(null)

  const next = () => setStep(s => Math.min(3, s + 1))
  const back = () => setStep(s => Math.max(1, s - 1))

  async function submit() {
    const res = await fetch(`/api/v1/calibrate/${metric}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coeffs }) })
    const json = await res.json()
    setResult(json)
    localStorage.setItem(`calibration:${metric}`, JSON.stringify(coeffs))
  }

  return (
    <div className="card p-4">
      <div className="font-medium mb-2">Calibration & Maintenance</div>
      <div className="flex gap-2 mb-2">
        <select className="px-2 py-1 rounded border" value={metric} onChange={e=>setMetric(e.target.value)}>
          <option>ph</option>
          <option>tds</option>
          <option>do</option>
          <option>ntu</option>
        </select>
      </div>
      <div className="card p-3">
        <div className="muted">Step {step} of 3</div>
        {step===1 && (
          <div className="mt-2">Prepare standard solution and rinse probes. Enter observed values.</div>
        )}
        {step===2 && (
          <div className="mt-2">Enter calibration coefficients (a,b,c) or derived factors.</div>
        )}
        {step===3 && (
          <div className="mt-2">Review settings and submit to store calibration.</div>
        )}
        <div className="mt-2 flex gap-2">
          <input className="px-2 py-1 rounded border" placeholder="a" value={coeffs.a} onChange={e=>setCoeffs({ ...coeffs, a: e.target.value })} />
          <input className="px-2 py-1 rounded border" placeholder="b" value={coeffs.b} onChange={e=>setCoeffs({ ...coeffs, b: e.target.value })} />
          <input className="px-2 py-1 rounded border" placeholder="c" value={coeffs.c} onChange={e=>setCoeffs({ ...coeffs, c: e.target.value })} />
        </div>
        <div className="mt-3 flex gap-2">
          <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" onClick={back}>Back</button>
          <button className="px-2 py-1 rounded bg-ocean-500 text-white" onClick={next}>Next</button>
          <button className="px-2 py-1 rounded bg-green-500 text-white" onClick={submit}>Submit</button>
        </div>
        {result && <div className="muted mt-2">Saved: {JSON.stringify(result)}</div>}
      </div>
    </div>
  )
}