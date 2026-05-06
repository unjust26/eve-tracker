import { useState, useEffect, useCallback } from "react";
import { type ZKillEntry, formatIsk } from "@/lib/esi";

export function KillFeedCard() {
  const [kills, setKills] = useState<ZKillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"recent" | "big">("big");

  const fetchKills = useCallback(async () => {
    try {
      const url = mode === "big"
        ? "https://zkillboard.com/api/kills/big/"
        : "https://zkillboard.com/api/kills/w/1/";
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        setKills(data.slice(0, 20));
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    setLoading(true);
    fetchKills();
    const t = setInterval(fetchKills, 120_000);
    return () => clearInterval(t);
  }, [fetchKills]);

  const labelToSec = (labels: string[]) => {
    if (labels.includes("loc:highsec")) return { label: "HS", color: "text-green-400" };
    if (labels.includes("loc:lowsec")) return { label: "LS", color: "text-yellow-400" };
    if (labels.includes("loc:nullsec")) return { label: "NS", color: "text-red-400" };
    if (labels.includes("loc:wh")) return { label: "WH", color: "text-purple-400" };
    return { label: "??", color: "text-slate-400" };
  };

  const valueTier = (v: number) => {
    if (v >= 10e9) return "text-red-400 font-bold";
    if (v >= 1e9) return "text-orange-400 font-semibold";
    if (v >= 100e6) return "text-yellow-400";
    return "text-slate-300";
  };

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>💀</span> Kill Feed
        </h3>
        <div className="flex gap-1">
          {(["big", "recent"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${mode === m ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`}>
              {m === "big" ? "💎 Big Kills" : "⚡ Recent"}
            </button>
          ))}
        </div>
      </div>

      {loading && kills.length === 0 ? (
        <div className="text-xs text-slate-600 animate-pulse">Loading from zKillboard...</div>
      ) : kills.length === 0 ? (
        <div className="text-xs text-slate-600">No kills found</div>
      ) : (
        <div className="space-y-0.5 max-h-80 overflow-y-auto custom-scrollbar">
          {kills.map((k) => {
            const sec = labelToSec(k.zkb.labels);
            const tags: string[] = [];
            if (k.zkb.solo) tags.push("SOLO");
            if (k.zkb.awox) tags.push("AWOX");
            if (k.zkb.npc) tags.push("NPC");
            return (
              <a key={k.killmail_id} href={`https://zkillboard.com/kill/${k.killmail_id}/`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-800/50 transition-colors group border-b border-slate-800/20">
                <span className={`text-[10px] w-5 ${sec.color}`}>{sec.label}</span>
                <span className={`text-xs tabular-nums min-w-[70px] text-right ${valueTier(k.zkb.totalValue)}`}>
                  {formatIsk(k.zkb.totalValue)}
                </span>
                <span className="text-slate-600 text-[10px]">ISK</span>
                {tags.map((tag) => (
                  <span key={tag} className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-500">{tag}</span>
                ))}
                <span className="flex-1" />
                <span className="text-[10px] text-slate-700 group-hover:text-cyan-600 transition-colors">
                  #{k.killmail_id}
                </span>
              </a>
            );
          })}
        </div>
      )}
      <div className="mt-2 text-[9px] text-slate-700">
        Data from <a href="https://zkillboard.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-700 hover:text-cyan-500">zKillboard</a> · Click to view full killmail
      </div>
    </div>
  );
}
