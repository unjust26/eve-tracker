import { useState, useEffect } from "react";
import { getMarketPrices, getMarketHistory, formatIsk, TRADE_HUBS } from "@/lib/esi";

// PLEX constants
const PLEX_TYPE_ID = 44992;
const PLEX_FOR_OMEGA = 500; // 500 PLEX = 30 days Omega
// Future use: Skill Injector 40520, MCT 34133, DED LP ~1500 ISK/LP

// ISK/hour estimates for different activities at Alpha skill levels
const ALPHA_ACTIVITIES: { name: string; iskPerHour: number; skills: string; risk: string; category: string }[] = [
  // Mining
  { name: "Venture Mining (Highsec)", iskPerHour: 4_000_000, skills: "Mining III", risk: "Low", category: "Mining" },
  { name: "Venture Ice Mining", iskPerHour: 6_000_000, skills: "Ice Mining", risk: "Low", category: "Mining" },
  { name: "Venture Gas Huffing (WH)", iskPerHour: 15_000_000, skills: "Gas Harvesting", risk: "High", category: "Mining" },
  // PvE Combat
  { name: "L1 Security Missions", iskPerHour: 3_000_000, skills: "Basic Combat", risk: "Low", category: "PvE" },
  { name: "L2 Security Missions", iskPerHour: 8_000_000, skills: "T1 Cruiser", risk: "Low", category: "PvE" },
  { name: "L3 Security Missions", iskPerHour: 15_000_000, skills: "Battlecruiser", risk: "Medium", category: "PvE" },
  { name: "Highsec Anomalies", iskPerHour: 5_000_000, skills: "Basic Combat", risk: "Low", category: "PvE" },
  { name: "Abyssal T0-T1 (Calm)", iskPerHour: 15_000_000, skills: "T1 Cruiser", risk: "Medium", category: "PvE" },
  { name: "Abyssal T2-T3", iskPerHour: 35_000_000, skills: "Gila/Cerberus", risk: "High", category: "PvE" },
  // Exploration
  { name: "Highsec Data/Relic", iskPerHour: 8_000_000, skills: "Scanning III", risk: "Low", category: "Exploration" },
  { name: "Lowsec Exploration", iskPerHour: 25_000_000, skills: "Scanning/Hacking IV", risk: "Medium", category: "Exploration" },
  { name: "Nullsec/WH Exploration", iskPerHour: 50_000_000, skills: "Scanning/Hacking IV", risk: "High", category: "Exploration" },
  // Industry & Trade
  { name: "Station Trading (10M seed)", iskPerHour: 5_000_000, skills: "Trading skills", risk: "Low", category: "Trade" },
  { name: "Station Trading (100M seed)", iskPerHour: 15_000_000, skills: "Trading skills", risk: "Low", category: "Trade" },
  { name: "Hauling (Contracts)", iskPerHour: 10_000_000, skills: "Industrial", risk: "Medium", category: "Trade" },
  { name: "PI (Passive, 5 planets)", iskPerHour: 3_000_000, skills: "Command Center IV", risk: "None", category: "Industry" },
  { name: "Manufacturing (T1)", iskPerHour: 8_000_000, skills: "Industry III", risk: "Low", category: "Industry" },
  // Faction Warfare
  { name: "FW Plexing (Novice)", iskPerHour: 12_000_000, skills: "Basic Frigate", risk: "Medium", category: "PvP" },
  { name: "FW Plexing (Small)", iskPerHour: 20_000_000, skills: "T1 Destroyer", risk: "Medium", category: "PvP" },
  { name: "FW LP Farming (Optimal)", iskPerHour: 40_000_000, skills: "Frigate V", risk: "Medium", category: "PvP" },
  // Salvaging
  { name: "Ninja Salvaging (Highsec)", iskPerHour: 10_000_000, skills: "Salvaging III", risk: "Low", category: "PvE" },
];

interface PLEXTrend {
  date: string;
  average: number;
}

