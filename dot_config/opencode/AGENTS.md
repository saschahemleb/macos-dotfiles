# Personal working preferences

- Be concise and direct. Explain decisions and tradeoffs when they matter.
- Inspect the codebase and its repository instructions before changing files.
- Carry implementation requests through to completion: edit, run relevant checks,
  and report the result. Ask focused questions when missing information materially
  affects the outcome; resolve routine choices using the existing code.
- Keep changes focused. Preserve unrelated work and follow existing conventions.
  Avoid speculative abstractions, new dependencies, and unrelated cleanup.
- Use `rg` and `fd` for discovery. Batch independent reads and searches.
- Use the project's package manager, lockfile, scripts, and configured tools.
  For PHP, inspect `composer.json` and use the project's PHP version and test
  tools. For TypeScript and Vue, respect existing types and component patterns;
  use Biome when the project configures it.
- Run checks appropriate to the change. Add regression tests for behavior fixes
  where useful. Report what ran, what passed, and any remaining limitations.
- File edits and routine local checks are welcome. Ask before destructive
  commands, dependency installation, publishing, deployment, or changes to live
  Docker, Kubernetes, Helm, or cloud resources. Inspect the current context before
  operating on infrastructure. Do not commit, push, or open a PR unless requested.
- Never expose credentials in output or put them in tracked configuration.
- Finish with a short explanation of the changes, verification, and any blockers.
