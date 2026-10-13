export type Edge = { a: number; b: number; digit: number };

const base = [
  1,2,3,4,5,6,7,8,9, 4,5,6,7,8,9,1,2,3, 7,8,9,1,2,3,4,5,6,
  2,3,4,5,6,7,8,9,1, 5,6,7,8,9,1,2,3,4, 8,9,1,2,3,4,5,6,7,
  3,4,5,6,7,8,9,1,2, 6,7,8,9,1,2,3,4,5, 9,1,2,3,4,5,6,7,8,
];

export function makePuzzle() {
  const solution = base.map((v) => ((v + 3) % 9) + 1);
  const givens = Array(81).fill(0);
  [0, 4, 8, 10, 14, 18, 20, 24, 29, 33, 38, 42, 47, 52, 56, 60, 64, 68, 72, 76, 80, 31, 49, 67, 12, 70].forEach((i) => { givens[i] = solution[i]; });
  const candidates: Edge[] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 8; c++) candidates.push({ a: r * 9 + c, b: r * 9 + c + 1, digit: solution[r * 9 + c] });
  for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) candidates.push({ a: r * 9 + c, b: (r + 1) * 9 + c, digit: solution[(r + 1) * 9 + c] });
  const edges = candidates.filter((_, i) => i % 4 === 1).slice(0, 38);
  return { givens, edges, solution };
}

function peers(cell: number) {
  const r = Math.floor(cell / 9), c = cell % 9, boxR = Math.floor(r / 3) * 3, boxC = Math.floor(c / 3) * 3;
  const out = new Set<number>();
  for (let i = 0; i < 9; i++) { out.add(r * 9 + i); out.add(i * 9 + c); }
  for (let rr = boxR; rr < boxR + 3; rr++) for (let cc = boxC; cc < boxC + 3; cc++) out.add(rr * 9 + cc);
  out.delete(cell); return [...out];
}

export function solveEitherOr(start: number[], edges: Edge[]) {
  const board = [...start];
  const edgeMap = Array.from({ length: 81 }, () => [] as Edge[]);
  edges.forEach((e) => { edgeMap[e.a].push(e); edgeMap[e.b].push(e); });
  const valid = (cell: number, digit: number) => {
    if (peers(cell).some((p) => board[p] === digit)) return false;
    return edgeMap[cell].every((e) => { const other = e.a === cell ? e.b : e.a; return digit === e.digit || board[other] === 0 || board[other] === e.digit; });
  };
  const visit = (): boolean => {
    let target = -1, choices: number[] = [];
    for (let i = 0; i < 81; i++) if (!board[i]) { const opts = Array.from({ length: 9 }, (_, n) => n + 1).filter((n) => valid(i, n)); if (!opts.length) return false; if (target < 0 || opts.length < choices.length) { target = i; choices = opts; } }
    if (target < 0) return edges.every((e) => board[e.a] === e.digit || board[e.b] === e.digit);
    for (const digit of choices) { board[target] = digit; if (visit()) return true; board[target] = 0; }
    return false;
  };
  return visit() ? board : null;
}
