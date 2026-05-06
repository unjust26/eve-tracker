import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SystemKills, SystemJumps } from "@/lib/esi";
import { Globe } from "lucide-react";

export function UniverseStatsCard({
  kills,
  jumps,
  loading,
}: {
  kills: SystemKills[] | null;
  jumps: SystemJumps[] | null;
  loading: boolean;
}) {
  const totalShipKills = kills?.reduce((a, b) => a + b.ship_kills, 0) ?? 0;
  const totalPodKills = kills?.reduce((a, b) => a + b.pod_kills, 0) ?? 0;
  const totalNpcKills = kills?.reduce((a, b) => a + b.npc_kills, 0) ?? 0;
  const totalJumps = jumps?.reduce((a, b) => a + b.ship_jumps, 0) ?? 0;
  const activeSystems = kills?.filter((k) => k.ship_kills > 0).length ?? 0;

  const stats = [
    { label: "Ship Kills", value: totalShipKills, color: "text-red-400" },
    { label: "Pod Kills", value: totalPodKills, color: "text-orange-400" },
    { label: "NPC Kills", value: totalNpcKills, color: "text-yellow-400" },
    { label: "Total Jumps", value: totalJumps, color: "text-cyan-400" },
    { label: "Active PvP Systems", value: activeSystems, color: "text-emerald-400" },
  ];

  return (
    <Card className="border-indigo-900/40 bg-slate-900/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-indigo-400 text-sm font-medium uppercase tracking-wider">
          <Globe className="h-4 w-4" />
          Universe Summary
          <span className="ml-auto text-[10px] text-slate-600 font-normal normal-case">
            Last hour
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !kills ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-slate-800 rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between"
              >
                <span className="text-xs text-slate-400">{s.label}</span>
                <span className={`text-lg font-bold tabular-nums ${s.color}`}>
                  {s.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
