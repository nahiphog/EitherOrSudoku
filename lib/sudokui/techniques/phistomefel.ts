import { bit, type Grid } from '../board';
import type { Step } from '../steps';

const ring = [20, 21, 22, 23, 24, 29, 33, 38, 42, 47, 51, 56, 57, 58, 59, 60];
const corners = [0, 1, 7, 8, 9, 10, 16, 17, 63, 64, 70, 71, 72, 73, 79, 80];

export function findPhistomefelRing(grid: Grid): Step | null {
  for (let digit = 1; digit <= 9; digit++) {
    const mask = bit(digit);
    const counts = (cells: number[]) => {
      const placed = cells.filter((cell) => grid.values[cell] === digit).length;
      const open = cells.filter((cell) => !grid.values[cell] && (grid.cands[cell] & mask));
      return { placed, open, max: placed + open.length };
    };
    const a = counts(ring), b = counts(corners);
    const low = Math.max(a.placed, b.placed), high = Math.min(a.max, b.max);
    if (low > high) continue;
    const placements: Step['placements'] = [], eliminations: Step['eliminations'] = [];
    for (const group of [a, b]) {
      if (group.placed === high) eliminations.push(...group.open.map((cell) => ({ cell, digit })));
      else if (group.max === low) placements.push(...group.open.map((cell) => ({ cell, digit })));
    }
    if (placements.length || eliminations.length) return {
      tech: 'PHISTOMEFEL_RING', placements, eliminations,
      description: `Phistomefel Ring: the central ring and four corner blocks must contain equal counts of ${digit}. Their shared count is ${low === high ? low : `${low}–${high}`}. ${eliminations.length ? `Remove ${digit} where its group already meets the maximum. ` : ''}${placements.length ? `Place ${digit} in every remaining spot where all spots are needed to meet the minimum.` : ''}`.trim(),
    };
  }
  return null;
}
