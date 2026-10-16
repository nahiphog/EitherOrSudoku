"use client";

export const dynamic = "force-static";

import { useRef, useState } from "react";
import { makePuzzle, type Edge } from "@/lib/either-or";
import { analyzePuzzle, type PuzzleAnalysis } from "@/lib/solve-analysis";
import { bit } from "@/lib/sudokui/board";

type BorderPosition = { id: string; orientation: "across" | "down"; line: number; offset: number; label: string };

const borderPositions: BorderPosition[] = [
  ...Array.from({ length: 9 }, (_, row) => Array.from({ length: 8 }, (_, column) => ({ id: `h-${row}-${column}`, orientation: "across" as const, line: column + 1, offset: row + .5, label: `between row ${row + 1}, columns ${column + 1} and ${column + 2}` }))).flat(),
  ...Array.from({ length: 8 }, (_, row) => Array.from({ length: 9 }, (_, column) => ({ id: `v-${row}-${column}`, orientation: "down" as const, line: row + 1, offset: column + .5, label: `between column ${column + 1}, rows ${row + 1} and ${row + 2}` }))).flat(),
];

const layoutPositions = [
  ...borderPositions.filter((position) => position.orientation === "across"),
  ...borderPositions.filter((position) => position.orientation === "down").sort((left, right) => left.offset - right.offset || left.line - right.line),
];

function formatElapsed(milliseconds: number) {
  return milliseconds >= 1000 ? `${(milliseconds / 1000).toFixed(2)} s` : `${milliseconds.toFixed(1)} ms`;
}

function BorderClue({ edge }: { edge: Edge }) {
  const rowA = Math.floor(edge.a / 9), columnA = edge.a % 9;
  const rowB = Math.floor(edge.b / 9), columnB = edge.b % 9;
  const style = rowA === rowB
    ? { left: `calc(3px + (100% - 6px) * ${Math.max(columnA, columnB)} / 9)`, top: `calc(3px + (100% - 6px) * ${rowA + .5} / 9)` }
    : { left: `calc(3px + (100% - 6px) * ${columnA + .5} / 9)`, top: `calc(3px + (100% - 6px) * ${Math.max(rowA, rowB)} / 9)` };
  return <span className="border-clue" style={style}>{edge.digit}</span>;
}

function SolveWalkthrough({ analysis, edges }: { analysis: PuzzleAnalysis; edges: Edge[] }) {
  const [stepIndex, setStepIndex] = useState(0);
  const maxStep = analysis.steps.length;
  const visibleStep = Math.min(stepIndex, maxStep);
  const previousValues = visibleStep === 0 ? analysis.initial.values : visibleStep === 1 ? analysis.initial.values : analysis.steps[visibleStep - 2].values;
  const walkthrough = visibleStep === 0
    ? { tech: "Initial candidate map", label: "Step 0", description: "Border-clue eliminations are applied before any classical technique.", values: analysis.initial.values, candidates: analysis.initial.candidates, removed: [] }
    : analysis.steps[visibleStep - 1];
  return <section className="walkthrough">
    <h2>Solve walkthrough</h2>
    <div className="analysis-summary"><span><b>{analysis.solvedByLogic ? "Solved logically" : "Logic paused"}</b><small>{analysis.rating}</small></span><span><b>{analysis.steps.length}</b><small>technique steps</small></span></div>
    {walkthrough ? <><div className="step-card"><div><span className="tech-label">{walkthrough.label}</span><h3>{walkthrough.tech}</h3><p>{walkthrough.description}</p></div><span>{visibleStep} / {maxStep}</span></div>
      <input className="step-slider" type="range" min="0" max={maxStep} value={visibleStep} onChange={(event) => setStepIndex(Number(event.target.value))} aria-label="Custom puzzle walkthrough step" />
      <div className="step-controls" aria-label="Custom puzzle walkthrough controls"><button onClick={() => setStepIndex(0)} disabled={visibleStep === 0} aria-label="Go to step 0">&lt;&lt;</button><button onClick={() => setStepIndex((index) => Math.max(0, Math.min(maxStep, index) - 1))} disabled={visibleStep === 0} aria-label="Go to previous step">&lt;</button><button onClick={() => setStepIndex((index) => Math.min(maxStep, index + 1))} disabled={visibleStep === maxStep} aria-label="Go to next step">&gt;</button><button onClick={() => setStepIndex(maxStep)} disabled={visibleStep === maxStep} aria-label="Go to final step">&gt;&gt;</button></div>
      <div className="sudoku-board walkthrough-board" aria-label="Custom puzzle walkthrough">{walkthrough.values.map((digit, index) => digit ? <span className={`cell ${previousValues[index] === 0 ? "walkthrough-value" : ""}`} key={index}>{digit}</span> : <span className="cell snyder walkthrough-snyder" key={index}>{Array.from({ length: 9 }, (_, candidate) => { const value = candidate + 1; const removedNow = walkthrough.removed.some((removal) => removal.cell === index && removal.digit === value); const remains = Boolean(walkthrough.candidates[index] & bit(value)); return <i className={removedNow ? "removed-now" : remains ? "" : "already-removed"} key={value}>{value}</i>; })}</span>)}{edges.map((edge, index) => <BorderClue edge={edge} key={index} />)}</div>
    </> : <p className="notice">No imported classical technique applies after the border constraints. The puzzle is unique, but needs a variant-specific deduction beyond this walkthrough.</p>}
    <div className="tally"><h3>Technique tally</h3>{Object.entries(analysis.tally).length ? <ul><li className="tally-header"><span>Technique</span><b>Steps</b></li>{Object.keys(analysis.tally).map((technique) => <li key={technique}><span>{technique}</span><b>{analysis.steps.flatMap((step, index) => step.tech === technique ? [index + 1] : []).join(", ")}</b></li>)}</ul> : <p>None yet.</p>}</div>
  </section>;
}

