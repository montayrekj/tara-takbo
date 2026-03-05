import { sampleRoute } from '../utils/geo';
import type { ElevationPoint } from '../types';

const ZOOM = 14;

function lngToTileX(lng: number, zoom: number): number {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
}

function latToTileY(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom),
  );
}

function coordToPixel(
  lng: number,
  lat: number,
  tileX: number,
  tileY: number,
  zoom: number,
  tileSize: number,
): { px: number; py: number } {
  const numTiles = Math.pow(2, zoom);
  const latRad = (lat * Math.PI) / 180;

  const px = Math.floor(((lng / 360 + 0.5) * numTiles - tileX) * tileSize);
  const py = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      numTiles *
      tileSize -
      tileY * tileSize,
  );

  return {
    px: Math.max(0, Math.min(tileSize - 1, px)),
    py: Math.max(0, Math.min(tileSize - 1, py)),
  };
}

async function fetchTileImageData(
  z: number,
  x: number,
  y: number,
  token: string,
): Promise<ImageData | null> {
  const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${x}/${y}.pngraw?access_token=${token}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  } catch {
    return null;
  }
}

function decodeElevation(r: number, g: number, b: number): number {
  return -10000 + (r * 65536 + g * 256 + b) * 0.1;
}

export async function fetchElevationData(
  coordinates: [number, number][],
  token: string,
): Promise<ElevationPoint[]> {
  if (coordinates.length < 2) return [];

  const { coords, distances } = sampleRoute(coordinates, 100);

  const tileGroups = new Map<string, { tx: number; ty: number }>();
  coords.forEach(([lng, lat]) => {
    const tx = lngToTileX(lng, ZOOM);
    const ty = latToTileY(lat, ZOOM);
    tileGroups.set(`${tx}/${ty}`, { tx, ty });
  });

  const tileImageData = new Map<string, ImageData | null>();
  await Promise.all(
    Array.from(tileGroups.entries()).map(async ([key, { tx, ty }]) => {
      tileImageData.set(key, await fetchTileImageData(ZOOM, tx, ty, token));
    }),
  );

  const results: ElevationPoint[] = [];

  coords.forEach(([lng, lat], i) => {
    const tx = lngToTileX(lng, ZOOM);
    const ty = latToTileY(lat, ZOOM);
    const imageData = tileImageData.get(`${tx}/${ty}`);

    let elevation = 0;
    if (imageData) {
      const { px, py } = coordToPixel(lng, lat, tx, ty, ZOOM, imageData.width);
      const idx = (py * imageData.width + px) * 4;
      elevation = decodeElevation(
        imageData.data[idx],
        imageData.data[idx + 1],
        imageData.data[idx + 2],
      );
    }

    results.push({ distance: distances[i], elevation: Math.round(elevation * 10) / 10 });
  });

  return results;
}
