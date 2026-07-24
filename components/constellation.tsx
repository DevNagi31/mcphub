/**
 * Decorative node-graph field behind the hero. Hand-placed points rather than a
 * random generator, so the composition stays the same on every render and the
 * server and client markup match.
 */

const LEFT: Array<[number, number]> = [
  [10, 18], [46, 6], [78, 40], [30, 62], [62, 96], [8, 108],
  [96, 128], [40, 150], [86, 186], [14, 196], [58, 228], [104, 250],
];
const LEFT_EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [0, 3], [2, 3], [3, 4], [4, 5], [4, 6], [6, 7],
  [7, 9], [6, 8], [8, 10], [10, 11], [9, 10],
];

const RIGHT: Array<[number, number]> = [
  [96, 14], [52, 44], [104, 74], [20, 92], [70, 126], [110, 160],
  [34, 176], [88, 212], [16, 236], [64, 262],
];
const RIGHT_EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [4, 6], [5, 7],
  [6, 8], [7, 9], [8, 9],
];

function Field({
  points,
  edges,
  width,
  height,
}: {
  points: Array<[number, number]>;
  edges: Array<[number, number]>;
  width: number;
  height: number;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="#a6b2b7" strokeWidth="0.5" opacity="0.85">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={points[a][0]}
            y1={points[a][1]}
            x2={points[b][0]}
            y2={points[b][1]}
          />
        ))}
      </g>
      <g>
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 4 === 0 ? 2.4 : 1.5}
            fill={i % 5 === 0 ? '#6f9187' : '#a6b2b7'}
            opacity={i % 3 === 0 ? 0.9 : 0.6}
          />
        ))}
      </g>
    </svg>
  );
}

export function Constellation() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-4 top-4 hidden h-[440px] w-[220px] md:block">
        <Field points={LEFT} edges={LEFT_EDGES} width={120} height={280} />
      </div>
      <div className="absolute -right-4 top-0 hidden h-[460px] w-[230px] md:block">
        <Field points={RIGHT} edges={RIGHT_EDGES} width={130} height={290} />
      </div>

      {/* Small solids, echoing the marks in the reference layout. */}
      <svg
        className="absolute left-[6%] top-[26%] hidden h-4 w-4 lg:block"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="#3f4a4f" />
      </svg>
      <span className="absolute left-[7%] top-[64%] hidden h-3 w-3 bg-sage/70 lg:block" />
      <svg
        className="absolute right-[7%] top-[42%] hidden h-14 w-5 flex-col lg:block"
        viewBox="0 0 20 60"
        aria-hidden="true"
      >
        <polygon points="10,0 19,15 1,15" fill="#3f4a4f" />
        <polygon points="10,22 19,37 1,37" fill="#6f9187" />
        <polygon points="10,44 19,59 1,59" fill="#b39a63" />
      </svg>
    </div>
  );
}
