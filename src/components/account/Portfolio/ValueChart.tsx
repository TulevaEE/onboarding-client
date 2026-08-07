import React, { useRef, useState } from 'react';
import moment from 'moment';
import { Euro } from '../../common/Euro';

const WIDTH = 720;
const HEIGHT = 180;
const PADDING = 4;

export interface ChartLayer {
  id: string;
  color: string;
  label: React.ReactNode;
}

/** One value per layer, in the order the layers were given. */
export interface ChartPoint {
  date: string;
  values: number[];
  total: number;
}

export const ValueChart: React.FunctionComponent<{
  series: ChartPoint[];
  layers: ChartLayer[];
  totalLabel: React.ReactNode;
}> = ({ series, layers, totalLabel }) => {
  const container = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  if (!series || series.length < 2 || !layers || layers.length === 0) {
    return <></>;
  }

  const highest = Math.max(...series.map((point) => point.total)) * 1.08 || 1;
  const x = (index: number) => PADDING + (index * (WIDTH - 2 * PADDING)) / (series.length - 1);
  const y = (value: number) => HEIGHT - PADDING - (value / highest) * (HEIGHT - 2 * PADDING);

  const cumulativeAt = (point: ChartPoint, layer: number) =>
    point.values.slice(0, layer + 1).reduce((sum, value) => sum + value, 0);

  // Tallest band first, so the smaller ones stay visible in front of it.
  const bands = layers
    .map((layer, index) => {
      const line = series
        .map(
          (point, pointIndex) =>
            `${pointIndex ? 'L' : 'M'}${x(pointIndex).toFixed(1)},${y(
              cumulativeAt(point, index),
            ).toFixed(1)}`,
        )
        .join(' ');
      return {
        index,
        color: layer.color,
        line,
        area: `${line} L${x(series.length - 1).toFixed(1)},${HEIGHT} L${x(0).toFixed(
          1,
        )},${HEIGHT} Z`,
      };
    })
    .reverse();

  const track = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = container.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) {
      return;
    }
    const fraction = (event.clientX - bounds.left) / bounds.width;
    const index = Math.round(fraction * (series.length - 1));
    setHovered(Math.min(series.length - 1, Math.max(0, index)));
  };

  const point = hovered === null ? null : series[hovered];
  const hoverFraction = hovered === null ? 0 : hovered / (series.length - 1);

  return (
    <div
      ref={container}
      className="position-relative"
      onPointerMove={track}
      onPointerLeave={() => setHovered(null)}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="w-100 d-block"
        style={{ height: '180px' }}
        aria-hidden="true"
      >
        {bands.map((band) => (
          <g key={band.index}>
            <path d={band.area} fill={band.color} fillOpacity="0.18" />
            <path
              d={band.line}
              fill="none"
              stroke={band.color}
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}

        {point && hovered !== null && (
          <g>
            <line
              x1={x(hovered)}
              y1={0}
              x2={x(hovered)}
              y2={HEIGHT}
              stroke="#8a8d91"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            {layers.map((layer, index) => (
              <circle
                key={layer.id}
                cx={x(hovered)}
                cy={y(cumulativeAt(point, index))}
                r="3.5"
                fill={layer.color}
                stroke="#fff"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        )}
      </svg>

      {point && (
        <div
          className="position-absolute bg-white border rounded shadow-sm p-2 small"
          style={{
            top: 0,
            left: `${hoverFraction * 100}%`,
            transform: `translateX(${hoverFraction > 0.65 ? '-100%' : '0'})`,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 2,
          }}
        >
          <div className="text-body-secondary mb-1">{moment(point.date).format('DD.MM.YYYY')}</div>
          {layers.map((layer, index) => (
            <div key={layer.id} className="d-flex align-items-center gap-2">
              <span
                aria-hidden="true"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  background: layer.color,
                  display: 'inline-block',
                  flex: 'none',
                }}
              />
              <span className="text-body-secondary">{layer.label}</span>
              <span className="ms-auto fw-medium">
                <Euro amount={point.values[index]} />
              </span>
            </div>
          ))}
          {layers.length > 1 && (
            <div className="d-flex align-items-center gap-2 border-top mt-1 pt-1">
              <span className="text-body-secondary">{totalLabel}</span>
              <span className="ms-auto fw-medium">
                <Euro amount={point.total} />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
