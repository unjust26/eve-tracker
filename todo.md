# EVE Online Universe Tracker - Todo

## Plan
Build a real-time EVE Online universe tracker dashboard using the public ESI API.
All data is public and CORS-enabled, so we can call directly from the frontend.

## Features
- [x] Server Status (players online, uptime)
- [x] Sovereignty Campaigns (active sov battles with progress bars)
- [x] Faction Warfare Stats (kills, victory points, systems controlled per faction)
- [x] Active Incursions (Sansha incursions across constellations)
- [x] System Activity (top systems by kills and jumps)
- [x] Auto-refresh every 60 seconds
- [x] Dark space theme fitting EVE Online aesthetic

## Architecture
- Frontend-only for ESI data (no auth needed, all public)
- React hooks for data fetching with auto-refresh
- Landing page IS the dashboard (public, no login required)
- Dark theme by default

## Steps
- [ ] Create ESI API utility functions
- [ ] Create custom hooks for data fetching
- [ ] Build dashboard components
- [ ] Style with EVE Online dark space aesthetic
- [ ] Build and test
- [ ] Deploy preview
- [ ] Share with user
