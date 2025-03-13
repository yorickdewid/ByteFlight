import { ReportingPoint } from "flight-planner";
import * as turf from '@turf/turf';

export const reportingPoints = [
  new ReportingPoint('Hotel', turf.point([4.126667, 51.971667]), true),
  new ReportingPoint('Mike', turf.point([4.651389, 51.998333]), true),
  new ReportingPoint('Romeo', turf.point([4.597222, 51.856944]), true),
];