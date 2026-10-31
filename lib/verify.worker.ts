import { solveExact } from "./exact-solver";
import type { Edge } from "./either-or";

self.onmessage = (event: MessageEvent<Edge[]>) => {
  try {
    const started = performance.now();
    const solutions = solveExact(event.data, 2);
    self.postMessage({ solutions, elapsed: performance.now() - started });
  } catch {
    self.postMessage({ error: "Verification failed. Please try again." });
  }
};
