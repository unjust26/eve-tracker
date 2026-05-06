import { useEsiData } from "@/hooks/useEsiData";
import { useNameResolver } from "@/hooks/useNameResolver";
import {
  getServerStatus,
  getSovereigntyCampaigns,
  getFWStats,
  getIncursions,
  getSystemKills,
  getSystemJumps,
} from "@/lib/esi";
import { ServerStatusCard } from "@/components/tracker/ServerStatusCard";
import { EveTimeCard } from "@/components/tracker/EveTimeCard";
import { SovereigntyCard } from "@/components/tracker/SovereigntyCard";
import { FactionWarfareCard } from "@/components/tracker/FactionWarfareCard";
import { IncursionsCard } from "@/components/tracker/IncursionsCard";
import { SystemActivityCard } from "@/components/tracker/SystemActivityCard";
import { UniverseStatsCard } from "@/components/tracker/UniverseStatsCard";
import { TradeHubCard } from "@/components/tracker/TradeHubCard";
import { RouteSafetyCard } from "@/components/tracker/RouteSafetyCard";
import { GankingHotspotsCard } from "@/components/tracker/GankingHotspotsCard";
import { MiningDashboardCard } from "@/components/tracker/MiningDashboardCard";
import { IndustryCard } from "@/components/tracker/IndustryCard";
import { TheraCard } from "@/components/tracker/TheraCard";
import { KillFeedCard } from "@/components/tracker/KillFeedCard";
import { WarsCard } from "@/components/tracker/WarsCard";
import { InsuranceCard } from "@/components/tracker/InsuranceCard";
import { PICard } from "@/components/tracker/PICard";
import { MarginFinderCard } from "@/components/tracker/MarginFinderCard";
import { OreReprocessCard } from "@/components/tracker/OreReprocessCard";
import { AlphaOmegaCard } from "@/components/tracker/AlphaOmegaCard";
import { SystemSearchCard } from "@/components/tracker/SystemSearchCard";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const REFRESH_MS = 60_000;

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
      <span className="h-px flex-1 bg-slate-800" />
      <span>{icon} {title}</span>
      <span className="h-px flex-1 bg-slate-800" />
    </h2>
  );
}

export function LandingPage() {
  const { resolve, getName } = useNameResolver();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const status = useEsiData(getServerStatus, REFRESH_MS);
  const sovCampaigns = useEsiData(getSovereigntyCampaigns, REFRESH_MS);
  const fwStats = useEsiData(getFWStats, REFRESH_MS);
  const incursions = useEsiData(getIncursions, REFRESH_MS);
  const systemKills = useEsiData(getSystemKills, REFRESH_MS);
  const systemJumps = useEsiData(getSystemJumps, REFRESH_MS);

  const anyLoading =
    status.loading || sovCampaigns.loading || fwStats.loading ||
    incursions.loading || systemKills.loading || systemJumps.loading;

  const handleRefreshAll = () => {
    status.refresh(); sovCampaigns.refresh(); fwStats.refresh();
    incursions.refresh(); systemKills.refresh(); systemJumps.refresh();
  };

  const sections = [
    { id: "overview", label: "Overview", icon: "🌌" },
    { id: "alpha", label: "Alpha→Omega", icon: "⭐" },
    { id: "trading", label: "Trading", icon: "💰" },
    { id: "mining", label: "Mining", icon: "⛏️" },
    { id: "pvp", label: "PvP & Wars", icon: "⚔️" },
    { id: "navigation", label: "Navigation", icon: "🧭" },
    { id: "tools", label: "Tools", icon: "🔧" },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="stars-layer-1" />
        <div className="stars-layer-2" />
        <div className="stars-layer-3" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🌌</div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white">
                    EVE Universe Tracker
                  </h1>
                  <p className="text-[10px] text-slate-500">
                    Real-time intel from New Eden · Tranquility · 20+ live modules
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {status.lastUpdated && (
                  <span className="text-[10px] text-slate-600 hidden sm:block">
                    Updated{" "}
                    {status.lastUpdated.toLocaleTimeString(undefined, {
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleRefreshAll}
                  disabled={anyLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${anyLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
            {/* Navigation pills */}
            <div className="flex gap-1 mt-2 overflow-x-auto pb-1 custom-scrollbar">
              {sections.map((s) => (
                <button key={s.id} onClick={() => scrollToSection(s.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${
                    activeSection === s.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "bg-slate-800/60 text-slate-400 border border-transparent hover:bg-slate-800 hover:text-slate-300"
                  }`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Dashboard */}
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">

          {/* ── Section 1: Universe Overview ── */}
          <div id="section-overview">
            <SectionHeader title="Universe Overview" icon="🌌" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ServerStatusCard data={status.data} loading={status.loading} />
              <EveTimeCard />
              <UniverseStatsCard kills={systemKills.data} jumps={systemJumps.data} loading={systemKills.loading} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <IncursionsCard data={incursions.data} loading={incursions.loading} getName={getName} resolve={resolve} />
              <KillFeedCard />
            </div>
          </div>

          {/* ── Section 2: Alpha → Omega Farming ── */}
          <div id="section-alpha">
            <SectionHeader title="Alpha → Omega Farming Guide" icon="⭐" />
            <div className="grid grid-cols-1 gap-4">
              <AlphaOmegaCard />
            </div>
          </div>

          {/* ── Section 3: Trading & Market ── */}
          <div id="section-trading">
            <SectionHeader title="Trading & Market" icon="💰" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TradeHubCard />
              <MarginFinderCard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <PICard />
              <InsuranceCard />
            </div>
          </div>

          {/* ── Section 4: Mining & Industry ── */}
          <div id="section-mining">
            <SectionHeader title="Mining & Industry" icon="⛏️" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MiningDashboardCard />
              <OreReprocessCard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <IndustryCard />
              <div className="hidden lg:block" />
            </div>
          </div>

          {/* ── Section 5: PvP, Wars & Sovereignty ── */}
          <div id="section-pvp">
            <SectionHeader title="PvP, Wars & Sovereignty" icon="⚔️" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FactionWarfareCard data={fwStats.data} loading={fwStats.loading} />
              <WarsCard />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <SovereigntyCard data={sovCampaigns.data} loading={sovCampaigns.loading} getName={getName} resolve={resolve} />
              <GankingHotspotsCard />
            </div>
          </div>

          {/* ── Section 6: Navigation & Hauling ── */}
          <div id="section-navigation">
            <SectionHeader title="Navigation & Hauling" icon="🧭" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RouteSafetyCard />
              <TheraCard />
            </div>
          </div>

          {/* ── Section 7: Tools & Intel ── */}
          <div id="section-tools">
            <SectionHeader title="Tools & Intel" icon="🔧" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SystemSearchCard />
              <SystemActivityCard
                kills={systemKills.data}
                jumps={systemJumps.data}
                loading={systemKills.loading || systemJumps.loading}
                getName={getName}
                resolve={resolve}
              />
            </div>
          </div>

          <footer className="mt-8 text-center text-[10px] text-slate-700 pb-4">
            EVE Universe Tracker · 20+ live modules · Data from ESI, zKillboard, Eve Scout, Fuzzwork
            <br />
            <a href="https://developers.eveonline.com/" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-400 underline">developers.eveonline.com</a>
            <br />
            EVE Online and the EVE logo are registered trademarks of CCP hf. All EVE data © CCP Games.
          </footer>
        </main>
      </div>
    </div>
  );
}
