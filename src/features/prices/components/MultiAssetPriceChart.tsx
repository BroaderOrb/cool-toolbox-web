import { useEffect, useMemo, useRef, useState } from "react"
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts"

type Props = {
  assets: string[]
  start: string   // YYYY-MM-DD
  end: string     // YYYY-MM-DD
  vsCurrency: string
  apiBase: string // e.g., http://127.0.0.1:8000
  autoRefresh?: boolean
  refreshMs?: number
}

// Adapt to your actual backend response shape here
function parseSeries(asset: string, raw: any): Array<{ date: string; [k: string]: number | string }> {
  // Case A: backend returns [{date:"2024-01-01", price: 12345}, ...]
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object" && "date" in raw[0] && "price" in raw[0]) {
    return raw.map((r: any) => ({ date: r.date, [asset]: Number(r.price) }))
  }
  // Case B: CoinGecko-style: [[timestamp(ms), price], ...]
  if (Array.isArray(raw) && raw.length && Array.isArray(raw[0])) {
    return raw.map(([ts, price]: [number, number]) => {
      const d = new Date(ts).toISOString().slice(0, 10)
      return { date: d, [asset]: Number(price) }
    })
  }
  // Fallback: give up gracefully
  console.warn("Unknown series format for", asset, raw?.[0])
  return []
}

export default function MultiAssetPriceChart({ assets, start, end, vsCurrency, apiBase, autoRefresh = false, refreshMs = 30000 }: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<number | null>(null)

  const query = useMemo(() => ({ assets: assets.join(","), start, end, vsCurrency }), [assets, start, end, vsCurrency])

  async function load() {
    setLoading(true)
    try {
      // Example endpoint per asset; change to match your FastAPI:
      // GET /history/{asset}?vs_currency=USD&start=YYYY-MM-DD&end=YYYY-MM-DD
      const results = await Promise.all(
        assets.map(async (asset) => {
          const url = `${apiBase}/history/${encodeURIComponent(asset)}?vs_currency=${encodeURIComponent(vsCurrency)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
          const r = await fetch(url)
          if (!r.ok) throw new Error(`${asset} failed: ${r.status}`)
          const json = await r.json()
          return parseSeries(asset, json)
        })
      )

      // Merge by date
      const byDate = new Map<string, any>()
      for (const series of results) {
        for (const row of series) {
          const existing = byDate.get(row.date) ?? { date: row.date }
          Object.assign(existing, row)
          byDate.set(row.date, existing)
        }
      }
      const merged = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
      setData(merged)
    } catch (err) {
      console.error(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // initial + on prop change
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.assets, query.start, query.end, query.vsCurrency, apiBase])

  // optional auto-refresh
  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
      return
    }
    timerRef.current = window.setInterval(load, refreshMs)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [autoRefresh, refreshMs])

  return (
    <div className="h-full w-full">
      {loading && <div className="text-sm opacity-70 pb-2">Loading…</div>}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={24} />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          <Legend />
          {assets.map((a) => (
            <Line key={a} dataKey={a} type="monotone" dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {!data.length && !loading && (
        <div className="text-sm opacity-70 pt-2">No data for the selected range.</div>
      )}
    </div>
  )
}
