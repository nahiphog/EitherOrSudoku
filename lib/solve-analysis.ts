import { bit, emptyGrid, isSolved, PEERS } from "./sudokui/board";
import { applyStep, findNextStep } from "./sudokui/humanSolver";
import { TECHS, type Tech } from "./sudokui/ratings";
import { snyderCandidates, type Edge } from "./either-or";

export type WalkthroughStep = {
  tech: string;
  label: string;
  description: string;
  values: number[];
  candidates: number[];
  removed: { cell: number; digit: number }[];
};

export type PuzzleAnalysis = {
  solutionCount: 0 | 1 | 2;
  initial: { values: number[]; candidates: number[] };
  steps: WalkthroughStep[];
  tally: Record<string, number>;
  rating: string;
  score: number;
  solvedByLogic: boolean;
};

function candidatesFor(values: number[], edges: Edge[]) {
  const result = snyderCandidates(edges).map((digits) => digits.reduce((mask, digit) => mask | bit(digit), 0));
  for (let cell = 0; cell < 81; cell++) if (values[cell]) result[cell] = 0;
  return result;
}

/** Count only to two: 0 = impossible, 1 = unique, 2 = multiple. */
export function countSolutions(edges: Edge[]) {
  return findSolutions(edges, 2).length as 0 | 1 | 2;
}

/** Finds at most `limit` valid completed grids, for verification displays. */
export function findSolutions(edges: Edge[], limit = 2) {
  const board = Array(81).fill(0);
  const baseCandidates = snyderCandidates(edges);
  const edgeMap = Array.from({ length: 81 }, () => [] as Edge[]);
  edges.forEach((edge) => { edgeMap[edge.a].push(edge); edgeMap[edge.b].push(edge); });
  const canPlace = (cell: number, digit: number) => baseCandidates[cell].includes(digit) && !PEERS[cell].some((peer) => board[peer] === digit) && edgeMap[cell].every((edge) => {
    const other = edge.a === cell ? edge.b : edge.a;
    return digit === edge.digit || board[other] === 0 || board[other] === edge.digit;
  });
  const solutions: number[][] = [];
  const visit = (): void => {
    if (solutions.length >= limit) return;
    let cell = -1, options: number[] = [];
    for (let i = 0; i < 81; i++) if (!board[i]) {
      const choices = Array.from({ length: 9 }, (_, index) => index + 1).filter((digit) => canPlace(i, digit));
      if (!choices.length) return;
      if (cell < 0 || choices.length < options.length) { cell = i; options = choices; }
    }
    if (cell < 0) { if (edges.every((edge) => board[edge.a] === edge.digit || board[edge.b] === edge.digit)) solutions.push([...board]); return; }
    for (const digit of options) { board[cell] = digit; visit(); board[cell] = 0; if (solutions.length >= limit) return; }
  };
  visit(); return solutions;
}

/**
 * Conventional clue digging adapted for Either Or borders. A proposed
 * removal survives only if its remaining border set still has one solution.
 */
export async function digPuzzle(
  edges: Edge[],
  targetRemovals = edges.length,
  onProgress?: (tested: number, total: number, remaining: number) => void,
  shouldStop?: () => boolean,
) {
  const target = Math.max(0, Math.min(edges.length, Math.floor(targetRemovals)));
  const order = [...edges].sort(() => Math.random() - .5);
  let remaining = [...edges];
  for (let index = 0; index < order.length; index++) {
    if (shouldStop?.()) break;
    if (edges.length - remaining.length >= target) break;
    const candidate = order[index];
    const trial = remaining.filter((edge) => edge !== candidate);
    if (countSolutions(trial) === 1) remaining = trial;
    onProgress?.(index + 1, order.length, remaining.length);
    // Return control between trials so the browser can paint progress and
    // remains responsive during the full digging pass.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  const removed = edges.length - remaining.length;
  return { edges: remaining, removed, target, targetReached: removed === target, halted: Boolean(shouldStop?.()) };
}

export function analyzePuzzle(edges: Edge[]): PuzzleAnalysis {
  const solutionCount = countSolutions(edges);
  const initialGrid = emptyGrid();
  initialGrid.cands.set(candidatesFor([...initialGrid.values], edges));
  const initial = { values: [...initialGrid.values], candidates: [...initialGrid.cands] };
  if (solutionCount !== 1) return { solutionCount, initial, steps: [], tally: {}, rating: "Unrated", score: 0, solvedByLogic: false };

  const grid = initialGrid;
  const steps: WalkthroughStep[] = [];
  const tally: Record<string, number> = {};
  for (let i = 0; i < 180 && !isSolved(grid); i++) {
    let step = findNextStep(grid);
    if (!step) {
      const solution = findSolutions(edges, 1)[0];
      const cell = grid.values.findIndex((value) => value === 0);
      if (!solution || cell < 0) break;
      step = { tech: "BRUTE_FORCE", placements: [{ cell, digit: solution[cell] }], eliminations: [], description: `Brute Force: set R${Math.floor(cell / 9) + 1}C${cell % 9 + 1} to ${solution[cell]}.` };
    }
    const before = new Uint16Array(grid.cands);
    applyStep(grid, step);
    const info = TECHS[step.tech as Tech];
    tally[info.name] = (tally[info.name] ?? 0) + 1;
    const removed: { cell: number; digit: number }[] = [];
    for (let cell = 0; cell < 81; cell++) if (grid.values[cell] === 0) for (let digit = 1; digit <= 9; digit++) {
      if ((before[cell] & bit(digit)) && !(grid.cands[cell] & bit(digit))) removed.push({ cell, digit });
    }
    steps.push({ tech: info.name, label: info.level, description: step.description, values: [...grid.values], candidates: [...grid.cands], removed });
  }
  const score = steps.reduce((sum, step) => sum + TECHS[Object.keys(TECHS).find((key) => TECHS[key as Tech].name === step.tech) as Tech].score, 0);
  const hardest = steps.reduce((best, step) => {
    const level = TECHS[Object.keys(TECHS).find((key) => TECHS[key as Tech].name === step.tech) as Tech].level;
    return ["Beginner", "Easy", "Medium", "Tricky", "Hard", "Unfair", "Extreme", "Nightmare"].indexOf(level) > ["Beginner", "Easy", "Medium", "Tricky", "Hard", "Unfair", "Extreme", "Nightmare"].indexOf(best) ? level : best;
  }, "Beginner");
  const solvedByLogic = isSolved(grid);
  return { solutionCount, initial, steps, tally, rating: solvedByLogic ? `${hardest} · ${score} points` : "Unrated — logic incomplete", score, solvedByLogic };
}
