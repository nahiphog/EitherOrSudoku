"use client";

export const dynamic = "force-static";

import { useEffect, useMemo, useRef, useState } from "react";
import { makePuzzle } from "@/lib/either-or";
import { encodeCompactPuzzle } from "@/lib/compact";
import { analyzePuzzle, countSolutions, digPuzzle } from "@/lib/solve-analysis";

const trialOptions = [1, 10, 100, 1000, 10000, 100000, 1000000];
const formatElapsed = (milliseconds: number) => milliseconds >= 1000 ? `${(milliseconds / 1000).toFixed(2)} s` : `${milliseconds.toFixed(1)} ms`;

type QualifyingPuzzle = { string: string; borders: number; elapsed: number; rating: string };

export default function SimulationPage() {
  const [trials, setTrials] = useState(10);
  const [maximumBorders, setMaximumBorders] = useState(24);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [qualifying, setQualifying] = useState<QualifyingPuzzle[]>([]);
  const [tallies, setTallies] = useState<Record<number, number>>({});
  const stopRef = useRef(false);
  const startedAtRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const histogram = useMemo(() => Object.entries(tallies).map(([borders, tally]) => ({ borders: Number(borders), tally })).sort((left, right) => left.borders - right.borders), [tallies]);
  const largestTally = Math.max(1, ...histogram.map((entry) => entry.tally));
  const averageElapsed = completed > 0 ? elapsed / completed : null;

  useEffect(() => {
    if (!running) return;
    const update = () => setElapsed(performance.now() - startedAtRef.current);
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [running]);

  const runSimulation = async () => {
    startedAtRef.current = performance.now();
    stopRef.current = false;
    setRunning(true);
    setCompleted(0);
    setQualifying([]);
    setTallies({});
    setElapsed(0);
    const found: QualifyingPuzzle[] = [];
    const nextTallies: Record<number, number> = {};
    let finished = 0;
    while (finished < trials && !stopRef.current) {
      const started = performance.now();
      let puzzle = makePuzzle();
      while (countSolutions(puzzle.edges) !== 1 && !stopRef.current) {
        puzzle = makePuzzle();
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }
      if (stopRef.current) break;
      const dug = await digPuzzle(puzzle.edges, puzzle.edges.length, undefined, () => stopRef.current);
      if (stopRef.current) break;
      const borders = dug.edges.length;
      finished++;
      nextTallies[borders] = (nextTallies[borders] ?? 0) + 1;
      setTallies({ ...nextTallies });
      if (borders <= maximumBorders) {
        const rating = analyzePuzzle(dug.edges).rating;
        found.push({ string: encodeCompactPuzzle(dug.edges), borders, elapsed: performance.now() - started, rating });
        setQualifying([...found]);
      }
      setCompleted(finished);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
    setElapsed(performance.now() - startedAtRef.current);
    setRunning(false);
  };

  return <main className="tool-page">
    <header><h1><a href="/">Either Or Sudoku</a></h1><details className="generator-menu"><summary>Menu</summary><div><a href="/">Generate</a><a href="/custom-build">Custom Build</a><a href="/verify">Verify</a><a href="/import">Import</a><a href="/simulation">Simulation</a><a href="/techniques">Technique library</a></div></details></header>
    <section className="tool-section">
      <h2 className="grid-heading">Simulation</h2>
      <div className="simulation-controls"><label>Total trials<select value={trials} onChange={(event) => setTrials(Number(event.target.value))} disabled={running}>{trialOptions.map((value) => <option key={value}>{value}</option>)}</select></label><label>At most X border cells<input type="number" min="5" max="50" value={maximumBorders} onChange={(event) => setMaximumBorders(Math.max(5, Math.min(50, Number(event.target.value) || 5)))} disabled={running} /></label></div>
      <div className="build-action"><button onClick={runSimulation} disabled={running}>{running ? "Simulating…" : "Run simulation"}</button>{running && <button className="halt-button" onClick={() => { stopRef.current = true; }}>Halt simulation</button>}</div>
      <div className="simulation-status" aria-live="polite"><span><b>{completed} / {trials}</b><small>fully dug puzzles</small></span><span><b>{formatElapsed(elapsed)}</b><small>elapsed time</small></span><span><b>{averageElapsed === null ? "—" : formatElapsed(averageElapsed)}</b><small>average puzzle time</small></span></div>
      {histogram.length > 0 && <section className="histogram vertical-histogram" aria-label="Final border-clue distribution"><h3>Final border-clue distribution</h3><p>Empirical tallies from all completed puzzles.</p><div className="vertical-bars">{histogram.map(({ borders, tally }) => <div className="vertical-bar" key={borders}><b>{tally}</b><div className="vertical-bar-track"><i style={{ height: `${(tally / largestTally) * 100}%` }} /></div><span>{borders}</span></div>)}</div><div className="empirical-tallies">{histogram.map(({ borders, tally }) => <span key={borders}>{borders}: <b>{tally}</b></span>)}</div></section>}
      {qualifying.length > 0 && <section className="matching-strings"><h3>Qualifying puzzles ({qualifying.length})</h3><ol>{qualifying.map((puzzle, index) => <li key={index}><button onClick={() => navigator.clipboard.writeText(puzzle.string)}>Copy 144-character string</button><span>{puzzle.borders} border givens · produced in {formatElapsed(puzzle.elapsed)} · {puzzle.rating}</span></li>)}</ol></section>}
    </section>
  </main>;
}
