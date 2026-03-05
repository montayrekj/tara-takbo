import React from 'react';
import {
  MdDirectionsRun,
  MdStraighten,
  MdLocationOn,
  MdArrowUpward,
  MdArrowDownward,
  MdZoomOutMap,
  MdUndo,
  MdDeleteOutline,
  MdPlayArrow,
  MdArrowBack,
  MdShare,
  MdCheck,
} from 'react-icons/md';
import type { AppMode, ElevationPoint } from '../types';
import { formatDistance, computeElevationStats } from '../utils/geo';

interface RoutePanelProps {
  mode: AppMode;
  totalDistance: number;
  waypointCount: number;
  elevationData: ElevationPoint[];
  isLoading: boolean;
  hasRoute: boolean;
  onUndo: () => void;
  onClear: () => void;
  onSimulate: () => void;
  onBuild: () => void;
  onFitRoute: () => void;
  onShare: () => void;
  shareCopied: boolean;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
  mode,
  totalDistance,
  waypointCount,
  elevationData,
  isLoading,
  hasRoute,
  onUndo,
  onClear,
  onSimulate,
  onBuild,
  onFitRoute,
  onShare,
  shareCopied,
}) => {
  const { gain, loss } = computeElevationStats(elevationData);
  const hasElevation = elevationData.length > 0;

  return (
    <div className="absolute left-4 top-4 w-60 flex flex-col gap-2.5 pointer-events-none z-10  max-md:w-[100px]">
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl px-4 py-3 border border-slate-700/40 pointer-events-auto shadow-xl">
        <div className="flex items-center gap-2.5 max-md:flex-col text-center">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <MdDirectionsRun size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">
              TaraTakbo
            </h1>
            <p className="text-slate-500 text-xs max-md:hidden">
              {mode === 'build' ? 'Route Builder' : '3D Simulation'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/40 pointer-events-auto shadow-xl">
        <div className="grid max-md:grid-cols-1 md:grid-cols-2 gap-3">
          <Stat
            icon={<MdStraighten size={14} />}
            label="Distance"
            value={hasRoute ? formatDistance(totalDistance) : '—'}
            active={hasRoute}
          />
          <Stat
            icon={<MdLocationOn size={14} />}
            label="Waypoints"
            value={waypointCount > 0 ? String(waypointCount) : '—'}
            active={waypointCount > 0}
          />
          <Stat
            icon={<MdArrowUpward size={14} className="text-green-400" />}
            label="Gain"
            value={hasElevation ? `+${gain} m` : '—'}
            active={hasElevation}
            valueColor="text-green-400"
          />
          <Stat
            icon={<MdArrowDownward size={14} className="text-red-400" />}
            label="Loss"
            value={hasElevation ? `-${loss} m` : '—'}
            active={hasElevation}
            valueColor="text-red-400"
          />
        </div>

        {isLoading && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-blue-400 text-xs">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span>Snapping to road…</span>
          </div>
        )}
      </div>

      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 border border-slate-700/40 pointer-events-auto shadow-xl space-y-1.5">
        {mode === 'build' ? (
          <>
            {hasRoute && (
              <ControlButton
                icon={<MdZoomOutMap size={18} />}
                label="Fit Route"
                onClick={onFitRoute}
              />
            )}
            {hasRoute && (
              <ControlButton
                icon={
                  shareCopied ? <MdCheck size={18} /> : <MdShare size={18} />
                }
                label={shareCopied ? 'Link Copied!' : 'Share Route'}
                onClick={onShare}
              />
            )}
            <ControlButton
              icon={<MdUndo size={18} />}
              label="Undo Last Point"
              onClick={onUndo}
              disabled={waypointCount === 0}
            />
            <ControlButton
              icon={<MdDeleteOutline size={18} />}
              label="Clear Route"
              onClick={onClear}
              disabled={waypointCount === 0}
              danger
            />
            <div className="pt-0.5">
              <button
                type="button"
                onClick={onSimulate}
                disabled={!hasRoute}
                title="Simulate Run"
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                <MdPlayArrow size={18} />
                <span className="max-md:hidden">Simulate Run</span>
              </button>
            </div>
          </>
        ) : (
          <ControlButton
            icon={<MdArrowBack size={18} />}
            label="Back to Builder"
            onClick={onBuild}
          />
        )}
      </div>

      {mode === 'build' && waypointCount === 0 && (
        <div className="bg-blue-950/60 backdrop-blur-md rounded-2xl p-3.5 border border-blue-800/30 pointer-events-auto shadow-xl">
          <p className="text-blue-300 text-xs leading-relaxed">
            <strong>Tip:</strong> Click anywhere on the map to start your route.
            Each click snaps to the nearest road or path automatically.
          </p>
        </div>
      )}
    </div>
  );
};

function Stat({
  icon,
  label,
  value,
  active,
  valueColor = 'text-white',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active?: boolean;
  valueColor?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-slate-500 text-xs mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <span
        className={`font-semibold text-sm ${active ? valueColor : 'text-slate-600'}`}
      >
        {value}
      </span>
    </div>
  );
}

function ControlButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`w-full max-md:text-xs max-md:flex-col max-md:items-center flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? 'bg-slate-700/40 hover:bg-red-900/40 text-slate-300 hover:text-red-300'
          : 'bg-slate-700/40 hover:bg-slate-700/70 text-slate-300'
      }`}
    >
      {icon}
      <span className="max-md:hidden">{label}</span>
    </button>
  );
}
