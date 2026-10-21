"use client";

export const dynamic = "force-static";

import { useState } from "react";
import { decodeCompactPuzzle } from "@/lib/compact";
import { analyzePuzzle, type PuzzleAnalysis } from "@/lib/solve-analysis";
import type { Edge } from "@/lib/either-or";
import { bit } from "@/lib/sudokui/board";
import { BorderInput } from "@/app/border-input";

function BorderClue({ edge }: { edge: Edge }) {
  const rowA = Math.floor(edge.a / 9), columnA = edge.a % 9;
  const rowB = Math.floor(edge.b / 9), columnB = edge.b % 9;
  const style = rowA === rowB
    ? { left: `calc(3px + (100% - 6px) * ${Math.max(columnA, columnB)} / 9)`, top: `calc(3px + (100% - 6px) * ${rowA + .5} / 9)` }
    : { left: `calc(3px + (100% - 6px) * ${columnA + .5} / 9)`, top: `calc(3px + (100% - 6px) * ${Math.max(rowA, rowB)} / 9)` };
  return <span className="border-clue" style={style}>{edge.digit}</span>;
}

function ImportWalkthrough({ analysis, edges }: { analysis: PuzzleAnalysis; edges: Edge[] }) {
  const [stepIndex, setStepIndex] = useState(0);
  const maxStep = analysis.steps.length;
  const visibleStep = Math.min(stepIndex, maxStep);
  const previousValues = visibleStep <= 1 ? analysis.initial.values : analysis.steps[visibleStep - 2].values;
  const walkthrough = visibleStep === 0
    ? { tech: "Initial candidate map", label: "Step 0", description: "Border-clue eliminations are applied before any classical technique.", values: analysis.initial.values, candidates: analysis.initial.candidates, removed: [] }
    : analysis.steps[visibleStep - 1];
  return <section className="walkthrough import-walkthrough">
    <h2>Solve walkthrough</h2>
    <div className="analysis-summary"><span><b>{analysis.solvedByLogic ? "Solved logically" : "Logic paused"}</b><small>{analysis.rating}</small></span><span><b>{analysis.steps.length}</b><small>technique steps</small></span></div>
    {walkthrough ? <><div className="step-card"><div><span className="tech-label">{walkthrough.label}</span><h3>{walkthrough.tech}</h3><p>{walkthrough.description}</p></div><span>{visibleStep} / {maxStep}</span></div>
      <input className="step-slider" type="range" min="0" max={maxStep} value={visibleStep} onChange={(event) => setStepIndex(Number(event.target.value))} aria-label="Imported puzzle walkthrough step" />
      <div className="step-controls" aria-label="Imported puzzle walkthrough controls"><button onClick={() => setStepIndex(0)} disabled={visibleStep === 0} aria-label="Go to step 0">&lt;&lt;</button><button onClick={() => setStepIndex((index) => Math.max(0, Math.min(maxStep, index) - 1))} disabled={visibleStep === 0} aria-label="Go to previous step">&lt;</button><button onClick={() => setStepIndex((index) => Math.min(maxStep, index + 1))} disabled={visibleStep === maxStep} aria-label="Go to next step">&gt;</button><button onClick={() => setStepIndex(maxStep)} disabled={visibleStep === maxStep} aria-label="Go to final step">&gt;&gt;</button></div>
      <div className="sudoku-board walkthrough-board" aria-label="Imported puzzle walkthrough">{walkthrough.values.map((digit, index) => digit ? <span className={`cell ${previousValues[index] === 0 ? "walkthrough-value" : ""}`} key={index}>{digit}</span> : <span className="cell snyder walkthrough-snyder" key={index}>{Array.from({ length: 9 }, (_, candidate) => { const value = candidate + 1; const removedNow = walkthrough.removed.some((removal) => removal.cell === index && removal.digit === value); const remains = Boolean(walkthrough.candidates[index] & bit(value)); return <i className={removedNow ? "removed-now" : remains ? "" : "already-removed"} key={value}>{value}</i>; })}</span>)}{edges.map((edge, index) => <BorderClue edge={edge} key={index} />)}</div>
    </> : <p className="notice">No imported classical technique applies after the border constraints.</p>}
    <div className="tally"><h3>Technique tally</h3>{Object.keys(analysis.tally).length ? <ul><li className="tally-header"><span>Technique</span><b>Steps</b></li>{Object.keys(analysis.tally).map((technique) => <li key={technique}><span>{technique}</span><b>{analysis.steps.flatMap((step, index) => step.tech === technique ? [index + 1] : []).join(", ")}</b></li>)}</ul> : <p>None yet.</p>}</div>
  </section>;
}

export default function ImportPage() {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<PuzzleAnalysis | null>(null);
  const [edges, setEdges] = useState<Edge[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const importPuzzle = () => {
    const nextEdges = decodeCompactPuzzle(text);
    if (!nextEdges) { setError("Enter exactly 144 digits (0–9)."); setAnalysis(null); setEdges(null); setElapsed(null); return; }
    const started = performance.now();
    const next = analyzePuzzle(nextEdges);
    setElapsed(performance.now() - started);
    setEdges(nextEdges);
    if (next.solutionCount !== 1) { setError(next.solutionCount === 0 ? "This puzzle has no valid solution." : "This puzzle does not have a unique solution."); setAnalysis(null); return; }
    setError(null);
    setAnalysis(next);
  };
  const clear = () => { setText(""); setAnalysis(null); setEdges(null); setError(null); setElapsed(null); };
  const changeText = (value: string) => { setText(value); setAnalysis(null); setEdges(null); setError(null); setElapsed(null); };
  return <main className="tool-page">
    <header><h1><a href="/">Either Or Sudoku</a></h1><details className="generator-menu"><summary>Menu</summary><div><a href="/">Generate</a><a href="/custom-build">Custom Build</a><a href="/verify">Verify</a><a href="/import">Import</a><a href="/simulation">Simulation</a><a href="/techniques">Technique library</a></div></details></header>
    <section className="tool-section"><h2 className="grid-heading">Import</h2><p>Enter a puzzle using a border string or the grid to verify and analyze it.</p><BorderInput text={text} onChange={changeText} /><div className="build-action"><button onClick={async () => changeText((await navigator.clipboard.readText()).replace(/\s/g, ""))}>Paste clipboard</button><button onClick={clear}>Clear</button><button onClick={importPuzzle}>Import puzzle</button></div>{edges && <p className="build-status">{edges.length} border cells given · analyzed in {elapsed !== null && `${elapsed.toFixed(1)} ms`}</p>}{error && <p className="notice">{error}</p>}{analysis && edges && <ImportWalkthrough key={text} analysis={analysis} edges={edges} />}</section>
  </main>;
}
