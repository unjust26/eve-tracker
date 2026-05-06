import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIndustrySystems, resolveNames } from "@/lib/esi";

interface IndustryRow {
  systemId: number;
  name: string;
  manufacturing: number;
  research_te: number;
  research_me: number;
  copying: number;
  invention: number;
  reaction: number;
}

export function IndustryCard() {
  const [data, setData] = useState<IndustryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"cheapest" | "busiest">("cheapest");

  const loadData = useCallback(async () => {
    try {
      const systems = await getIndustrySystems();

      // Sort by manufacturing cost index
      const sorted = [...systems].sort((a, b) => {
        const aMfg = a.cost_indices.find((c) => c.activity === "manufacturing")?.cost_index ?? 0;
        const bMfg = b.cost_indices.find((c) => c.activity === "manufacturing")?.cost_index ?? 0;
        return sort === "cheapest" ? aMfg - bMfg : bMfg - aMfg;
      });

      // Filter to only systems with non-zero manufacturing and take top 15
      const filtered = sorted
        .filter((s) => {
          const mfg = s.cost_indices.find((c) => c.activity === "manufacturing")?.cost_index ?? 0;
          return sort === "cheapest" ? mfg > 0 : mfg > 0;
        })
        .slice(0, 15);

      // Resolve system names
      const ids = filtered.map((s) => s.solar_system_id);
      const names = await resolveNames(ids);
      const nameMap = new Map(names.map((n) => [n.id, n.name]));

      const rows: IndustryRow[] = filtered.map((s) => ({
        systemId: s.solar_system_id,
        name: nameMap.get(s.solar_system_id) ?? `J${s.solar_system_id}`,
        manufacturing: s.cost_indices.find((c) => c.activity === "manufacturing")?.cost_index ?? 0,
        research_te: s.cost_indices.find((c) => c.activity === "researching_time_efficiency")?.cost_index ?? 0,
        research_me: s.cost_indices.find((c) => c.activity === "researching_material_efficiency")?.cost_index ?? 0,
        copying: s.cost_indices.find((c) => c.activity === "copying")?.cost_index ?? 0,
        invention: s.cost_indices.find((c) => c.activity === "invention")?.cost_index ?? 0,
        reaction: s.cost_indices.find((c) => c.activity === "reaction")?.cost_index ?? 0,
      }));

      setData(rows);
    } catch (e) {
      console.error("Failed to load industry data:", e);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const formatIndex = (v: number) => {
    if (v === 0) return "—";
    return (v * 100).toFixed(2) + "%";
  };

  const costColor = (v: number) => {
    if (v === 0) return "text-slate-600";
    if (v < 0.01) return "text-green-400";
    if (v < 0.05) return "text-yellow-400";
    if (v < 0.1) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-purple-400">🏭</span> INDUSTRY COST INDICES
          </CardTitle>
          <div className="flex gap-1">
            {(["cheapest", "busiest"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  sort === s
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-700/30"
                }`}
              >
                {s === "cheapest" ? "💎 Cheapest" : "🔥 Busiest"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Loading industry data…</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-2 pr-2 text-slate-400 font-medium">#</th>
                  <th className="text-left py-2 pr-3 text-slate-400 font-medium">System</th>
                  <th className="text-right py-2 px-1 text-slate-400 font-medium">Mfg</th>
                  <th className="text-right py-2 px-1 text-slate-400 font-medium">ME</th>
                  <th className="text-right py-2 px-1 text-slate-400 font-medium">TE</th>
                  <th className="text-right py-2 px-1 text-slate-400 font-medium">Copy</th>
                  <th className="text-right py-2 px-1 text-slate-400 font-medium">Inv</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.systemId} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                    <td className="py-1.5 pr-2 text-slate-600 text-[10px]">{i + 1}</td>
                    <td className="py-1.5 pr-3 text-slate-300 font-medium whitespace-nowrap">{row.name}</td>
                    <td className={`text-right py-1.5 px-1 tabular-nums ${costColor(row.manufacturing)}`}>
                      {formatIndex(row.manufacturing)}
                    </td>
                    <td className={`text-right py-1.5 px-1 tabular-nums ${costColor(row.research_me)}`}>
                      {formatIndex(row.research_me)}
                    </td>
                    <td className={`text-right py-1.5 px-1 tabular-nums ${costColor(row.research_te)}`}>
                      {formatIndex(row.research_te)}
                    </td>
                    <td className={`text-right py-1.5 px-1 tabular-nums ${costColor(row.copying)}`}>
                      {formatIndex(row.copying)}
                    </td>
                    <td className={`text-right py-1.5 px-1 tabular-nums ${costColor(row.invention)}`}>
                      {formatIndex(row.invention)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-slate-600 mt-3">
          Lower % = cheaper to build · {sort === "cheapest" ? "Sorted by lowest manufacturing cost" : "Sorted by highest activity"}
        </p>
      </CardContent>
    </Card>
  );
}
