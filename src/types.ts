export type AppMode = 'build' | 'simulate';

export interface RouteSegment {
  coordinates: [number, number][];
  distance: number;
}

export interface ElevationPoint {
  distance: number;
  elevation: number;
}
