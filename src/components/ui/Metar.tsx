import { Cloud, Eye, Gauge, LucideProps, Thermometer, Wind } from "lucide-react";
import { FlightRules, formatCeiling, formatQNH, formatTemperature, formatVisibility, formatWind, MetarData } from "flight-planner";

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

  return <div className={`w-1.5 h-1.5 rounded-full ${getColor(status)}`} />;
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

const MetarDataRow: React.FC<{
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  label: string;
  value: string;
  className?: string;
}> = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex items-center justify-between ${className}`}>
    <div className="flex items-center gap-1.5">
      <Icon size={14} className="text-gray-500" />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
    <span className={`text-xs font-medium 'text-gray-900'`}>
      {value}
    </span>
  </div>
);

export const MetarSection: React.FC<{ data: MetarData }> = ({ data }) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 p-2">
    <MetarDataRow
      icon={Wind}
      label="Wind"
      value={formatWind(data)}
      className="col-span-2"
    />
    <MetarDataRow
      icon={Thermometer}
      label="Temp"
      value={formatTemperature(data)}
    />
    <MetarDataRow
      icon={Eye}
      label="Vis"
      value={formatVisibility(data)}
    />
    <MetarDataRow
      icon={Gauge}
      label="QNH"
      value={formatQNH(data)}
    />
    <MetarDataRow
      icon={Cloud}
      label="Ceiling"
      value={formatCeiling(data)}
    />
  </div>
);

const StandaloneMetarCard: React.FC<{ data: MetarData }> = ({ data }) => (
  <div className="bg-white rounded-md border border-gray-200">
    <CardHeader
      title={data.station}
      status={data.flightRules}
      badge="METAR"
    />
    <MetarSection data={data} />
  </div>
);

export default StandaloneMetarCard;