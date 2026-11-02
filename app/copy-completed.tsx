"use client";
import { useState } from "react";

export function CopyCompleted({ values }: { values: number[] }) {
  const [status, setStatus] = useState("");
  if (values.length !== 81 || values.some((value) => !Number.isInteger(value) || value < 1 || value > 9)) return null;
  return <div className="copy-action"><button onClick={async () => {
    try { await navigator.clipboard.writeText(values.join("")); setStatus("81-character completed grid copied."); }
    catch { setStatus("Unable to access the clipboard. Please try again."); }
  }}>Copy completed grid as 81-character string</button><span role="status">{status}</span></div>;
}
