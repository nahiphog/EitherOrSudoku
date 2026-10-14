import type { Edge } from "./either-or";
export async function copyGridImage(values: number[], edges: Edge[]) {
  const size = 720, cell = size / 9, canvas = document.createElement("canvas"); canvas.width = canvas.height = size; const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size); ctx.strokeStyle = "#142b2e";
  for (let i = 0; i <= 9; i++) { ctx.lineWidth = i % 3 === 0 ? 4 : 1; ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size); ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell); ctx.stroke(); }
  ctx.fillStyle = "#142b2e"; ctx.font = "bold 34px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; values.forEach((value, index) => { if (value) ctx.fillText(String(value), (index % 9 + .5) * cell, (Math.floor(index / 9) + .5) * cell); });
  edges.forEach((edge) => { const ra = Math.floor(edge.a / 9), ca = edge.a % 9, rb = Math.floor(edge.b / 9), cb = edge.b % 9; const x = (ra === rb ? Math.max(ca, cb) : ca + .5) * cell, y = (ca === cb ? Math.max(ra, rb) : ra + .5) * cell; ctx.fillStyle = "#e85f4b"; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "bold 14px Arial"; ctx.fillText(String(edge.digit), x, y); });
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), "image/png")); await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
