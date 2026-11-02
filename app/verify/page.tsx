"use client";

export const dynamic = "force-static";

import { CopyCompleted } from "@/app/copy-completed";
import { useEffect, useRef, useState } from "react";
import { decodeCompactPuzzle } from "@/lib/compact";
import { copyGridImage } from "@/lib/grid-image";
import { BorderInput } from "@/app/border-input";

function Grid({ values, other }: { values: number[]; other?: number[] }) {
  return <div className="sudoku-board verify-grid">{values.map((value, index) => <span className={`cell ${other?.[index] !== undefined && other[index] !== value ? "verification-different" : ""}`} key={index}>{value}</span>)}</div>;
}
export default function VerifyPage() {
  const workerRef = useRef<Worker | null>(null);
  const [running, setRunning] = useState(false);
  useEffect(() => () => workerRef.current?.terminate(), []);
  const cancel = () => { workerRef.current?.terminate(); workerRef.current = null; setRunning(false); setResult(null); setError("Verification cancelled — no conclusion was reached."); };
  const [text, setText] = useState(""); const [result, setResult] = useState<number[][] | null>(null); const [edges, setEdges] = useState<ReturnType<typeof decodeCompactPuzzle>>(null); const [error, setError] = useState<string | null>(null); const [elapsed, setElapsed] = useState<number | null>(null);
  const verify = () => {
    const nextEdges = decodeCompactPuzzle(text);
    if (!nextEdges) { setError("Enter exactly 144 digits (0–9)."); setResult(null); return; }
    workerRef.current?.terminate(); setResult(null); setElapsed(null); setEdges(nextEdges); setError(null); setRunning(true);
    try {
      const worker = new Worker(new URL("../../lib/verify.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = (event) => {
        if (workerRef.current !== worker) return;
        worker.terminate(); workerRef.current = null; setRunning(false);
        if (event.data.error) { setError(event.data.error); return; }
        setElapsed(event.data.elapsed); setResult(event.data.solutions);
      };
      worker.onerror = () => { if (workerRef.current !== worker) return; worker.terminate(); workerRef.current = null; setRunning(false); setError("Verification failed — no conclusion was reached."); };
      worker.postMessage(nextEdges);
    } catch { setRunning(false); setError("Unable to start verification — no conclusion was reached."); }
  };
  const changeText = (value: string) => { workerRef.current?.terminate(); workerRef.current = null; setRunning(false); setText(value); setResult(null); setEdges(null); setError(null); setElapsed(null); };
  const verificationControls = <div className="build-action" aria-live="polite">{running && <><span>Verifying…</span><button onClick={cancel}>Cancel</button></>}</div>;
  return <main className="tool-page"><header><h1><a href="/">Either Or Sudoku</a></h1><details className="generator-menu"><summary>Menu</summary><div><a href="/">Generate</a><a href="/custom-build">Custom Build</a><a href="/verify">Verify</a><a href="/import">Import</a><a href="/simulation">Simulation</a><a href="/techniques">Technique library</a></div></details></header><section className="tool-section"><h2 className="grid-heading">Verify</h2><p>Enter a puzzle using a border string or the grid.</p><BorderInput text={text} onChange={changeText} /><div className="build-action"><button onClick={async () => changeText((await navigator.clipboard.readText()).replace(/\s/g, ""))}>Paste clipboard</button><button onClick={() => changeText("")}>Clear</button><button onClick={verify} disabled={running}>Verify puzzle</button>{verificationControls}</div>{edges && <p className="build-status">{edges.length} border cells given · verified in {elapsed !== null && `${elapsed.toFixed(1)} ms`}</p>}{error && <p className="notice">{error}</p>}{result && (result.length === 1 ? <><p className="success-message">This puzzle has a unique solution.</p><CopyCompleted values={result[0]} /><Grid values={result[0]} /><button onClick={() => copyGridImage(result[0], edges ?? [])}>Copy grid image</button></> : result.length === 2 ? <><p className="notice">This puzzle is not unique. Differing cells are orange.</p><h3>Solution 1</h3><CopyCompleted values={result[0]} /><Grid values={result[0]} other={result[1]} /><button onClick={() => copyGridImage(result[0], edges ?? [])}>Copy solution 1 image</button><h3>Solution 2</h3><CopyCompleted values={result[1]} /><Grid values={result[1]} other={result[0]} /><button onClick={() => copyGridImage(result[1], edges ?? [])}>Copy solution 2 image</button></> : <p className="notice">This puzzle has no valid solution.</p>)}</section></main>;
}
