import { MetarSection } from "./Metar";
import { FlightRules, Aerodrome, Frequency, RunwayWindVector } from "flight-planner";
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon } from "lucide-react";

const StatusDot: React.FC<{ status: FlightRules }> = ({ status }) => {
  const getColor = (status: FlightRules) => {
    switch (status) {
      case FlightRules.VFR:
        return 'bg-green-500';
      case FlightRules.MVFR:
        return 'bg-blue-500';
      case FlightRules.IFR:
        return 'bg-purple-500';
      case FlightRules.LIFR:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return <div className={`w-3 h-3 rounded-full ${getColor(status)}`} />;
};

const StatusBadge: React.FC<{ status: FlightRules }> = ({ status }) => {
  const getColor = (status: FlightRules) => {
    switch (status) {
      case FlightRules.VFR:
        return 'bg-green-100 text-green-800';
      case FlightRules.MVFR:
        return 'bg-blue-100 text-blue-800';
      case FlightRules.IFR:
        return 'bg-purple-100 text-purple-800';
      case FlightRules.LIFR:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return <span className={`text-xs px-2 py-1 rounded-md ${getColor(status)}`}>{status}</span>;
};

const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  status?: FlightRules;
  badge?: string;
}> = ({ title, subtitle, status, badge }) => (
  <div className="px-2 py-1.5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
    <div className="flex items-center gap-2">
      {status && <StatusDot status={status} />}
      <span className="font-medium text-gray-900">{title}</span>
      {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
    </div>
    {badge && (
      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
        {badge}
      </span>
    )}
  </div>
);

const RunwaySection: React.FC<{ runways: RunwayWindVector[] }> = ({ runways }) => (
  <div className="space-y-1">
    {runways.map((runway, i) => (
      <div key={runway.runway.designator} className={`flex items-center justify-between p-1.5 rounded ${i == 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${i == 0 ? 'text-green-700' : 'text-gray-700'}`}>
            {runway.runway.designator}
          </span>
          {i == 0 && (
            <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded">
              Active
            </span>
          )}
        </div>
        <div className="text-[10px] text-gray-500 flex items-center gap-1">
          {runway.headwind > 0 ? <ArrowDownIcon className="w-3 h-3" /> : <ArrowUpIcon className="w-3 h-3" />} {Math.round(Math.abs(runway.headwind))} kt • {runway.crosswind > 0 ? <ArrowLeftIcon className="w-3 h-3" /> : <ArrowRightIcon className="w-3 h-3" />} {Math.round(Math.abs(runway.crosswind))} kt
        </div>
      </div>
    ))}
  </div>
);

const FrequencySection: React.FC<{ frequencies: Frequency[] }> = ({ frequencies }) => (
  <div className="space-y-1">
    {frequencies.map((freq) => (
      <div key={freq.name} className="flex items-center justify-between p-1.5 py-0 rounded">
        {/* <div className=""> */}
        <span className="text-xs font-medium text-gray-700">{freq.type}</span>
        {/* <span className="text-[10px] text-gray-500">{freq.name}</span> */}
        {/* </div> */}
        <span className="font-mono text-xs text-gray-600">{freq.value}</span>
      </div>
    ))}
  </div>
);

const AerodromeCard: React.FC<{ data: Aerodrome }> = ({ data }) => (
  <div className="bg-white rounded-md border border-gray-200">
    <CardHeader
      title={data.ICAO}
      subtitle={data.name}
      status={data.metarStation?.metarData.flightRules}
    />
    <div className="divide-y divide-gray-100">
      <div className="p-2">
        <h3 className="text-xs font-medium text-gray-600 mb-1">Runways</h3>
        <RunwaySection runways={data.runwayWind()} />
      </div>
      <div className="p-2">
        <h3 className="text-xs font-medium text-gray-600 mb-1">Frequencies</h3>
        <FrequencySection frequencies={data.frequencies} />
      </div>
      {data.metarStation && (
        <div>
          <div className="px-2 pt-2 pb-1 flex items-center justify-between gap-1.5">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-medium text-gray-600">{data.metarStation?.station}</h3>
            </div>

            <div className="flex items-center space-x-2">
              <StatusBadge status={data.metarStation?.metarData.flightRules} />
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md border-gray-200">
                {` ${Math.round((Date.now() - new Date(data.metarStation?.metarData.observationTime).getTime()) / 60000)} min ago`}
              </span>
            </div>
          </div>
          <MetarSection data={data.metarStation?.metarData} />
        </div>
      )}
    </div>
  </div>
);

export default AerodromeCard;