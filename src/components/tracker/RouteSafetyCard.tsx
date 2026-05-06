import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoute, getSystemKills, getSystemJumps, getSystemInfo, type SystemKills, type SystemJumps, type SystemInfo } from "@/lib/esi";

interface RouteSystem {
  systemId: number;
  name: string;
  secStatus: number;
  shipKills: number;
  podKills: number;
  npcKills: number;
  jumps: number;
}

const PRESET_ROUTES = [
  { label: "Jita → Amarr", origin: 30000142, dest: 30002187 },
  { label: "Jita → Dodixie", origin: 30000142, dest: 30002659 },
  { label: "Jita → Rens", origin: 30000142, dest: 30002510 },
  { label: "Amarr → Dodixie", origin: 30002187, dest: 30002659 },
  { label: "Jita → Hek", origin: 30000142, dest: 30002053 },
];

export function RouteSafetyCard() {
  const [routeFlag, setRouteFlag] = useState<"shortest" | "secure">("secure");
  const [route, setRoute] = useState<RouteSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const killsCacheRef = useRef<Map<number, SystemKills>>(new Map());
  const jumpsCacheRef = useRef<Map<number, SystemJumps>>(new Map());
  const infoCacheRef = useRef<Map<number, SystemInfo>>(new Map());

  // Load kill/jump data once
  const ensureKillJumpData = useCallback(async () => {
    if (killsCacheRef.current.size === 0) {
      const [kills, jumps] = await Promise.all([getSystemKills(), getSystemJumps()]);
      kills.forEach((k) => killsCacheRef.current.set(k.system_id, k));
      jumps.forEach((j) => jumpsCacheRef.current.set(j.system_id, j));
    }
  }, []);

  const loadRoute = useCallback(async (origin: number, dest: number, flag: "shortest" | "secure") => {
    setLoading(true);
    setError(null);
    try {
      await ensureKillJumpData();
      const systemIds = await getRoute(origin, dest, flag);

      // Fetch system info for names & security (batch, use cache)
      const unknownIds = systemIds.filter((id) => !infoCacheRef.current.has(id));
      if (unknownIds.length > 0) {
        const infos = await Promise.all(unknownIds.map((id) => getSystemInfo(id).catch(() => null)));
        infos.forEach((info) => {
          if (info) infoCacheRef.current.set(info.system_id, info);
        });
      }

      const routeSystems: RouteSystem[] = systemIds.map((id) => {
        const info = infoCacheRef.current.get(id);
        const kills = killsCacheRef.current.get(id);
        const jumps = jumpsCacheRef.current.get(id);
        return {
          systemId: id,
          name: info?.name ?? `J${id}`,
          secStatus: info?.security_status ?? 0,
          shipKills: kills?.ship_kills ?? 0,
          podKills: kills?.pod_kills ?? 0,
          npcKills: kills?.npc_kills ?? 0,
          jumps: jumps?.ship_jumps ?? 0,
        };
      });

      setRoute(routeSystems);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to calculate route");
    } finally {
      setLoading(false);
    }
  }, [ensureKillJumpData]);

  // Load default route on mount
  useEffect(() => {
    const preset = PRESET_ROUTES[0];
    setActivePreset(preset.label);
    loadRoute(preset.origin, preset.dest, routeFlag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secColor = (sec: number) => {
    if (sec >= 0.9) return "text-cyan-300";
    if (sec >= 0.7) return "text-green-400";
    if (sec >= 0.5) return "text-yellow-400";
    if (sec >= 0.1) return "text-orange-400";
    if (sec > 0.0) return "text-red-400";
    return "text-red-500";
  };

  const secBg = (sec: number) => {
    if (sec >= 0.5) return "bg-green-500/10";
    if (sec >= 0.1) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  const dangerLevel = (sys: RouteSystem) => {
    if (sys.shipKills >= 10) return "🔴";
    if (sys.shipKills >= 5) return "🟠";
    if (sys.shipKills >= 1) return "🟡";
    return "🟢";
  };

  const totalShipKills = route.reduce((s, r) => s + r.shipKills, 0);
  const totalPodKills = route.reduce((s, r) => s + r.podKills, 0);
  const dangerousSystems = route.filter((r) => r.shipKills > 0).length;
  const lowsecSystems = route.filter((r) => r.secStatus > 0 && r.secStatus < 0.5).length;
  const nullsecSystems = route.filter((r) => r.secStatus <= 0).length;

  return (
    <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="text-blue-400">🗺️</span> ROUTE SAFETY PLANNER
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Preset routes */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_ROUTES.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setActivePreset(p.label);
                loadRoute(p.origin, p.dest, routeFlag);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                activePreset === p.label
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-700/30"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Route type toggle */}
        <div className="flex gap-2 items-center">
          <span className="text-xs text-slate-500">Route:</span>
          {(["secure", "shortest"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setRouteFlag(f);
                if (activePreset) {
                  const p = PRESET_ROUTES.find((pr) => pr.label === activePreset);
                  if (p) loadRoute(p.origin, p.dest, f);
                }
              }}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                routeFlag === f
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-slate-800/50 text-slate-500 hover:text-slate-300"
              }`}
            >
              {f === "secure" ? "🛡️ Safest" : "⚡ Shortest"}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Calculating route…</p>
          </div>
        ) : route.length > 0 ? (
          <>
            {/* Route summary */}
            <div className="grid grid-cols-5 gap-2 bg-slate-800/40 rounded-lg p-2.5">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-200">{route.length}</div>
                <div className="text-[10px] text-slate-500">Jumps</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${totalShipKills > 10 ? "text-red-400" : totalShipKills > 0 ? "text-yellow-400" : "text-green-400"}`}>
                  {totalShipKills}
                </div>
                <div className="text-[10px] text-slate-500">Ship Kills</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{totalPodKills}</div>
                <div className="text-[10px] text-slate-500">Pod Kills</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${lowsecSystems > 0 ? "text-orange-400" : "text-green-400"}`}>
                  {lowsecSystems}
                </div>
                <div className="text-[10px] text-slate-500">Lowsec</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${nullsecSystems > 0 ? "text-red-400" : "text-green-400"}`}>
                  {nullsecSystems}
                </div>
                <div className="text-[10px] text-slate-500">Nullsec</div>
              </div>
            </div>

            {/* Danger summary */}
            {dangerousSystems > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span className="text-xs text-red-300">
                  <strong>{dangerousSystems}</strong> system{dangerousSystems > 1 ? "s" : ""} had ship kills in the last hour. Use caution!
                </span>
              </div>
            )}

            {/* Route systems list */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-0.5">
              {route.map((sys, i) => (
                <div
                  key={sys.systemId}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${secBg(sys.secStatus)} ${
                    sys.shipKills >= 5 ? "border-l-2 border-red-500" : sys.shipKills >= 1 ? "border-l-2 border-yellow-500" : ""
                  }`}
                >
                  <span className="text-slate-600 w-5 text-right text-[10px]">{i + 1}</span>
                  <span className="text-[10px]">{dangerLevel(sys)}</span>
                  <span className={`font-mono w-10 text-right ${secColor(sys.secStatus)}`}>
                    {sys.secStatus.toFixed(1)}
                  </span>
                  <span className="text-slate-300 font-medium flex-1">{sys.name}</span>
                  {sys.shipKills > 0 && (
                    <span className="text-red-400 text-[10px]">
                      💀{sys.shipKills}
                      {sys.podKills > 0 && <span className="text-orange-400"> +{sys.podKills}p</span>}
                    </span>
                  )}
                  {sys.jumps > 0 && (
                    <span className="text-slate-500 text-[10px]">↔{sys.jumps}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}

        <p className="text-[10px] text-slate-600">
          Kill data from the last hour · Select route presets above
        </p>
      </CardContent>
    </Card>
  );
}
