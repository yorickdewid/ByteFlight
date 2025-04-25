import { AerodromeService } from "./aerodrome";
import { Aircraft, Aerodrome, Waypoint, RouteTrip, WeatherService } from "flight-planner";
import * as turf from '@turf/turf';

export interface RouteFormData {
  aircraft: string;
  departure: string;
  arrival: string;
  alternate: string;
  via: string;
}

interface RouteOptions {
  altitude: number;
  departureTime: Date;
  aircraft: Aircraft;
}

class RouteService {
  constructor(
    private aerodromeService: AerodromeService,
    private weatherService: WeatherService,
  ) { }

  /**
   * Creates a route based on the provided form data
   */
  async createRoute(
    routeForm: RouteFormData,
    departureDate?: string,
    departureTime?: string,
  ): Promise<RouteTrip> {
    // Parse waypoint strings into actual waypoints
    const routeWaypointDep = await this.parseRouteString(routeForm.departure);
    const routeWaypointArr = await this.parseRouteString(routeForm.arrival);
    const routeWaypointAlt = routeForm.alternate ? await this.parseRouteString(routeForm.alternate) : [];
    const routeWaypointVia = routeForm.via ? await this.parseRouteString(routeForm.via) : [];

    // Create route date/time
    const departureDateObj = departureDate && departureTime
      ? new Date(`${departureDate}T${departureTime}Z`)
      : new Date();

    // Combine all waypoints
    const waypoints = [
      ...routeWaypointDep,
      ...routeWaypointVia,
      ...routeWaypointArr,
      ...routeWaypointAlt
    ];

    // Attach METAR data to waypoints
    await this.attachMetarDataToWaypoints(waypoints);

    // Set up route options
    const selectedAircraft = routeForm.aircraft ? { registration: routeForm.aircraft } as Aircraft : undefined;

    if (!selectedAircraft) {
      throw new Error('No aircraft selected');
    }

    const routeOptions = {
      altitude: 1500,
      departureTime: departureDateObj,
      aircraft: selectedAircraft,
    };

    return this.planFlightRoute(waypoints, routeOptions);
  }

  /**
   * Parses route strings into waypoints
   */
  private async parseRouteString(routeString: string): Promise<Waypoint[]> {
    try {
      if (!routeString) return [];

      // Check for waypoint coordinates
      const waypointMatch = routeString.match(/WP\(([+-]?\d+(\.\d+)?),([+-]?\d+(\.\d+)?)\)/);
      if (waypointMatch) {
        const lng = parseFloat(waypointMatch[1]);
        const lat = parseFloat(waypointMatch[3]);

        // Create a custom waypoint
        return [new Waypoint('WP', turf.point([lng, lat]))];
      }

      // Otherwise treat as airport ICAO code
      const aerodrome = await this.aerodromeService.findByICAO(routeString);
      return aerodrome ? [aerodrome] : [];
    } catch (error) {
      console.error(`Error parsing route string "${routeString}":`, error);
      return [];
    }
  }

  /**
   * Attaches METAR data to waypoints that are aerodromes
   */
  private async attachMetarDataToWaypoints(waypoints: Waypoint[]): Promise<void> {
    if (!waypoints.length) return;

    try {
      // Filter for aerodromes and get ICAO codes
      const aerodromeWaypoints = waypoints.filter(wp => wp instanceof Aerodrome) as Aerodrome[];
      const icaoCodes = aerodromeWaypoints.map(aerodrome => aerodrome.ICAO).join(',');

      if (!icaoCodes) return;

      // Fetch METAR data for these aerodromes
      await this.weatherService.fetchAndUpdateStations(icaoCodes);

      // Connect METAR stations to aerodromes
      aerodromeWaypoints.forEach(aerodrome => {
        const station = this.weatherService.findStationByIcao(aerodrome.ICAO);
        if (station) {
          aerodrome.metarStation = station;
        }
      });
    } catch (error) {
      console.error('Error attaching METAR data to waypoints:', error);
    }
  }

  /**
   * Creates a flight route plan with waypoints and performance calculations
   */
  private planFlightRoute(waypoints: Waypoint[], options: RouteOptions): RouteTrip {
    if (waypoints.length < 2) {
      throw new Error('At least departure and arrival waypoints are required');
    }

    const route = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let totalFuelRequired = 0;

    // Create legs between waypoints
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];

