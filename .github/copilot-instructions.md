# ByteFlight - AI Coding Agent Instructions

## Project Overview

ByteFlight is a VFR (Visual Flight Rules) flight planning application for pilots. Built with React 19, TypeScript 5, Vite 7, Tailwind CSS, and Mapbox GL for interactive mapping.

## Architecture Patterns

### Feature-Based Organization
The codebase uses feature-based architecture under `src/features/`:
- Each feature (aircraft, flight-plan, map, navigation, weather) contains its own components, API calls, and types
- Shared UI primitives live in `src/components/ui/`
- Cross-cutting concerns use custom hooks in `src/hooks/`

### State Management
- **No global state library** - uses React's built-in hooks and localStorage
- Each domain has a custom hook (e.g., `useFlightPlan`, `useAircraft`, `useWeather`)
- Flight plan persists to localStorage in `useFlightPlan` hook via `useEffect`
- State composition happens in [App.tsx](src/app/App.tsx) which orchestrates all hooks

### Mock API Pattern
All API calls go through `src/lib/api.ts` (ApiService):
- Currently uses mock data from `src/lib/constants.ts` with simulated latency
- Designed for easy backend migration - replace ApiService methods without changing components
- Example: `ApiService.getNavPointDetail(icao)` returns NavPoint data from mockNavData

### Type System
Core types in `src/types/index.ts`:
- `FlightPlan` is the central data structure containing departure, arrival, waypoints, aircraft, and payload
- `NavPoint` represents airports/waypoints with coordinates, elevation, frequencies, runways
- `AircraftProfile` contains performance data (cruise speed, fuel burn, W&B parameters)
- TypeScript strict mode is **OFF** (`"strict": false`) - be mindful of potential undefined/null issues

## Development Workflows

### Building & Running
```bash
pnpm dev          # Development server on port 3000
pnpm build        # Type-check + production build
pnpm type-check   # Run TypeScript compiler without emit
```

### Code Quality
```bash
pnpm lint         # ESLint with typescript-eslint
pnpm lint:fix     # Auto-fix linting issues
pnpm format       # Format with Prettier
```

### Build Configuration
- Vite config splits vendors: react-vendor, mapbox-vendor, icons-vendor (see [vite.config.ts](vite.config.ts))
- Path alias `@/` maps to `src/` (configured in both tsconfig and vite.config)
- ESLint uses flat config format (eslint.config.js) with React Hooks rules

## Project-Specific Conventions

### Component Patterns
- **No prop drilling** - hooks provide data access where needed
- Components receive handlers as props (e.g., `onWaypointMove`, `onAddWaypoint`)
- Modal state lives in App.tsx, modals are in `src/components/layout/modals.tsx`
- Map interactions use Mapbox GL's imperative API wrapped in [Visualizers.tsx](src/features/map/components/Visualizers.tsx)

### Aviation-Specific Logic
Flight calculations in `src/lib/flightCalculations.ts`:
- Distance uses Haversine formula (see `calculateDistance` in utils.ts)
- Time calculated from distance and cruise speed
- Fuel requirements include trip fuel, contingency, and reserves (VFR_DAY or VFR_NIGHT)
- METAR parsing extracts wind, visibility, ceiling, clouds, QNH for flight category (VFR/MVFR/IFR/LIFR)

### Styling Approach
- Tailwind utility-first with custom `flight` color palette (50-950 scale)
- Dark theme by default (bg-slate-900, text-slate-100)
- Custom animations: `animate-fade-in`, `animate-slide-in`
- No component library - custom UI components built from scratch

### Data Flow Example
1. User searches for airport in [FlightPlanSidebar](src/features/flight-plan/components/FlightPlanSidebar.tsx)
2. `useSearch` hook calls `ApiService.lookupNavPoint()`
3. User selects result → calls `handlePointChange('departure', icao)`
4. `useFlightPlan` updates state and persists to localStorage
5. Map re-renders via `flightPlan` prop changes
6. `useMemo` recalculates route distance/time in App.tsx

## Critical Dependencies

- **Mapbox GL**: Requires `MAPBOX_TOKEN` in [constants.ts](src/lib/constants.ts) - replace demo token for production
- **pnpm**: Required package manager (not npm/yarn) - uses pnpm-lock.yaml
- **Node.js 18+**: Uses ES2022 features and ESM modules

## Common Pitfalls

1. **Map initialization**: Mapbox map is created once in useEffect, mutations via refs - don't recreate on every render
2. **NavPoint vs Waypoint**: NavPoint is a location; Waypoint extends NavPoint with altitude (see types)
3. **Flight plan structure**: Always maintain order: departure → waypoints → arrival
4. **localStorage keys**: Use `byteflight_` prefix (e.g., `byteflight_plan`, `byteflight_fleet`)
5. **Async lookups**: ApiService methods return Promises with simulated delays - handle loading states

## Testing & Validation

- No test suite currently - validate changes manually via `pnpm dev`
- Type-check runs before build: `tsc --noEmit` catches type errors
- ESLint checks React Hooks rules and unused variables
- Watch build output for chunk size warnings (>1000 kB triggers warning)

## When Adding Features

1. **New feature domain**: Create folder under `features/` with components/, api/, types/
2. **New state**: Add custom hook in `hooks/` following existing patterns
3. **New UI component**: Add to `components/ui/` and export from index.tsx
4. **Map interactions**: Modify VectorMap in Visualizers.tsx - it handles all Mapbox logic
5. **New calculations**: Add to `lib/flightCalculations.ts` with aviation-domain logic

---

_For detailed project structure, see README.md. For mock data structure, see src/lib/constants.ts._
