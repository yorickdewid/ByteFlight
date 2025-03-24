import { MetarSection } from "./Metar";
import { FlightRules, Aerodrome, Frequency, RunwayWindVector, colorizeFlightRules } from "flight-planner";
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, CloudIcon, RadioIcon, StarIcon, StarOffIcon, WindIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const StatusDot: React.FC<{ status: FlightRules }> = ({ status }) => {
  const getColor = (status: FlightRules) => {
    return `bg-${colorizeFlightRules(status)}-500`;
  };

  return <div className={`w-3 h-3 rounded-full ${getColor(status)}`} />;
};

const StatusBadge: React.FC<{ status: FlightRules }> = ({ status }) => {
  const getColor = (status: FlightRules) => {
    return `bg-${colorizeFlightRules(status)}-100 text-${colorizeFlightRules(status)}-800`;
  };

  return <span className={`text-xs px-2 py-1 rounded-md ${getColor(status)}`}>{status}</span>;
};

const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  status?: FlightRules;
  badge?: string;
  isFavorite?: boolean;
  onFavorite?: () => void;
}> = ({ title, subtitle, status, badge, isFavorite, onFavorite }) => (
  <div className="px-2 py-1.5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
    <div className="flex items-center gap-2">
      {status && <StatusDot status={status} />}
      <span className="font-medium text-gray-900">{title}</span>
      {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
    </div>
    <div className="flex items-center gap-2">
      {badge && (
        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
      {onFavorite && (
        <button
          onClick={onFavorite}
          className="text-gray-400 hover:text-yellow-500 focus:outline-none transition-colors"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ?
            <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" /> :
            <StarOffIcon className="w-4 h-4" />
          }
        </button>
      )}
    </div>
  </div>
);

const RunwaySection: React.FC<{ runways: RunwayWindVector[] }> = ({ runways }) => (
  <div className="space-y-1">
    {runways.map((runway, index) => (
      <div key={index} className={`flex items-center justify-between p-1.5 rounded ${index == 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${index == 0 ? 'text-green-700' : 'text-gray-700'}`}>
            {runway.runway.designator}
          </span>
          {index == 0 && (
            <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded">
              Favorable
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
    {frequencies.map((freq, index) => (
      <div key={index} className="flex items-center justify-between p-1.5 py-0 rounded">
        <span className="text-xs font-medium text-gray-700">{freq.type}</span>
        <span className="font-mono text-xs text-gray-600">{freq.value}</span>
      </div>
    ))}
  </div>
);

type TabType = 'metar' | 'runways' | 'frequencies';

const AerodromeCard: React.FC<{ data: Aerodrome }> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabType>('metar');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteAerodromes') || '[]');
    setIsFavorite(favorites.includes(data.ICAO));
  }, [data.ICAO]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteAerodromes') || '[]');

    if (isFavorite) {
      const updatedFavorites = favorites.filter((icao: string) => icao !== data.ICAO);
      localStorage.setItem('favoriteAerodromes', JSON.stringify(updatedFavorites));
    } else {
      favorites.push(data.ICAO);
      localStorage.setItem('favoriteAerodromes', JSON.stringify(favorites));
    }

    setIsFavorite(!isFavorite);
  };

  return (
    <div className="bg-white rounded-md border border-gray-200">
      <CardHeader
        title={data.ICAO}
        subtitle={data.name}
        status={data.metarStation?.metarData.flightRules}
        isFavorite={isFavorite}
        onFavorite={toggleFavorite}
      />

      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          {data.metarStation && (
            <button
              onClick={() => setActiveTab('metar')}
              className={`py-2 px-4 text-xs font-medium border-b-2 flex items-center gap-1.5 ${activeTab === 'metar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <CloudIcon className="w-3.5 h-3.5" />
              Metar
            </button>
          )}
          <button
            onClick={() => setActiveTab('runways')}
            className={`py-2 px-4 text-xs font-medium border-b-2 flex items-center gap-1.5 ${activeTab === 'runways'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <WindIcon className="w-3.5 h-3.5" />
            Runways
          </button>
          <button
            onClick={() => setActiveTab('frequencies')}
            className={`py-2 px-4 text-xs font-medium border-b-2 flex items-center gap-1.5 ${activeTab === 'frequencies'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <RadioIcon className="w-3.5 h-3.5" />
            Frequencies
          </button>
        </nav>
      </div>

      <div className="p-2">
        {activeTab === 'metar' && data.metarStation && (
          <div>
            <div className="pt-0 pb-1 flex items-center justify-between gap-1.5">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-medium text-gray-600">{data.metarStation?.station}</h3>
              </div>

              <div className="flex items-center space-x-2">
                <StatusBadge status={data.metarStation?.metarData.flightRules} />
                <span className={`text-xs px-2 py-1 rounded-md ${Math.round((Date.now() - new Date(data.metarStation?.metarData.observationTime).getTime()) / 60000) > 60
                  ? 'bg-red-100 text-red-600 border-red-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                  {` ${Math.round((Date.now() - new Date(data.metarStation?.metarData.observationTime).getTime()) / 60000)} min ago`}
                </span>
              </div>
            </div>
            <MetarSection data={data.metarStation?.metarData} />
          </div>
        )}

        {activeTab === 'runways' && (
          <div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">Runways</h3>
            <RunwaySection runways={data.runwayWind()} />
          </div>
        )}

        {activeTab === 'frequencies' && (
          <div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">Frequencies</h3>
            <FrequencySection frequencies={data.frequencies} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AerodromeCard;