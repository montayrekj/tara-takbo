import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { AppMode } from '../types';

const DEFAULT_CENTER: [number, number] = [123.8854, 10.3157];

export interface MapViewHandle {
  fitRoute: () => void;
}

interface MapViewProps {
  token: string;
  mode: AppMode;
  routeCoordinates: [number, number][];
  waypoints: [number, number][];
  simulationProgress: number;
  isLoading: boolean;
  onMapClick: (coords: [number, number]) => void;
  onTokenError: () => void;
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  (
    {
      token,
      mode,
      routeCoordinates,
      waypoints,
      simulationProgress,
      isLoading,
      onMapClick,
      onTokenError,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const loadedRef = useRef(false);

    const modeRef = useRef(mode);
    const onMapClickRef = useRef(onMapClick);
    const routeCoordsRef = useRef(routeCoordinates);
    useEffect(() => {
      modeRef.current = mode;
    }, [mode]);
    useEffect(() => {
      onMapClickRef.current = onMapClick;
    }, [onMapClick]);
    useEffect(() => {
      routeCoordsRef.current = routeCoordinates;
    }, [routeCoordinates]);

    useImperativeHandle(ref, () => ({
      fitRoute: () => {
        const map = mapRef.current;
        if (!map || routeCoordsRef.current.length < 2) return;
        const bounds = routeCoordsRef.current.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(
            routeCoordsRef.current[0],
            routeCoordsRef.current[0],
          ),
        );
        map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 1000 });
      },
    }));

    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: DEFAULT_CENTER,
        zoom: 15,
        pitch: 0,
        bearing: 0,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(
        new mapboxgl.ScaleControl({ unit: 'metric' }),
        'bottom-right',
      );
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
        }),
        'top-right',
      );

      map.on('error', (e) => {
        if ((e as unknown as { status?: number }).status === 401) {
          onTokenError();
        }
      });

      map.on('load', () => {
        loadedRef.current = true;

        map.addSource('route', { type: 'geojson', data: emptyCollection() });
        map.addLayer({
          id: 'route-shadow',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#1e3a8a',
            'line-width': 10,
            'line-opacity': 0.25,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.95,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });

        map.addSource('progress', { type: 'geojson', data: emptyCollection() });
        map.addLayer({
          id: 'progress-line',
          type: 'line',
          source: 'progress',
          paint: {
            'line-color': '#f97316',
            'line-width': 4,
            'line-opacity': 0.9,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });

        map.addSource('waypoints', {
          type: 'geojson',
          data: emptyCollection(),
        });
        map.addLayer({
          id: 'waypoints-shadow',
          type: 'circle',
          source: 'waypoints',
          paint: {
            'circle-radius': 12,
            'circle-color': [
              'case',
              ['==', ['get', 'kind'], 'start'],
              '#15803d',
              ['==', ['get', 'kind'], 'end'],
              '#b91c1c',
              '#1d4ed8',
            ],
            'circle-opacity': 0.2,
          },
        });
        map.addLayer({
          id: 'waypoints-circle',
          type: 'circle',
          source: 'waypoints',
          paint: {
            'circle-radius': [
              'case',
              ['==', ['get', 'kind'], 'start'],
              9,
              ['==', ['get', 'kind'], 'end'],
              9,
              5,
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'kind'], 'start'],
              '#22c55e',
              ['==', ['get', 'kind'], 'end'],
              '#ef4444',
              '#60a5fa',
            ],
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
          },
        });

        map.addSource('runner', { type: 'geojson', data: emptyCollection() });
        map.addLayer({
          id: 'runner-glow',
          type: 'circle',
          source: 'runner',
          paint: {
            'circle-radius': 20,
            'circle-color': '#f97316',
            'circle-opacity': 0.2,
          },
        });
        map.addLayer({
          id: 'runner-outer',
          type: 'circle',
          source: 'runner',
          paint: {
            'circle-radius': 12,
            'circle-color': '#f97316',
            'circle-opacity': 0.4,
          },
        });
        map.addLayer({
          id: 'runner-inner',
          type: 'circle',
          source: 'runner',
          paint: {
            'circle-radius': 7,
            'circle-color': '#f97316',
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
          },
        });

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              map.flyTo({
                center: [pos.coords.longitude, pos.coords.latitude],
                zoom: 14,
                duration: 1200,
              });
            },
            () => {},
            { timeout: 5000, maximumAge: 60000 },
          );
        }
      });

      map.on('click', (e) => {
        if (modeRef.current !== 'build') return;
        onMapClickRef.current([e.lngLat.lng, e.lngLat.lat]);
      });

      map.on('mousemove', () => {
        map.getCanvas().style.cursor =
          modeRef.current === 'build' ? 'crosshair' : '';
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
        loadedRef.current = false;
      };
    }, [token]);

    useEffect(() => {
      if (!loadedRef.current || !mapRef.current) return;
      const src = mapRef.current.getSource('route') as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (!src) return;

      if (routeCoordinates.length >= 2) {
        src.setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: routeCoordinates },
          properties: {},
        });
      } else {
        src.setData(emptyCollection());
      }
    }, [routeCoordinates]);

    useEffect(() => {
      if (!loadedRef.current || !mapRef.current) return;
      const src = mapRef.current.getSource('waypoints') as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (!src) return;

      const features: GeoJSON.Feature[] = waypoints.map((coords, i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          kind:
            i === 0 ? 'start' : i === waypoints.length - 1 ? 'end' : 'middle',
        },
      }));

      src.setData({ type: 'FeatureCollection', features });
    }, [waypoints]);

    useEffect(() => {
      if (!loadedRef.current || !mapRef.current) return;
      const map = mapRef.current;

      if (mode === 'simulate') {
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
        }
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        if (!map.getLayer('sky')) {
          map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15,
            },
          });
        }

        if (routeCoordinates.length >= 2) {
          const bounds = routeCoordinates.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(routeCoordinates[0], routeCoordinates[0]),
          );
          map.fitBounds(bounds, {
            padding: 80,
            pitch: 50,
            bearing: 0,
            duration: 1500,
          });
        }
      } else {
        map.setTerrain(null);
        map.easeTo({ pitch: 0, bearing: 0, duration: 800 });

        const progressSrc = map.getSource('progress') as
          | mapboxgl.GeoJSONSource
          | undefined;
        progressSrc?.setData(emptyCollection());
        const runnerSrc = map.getSource('runner') as
          | mapboxgl.GeoJSONSource
          | undefined;
        runnerSrc?.setData(emptyCollection());
      }
    }, [mode]);

    useEffect(() => {
      if (!loadedRef.current || !mapRef.current || mode !== 'simulate') return;
      if (routeCoordinates.length < 2) return;

      const map = mapRef.current;
      const line = turf.lineString(routeCoordinates);
      const totalKm = turf.length(line, { units: 'kilometers' });
      const distKm =
        Math.max(0, Math.min(simulationProgress, 0.9999)) * totalKm;

      const currentPt = turf.along(line, distKm, { units: 'kilometers' });
      const currentCoords = currentPt.geometry.coordinates as [number, number];

      const nextPt = turf.along(line, Math.min(distKm + 0.025, totalKm), {
        units: 'kilometers',
      });
      const nextCoords = nextPt.geometry.coordinates as [number, number];

      const runnerSrc = map.getSource('runner') as
        | mapboxgl.GeoJSONSource
        | undefined;
      runnerSrc?.setData({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: currentCoords },
        properties: {},
      });

      const progressSrc = map.getSource('progress') as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (progressSrc && distKm > 0) {
        try {
          const sliced = turf.lineSlice(
            turf.point(routeCoordinates[0]),
            currentPt,
            line,
          );
          progressSrc.setData(sliced);
        } catch {
        }
      }

      const bearing = turf.bearing(
        turf.point(currentCoords),
        turf.point(nextCoords),
      );
      map.easeTo({
        center: currentCoords,
        bearing,
        pitch: 65,
        zoom: 16.5,
        duration: 400,
        easing: (t) => t,
      });
    }, [simulationProgress, mode, routeCoordinates]);

    return (
      <div className="relative w-full h-full">
        <div ref={containerRef} className="w-full h-full" />
        {isLoading && (
          <div className="absolute top-4 right-4 mr-28 bg-slate-900/85 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 text-blue-300 text-xs border border-slate-700/50 shadow-lg z-10">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Snapping to road…
          </div>
        )}
      </div>
    );
  },
);

MapView.displayName = 'MapView';
