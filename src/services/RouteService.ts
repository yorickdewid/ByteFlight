import { Aerodrome, parseRouteString, planFlightRoute, RouteTrip, Waypoint, WeatherService } from 'flight-planner';
import { Aircraft } from 'flight-planner/dist/aircraft';
import AerodromeService from './aerodrome';
import * as turf from '@turf/turf';

export interface RouteFormData {
  aircraft: string;
  departure: string;
  arrival: string;
  alternate: string;
  via: string;
}

class RouteService {
  constructor(
    private aerodromeService: AerodromeService,
    private weatherService: WeatherService,
  ) { }

  // TODO: The aircraft parameter should be another service
  async createRoute(
    routeForm: RouteFormData,
    departureDate: string,
    departureTime: string,
    aircraft: Aircraft[]
  ): Promise<RouteTrip> {
    const airplane = aircraft.find(a => a.registration === routeForm.aircraft);
    const routeWaypointDep = await parseRouteString(this.aerodromeService, [], routeForm.departure);
    const routeWaypointArr = await parseRouteString(this.aerodromeService, [], routeForm.arrival);
    const routeWaypointAlt = routeForm.alternate !== ''
      ? await parseRouteString(this.aerodromeService, [], routeForm.alternate)
      : [];
    const routeWaypointVia = routeForm.via !== ''
      ? await parseRouteString(this.aerodromeService, [], routeForm.via)
      : [];

    const departureDateObj = new Date(`${departureDate}T${departureTime}Z`);

    const waypoints = [
      ...routeWaypointDep,
      ...routeWaypointVia,
      ...routeWaypointArr,
      ...routeWaypointAlt
    ];

    await this.attachMetarDataToWaypoints(waypoints);

    const routeOptions = {
      altitude: 1500,
      departureTime: departureDateObj,
      aircraft: airplane,
    };

    return planFlightRoute(waypoints, routeOptions);
  }

  private async attachMetarDataToWaypoints(waypoints: Waypoint[]): Promise<void> {
    if (!waypoints.length) return;

    try {
      // Convert waypoints to GeoJSON points collection
      const routeWaypointGeoJSON = turf.featureCollection(waypoints.map(wp =>
        turf.point(wp.location.geometry.coordinates)
      ));

      // Calculate the bounding box for all waypoints
      const geobbox = turf.bbox(routeWaypointGeoJSON);

      // Fetch weather data for the route area
      await this.weatherService.fetchAndUpdateStations(geobbox, 35);

      // Find and attach the nearest weather station to each waypoint
      for (const waypoint of waypoints) {
        if (waypoint instanceof Aerodrome) {
          const metarStation = this.weatherService.findNearestStation(waypoint.location.geometry);

          if (metarStation) {
            waypoint.metarStation = metarStation;
          }
        }
      }
    } catch (error) {
      console.error('Error attaching METAR data to waypoints:', error);
    }
  }

  static getAerodromesFromRoute(routeTrip: RouteTrip | undefined): Aerodrome[] {
    if (!routeTrip) return [];

    // TODO: Call routeTripWaypoints(routeTrip)
    return routeTrip.route.flatMap(leg => [leg.start, leg.end])
      .filter(waypoint => waypoint instanceof Aerodrome)
      .filter((aerodrome, index, self) =>
        index === self.findIndex(a => (a as Aerodrome).ICAO === (aerodrome as Aerodrome).ICAO)
      ) as Aerodrome[];
  }

  static updateUrlWithRouteParams(routeForm: RouteFormData): void {
    const queryParams = new URLSearchParams();

    if (routeForm.aircraft) queryParams.set('aircraft', routeForm.aircraft);
    if (routeForm.departure) queryParams.set('departure', routeForm.departure);
    if (routeForm.arrival) queryParams.set('arrival', routeForm.arrival);
    if (routeForm.alternate) queryParams.set('alternate', routeForm.alternate);
    if (routeForm.via) queryParams.set('via', routeForm.via);

    window.history.replaceState({}, '', `${window.location.pathname}?${queryParams.toString()}`);
  }

  static getRouteParamsFromUrl(): RouteFormData {
    const params = new URLSearchParams(window.location.search);

    return {
      aircraft: params.get('aircraft') || '',
      departure: params.get('departure') || '',
      arrival: params.get('arrival') || '',
      alternate: params.get('alternate') || '',
      via: params.get('via') || ''
    };
  }

  static formatWaypointCoordinates(lng: number, lat: number): string {
    const formattedLng = lng.toFixed(6);
    const formattedLat = lat.toFixed(6);
    return `WP(${formattedLng},${formattedLat})`;
  }

  static addWaypointToVia(routeForm: RouteFormData, lng: number, lat: number): string {
    const waypointStr = RouteService.formatWaypointCoordinates(lng, lat);
    return routeForm.via ? `${routeForm.via};${waypointStr}` : waypointStr;
  }
}

export default RouteService;
