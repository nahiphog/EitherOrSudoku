import type { Edge } from "./either-or";

const units = Array.from({ length: 27 }, (_, i) => Array.from({ length: 9 }, (_, j) => i < 9 ? i * 9 + j : i < 18 ? j * 9 + i - 9 : Math.floor((i - 18) / 3) * 27 + (i - 18) % 3 * 3 + Math.floor(j / 3) * 9 + j % 3));

/** Exhaustive search with singles and Either Or constraint propagation. */
export function solveExact(edges: Edge[], limit = 2): number[][] {
  const solutions: number[][] = [];
  const borders = edges.map(({ a, b, digit }) => ({ a, b, mask: 1 << (digit - 1) }));
  const visit = (domains: Uint16Array) => {
    if (solutions.length >= limit) return;
    let changed = true;
    while (changed) {
      changed = false;
      const restrict = (cell: number, mask: number) => {
        const next = domains[cell] & mask;
        if (next !== domains[cell]) { domains[cell] = next; changed = true; }
        return next !== 0;
      };
      for (const { a, b, mask } of borders) {
        if (!(domains[a] & mask) && !restrict(b, mask)) return;
        if (!(domains[b] & mask) && !restrict(a, mask)) return;
      }
      for (const unit of units) {
        for (const cell of unit) {
          const mask = domains[cell];
          if (!mask) return;
          if (!(mask & (mask - 1))) for (const peer of unit) if (peer !== cell && !restrict(peer, ~mask)) return;
        }
        for (let mask = 1; mask < 512; mask <<= 1) {
          let location = -1, count = 0;
          for (const cell of unit) if (domains[cell] & mask) { location = cell; count++; }
          if (!count) return;
          if (count === 1 && !restrict(location, mask)) return;
        }
      }
    }
    let cell = -1, minimum = 10;
    for (let i = 0; i < 81; i++) {
      let mask = domains[i], count = 0;
      while (mask) { mask &= mask - 1; count++; }
      if (count > 1 && count < minimum) { cell = i; minimum = count; }
    }
    if (cell < 0) {
      const values = Array.from(domains, (mask) => Math.log2(mask) + 1);
      if (edges.every(({ a, b, digit }) => values[a] === digit || values[b] === digit)) solutions.push(values);
      return;
    }
    for (let mask = domains[cell]; mask; mask &= mask - 1) {
      const next = domains.slice(); next[cell] = mask & -mask; visit(next);
      if (solutions.length >= limit) return;
    }
  };
  const initial = new Uint16Array(81).fill(511);
  const peers = Array.from({ length: 81 }, (_, cell) => new Set(units.filter((unit) => unit.includes(cell)).flat().filter((peer) => peer !== cell)));
  for (const { a, b, mask } of borders) for (const cell of peers[a]) if (peers[b].has(cell)) initial[cell] &= ~mask;
  visit(initial);
  return solutions;
}