export default function CustomBuild() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [result, setResult] = useState<{ solution: number[]; edges: Edge[]; analysis: PuzzleAnalysis; attempts: number; elapsed: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [haltRequested, setHaltRequested] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [minimumDifficulty, setMinimumDifficulty] = useState(0);
  const [maximumDifficulty, setMaximumDifficulty] = useState(2000);
  const [randomBorderCount, setRandomBorderCount] = useState(25);
  const [layoutText, setLayoutText] = useState("");
  const [layoutStatus, setLayoutStatus] = useState<string | null>(null);
  const haltRef = useRef(false);
  const toggle = (id: string) => setSelected((current) => {
    setResult(null);
    setMessage(null);
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const placeRandomBorders = () => {
    const count = Math.max(10, Math.min(144, Math.floor(randomBorderCount) || 10));
    const shuffled = [...borderPositions];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    setSelected(new Set(shuffled.slice(0, count).map((position) => position.id)));
    setResult(null);
    setMessage(null);
    setCopyStatus(null);
  };
  const clearBorders = () => {
    setSelected(new Set());
    setResult(null);
    setMessage(null);
    setCopyStatus(null);
  };
  const exportLayout = async () => {
    const text = layoutPositions.map((position) => selected.has(position.id) ? "1" : "0").join("");
    setLayoutText(text);
    try {
      await navigator.clipboard.writeText(text);
      setLayoutStatus("144-character layout copied to clipboard.");
    } catch {
      setLayoutStatus("Layout is ready in the text box. Clipboard access was unavailable.");
    }
  };
  const importLayout = () => {
    const text = layoutText.replace(/\s/g, "");
    if (!/^[01]{144}$/.test(text)) {
      setLayoutStatus("Enter exactly 144 characters, using only 0 and 1.");
      return;
    }
    setSelected(new Set(layoutPositions.filter((position, index) => text[index] === "1").map((position) => position.id)));
    setResult(null);
    setMessage(null);
    setCopyStatus(null);
    setLayoutText(text);
    setLayoutStatus(`${[...text].filter((value) => value === "1").length} green border cells imported.`);
  };
  const build = async () => {
    const blueprint = new Set(selected);
    const started = performance.now();
    let attemptCount = 0;
    const minimum = Math.min(minimumDifficulty, maximumDifficulty);
    const maximum = Math.max(minimumDifficulty, maximumDifficulty);
    haltRef.current = false;
    setBuilding(true);
    setHaltRequested(false);
    setAttempts(0);
    setElapsed(0);
    setResult(null);
    setMessage(null);
    setCopyStatus(null);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    while (!haltRef.current) {
      attemptCount++;
      const generated = makePuzzle();
      const edges = generated.edges.filter((_, index) => blueprint.has(borderPositions[index].id));
      const analysis = analyzePuzzle(edges);
      const elapsedNow = performance.now() - started;
      setAttempts(attemptCount);
      setElapsed(elapsedNow);
      if (analysis.solutionCount === 1 && analysis.solvedByLogic && analysis.score >= minimum && analysis.score <= maximum) {
        setResult({ solution: generated.solution, edges, analysis, attempts: attemptCount, elapsed: elapsedNow });
        setBuilding(false);
        return;
      }
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
    setMessage(`Build halted after ${attemptCount} attempt${attemptCount === 1 ? "" : "s"} in ${formatElapsed(performance.now() - started)}.`);
    setBuilding(false);
    setHaltRequested(false);
  };
  const haltBuild = () => { haltRef.current = true; setHaltRequested(true); };
  const copyBorderPuzzle = async () => {
    if (!result) return;
    const clues = new Map(result.edges.map((edge) => [`${edge.a}:${edge.b}`, edge.digit]));
    const digitAt = (a: number, b: number) => String(clues.get(`${a}:${b}`) ?? 0);
    const rowBorders = Array.from({ length: 9 }, (_, row) => Array.from({ length: 8 }, (_, column) => digitAt(row * 9 + column, row * 9 + column + 1)).join("")).join("");
    const columnBorders = Array.from({ length: 9 }, (_, column) => Array.from({ length: 8 }, (_, row) => digitAt(row * 9 + column, (row + 1) * 9 + column)).join("")).join("");
    const text = rowBorders + columnBorders;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Border-only puzzle copied to clipboard.");
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = text;
      document.body.appendChild(fallback);
      fallback.select();
      const copied = document.execCommand("copy");
      fallback.remove();
      setCopyStatus(copied ? "Border-only puzzle copied to clipboard." : "Clipboard access was unavailable. Please try again.");
    }
  };
  return <main className="custom-build">
    <header><h1><a href="/">Either Or Sudoku</a></h1><details className="generator-menu"><summary>Menu</summary><div><a href="/">Generate</a><a href="/custom-build">Custom Build</a><a href="/verify">Verify</a><a href="/import">Import</a><a href="/simulation">Simulation</a><a href="/techniques">Technique library</a></div></details></header>
    <section>
      <h2 className="grid-heading">Custom Build</h2>
      <p className="build-tally" aria-live="polite"><b>{selected.size}</b> / 144 border cells selected</p>
      <div className="random-border-controls"><label>Random green border cells <input type="number" min="10" max="144" value={randomBorderCount} onChange={(event) => setRandomBorderCount(Math.max(10, Math.min(144, Number(event.target.value) || 10)))} disabled={building} /></label><button type="button" onClick={placeRandomBorders} disabled={building}>Place randomly</button><button type="button" onClick={clearBorders} disabled={building || selected.size === 0}>Clear green cells</button></div>
      <div className="layout-transfer"><label htmlFor="green-border-layout">Green-cell layout (144 × 0/1)</label><textarea id="green-border-layout" value={layoutText} onChange={(event) => setLayoutText(event.target.value.replace(/\s/g, ""))} maxLength={144} disabled={building} aria-describedby="green-border-layout-help" /><small id="green-border-layout-help">The first 72 positions are row borders; the final 72 are column borders. 1 means selected.</small><div><button type="button" onClick={importLayout} disabled={building}>Import layout</button><button type="button" onClick={exportLayout} disabled={building}>Export &amp; copy layout</button></div>{layoutStatus && <p role="status">{layoutStatus}</p>}</div>
      <div className="difficulty-range"><span>Difficulty score</span><label>From <select value={minimumDifficulty} onChange={(event) => setMinimumDifficulty(Number(event.target.value))} disabled={building}>{[0, 500, 800, 1000, 1200, 1400, 1800].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>To <select value={maximumDifficulty} onChange={(event) => setMaximumDifficulty(Number(event.target.value))} disabled={building}>{[500, 1000, 2000, 3000, 1000000].map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
      <div className="sudoku-board custom-board" aria-label="Empty Sudoku grid with selectable border positions">
        {Array.from({ length: 81 }, (_, index) => <span className="cell" aria-hidden="true" key={index} />)}
        {borderPositions.map((position) => {
          const active = selected.has(position.id);
          const style = position.orientation === "across" ? { left: `calc(3px + (100% - 6px) * ${position.line} / 9)`, top: `calc(3px + (100% - 6px) * ${position.offset} / 9)` } : { left: `calc(3px + (100% - 6px) * ${position.offset} / 9)`, top: `calc(3px + (100% - 6px) * ${position.line} / 9)` };
          return <button type="button" className={`build-border ${active ? "selected" : ""}`} style={style} onClick={() => toggle(position.id)} aria-label={`Toggle border ${position.label}`} aria-pressed={active} disabled={building} key={position.id} />;
        })}
      </div>
      <div className="build-action"><button onClick={build} disabled={building || selected.size === 0}>{building ? "Searching…" : "Build now"}</button>{building && <button className="halt-button" onClick={haltBuild} disabled={haltRequested}>{haltRequested ? "Halting…" : "Halt build"}</button>}</div>
      {building && <p className="build-status" aria-live="polite">Searching for a unique {minimumDifficulty}–{maximumDifficulty} point puzzle · attempt {attempts} · {formatElapsed(elapsed)}</p>}
      {message && <p className="notice build-message" role="status">{message}</p>}
    </section>
    {result && <section className="custom-result"><h2>Final puzzle</h2><div className="build-result-summary"><span><b>{result.analysis.rating}</b><small>difficulty rating</small></span><span><b>{result.attempts}</b><small>attempt{result.attempts === 1 ? "" : "s"}</small></span><span><b>{formatElapsed(result.elapsed)}</b><small>elapsed time</small></span></div><div className="sudoku-board" aria-label="Custom built Either Or Sudoku puzzle with border clues only">{Array.from({ length: 81 }, (_, index) => <span className="cell" key={index} />)}{result.edges.map((edge, index) => <BorderClue edge={edge} key={index} />)}</div><div className="copy-action"><button onClick={copyBorderPuzzle}>Copy border-only puzzle</button>{copyStatus && <span role="status">{copyStatus}</span>}</div><h2>Completed grid</h2><div className="sudoku-board" aria-label="Completed custom built Sudoku grid">{result.solution.map((digit, index) => <span className="cell" key={index}>{digit}</span>)}{result.edges.map((edge, index) => <BorderClue edge={edge} key={index} />)}</div><SolveWalkthrough analysis={result.analysis} edges={result.edges} /></section>}
  </main>;
}
