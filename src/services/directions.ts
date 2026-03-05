export interface DirectionsResult {
  coordinates: [number, number][];
  distance: number;
}

export async function fetchDirections(
  from: [number, number],
  to: [number, number],
  token: string,
): Promise<DirectionsResult | null> {
  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/walking/` +
      `${from[0]},${from[1]};${to[0]},${to[1]}` +
      `?geometries=geojson&overview=full&access_token=${token}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) return null;

    return {
      coordinates: data.routes[0].geometry.coordinates as [number, number][],
      distance: data.routes[0].distance as number,
    };
  } catch {
    return null;
  }
}
