import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServerStatus } from "@/lib/esi";
import { Activity, Clock, Users } from "lucide-react";

function formatUptime(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

export function ServerStatusCard({
  data,
  loading,
}: { data: ServerStatus | null; loading: boolean }) {
  return (
    <Card className="border-cyan-900/40 bg-slate-900/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-cyan-400 text-sm font-medium uppercase tracking-wider">
          <Activity className="h-4 w-4" />
          Server Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-slate-800 rounded w-1/2" />
            <div className="h-4 bg-slate-800 rounded w-3/4" />
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">
                Online — Tranquility
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              <span className="text-3xl font-bold text-white tabular-nums">
                {data.players.toLocaleString()}
              </span>
              <span className="text-slate-400 text-sm">pilots in space</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Uptime: {formatUptime(data.start_time)}
              </span>
              <span>v{data.server_version}</span>
            </div>
          </div>
        ) : (
          <div className="text-red-400 text-sm">Server unreachable</div>
        )}
      </CardContent>
    </Card>
  );
}
