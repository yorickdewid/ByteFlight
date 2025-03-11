import { Aerodrome, AerodromeRepository } from "flight-planner";
import * as turf from '@turf/turf';

// TODO: Replace with the service fromt the package
export default class AerodromeService implements AerodromeRepository {
  private aerodromes: Map<string, Aerodrome>;

  constructor(aerodromes: Aerodrome[] = []) {
    this.aerodromes = new Map(aerodromes.map(aerodrome => [aerodrome.ICAO, aerodrome]));
  }

  async findByICAO(icao: string): Promise<Aerodrome | undefined> {
    const aerodrome = this.aerodromes.get(icao);
    if (aerodrome) {
      return aerodrome;
    }

    const response = await fetch(`https://my-first-worker.laixer.workers.dev/api/aerodrome?icao=${icao}`);
    const data = await response.json();

    const newAerodrome = new Aerodrome(
      data.name.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      data.icaoCode, // TODO: Normalize ICAO
      turf.point(data.geometry.coordinates),
      data.runways.map((runway: any) => {
        return {
          designator: runway.designator,
          heading: runway.trueHeading,
        };
      }),
      {
        frequencies: data.frequencies.map((frequency: any) => {

          // TODO: Use enum
          let type = 'Unknown';
          switch (frequency.type) {
            case 15:
              type = 'ATIS'
              break;
            case 14:
              type = 'Tower'
              break;
            case 5:
              type = 'Delivery'
              break;
            case 0:
              type = 'Approach'
              break;
            case 10:
              type = 'Radio'
              break;
            case 9:
              type = 'Ground'
              break;
            case 2:
              type = 'Arrival'
              break;
            case 17:
              type = 'Other'
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
