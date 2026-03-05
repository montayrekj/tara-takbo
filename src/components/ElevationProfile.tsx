import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine as ReferenceLineBase,
  ReferenceDot as ReferenceDotBase,
  ResponsiveContainer,
} from 'recharts';
import type { ElevationPoint } from '../types';

const ReferenceLine = ReferenceLineBase as unknown as React.ComponentType<React.ComponentProps<typeof ReferenceLineBase>>;
const ReferenceDot = ReferenceDotBase as unknown as React.ComponentType<React.ComponentProps<typeof ReferenceDotBase>>;

interface ElevationProfileProps {
  data: ElevationPoint[];
  totalDistance: number;
  simulationProgress?: number;
}

function interpolateElevation(data: ElevationPoint[], distanceM: number): number {
  if (data.length === 0) return 0;
  if (distanceM <= data[0].distance) return data[0].elevation;
  if (distanceM >= data[data.length - 1].distance) return data[data.length - 1].elevation;

  for (let i = 0; i < data.length - 1; i++) {
    const a = data[i];
    const b = data[i + 1];
    if (distanceM >= a.distance && distanceM <= b.distance) {
      const t = (distanceM - a.distance) / (b.distance - a.distance);
      return a.elevation + t * (b.elevation - a.elevation);
    }
  }
  return data[data.length - 1].elevation;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ElevationPoint }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="text-white font-semibold">{Math.round(payload[0].value)} m</p>
        <p className="text-slate-400">
          {(payload[0].payload.distance / 1000).toFixed(2)} km
        </p>
      </div>
    );
  }
  return null;
};

function ElevationLabel(props: {
  viewBox?: { cx?: number; cy?: number };
  cx?: number;
  cy?: number;
  elevation?: number;
}) {
  const cx = props.cx ?? props.viewBox?.cx;
  const cy = props.cy ?? props.viewBox?.cy;
  const { elevation } = props;
  if (cx === undefined || cy === undefined || elevation === undefined) return <g />;
  const label = `${Math.round(elevation)} m`;
  const padX = 6;
  const padY = 4;
  const fontSize = 10;
  const approxCharWidth = 6;
  const boxW = label.length * approxCharWidth + padX * 2;
  const boxH = fontSize + padY * 2;
  const flipLeft = cx > 200;
  const labelX = flipLeft ? cx - boxW - 8 : cx + 8;
  const labelY = cy - boxH / 2;

  return (
    <g>
      <rect
        x={labelX}
        y={labelY}
        width={boxW}
        height={boxH}
        rx={4}
        fill="#f97316"
        opacity={0.95}
      />
      <text
        x={labelX + boxW / 2}
        y={labelY + boxH / 2 + fontSize / 3}
        textAnchor="middle"
        fill="white"
        fontSize={fontSize}
        fontWeight="700"
        style={{ userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  );
}

export const ElevationProfile: React.FC<ElevationProfileProps> = ({
  data,
  totalDistance,
  simulationProgress,
}) => {
  if (data.length === 0) return null;

  const isSimulating = simulationProgress !== undefined;
  const currentDistanceM = isSimulating ? simulationProgress! * totalDistance : null;
  const currentElevation =
    currentDistanceM !== null ? interpolateElevation(data, currentDistanceM) : null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="distance"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(v) => `${(v / 1000).toFixed(1)}km`}
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${v}m`}
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={false}
          width={42}
        />
        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="elevation"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="url(#elevGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
        />

        {currentDistanceM !== null && (
          <ReferenceLine
            x={currentDistanceM}
            stroke="#f97316"
            strokeWidth={2}
          />
        )}

        {currentDistanceM !== null && currentElevation !== null && (
          <ReferenceDot
            x={currentDistanceM}
            y={currentElevation}
            r={5}
            fill="#f97316"
            stroke="#ffffff"
            strokeWidth={2.5}
            label={<ElevationLabel elevation={currentElevation ?? undefined} />}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};
