"use client";

export const dynamic = "force-static";

import { useState } from "react";
import { decodeCompactPuzzle } from "@/lib/compact";
import { findSolutions } from "@/lib/solve-analysis";
import { copyGridImage } from "@/lib/grid-image";

function Grid({ values, other }: { values: number[]; other?: number[] }) {
  return <div className="sudoku-board verify-grid">{values.map((value, index) => <span className={`cell ${other?.[index] !== undefined && other[index] !== value ? "verification-different" : ""}`} key={index}>{value}</span>)}</div>;
}
export default function VerifyPage() {
  const [text, setText] = useState(""); const [result, setResult] = useState<number[][] | null>(null); const [edges, setEdges] = useState<ReturnType<typeof decodeCompactPuzzle>>(null); const [error, setError] = useState<string | null>(null); const [elapsed, setElapsed] = useState<number | null>(null);
  const verify = () => { const nextEdges = decodeCompactPuzzle(text); if (!nextEdges) { setError("Enter exactly 144 digits (0–9)."); setResult(null); return; } const started = performance.now(); const solutions = findSolutions(nextEdges, 2); setElapsed(performance.now() - started); setEdges(nextEdges); setError(null); setResult(solutions); };
  return <main className="tool-page"><header><h1><a href="/">Either Or Sudoku</a></h1><details className="generator-menu"><summary>Menu</summary><div><a href="/">Generate</a><a href="/custom-build">Custom Build</a><a href="/verify">Verify</a><a href="/import">Import</a><a href="/simulation">Simulation</a><a href="/techniques">Technique library</a></div></details></header><section className="tool-section"><h2 className="grid-heading">Verify</h2><p>Paste a 144-character border string.</p><textarea value={text} onChange={(event) => setText(event.target.value.replace(/\s/g, ""))} maxLength={144} aria-label="144-character puzzle string" /><div className="build-action"><button onClick={async () => setText((await navigator.clipboard.readText()).replace(/\s/g, ""))}>Paste clipboard</button><button onClick={() => { setText(""); setResult(null); setEdges(null); setError(null); setElapsed(null); }}>Clear</button><button onClick={verify}>Verify puzzle</button></div>{edges && <p className="build-status">{edges.length} border cells given · verified in {elapsed !== null && `${elapsed.toFixed(1)} ms`}</p>}{error && <p className="notice">{error}</p>}{result && (result.length === 1 ? <><p className="success-message">This puzzle has a unique solution.</p><Grid values={result[0]} /><button onClick={() => copyGridImage(result[0], edges ?? [])}>Copy grid image</button></> : result.length === 2 ? <><p className="notice">This puzzle is not unique. Differing cells are orange.</p><h3>Solution 1</h3><Grid values={result[0]} other={result[1]} /><button onClick={() => copyGridImage(result[0], edges ?? [])}>Copy solution 1 image</button><h3>Solution 2</h3><Grid values={result[1]} other={result[0]} /><button onClick={() => copyGridImage(result[1], edges ?? [])}>Copy solution 2 image</button></> : <p className="notice">This puzzle has no valid solution.</p>)}</section></main>;
}
