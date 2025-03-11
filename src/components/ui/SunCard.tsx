import { Sunrise, Sunset } from "lucide-react";

export interface TimeData {
  time: string;
  label: string;
}

const SunCard: React.FC<{
  type: 'sunrise' | 'sunset';
  timeData: TimeData;
}> = ({ type, timeData }) => {
  const isDawn = type === 'sunrise';
  const Icon = isDawn ? Sunrise : Sunset;

  return (
    <div className={`bg-gradient-to-br ${isDawn ? 'from-orange-50 to-yellow-50' : 'from-blue-50 to-purple-50'
      } rounded-md`}>
      <div className="p-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Icon className={isDawn ? 'text-orange-600' : 'text-blue-600'} size={16} />
            <span className={`text-sm font-medium ${isDawn ? 'text-orange-900' : 'text-blue-900'
              }`}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </div>
          <p className={`text-lg font-bold ${isDawn ? 'text-orange-900' : 'text-blue-900'
            }`}>{timeData.time}</p>
        </div>
        <span className={`text-xs ${isDawn ? 'text-orange-600' : 'text-blue-600'
          }`}>{timeData.label}</span>
      </div>
    </div>
  );
};

export default SunCard;