import { MetarStation, parseMetar, fromIMetar, normalizeICAO } from "flight-planner";
import * as turf from '@turf/turf';
import { Aircraft } from "flight-planner/dist/aircraft";

/**
 * Fetches a list of aircraft from the ByteFlight API.
 * 
 * @async
 * @function fetchAircraft
 * @returns {Promise<Aircraft[]>} A promise that resolves to an array of Aircraft objects
 * @throws {Error} If the network response is not ok
 */
export async function fetchAircraft(): Promise<Aircraft[]> {
  const response = await fetch('https://byteflight-worker.ydewid.workers.dev/api/aircraft');
  return await response.json();
}

/**
 * Fetches METAR station data based on a search string or bounding box.
 * 
 * @param search - Either a string containing station ID(s) or a GeoJSON.BBox containing coordinates
 * @returns A promise that resolves to an array of MetarStation objects
 * 
 * @example
 * // Fetch by station ID
 * const stations = await fetchMetarStation('KJFK');
 * 
 * @example
 * // Fetch by bounding box
 * const bbox: GeoJSON.BBox = [-74.2, 40.6, -73.7, 40.9];
 * const stations = await fetchMetarStation(bbox);
 */
export async function fetchMetarStation(search: string | GeoJSON.BBox): Promise<MetarStation[]> {
  let baseUrl: string;
  if (typeof search === 'string') {
    baseUrl = `https://byteflight-worker.ydewid.workers.dev/api/metar?ids=${search}&format=json&taf=true`;
  } else {
    // TODO: Make this into a function
    const bboxReversed = [
      parseFloat(search[1].toFixed(2)),
      parseFloat(search[0].toFixed(2)),
      parseFloat(search[3].toFixed(2)),
      parseFloat(search[2].toFixed(2))
    ];
    baseUrl = `https://byteflight-worker.ydewid.workers.dev/api/metar?bbox=${bboxReversed.join(',')}&format=json&taf=true`;
  }

  const response = await fetch(baseUrl);
  const data = await response.json();

  return data.map((metar: any) => ({
    station: normalizeICAO(metar.icaoId),
    metarData: fromIMetar(parseMetar(metar.rawOb)),
    location: turf.point([metar.lon, metar.lat]),
  }));
}
