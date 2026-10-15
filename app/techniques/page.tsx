import { ALL_TECHS, isTemporarilyDisabled, TECHS, type Tech } from "@/lib/sudokui/ratings";

export default function TechniqueLibrary() {
  return <main className="technique-library">
    <header><h1><a href="/">Either Or Sudoku</a></h1><details className="generator-menu"><summary>Menu</summary><div><a href="/">Generate</a><a href="/custom-build">Custom Build</a><a href="/verify">Verify</a><a href="/import">Import</a><a href="/simulation">Simulation</a><a href="/techniques">Technique library</a></div></details></header>
    <section>
      <p className="library-kicker">Imported solving repertoire</p>
      <h2>Technique library</h2>
      <p className="library-intro">Ratings follow the imported sudokUI / HoDoKu-style catalogue. Lower scores are tried first; each technique shows its difficulty band and score. Techniques from Unique Rectangle Type 1 onward are temporarily disabled, except Brute Force.</p>
      <div className="technique-table" role="table" aria-label="Sudoku technique ratings">
        <div className="technique-row technique-head" role="row"><span role="columnheader">Technique</span><span role="columnheader">Family</span><span role="columnheader">Difficulty</span><span role="columnheader">Rating</span></div>
        {ALL_TECHS.map((key) => {
          const technique = TECHS[key as Tech];
          const disabled = isTemporarilyDisabled(key as Tech);
          return <div className={`technique-row ${technique.implemented ? "" : "unimplemented"} ${disabled ? "temporarily-disabled" : ""}`} role="row" key={key}><span role="cell">{technique.name}{!technique.implemented && " (not implemented)"}{disabled && " (temporarily disabled)"}</span><span role="cell">{technique.category}</span><span role="cell">{technique.level}</span><span role="cell">{technique.score}</span></div>;
        })}
      </div>
    </section>
  </main>;
}
