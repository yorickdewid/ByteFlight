import { AircraftProfile, NavPoint, Notam } from '../types';
import { defaultAircraftProfiles } from './constants';

const API_BASE = 'https://api.byteflight.app';

// Helper to add delay for better UX (prevents UI flashing)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const ApiService = {
  // --- Aircraft Endpoints (still local storage) ---
  async getAircraft(): Promise<AircraftProfile[]> {
    await delay(200);
    const stored = localStorage.getItem('byteflight_fleet');
    return stored ? JSON.parse(stored) : defaultAircraftProfiles;
  },

  async saveAircraft(aircraft: AircraftProfile, isNew: boolean): Promise<AircraftProfile> {
    await delay(300);
    const current = await this.getAircraft();
    let updatedList;
    if (isNew) {
      updatedList = [...current, aircraft];
    } else {
      updatedList = current.map(a => a.id === aircraft.id ? aircraft : a);
    }
    localStorage.setItem('byteflight_fleet', JSON.stringify(updatedList));
    return aircraft;
  },

  async deleteAircraft(id: string): Promise<void> {
    await delay(300);
    const current = await this.getAircraft();
    const updated = current.filter(a => a.id !== id);
    localStorage.setItem('byteflight_fleet', JSON.stringify(updated));
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

  async getMetar(icao: string): Promise<string | null> {
    try {
      await delay(100);
      const response = await apiCall<any>(`/metar/${icao.toUpperCase()}`);
      
      if (response.metar?.raw) {
        return response.metar.raw;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get METAR for ${icao}:`, error);
      return null;
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

  async getWindRecommendation(icao: string): Promise<any> {
    try {
      const response = await apiCall<any>(`/aerodrome/${icao.toUpperCase()}/wind`);
      return response;
    } catch (error) {
      console.error(`Failed to get wind data for ${icao}:`, error);
      return null;
    }
  },
};