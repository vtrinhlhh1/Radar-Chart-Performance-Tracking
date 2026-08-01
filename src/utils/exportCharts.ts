import JSZip from 'jszip';
import { MiniTab, Student } from '../types';
import { getOrderedCriteria, wrapCriteriaName } from './chartHelpers';

/**
 * Converts an SVG element to a PNG or JPEG Data URL or Blob
 */
export async function svgToImageDataUrl(
  svgElement: SVGSVGElement,
  format: 'png' | 'jpeg' = 'png',
  quality = 0.95,
  bgColor: string = 'transparent'
): Promise<string> {
  const xml = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.src = url;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const scale = 2; // 2x high resolution
  canvas.width = (svgElement.viewBox.baseVal.width || 800) * scale;
  canvas.height = (svgElement.viewBox.baseVal.height || 800) * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  // Fill solid background if specified, or fill white for JPEG
  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  return canvas.toDataURL(`image/${format}`, quality);
}

/**
 * Downloads a single chart image
 */
export async function downloadChartImage(
  svgElement: SVGSVGElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png',
  bgColor: string = 'transparent'
): Promise<void> {
  const dataUrl = await svgToImageDataUrl(svgElement, format, 0.95, bgColor);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.toLowerCase().endsWith(`.${format}`) ? filename : `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Downloads a single chart image generated dynamically from student data
 */
export async function downloadSingleChart(
  miniTab: MiniTab,
  student: Student,
  filename: string,
  format: 'png' | 'jpeg' = 'png',
  bgColor: string = 'transparent',
  includePerformanceScores: boolean = false
): Promise<void> {
  let miniTabToUse = miniTab;

  // Compute class average if exporting whole class average
  if (student.id === 'class_avg' || !miniTab.performances[student.id]) {
    const classAvgPerf: Record<string, number> = {};
    miniTab.criteria.forEach((criterion) => {
      let sum = 0;
      let count = 0;
      miniTab.students.forEach((s) => {
        const v = miniTab.performances[s.id]?.[criterion.id];
        if (v !== undefined && v !== null) {
          sum += v;
          count++;
        }
      });
      classAvgPerf[criterion.id] = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
    });

    miniTabToUse = {
      ...miniTab,
      performances: {
        ...miniTab.performances,
        class_avg: classAvgPerf,
      },
    };
  }

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  try {
    const svgString = renderStudentRadarSVGString(
      miniTabToUse,
      student,
      bgColor,
      includePerformanceScores
    );
    container.innerHTML = svgString;

    const svgElem = container.querySelector('svg');
    if (svgElem) {
      const dataUrl = await svgToImageDataUrl(svgElem, format, 0.95, bgColor);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename.toLowerCase().endsWith(`.${format}`) ? filename : `${filename}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Downloads all charts in a mini tab for every student as a ZIP file
 */
export async function downloadAllChartsInMiniTab(
  miniTab: MiniTab,
  format: 'png' | 'jpeg' = 'png',
  bgColor: string = 'transparent',
  customZipName?: string,
  includePerformanceScores: boolean = false,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const rawZipName = customZipName?.trim() || `${miniTab.name}_charts`;
  const folderName = rawZipName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const folder = zip.folder(folderName);

  // Compute Whole Class Average performance scores
  const classAvgPerf: Record<string, number> = {};
  miniTab.criteria.forEach((criterion) => {
    let sum = 0;
    let count = 0;
    miniTab.students.forEach((s) => {
      const v = miniTab.performances[s.id]?.[criterion.id];
      if (v !== undefined && v !== null) {
        sum += v;
        count++;
      }
    });
    classAvgPerf[criterion.id] = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
  });

  const classAvgStudent: Student = { id: 'class_avg', name: 'Whole Class Average' };
  const exportStudents = [classAvgStudent, ...miniTab.students];

  const miniTabWithAvg: MiniTab = {
    ...miniTab,
    performances: {
      ...miniTab.performances,
      class_avg: classAvgPerf,
    },
  };

  // We temporarily create a hidden container to render each student's SVG
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  try {
    const total = exportStudents.length;
    for (let i = 0; i < total; i++) {
      const student = exportStudents[i];
      if (onProgress) onProgress(i + 1, total);

      const svgString = renderStudentRadarSVGString(
        miniTabWithAvg,
        student,
        bgColor,
        includePerformanceScores
      );
      container.innerHTML = svgString;

      const svgElem = container.querySelector('svg');
      if (svgElem) {
        const dataUrl = await svgToImageDataUrl(svgElem, format, 0.95, bgColor);
        const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
        const safeStudentName = student.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const prefix = i === 0 ? '0' : `${i}`;
        folder?.file(`${prefix}_${safeStudentName}.${format}`, base64Data, { base64: true });
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${folderName}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    document.body.removeChild(container);
  }
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Pure helper to render full SVG string for a student
 */
export function renderStudentRadarSVGString(
  miniTab: MiniTab,
  student: Student,
  bgColor: string = 'transparent',
  includePerformanceScores: boolean = false
): string {
  const { circles, groups, criteria, performances, chartSettings } = miniTab;
  const orderedCriteria = getOrderedCriteria(criteria, groups);
  const totalCriteria = orderedCriteria.length;
  const size = 800;
  const margin = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - 2 * margin) / 2;
  const maxScore = Math.max(1, circles.count);
  const angleStep = (2 * Math.PI) / totalCriteria;
  const startAngleOffset = -Math.PI / 2;

  const getAngle = (index: number) => startAngleOffset + index * angleStep;

  // Group ranges
  const groupRanges: any[] = [];
  groups.forEach((group) => {
    const groupIndices: number[] = [];
    orderedCriteria.forEach((c, idx) => {
      if (c.groupId === group.id) groupIndices.push(idx);
    });

    if (groupIndices.length > 0) {
      const startIndex = Math.min(...groupIndices);
      const endIndex = Math.max(...groupIndices);
      const startAngle = getAngle(startIndex) - angleStep / 2;
      const endAngle = getAngle(endIndex) + angleStep / 2;
      const midAngle = (startAngle + endAngle) / 2;
      groupRanges.push({ group, startAngle, endAngle, midAngle });
    }
  });

  // Student performance points
  const studentPerf = performances[student.id] || {};
  const points: { x: number; y: number }[] = [];
  orderedCriteria.forEach((c, idx) => {
    const score = Math.min(maxScore, Math.max(0, studentPerf[c.id] || 0));
    const r = (score / maxScore) * radius;
    const angle = getAngle(idx);
    points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  });

  const pathD =
    points.length > 0
      ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '') + ' Z'
      : '';

  let groupSlicesSVG = '';
  groupRanges.forEach(({ group, startAngle, endAngle }) => {
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    const wedgePath = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    groupSlicesSVG += `<path d="${wedgePath}" fill="${group.color || '#3b82f6'}" fill-opacity="0.06" stroke="${group.color || '#3b82f6'}" stroke-opacity="0.15" stroke-dasharray="2,2"/>`;
  });

  let circlesSVG = '';
  for (let i = 1; i <= circles.count; i++) {
    const r = (i / maxScore) * radius;
    const name = circles.circleNames[i - 1] || `${i}`;
    circlesSVG += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;

    if (circles.showCircleNames) {
      const nameAngle = -Math.PI / 2 - 0.25;
      const nx = cx + r * Math.cos(nameAngle);
      const ny = cy + r * Math.sin(nameAngle);
      circlesSVG += `<text x="${nx}" y="${ny}" fill="#334155" font-size="${circles.circleNameFontSize || 11}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${escapeXml(name)}</text>`;
    }
  }

  let spokesSVG = '';
  orderedCriteria.forEach((_, idx) => {
    const angle = getAngle(idx);
    const x2 = cx + radius * Math.cos(angle);
    const y2 = cy + radius * Math.sin(angle);
    spokesSVG += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#cbd5e1" stroke-width="1"/>`;
  });

  let groupLabelsSVG = '';
  groupRanges.forEach(({ group, midAngle }) => {
    if (!group.showName) return;
    const groupR = radius * 0.45;
    const gx = cx + groupR * Math.cos(midAngle);
    const gy = cy + groupR * Math.sin(midAngle);
    let textDeg = (midAngle * 180) / Math.PI;
    if (textDeg > 90 || textDeg < -90) textDeg += 180;
    textDeg += group.rotation || 0;

    const showShape = group.showShape !== false;
    const fontSz = group.fontSize || 12;

    if (showShape) {
      const rectW = Math.max(90, group.name.length * fontSz * 0.8);
      const rectH = fontSz * 1.8;
      const rectX = -rectW / 2;
      const rectY = -rectH / 2;
      groupLabelsSVG += `
        <g transform="translate(${gx}, ${gy}) rotate(${textDeg})">
          <rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" rx="4" fill="${group.color || '#3b82f6'}" fill-opacity="0.85" stroke="${group.color || '#3b82f6'}" stroke-width="1"/>
          <text x="0" y="0" fill="#ffffff" font-size="${fontSz}" font-weight="800" text-anchor="middle" dominant-baseline="middle">${escapeXml(group.name)}</text>
        </g>
      `;
    } else {
      groupLabelsSVG += `
        <g transform="translate(${gx}, ${gy}) rotate(${textDeg})">
          <text x="0" y="0" fill="${group.color || '#3b82f6'}" font-size="${fontSz}" font-weight="800" text-anchor="middle" dominant-baseline="middle" stroke="#ffffff" stroke-width="0.5" paint-order="stroke fill">${escapeXml(group.name)}</text>
        </g>
      `;
    }
  });

  let criteriaLabelsSVG = '';
  orderedCriteria.forEach((criterion, idx) => {
    const angle = getAngle(idx);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const isDense = totalCriteria >= 10;
    const labelDist = radius + 18 + (isDense ? (idx % 2) * 24 : 0);

    const lx = cx + labelDist * cos;
    const ly = cy + labelDist * sin;

    let textAnchor = 'middle';
    if (cos > 0.08) textAnchor = 'start';
    else if (cos < -0.08) textAnchor = 'end';

    let baseDyNum = 0.35;
    if (sin > 0.6) baseDyNum = 0.8;
    else if (sin > 0.2) baseDyNum = 0.5;
    else if (sin < -0.6) baseDyNum = -0.3;
    else if (sin < -0.2) baseDyNum = 0;

    const maxPerLine = totalCriteria > 20 ? 14 : totalCriteria > 14 ? 18 : totalCriteria > 10 ? 22 : 26;
    const lines = wrapCriteriaName(criterion.name, maxPerLine);

    if (lines.length === 1) {
      criteriaLabelsSVG += `<text x="${lx}" y="${ly}" fill="#1e293b" font-size="10.5" font-weight="500" text-anchor="${textAnchor}" dy="${baseDyNum}em">${escapeXml(lines[0])}</text>`;
    } else {
      criteriaLabelsSVG += `<text x="${lx}" y="${ly}" fill="#1e293b" font-size="10.5" font-weight="500" text-anchor="${textAnchor}"><tspan x="${lx}" dy="${baseDyNum - 0.55}em">${escapeXml(lines[0])}</tspan><tspan x="${lx}" dy="1.15em">${escapeXml(lines[1])}</tspan></text>`;
    }
  });

  // Calculate layout for Performance Scores table if requested
  let performanceTableSVG = '';
  let extraHeight = 0;

  if (includePerformanceScores) {
    const activeGroupsData = groups
      .map((g) => ({
        group: g,
        criteria: criteria.filter((c) => c.groupId === g.id),
      }))
      .filter((g) => g.criteria.length > 0);

    const isSingleColumn = activeGroupsData.length === 1;

    let col1: typeof activeGroupsData = [];
    let col2: typeof activeGroupsData = [];
    let col1H = 0;
    let col2H = 0;

    activeGroupsData.forEach((gData) => {
      const boxH = 32 + gData.criteria.length * 26 + 8;
      if (isSingleColumn || col1H <= col2H) {
        col1.push(gData);
        col1H += boxH + 12;
      } else {
        col2.push(gData);
        col2H += boxH + 12;
      }
    });

    const tableContentH = Math.max(col1H, col2H, 40);
    extraHeight = tableContentH + 50;

    const startY = 790;
    performanceTableSVG += `
      <g transform="translate(30, ${startY})">
        <text x="0" y="0" fill="#2563eb" font-size="13" font-weight="800" letter-spacing="0.5">PERFORMANCE SCORES DETAILS</text>
        <text x="740" y="0" fill="#64748b" font-size="11" font-weight="600" text-anchor="end">Max Score: ${maxScore}</text>
        <line x1="0" y1="12" x2="740" y2="12" stroke="#cbd5e1" stroke-width="1"/>
      </g>
    `;

    // Render Col 1
    let curY1 = startY + 28;
    col1.forEach(({ group, criteria: gCriteria }) => {
      const boxH = 32 + gCriteria.length * 26 + 8;
      const boxWidth = isSingleColumn ? 740 : 355;
      performanceTableSVG += renderGroupBoxSVG(group, gCriteria, 30, curY1, boxWidth, boxH, studentPerf);
      curY1 += boxH + 12;
    });

    // Render Col 2 if multi-column
    if (!isSingleColumn && col2.length > 0) {
      let curY2 = startY + 28;
      col2.forEach(({ group, criteria: gCriteria }) => {
        const boxH = 32 + gCriteria.length * 26 + 8;
        performanceTableSVG += renderGroupBoxSVG(group, gCriteria, 415, curY2, 355, boxH, studentPerf);
        curY2 += boxH + 12;
      });
    }
  }

  const svgHeight = size + extraHeight;

  const bgRectSVG =
    bgColor && bgColor !== 'transparent'
      ? `<rect width="${size}" height="${svgHeight}" fill="${bgColor}"/>`
      : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${svgHeight}" width="${size}" height="${svgHeight}">
      ${bgRectSVG}
      <text x="${cx}" y="36" fill="#0f172a" font-size="18" font-weight="700" text-anchor="middle">${escapeXml(student.name)} - ${escapeXml(miniTab.name)}</text>
      ${groupSlicesSVG}
      ${circlesSVG}
      ${spokesSVG}
      <path d="${pathD}" fill="${chartSettings.isFilled ? chartSettings.lineColor || '#2563eb' : 'none'}" fill-opacity="${chartSettings.isFilled ? chartSettings.fillOpacity || 0.6 : 0}" stroke="${chartSettings.lineColor || '#2563eb'}" stroke-width="2.5"/>
      ${groupLabelsSVG}
      ${criteriaLabelsSVG}
      ${performanceTableSVG}
    </svg>
  `;
}

function renderGroupBoxSVG(
  group: any,
  criteriaList: any[],
  x: number,
  y: number,
  width: number,
  height: number,
  studentPerf: Record<string, number>
): string {
  const safeGroupName = escapeXml(group.name);
  const groupColor = group.color || '#3b82f6';

  let rowsSVG = '';
  criteriaList.forEach((criterion, idx) => {
    const rowTop = 32 + idx * 26;
    const rawScore = studentPerf[criterion.id];
    const scoreVal = rawScore !== undefined && rawScore !== null ? rawScore : 0;
    const displayName =
      criterion.name.length > 34 ? `${criterion.name.substring(0, 33)}…` : criterion.name;
    const safeCriterionName = escapeXml(displayName);

    rowsSVG += `
      <rect x="8" y="${rowTop}" width="${width - 16}" height="22" rx="5" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
      <text x="16" y="${rowTop + 15}" fill="#334155" font-size="10.5" font-weight="500">${safeCriterionName}</text>
      <rect x="${width - 58}" y="${rowTop + 3}" width="42" height="16" rx="4" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
      <text x="${width - 37}" y="${rowTop + 14}" fill="#1d4ed8" font-size="10" font-weight="800" text-anchor="middle">${scoreVal}</text>
    `;
  });

  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
      <circle cx="16" cy="18" r="4.5" fill="${groupColor}"/>
      <text x="26" y="22" fill="${groupColor}" font-size="11.5" font-weight="700">${safeGroupName}</text>
      ${rowsSVG}
    </g>
  `;
}
