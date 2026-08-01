import React from 'react';
import { MiniTab, Student } from '../types';
import { getOrderedCriteria, wrapCriteriaName } from '../utils/chartHelpers';

interface RadarChartProps {
  miniTab: MiniTab;
  selectedStudentId?: string | null; // null or undefined means show all students or selected
  compareStudentIds?: string[]; // Multiple selected students to overlay
  width?: number;
  height?: number;
  interactiveScoreChange?: (studentId: string, criterionId: string, newScore: number) => void;
  customTitle?: string;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  miniTab,
  selectedStudentId,
  compareStudentIds,
  width = 800,
  height = 800,
  interactiveScoreChange,
  customTitle,
  className = '',
}) => {
  const { circles, groups, criteria, students, performances, chartSettings } = miniTab;

  const orderedCriteria = getOrderedCriteria(criteria, groups);
  const totalCriteria = orderedCriteria.length;
  if (totalCriteria === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm border border-dashed rounded-xl border-gray-300">
        No criteria defined yet. Add criteria to render the radar chart.
      </div>
    );
  }

  // Geometry dimensions
  const margin = 140; // Space for perimeter labels
  const size = Math.min(width, height);
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - 2 * margin) / 2;

  const maxScore = Math.max(1, circles.count);
  const angleStep = (2 * Math.PI) / totalCriteria;
  // Start angles at top (-PI/2)
  const startAngleOffset = -Math.PI / 2;

  // Helper to get angle for criterion index
  const getAngle = (index: number) => startAngleOffset + index * angleStep;

  // Group spans calculation
  const groupRanges: {
    group: typeof groups[0];
    startIndex: number;
    endIndex: number;
    startAngle: number;
    endAngle: number;
    midAngle: number;
  }[] = [];

  groups.forEach((group) => {
    const groupCriteriaIndices: number[] = [];
    orderedCriteria.forEach((c, idx) => {
      if (c.groupId === group.id) {
        groupCriteriaIndices.push(idx);
      }
    });

    if (groupCriteriaIndices.length > 0) {
      const startIndex = Math.min(...groupCriteriaIndices);
      const endIndex = Math.max(...groupCriteriaIndices);

      const startAngle = getAngle(startIndex) - angleStep / 2;
      const endAngle = getAngle(endIndex) + angleStep / 2;
      const midAngle = (startAngle + endAngle) / 2;

      groupRanges.push({
        group,
        startIndex,
        endIndex,
        startAngle,
        endAngle,
        midAngle,
      });
    }
  });

  // Determine students to render
  let studentsToRender: Student[] = [];
  if (compareStudentIds && compareStudentIds.length > 0) {
    studentsToRender = students.filter((s) => compareStudentIds.includes(s.id));
  } else if (selectedStudentId) {
    const found = students.find((s) => s.id === selectedStudentId);
    if (found) studentsToRender = [found];
  } else {
    // Default show first student or all students up to 3
    studentsToRender = students.slice(0, 3);
  }

  // Color palette for students
  const studentColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {customTitle && (
        <div className="mb-2 text-center text-lg font-bold text-slate-800">
          {customTitle}
        </div>
      )}

      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="overflow-visible select-none max-w-full h-auto drop-shadow-sm"
      >
        {/* DEF DEFS FOR SHADOWS & GRADIENTS */}
        <defs>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* 1. GROUP SECTOR BACKGROUND SLICES */}
        {groupRanges.map(({ group, startAngle, endAngle, midAngle }) => {
          // Draw sector arc wedge
          const rInner = 0;
          const rOuter = radius;

          const x1 = cx + rOuter * Math.cos(startAngle);
          const y1 = cy + rOuter * Math.sin(startAngle);
          const x2 = cx + rOuter * Math.cos(endAngle);
          const y2 = cy + rOuter * Math.sin(endAngle);

          const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

          const wedgePath = `
            M ${cx} ${cy}
            L ${x1} ${y1}
            A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2} ${y2}
            Z
          `;

          return (
            <g key={`group-sector-${group.id}`}>
              {/* Light group background sector tint */}
              <path
                d={wedgePath}
                fill={group.color || '#3b82f6'}
                fillOpacity="0.06"
                stroke={group.color || '#3b82f6'}
                strokeOpacity="0.15"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </g>
          );
        })}

        {/* 2. CONCENTRIC CIRCLES */}
        {Array.from({ length: circles.count }).map((_, i) => {
          const circleIndex = i + 1; // 1 to count
          const r = (circleIndex / maxScore) * radius;
          const name = circles.circleNames[i] || `${circleIndex}`;

          return (
            <g key={`circle-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={circleIndex === circles.count ? '1.5' : '1'}
              />

              {/* Circle Name Display along a radial axis */}
              {circles.showCircleNames && (
                <g>
                  {/* Position circle name radially near angle -110 deg */}
                  {(() => {
                    const nameAngle = -Math.PI / 2 - 0.25; // Slightly left of vertical top spoke
                    const nx = cx + r * Math.cos(nameAngle);
                    const ny = cy + r * Math.sin(nameAngle);
                    return (
                      <text
                        x={nx}
                        y={ny}
                        fill="#334155"
                        fontSize={circles.circleNameFontSize || 11}
                        fontWeight="700"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none drop-shadow-sm"
                      >
                        <tspan dy="-2" className="bg-white px-1">
                          {name}
                        </tspan>
                      </text>
                    );
                  })()}
                </g>
              )}
            </g>
          );
        })}

        {/* 3. AXIS SPOKE LINES (CRITERIA LINES) */}
        {orderedCriteria.map((criterion, idx) => {
          const angle = getAngle(idx);
          const x2 = cx + radius * Math.cos(angle);
          const y2 = cy + radius * Math.sin(angle);

          return (
            <line
              key={`spoke-${criterion.id}`}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* 4. PERFORMANCE SHAPES (STUDENT RADAR DATA) */}
        {studentsToRender.map((student, studentIndex) => {
          const studentPerf = performances[student.id] || {};
          const points: { x: number; y: number; criterionId: string; score: number }[] = [];

          orderedCriteria.forEach((c, idx) => {
            const score = Math.min(maxScore, Math.max(0, studentPerf[c.id] || 0));
            const r = (score / maxScore) * radius;
            const angle = getAngle(idx);
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            points.push({ x, y, criterionId: c.id, score });
          });

          const pathD =
            points.length > 0
              ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '') + ' Z'
              : '';

          const color = studentColors[studentIndex % studentColors.length];

          return (
            <g key={`student-shape-${student.id}`}>
              {/* Polygon shape: Filled vs Pure line */}
              <path
                d={pathD}
                fill={chartSettings.isFilled ? color : 'none'}
                fillOpacity={chartSettings.isFilled ? chartSettings.fillOpacity || 0.5 : 0}
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />

              {/* Data points */}
              {chartSettings.showPoints &&
                points.map((pt, pIdx) => (
                  <circle
                    key={`point-${student.id}-${pIdx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#ffffff"
                    stroke={color}
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6 transition-all"
                    onClick={() => {
                      if (interactiveScoreChange) {
                        const newScore = (pt.score % maxScore) + 1;
                        interactiveScoreChange(student.id, pt.criterionId, newScore);
                      }
                    }}
                  >
                    <title>
                      {student.name} - Score: {pt.score}/{maxScore}
                    </title>
                  </circle>
                ))}
            </g>
          );
        })}

        {/* 5. GROUP NAME LABELS (POSITIONED INSIDE OR ALONG GROUP SLICES) */}
        {groupRanges.map(({ group, midAngle }) => {
          if (!group.showName) return null;

          // Position group text at ~ 45-55% of radius inside the slice wedge
          const groupR = radius * 0.45;
          const gx = cx + groupR * Math.cos(midAngle);
          const gy = cy + groupR * Math.sin(midAngle);

          // Calculate rotation angle so text runs cleanly along or across radial slice
          // Convert angle to degrees
          let textDeg = (midAngle * 180) / Math.PI;
          if (textDeg > 90 || textDeg < -90) {
            textDeg += 180; // keep text right side up
          }
          textDeg += group.rotation || 0;

          const showShape = group.showShape !== false;
          const fontSz = group.fontSize || 12;
          const rectW = Math.max(90, group.name.length * fontSz * 0.8);
          const rectH = fontSz * 1.8;

          return (
            <g
              key={`group-label-${group.id}`}
              transform={`translate(${gx}, ${gy}) rotate(${textDeg})`}
              className="pointer-events-none"
            >
              {showShape ? (
                <>
                  <rect
                    x={-rectW / 2}
                    y={-rectH / 2}
                    width={rectW}
                    height={rectH}
                    rx="4"
                    fill={group.color || '#3b82f6'}
                    fillOpacity="0.85"
                    stroke={group.color || '#3b82f6'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="0"
                    fill="#ffffff"
                    fontSize={fontSz}
                    fontWeight="800"
                    letterSpacing="0.05em"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {group.name}
                  </text>
                </>
              ) : (
                <text
                  x="0"
                  y="0"
                  fill={group.color || '#3b82f6'}
                  fontSize={fontSz}
                  fontWeight="800"
                  letterSpacing="0.05em"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  paintOrder="stroke fill"
                  className="drop-shadow-xs"
                >
                  {group.name}
                </text>
              )}
            </g>
          );
        })}

        {/* 6. CRITERIA LABELS ON REAR SIDE OF LAST CIRCLE */}
        {orderedCriteria.map((criterion, idx) => {
          const angle = getAngle(idx);
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          // Stagger label radial distance for dense criteria to prevent adjacent overlaps
          const isDense = totalCriteria >= 10;
          const labelDist = radius + 18 + (isDense ? (idx % 2) * 24 : 0);

          const lx = cx + labelDist * cos;
          const ly = cy + labelDist * sin;

          // Precise anchor positioning based on angle cos
          let textAnchor = 'middle';
          if (cos > 0.08) textAnchor = 'start';
          else if (cos < -0.08) textAnchor = 'end';

          // Vertical offset based on sin
          let baseDyNum = 0.35;
          if (sin > 0.6) baseDyNum = 0.8;
          else if (sin > 0.2) baseDyNum = 0.5;
          else if (sin < -0.6) baseDyNum = -0.3;
          else if (sin < -0.2) baseDyNum = 0;

          // Multi-line wrapping threshold based on density
          const maxPerLine = totalCriteria > 20 ? 14 : totalCriteria > 14 ? 18 : totalCriteria > 10 ? 22 : 26;
          const lines = wrapCriteriaName(criterion.name, maxPerLine);

          return (
            <g key={`criteria-label-${criterion.id}`}>
              <text
                x={lx}
                y={ly}
                fill="#1e293b"
                fontSize="10.5"
                fontWeight="500"
                textAnchor={textAnchor}
                className="select-none transition-colors hover:fill-blue-600 hover:font-bold cursor-default"
              >
                <title>{criterion.name}</title>
                {lines.length === 1 ? (
                  <tspan x={lx} dy={`${baseDyNum}em`}>{lines[0]}</tspan>
                ) : (
                  <>
                    <tspan x={lx} dy={`${baseDyNum - 0.55}em`}>{lines[0]}</tspan>
                    <tspan x={lx} dy="1.15em">{lines[1]}</tspan>
                  </>
                )}
              </text>
            </g>
          );
        })}
      </svg>

      {/* CHART LEGEND (WHEN MULTIPLE STUDENTS RENDERED) */}
      {studentsToRender.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 px-4 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80 backdrop-blur-sm">
          {studentsToRender.map((s, idx) => (
            <div key={`legend-${s.id}`} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span
                className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                style={{ backgroundColor: studentColors[idx % studentColors.length] }}
              />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
