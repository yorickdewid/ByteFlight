import { MetarStation, parseMetar, fromIMetar, normalizeICAO } from "flight-planner";
import * as turf from '@turf/turf';
import { Aircraft } from "flight-planner/dist/aircraft";

export async function fetchAircraft(): Promise<Aircraft[]> {
  const response = await fetch('https://byteflight-worker.ydewid.workers.dev/api/aircraft');
  return await response.json();
}

export async function fetchMetarStation(search: string | GeoJSON.BBox): Promise<MetarStation[]> {
  let baseUrl: string;
  if (typeof search === 'string') {
    baseUrl = `https://byteflight-worker.ydewid.workers.dev/api/metar?ids=${search}&format=json&taf=true`;
  } else {
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
