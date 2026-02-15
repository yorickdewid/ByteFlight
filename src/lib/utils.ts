import { WeatherCell } from '../types';

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
