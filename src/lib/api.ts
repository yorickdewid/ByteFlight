import { AircraftProfile, FlightPlanRequest, MetarResponse, NavLog, NavPoint, Notam, RunwayWindAnalysis } from '../types';
import { defaultAircraftProfiles } from './constants';

const API_BASE = 'https://api.byteflight.app';

// Helper to add delay for better UX (prevents UI flashing)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple rate limiting
const rateLimiter = {
  requests: new Map<string, number[]>(),
  isRateLimited(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requests = this.requests.get(key)!;
    // Remove old requests outside window
    const validRequests = requests.filter(time => time > windowStart);
    this.requests.set(key, validRequests);
    
    if (validRequests.length >= maxRequests) {
      return true;
    }
    
    validRequests.push(now);
    return false;
  }
};

// Transform API response to frontend format
function transformAerodromeToNavPoint(data: any): NavPoint {
  return {
    type: 'AIRPORT',
    id: data.icao || data.id,
    name: data.name || 'Unknown',
    lat: data.coords ? data.coords[1] : data.latitude,
    lon: data.coords ? data.coords[0] : data.longitude,
    elevation: data.elevation ? Math.round(data.elevation) : null,
    magVar: data.declination || null,
    runways: data.runways?.map((rwy: any) => ({
      id: rwy.designator || rwy.id,
      length: rwy.length || 0,
      width: rwy.width || 0,
      surface: rwy.surface === 0 ? 'Asphalt' : 'Unknown',
      trueHeading: rwy.heading || 0,
    })) || [],
    frequencies: data.frequencies?.map((f: any) => ({
      type: f.name || f.type || 'Unknown',
      frequency: f.value || f.frequency || '',
    })) || [],
    vfrAllowed: !data.ppr, // PPR = Prior Permission Required
  };
}

