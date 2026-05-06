// EVE Online ESI API utilities
const ESI_BASE = "https://esi.evetech.net/latest";
const DATASOURCE = "tranquility";

async function esiGet<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${ESI_BASE}${path}${sep}datasource=${DATASOURCE}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`ESI ${path}: ${resp.status}`);
  return resp.json() as Promise<T>;
}

async function esiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${ESI_BASE}${path}?datasource=${DATASOURCE}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`ESI POST ${path}: ${resp.status}`);
  return resp.json() as Promise<T>;
}

// ── Types ──

export interface ServerStatus {
  players: number;
  server_version: string;
  start_time: string;
}

export interface SovereigntyCampaign {
  attackers_score: number;
  campaign_id: number;
  constellation_id: number;
  defender_id: number;
  defender_score: number;
  event_type: string;
  solar_system_id: number;
  start_time: string;
  structure_id: number;
}

export interface FWFactionStats {
  faction_id: number;
  kills: { last_week: number; total: number; yesterday: number };
  pilots: number;
  systems_controlled: number;
  victory_points: { last_week: number; total: number; yesterday: number };
}

export interface Incursion {
  constellation_id: number;
  faction_id: number;
  has_boss: boolean;
  infested_solar_systems: number[];
  influence: number;
  staging_solar_system_id: number;
  state: string;
  type: string;
}

export interface SystemKills {
  npc_kills: number;
  pod_kills: number;
  ship_kills: number;
  system_id: number;
}

export interface SystemJumps {
  ship_jumps: number;
  system_id: number;
}

export interface ResolvedName {
  category: string;
  id: number;
  name: string;
}

export interface SystemInfo {
  constellation_id: number;
  name: string;
  planets?: { planet_id: number }[];
  position: { x: number; y: number; z: number };
  security_class?: string;
  security_status: number;
  star_id?: number;
  stargates?: number[];
  stations?: number[];
  system_id: number;
}

export interface War {
  aggressor: { alliance_id?: number; corporation_id?: number; isk_destroyed: number; ships_killed: number };
  allies?: { alliance_id?: number; corporation_id?: number }[];
  declared: string;
  defender: { alliance_id?: number; corporation_id?: number; isk_destroyed: number; ships_killed: number };
  finished?: string;
  id: number;
  mutual: boolean;
  open_for_allies: boolean;
  started?: string;
}

export interface InsurancePrice {
  levels: { cost: number; name: string; payout: number }[];
  type_id: number;
}

export interface TheraConnection {
  id: string;
  created_at: string;
  completed: boolean;
  wh_exits_outward: boolean;
  wh_type: string;
  max_ship_size: string;
  expires_at: string;
  remaining_hours: number;
  signature_type: string;
  out_system_id: number;
  out_system_name: string;
  out_signature: string;
  in_system_id: number;
  in_system_class: string;
  in_system_name: string;
  in_region_id: number;
  in_region_name: string;
  in_signature: string;
}

export interface ZKillEntry {
  killmail_id: number;
  zkb: {
    locationID: number;
    hash: string;
    fittedValue: number;
    droppedValue: number;
    destroyedValue: number;
    totalValue: number;
    points: number;
    npc: boolean;
    solo: boolean;
    awox: boolean;
    labels: string[];
  };
}

export interface KillmailDetail {
  attackers: {
    alliance_id?: number;
    character_id?: number;
    corporation_id?: number;
    damage_done: number;
    final_blow: boolean;
    ship_type_id?: number;
  }[];
  killmail_id: number;
  killmail_time: string;
  solar_system_id: number;
  victim: {
    alliance_id?: number;
    character_id?: number;
    corporation_id?: number;
    damage_taken: number;
    ship_type_id?: number;
  };
}

// ── API Calls ──

export function getServerStatus() {
  return esiGet<ServerStatus>("/status/");
}

export function getSovereigntyCampaigns() {
  return esiGet<SovereigntyCampaign[]>("/sovereignty/campaigns/");
}

export function getFWStats() {
  return esiGet<FWFactionStats[]>("/fw/stats/");
}

export function getIncursions() {
  return esiGet<Incursion[]>("/incursions/");
}

