import { useState, useEffect } from "react";
import { getRecentWarIds, getWarDetails, resolveNames, type War, formatIsk } from "@/lib/esi";

interface WarDisplay extends War {
  aggressorName: string;
  defenderName: string;
}

export function WarsCard() {
  const [wars, setWars] = useState<WarDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ids = await getRecentWarIds();
        const recent = ids.slice(0, 15);
        const details = await Promise.all(recent.map((id) => getWarDetails(id).catch(() => null)));
        const valid = details.filter((d): d is War => d !== null && !d.finished);

        // Resolve names
        const nameIds = new Set<number>();
        valid.forEach((w) => {
          if (w.aggressor.alliance_id) nameIds.add(w.aggressor.alliance_id);
          if (w.aggressor.corporation_id) nameIds.add(w.aggressor.corporation_id);
          if (w.defender.alliance_id) nameIds.add(w.defender.alliance_id);
          if (w.defender.corporation_id) nameIds.add(w.defender.corporation_id);
        });
        const names = await resolveNames([...nameIds]);
        const nameMap = Object.fromEntries(names.map((n) => [n.id, n.name]));

        if (cancelled) return;
        setWars(valid.map((w) => ({
          ...w,
          aggressorName: nameMap[w.aggressor.alliance_id ?? w.aggressor.corporation_id ?? 0] ?? "Unknown",
          defenderName: nameMap[w.defender.alliance_id ?? w.defender.corporation_id ?? 0] ?? "Unknown",
        })));
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const totalIsk = wars.reduce((sum, w) => sum + w.aggressor.isk_destroyed + w.defender.isk_destroyed, 0);

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>⚔️</span> Active Wars
        </h3>
        <span className="text-[10px] text-slate-500">{wars.length} active · {formatIsk(totalIsk)} destroyed</span>
      </div>

      {loading ? (
        <div className="text-xs text-slate-600 animate-pulse">Loading wars...</div>
      ) : wars.length === 0 ? (
        <div className="text-xs text-slate-600">No active wars found</div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
          {wars.map((w) => {
            const totalDestroyed = w.aggressor.isk_destroyed + w.defender.isk_destroyed;
            const totalShips = w.aggressor.ships_killed + w.defender.ships_killed;
            return (
              <div key={w.id} className="rounded bg-slate-800/40 p-2.5 border border-slate-800/40">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-red-400 font-medium truncate">{w.aggressorName}</span>
                    <span className="text-slate-600 text-[10px] shrink-0">vs</span>
                    <span className="text-blue-400 font-medium truncate">{w.defenderName}</span>
                  </div>
                  {w.mutual && <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 ml-1">MUTUAL</span>}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                  <span>🔥 {formatIsk(totalDestroyed)} ISK destroyed</span>
                  <span>🚀 {totalShips} ships killed</span>
                  <span className="text-slate-700">Since {new Date(w.declared).toLocaleDateString()}</span>
                </div>
                {totalShips > 0 && (
                  <div className="mt-1.5 flex h-1 rounded-full overflow-hidden bg-slate-800">
                    <div className="bg-red-500/70" style={{ width: `${(w.defender.ships_killed / totalShips) * 100}%` }} />
                    <div className="bg-blue-500/70" style={{ width: `${(w.aggressor.ships_killed / totalShips) * 100}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