export function AlphaOmegaCard() {
  const [plexPrice, setPlexPrice] = useState(0);
  const [plexHistory, setPlexHistory] = useState<PLEXTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"isk" | "time">("time");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prices, history] = await Promise.all([
          getMarketPrices(),
          getMarketHistory(TRADE_HUBS[0].regionId, PLEX_TYPE_ID).catch(() => []),
        ]);
        const plex = prices.find((p) => p.type_id === PLEX_TYPE_ID);
        if (!cancelled) {
          setPlexPrice(plex?.average_price ?? 0);
          // last 30 days of history
          setPlexHistory(
            history
              .slice(-30)
              .map((h) => ({ date: h.date, average: h.average }))
          );
        }
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const omegaCost = plexPrice * PLEX_FOR_OMEGA;
  const categories = ["All", ...new Set(ALPHA_ACTIVITIES.map((a) => a.category))];

  const filtered = ALPHA_ACTIVITIES
    .filter((a) => catFilter === "All" || a.category === catFilter)
    .map((a) => ({
      ...a,
      hoursToOmega: omegaCost > 0 ? omegaCost / a.iskPerHour : Infinity,
      daysToOmega: omegaCost > 0 ? omegaCost / a.iskPerHour / 3 : Infinity, // 3hrs/day play
    }))
    .sort((a, b) => sortBy === "isk" ? b.iskPerHour - a.iskPerHour : a.hoursToOmega - b.hoursToOmega);

  // Mini sparkline for PLEX history
  const sparkline = (data: PLEXTrend[]) => {
    if (data.length < 2) return null;
    const vals = data.map((d) => d.average);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const w = 120;
    const h = 24;
    const points = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
    const trend = vals[vals.length - 1] - vals[0];
    const color = trend > 0 ? "#ef4444" : "#22c55e";
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-[120px] h-[24px]">
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
      </svg>
    );
  };

  const riskColor = (risk: string) => {
    switch (risk) {
      case "None": return "text-blue-400";
      case "Low": return "text-green-400";
      case "Medium": return "text-yellow-400";
      case "High": return "text-red-400";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="rounded-lg border border-amber-500/20 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>⭐</span> Alpha → Omega Farming Guide
        </h3>
        <span className="text-[10px] text-amber-500/60">F2P → Paid in ISK</span>
      </div>

      {loading ? (
        <div className="text-xs text-slate-600 animate-pulse">Loading PLEX prices...</div>
      ) : (
        <>
          {/* PLEX Overview */}
          <div className="rounded bg-slate-800/50 p-3 mb-3 border border-amber-500/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-[10px] text-slate-500">PLEX Price (Global Avg)</div>
                <div className="text-lg font-bold text-amber-400 tabular-nums">{formatIsk(plexPrice)} <span className="text-xs text-slate-500">/ unit</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500">500 PLEX = 30 Day Omega</div>
                <div className="text-lg font-bold text-white tabular-nums">{formatIsk(omegaCost)}</div>
              </div>
              {plexHistory.length > 1 && (
                <div className="flex flex-col items-center">
                  <div className="text-[10px] text-slate-500 mb-0.5">30-Day Trend</div>
                  {sparkline(plexHistory)}
                  <div className="text-[9px] text-slate-600 mt-0.5">
                    {plexHistory.length > 0 && (
                      <>
                        {formatIsk(plexHistory[0].average)} → {formatIsk(plexHistory[plexHistory.length - 1].average)}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-slate-900/50 p-1.5">
                <div className="text-[10px] text-slate-500">Daily (3h)</div>
                <div className="text-xs font-medium text-slate-300 tabular-nums">{formatIsk(omegaCost / 30)} ISK/day</div>
              </div>
              <div className="rounded bg-slate-900/50 p-1.5">
                <div className="text-[10px] text-slate-500">Hourly Target</div>
                <div className="text-xs font-medium text-amber-400 tabular-nums">{formatIsk(omegaCost / 30 / 3)} ISK/hr</div>
              </div>
              <div className="rounded bg-slate-900/50 p-1.5">
                <div className="text-[10px] text-slate-500">Weekly Budget</div>
                <div className="text-xs font-medium text-slate-300 tabular-nums">{formatIsk(omegaCost / 4.3)}</div>
              </div>
            </div>
          </div>

          {/* Activity Filter */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {categories.map((c) => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${catFilter === c ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <button onClick={() => setSortBy(sortBy === "isk" ? "time" : "isk")}
              className="text-[10px] text-slate-500 hover:text-slate-300">
              Sort: {sortBy === "isk" ? "💰 ISK/hr" : "⏱ Time to Omega"}
            </button>
          </div>

          {/* Activity Table */}
          <div className="space-y-0.5 max-h-80 overflow-y-auto custom-scrollbar">
            {filtered.map((act, i) => {
              const hoursStr = act.hoursToOmega === Infinity ? "∞" : act.hoursToOmega.toFixed(0);
              const daysStr = act.daysToOmega === Infinity ? "∞" : act.daysToOmega.toFixed(0);
              const feasible = act.daysToOmega <= 30;
              return (
                <div key={act.name} className={`flex items-center gap-2 py-1.5 px-2 rounded text-xs hover:bg-slate-800/40 transition-colors border-l-2 ${feasible ? "border-green-500/40" : "border-slate-800/40"}`}>
                  <span className="text-[10px] text-slate-600 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{act.name}</div>
                    <div className="flex gap-2 text-[10px]">
                      <span className="text-slate-600">{act.skills}</span>
                      <span className={riskColor(act.risk)}>Risk: {act.risk}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-amber-400 tabular-nums font-medium">{formatIsk(act.iskPerHour)}/hr</div>
                    <div className="text-[10px] text-slate-500 tabular-nums">
                      {hoursStr}h total · <span className={feasible ? "text-green-400" : "text-red-400"}>{daysStr} days</span>
                      <span className="text-slate-700"> @ 3h/day</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="mt-3 rounded bg-amber-500/5 border border-amber-500/10 p-2">
            <div className="text-[10px] font-semibold text-amber-400 mb-1">💡 Alpha → Omega Tips</div>
            <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc list-inside">
              <li>Combine activities: run PI passively while doing missions</li>
              <li>FW LP farming is the fastest Alpha-friendly method</li>
              <li>Exploration in null/WH can pay for PLEX in 10-20 hours</li>
              <li>Station trading needs seed ISK but scales with capital</li>
              <li>Buy PLEX when price dips (check 30-day trend above)</li>
              <li>Green border = can PLEX account within 30 days @ 3hr/day</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