export function getSystemKills() {
  return esiGet<SystemKills[]>("/universe/system_kills/");
}

export function getSystemJumps() {
  return esiGet<SystemJumps[]>("/universe/system_jumps/");
}

export function resolveNames(ids: number[]) {
  if (ids.length === 0) return Promise.resolve([]);
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += 1000) {
    chunks.push(ids.slice(i, i + 1000));
  }
  return Promise.all(chunks.map((c) => esiPost<ResolvedName[]>("/universe/names/", c))).then((r) => r.flat());
}

export function getSystemInfo(systemId: number) {
  return esiGet<SystemInfo>(`/universe/systems/${systemId}/`);
}

export function getWarDetails(warId: number) {
  return esiGet<War>(`/wars/${warId}/`);
}

export function getRecentWarIds() {
  return esiGet<number[]>("/wars/");
}

export function getInsurancePrices() {
  return esiGet<InsurancePrice[]>("/insurance/prices/");
}

export function getRoute(origin: number, destination: number, flag: "shortest" | "secure" | "insecure" = "shortest") {
  return esiGet<number[]>(`/route/${origin}/${destination}/?flag=${flag}`);
}

export function getKillmailDetail(killmailId: number, hash: string) {
  return esiGet<KillmailDetail>(`/killmails/${killmailId}/${hash}/`);
}

export function searchUniverse(query: string, categories: string[]) {
  const cats = categories.join(",");
  return esiGet<Record<string, number[]>>(`/search/?search=${encodeURIComponent(query)}&categories=${cats}&strict=false`);
}

// ── External APIs ──

export async function getTheraConnections(): Promise<TheraConnection[]> {
  const resp = await fetch("https://api.eve-scout.com/v2/public/signatures");
  if (!resp.ok) throw new Error(`Eve Scout API: ${resp.status}`);
  return resp.json();
}

export async function getZKillRecent(): Promise<ZKillEntry[]> {
  const resp = await fetch("https://zkillboard.com/api/kills/w/1/");
  if (!resp.ok) throw new Error(`zKillboard API: ${resp.status}`);
  return resp.json();
}

export async function getZKillBigKills(): Promise<ZKillEntry[]> {
  const resp = await fetch("https://zkillboard.com/api/kills/big/");
  if (!resp.ok) throw new Error(`zKillboard API: ${resp.status}`);
  return resp.json();
}

// ── Market & Industry Types ──

export interface MarketPrice {
  adjusted_price: number;
  average_price: number;
  type_id: number;
}

export interface MarketOrder {
  duration: number;
  is_buy_order: boolean;
  issued: string;
  location_id: number;
  min_volume: number;
  order_id: number;
  price: number;
  range: string;
  system_id: number;
  type_id: number;
  volume_remain: number;
  volume_total: number;
}

export interface MarketHistoryEntry {
  average: number;
  date: string;
  highest: number;
  lowest: number;
  order_count: number;
  volume: number;
}

export interface IndustrySystem {
  cost_indices: { activity: string; cost_index: number }[];
  solar_system_id: number;
}

// ── Market & Industry API Calls ──

export function getMarketPrices() {
  return esiGet<MarketPrice[]>("/markets/prices/");
}

export async function getMarketOrders(regionId: number, typeId: number, orderType: "buy" | "sell" | "all" = "all") {
  const fullUrl = `${ESI_BASE}/markets/${regionId}/orders/?type_id=${typeId}&order_type=${orderType}&datasource=${DATASOURCE}`;
  const resp = await fetch(fullUrl);
  if (!resp.ok) throw new Error(`ESI market orders: ${resp.status}`);
  return resp.json() as Promise<MarketOrder[]>;
}

export function getMarketHistory(regionId: number, typeId: number) {
  return esiGet<MarketHistoryEntry[]>(`/markets/${regionId}/history/?type_id=${typeId}`);
}

export function getIndustrySystems() {
  return esiGet<IndustrySystem[]>("/industry/systems/");
}

// ── Trade Hub Metadata ──

