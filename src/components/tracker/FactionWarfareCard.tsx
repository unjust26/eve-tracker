import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type FWFactionStats, FACTION_INFO, getFactionName, getFactionColor } from "@/lib/esi";
import { Swords } from "lucide-react";

export function FactionWarfareCard({
  data,
  loading,
}: { data: FWFactionStats[] | null; loading: boolean }) {
  // Only show the 4 major empire factions for FW
  const majorFactions = data?.filter((f) =>
    [500001, 500002, 500003, 500004].includes(f.faction_id),
  );

  return (
    <Card className="border-purple-900/40 bg-slate-900/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-purple-400 text-sm font-medium uppercase tracking-wider">
          <Swords className="h-4 w-4" />
          Faction Warfare
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-800 rounded" />
            ))}
          </div>
        ) : majorFactions && majorFactions.length > 0 ? (
          <div className="space-y-3">
            {majorFactions
              .sort((a, b) => b.systems_controlled - a.systems_controlled)
              .map((f) => {
                const info = FACTION_INFO[f.faction_id];
                return (
                  <div
                    key={f.faction_id}
                    className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{info?.icon}</span>
                        <span
                          className="font-semibold text-sm"
                          style={{ color: getFactionColor(f.faction_id) }}
                        >
                          {getFactionName(f.faction_id)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {f.pilots.toLocaleString()} pilots
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-slate-500">Systems</div>
                        <div className="text-white font-bold text-lg tabular-nums">
                          {f.systems_controlled}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-500">Kills (24h)</div>
                        <div className="text-white font-bold text-lg tabular-nums">
                          {f.kills.yesterday.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-500">VP (24h)</div>
                        <div className="text-white font-bold text-lg tabular-nums">
                          {f.victory_points.yesterday.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-slate-500 text-sm py-4 text-center">
            No faction warfare data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
