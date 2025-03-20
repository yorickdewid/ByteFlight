import SunCalc from 'suncalc';

export interface SunTimes {
  sunrise: { time: string; label: string };
  sunset: { time: string; label: string };
}

class SunCalcService {
  getSunTimes(location: { lat: number, lon: number }): SunTimes {
    const times = SunCalc.getTimes(new Date(), location.lat, location.lon);

    const sunriseStr = `${times.sunrise.getHours()}:${times.sunrise.getMinutes().toString().padStart(2, '0')}`;
    const sunsetStr = `${times.sunset.getHours()}:${times.sunset.getMinutes().toString().padStart(2, '0')}`;

    return {
      sunrise: { time: sunriseStr, label: 'Local' },
      sunset: { time: sunsetStr, label: 'Local' }
    };
  }
}

export default SunCalcService;
