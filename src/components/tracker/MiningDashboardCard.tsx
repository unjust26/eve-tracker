import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketPrices, MINERALS, ORES, type MarketPrice } from "@/lib/esi";

interface PricedItem {
  name: string;
  typeId: number;
  averagePrice: number;
  adjustedPrice: number;
  secClass?: string;
}

export function MiningDashboardCard() {
  const [minerals, setMinerals] = useState<PricedItem[]>([]);
  const [ores, setOres] = useState<PricedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"minerals" | "ores">("minerals");

  const loadData = useCallback(async () => {
    try {
      const prices = await getMarketPrices();
      const priceMap = new Map<number, MarketPrice>();
      prices.forEach((p) => priceMap.set(p.type_id, p));

      const mineralData: PricedItem[] = MINERALS.map((m) => {
        const p = priceMap.get(m.typeId);
        return {
          name: m.name,
          typeId: m.typeId,
          averagePrice: p?.average_price ?? 0,
          adjustedPrice: p?.adjusted_price ?? 0,
        };
      }).sort((a, b) => b.averagePrice - a.averagePrice);

      const oreData: PricedItem[] = ORES.map((o) => {
        const p = priceMap.get(o.typeId);
        return {
          name: o.name,
          typeId: o.typeId,
          averagePrice: p?.average_price ?? 0,
          adjustedPrice: p?.adjusted_price ?? 0,
          secClass: o.secClass,
        };
      }).sort((a, b) => b.averagePrice - a.averagePrice);

      setMinerals(mineralData);
      setOres(oreData);
    } catch (e) {
      console.error("Failed to load mining prices:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const formatPrice = (p: number) => {
    if (p === 0) return "—";
    if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(2)}M`;
    if (p >= 1_000) return `${(p / 1_000).toFixed(2)}K`;
    return p.toFixed(2);
  };

  const items = tab === "minerals" ? minerals : ores;
  const maxPrice = items.length > 0 ? Math.max(...items.map((i) => i.averagePrice)) : 1;

  const secBadge = (sec?: string) => {
    if (!sec) return null;
    const colors: Record<string, string> = {
      Highsec: "bg-green-500/20 text-green-400",
      Lowsec: "bg-orange-500/20 text-orange-400",
      Nullsec: "bg-red-500/20 text-red-400",
    };
    return (
      <span className={`text-[9px] px-1.5 py-0.5 rounded ${colors[sec] ?? "bg-slate-700 text-slate-400"}`}>
        {sec}
      </span>
    );
  };

  return (
    <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-amber-400">⛏️</span> MINING COMMODITIES
          </CardTitle>
          <div className="flex gap-1">
            {(["minerals", "ores"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-[11px] px-3 py-1 rounded-full transition-colors ${
                  tab === t
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-700/30"
                }`}
              >
                {t === "minerals" ? "Minerals" : "Ores"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Loading market data…</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => {
              const barWidth = maxPrice > 0 ? (item.averagePrice / maxPrice) * 100 : 0;
              const adjustedDiff = item.adjustedPrice > 0 && item.averagePrice > 0
                ? ((item.averagePrice - item.adjustedPrice) / item.adjustedPrice) * 100
                : 0;

              return (
                <div key={item.typeId} className="flex items-center gap-2 text-xs">
                  <div className="w-28 flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-300 font-medium truncate">{item.name}</span>
                    {item.secClass && secBadge(item.secClass)}
                  </div>
                  <div className="flex-1 h-4 bg-slate-800/50 rounded-sm overflow-hidden relative">
                    <div
                      className="h-full rounded-sm bg-gradient-to-r from-amber-600/80 to-amber-400/80"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-amber-400 w-16 text-right font-medium tabular-nums">
                    {formatPrice(item.averagePrice)}
                  </span>
                  <span className={`w-12 text-right text-[10px] tabular-nums ${
                    adjustedDiff > 0 ? "text-green-400" : adjustedDiff < 0 ? "text-red-400" : "text-slate-600"
                  }`}>
                    {adjustedDiff !== 0 ? `${adjustedDiff > 0 ? "+" : ""}${adjustedDiff.toFixed(1)}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-slate-600 mt-3">
          Global average prices · % = market vs adjusted price deviation
        </p>
      </CardContent>
    </Card>
  );
}
