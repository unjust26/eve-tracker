import { useState, useCallback, useRef } from "react";
import { searchUniverse, getSystemInfo, secStatusColor, type SystemInfo } from "@/lib/esi";

interface SystemResult {
  info: SystemInfo;
  constellationName: string;
  regionName: string;
}

export function SystemSearchCard() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SystemResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResult(null); setError(""); return; }
    setLoading(true);
    setError("");
    try {
      const searchRes = await searchUniverse(q, ["solar_system"]);
      const systemIds = searchRes.solar_system ?? [];
      if (systemIds.length === 0) {
        setResult(null);
        setError("No system found");
        setLoading(false);
        return;
      }
      // Take best match (first result)
      const sysInfo = await getSystemInfo(systemIds[0]);
      // Resolve constellation and region
      const constellationUrl = `https://esi.evetech.net/latest/universe/constellations/${sysInfo.constellation_id}/?datasource=tranquility`;
      const constResp = await fetch(constellationUrl);
      const constData = constResp.ok ? await constResp.json() : null;
      const regionId = constData?.region_id;
      let regionName = "Unknown";
      if (regionId) {
        const regionUrl = `https://esi.evetech.net/latest/universe/regions/${regionId}/?datasource=tranquility`;
        const regionResp = await fetch(regionUrl);
        const regionData = regionResp.ok ? await regionResp.json() : null;
        regionName = regionData?.name ?? "Unknown";
      }

      setResult({
        info: sysInfo,
        constellationName: constData?.name ?? "Unknown",
        regionName,
      });
    } catch {
      setError("Search failed");
    }
    setLoading(false);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 500);
  };

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>🔍</span> System Search
        </h3>
      </div>

      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search system name (e.g. Jita, Rens, Amamake)"
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
        />
        {loading && (
          <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {error && <div className="text-xs text-slate-600">{error}</div>}

      {result && (
        <div className="rounded bg-slate-800/40 p-3 border border-slate-800/40">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-lg font-bold text-white">{result.info.name}</div>
              <div className="text-xs text-slate-500">
                {result.constellationName} › {result.regionName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums" style={{ color: secStatusColor(result.info.security_status) }}>
                {result.info.security_status.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-600">Security</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <div className="rounded bg-slate-900/50 p-2 text-center">
              <div className="text-xs text-slate-500">Planets</div>
              <div className="text-sm font-medium text-white">{result.info.planets?.length ?? 0}</div>
            </div>
            <div className="rounded bg-slate-900/50 p-2 text-center">
              <div className="text-xs text-slate-500">Stargates</div>
              <div className="text-sm font-medium text-white">{result.info.stargates?.length ?? 0}</div>
            </div>
            <div className="rounded bg-slate-900/50 p-2 text-center">
              <div className="text-xs text-slate-500">Stations</div>
              <div className="text-sm font-medium text-white">{result.info.stations?.length ?? 0}</div>
            </div>
            <div className="rounded bg-slate-900/50 p-2 text-center">
              <div className="text-xs text-slate-500">Sec Class</div>
              <div className="text-sm font-medium text-white">{result.info.security_class ?? "—"}</div>
            </div>
          </div>

          <div className="flex gap-2 mt-2 text-[10px]">
            <a href={`https://zkillboard.com/system/${result.info.system_id}/`} target="_blank" rel="noopener noreferrer"
              className="text-cyan-600 hover:text-cyan-400 underline">zKillboard</a>
            <a href={`https://evemaps.dotlan.net/system/${encodeURIComponent(result.info.name)}`} target="_blank" rel="noopener noreferrer"
              className="text-cyan-600 hover:text-cyan-400 underline">Dotlan</a>
          </div>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="text-xs text-slate-600 text-center py-4">Type a system name to look up its details</div>
      )}
    </div>
  );
}
