import * as turf from '@turf/turf';
import type { ElevationPoint } from '../types';

export function sampleRoute(
  coordinates: [number, number][],
  maxPoints: number = 100,
): { coords: [number, number][]; distances: number[] } {
  if (coordinates.length < 2) {
    return { coords: coordinates as [number, number][], distances: [0] };
  }

  const line = turf.lineString(coordinates);
  const totalKm = turf.length(line, { units: 'kilometers' });
  const count = Math.min(maxPoints, Math.max(2, Math.ceil(totalKm / 0.05)));

  const coords: [number, number][] = [];
  const distances: number[] = [];

  for (let i = 0; i <= count; i++) {
    const distKm = (i / count) * totalKm;
    const pt = turf.along(line, distKm, { units: 'kilometers' });
    coords.push(pt.geometry.coordinates as [number, number]);
    distances.push(Math.round(distKm * 1000));
  }

  return { coords, distances };
}

export function computeElevationStats(data: ElevationPoint[]): {
  gain: number;
  loss: number;
  minElevation: number;
  maxElevation: number;
} {
  if (data.length < 2) {
    return { gain: 0, loss: 0, minElevation: 0, maxElevation: 0 };
  }

  let gain = 0;
  let loss = 0;
  let minElevation = data[0].elevation;
  let maxElevation = data[0].elevation;

  for (let i = 1; i < data.length; i++) {
    const diff = data[i].elevation - data[i - 1].elevation;
    if (diff > 0) gain += diff;
    else loss += Math.abs(diff);
    minElevation = Math.min(minElevation, data[i].elevation);
    maxElevation = Math.max(maxElevation, data[i].elevation);
  }

  return {
    gain: Math.round(gain),
    loss: Math.round(loss),
    minElevation: Math.round(minElevation),
    maxElevation: Math.round(maxElevation),
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatPace(totalDistanceM: number, speedMultiplier: number): string {
  const basePaceMinPerKm = 6;
  const effectivePace = basePaceMinPerKm / speedMultiplier;
  const mins = Math.floor(effectivePace);
  const secs = Math.round((effectivePace - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}
