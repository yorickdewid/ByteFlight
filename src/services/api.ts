import { MetarStation, parseMetar, fromIMetar, normalizeICAO } from "flight-planner";
import * as turf from '@turf/turf';

export async function fetchMetarStation(search: string | GeoJSON.BBox): Promise<MetarStation[]> {
  let baseUrl: string;
  if (typeof search === 'string') {
    baseUrl = `https://byteflight-worker.ydewid.workers.dev/api/metar?ids=${search}&format=json&taf=true`;
  } else {
    const bboxReversed = [search[1], search[0], search[3], search[2]];
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
