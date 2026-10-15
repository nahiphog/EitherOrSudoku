"use client";

import { useRef, useState } from "react";
import { makePuzzle, snyderCandidates, type Edge } from "@/lib/either-or";
import { analyzePuzzle, digPuzzle, type PuzzleAnalysis } from "@/lib/solve-analysis";
import { bit } from "@/lib/sudokui/board";
import { encodeCompactPuzzle } from "@/lib/compact";

function formatElapsed(milliseconds: number) {
  return milliseconds >= 1000 ? `${(milliseconds / 1000).toFixed(2)} s` : `${milliseconds.toFixed(1)} ms`;
}

function BorderClue({ edge }: { edge: Edge }) {
  const rowA = Math.floor(edge.a / 9), columnA = edge.a % 9;
  const rowB = Math.floor(edge.b / 9), columnB = edge.b % 9;
  const across = rowA === rowB;
  // Anchor to a numbered grid line, not a rounded percentage. A clue can
  // therefore only sit on the shared border of two adjacent cells.
  const style = across
    ? { left: `calc(3px + (100% - 6px) * ${Math.max(columnA, columnB)} / 9)`, top: `calc(3px + (100% - 6px) * ${rowA + .5} / 9)` }
    : { left: `calc(3px + (100% - 6px) * ${columnA + .5} / 9)`, top: `calc(3px + (100% - 6px) * ${Math.max(rowA, rowB)} / 9)` };
  return <span className={`border-clue ${across ? "between-columns" : "between-rows"}`} style={style}>{edge.digit}</span>;
}