export const TRADE_HUBS: { name: string; systemId: number; regionId: number; stationName: string }[] = [
  { name: "Jita", systemId: 30000142, regionId: 10000002, stationName: "Jita IV - Moon 4 - Caldari Navy Assembly Plant" },
  { name: "Amarr", systemId: 30002187, regionId: 10000043, stationName: "Amarr VIII - Emperor Family Academy" },
  { name: "Dodixie", systemId: 30002659, regionId: 10000032, stationName: "Dodixie IX - Moon 20 - Federation Navy Assembly Plant" },
  { name: "Rens", systemId: 30002510, regionId: 10000030, stationName: "Rens VI - Moon 8 - Brutor Tribe Treasury" },
  { name: "Hek", systemId: 30002053, regionId: 10000042, stationName: "Hek VIII - Moon 12 - Boundless Creation Factory" },
];

// ── Mineral & Ore Item IDs ──

export const MINERALS: { name: string; typeId: number }[] = [
  { name: "Tritanium", typeId: 34 },
  { name: "Pyerite", typeId: 35 },
  { name: "Mexallon", typeId: 36 },
  { name: "Isogen", typeId: 37 },
  { name: "Nocxium", typeId: 38 },
  { name: "Zydrine", typeId: 39 },
  { name: "Megacyte", typeId: 40 },
  { name: "Morphite", typeId: 11399 },
];

export const ORES: { name: string; typeId: number; secClass: string }[] = [
  { name: "Veldspar", typeId: 1230, secClass: "Highsec" },
  { name: "Scordite", typeId: 1228, secClass: "Highsec" },
  { name: "Pyroxeres", typeId: 1224, secClass: "Highsec" },
  { name: "Plagioclase", typeId: 18, secClass: "Highsec" },
  { name: "Omber", typeId: 1227, secClass: "Highsec" },
  { name: "Kernite", typeId: 20, secClass: "Lowsec" },
  { name: "Jaspet", typeId: 1226, secClass: "Lowsec" },
  { name: "Hemorphite", typeId: 1231, secClass: "Lowsec" },
  { name: "Hedbergite", typeId: 21, secClass: "Lowsec" },
  { name: "Dark Ochre", typeId: 1232, secClass: "Nullsec" },
  { name: "Gneiss", typeId: 1229, secClass: "Nullsec" },
  { name: "Crokite", typeId: 1225, secClass: "Nullsec" },
  { name: "Bistot", typeId: 1223, secClass: "Nullsec" },
  { name: "Arkonor", typeId: 22, secClass: "Nullsec" },
  { name: "Mercoxit", typeId: 11396, secClass: "Nullsec" },
];

// Common hauling goods (PI, fuel, commodities)
export const HAULING_GOODS: { name: string; typeId: number }[] = [
  { name: "PLEX", typeId: 44992 },
  { name: "Enriched Uranium", typeId: 44 },
  { name: "Robotics", typeId: 9848 },
  { name: "Consumer Electronics", typeId: 9836 },
  { name: "Coolant", typeId: 9832 },
  { name: "Mechanical Parts", typeId: 3689 },
  { name: "Oxygen", typeId: 3683 },
  { name: "Construction Blocks", typeId: 3828 },
];

// ── PI Commodities ──

