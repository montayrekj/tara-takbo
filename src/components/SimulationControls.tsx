import React from 'react';
import { MdPlayArrow, MdPause, MdReplay, MdSkipPrevious } from 'react-icons/md';
import type { SimulationSpeed } from '../hooks/useSimulation';
import { formatDistance } from '../utils/geo';

interface SimulationControlsProps {
  playing: boolean;
  finished: boolean;
  progress: number;
  speed: SimulationSpeed;
  totalDistance: number;
  onPlay: () => void;
  onReplay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (progress: number) => void;
  onSpeedChange: (speed: SimulationSpeed) => void;
}

const SPEEDS: SimulationSpeed[] = [1, 2, 5, 10, 20];

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  playing,
  finished,
  progress,
  speed,
  totalDistance,
  onPlay,
  onReplay,
  onPause,
  onReset,
  onSeek,
  onSpeedChange,
}) => {
  const coveredDistance = progress * totalDistance;
  const percent = Math.round(progress * 100);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(e.target.value) / 100);
  };

  const playControls = (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={onReset}
        title="Reset to start"
        className="w-9 h-9 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
      >
        <MdSkipPrevious size={22} />
      </button>
      <button
        onClick={finished ? onReplay : playing ? onPause : onPlay}
        title={finished ? 'Replay from start' : playing ? 'Pause' : 'Play'}
        className={`w-10 h-10 rounded-xl text-white flex items-center justify-center transition-colors shadow-lg ${
          finished
            ? 'bg-green-600 hover:bg-green-500'
            : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {finished ? (
          <MdReplay size={22} />
        ) : playing ? (
          <MdPause size={22} />
        ) : (
          <MdPlayArrow size={24} />
        )}
      </button>
    </div>
  );

  return (
    <div
      className="absolute bottom-4 right-4 z-10 pointer-events-auto w-[calc(100%-30px)] max-w-[1120px]"
      style={{ right: '16px' }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-slate-700/40 shadow-2xl">
        <div className="flex items-center gap-4 md:flex-row flex-col">
          <div className="md:block hidden">{playControls}</div>

          <div className="flex-1 min-w-0 max-md:w-full">
            <input
              type="range"
              min={0}
              max={100}
              value={percent}
              onChange={handleSeek}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${finished ? '#22c55e' : '#f97316'} ${percent}%, #334155 ${percent}%)`,
              }}
            />
            <div className="flex justify-between mt-1.5 text-xs text-slate-500">
              <span className="text-slate-300 font-medium">
                {formatDistance(coveredDistance)}
              </span>
              <span className={finished ? 'text-green-400 font-medium' : ''}>
                {finished ? 'Complete' : `${percent}%`}
              </span>
              <span>{formatDistance(totalDistance)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="md:hidden block">{playControls}</div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-slate-500 text-xs mr-0.5">Speed</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    speed === s
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