      // Calculate distance between waypoints
      const from = turf.point(start.location.geometry.coordinates);
      const to = turf.point(end.location.geometry.coordinates);
      const distance = turf.distance(from, to, { units: 'nauticalmiles' });

      // Calculate true track (bearing)
      const trueTrack = turf.bearing(from, to);

      // Wind data if available for performance calculations
      let windDirection = 0;
      let windSpeed = 0;

      if (start instanceof Aerodrome && start.metarStation?.metarData) {
        windDirection = start.metarStation.metarData.windDirection || 0;
        windSpeed = start.metarStation.metarData.windSpeed || 0;
      }

      // Simple performance calculations based on aircraft properties
      const cruiseSpeed = options.aircraft.cruiseSpeed || 100; // knots
      const fuelConsumption = options.aircraft.fuelConsumption || 20; // L/hour

      // Calculate ground speed considering wind (simplified)
      const windComponent = windSpeed * Math.cos((windDirection - trueTrack) * Math.PI / 180);
      const groundSpeed = cruiseSpeed + windComponent;

      // Calculate time in hours then convert to minutes
      const timeHours = distance / (groundSpeed > 30 ? groundSpeed : 30);
      const durationMinutes = timeHours * 60;

      // Calculate fuel usage (L)
      const fuelUsed = fuelConsumption * timeHours;

      // Calculate magnetic heading from true track considering magnetic declination
      // This is a simplified calculation for now
      const magneticDeclination = 0; // Ideally this would come from a declination service
      const heading = (trueTrack + magneticDeclination + 360) % 360;

      // Create performance data
      const performance = {
        groundSpeed,
        heading,
        duration: durationMinutes,
        fuelUsed
      };

      // Create the route leg
      route.push({
        start,
        end,
        distance,
        trueTrack,
        windDirection,
        windSpeed,
        performance
      });

      // Update totals
      totalDistance += distance;
      totalDuration += durationMinutes;
      totalFuelRequired += fuelUsed;
    }

    return {
      route,
      totalDistance,
      totalDuration,
      totalFuelRequired,
      departureDate: options.departureTime,
      aircraft: options.aircraft
    };
  }

  /**
   * Gets all unique aerodromes from a route
   */
  static getAerodromesFromRoute(routeTrip: RouteTrip | undefined): Aerodrome[] {
    if (!routeTrip) return [];

    const extractWaypoints = (routeTrip: RouteTrip): Waypoint[] => {
      const waypoints: Waypoint[] = [];
      routeTrip.route.forEach(leg => {
        waypoints.push(leg.start);
        // Add end of the last leg
        if (routeTrip.route.indexOf(leg) === routeTrip.route.length - 1) {
          waypoints.push(leg.end);
        }
      });
      return waypoints;
    };

    return extractWaypoints(routeTrip)
      .filter(waypoint => waypoint instanceof Aerodrome)
      .filter((aerodrome, index, self) =>
        index === self.findIndex(a => (a as Aerodrome).ICAO === (aerodrome as Aerodrome).ICAO)
      ) as Aerodrome[];
  }

  /**
   * Updates the URL with route parameters for sharing/saving
   */
  static updateUrlWithRouteParams(routeForm: RouteFormData): void {
    const queryParams = new URLSearchParams();

    if (routeForm.aircraft) queryParams.set('aircraft', routeForm.aircraft);
    if (routeForm.departure) queryParams.set('departure', routeForm.departure);
    if (routeForm.arrival) queryParams.set('arrival', routeForm.arrival);
    if (routeForm.alternate) queryParams.set('alternate', routeForm.alternate);
    if (routeForm.via) queryParams.set('via', routeForm.via);

    window.history.replaceState({}, '', `${window.location.pathname}?${queryParams.toString()}`);
  }

  /**
   * Gets route parameters from the URL for loading saved routes
   */
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

  /**
   * Formats waypoint coordinates for display
   */
  static formatWaypointCoordinates(lng: number, lat: number): string {
    const formattedLng = lng.toFixed(6);
    const formattedLat = lat.toFixed(6);
    return `WP(${formattedLng},${formattedLat})`;
  }

  /**
   * Adds a waypoint to the via route string
   */
  static addWaypointToVia(routeForm: RouteFormData, lng: number, lat: number): string {
    const waypointStr = RouteService.formatWaypointCoordinates(lng, lat);
    return routeForm.via ? `${routeForm.via};${waypointStr}` : waypointStr;
  }
}

export default RouteService;
