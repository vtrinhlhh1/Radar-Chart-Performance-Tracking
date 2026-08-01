import { Criterion, CriteriaGroup } from '../types';

/**
 * Returns criteria ordered grouped by their group ID according to the order of groups.
 * Ensures criteria belonging to the same group are strictly contiguous.
 */
export function getOrderedCriteria(criteria: Criterion[], groups: CriteriaGroup[]): Criterion[] {
  const ordered: Criterion[] = [];
  groups.forEach((group) => {
    criteria.forEach((c) => {
      if (c.groupId === group.id) {
        ordered.push(c);
      }
    });
  });
  // Include orphan criteria (if any)
  criteria.forEach((c) => {
    if (!ordered.some((oc) => oc.id === c.id)) {
      ordered.push(c);
    }
  });
  return ordered;
}

/**
 * Wraps a long criterion name into up to two lines based on maxPerLine.
 */
export function wrapCriteriaName(name: string, maxPerLine: number = 20): string[] {
  if (!name) return [''];
  const trimmed = name.trim();
  if (trimmed.length <= maxPerLine) {
    return [trimmed];
  }

  const words = trimmed.split(/\s+/);
  if (words.length === 1) {
    const splitIndex = Math.min(maxPerLine, Math.ceil(trimmed.length / 2));
    const line1 = trimmed.substring(0, splitIndex);
    let line2 = trimmed.substring(splitIndex);
    if (line2.length > maxPerLine) {
      line2 = line2.substring(0, maxPerLine - 1) + '…';
    }
    return [line1, line2];
  }

  let line1 = '';
  let line2 = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = line1 ? `${line1} ${word}` : word;
    if (candidate.length <= maxPerLine || i === 0) {
      line1 = candidate;
    } else {
      line2 = words.slice(i).join(' ');
      break;
    }
  }

  if (line2.length > maxPerLine + 4) {
    line2 = line2.substring(0, maxPerLine + 3) + '…';
  }

  return [line1, line2];
}
