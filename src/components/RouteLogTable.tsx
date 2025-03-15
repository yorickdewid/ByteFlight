import React from 'react';
import { X, Clock } from 'lucide-react';
import { RouteTrip } from 'flight-planner';
import { StatusDot } from './ui/Aerodrome'; // Import the StatusDot component

interface RouteLogTableProps {
  routeTrip: RouteTrip | undefined;
  onClose: () => void;
}

const RouteLogTable: React.FC<RouteLogTableProps> = ({ routeTrip, onClose }) => {
  const formatTime = (date: Date): string => {
    return new Date(date.getTime()).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: false
    });
  };

  const getETDAndETA = (): { etd: string; eta: string } => {
    if (!routeTrip || routeTrip.route.length === 0) {
      return { etd: '--:--', eta: '--:--' };
    }

    const now = new Date();
    const etd = formatTime(now);

    const etaDate = new Date(now.getTime() + routeTrip.totalDuration * 60 * 1000);
    const eta = formatTime(etaDate);

    return { etd, eta };
  };

  const { etd, eta } = getETDAndETA();

  return (
    <div className="absolute top-2 left-2 w-3/4 max-w-3xl bg-white rounded-md border border-gray-200 overflow-hidden z-10">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">
          {routeTrip && routeTrip.route.length > 0
            ? `${routeTrip.route[0].start.name} → ${routeTrip.route[routeTrip.route.length - 1].end.name}`
            : "Route Log"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {routeTrip && routeTrip.route.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">True Track</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routeTrip.route.map((leg, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center gap-1.5">
                      {leg.start.metarStation?.metarData.flightRules && (
                        <StatusDot status={leg.start.metarStation.metarData.flightRules} />
                      )}
                      {leg.start.name}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center gap-1.5">
                      {leg.end.metarStation?.metarData.flightRules && (
                        <StatusDot status={leg.end.metarStation.metarData.flightRules} />
                      )}
                      {leg.end.name}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{Math.round(leg.trueTrack)}°</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{Math.round(leg.distance)} NM</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                    {leg.performance ? `${Math.floor(leg.performance.duration)} min` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={3} className="px-3 py-2 text-sm font-medium text-gray-700 text-right">Total:</td>
                <td className="px-3 py-2 text-sm font-medium text-gray-700">{Math.round(routeTrip.totalDistance)} NM</td>
                <td className="px-3 py-2 text-sm font-medium text-gray-700">{Math.floor(routeTrip.totalDuration)} min</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="p-4 text-center text-gray-500">No route data available</div>
        )}
      </div>

      {routeTrip && routeTrip.route.length > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 p-3 flex items-center justify-center gap-8">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm text-gray-700">ETD: <span className="font-medium text-blue-700">{etd}</span> UTC</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm text-gray-700">ETA: <span className="font-medium text-blue-700">{eta}</span> UTC</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-700">Fuel consumption: <span className="font-medium text-blue-700">
              {routeTrip.totalFuelConsumption ? `${Math.round(routeTrip.totalFuelConsumption)} Liters` : '-'}
            </span></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteLogTable;
