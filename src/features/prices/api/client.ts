// src/features/prices/api/client.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const DEFAULT_CCY = "USD";

export function fmtDate(d: string | number | Date) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function subDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function mergeSeries(seriesByAsset: Record<string, any[]>) {
  const map = new Map<string, any>();
  for (const [asset, rows] of Object.entries(seriesByAsset)) {
    if (!rows) continue;
    for (const row of rows) {
      let dateKey: string | undefined;
      let price: number | undefined;
      if (Array.isArray(row) && row.length >= 2) {
        const ts = row[0];
        dateKey = fmtDate(typeof ts === "number" ? ts : Date.parse(ts));
        price = Number(row[1]);
      } else if (row && typeof row === "object") {
        const raw = (row as any).date || (row as any).time || (row as any).timestamp || (row as any).t || (row as any)["0"];
        dateKey = fmtDate(typeof raw === "number" ? raw : Date.parse(raw));
        price = Number((row as any).price ?? (row as any).p ?? (row as any)["1"]);
      } else {
        continue;
      }
      if (!map.has(dateKey)) map.set(dateKey, { date: dateKey });
      (map.get(dateKey) as any)[asset] = price;
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function fetchHistory(asset: string, start: string, end: string, vs = DEFAULT_CCY) {
  const url = `${API_BASE}/history/${encodeURIComponent(asset)}?vs_currency=${encodeURIComponent(vs)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} for ${asset}${text ? `: ${text}` : ""}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any).prices)) return (data as any).prices;
  if (Array.isArray((data as any).history)) return (data as any).history;
  if (Array.isArray((data as any).data)) return (data as any).data;
  throw new Error(`Unexpected payload for ${asset}`);
}