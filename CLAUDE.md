# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
pnpm dev              # Start dev server on localhost:3000
pnpm build            # Type-check + production build
pnpm preview          # Preview production build
pnpm type-check       # Run TypeScript compiler (no emit)

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting without modifying

# Package Management
pnpm install          # Install dependencies (never use npm/yarn)
```

## Architecture Overview

### Hook-Based State Management

ByteFlight uses custom React hooks for ALL state management - no Redux, Zustand, or other state libraries. All hooks are composed in `App.tsx`, which acts as a thin orchestration layer.

**Key Hooks** (all in `/src/hooks/`, barrel-exported from `/src/hooks/index.ts`):
- `useFlightPlan` - Core flight plan state (departure, arrival, waypoints, aircraft, payload). Persists to localStorage (`byteflight_plan`).
- `useNavigation` - Selected point, METAR, NOTAMs, sidebar tab. Fetches data from backend API.
- `useNavLog` - Backend flight calculations. Debounced (500ms), auto-refreshes every 5 minutes.
- `useAircraft` - Fleet management. Loads from backend with localStorage fallback (`byteflight_fleet`).
- `useSearch` - Airport/waypoint search. Debounced (300ms).
- `useWeather` - Weather overlay state. Auto-refresh (30s). Currently uses mock data.
- `useMetarStations` - METAR stations with LRU accumulator (cap: 1000). Merges new stations on map pan, auto-refreshes every 5 minutes.
- `useFavorites` - Favorite locations. Persists to localStorage (`byteflight_favorites`).
- `useClock` - UTC time display (1s interval).
- `useAppInit` - App initialization, loads default demo route (EHRD).

**Pattern**: Hooks return both state and handlers. Handlers are passed down as props to components. Import hooks via the barrel: `import { useFlightPlan, useNavLog } from '../hooks'`.

### Backend-First Architecture

**Critical**: Flight planning calculations happen on the backend. The frontend focuses on UI/UX only.

- API client in `/src/lib/api.ts` - all backend communication goes through `ApiService`
- Backend base URL: `https://api.byteflight.app`
- API features: rate limiting (10 req/min per endpoint), request deduplication, 200-300ms artificial delays
- Always handle loading and error states for async operations

**Key Endpoints**:
- `GET /aircraft` - Fleet management (maps backend `registration` ↔ frontend `id`)
- `GET /aerodrome/:icao` - Aerodrome details (transforms backend `[lon, lat]` → `{lat, lon}`)
- `GET /aerodrome/:icao/wind` - Runway wind analysis (favored runway calculation)
- `GET /metar/:icao` - METAR data with decoded fields, flight category, TAF
- `GET /metar/nearby` - METAR stations within radius of coordinates
- `GET /notam/:icao` - NOTAMs for aerodrome
- `POST /flightplan` - Calculate full nav log (distance, track, heading, time, fuel per leg)

**Helper Methods** (in `api.ts`):
- `transformAerodromeToNavPoint()` - Converts backend format to frontend `NavPoint` type
- `deriveFlightCategory()` - Computes VFR/MVFR/IFR/LIFR from decoded METAR visibility and cloud ceiling
- `buildRouteString()` - Constructs route like "EHRD GDA SUGOL EHAM". Named navaids (2-5 letter alphabetic) are sent as-is; coordinate waypoints use `WP(lat,lon)` format

### Type System

All types in `/src/types/index.ts`. **Important**: TypeScript strict mode is **OFF** (`"strict": false`).

**Core Types**:
- `NavPoint` - Location (airport/VOR/waypoint) with coords, elevation, frequencies, runways, optional `flightCategory`
- `Waypoint` - Extends `NavPoint` with altitude property
- `FlightPlan` - Central data structure: departure, arrival, alternate, waypoints, aircraft, payload, datetime
- `AircraftProfile` - Performance data (cruise speed, fuel burn, W&B parameters)
- `MetarResponse` - Backend METAR format with decoded wind, visibility, clouds, flight category
- `NavLog` - Backend flight calculation response (per-leg data + totals)

**Note**: `NavPoint.id` is the canonical identifier everywhere. There is no `icao` field on `NavPoint` — backend responses are mapped through `transformAerodromeToNavPoint()`.

### Mapbox GL Integration

Map logic lives in `/src/features/map/components/Visualizers.tsx` (VectorMap component).

**Layers** (order matters for proper rendering):
1. Route line (dashed blue, 3px width)
2. Waypoint circles (DEP=green, ARR=red, WP=sky blue)
3. Waypoint labels (ICAO codes)
4. METAR station dots (color by flight category — rendered on top)
5. METAR labels (V/M/I/L single letter)

**Performance**: Map created once in `useEffect`, mutated via refs. Updates are debounced (only when sources change). `mapLoaded` flag prevents premature updates. Map position persists to localStorage (`byteflight_map_position`) — restores on reload.

**Interactions**:
- Drag waypoints → calls `onWaypointMove(index, lat, lon)`
- Click waypoint → popup with inline editor
- Double-click map → adds new waypoint
- Click METAR dot → popup with station info
- Map viewport changes → triggers METAR station update via `updateStations(bounds)`

### Feature-Based Organization

```
src/
├── app/                    # App.tsx orchestrator, main.tsx entry
├── components/
│   ├── ui/                 # Primitives (button, input, altitude-input, data-tag, panel-box)
│   └── layout/             # Header, modals barrel, settings-modal, change-password-modal
├── features/
│   ├── aircraft/           # AircraftManagerModal, WeightBalanceModal
│   ├── flight-plan/        # FlightPlanSidebar, NavLogModal
│   ├── map/                # MapView, VectorMap, RunwayVisualizer, PerformanceStrip
│   ├── navigation/         # IntelligencePanel (NOTAMs, weather, runway analysis)
│   └── weather/            # MetarTile component
├── hooks/                  # Custom React hooks + index.ts barrel
├── lib/
│   ├── api.ts              # Backend API client (ApiService)
│   ├── config.ts           # Runtime config (APP_VERSION, MAPBOX_TOKEN, defaultAircraftProfiles)
│   ├── mock-data.ts        # Demo/fallback data (mockNavData, mockInitialFlightPlan)
│   └── utils.ts            # Utility functions (fetchMockWeather)
└── types/                  # TypeScript definitions
```

