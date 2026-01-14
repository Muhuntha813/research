import { ResponsiveContainer, LineChart, Line } from 'recharts'

export default function MiniSparkline({ data, dataKey, color = '#2a9df4', title }) {
  return (
    <div className="card p-3">
      <div className="muted mb-1">{title}</div>
      <div style={{ width: '100%', height: 60 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}