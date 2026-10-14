export type Edge = { a: number; b: number; digit: number };

const base = [
  1,2,3,4,5,6,7,8,9, 4,5,6,7,8,9,1,2,3, 7,8,9,1,2,3,4,5,6,
  2,3,4,5,6,7,8,9,1, 5,6,7,8,9,1,2,3,4, 8,9,1,2,3,4,5,6,7,
  3,4,5,6,7,8,9,1,2, 6,7,8,9,1,2,3,4,5, 9,1,2,3,4,5,6,7,8,
];

export function makePuzzle() {
  const shuffle = <T,>(items: T[]) => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const rows = shuffle([0, 1, 2]).flatMap((band) => shuffle([0, 1, 2]).map((row) => band * 3 + row));
  const columns = shuffle([0, 1, 2]).flatMap((stack) => shuffle([0, 1, 2]).map((column) => stack * 3 + column));
  const solution = rows.flatMap((row) => columns.map((column) => digits[base[row * 9 + column] - 1]));
  const givens = Array(81).fill(0);
  const edges: Edge[] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 8; c++) {
    const a = r * 9 + c, b = a + 1;
    edges.push({ a, b, digit: Math.random() < .5 ? solution[a] : solution[b] });
  }
  for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) {
    const a = r * 9 + c, b = a + 9;
    edges.push({ a, b, digit: Math.random() < .5 ? solution[a] : solution[b] });
  }
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

/**
 * A border clue must occupy one of its two endpoints. Its digit therefore
 * cannot occupy any other cell that sees both endpoints: the shared row (or
 * column) and their shared box. This is the first layer of Snyder marks for
 * an Either Or puzzle.
 */
export function snyderCandidates(edges: Edge[]) {
  const candidates = Array.from({ length: 81 }, () => new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const sharesHouse = (a: number, b: number) => {
    const rowA = Math.floor(a / 9), columnA = a % 9;
    const rowB = Math.floor(b / 9), columnB = b % 9;
    return rowA === rowB || columnA === columnB || (Math.floor(rowA / 3) === Math.floor(rowB / 3) && Math.floor(columnA / 3) === Math.floor(columnB / 3));
  };
  for (const edge of edges) {
    for (let cell = 0; cell < 81; cell++) {
      if (cell !== edge.a && cell !== edge.b && sharesHouse(cell, edge.a) && sharesHouse(cell, edge.b)) candidates[cell].delete(edge.digit);
    }
  }
  return candidates.map((set) => [...set]);
}
