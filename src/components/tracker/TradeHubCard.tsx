import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TRADE_HUBS,
  MINERALS,
  HAULING_GOODS,
  getMarketOrders,
} from "@/lib/esi";

interface HubPrice {
  hub: string;
  sellMin: number | null;
  buyMax: number | null;
  sellVolume: number;
  buyVolume: number;
}

interface ItemRow {
  name: string;
  typeId: number;
  hubs: HubPrice[];
}

type ItemCategory = "minerals" | "hauling";

const ITEMS_BY_CATEGORY = {
  minerals: MINERALS,
  hauling: HAULING_GOODS,
};

export function TradeHubCard() {
  const [category, setCategory] = useState<ItemCategory>("minerals");
  const [data, setData] = useState<Record<string, ItemRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async (cat: ItemCategory) => {
    if (data[cat]) return; // already loaded
    setLoading(true);
    setError(null);
    try {
      const items = ITEMS_BY_CATEGORY[cat];
      // Fetch sell min prices for each item across 3 main hubs (Jita, Amarr, Dodixie) to reduce API calls
      const hubs = TRADE_HUBS.slice(0, 3);
      const rows: ItemRow[] = [];

      for (const item of items) {
        const hubPrices: HubPrice[] = [];
        const results = await Promise.all(
          hubs.map(async (hub) => {
            try {
              const [sellOrders, buyOrders] = await Promise.all([
                getMarketOrders(hub.regionId, item.typeId, "sell"),
                getMarketOrders(hub.regionId, item.typeId, "buy"),
              ]);
              const sellMin = sellOrders.length > 0 ? Math.min(...sellOrders.map((o) => o.price)) : null;
              const buyMax = buyOrders.length > 0 ? Math.max(...buyOrders.map((o) => o.price)) : null;
              const sellVol = sellOrders.reduce((sum, o) => sum + o.volume_remain, 0);
              const buyVol = buyOrders.reduce((sum, o) => sum + o.volume_remain, 0);
              return { hub: hub.name, sellMin, buyMax, sellVolume: sellVol, buyVolume: buyVol };
            } catch {
              return { hub: hub.name, sellMin: null, buyMax: null, sellVolume: 0, buyVolume: 0 };
            }
          })
        );
        hubPrices.push(...results);
        rows.push({ name: item.name, typeId: item.typeId, hubs: hubPrices });
      }

      setData((prev) => ({ ...prev, [cat]: rows }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load prices");
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetchPrices(category);
  }, [category, fetchPrices]);

  const formatPrice = (p: number | null) => {
    if (p === null) return "—";
    if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(2)}B`;
    if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(2)}M`;
    if (p >= 1_000) return `${(p / 1_000).toFixed(2)}K`;
    return p.toFixed(2);
  };

  const formatVol = (v: number) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toString();
  };

  const rows = data[category] ?? [];
  const hubs = TRADE_HUBS.slice(0, 3);

  // Find arbitrage: min sell vs max buy across hubs
  const findArbitrage = (row: ItemRow) => {
    const sells = row.hubs.filter((h) => h.sellMin !== null).map((h) => ({ hub: h.hub, price: h.sellMin! }));
    const buys = row.hubs.filter((h) => h.buyMax !== null).map((h) => ({ hub: h.hub, price: h.buyMax! }));
    if (sells.length === 0 || buys.length === 0) return null;
    const cheapest = sells.reduce((a, b) => (a.price < b.price ? a : b));
    const richest = buys.reduce((a, b) => (a.price > b.price ? a : b));
    if (richest.price > cheapest.price && cheapest.hub !== richest.hub) {
      const margin = ((richest.price - cheapest.price) / cheapest.price) * 100;
      return { buyAt: cheapest.hub, sellAt: richest.hub, margin };
    }
    return null;
  };

  return (
    <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-yellow-400">💰</span> TRADE HUB PRICES
          </CardTitle>
          <div className="flex gap-1">
            {(["minerals", "hauling"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  category === cat
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-700/30"
                }`}
              >
                {cat === "minerals" ? "Minerals" : "Hauling Goods"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error && <p className="text-red-400 text-xs">{error}</p>}
        {loading && rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Loading market data…</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-2 pr-3 text-slate-400 font-medium">Item</th>
                  {hubs.map((h) => (
                    <th key={h.name} className="text-right py-2 px-2 text-slate-400 font-medium" colSpan={2}>
                      {h.name}
                    </th>
                  ))}
                  <th className="text-right py-2 pl-3 text-slate-400 font-medium">Arbitrage</th>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <th></th>
                  {hubs.map((h) => (
                    <Fragment key={h.name}>
                      <th className="text-right py-1 px-1 text-slate-500 font-normal text-[10px]">Sell</th>
                      <th className="text-right py-1 px-1 text-slate-500 font-normal text-[10px]">Buy</th>
                    </Fragment>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const arb = findArbitrage(row);
                  // Highlight cheapest sell price
                  const sellPrices = row.hubs.map((h) => h.sellMin).filter((p): p is number => p !== null);
                  const minSell = sellPrices.length > 0 ? Math.min(...sellPrices) : null;

                  return (
                    <tr key={row.typeId} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                      <td className="py-1.5 pr-3 text-slate-300 font-medium whitespace-nowrap">{row.name}</td>
                      {row.hubs.map((hp) => (
                        <Fragment key={hp.hub}>
                          <td className={`text-right py-1.5 px-1 whitespace-nowrap ${
                            hp.sellMin === minSell ? "text-green-400" : "text-slate-300"
                          }`}>
                            <span className="block">{formatPrice(hp.sellMin)}</span>
                            <span className="block text-[9px] text-slate-500">{hp.sellVolume > 0 ? formatVol(hp.sellVolume) : ""}</span>
                          </td>
                          <td className="text-right py-1.5 px-1 text-slate-400 whitespace-nowrap">
                            <span className="block">{formatPrice(hp.buyMax)}</span>
                            <span className="block text-[9px] text-slate-500">{hp.buyVolume > 0 ? formatVol(hp.buyVolume) : ""}</span>
                          </td>
                        </Fragment>
                      ))}
                      <td className="text-right py-1.5 pl-3 whitespace-nowrap">
                        {arb ? (
                          <span className="text-emerald-400">
                            {arb.margin.toFixed(1)}%
                            <span className="block text-[9px] text-slate-500">
                              {arb.buyAt}→{arb.sellAt}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-slate-600 mt-3">
          Sell = lowest sell order · Buy = highest buy order · Volume in items
        </p>
      </CardContent>
    </Card>
  );
}

// Need Fragment import
import { Fragment } from "react";