export const PI_COMMODITIES: { name: string; typeId: number; tier: string }[] = [
  // P1 - Basic
  { name: "Water", typeId: 3645, tier: "P1" },
  { name: "Electrolytes", typeId: 2390, tier: "P1" },
  { name: "Biofuels", typeId: 2396, tier: "P1" },
  { name: "Proteins", typeId: 2395, tier: "P1" },
  { name: "Industrial Fibers", typeId: 2397, tier: "P1" },
  { name: "Reactive Metals", typeId: 2398, tier: "P1" },
  { name: "Precious Metals", typeId: 2399, tier: "P1" },
  { name: "Toxic Metals", typeId: 2400, tier: "P1" },
  { name: "Chiral Structures", typeId: 2401, tier: "P1" },
  { name: "Plasmoids", typeId: 2389, tier: "P1" },
  { name: "Bacteria", typeId: 2393, tier: "P1" },
  { name: "Biomass", typeId: 3779, tier: "P1" },
  { name: "Silicon", typeId: 9828, tier: "P1" },
  { name: "Oxidizing Compound", typeId: 2392, tier: "P1" },
  { name: "Oxygen", typeId: 3683, tier: "P1" },
  // P2 - Refined
  { name: "Coolant", typeId: 9832, tier: "P2" },
  { name: "Consumer Electronics", typeId: 9836, tier: "P2" },
  { name: "Construction Blocks", typeId: 3828, tier: "P2" },
  { name: "Enriched Uranium", typeId: 44, tier: "P2" },
  { name: "Mechanical Parts", typeId: 3689, tier: "P2" },
  { name: "Miniature Electronics", typeId: 9834, tier: "P2" },
  { name: "Nanites", typeId: 2463, tier: "P2" },
  { name: "Livestock", typeId: 3725, tier: "P2" },
  { name: "Rocket Fuel", typeId: 9850, tier: "P2" },
  { name: "Silicate Glass", typeId: 3697, tier: "P2" },
  { name: "Superconductors", typeId: 9838, tier: "P2" },
  { name: "Supertensile Plastics", typeId: 2312, tier: "P2" },
  { name: "Transmitter", typeId: 9840, tier: "P2" },
  { name: "Viral Agent", typeId: 3693, tier: "P2" },
  { name: "Genetically Enhanced Livestock", typeId: 15317, tier: "P2" },
  { name: "Polyaramids", typeId: 2327, tier: "P2" },
  { name: "Test Cultures", typeId: 2329, tier: "P2" },
  { name: "Fertilizer", typeId: 3693, tier: "P2" },
  // P3 - Specialized
  { name: "Robotics", typeId: 9848, tier: "P3" },
  { name: "Guidance Systems", typeId: 9834, tier: "P3" },
  { name: "Transcranial Microcontrollers", typeId: 12836, tier: "P3" },
  { name: "Ukomi Superconductors", typeId: 17392, tier: "P3" },
  { name: "Condensates", typeId: 2344, tier: "P3" },
  { name: "Camera Drones", typeId: 2345, tier: "P3" },
  { name: "Synthetic Synapses", typeId: 2346, tier: "P3" },
  { name: "Gel-Matrix Biopaste", typeId: 2348, tier: "P3" },
  { name: "Hazmat Detection Systems", typeId: 2366, tier: "P3" },
  { name: "Cryoprotectant Solution", typeId: 2367, tier: "P3" },
  // P4 - Advanced
  { name: "Broadcast Node", typeId: 2867, tier: "P4" },
  { name: "Integrity Response Drones", typeId: 2868, tier: "P4" },
  { name: "Nano-Factory", typeId: 2869, tier: "P4" },
  { name: "Organic Mortar Applicators", typeId: 2870, tier: "P4" },
  { name: "Recursive Computing Module", typeId: 2871, tier: "P4" },
  { name: "Self-Harmonizing Power Core", typeId: 2872, tier: "P4" },
  { name: "Sterile Conduits", typeId: 2875, tier: "P4" },
  { name: "Wetware Mainframe", typeId: 2876, tier: "P4" },
];

// ── Popular Ships (for insurance comparison) ──

export const POPULAR_SHIPS: { name: string; typeId: number; group: string }[] = [
  // Frigates
  { name: "Rifter", typeId: 587, group: "Frigate" },
  { name: "Merlin", typeId: 603, group: "Frigate" },
  { name: "Punisher", typeId: 597, group: "Frigate" },
  { name: "Incursus", typeId: 594, group: "Frigate" },
  // Destroyers
  { name: "Thrasher", typeId: 16242, group: "Destroyer" },
  { name: "Catalyst", typeId: 16240, group: "Destroyer" },
  { name: "Coercer", typeId: 16236, group: "Destroyer" },
  // Cruisers
  { name: "Vexor", typeId: 626, group: "Cruiser" },
  { name: "Caracal", typeId: 621, group: "Cruiser" },
  { name: "Omen", typeId: 624, group: "Cruiser" },
  { name: "Stabber", typeId: 629, group: "Cruiser" },
  { name: "Gnosis", typeId: 3756, group: "Cruiser" },
  // Battlecruisers
  { name: "Drake", typeId: 24698, group: "Battlecruiser" },
  { name: "Hurricane", typeId: 24690, group: "Battlecruiser" },
  { name: "Harbinger", typeId: 24696, group: "Battlecruiser" },
  { name: "Myrmidon", typeId: 24700, group: "Battlecruiser" },
  // Battleships
  { name: "Raven", typeId: 638, group: "Battleship" },
  { name: "Dominix", typeId: 645, group: "Battleship" },
  { name: "Apocalypse", typeId: 642, group: "Battleship" },
  { name: "Maelstrom", typeId: 24694, group: "Battleship" },
  // Industrials
  { name: "Tayra", typeId: 648, group: "Industrial" },
  { name: "Epithal", typeId: 655, group: "Industrial" },
  { name: "Mammoth", typeId: 652, group: "Industrial" },
  { name: "Nereus", typeId: 2998, group: "Industrial" },
  // Mining
  { name: "Venture", typeId: 32880, group: "Mining" },
  { name: "Retriever", typeId: 17476, group: "Mining" },
  { name: "Procurer", typeId: 17480, group: "Mining" },
  { name: "Covetor", typeId: 17478, group: "Mining" },
];

