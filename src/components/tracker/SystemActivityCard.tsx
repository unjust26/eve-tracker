import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SystemKills, SystemJumps } from "@/lib/esi";
import { useEffect, useState } from "react";
import { Crosshair, ArrowRightLeft } from "lucide-react";

type Tab = "kills" | "jumps";

export function SystemActivityCard({
  kills,
  jumps,
  loading,
  getName,
  resolve,
}: {
  kills: SystemKills[] | null;
  jumps: SystemJumps[] | null;
  loading: boolean;
  getName: (id: number, fallback?: string) => string;
  resolve: (ids: number[]) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("kills");

  // Prepare top lists
  const topKills = kills
    ? [...kills]
        .sort((a, b) => b.ship_kills - a.ship_kills)
        .slice(0, 15)
    : [];
  const topJumps = jumps
    ? [...jumps]
        .sort((a, b) => b.ship_jumps - a.ship_jumps)
        .slice(0, 15)
    : [];

  useEffect(() => {
    const ids = new Set<number>();
    for (const k of topKills) ids.add(k.system_id);
    for (const j of topJumps) ids.add(j.system_id);
    if (ids.size > 0) resolve(Array.from(ids));
  }, [kills, jumps, resolve]);

  const maxKill = topKills[0]?.ship_kills ?? 1;
  const maxJump = topJumps[0]?.ship_jumps ?? 1;

  return (
    <Card className="border-emerald-900/40 bg-slate-900/80 backdrop-blur col-span-1 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-emerald-400 text-sm font-medium uppercase tracking-wider">
          {tab === "kills" ? (
            <Crosshair className="h-4 w-4" />
          ) : (
            <ArrowRightLeft className="h-4 w-4" />
          )}
          System Activity
          <div className="ml-auto flex gap-1">
            <button
              type="button"
              onClick={() => setTab("kills")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                tab === "kills"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Ship Kills
            </button>
            <button
              type="button"
              onClick={() => setTab("jumps")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                tab === "jumps"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Jumps
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !kills && !jumps ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`skel-${i}`} className="h-6 bg-slate-800 rounded" />
            ))}
          </div>
        ) : tab === "kills" ? (
          <div className="space-y-1.5">
            {topKills.length === 0 && (
              <div className="text-slate-500 text-sm py-4 text-center">
                No kill data available
              </div>
            )}
            {topKills.map((k, i) => (
              <div key={k.system_id} className="flex items-center gap-2 text-xs group">
                <span className="w-5 text-right text-slate-600 tabular-nums font-mono">
                  {i + 1}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-slate-200 font-medium w-28 truncate">
                    {getName(k.system_id)}
                  </span>
                  <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600/80 to-red-400/60 transition-all duration-500 rounded"
                      style={{
                        width: `${Math.max((k.ship_kills / maxKill) * 100, 2)}%`,
                      }}
                    />
                  </div>
                  <span className="text-red-400 tabular-nums font-mono w-12 text-right">
                    {k.ship_kills}
                  </span>
                  <span className="text-slate-600 tabular-nums font-mono w-10 text-right hidden sm:block" title="Pod kills">
                    +{k.pod_kills}p
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {topJumps.length === 0 && (
              <div className="text-slate-500 text-sm py-4 text-center">
                No jump data available
              </div>
            )}
            {topJumps.map((j, i) => (
              <div key={j.system_id} className="flex items-center gap-2 text-xs group">
                <span className="w-5 text-right text-slate-600 tabular-nums font-mono">
                  {i + 1}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-slate-200 font-medium w-28 truncate">
                    {getName(j.system_id)}
                  </span>
                  <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600/80 to-cyan-400/60 transition-all duration-500 rounded"
                      style={{
                        width: `${Math.max((j.ship_jumps / maxJump) * 100, 2)}%`,
                      }}
                    />
                  </div>
                  <span className="text-cyan-400 tabular-nums font-mono w-12 text-right">
                    {j.ship_jumps.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {(kills || jumps) && (
          <div className="text-[10px] text-slate-600 mt-3 text-center">
            Data from the last hour · Updated every 60 seconds
          </div>
        )}
      </CardContent>
    </Card>
  );
}