function SolveWalkthrough({ analysis, edges, label }: { analysis: PuzzleAnalysis | null; edges: Edge[]; label: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  const maxStep = analysis?.steps.length ?? 0;
  const visibleStep = Math.min(stepIndex, maxStep);
  const previousValues = visibleStep === 0 ? analysis?.initial.values : visibleStep === 1 ? analysis?.initial.values : analysis?.steps[visibleStep - 2].values;
  const walkthrough = analysis && (visibleStep === 0
    ? { tech: "Initial candidate map", label: "Step 0", description: "Border-clue eliminations are applied before any classical technique.", values: analysis.initial.values, candidates: analysis.initial.candidates, removed: [] }
    : analysis.steps[visibleStep - 1]);
  return <section className="walkthrough">
    <h3>{label} solve walkthrough</h3>
    {analysis?.solutionCount !== 1 ? <p className="notice">{analysis?.solutionCount === 0 ? "This border-clue layout has no valid solution." : "This border-clue layout does not have a unique solution, so no definitive solving walkthrough is shown."}</p> : <>
      <div className="analysis-summary"><span><b>{analysis.solvedByLogic ? "Solved logically" : "Logic paused"}</b><small>{analysis.rating}</small></span><span><b>{analysis.steps.length}</b><small>technique steps</small></span></div>
      {walkthrough ? <>
        <div className="step-card"><div><span className="tech-label">{walkthrough.label}</span><h3>{walkthrough.tech}</h3><p>{walkthrough.description}</p></div><span>{visibleStep} / {maxStep}</span></div>
        <input className="step-slider" type="range" min="0" max={maxStep} value={visibleStep} onChange={(event) => setStepIndex(Number(event.target.value))} aria-label={`${label} walkthrough step`} />
        <div className="step-controls" aria-label={`${label} walkthrough controls`}><button onClick={() => setStepIndex(0)} disabled={visibleStep === 0} aria-label="Go to step 0">&lt;&lt;</button><button onClick={() => setStepIndex((index) => Math.max(0, Math.min(maxStep, index) - 1))} disabled={visibleStep === 0} aria-label="Go to previous step">&lt;</button><button onClick={() => setStepIndex((index) => Math.min(maxStep, index + 1))} disabled={visibleStep === maxStep} aria-label="Go to next step">&gt;</button><button onClick={() => setStepIndex(maxStep)} disabled={visibleStep === maxStep} aria-label="Go to final step">&gt;&gt;</button></div>
        <div className="sudoku-board walkthrough-board" aria-label={`Snyder notations after selected ${label} solving step`}>
          {walkthrough.values.map((digit, index) => digit ? <span className={`cell ${previousValues?.[index] === 0 ? "walkthrough-value" : ""}`} key={index}>{digit}</span> : <span className="cell snyder walkthrough-snyder" key={index}>{Array.from({ length: 9 }, (_, candidate) => {
            const candidateDigit = candidate + 1;
            const eliminatedNow = walkthrough.removed.some((removal) => removal.cell === index && removal.digit === candidateDigit);
            const remains = Boolean(walkthrough.candidates[index] & bit(candidateDigit));
            return <i className={eliminatedNow ? "removed-now" : remains ? "" : "already-removed"} key={candidate}>{candidateDigit}</i>;
          })}</span>)}
          {edges.map((edge, index) => <BorderClue edge={edge} key={index} />)}
        </div>
      </> : <p className="notice">No imported classical technique applies after the border constraints. The puzzle is unique, but needs a variant-specific deduction beyond this walkthrough.</p>}
      <div className="tally"><h3>Technique tally</h3>{Object.entries(analysis.tally).length ? <ul><li className="tally-header"><span>Technique</span><b>Steps</b></li>{Object.keys(analysis.tally).map((technique) => <li key={technique}><span>{technique}</span><b>{analysis.steps.flatMap((step, index) => step.tech === technique ? [index + 1] : []).join(", ")}</b></li>)}</ul> : <p>None yet.</p>}</div>
    </>}
  </section>;
}

export default function Home() {
  const [puzzle, setPuzzle] = useState<ReturnType<typeof makePuzzle> | null>(null);
  const [analysis, setAnalysis] = useState<PuzzleAnalysis | null>(null);
  const [dugAnalysis, setDugAnalysis] = useState<PuzzleAnalysis | null>(null);
  const [dug, setDug] = useState<{ edges: Edge[]; removed: number; target: number; targetReached: boolean; targetRemaining: number; dugToLimit: boolean } | null>(null);
  const [generationTimes, setGenerationTimes] = useState<{ completed: number; removed: number; dug?: number } | null>(null);
  const [digProgress, setDigProgress] = useState<number | null>(null);
  const [remainingClueTarget, setRemainingClueTarget] = useState(45);
  const [digUntilStuck, setDigUntilStuck] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [haltRequested, setHaltRequested] = useState(false);
  const [generationAttempts, setGenerationAttempts] = useState(0);
  const [liveBorderCount, setLiveBorderCount] = useState(144);
  const [generationElapsed, setGenerationElapsed] = useState(0);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const haltRef = useRef(false);
  const generate = async () => {
    const targetRemaining = remainingClueTarget;
    const removeUntilStuck = digUntilStuck;
    let attempts = 0;
    const started = performance.now();
    haltRef.current = false;
    setGenerating(true);
    setHaltRequested(false);
    setGenerationAttempts(0);
    setLiveBorderCount(144);
    setGenerationElapsed(0);
    setDigProgress(null);
    setPuzzle(null);
    setDug(null);
    setAnalysis(null);
    setDugAnalysis(null);
    const timer = window.setInterval(() => setGenerationElapsed(performance.now() - started), 100);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    while (!haltRef.current) {
      attempts++;
      setGenerationAttempts(attempts);
      const completedStarted = performance.now();
      const next = makePuzzle();
      const completed = performance.now() - completedStarted;
      const removedStarted = performance.now();
      snyderCandidates(next.edges);
      const removed = performance.now() - removedStarted;
      const nextAnalysis = analyzePuzzle(next.edges);
      if (nextAnalysis.solutionCount === 1 && !haltRef.current) {
        const dugStarted = performance.now();
        setDigProgress(0);
        const dugPuzzleResult = await digPuzzle(next.edges, removeUntilStuck ? next.edges.length : next.edges.length - targetRemaining, (tested, total, remaining) => { setDigProgress(Math.round(tested / total * 100)); setLiveBorderCount(remaining); }, () => haltRef.current);
        if (!dugPuzzleResult.halted && (removeUntilStuck || dugPuzzleResult.targetReached)) {
          snyderCandidates(dugPuzzleResult.edges);
          const dugElapsed = performance.now() - dugStarted;
          setPuzzle(next);
          setAnalysis(nextAnalysis);
          setDug({ ...dugPuzzleResult, targetRemaining: removeUntilStuck ? dugPuzzleResult.edges.length : next.edges.length - dugPuzzleResult.target, dugToLimit: removeUntilStuck });
          setDugAnalysis(analyzePuzzle(dugPuzzleResult.edges));
          setGenerationTimes({ completed, removed, dug: dugElapsed });
          setDigProgress(null);
          setGenerationElapsed(performance.now() - started);
          window.clearInterval(timer);
          setGenerating(false);
          return;
        }
      }
      setDigProgress(null);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
    setDigProgress(null);
    setGenerationElapsed(performance.now() - started);
    window.clearInterval(timer);
    setGenerating(false);
    setHaltRequested(false);
  };
  const haltGeneration = () => { haltRef.current = true; setHaltRequested(true); };
  const copyDug = async () => { if (!dug) return; await navigator.clipboard.writeText(encodeCompactPuzzle(dug.edges)); setCopyStatus("144-character string copied."); };
  return <main>
    <header><h1>Either Or Sudoku</h1><div className="header-actions"><a href="/techniques">Technique library</a><details className="generator-menu"><summary>Menu</summary><div><a href="/">Generate</a><a href="/custom-build">Custom Build</a><a href="/verify">Verify</a><a href="/import">Import</a><a href="/simulation">Simulation</a></div></details>{generating && <button className="halt-button" onClick={haltGeneration} disabled={haltRequested}>{haltRequested ? "Halting…" : "Halt generate"}</button>}</div></header>
    <div className="generate-controls"><label className="dig-target">Stop generating when I have<input type="number" min="0" max="144" step="1" value={remainingClueTarget} onChange={(event) => setRemainingClueTarget(Math.max(0, Math.min(144, Number(event.target.value) || 0)))} disabled={generating || digUntilStuck} />border clues.</label><label className="dig-until-stuck"><input type="checkbox" checked={digUntilStuck} onChange={(event) => setDigUntilStuck(event.target.checked)} disabled={generating} />Dig until no clue can be removed</label><button onClick={generate} disabled={generating}>{generating ? "Generating…" : "Generate"}</button></div>
    {generationAttempts > 0 && <p className="generator-status" aria-live="polite">{generating ? `Attempt ${generationAttempts}${digProgress !== null ? ` · ${liveBorderCount} border clues left` : ""} · ${formatElapsed(generationElapsed)}` : puzzle ? `Dug puzzle generated on attempt ${generationAttempts} in ${formatElapsed(generationElapsed)}` : `Generation halted after ${generationAttempts} attempt${generationAttempts === 1 ? "" : "s"} in ${formatElapsed(generationElapsed)}`}</p>}
    {puzzle && <div className="puzzle-sections">
      <details className="puzzle-section"><summary><span>Completed grid</span><small>{generationTimes && `Generated in ${formatElapsed(generationTimes.completed)}`}</small></summary><div className="puzzle-content"><div className="sudoku-board" aria-label="Generated completed Either Or Sudoku grid">{puzzle.solution.map((digit, index) => <span className="cell" key={index}>{digit}</span>)}{puzzle.edges.map((edge, index) => <BorderClue edge={edge} key={index} />)}</div></div></details>
      <details className="puzzle-section"><summary><span>All cells removed</span><small>{generationTimes && `Generated in ${formatElapsed(generationTimes.removed)}`}</small></summary><div className="puzzle-content"><div className="sudoku-board" aria-label="Either Or Sudoku grid with every cell removed">{Array.from({ length: 81 }, (_, index) => <span className="cell" key={index} />)}{puzzle.edges.map((edge, index) => <BorderClue edge={edge} key={index} />)}</div><SolveWalkthrough analysis={analysis} edges={puzzle.edges} label="All cells removed" /></div></details>
      {dug && <details className="puzzle-section" open><summary><span>Dug puzzle <small>{dugAnalysis?.rating}</small></span><small>{generationTimes?.dug !== undefined && `Generated in ${formatElapsed(generationTimes.dug)}`}</small></summary><div className="puzzle-content"><p className="dig-summary">{dug.dugToLimit ? `${dug.edges.length} border clues remain · no further clue can be removed · unique solution retained` : `${dug.edges.length} of ${dug.targetRemaining} requested border clues remain · ${dug.removed} removed · unique solution retained`}</p><div className="sudoku-board" aria-label="Dug Either Or Sudoku grid">{Array.from({ length: 81 }, (_, index) => <span className="cell" key={index} />)}{dug.edges.map((edge, index) => <BorderClue edge={edge} key={index} />)}</div><div className="copy-action"><button onClick={copyDug}>Copy 144-character string to clipboard</button>{copyStatus && <span>{copyStatus}</span>}</div><SolveWalkthrough analysis={dugAnalysis} edges={dug.edges} label="Dug puzzle" /></div></details>}
    </div>}
  </main>;
}
