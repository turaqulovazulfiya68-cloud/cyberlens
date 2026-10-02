import { useEffect, useState } from 'react';

interface RadarChartProps {
  categories: { label: string; value: number; color: string }[];
  size?: number;
}

export function RadarChart({ categories, size = 320 }: RadarChartProps) {
  const [animatedValues, setAnimatedValues] = useState<number[]>(
    categories.map(() => 0)
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValues(categories.map((c) => c.value));
    }, 300);
    return () => clearTimeout(timer);
  }, [categories]);

  const center = size / 2;
  const maxRadius = size / 2 - 50;
  const numAxes = categories.length;
  const angleStep = (Math.PI * 2) / numAxes;

  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getAxisEnd = (index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: center + maxRadius * Math.cos(angle),
      y: center + maxRadius * Math.sin(angle),
    };
  };

  const dataPoints = animatedValues.map((v, i) => getPoint(i, v));
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Radar sweep */}
        <g style={{ transformOrigin: `${center}px ${center}px` }}>
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - maxRadius}
            stroke="rgba(0, 240, 255, 0.3)"
            strokeWidth="1"
            style={{ animation: 'radar-sweep 4s linear infinite', transformOrigin: `${center}px ${center}px` }}
          />
        </g>

        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={categories
              .map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const r = maxRadius * ratio;
                return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
              })
              .join(' ')}
            fill="none"
            stroke="rgba(0, 240, 255, 0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {categories.map((_, i) => {
          const end = getAxisEnd(i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="rgba(0, 240, 255, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(0, 240, 255, 0.1)"
          stroke="#00f0ff"
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.5))' }}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 6 : 4}
              fill={categories[i].color}
              style={{ filter: `drop-shadow(0 0 4px ${categories[i].color})`, transition: 'r 0.2s' }}
            />
            {hoveredIndex === i && (
              <circle
                cx={p.x}
                cy={p.y}
                r={10}
                fill="none"
                stroke={categories[i].color}
                strokeWidth="1"
                opacity="0.5"
                className="animate-ping-slow"
              />
            )}
          </g>
        ))}

        {/* Labels */}
        {categories.map((cat, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelR = maxRadius + 25;
          const x = center + labelR * Math.cos(angle);
          const y = center + labelR * Math.sin(angle);
          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x - 40}
                y={y - 10}
                width={80}
                height={20}
                rx={4}
                fill={hoveredIndex === i ? `${cat.color}20` : 'rgba(10, 16, 32, 0.8)'}
                stroke={hoveredIndex === i ? cat.color : 'rgba(0, 240, 255, 0.15)'}
                strokeWidth="1"
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                className="font-mono text-[10px]"
                fill={hoveredIndex === i ? cat.color : '#8899aa'}
              >
                {cat.label} ({cat.value})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
