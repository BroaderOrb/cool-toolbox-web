import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import MultiAssetPriceChart from "@/features/prices/components/MultiAssetPriceChart"

export default function PricesPage() {
  // Simple UI state
  const [assets, setAssets] = useState<string[]>(["BTC", "ETH"])
  const [start, setStart] = useState<string>("2025-06-01")
  const [end, setEnd] = useState<string>(new Date().toISOString().slice(0, 10))
  const [vs, setVs] = useState<string>("USD")
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Price chart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* assets as comma-separated list for quick edits */}
            <div className="col-span-2">
              <label className="block text-sm mb-1">Assets (comma-separated)</label>
              <Input
                value={assets.join(",")}
                onChange={(e) =>
                  setAssets(
                    e.target.value
                      .split(",")
                      .map(s => s.trim().toUpperCase())
                      .filter(Boolean)
                  )
                }
                placeholder="BTC,ETH,SOL"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Start</label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">End</label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="autorefresh" checked={autoRefresh} onCheckedChange={(v) => setAutoRefresh(Boolean(v))} />
              <label htmlFor="autorefresh" className="text-sm">Auto-refresh</label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">VS</span>
              <Input className="w-24" value={vs} onChange={(e) => setVs(e.target.value.toUpperCase())} />
            </div>
            <Button onClick={() => { /* no-op, chart reacts to state */ }}>Refresh</Button>
          </div>

          <div className="h-[420px]">
            <MultiAssetPriceChart
              assets={assets}
              start={start}
              end={end}
              vsCurrency={vs}
              // change this if your API runs on a different port/host
              apiBase={import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000"}
              autoRefresh={autoRefresh}
              refreshMs={30_000}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