## Important Conventions

### Component Patterns

**Import order**: React → Types → Components → Hooks → Lib

**Structure**:
```tsx
// Hooks at top of component
const { data } = useCustomHook();

// Event handlers before JSX
const handleEvent = () => { ... };

// Conditional returns (loading, error) before main JSX
if (isLoading) return <Loader />;

return <div>...</div>;
```

**Modal Props**: All modals use named `ComponentNameProps` interfaces (e.g., `SettingsModalProps`, `WeightBalanceModalProps`). Never use inline anonymous types for component props.

**Modal State**: Lives in `App.tsx` as `useState`. Modals re-exported from `/src/components/layout/modals.tsx`.

### Naming Conventions

- Components: PascalCase (`MapView.tsx`)
- Hooks: camelCase with `use` prefix (`useFlightPlan.ts`)
- Props: `ComponentNameProps` interface
- Types: PascalCase interfaces

### Debouncing

- Search: 300ms (prevents excessive API calls during typing)
- Nav log calculations: 500ms (prevents recalc on every waypoint drag)

### State Persistence

- Flight plan: localStorage `byteflight_plan` (saved in `useFlightPlan`)
- Aircraft fleet: Backend + localStorage fallback `byteflight_fleet`
- Favorites: localStorage `byteflight_favorites` (saved in `useFavorites`)
- Map position: localStorage `byteflight_map_position` (center + zoom, saved on every pan)

### Aviation-Specific Logic

**Flight Category** (derived from decoded METAR in `api.ts` via `deriveFlightCategory()`):
- VFR (green): visibility >8000m, ceiling >3000ft
- MVFR (blue): visibility 5000-8000m, ceiling 1000-3000ft
- IFR (yellow): visibility 1600-5000m, ceiling 500-1000ft
- LIFR (purple): visibility <1600m, ceiling <500ft

**Runway Wind Analysis**:
- Backend calculates favored runway based on wind
- Displays headwind/crosswind components
- Color coding: headwind=green, tailwind=red, crosswind>15kt=red

**Fuel Calculations**:
- Backend calculates trip + reserve + taxi + alternate
- Reserve types: VFR_DAY or VFR_NIGHT (different minimums)

## Configuration

### TypeScript (`tsconfig.json`)

- Target: ES2022
- **Strict: false** (more permissive - watch for undefined/null)
- Path alias: `@/*` → `./src/*`
- Module resolution: bundler

### Vite (`vite.config.ts`)

- Server: Port 3000, host 0.0.0.0
- Manual chunks for better caching:
  - `react-vendor`: react + react-dom
  - `mapbox-vendor`: mapbox-gl
  - `icons-vendor`: lucide-react
- Chunk size warning: 1000kb

### Environment Variables

- `VITE_MAPBOX_TOKEN` - Required for Mapbox GL maps (set in `.env.local`)

## Styling

- Tailwind CSS with dark theme (bg-slate-950, text-slate-300)
- Accent color: Sky blue (sky-500)
- No light mode - intentional cockpit-like UX
- Custom animations: `animate-fade-in`, `animate-slide-in`
- No component library - all UI built from scratch

## Data Flow Example

1. User searches airport in `FlightPlanSidebar`
2. `useSearch` hook calls `ApiService.lookupNavPoint(query)`
3. User selects result → calls `handlePointChange('departure', icao)`
4. `useFlightPlan` updates state (optimistic `id` update) and persists to localStorage
5. Map re-renders via `flightPlan` prop change
6. `useNavLog` debounces and calls backend `/flightplan` endpoint
7. NavLog updated with calculated legs, distance, time, fuel

## Common Pitfalls

1. **Map mutations**: Map instance created once, mutated via refs. Don't recreate on every render.
2. **NavPoint vs Waypoint**: NavPoint is a location; Waypoint extends it with `alt` property.
3. **NavPoint.id is canonical**: Never use `.icao` on NavPoint — it doesn't exist. Backend responses use `icao` internally but it's mapped to `id` via `transformAerodromeToNavPoint()`.
4. **Flight plan order**: Always maintain departure → waypoints → arrival.
5. **Backend calculations**: Never replicate flight calculations in frontend - backend is source of truth.
6. **localStorage keys**: Always use `byteflight_` prefix for consistency.
7. **TypeScript**: Strict mode OFF - be defensive with undefined/null checks.
8. **Config vs mock data**: Runtime config in `lib/config.ts`, demo/fallback data in `lib/mock-data.ts`. Never mix them.
9. **Route string format**: Named navaids (alphabetic, 2-5 chars) go as-is; user-placed waypoints use `WP(lat,lon)` format.

## Deployment

- Push to GitHub main branch triggers Cloudflare auto-deploy (both frontend + API)
- Never deploy manually - CI/CD handles it
- No feature branches - commit directly to main

## Testing

- No test suite currently
- Validate manually via `pnpm dev`
- Type-check before build: `tsc --noEmit`

## Notes

- Backend handles all aviation calculations and weather data
- Frontend focuses on UI/UX, map visualization, and state management
- Performance-conscious: debouncing, code splitting, lazy loading opportunities
- Dark theme is intentional (aviation/cockpit UX) - don't add light mode
