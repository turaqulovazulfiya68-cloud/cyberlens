import { useEffect, useState } from 'react';
import type { Finding, RelationshipLink } from '@/types';
import { getCategoryColor } from '@/lib/analysis';

interface RelationshipNetworkProps {
  findings: Finding[];
  relationships: RelationshipLink[];
  highlightedCategory?: string | null;
  onNodeClick?: (finding: Finding) => void;
}

export function RelationshipNetwork({
  findings,
  relationships,
  highlightedCategory,
  onNodeClick,
}: RelationshipNetworkProps) {
  const [animatedLinks, setAnimatedLinks] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedLinks(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (findings.length === 0) return null;

  const size = 420;
  const center = size / 2;
  const radius = 130;
  const numNodes = findings.length;
  const angleStep = (Math.PI * 2) / numNodes;

  const nodes = findings.map((f, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      ...f,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      color: getCategoryColor(f.category),
    };
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible max-w-full">
        {/* Central label */}
        <circle cx={center} cy={center} r="35" fill="rgba(255, 45, 85, 0.1)" stroke="#ff2d55" strokeWidth="1.5" />
        <text x={center} y={center - 4} textAnchor="middle" className="font-mono text-[8px] fill-cyber-red font-bold">
          BIRGALIKDAGI
        </text>
        <text x={center} y={center + 8} textAnchor="middle" className="font-mono text-[8px] fill-cyber-red font-bold">
          XAVF
        </text>
        <circle cx={center} cy={center} r="35" fill="none" stroke="#ff2d55" strokeWidth="0.5" opacity="0.5" className="animate-ping-slow" />

        {/* Links */}
        {relationships.map((rel, i) => {
          const from = nodeMap.get(rel.from);
          const to = nodeMap.get(rel.to);
          if (!from || !to) return null;

          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          return (
            <g key={i}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgba(255, 45, 85, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                style={{
                  opacity: animatedLinks ? 1 : 0,
                  transition: `opacity 0.5s ${i * 0.15}s`,
                }}
              />
              {/* Animated pulse along the line */}
              <circle r="2" fill="#ff2d55" opacity="0.6">
                <animateMotion
                  dur="3s"
                  repeatCount="indefinite"
                  path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                  begin={`${i * 0.5}s`}
                />
              </circle>
            </g>
          );
        })}

        {/* Links to center */}
        {nodes.map((node, i) => (
          <line
            key={`center-${i}`}
            x1={node.x}
            y1={node.y}
            x2={center}
            y2={center}
            stroke="rgba(0, 240, 255, 0.15)"
            strokeWidth="1"
            strokeDasharray="2 4"
            style={{ opacity: animatedLinks ? 1 : 0, transition: `opacity 0.5s ${i * 0.1 + 0.3}s` }}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const isHighlighted = !highlightedCategory || node.category === highlightedCategory;
          const dimmed = highlightedCategory && node.category !== highlightedCategory;

          return (
            <g
              key={node.id}
              onClick={() => onNodeClick?.(node)}
              style={{ cursor: 'pointer', opacity: dimmed ? 0.3 : 1, transition: 'opacity 0.3s' }}
            >
              {/* Outer ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r="22"
                fill="none"
                stroke={node.color}
                strokeWidth="1"
                opacity="0.3"
                className={isHighlighted ? 'animate-pulse-glow' : ''}
              />
              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r="16"
                fill={`${node.color}20`}
                stroke={node.color}
                strokeWidth="2"
                style={{ filter: `drop-shadow(0 0 6px ${node.color}80)` }}
              />
              {/* Label */}
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                className="font-mono text-[8px] font-bold"
                fill={node.color}
              >
                {node.label.substring(0, 8)}
              </text>
              {/* Value below */}
              <text
                x={node.x}
                y={node.y + 34}
                textAnchor="middle"
                className="font-mono text-[7px]"
                fill="#667788"
              >
                {node.value.substring(0, 12)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