// ── Ore Reprocessing Data (minerals per 100 units of ore, at 100% efficiency) ──

export const ORE_REPROCESS: Record<string, Record<string, number>> = {
  Veldspar:    { Tritanium: 415 },
  Scordite:    { Tritanium: 346, Pyerite: 173 },
  Pyroxeres:   { Tritanium: 351, Pyerite: 25, Mexallon: 50, Nocxium: 5 },
  Plagioclase: { Tritanium: 107, Pyerite: 213, Mexallon: 107 },
  Omber:       { Tritanium: 85, Pyerite: 34, Isogen: 85 },
  Kernite:     { Tritanium: 134, Mexallon: 267, Isogen: 134 },
  Jaspet:      { Tritanium: 72, Pyerite: 121, Mexallon: 144, Nocxium: 72, Zydrine: 3 },
  Hemorphite:  { Tritanium: 212, Isogen: 100, Nocxium: 120, Zydrine: 15 },
  Hedbergite:  { Pyerite: 81, Isogen: 196, Nocxium: 98, Zydrine: 19 },
  "Dark Ochre":{ Tritanium: 250, Nocxium: 500, Zydrine: 50 },
  Gneiss:      { Pyerite: 171, Mexallon: 171, Isogen: 343, Zydrine: 17 },
  Crokite:     { Tritanium: 331, Nocxium: 331, Zydrine: 663 },
  Bistot:      { Pyerite: 170, Zydrine: 341, Megacyte: 170 },
  Arkonor:     { Tritanium: 300, Mexallon: 166, Megacyte: 333 },
  Mercoxit:    { Morphite: 530 },
};

// ── Faction metadata ──

export const FACTION_INFO: Record<number, { name: string; color: string; icon: string }> = {
  500001: { name: "Caldari State", color: "#4A90D9", icon: "🔷" },
  500002: { name: "Minmatar Republic", color: "#D4713B", icon: "🟠" },
  500003: { name: "Amarr Empire", color: "#F5C842", icon: "🟡" },
  500004: { name: "Gallente Federation", color: "#5AC45A", icon: "🟢" },
  500010: { name: "Angel Cartel", color: "#ff6666", icon: "😈" },
  500011: { name: "Guristas Pirates", color: "#888", icon: "☠️" },
  500019: { name: "Sansha's Nation", color: "#9B59B6", icon: "👁️" },
  500027: { name: "EDENCOM", color: "#00CED1", icon: "🛡️" },
};

export function getFactionName(id: number): string {
  return FACTION_INFO[id]?.name ?? `Faction #${id}`;
}

export function getFactionColor(id: number): string {
  return FACTION_INFO[id]?.color ?? "#888";
}

export const CAMPAIGN_TYPES: Record<string, string> = {
  ihub_defense: "Infrastructure Hub",
  tcu_defense: "Territorial Claim Unit",
  station_defense: "Station Defense",
  station_freeport: "Station Freeport",
};

// ── Utility: format ISK ──

export function formatIsk(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
}

export function secStatusColor(sec: number): string {
  if (sec >= 0.5) return "#2ecc71";
  if (sec > 0.0) return "#f39c12";
  return "#e74c3c";
}
