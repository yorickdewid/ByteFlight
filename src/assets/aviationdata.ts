import { ReportingPoint } from "flight-planner";
import * as turf from '@turf/turf';

export const reportingPoints = [
  new ReportingPoint('Hotel', turf.point([4.126667, 51.971667]), true),
  new ReportingPoint('Mike', turf.point([4.651389, 51.998333]), true),
  new ReportingPoint('Romeo', turf.point([4.597222, 51.856944]), true),
];

export const aircraft = [
  {
    manufacturer: 'Robin',
    model: 'DR40',
    registration: 'PH-HLR',
    numberOfEngines: 1,
    engineType: 'piston' as 'piston',
    maxTakeoffWeight: 980,
    cruiseSpeed: 105,
    fuelConsumption: 20,
  },
  {
    manufacturer: 'Robin',
    model: 'DR40',
    registration: 'PH-SVT',
    numberOfEngines: 1,
    engineType: 'piston' as 'piston',
    maxTakeoffWeight: 980,
    cruiseSpeed: 105,
    fuelConsumption: 20,
  },
  {
    manufacturer: 'Boeing',
    model: 'B737',
    registration: 'PH-BGI',
    numberOfEngines: 2,
    engineType: 'turboprop' as 'turboprop',
    maxTakeoffWeight: 66320,
    cruiseSpeed: 460,
  }
];