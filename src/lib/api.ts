import { AircraftProfile, NavPoint, Notam } from '../types';
import { defaultAircraftProfiles, mockNavData, mockNotams } from './constants';

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ApiService = {
  // --- Aircraft Endpoints ---
  async getAircraft(): Promise<AircraftProfile[]> {
    await delay(400); // Simulate network
    const stored = localStorage.getItem('byteflight_fleet');
    return stored ? JSON.parse(stored) : defaultAircraftProfiles;
  },

  async saveAircraft(aircraft: AircraftProfile, isNew: boolean): Promise<AircraftProfile> {
    await delay(500);
    // Simulate backend logic
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
    await delay(400);
    const current = await this.getAircraft();
    const updated = current.filter(a => a.id !== id);
    localStorage.setItem('byteflight_fleet', JSON.stringify(updated));
  },

  // --- Lookup & Data Endpoints ---
  async lookupNavPoint(query: string): Promise<NavPoint[]> {
    await delay(300);
    const q = query.toUpperCase();
    if (q.length < 2) return [];

    // Simulate simple search
    return Object.values(mockNavData).filter(a =>
      a.id.includes(q) || a.name.toUpperCase().includes(q)
    );
  },

  async getNavPointDetail(id: string): Promise<NavPoint | null> {
    await delay(200);
    const pt = mockNavData[id.toUpperCase()];
    return pt || null;
  },

  async getMetar(icao: string): Promise<string | null> {
    await delay(300);
    // In reality: GET /api/metar/:icao
    const pt = mockNavData[icao.toUpperCase()];
    if (pt?.metar) return pt.metar;

    // Check for "Nearest" logic if typical logic dictates
    return null;
  },

  // --- Aerodrome/NOTAM ---
  async getNotams(_icao: string): Promise<Notam[]> {
    await delay(400);
    // In reality: GET /api/notam/:icao
    // For mock, return static list if it matches or just return all for demo
    return mockNotams;
  }
};
