import type { Edge } from "./either-or";

export function encodeCompactPuzzle(edges: Edge[]) {
  const clues = new Map(edges.map((edge) => [`${edge.a}:${edge.b}`, edge.digit]));
  const digit = (a: number, b: number) => String(clues.get(`${a}:${b}`) ?? 0);
  return Array.from({ length: 9 }, (_, row) => Array.from({ length: 8 }, (_, column) => digit(row * 9 + column, row * 9 + column + 1)).join("")).join("") + Array.from({ length: 9 }, (_, column) => Array.from({ length: 8 }, (_, row) => digit(row * 9 + column, (row + 1) * 9 + column)).join("")).join("");
}

/** Decode the 72 row borders followed by the 72 column borders. */
export function decodeCompactPuzzle(input: string): Edge[] | null {
  const text = input.trim();
  if (!/^\d{144}$/.test(text)) return null;
  const edges: Edge[] = [];
  let index = 0;
  for (let row = 0; row < 9; row++) for (let column = 0; column < 8; column++, index++) {
    const digit = Number(text[index]);
    if (digit) edges.push({ a: row * 9 + column, b: row * 9 + column + 1, digit });
  }
  for (let column = 0; column < 9; column++) for (let row = 0; row < 8; row++, index++) {
    const digit = Number(text[index]);
    if (digit) edges.push({ a: row * 9 + column, b: (row + 1) * 9 + column, digit });
  }
  return edges;
}
