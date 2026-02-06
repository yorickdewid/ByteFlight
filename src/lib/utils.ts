import { ParsedMetar, WeatherCell } from '../types';

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) / 1852);
};

export const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (θ * 180 / Math.PI + 360) % 360;
};

/**
 * @deprecated Use backend MetarResponse instead (ApiService.getMetar)
 * This function is only used for legacy mock data in Visualizers.tsx
 * Will be removed in Phase 2 when weather integration is complete
 */
export const parseMetar = (metarString: string): ParsedMetar => {
  const result: ParsedMetar = {
    raw: metarString,
    wind: { dir: 0, speed: 0, gust: null, vrb: false },
    vis: 10000,
    temp: 'N/A', dew: 'N/A', qnh: 'N/A',
    ceiling: { type: 'NSC', altitude: 9999 },
    clouds: [],
    timestamp: null,
    category: 'VFR'
  };
  if (!metarString) return result;

  const parts = metarString.split(' ');
  const timePart = parts.find(p => p.match(/^\d{6}Z$/));
  if (timePart) {
    const now = new Date();
    result.timestamp = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), parseInt(timePart.substring(0, 2)), parseInt(timePart.substring(2, 4)), parseInt(timePart.substring(4, 6))));
  }

  parts.forEach(part => {
    const windMatch = part.match(/^(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?KT$/);
    if (windMatch) {
      result.wind.vrb = windMatch[1] === 'VRB';
      result.wind.dir = result.wind.vrb ? 0 : parseInt(windMatch[1], 10);
      result.wind.speed = parseInt(windMatch[2], 10);
      result.wind.gust = windMatch[4] ? parseInt(windMatch[4], 10) : null;
    }
    if (part.match(/^\d{4}$/) && part !== '9999') result.vis = parseInt(part, 10);
    else if (part === '9999' || part === 'CAVOK') result.vis = 10000;

    const tempMatch = part.match(/^(M?\d{2})\/(M?\d{2})$/);
    if (tempMatch) {
      result.temp = parseInt(tempMatch[1].replace('M', '-'));
      result.dew = parseInt(tempMatch[2].replace('M', '-'));
    }
    if (part.startsWith('Q') && part.length === 5) result.qnh = part.substring(1);
    const cloudMatch = part.match(/^(FEW|SCT|BKN|OVC)(\d{3})/);
    if (cloudMatch) {
      const alt = parseInt(cloudMatch[2], 10) * 100;
      result.clouds.push({ type: cloudMatch[1], alt });
      if ((cloudMatch[1] === 'BKN' || cloudMatch[1] === 'OVC') && alt < result.ceiling.altitude) result.ceiling = { type: cloudMatch[1], altitude: alt };
    }
    if (part === 'CAVOK') { result.clouds = []; result.ceiling = { type: 'NSC', altitude: 9999 }; }
  });

  // Flight Category Logic (ICAO/FAA based approximation)
  // LIFR: Ceiling < 500ft OR Vis < 1600m (1 mile)
  // IFR: Ceiling 500-1000ft OR Vis 1600-5000m (1-3 miles)
  // MVFR: Ceiling 1000-3000ft OR Vis 5000-8000m (3-5 miles)
  // VFR: Ceiling > 3000ft AND Vis > 8000m (5 miles)

  if (result.ceiling.altitude < 500 || result.vis < 1600) {
    result.category = 'LIFR';
  } else if (result.ceiling.altitude < 1000 || result.vis < 5000) {
    result.category = 'IFR';
  } else if (result.ceiling.altitude <= 3000 || result.vis <= 8000) {
    result.category = 'MVFR';
  } else {
    result.category = 'VFR';
  }

  return result;
};

// Simulate Real-time Weather Data Fetch
export const fetchMockWeather = (centerLat: number, centerLon: number): Promise<WeatherCell[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const cells: WeatherCell[] = [];
      const time = Date.now();

      // Generate 3-5 random storm cells
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        // Random position within ~1 degree of center
        const latBase = centerLat + (Math.random() * 2 - 1);
        const lonBase = centerLon + (Math.random() * 3 - 1.5);
        const type = Math.random() > 0.7 ? 'TURB' : 'PRECIP';
        const intensity = Math.random() > 0.6 ? 'SEVERE' : (Math.random() > 0.3 ? 'MODERATE' : 'LIGHT');

        // Create a rough hexagon/octagon shape
        const points = [];
        const radius = 0.05 + Math.random() * 0.1; // Size of cell
        const vertices = 6 + Math.floor(Math.random() * 4);

        for (let j = 0; j < vertices; j++) {
          const angle = (j / vertices) * 2 * Math.PI;
          const r = radius * (0.8 + Math.random() * 0.4); // Irregularity
          points.push({
            lat: latBase + r * Math.sin(angle),
            lon: lonBase + r * Math.cos(angle) * 1.5 // Adjust for lon squish
          });
        }

        cells.push({
          id: `wx-${time}-${i}`,
          type,
          intensity,
          polygons: points,
          timestamp: time
        });
      }
      resolve(cells);
    }, 600); // Simulate network delay
  });
};
