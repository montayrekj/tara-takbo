import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MdWarningAmber, MdClose } from 'react-icons/md';
import { MapView, type MapViewHandle } from './components/MapView';
import { RoutePanel } from './components/RoutePanel';
import { ElevationProfile } from './components/ElevationProfile';
import { SimulationControls } from './components/SimulationControls';
import { useSimulation } from './hooks/useSimulation';
import { fetchDirections } from './services/directions';
import { fetchElevationData } from './services/elevation';
import type { AppMode, RouteSegment, ElevationPoint } from './types';

function encodeWaypoints(pts: [number, number][]): string {
  return btoa(JSON.stringify(pts));
}

function decodeWaypoints(encoded: string): [number, number][] | null {
  try {
    const pts = JSON.parse(atob(encoded));
    if (Array.isArray(pts) && pts.length >= 2) return pts as [number, number][];
  } catch {}
  return null;
}

export default function App() {
  const [token, setToken] = useState<string>(
    () =>
      import.meta.env.VITE_MAPBOX_TOKEN ||
      localStorage.getItem('mapbox_token') ||
      '',
  );

  const [mode, setMode] = useState<AppMode>('build');
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    [],
  );
  const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shareCopied, setShareCopied] = useState(false);
  const mapRef = useRef<MapViewHandle>(null);
  const simulation = useSimulation(totalDistance);
  const pendingWaypointsRef = useRef<[number, number][] | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#route=')) return;
    const pts = decodeWaypoints(hash.slice(7));
    if (pts) pendingWaypointsRef.current = pts;
  }, []);

  const rebuildFromWaypoints = useCallback(
    async (pts: [number, number][]) => {
      if (pts.length < 2 || !token) return;
      setIsLoading(true);
      setWaypoints(pts);
      const newSegments: RouteSegment[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const result = await fetchDirections(pts[i], pts[i + 1], token);
        if (result)
          newSegments.push({
            coordinates: result.coordinates,
            distance: result.distance,
          });
      }
      setSegments(newSegments);
      const allCoords = newSegments.flatMap((s) => s.coordinates);
      if (allCoords.length >= 2) {
        const elev = await fetchElevationData(allCoords, token);
        setElevationData(elev);
      }
      setIsLoading(false);
    },
    [token],
  );

  useEffect(() => {
    if (!token || !pendingWaypointsRef.current) return;
    const pts = pendingWaypointsRef.current;
    pendingWaypointsRef.current = null;
    rebuildFromWaypoints(pts);
  }, [token, rebuildFromWaypoints]);

  useEffect(() => {
    const allCoords = segments.flatMap((s) => s.coordinates);
    setRouteCoordinates(allCoords);
    setTotalDistance(segments.reduce((sum, s) => sum + s.distance, 0));
  }, [segments]);

  const handleMapClick = useCallback(
    async (coords: [number, number]) => {
      if (mode !== 'build') return;
      setError(null);

      setWaypoints((prev) => {
        if (prev.length === 0) return [coords];
        return prev;
      });

      setWaypoints((prev) => {
        if (prev.length === 0) {
          return [coords];
        }

        const from = prev[prev.length - 1];

        setIsLoading(true);
        fetchDirections(from, coords, token).then((result) => {
          setIsLoading(false);
          if (!result) {
            setError(
              'Could not find a route to that point. Try clicking closer to a road or path.',
            );
            return;
          }

          const newSegment: RouteSegment = {
            coordinates: result.coordinates,
            distance: result.distance,
          };

          setSegments((prevSegs) => {
            const updated = [...prevSegs, newSegment];
            const allCoords = updated.flatMap((s) => s.coordinates);

            fetchElevationData(allCoords, token).then(setElevationData);

            return updated;
          });

          setWaypoints((prev2) => [...prev2, coords]);
        });

        return [...prev, coords];
      });
    },
    [mode, token],
  );

  const handleUndo = useCallback(() => {
    setWaypoints((prev) => {
      if (prev.length === 0) return prev;
      if (prev.length === 1) {
        setSegments([]);
        setElevationData([]);
        return [];
      }

      setSegments((prevSegs) => {
        const updated = prevSegs.slice(0, -1);
        const allCoords = updated.flatMap((s) => s.coordinates);
        if (allCoords.length >= 2) {
          fetchElevationData(allCoords, token).then(setElevationData);
        } else {
          setElevationData([]);
        }
        return updated;
      });

      return prev.slice(0, -1);
    });
  }, []);

  const handleClear = useCallback(() => {
    setWaypoints([]);
    setSegments([]);
    setRouteCoordinates([]);
    setTotalDistance(0);
    setElevationData([]);
    setError(null);
    simulation.reset();
  }, [simulation]);

  const handleSimulate = useCallback(() => {
    simulation.reset();
    setMode('simulate');
  }, [simulation]);

  const handleBuild = useCallback(() => {
    setMode('build');
    simulation.pause();
  }, [simulation]);

  const handleShare = useCallback(() => {
    const encoded = encodeWaypoints(waypoints);
    const url = `${window.location.origin}${window.location.pathname}#route=${encoded}`;
    window.history.replaceState(null, '', `#route=${encoded}`);
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }, [waypoints]);

  const handleFitRoute = useCallback(() => {
    mapRef.current?.fitRoute();
  }, []);

  const handleTokenError = useCallback(() => {
    localStorage.removeItem('mapbox_token');
    setToken('');
  }, []);

  const hasRoute = segments.length > 0;
  const showElevation = elevationData.length > 0;
  const showSimControls = mode === 'simulate' && hasRoute;
  const elevationBottom = showSimControls
    ? 'bottom-[10rem] md:bottom-[6.5rem]'
    : 'bottom-4';

  return (
    <div className="w-full h-full bg-slate-950 relative overflow-hidden">
      <MapView
        ref={mapRef}
        token={token}
        mode={mode}
        routeCoordinates={routeCoordinates}
        waypoints={waypoints}
        simulationProgress={simulation.progress}
        isLoading={isLoading}
        onMapClick={handleMapClick}
        onTokenError={handleTokenError}
      />

      <RoutePanel
        mode={mode}
        totalDistance={totalDistance}
        waypointCount={waypoints.length}
        elevationData={elevationData}
        isLoading={isLoading}
        hasRoute={hasRoute}
        onUndo={handleUndo}
        onClear={handleClear}
        onSimulate={handleSimulate}
        onBuild={handleBuild}
        onFitRoute={handleFitRoute}
        onShare={handleShare}
        shareCopied={shareCopied}
      />

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-950/95 border border-red-700/50 text-red-200 text-sm rounded-xl px-4 py-3 max-w-sm shadow-2xl backdrop-blur-md flex items-start gap-3">
          <MdWarningAmber
            size={18}
            className="text-red-400 flex-shrink-0 mt-0.5"
          />
          <span className="text-left flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-300 flex-shrink-0"
          >
            <MdClose size={18} />
          </button>
        </div>
      )}

      {showElevation && (
        <div
          className={`absolute w-[calc(100%-30px)] max-w-[1120px] right-4 ${elevationBottom} bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/40 shadow-2xl overflow-hidden z-10`}
          style={{ right: '16px', height: '148px' }}
        >
          <div className="px-4 pt-2.5 pb-0">
            <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">
              Elevation Profile
            </span>
          </div>
          <div style={{ height: '116px' }} className="px-1">
            <ElevationProfile
              data={elevationData}
              totalDistance={totalDistance}
              simulationProgress={
                mode === 'simulate' ? simulation.progress : undefined
              }
            />
          </div>
        </div>
      )}

      {showSimControls && (
        <SimulationControls
          playing={simulation.playing}
          finished={simulation.finished}
          progress={simulation.progress}
          speed={simulation.speed}
          totalDistance={totalDistance}
          onPlay={simulation.play}
          onReplay={simulation.replay}
          onPause={simulation.pause}
          onReset={simulation.reset}
          onSeek={simulation.seek}
          onSpeedChange={simulation.setSpeed}
        />
      )}
    </div>
  );
}
