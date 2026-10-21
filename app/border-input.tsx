"use client";

import { useEffect, useState } from "react";

/** The first 72 characters are row borders; the next 72 are column borders. */
export function BorderInput({ text, onChange }: { text: string; onChange: (value: string) => void }) {
  const [mode, setMode] = useState<"string" | "grid">("string");
  const digits = text || "0".repeat(144);
  const valid = /^\d{144}$/.test(digits);
  useEffect(() => { if (mode === "grid" && !text) onChange("0".repeat(144)); }, [mode, text, onChange]);
  const selectGrid = () => {
    if (!text) onChange("0".repeat(144));
    setMode("grid");
  };
  const update = (index: number, value: string) => {
    if (!valid) return;
    const digit = value.replace(/[^0-9]/g, "").slice(-1) || "0";
    onChange(digits.slice(0, index) + digit + digits.slice(index + 1));
  };
  return <div className="border-input">
    <fieldset className="input-mode"><legend>Input method</legend>
      <label><input type="radio" checked={mode === "string"} onChange={() => setMode("string")} /> 144-character string</label>
      <label><input type="radio" checked={mode === "grid"} onChange={selectGrid} /> Enter clues on grid</label>
    </fieldset>
    {mode === "string" ? <textarea value={text} onChange={(event) => onChange(event.target.value.replace(/\s/g, ""))} maxLength={144} aria-label="144-character puzzle string" /> : valid ? <>
      <p>Tap a border and enter a digit from 1 to 9. Clear it or enter 0 to remove the clue.</p>
      <div className="sudoku-board border-editor" aria-label="Editable border clue grid">
        {Array.from({ length: 81 }, (_, index) => <span className="cell" key={index} />)}
        {Array.from({ length: 144 }, (_, index) => {
          const horizontal = index < 72;
          const row = horizontal ? Math.floor(index / 8) : (index - 72) % 8;
          const column = horizontal ? index % 8 : Math.floor((index - 72) / 8);
          const left = horizontal ? column + 1 : column + .5;
          const top = horizontal ? row + .5 : row + 1;
          const second = horizontal ? `R${row + 1}C${column + 2}` : `R${row + 2}C${column + 1}`;
          return <input key={index} className={`border-entry ${digits[index] !== "0" ? "has-clue" : ""}`} style={{ left: `calc(3px + (100% - 6px) * ${left} / 9)`, top: `calc(3px + (100% - 6px) * ${top} / 9)` }} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1} value={digits[index] === "0" ? "" : digits[index]} onFocus={(event) => event.currentTarget.select()} onChange={(event) => update(index, event.target.value)} aria-label={`Border between R${row + 1}C${column + 1} and ${second}`} />;
        })}
      </div>
      <p className="build-status">{[...digits].filter((digit) => digit !== "0").length} border cells given</p>
    </> : <p className="notice">Enter a complete 144-digit string, or clear the input to start with an empty grid.</p>}
  </div>;
}
