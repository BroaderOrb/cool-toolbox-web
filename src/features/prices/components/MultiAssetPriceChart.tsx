import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Page, PageHeader, PageContent } from "@/components/ui/page";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchHistory, fmtDate, subDays, mergeSeries, API_BASE, DEFAULT_CCY } from "../api/client";

const DEFAULT_ASSETS = ["BTC", "ETH", "SOL", "ADA"];
const DEFAULT_SELECTED = ["BTC", "ETH"];

export default function MultiAssetPriceChart() {
  const [assets] = useState(DEFAULT_ASSETS);
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);
  const [vs, setVs] = useState<string>(DEFAULT_CCY);
  const [start, setStart] = useState<string>(fmtDate(subDays(30)));
  const [end, setEnd] = useState<string>(fmtDate(new Date()));
  const [logScale, setLogScale] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any[]>([]);

  const yAxisType = (logScale ? "log" : "number") as const;
  const canLoad = selected.length > 0 && start <= end;

  const load = async () => {
    if (!canLoad) return;
    setLoading(true);
    setError("");
    try {
      const byAsset: Record<string, any[]> = {};
      await Promise.all(
        selected.map(async (a) => {
          byAsset[a] = await fetchHistory(a, start, end, vs);
        })
      );
      setData(mergeSeries(byAsset));
    } catch (e: any) {
      setError(e.message || String(e));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lines = useMemo(
    () =>
      selected.map((a) => (
        <Line key={a} type="monotone" dataKey={a} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
      )),
    [selected]
  );

  return (
    <Page>
      <PageHeader title="Multi-Asset Price Chart" description="View and compare multiple asset prices over time." />
      <PageContent>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="font-medium mb-2">Assets</div>
            <div className="flex flex-wrap gap-2">
              {assets.map((a) => (
                <Button key={a} variant={selected.includes(a) ? "default" : "outline"} size="sm" onClick={() => setSelected((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))}>
                  {a}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="font-medium mb-2">Date range</div>
            <div className="flex gap-2">
              <Input type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} />
              <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-2">
              {[
                [7, "7D"],
                [30, "30D"],
                [90, "90D"],
                [180, "6M"],
                [365, "1Y"],
              ].map(([d, label]) => (
                <Button key={label as string} variant="outline" size="xs" onClick={() => { setStart(fmtDate(subDays(d as number))); setEnd(fmtDate(new Date())); }}>
                  {label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="font-medium mb-2">Currency</div>
            <Select value={vs} onValueChange={(val) => setVs(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["USD", "GBP", "EUR"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 mt-3">
              <Checkbox checked={logScale} onCheckedChange={(v) => setLogScale(Boolean(v))} />
              <span className="text-sm">Log scale</span>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <Button className="w-full" disabled={!canLoad || loading} onClick={load}>
              {loading ? "Loading…" : "Load data"}
            </Button>
            {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
            <div className="text-xs text-gray-500 mt-2">API: {API_BASE.replace(/^https?:\/\//, "")}</div>
          </Card>
        </div>

        <Card className="p-4" style={{ height: 480 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" minTickGap={24} />
              <YAxis type={yAxisType} domain={["auto", "auto"]} allowDataOverflow />
              <Tooltip formatter={(value: any, name: any) => [Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 }), name]} />
              <Legend />
              {lines}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </PageContent>
    </Page>
  );
}