import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Incursion, getFactionName } from "@/lib/esi";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const STATE_COLORS: Record<string, string> = {
  withdrawing: "text-green-400",
  mobilizing: "text-yellow-400",
  established: "text-red-400",
};

const STATE_DOT: Record<string, string> = {
  withdrawing: "bg-green-500",
  mobilizing: "bg-yellow-500",
  established: "bg-red-500",
};

export function IncursionsCard({
  data,
  loading,
  getName,
  resolve,
}: {
  data: Incursion[] | null;
  loading: boolean;
  getName: (id: number, fallback?: string) => string;
  resolve: (ids: number[]) => Promise<void>;
}) {
  useEffect(() => {
    if (!data) return;
    const ids = new Set<number>();
    for (const inc of data) {
      ids.add(inc.constellation_id);
      ids.add(inc.staging_solar_system_id);
      for (const s of inc.infested_solar_systems) ids.add(s);
    }
    resolve(Array.from(ids));
  }, [data, resolve]);

  return (
    <Card className="border-red-900/40 bg-slate-900/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-red-400 text-sm font-medium uppercase tracking-wider">
          <AlertTriangle className="h-4 w-4" />
          Active Incursions
          {data && (
            <span className="ml-auto text-xs text-slate-500 font-normal normal-case">
              {data.length} active
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="animate-pulse space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-slate-800 rounded" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {data.map((inc) => (
              <div
                key={inc.constellation_id}
                className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {getName(inc.constellation_id)}
                    </div>
                    <div className="text-slate-500 text-xs">
                      {getFactionName(inc.faction_id)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-2 w-2 rounded-full ${STATE_DOT[inc.state] ?? "bg-gray-500"}`}
                    />
                    <span
                      className={`text-xs font-medium capitalize ${STATE_COLORS[inc.state] ?? "text-gray-400"}`}
                    >
                      {inc.state}
                    </span>
                  </div>
                </div>
                {/* Influence bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Influence</span>
                    <span>{Math.round(inc.influence * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                      style={{ width: `${Math.max(inc.influence * 100, 2)}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-3 text-[10px] text-slate-500">
                  <span>
                    Staging:{" "}
                    <span className="text-slate-300">
                      {getName(inc.staging_solar_system_id)}
                    </span>
                  </span>
                  <span>
                    Systems:{" "}
                    <span className="text-slate-300">
                      {inc.infested_solar_systems.length}
                    </span>
                  </span>
                  {inc.has_boss && (
                    <span className="text-red-400 font-semibold">⚠ BOSS SPAWNED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 text-sm py-4 text-center">
            No active incursions
          </div>
        )}
      </CardContent>
    </Card>
  );
}
