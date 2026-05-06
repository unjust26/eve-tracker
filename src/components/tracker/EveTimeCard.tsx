import { useState, useEffect } from "react";

export function EveTimeCard() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const eveTime = now.toUTCString().slice(17, 25); // HH:MM:SS
  const eveDate = now.toISOString().slice(0, 10);

  // Downtime is 11:00-11:15 UTC daily
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcS = now.getUTCSeconds();
  const nowSec = utcH * 3600 + utcM * 60 + utcS;
  const dtStartSec = 11 * 3600;
  const dtEndSec = 11 * 3600 + 15 * 60;
  const isDT = nowSec >= dtStartSec && nowSec < dtEndSec;

  let dtCountdown = "";
  if (isDT) {
    const remain = dtEndSec - nowSec;
    dtCountdown = `DT ends in ${Math.floor(remain / 60)}m ${remain % 60}s`;
  } else {
    const toNext = nowSec < dtStartSec ? dtStartSec - nowSec : dtStartSec + 86400 - nowSec;
    const h = Math.floor(toNext / 3600);
    const m = Math.floor((toNext % 3600) / 60);
    dtCountdown = `Next DT in ${h}h ${m}m`;
  }

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>🕐</span> EVE Time
        </h3>
        <span className="text-[10px] text-slate-600">{eveDate}</span>
      </div>
      <div className="text-center">
        <div className="text-3xl font-mono font-bold text-cyan-400 tracking-wider">{eveTime}</div>
        <div className="text-[10px] text-slate-500 mt-1">UTC / New Eden Standard Time</div>
        <div className={`mt-2 text-xs font-medium px-2 py-1 rounded-full inline-block ${isDT ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-slate-800 text-slate-400"}`}>
          {isDT ? "⚠️ " : "⏱ "}{dtCountdown}
        </div>
      </div>
    </div>
  );
}
