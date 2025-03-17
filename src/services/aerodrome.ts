import { Aerodrome, AerodromeRepository } from "flight-planner";
import * as turf from '@turf/turf';

// TODO: Replace with the service fromt the package
export default class AerodromeService implements AerodromeRepository {
  private aerodromes: Map<string, Aerodrome>;

  constructor(aerodromes: Aerodrome[] = []) {
    this.aerodromes = new Map(aerodromes.map(aerodrome => [aerodrome.ICAO, aerodrome]));
  }

  get aerodromesList(): Aerodrome[] {
    return Array.from(this.aerodromes.values());
  }

  mapToAerodrome(data: any): Aerodrome {
    return new Aerodrome(
      data.name.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      data.icaoCode, // TODO: Normalize ICAO
      turf.point(data.geometry.coordinates),
      data.runways?.map((runway: any) => {
        return {
          designator: runway.designator,
          heading: runway.trueHeading,
        };
      }) || [],
      {
        frequencies: data.frequencies?.map((frequency: any) => {

          // TODO: Use enum
          let type = 'Unknown';
          switch (frequency.type) {
            case 0:
              type = 'Approach'
              break;
            case 1:
              type = 'APRON'
              break;
            case 2:
              type = 'Arrival'
              break;
            case 3:
              type = 'Center'
              break;
            case 4:
              type = 'CTAF'
              break;
            case 5:
              type = 'Delivery'
              break;
            case 6:
              type = 'Departure'
              break;
            case 7:
              type = 'FIS'
              break;
            case 8:
              type = 'Gliding'
              break;
            case 9:
              type = 'Ground'
              break;
            case 10:
              type = 'Information'
              break;
            case 11:
              type = 'Multicom'
              break;
            case 12:
              type = 'Unicom'
              break;
            case 13:
              type = 'Radar'
              break;
            case 14:
              type = 'Tower'
              break;
            case 15:
              type = 'ATIS'
              break;
            case 16:
              type = 'Radio'
              break;
            case 17:
              type = 'Other'
              break;
            case 18:
              type = 'AIRMET'
              break;
            case 19:
              type = 'AWOS'
              break;
            case 20:
              type = 'Lights'
              break;
            case 21:
              type = 'VOLMET'
              break;
            case 22:
              type = 'AFIS'
              break;
            default:
              break;
          }

          return {
            type: type,
            name: frequency.name,
            value: frequency.value,
          };
        }),
      });
  }

  async refreshByRadius(location: GeoJSON.Position, distance: number = 50) {
    const distanceInKm = distance * 1_000;
    const lat = parseFloat(location[1].toFixed(2));
    const lon = parseFloat(location[0].toFixed(2));
    const response = await fetch(`https://byteflight-worker.ydewid.workers.dev/api/aerodrome?pos=${lat},${lon}&dist=${distanceInKm}&type=0&type=1&type=2&type=3&type=9&type=5&limit=200`);
    const data = await response.json();

    const aerodromes = data.items.map((item: any) => this.mapToAerodrome(item)) as Aerodrome[];
    aerodromes.forEach(aerodrome => {
      if (aerodrome.ICAO) {
        this.aerodromes.set(aerodrome.ICAO, aerodrome);
      }
    });
  }

  async findByICAO(icao: string): Promise<Aerodrome | undefined> {
    const aerodrome = this.aerodromes.get(icao);
    if (aerodrome) {
      return aerodrome;
    }

    const response = await fetch(`https://byteflight-worker.ydewid.workers.dev/api/aerodrome?search=${icao}&limit=1`);
    const data = await response.json();

    if (data.items.length === 0) {
      return undefined;
    }

    const newAerodrome = this.mapToAerodrome(data.items[0]);
    this.aerodromes.set(newAerodrome.ICAO, newAerodrome);

    return newAerodrome;
  }

  // TOOD: This is not yet part of the interface
  // TODO: In the future return a NearestAirportResult object including the distance
  nearestAerodrome(location: GeoJSON.Position, exclude: string[] = []): Promise<Aerodrome | undefined> {
    const aerodromeCandidates = Array.from(this.aerodromes.values()).filter(airport => !exclude.includes(airport.ICAO));

    const nearest = turf.nearestPoint(location, turf.featureCollection(aerodromeCandidates.map(airport => {
      return turf.point(airport.location.geometry.coordinates, { icao: airport.ICAO });
    })));

    return this.findByICAO(nearest.properties?.icao);
  }
}
