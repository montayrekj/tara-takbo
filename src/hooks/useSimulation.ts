import { useState, useEffect, useRef, useCallback } from 'react';

export type SimulationSpeed = 1 | 2 | 5 | 10 | 20;

const BASE_SPEED_KMH = 100;

export function useSimulation(totalDistanceMeters: number) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const [speed, setSpeed] = useState<SimulationSpeed>(1);

  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const totalDistanceRef = useRef(totalDistanceMeters);
  const speedRef = useRef(speed);

  useEffect(() => { totalDistanceRef.current = totalDistanceMeters; }, [totalDistanceMeters]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;

      const deltaSeconds = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const effectiveSpeedKmh = BASE_SPEED_KMH * speedRef.current;
      const totalKm = totalDistanceRef.current / 1000;
      if (totalKm === 0) return;

      const progressPerSecond = effectiveSpeedKmh / 3600 / totalKm;

      setProgress((prev) => {
        const next = prev + progressPerSecond * deltaSeconds;
        if (next >= 1) {
          setPlaying(false);
          setFinished(true);
          return 1;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  const play = useCallback(() => {
    setFinished(false);
    setPlaying(true);
  }, []);

  const replay = useCallback(() => {
    setFinished(false);
    setProgress(0);
    setPlaying(true);
  }, []);

  const pause = useCallback(() => setPlaying(false), []);

  const reset = useCallback(() => {
    setPlaying(false);
    setFinished(false);
    setProgress(0);
  }, []);

  const seek = useCallback((p: number) => {
    setFinished(false);
    setProgress(Math.max(0, Math.min(1, p)));
  }, []);

  return { playing, finished, progress, speed, play, replay, pause, reset, seek, setSpeed };
}
