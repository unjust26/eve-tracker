import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSystemKills, getSystemInfo, type SystemInfo } from "@/lib/esi";

interface HotspotSystem {
  systemId: number;
  name: string;
  secStatus: number;
  shipKills: number;
  podKills: number;
}

export function GankingHotspotsCard() {
  const [hotspots, setHotspots] = useState<HotspotSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"highsec" | "lowsec" | "all">("highsec");

  const loadData = useCallback(async () => {
    try {
      const kills = await getSystemKills();

      // Sort by ship kills descending, take top 50 for info lookup
      const sorted = [...kills]
        .filter((k) => k.ship_kills > 0)
        .sort((a, b) => b.ship_kills - a.ship_kills)
        .slice(0, 60);

      // Fetch system info for sec status
      const infos = await Promise.all(
        sorted.map((k) => getSystemInfo(k.system_id).catch(() => null))
      );

      const infoMap = new Map<number, SystemInfo>();
      infos.forEach((i) => { if (i) infoMap.set(i.system_id, i); });

      const systems: HotspotSystem[] = sorted
        .map((k) => {
          const info = infoMap.get(k.system_id);
          return {
            systemId: k.system_id,
            name: info?.name ?? `J${k.system_id}`,
            secStatus: info?.security_status ?? 0,
            shipKills: k.ship_kills,
            podKills: k.pod_kills,
          };
        });

      setHotspots(systems);
    } catch (e) {
      console.error("Failed to load ganking data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120_000); // refresh every 2 min
    return () => clearInterval(interval);
  }, [loadData]);

  const filtered = hotspots.filter((s) => {
    if (filter === "highsec") return s.secStatus >= 0.45; // rounds to 0.5+
    if (filter === "lowsec") return s.secStatus > 0.0 && s.secStatus < 0.45;
    return true;
  }).slice(0, 15);

  const maxKills = filtered.length > 0 ? filtered[0].shipKills : 1;

  const secColor = (sec: number) => {
    if (sec >= 0.9) return "text-cyan-300";
    if (sec >= 0.7) return "text-green-400";
    if (sec >= 0.5) return "text-yellow-400";
    if (sec >= 0.1) return "text-orange-400";
    if (sec > 0.0) return "text-red-400";
    return "text-red-500";
  };

  return (
    <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-red-400">⚠️</span> GANKING HOTSPOTS
          </CardTitle>
          <div className="flex gap-1">
            {(["highsec", "lowsec", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                  filter === f
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-700/30"
                }`}
              >
                {f === "highsec" ? "Highsec" : f === "lowsec" ? "Lowsec" : "All"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Scanning for danger…</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No kills in this security range</p>
        ) : (
          <div className="space-y-1">
            {filtered.map((sys, i) => {
              const barWidth = (sys.shipKills / maxKills) * 100;
              return (
                <div key={sys.systemId} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-600 w-4 text-right text-[10px]">{i + 1}</span>
                  <span className={`font-mono w-8 text-right text-[10px] ${secColor(sys.secStatus)}`}>
                    {sys.secStatus.toFixed(1)}
                  </span>
                  <span className="text-slate-300 w-24 truncate font-medium">{sys.name}</span>
                  <div className="flex-1 h-3.5 bg-slate-800/50 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-gradient-to-r from-red-600 to-red-400"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-red-400 w-8 text-right font-medium">{sys.shipKills}</span>
                  {sys.podKills > 0 && (
                    <span className="text-orange-400 w-8 text-right text-[10px]">+{sys.podKills}p</span>
                  )}
                  {sys.podKills === 0 && <span className="w-8" />}
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-slate-600 mt-3">
          Ship kills in the last hour · {filter === "highsec" ? "Highsec = 0.5+ security" : filter === "lowsec" ? "Lowsec = 0.1–0.4 security" : "All security levels"}
        </p>
      </CardContent>
    </Card>
  );
}
