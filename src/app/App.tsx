import { Loader2, Plane } from 'lucide-react';
import { useState } from 'react';

import type { NavPoint } from '../types';

import Header from '../components/layout/header';
import { AircraftManagerModal, ChangePasswordModal, NavLogModal, SettingsModal, WeightBalanceModal } from '../components/layout/modals';
import { SystemAlert } from '../components/ui';
import FlightPlanSidebar from '../features/flight-plan/components/FlightPlanSidebar';
import MapView from '../features/map/components/MapView';
import IntelligencePanel from '../features/navigation/components/IntelligencePanel';

import { useAircraft } from '../hooks/useAircraft';
import { useAppInit } from '../hooks/useAppInit';
import { useClock } from '../hooks/useClock';
import { useFavorites } from '../hooks/useFavorites';
import { useFlightPlan } from '../hooks/useFlightPlan';
import { useMetarStations } from '../hooks/useMetarStations';
import { useNavigation } from '../hooks/useNavigation';
import { useNavLog } from '../hooks/useNavLog';
import { useSearch } from '../hooks/useSearch';
import { useWeather } from '../hooks/useWeather';

export default function App() {
  // --- Custom Hooks ---
  const {
    flightPlan,
    setFlightPlan,
    handlePointChange,
    handleAddWaypoint,
    handleMapWaypointMove,
    handleMapWaypointUpdate,
    handleMapAddWaypoint,
  } = useFlightPlan();

  const { aircraftProfiles, handleSaveAircraft, handleDeleteAircraft } = useAircraft(flightPlan, setFlightPlan);

  const {
    selectedPoint,
    setSelectedPoint,
    selectedPointMetar,
    selectedPointNotams,
    sidebarTab,
    setSidebarTab,
    refreshPointData,
    handleSelectPoint: handleSelectPointBase,
  } = useNavigation();

  const { searchQuery, searchResults, isSearching, handleSearch, clearSearch } = useSearch();

  const { weatherLayers, showRadar, showTurb, isWeatherLoading, toggleRadar, toggleTurb } = useWeather(flightPlan.departure);

  const { favorites, toggleFavorite } = useFavorites();

  const { metarStations, isLoading: isMetarLoading, updateStations } = useMetarStations();

  const time = useClock();

  const { isAppLoading } = useAppInit(setSelectedPoint, refreshPointData);

  // --- Modal State ---
  const [isNavLogOpen, setIsNavLogOpen] = useState(false);
  const [isWbOpen, setIsWbOpen] = useState(false);
  const [isAircraftManagerOpen, setIsAircraftManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

  // --- Flight Planning (Backend) ---
  const {
    navLog,
    isLoading: isNavLogLoading,
    error: navLogError,
    totalDistance: routeDist,
    totalDuration: routeTime,
    totalFuel: fuelTotal,
    lastUpdated: navLogUpdated,
  } = useNavLog(flightPlan);

  // --- Handlers ---
  const handleSelectPoint = async (point: NavPoint) => {
    await handleSelectPointBase(point);
    clearSearch();
  };

  const handleSignOut = () => {
    // In a real app, clear tokens, context, etc.
    // For mock: just refresh or alert
    window.location.reload();
  };

  if (isAppLoading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center flex-col gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-900/20 shadow-lg animate-bounce">
          <Plane size={24} className="text-white fill-current" style={{ transform: 'rotate(-45deg)' }} />
        </div>
        <div className="flex items-center gap-2 text-sky-500 font-mono text-sm">
          <Loader2 className="animate-spin" size={16} /> Initializing Systems...
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden selection:bg-sky-500/30 selection:text-sky-100">
      <Header
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        time={time}
        onSearchChange={handleSearch}
        onSelectPoint={handleSelectPoint}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        onOpenLogoutAlert={() => setIsLogoutAlertOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <FlightPlanSidebar
          flightPlan={flightPlan}
          aircraftProfiles={aircraftProfiles}
          onUpdateFlightPlan={setFlightPlan}
          onPointChange={handlePointChange}
          onOpenNavLog={() => setIsNavLogOpen(true)}
          onOpenAircraftManager={() => setIsAircraftManagerOpen(true)}
        />

        <MapView
          flightPlan={flightPlan}
          selectedPoint={selectedPoint}
          weatherLayers={weatherLayers}
          metarStations={metarStations}
          routeDist={Math.round(routeDist)}
          routeTime={Math.round(routeTime)}
          fuelTotal={Math.round(fuelTotal)}
          navLogUpdated={navLogUpdated}
          isWeatherLoading={isWeatherLoading || isNavLogLoading || isMetarLoading}
          onWaypointMove={handleMapWaypointMove}
          onWaypointUpdate={handleMapWaypointUpdate}
          onAddWaypoint={handleMapAddWaypoint}
          onSelectMetarStation={handleSelectPoint}
          onUpdateMetarStations={updateStations}
          onToggleRadar={toggleRadar}
          onToggleTurb={toggleTurb}
          showRadar={showRadar}
          showTurb={showTurb}
        />

        <IntelligencePanel
          selectedPoint={selectedPoint}
          selectedPointMetar={selectedPointMetar}
          selectedPointNotams={selectedPointNotams}
          sidebarTab={sidebarTab}
          setSidebarTab={setSidebarTab}
          favorites={favorites}
          onAddWaypoint={handleAddWaypoint}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      <SystemAlert
        isOpen={isLogoutAlertOpen}
        type="warning"
        title="Sign Out"
        message="Are you sure you want to sign out? Your current flight plan will be saved locally."
        onConfirm={handleSignOut}
        onCancel={() => setIsLogoutAlertOpen(false)}
        confirmLabel="Sign Out"
      />

      {isNavLogOpen && <NavLogModal flightPlan={flightPlan} aircraft={flightPlan.aircraft} navLog={navLog} isLoading={isNavLogLoading} error={navLogError} onClose={() => setIsNavLogOpen(false)} />}
      {isWbOpen && <WeightBalanceModal aircraft={flightPlan.aircraft} payload={flightPlan.payload} onClose={() => setIsWbOpen(false)} onUpdatePayload={(pl) => setFlightPlan(p => ({ ...p, payload: pl }))} />}
      {isAircraftManagerOpen && <AircraftManagerModal isOpen={isAircraftManagerOpen} aircraftList={aircraftProfiles} onClose={() => setIsAircraftManagerOpen(false)} onSave={handleSaveAircraft} onDelete={handleDeleteAircraft} />}
      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} fuelPolicy={flightPlan.reserveType} onSetFuelPolicy={(type) => setFlightPlan(p => ({ ...p, reserveType: type }))} />}
      {isPasswordModalOpen && <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />}
    </div>
  );
}
