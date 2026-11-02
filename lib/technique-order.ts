import { LEVELS, TECHS } from "./sudokui/ratings";

export function sortedTechniques(tally: Record<string, number>) {
  const catalog = Object.values(TECHS);
  return Object.keys(tally).sort((a, b) => {
    const first = catalog.find((tech) => tech.name === a);
    const second = catalog.find((tech) => tech.name === b);
    if (!first || !second) return a.localeCompare(b);
    return LEVELS.indexOf(first.level) - LEVELS.indexOf(second.level) || first.score - second.score || first.index - second.index;
  });
}
