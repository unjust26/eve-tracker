import { useEsiData } from "@/hooks/useEsiData";
import { getTheraConnections, type TheraConnection } from "@/lib/esi";

function shipSizeColor(size: string) {
  switch (size) {
    case "frigate": return "text-green-400";
    case "medium": return "text-yellow-400";
    case "large": return "text-orange-400";
    case "capital": return "text-red-400";
    case "freighter": return "text-purple-400";
    default: return "text-slate-400";
  }
}

function secClassBadge(cls: string) {
  switch (cls) {
    case "hs": return { label: "HS", color: "bg-green-500/20 text-green-400" };
    case "ls": return { label: "LS", color: "bg-yellow-500/20 text-yellow-400" };
    case "ns": return { label: "NS", color: "bg-red-500/20 text-red-400" };
    default: return { label: cls.toUpperCase(), color: "bg-purple-500/20 text-purple-400" };
  }
}

export function TheraCard() {
  const { data, loading } = useEsiData(getTheraConnections, 120_000);

  const connections = (data ?? []).filter((c: TheraConnection) => c.completed);

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>🕳️</span> Thera Wormhole Connections
        </h3>
        <span className="text-[10px] text-slate-500">{connections.length} active</span>
      </div>

      {loading && !data ? (
        <div className="text-xs text-slate-600 animate-pulse">Loading Eve Scout data...</div>
      ) : connections.length === 0 ? (
        <div className="text-xs text-slate-600">No active connections</div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-[1fr_auto_1fr_auto_auto] gap-x-2 text-[10px] text-slate-600 pb-1 border-b border-slate-800/40">
            <span>From (Thera)</span>
            <span></span>
            <span>Destination</span>
            <span>Ship</span>
            <span>Expires</span>
          </div>
          {connections.map((c: TheraConnection) => {
            const badge = secClassBadge(c.in_system_class);
            const hoursLeft = Math.max(0, c.remaining_hours);
            const expiring = hoursLeft <= 4;
            return (
              <div key={c.id} className="grid grid-cols-[1fr_auto_1fr_auto_auto] gap-x-2 items-center py-1.5 text-xs border-b border-slate-800/20 hover:bg-slate-800/30 transition-colors">
                <div>
                  <span className="text-slate-300 font-mono text-[10px]">{c.out_signature}</span>
                </div>
                <span className="text-slate-600">→</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-1 py-0.5 rounded ${badge.color}`}>{badge.label}</span>
                  <span className="text-white font-medium truncate">{c.in_system_name}</span>
                  <span className="text-slate-600 text-[10px] truncate hidden sm:inline">({c.in_region_name})</span>
                </div>
                <span className={`text-[10px] ${shipSizeColor(c.max_ship_size)}`}>{c.max_ship_size}</span>
                <span className={`text-[10px] font-mono ${expiring ? "text-red-400" : "text-slate-500"}`}>
                  {hoursLeft}h
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-2 text-[9px] text-slate-700">
        Data from <a href="https://www.eve-scout.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-700 hover:text-cyan-500">Eve Scout</a> · Use Thera as a shortcut between distant regions
      </div>
    </div>
  );
}
