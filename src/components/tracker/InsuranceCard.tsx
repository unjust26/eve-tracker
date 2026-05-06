import { useState, useEffect } from "react";
import { getInsurancePrices, getMarketPrices, POPULAR_SHIPS, formatIsk, type InsurancePrice } from "@/lib/esi";

interface ShipInsurance {
  name: string;
  group: string;
  typeId: number;
  marketPrice: number;
  platinumCost: number;
  platinumPayout: number;
  profitRatio: number; // payout / marketPrice (higher = better deal)
}

export function InsuranceCard() {
  const [ships, setShips] = useState<ShipInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [insurance, market] = await Promise.all([getInsurancePrices(), getMarketPrices()]);
        const insMap = new Map<number, InsurancePrice>();
        insurance.forEach((i) => insMap.set(i.type_id, i));
        const mktMap = new Map<number, number>();
        market.forEach((m) => mktMap.set(m.type_id, m.average_price));

        const results: ShipInsurance[] = [];
        for (const ship of POPULAR_SHIPS) {
          const ins = insMap.get(ship.typeId);
          const mktPrice = mktMap.get(ship.typeId);
          if (!ins || !mktPrice || mktPrice === 0) continue;
          const platinum = ins.levels.find((l) => l.name === "Platinum");
          if (!platinum || platinum.payout === 0) continue;
          results.push({
            name: ship.name,
            group: ship.group,
            typeId: ship.typeId,
            marketPrice: mktPrice,
            platinumCost: platinum.cost,
            platinumPayout: platinum.payout,
            profitRatio: platinum.payout / mktPrice,
          });
        }
        results.sort((a, b) => b.profitRatio - a.profitRatio);
        if (!cancelled) setShips(results);
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const groups = ["All", ...new Set(POPULAR_SHIPS.map((s) => s.group))];
  const filtered = groupFilter === "All" ? ships : ships.filter((s) => s.group === groupFilter);

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>🛡️</span> Insurance Value Checker
        </h3>
      </div>
      <div className="flex gap-1 mb-2 flex-wrap">
        {groups.map((g) => (
          <button key={g} onClick={() => setGroupFilter(g)}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${groupFilter === g ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`}>
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-xs text-slate-600 animate-pulse">Loading insurance data...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-600 border-b border-slate-800/40">
                <th className="text-left py-1 font-normal">Ship</th>
                <th className="text-right py-1 font-normal">Market</th>
                <th className="text-right py-1 font-normal">Platinum Cost</th>
                <th className="text-right py-1 font-normal">Payout</th>
                <th className="text-right py-1 font-normal">Recovery %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const pct = s.profitRatio * 100;
                const isGood = pct >= 80;
                const isGreat = pct >= 100;
                return (
                  <tr key={s.typeId} className="border-b border-slate-800/20 hover:bg-slate-800/30 transition-colors">
                    <td className="py-1.5">
                      <span className="text-white font-medium">{s.name}</span>
                      <span className="text-slate-600 text-[10px] ml-1">{s.group}</span>
                    </td>
                    <td className="text-right text-slate-400 tabular-nums">{formatIsk(s.marketPrice)}</td>
                    <td className="text-right text-red-400/70 tabular-nums">{formatIsk(s.platinumCost)}</td>
                    <td className="text-right text-green-400 tabular-nums">{formatIsk(s.platinumPayout)}</td>
                    <td className={`text-right tabular-nums font-medium ${isGreat ? "text-green-400" : isGood ? "text-yellow-400" : "text-slate-500"}`}>
                      {pct.toFixed(0)}%
                      {isGreat && " 🔥"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2 text-[9px] text-slate-700">
        Recovery % = Platinum payout ÷ market price · &gt;100% = insurance profit on loss
      </div>
    </div>
  );
}
