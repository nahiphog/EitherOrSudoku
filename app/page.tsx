"use client";

import { useMemo, useState } from "react";
import { makePuzzle, solveEitherOr, type Edge } from "@/lib/either-or";
import { techniqueFamilies } from "@/lib/technique-catalog";
import { classicTechniqueModules } from "@/lib/sudokui-index";

function BorderClue({ edge }: { edge: Edge }) {
  const ar = Math.floor(edge.a / 9), ac = edge.a % 9, br = Math.floor(edge.b / 9), bc = edge.b % 9;
  const across = ar === br;
  const style = across ? { left: `${((ac + bc + 1) / 2) * 11.111}%`, top: `${(ar + .5) * 11.111}%` } : { left: `${(ac + .5) * 11.111}%`, top: `${((ar + br + 1) / 2) * 11.111}%` };
  return <span className="border-clue" style={style}>{edge.digit}</span>;
}

export default function Home() {
  const [puzzle, setPuzzle] = useState(() => makePuzzle());
  const [values, setValues] = useState(() => [...puzzle.givens]);
  const [message, setMessage] = useState("Ready when you are.");
  const filled = values.filter(Boolean).length;
  const newPuzzle = () => { const next = makePuzzle(); setPuzzle(next); setValues([...next.givens]); setMessage("A fresh constraint map is on the board."); };
  const solve = () => { const solved = solveEitherOr(values, puzzle.edges); if (solved) { setValues(solved); setMessage("Solved — every border clue is satisfied."); } else setMessage("No solution from these entries. Check any changes and try again."); };
  const edgeCount = useMemo(() => puzzle.edges.length, [puzzle]);
  const importedFamilies = Object.keys(classicTechniqueModules).length;
  return <main>
    <nav><div className="brand"><i>∥</i><span>Either Or</span></div><div className="nav-note">Generator & solver <b>BETA</b></div></nav>
    <section className="hero"><p className="eyebrow">A sudoku with a little ambiguity</p><h1>Follow the clues<br /><em>between</em> the cells.</h1><p className="lede">Normal Sudoku rules apply. A digit placed on a shared border belongs in either of the two cells it touches.</p></section>
    <section className="workspace">
      <div className="board-panel"><div className="board-top"><div><span className="chip">EITHER / OR</span><h2>Today’s construction</h2></div><span className="count">{filled} / 81 filled</span></div>
        <div className="board-wrap"><div className="sudoku-board">{values.map((value, i) => <input key={i} aria-label={`row ${Math.floor(i / 9) + 1}, column ${i % 9 + 1}`} value={value || ""} inputMode="numeric" maxLength={1} className={puzzle.givens[i] ? "given" : ""} onChange={(e) => { const n = Number(e.target.value.replace(/[^1-9]/g, "")); if (!puzzle.givens[i]) setValues((old) => old.map((v, j) => j === i ? (n || 0) : v)); }} />)}{puzzle.edges.map((edge, i) => <BorderClue edge={edge} key={i} />)}</div></div>
        <div className="board-footer"><span className="status-dot" />{message}</div>
      </div>
      <aside className="control-panel"><p className="eyebrow">Puzzle controls</p><h2>Think sideways.</h2><p>There are <strong>{edgeCount} border clues</strong> woven into this grid. Use the shared boundary as a small, local either/or rule.</p><button className="primary" onClick={solve}>Solve puzzle <span>→</span></button><button className="secondary" onClick={newPuzzle}>Generate new</button><div className="rule"><span>How it works</span><p>A border <b>7</b> means the two neighbouring cells contain a 7 in one place or the other.</p></div></aside>
    </section>
    <section className="techniques"><div><p className="eyebrow">Solver library</p><h2>Classical logic, kept close at hand.</h2><p>The underlying GPL-3.0 TypeScript engine is derived from sudokUI and has {importedFamilies} imported technique modules covering the requested families. Classic eliminations remain sound alongside the additional either/or constraints.</p></div><div className="family-grid">{Object.entries(techniqueFamilies).map(([family, techniques]) => <article key={family}><h3>{family}</h3><p>{techniques.join(" · ")}</p></article>)}</div></section>
    <footer>Either Or Sudoku <span>•</span> Built for deliberate pencil marks <span>•</span> <a href="https://github.com/AImenes/sudokUI">Engine attribution</a></footer>
  </main>;
}
