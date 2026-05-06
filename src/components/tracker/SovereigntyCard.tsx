import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type SovereigntyCampaign, CAMPAIGN_TYPES } from "@/lib/esi";
import { useEffect } from "react";
import { Shield } from "lucide-react";

export function SovereigntyCard({
  data,
  loading,
  getName,
  resolve,
}: {
  data: SovereigntyCampaign[] | null;
  loading: boolean;
  getName: (id: number, fallback?: string) => string;
  resolve: (ids: number[]) => Promise<void>;
}) {
  useEffect(() => {
    if (!data) return;
    const ids = new Set<number>();
    for (const c of data) {
      ids.add(c.solar_system_id);
      ids.add(c.constellation_id);
      ids.add(c.defender_id);
    }
    resolve(Array.from(ids));
  }, [data, resolve]);

  return (
    <Card className="border-orange-900/40 bg-slate-900/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-orange-400 text-sm font-medium uppercase tracking-wider">
          <Shield className="h-4 w-4" />
          Sovereignty Campaigns
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800 rounded" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {data
              .sort(
                (a, b) =>
                  new Date(a.start_time).getTime() -
                  new Date(b.start_time).getTime(),
              )
              .map((c) => {
                const attackPct = Math.round(c.attackers_score * 100);
                const defendPct = Math.round(c.defender_score * 100);
                return (
                  <div
                    key={c.campaign_id}
                    className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3 space-y-2"
                  >
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <div className="text-white font-semibold text-sm">
                          {getName(c.solar_system_id)}
                        </div>
                        <div className="text-slate-500">
                          {CAMPAIGN_TYPES[c.event_type] ?? c.event_type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400">Defender</div>
                        <div className="text-orange-300 font-medium">
                          {getName(c.defender_id)}
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-red-400">ATK {attackPct}%</span>
                        <span className="text-blue-400">DEF {defendPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700 overflow-hidden flex">
                        <div
                          className="bg-red-500 transition-all duration-500"
                          style={{ width: `${attackPct}%` }}
                        />
                        <div className="flex-1" />
                        <div
                          className="bg-blue-500 transition-all duration-500"
                          style={{ width: `${defendPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-600">
                      Starts{" "}
                      {new Date(c.start_time).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-slate-500 text-sm py-4 text-center">
            No active sovereignty campaigns
          </div>
        )}
      </CardContent>
    </Card>
  );
}
