import { useState, useEffect } from "react";
import { getMarketPrices, ORES, MINERALS, ORE_REPROCESS, formatIsk, type MarketPrice } from "@/lib/esi";

interface OreValue {
  name: string;
  secClass: string;
  typeId: number;
  orePrice: number;
  mineralValue: number; // value of minerals from reprocessing 100 ore
  profitPct: number;
  minerals: { name: string; amount: number; value: number }[];
}

export function OreReprocessCard() {
  const [ores, setOres] = useState<OreValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [efficiency, setEfficiency] = useState(50); // reprocessing efficiency %
  const [secFilter, setSecFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prices = await getMarketPrices();
        const priceMap = new Map<number, number>();
        prices.forEach((p: MarketPrice) => {
          priceMap.set(p.type_id, p.average_price || 0);
        });

        const mineralPrices = new Map<string, number>();
        MINERALS.forEach((m) => {
          mineralPrices.set(m.name, priceMap.get(m.typeId) || 0);
        });

        const eff = efficiency / 100;
        const results: OreValue[] = [];
        for (const ore of ORES) {
          const reprocess = ORE_REPROCESS[ore.name];
          if (!reprocess) continue;
          const orePrice = (priceMap.get(ore.typeId) || 0) * 100; // price for 100 ore

          let totalMineralValue = 0;
          const mineralBreakdown: { name: string; amount: number; value: number }[] = [];
          for (const [mineral, amount] of Object.entries(reprocess)) {
            const adjAmount = Math.floor(amount * eff);
            const mPrice = mineralPrices.get(mineral) || 0;
            const val = adjAmount * mPrice;
            totalMineralValue += val;
            if (adjAmount > 0) mineralBreakdown.push({ name: mineral, amount: adjAmount, value: val });
          }

          const profitPct = orePrice > 0 ? ((totalMineralValue - orePrice) / orePrice) * 100 : 0;
          results.push({
            name: ore.name,
            secClass: ore.secClass,
            typeId: ore.typeId,
            orePrice,
            mineralValue: totalMineralValue,
            profitPct,
            minerals: mineralBreakdown.sort((a, b) => b.value - a.value),
          });
        }
        results.sort((a, b) => b.profitPct - a.profitPct);
        if (!cancelled) setOres(results);
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [efficiency]);

  const filtered = secFilter === "All" ? ores : ores.filter((o) => o.secClass === secFilter);

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>⚗️</span> Ore Reprocessing Calculator
        </h3>
      </div>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <div className="flex gap-1">
          {["All", "Highsec", "Lowsec", "Nullsec"].map((s) => (
            <button key={s} onClick={() => setSecFilter(s)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${secFilter === s ? "bg-violet-500/20 text-violet-300" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">Efficiency:</span>
          <input type="range" min={30} max={72} value={efficiency}
            onChange={(e) => setEfficiency(Number(e.target.value))}
            className="w-20 h-1 accent-violet-500" />
          <span className="text-[10px] text-violet-400 tabular-nums w-8">{efficiency}%</span>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-slate-600 animate-pulse">Calculating reprocess values...</div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
          {filtered.map((ore) => {
            const isProfitable = ore.profitPct > 0;
            return (
              <div key={ore.typeId} className="rounded bg-slate-800/30 p-2 border border-slate-800/30 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-medium">{ore.name}</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded ${
                      ore.secClass === "Highsec" ? "bg-green-500/20 text-green-400" :
                      ore.secClass === "Lowsec" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>{ore.secClass}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-slate-500">Cost: {formatIsk(ore.orePrice)}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-violet-400">Yield: {formatIsk(ore.mineralValue)}</span>
                    <span className={`font-medium ${isProfitable ? "text-green-400" : "text-red-400"}`}>
                      {isProfitable ? "+" : ""}{ore.profitPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {ore.minerals.map((m) => (
                    <span key={m.name} className="text-[9px] text-slate-500">
                      {m.name}: {m.amount} ({formatIsk(m.value)})
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-2 text-[9px] text-slate-700">
        Per 100 units of ore · Efficiency: station 50%, rigged Athanor up to 72% · Green = reprocess profit
      </div>
    </div>
  );
}
