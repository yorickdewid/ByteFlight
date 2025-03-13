import React from 'react';
import { X } from 'lucide-react';
import { RouteTrip } from 'flight-planner';

interface RouteLogTableProps {
  routeTrip: RouteTrip | undefined;
  onClose: () => void;
}

const RouteLogTable: React.FC<RouteLogTableProps> = ({ routeTrip, onClose }) => {
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
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routeTrip.route.map((leg, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{leg.start.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{leg.end.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{Math.round(leg.trueTrack)}°</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{Math.round(leg.distance)} NM</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                    {leg.performance ? `${Math.floor(leg.performance.duration)} min` : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                    {leg.performance?.fuelConsumption ? `${Math.round(leg.performance.fuelConsumption)} L` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-sm font-medium text-gray-700 text-right">Total:</td>
                <td className="px-3 py-2 text-sm font-medium text-gray-700">{Math.round(routeTrip.totalDistance)} NM</td>
                <td className="px-3 py-2 text-sm font-medium text-gray-700">{Math.floor(routeTrip.totalDuration)} min</td>
                <td className="px-3 py-2 text-sm font-medium text-gray-700">{routeTrip.totalFuelConsumption ? `${Math.round(routeTrip.totalFuelConsumption)} L` : '-'}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="p-4 text-center text-gray-500">No route data available</div>
        )}
      </div>
    </div>
  );
};

export default RouteLogTable;
