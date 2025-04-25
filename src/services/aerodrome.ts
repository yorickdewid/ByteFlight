import { Aerodrome, AerodromeRepository } from "flight-planner";
import * as turf from '@turf/turf';

export class AerodromeService implements AerodromeRepository {
  private aerodromes: Map<string, Aerodrome>;

  constructor(aerodromes: Aerodrome[] = []) {
    this.aerodromes = new Map(aerodromes.map(aerodrome => [aerodrome.ICAO, aerodrome]));
  }

  get aerodromesList(): Aerodrome[] {
    return Array.from(this.aerodromes.values());
  }

  mapToAerodrome(data: any): Aerodrome {
    // Normalize name - capitalize first letter of each word
    const name = data.name?.toLowerCase()
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Unknown';

    // Normalize ICAO - ensure uppercase
    const icao = data.icaoCode?.toUpperCase() || '';

    // Create the location point
    const location = turf.point(
      Array.isArray(data.geometry?.coordinates) ? data.geometry.coordinates : [0, 0]
    );

    // Map runways with validation
    const runways = Array.isArray(data.runways) ? data.runways.map((runway: any) => {
      return {
        designator: runway.designator || '',
        heading: runway.trueHeading || 0,
      };
    }) : [];

    // Map frequencies with proper type conversion
    const frequencies = Array.isArray(data.frequencies) ? data.frequencies.map((frequency: any) => {
      return {
        type: this.mapFrequencyType(frequency.type),
        name: frequency.name || '',
        value: frequency.value || '',
      };
    }) : [];

    return new Aerodrome(
      name,
      icao,
      location,
      runways,
      { frequencies }
    );
  }

  mapFrequencyType(type: number): string {
    const typeMap: Record<number, string> = {
      0: 'Approach',
      1: 'APRON',
      2: 'Arrival',
      3: 'Center',
      4: 'CTAF',
      5: 'Delivery',
      6: 'Departure',
      7: 'FIS',
      8: 'Gliding',
      9: 'Ground',
      10: 'Information',
      11: 'Multicom',
      12: 'Unicom',
      13: 'Radar',
      14: 'Tower',
      15: 'ATIS',
      16: 'Radio',
      17: 'Other',
      18: 'AIRMET',
      19: 'AWOS',
      20: 'Lights',
      21: 'VOLMET',
      22: 'AFIS',
    };

    return typeMap[type] || 'Unknown';
  }

  async refreshByRadius(location: GeoJSON.Position, distance: number = 50): Promise<void> {
    try {
      const distanceInKm = distance * 1_000;
      const lat = parseFloat(location[1].toFixed(2));
      const lon = parseFloat(location[0].toFixed(2));

      const response = await fetch(
        `https://byteflight-worker.ydewid.workers.dev/api/aerodrome?pos=${lat},${lon}&dist=${distanceInKm}&type=0&type=1&type=2&type=3&type=9&type=5&limit=200`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch aerodromes: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.items)) {
        throw new Error('Invalid response format');
      }

      const aerodromes = data.items.map((item: any) => this.mapToAerodrome(item));

      aerodromes.forEach(aerodrome => {
        if (aerodrome.ICAO) {
          this.aerodromes.set(aerodrome.ICAO, aerodrome);
        }
      });
    } catch (error) {
      console.error('Error refreshing aerodromes by radius:', error);
      throw error;
    }
  }

  async findByICAO(icao: string): Promise<Aerodrome | undefined> {
    // Normalize ICAO to uppercase
    const normalizedIcao = icao.toUpperCase();

    // First check if we already have it cached
    const aerodrome = this.aerodromes.get(normalizedIcao);
    if (aerodrome) {
      return aerodrome;
    }

    try {
      const response = await fetch(`https://byteflight-worker.ydewid.workers.dev/api/aerodrome?search=${normalizedIcao}&limit=1`);

      if (!response.ok) {
        throw new Error(`Failed to fetch aerodrome: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.items) || data.items.length === 0) {
        return undefined;
      }

      const newAerodrome = this.mapToAerodrome(data.items[0]);

      // Only cache if ICAO is valid
      if (newAerodrome.ICAO) {
        this.aerodromes.set(newAerodrome.ICAO, newAerodrome);
      }

      return newAerodrome;
    } catch (error) {
      console.error(`Error fetching aerodrome with ICAO ${normalizedIcao}:`, error);
      throw error;
    }
  }

  async nearestAerodrome(location: GeoJSON.Position, exclude: string[] = []): Promise<Aerodrome | undefined> {
    if (this.aerodromes.size === 0) {
      // If no aerodromes are loaded, try to load some from the location
      await this.refreshByRadius(location, 100);

      // If still no aerodromes, return undefined
      if (this.aerodromes.size === 0) {
        return undefined;
      }
    }

    // Convert exclude ICAO codes to uppercase for consistent comparison
    const normalizedExclude = exclude.map(icao => icao.toUpperCase());

    // Filter out excluded aerodromes
    const aerodromeCandidates = Array.from(this.aerodromes.values())
      .filter(airport => !normalizedExclude.includes(airport.ICAO.toUpperCase()));

    if (aerodromeCandidates.length === 0) {
      return undefined;
    }

    // Create a feature collection of points
    const points = aerodromeCandidates.map(airport => {
      return turf.point(airport.location.geometry.coordinates, { icao: airport.ICAO });
    });

    // Find the nearest point
    const nearest = turf.nearestPoint(location, turf.featureCollection(points));

    if (!nearest?.properties?.icao) {
      return undefined;
    }

    return this.findByICAO(nearest.properties.icao as string);
  }
}
