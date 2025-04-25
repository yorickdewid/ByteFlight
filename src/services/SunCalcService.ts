import SunCalc from 'suncalc';

export interface SunTimes {
  sunrise: {
    time: string;
    label: string;
  };
  sunset: {
    time: string;
    label: string;
  };
}

class SunCalcService {
  /**
   * Gets sun times (sunrise/sunset) for a specific location and date
   * 
   * @param latitude - Latitude in decimal degrees
   * @param longitude - Longitude in decimal degrees
   * @param date - Date to calculate sun times for (defaults to today)
   * @returns Object containing formatted sunrise and sunset times
   */
  getSunTimes(latitude: number, longitude: number, date: Date = new Date()): SunTimes {
    try {
      // Get times from SunCalc
      const times = SunCalc.getTimes(date, latitude, longitude);

      // Format times for display
      const formatTimeUTC = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'UTC'
        });
      };

      // Calculate remaining daylight time
      const getTimeRemaining = (targetTime: Date): string => {
        const now = new Date();
        const diffMs = targetTime.getTime() - now.getTime();

        if (diffMs < 0) return 'Passed';

        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHrs > 0) {
          return `in ${diffHrs}h ${diffMins}m`;
        } else {
          return `in ${diffMins}m`;
        }
      };

      // Create and return formatted times
      return {
        sunrise: {
          time: formatTimeUTC(times.sunrise),
          label: getTimeRemaining(times.sunrise)
        },
        sunset: {
          time: formatTimeUTC(times.sunset),
          label: getTimeRemaining(times.sunset)
        }
      };
    } catch (error) {
      console.error('Error calculating sun times:', error);

      // Return placeholder data in case of error
      return {
        sunrise: { time: '--:--', label: 'Unavailable' },
        sunset: { time: '--:--', label: 'Unavailable' }
      };
    }
  }

  /**
   * Checks if the current time is during daylight hours for a given location
   * 
   * @param latitude - Latitude in decimal degrees
   * @param longitude - Longitude in decimal degrees
   * @param date - Date to check (defaults to now)
   * @returns True if current time is between sunrise and sunset
   */
  isDaylight(latitude: number, longitude: number, date: Date = new Date()): boolean {
    try {
      const times = SunCalc.getTimes(date, latitude, longitude);
      const now = new Date();

      return now >= times.sunrise && now <= times.sunset;
    } catch (error) {
      console.error('Error checking daylight status:', error);
      return true; // Default to daylight in case of error
    }
  }

  /**
   * Gets the current sun position for a specific location
   * 
   * @param latitude - Latitude in decimal degrees
   * @param longitude - Longitude in decimal degrees
   * @param date - Date to calculate for (defaults to now)
   * @returns Object with azimuth (direction) and altitude of the sun
   */
  getSunPosition(latitude: number, longitude: number, date: Date = new Date()) {
    try {
      const position = SunCalc.getPosition(date, latitude, longitude);

      // Convert azimuth to degrees
      const azimuth = position.azimuth * 180 / Math.PI;

      // Convert altitude to degrees and handle negative values
      const altitude = position.altitude * 180 / Math.PI;

      return {
        azimuth: (azimuth + 180) % 360, // Convert to 0-360 degrees
        altitude: altitude,
        isDaylight: altitude > 0 // Simple check if sun is above horizon
      };
    } catch (error) {
      console.error('Error calculating sun position:', error);
      return { azimuth: 0, altitude: 0, isDaylight: true };
    }
  }
}

export default SunCalcService;
