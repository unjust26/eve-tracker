import { useState, useEffect, useCallback } from "react";
import { TRADE_HUBS, formatIsk } from "@/lib/esi";

interface MarginItem {
  typeId: number;
  name: string;
  buyPrice: number;
  sellPrice: number;
  margin: number;
  marginPct: number;
  volume: number;
  dailyProfit: number;
}

// High-volume tradeable items to scan for margins
const SCAN_ITEMS: { name: string; typeId: number }[] = [
  // Minerals
  { name: "Tritanium", typeId: 34 },
  { name: "Pyerite", typeId: 35 },
  { name: "Mexallon", typeId: 36 },
  { name: "Isogen", typeId: 37 },
  { name: "Nocxium", typeId: 38 },
  { name: "Zydrine", typeId: 39 },
  { name: "Megacyte", typeId: 40 },
  { name: "Morphite", typeId: 11399 },
  // PI & Fuel
  { name: "Enriched Uranium", typeId: 44 },
  { name: "Robotics", typeId: 9848 },
  { name: "Consumer Electronics", typeId: 9836 },
  { name: "Coolant", typeId: 9832 },
  { name: "Mechanical Parts", typeId: 3689 },
  { name: "Oxygen", typeId: 3683 },
  { name: "PLEX", typeId: 44992 },
  // Ammo
  { name: "Antimatter Charge S", typeId: 189 },
  { name: "Antimatter Charge M", typeId: 3106 },
  { name: "Scourge Light Missile", typeId: 209 },
  { name: "Mjolnir Heavy Missile", typeId: 2613 },
  // Drones
  { name: "Hobgoblin I", typeId: 2454 },
  { name: "Hammerhead I", typeId: 2183 },
  { name: "Ogre I", typeId: 2446 },
  // Modules
  { name: "Damage Control I", typeId: 2046 },
  { name: "1MN Afterburner I", typeId: 434 },
  // Ships
  { name: "Venture", typeId: 32880 },
  { name: "Gnosis", typeId: 3756 },
  { name: "Vexor", typeId: 626 },
];

export function MarginFinderCard() {
  const [items, setItems] = useState<MarginItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState(0); // index into TRADE_HUBS

  const fetchMargins = useCallback(async () => {
    try {
      const regionId = TRADE_HUBS[hub].regionId;
      const typeIds = SCAN_ITEMS.map((i) => i.typeId).join(",");
      const resp = await fetch(`https://market.fuzzwork.co.uk/aggregates/?region=${regionId}&types=${typeIds}`);
      if (!resp.ok) return;
      const data = await resp.json();

      const results: MarginItem[] = [];
      for (const item of SCAN_ITEMS) {
        const d = data[String(item.typeId)];
        if (!d) continue;
        const buyMax = parseFloat(d.buy?.percentile ?? d.buy?.max ?? "0");
        const sellMin = parseFloat(d.sell?.percentile ?? d.sell?.min ?? "0");
        const sellVol = parseFloat(d.sell?.volume ?? "0");
        const buyVol = parseFloat(d.buy?.volume ?? "0");
        if (buyMax <= 0 || sellMin <= 0) continue;
        const margin = sellMin - buyMax;
        const marginPct = (margin / sellMin) * 100;
        const avgVol = Math.min(sellVol, buyVol);
        results.push({
          typeId: item.typeId,
          name: item.name,
          buyPrice: buyMax,
          sellPrice: sellMin,
          margin,
          marginPct,
          volume: avgVol,
          dailyProfit: margin * Math.min(avgVol * 0.01, 1000), // estimate
        });
      }
      results.sort((a, b) => b.marginPct - a.marginPct);
      setItems(results);
    } catch { /* silent */ }
    setLoading(false);
  }, [hub]);

  useEffect(() => {
    setLoading(true);
    fetchMargins();
  }, [fetchMargins]);

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>📊</span> Market Margin Finder
        </h3>
      </div>
      <div className="flex gap-1 mb-2 flex-wrap">
        {TRADE_HUBS.map((h, i) => (
          <button key={h.name} onClick={() => setHub(i)}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${hub === i ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`}>
            {h.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-xs text-slate-600 animate-pulse">Scanning margins in {TRADE_HUBS[hub].name}...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-600 border-b border-slate-800/40">
                <th className="text-left py-1 font-normal">Item</th>
                <th className="text-right py-1 font-normal">Buy (5%)</th>
                <th className="text-right py-1 font-normal">Sell (5%)</th>
                <th className="text-right py-1 font-normal">Margin</th>
                <th className="text-right py-1 font-normal">%</th>
              </tr>
            </thead>
            <tbody>
              {items.filter((i) => i.marginPct > 0).slice(0, 20).map((item) => (
                <tr key={item.typeId} className="border-b border-slate-800/20 hover:bg-slate-800/30 transition-colors">
                  <td className="py-1.5 text-white">{item.name}</td>
                  <td className="text-right text-green-400/80 tabular-nums">{formatIsk(item.buyPrice)}</td>
                  <td className="text-right text-red-400/80 tabular-nums">{formatIsk(item.sellPrice)}</td>
                  <td className="text-right text-amber-400 tabular-nums">{formatIsk(item.margin)}</td>
                  <td className={`text-right tabular-nums font-medium ${item.marginPct >= 20 ? "text-green-400" : item.marginPct >= 10 ? "text-yellow-400" : "text-slate-400"}`}>
                    {item.marginPct.toFixed(1)}%
                    {item.marginPct >= 30 && " 🔥"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2 text-[9px] text-slate-700">
        Buy/Sell = 5th percentile prices via Fuzzwork · Place buy orders at Buy, sell at Sell · Margin = profit per unit
      </div>
    </div>
  );
}
