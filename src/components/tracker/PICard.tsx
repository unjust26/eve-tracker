import { useState, useEffect } from "react";
import { getMarketPrices, PI_COMMODITIES, formatIsk, type MarketPrice } from "@/lib/esi";

interface PIDisplay {
  name: string;
  tier: string;
  typeId: number;
  avgPrice: number;
  adjPrice: number;
}

export function PICard() {
  const [items, setItems] = useState<PIDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState("P2");
  const [sortBy, setSortBy] = useState<"price" | "name">("price");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prices = await getMarketPrices();
        const priceMap = new Map<number, MarketPrice>();
        prices.forEach((p) => priceMap.set(p.type_id, p));

        // Deduplicate PI_COMMODITIES by typeId
        const seen = new Set<number>();
        const results: PIDisplay[] = [];
        for (const item of PI_COMMODITIES) {
          if (seen.has(item.typeId)) continue;
          seen.add(item.typeId);
          const p = priceMap.get(item.typeId);
          if (!p) continue;
          results.push({
            name: item.name,
            tier: item.tier,
            typeId: item.typeId,
            avgPrice: p.average_price || 0,
            adjPrice: p.adjusted_price || 0,
          });
        }
        if (!cancelled) setItems(results);
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const tiers = ["P1", "P2", "P3", "P4"];
  const filtered = items
    .filter((i) => i.tier === tierFilter && i.avgPrice > 0)
    .sort((a, b) => sortBy === "price" ? b.avgPrice - a.avgPrice : a.name.localeCompare(b.name));

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>🪐</span> PI Commodity Prices
        </h3>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-1">
          {tiers.map((t) => (
            <button key={t} onClick={() => setTierFilter(t)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${tierFilter === t ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => setSortBy(sortBy === "price" ? "name" : "price")}
          className="text-[10px] text-slate-500 hover:text-slate-300">
          Sort: {sortBy === "price" ? "💰 Price" : "🔤 Name"}
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-600 animate-pulse">Loading PI data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-xs text-slate-600">No data for {tierFilter}</div>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
          {filtered.map((item, i) => {
            const maxPrice = Math.max(...filtered.map((f) => f.avgPrice));
            const barW = maxPrice > 0 ? (item.avgPrice / maxPrice) * 100 : 0;
            return (
              <div key={item.typeId} className="flex items-center gap-2 py-1 group hover:bg-slate-800/30 rounded px-1 transition-colors">
                <span className="text-[10px] text-slate-600 w-4 text-right">{i + 1}</span>
                <span className="text-xs text-white flex-1 truncate">{item.name}</span>
                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                  <div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${barW}%` }} />
                </div>
                <span className="text-xs text-emerald-400 tabular-nums min-w-[60px] text-right font-medium">
                  {formatIsk(item.avgPrice)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-2 text-[9px] text-slate-700">
        Global average prices · Higher {tierFilter} = more profitable extraction chains
      </div>
    </div>
  );
}