async function apiCall<T>(path: string): Promise<T> {
  // Rate limit API calls per endpoint
  if (rateLimiter.isRateLimited(path)) {
    throw new Error('Rate limited - too many requests');
  }
  
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const ApiService = {
  // --- Aircraft Endpoints (connected to backend) ---
  async getAircraft(): Promise<AircraftProfile[]> {
    try {
      await delay(200);
      const response = await apiCall<any[]>('/aircraft');
      
      // Backend stores aircraft with 'registration' as the key field
      // Map to frontend format (id = registration)
      return response.map(ac => ({
        id: ac.registration,
        name: ac.name || ac.manufacturer || ac.registration,
        cruiseSpeed: ac.cruiseSpeed || 100,
        fuelBurn: ac.fuelConsumption || 20,
        usableFuel: ac.fuelCapacity || 100,
        emptyWeight: ac.emptyWeight || 600,
        maxTakeoffMass: ac.maxTakeoffWeight || 1000,
        cgMin: ac.cgMin || 0,
        cgMax: ac.cgMax || 0,
        armPilot: ac.armPilot || 0,
        armPax: ac.armPax || 0,
        armBaggage: ac.armBaggage || 0,
        armFuel: ac.armFuel || 0,
      }));
    } catch (error) {
      console.error('Failed to load aircraft from API, falling back to localStorage:', error);
      const stored = localStorage.getItem('byteflight_fleet');
      return stored ? JSON.parse(stored) : defaultAircraftProfiles;
    }
  },

  async saveAircraft(aircraft: AircraftProfile, isNew: boolean): Promise<AircraftProfile> {
    try {
      await delay(300);
      
      // Map frontend format to backend format
      const backendAircraft = {
        registration: aircraft.id,
        name: aircraft.name,
        cruiseSpeed: aircraft.cruiseSpeed,
        fuelConsumption: aircraft.fuelBurn,
        fuelCapacity: aircraft.usableFuel,
        emptyWeight: aircraft.emptyWeight,
        maxTakeoffWeight: aircraft.maxTakeoffMass,
        // Include W&B fields (backend stores full object)
        cgMin: aircraft.cgMin,
        cgMax: aircraft.cgMax,
        armPilot: aircraft.armPilot,
        armPax: aircraft.armPax,
        armBaggage: aircraft.armBaggage,
        armFuel: aircraft.armFuel,
      };

      if (isNew) {
        // POST /aircraft
        const response = await fetch(`${API_BASE}/aircraft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendAircraft),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create aircraft: ${response.statusText}`);
        }
      } else {
        // PUT /aircraft/:registration
        const response = await fetch(`${API_BASE}/aircraft/${aircraft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendAircraft),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update aircraft: ${response.statusText}`);
        }
      }
      
      return aircraft;
    } catch (error) {
      console.error('Failed to save aircraft to API, falling back to localStorage:', error);
      const current = await this.getAircraft();
      let updatedList;
      if (isNew) {
        updatedList = [...current, aircraft];
      } else {
        updatedList = current.map(a => a.id === aircraft.id ? aircraft : a);
      }
      localStorage.setItem('byteflight_fleet', JSON.stringify(updatedList));
      return aircraft;
    }
  },

  async deleteAircraft(id: string): Promise<void> {
    try {
      await delay(300);
      
      // DELETE /aircraft/:registration
      const response = await fetch(`${API_BASE}/aircraft/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete aircraft: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to delete aircraft from API, falling back to localStorage:', error);
      const current = await this.getAircraft();
      const updated = current.filter(a => a.id !== id);
      localStorage.setItem('byteflight_fleet', JSON.stringify(updated));
    }
  },

  // --- Real API Endpoints ---
  async lookupNavPoint(query: string): Promise<NavPoint[]> {
    await delay(200);
    const q = query.toUpperCase().trim();
    if (q.length < 2) return [];

    try {
      // Try exact ICAO lookup first
      if (q.length === 4) {
        try {
          const aerodrome = await apiCall<any>(`/aerodrome/${q}`);
          return [transformAerodromeToNavPoint(aerodrome)];
        } catch (e) {
          // If not found, continue with nearby search
        }
      }

      // For now, fallback to mock data for partial matches
      // TODO: Implement search endpoint in API
      const mockResults = await import('./constants').then(m => 
        Object.values(m.mockNavData).filter(a =>
          a.id.includes(q) || a.name.toUpperCase().includes(q)
        )
      );
      
      return mockResults.slice(0, 10); // Limit results
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  async getNavPointDetail(id: string): Promise<NavPoint | null> {
    try {
      await delay(100);
      const aerodrome = await apiCall<any>(`/aerodrome/${id.toUpperCase()}`);
      return transformAerodromeToNavPoint(aerodrome);
    } catch (error) {
      console.error(`Failed to get details for ${id}:`, error);
      // Fallback to mock data
      const mockData = await import('./constants');
      return mockData.mockNavData[id.toUpperCase()] || null;
    }
  },

  async getMetar(icao: string): Promise<MetarResponse | null> {
    try {
      await delay(100);
      const response = await apiCall<MetarResponse>(`/metar/${icao.toUpperCase()}`);
      return response;
    } catch (error) {
      console.error(`Failed to get METAR for ${icao}:`, error);
      return null;
    }
  },

  async getNearbyMetars(lat: number, lon: number, radius: number = 50): Promise<NavPoint[]> {
    try {
      await delay(100);
      const response = await apiCall<any[]>(`/metar/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);

      // Transform API response to NavPoint format
      return response.map(station => ({
        type: 'AIRPORT' as const,
        id: station.station,
        name: station.station,
        lat: station.coords[1], // API returns [lon, lat]
        lon: station.coords[0],
        metar: station.metar?.raw || undefined,
      }));
    } catch (error) {
      console.error('Failed to get nearby METARs:', error);
      return [];
    }
  },

  async getNotams(icao: string): Promise<Notam[]> {
    try {
      await delay(100);
      const response = await apiCall<any>(`/notam/${icao.toUpperCase()}`);
      
      // API returns array of NOTAMs
      const notams = Array.isArray(response) ? response : response.notams || [];
      
      return notams.map((n: any, index: number) => ({
        id: n.id || `NOTAM-${index + 1}`,
        text: n.text || n.message || n.raw || 'No details available',
      }));
    } catch (error) {
      console.error(`Failed to get NOTAMs for ${icao}:`, error);
      return [];
    }
  },

  // --- New endpoints for enhanced functionality ---
  async getNearbyAerodromes(lat: number, lon: number, radius: number = 25): Promise<NavPoint[]> {
    try {
      const response = await apiCall<any[]>(`/aerodrome/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
      return response.map(transformAerodromeToNavPoint);
    } catch (error) {
      console.error('Failed to get nearby aerodromes:', error);
      return [];
    }
  },

  async getRunwayWindAnalysis(icao: string): Promise<RunwayWindAnalysis | null> {
    try {
      const response = await apiCall<RunwayWindAnalysis>(`/aerodrome/${icao.toUpperCase()}/wind`);
      return response;
    } catch (error) {
      console.error(`Failed to get runway wind analysis for ${icao}:`, error);
      return null;
    }
  },

  // --- Flight Planning (Backend Calculation) ---
  async createFlightPlan(request: FlightPlanRequest): Promise<NavLog> {
    const response = await fetch(`${API_BASE}/flightplan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Flight plan failed: ${response.status}`);
    }

    return response.json();
  },

  // Build route string from flight plan (e.g., "EHRD GDA SUGOL EHAM")
  buildRouteString(departure: NavPoint, waypoints: { id?: string; name?: string }[], arrival: NavPoint): string {
    const parts = [
      departure.id || departure.icao,
      ...waypoints.map(wp => wp.id || wp.name),
      arrival.id || arrival.icao,
    ].filter(Boolean);
    return parts.join(' ');
  },
};