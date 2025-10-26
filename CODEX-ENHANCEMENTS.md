# Manuscript Pro — Enhancements & Release Readiness

This live TODO tracks polish, fixes, and release tasks for Manuscript Pro. For detailed Phase 2 authoring work (LaTeX/Pandoc), see CODEX-ENHANCEMENTS-2.md.

## Recently Completed

- Authoring UX: Command Builder + `\` completions; edit‑in‑place for LaTeX commands/environments; Pandoc attributes editor.
- Table Wizard: CSV/TSV paste; alignment guessing; booktabs/`\hline`; vertical bars; include `\centering`; live preview + copy.
- Frontmatter Editor: structured fields (title/authors/date/abstract/keywords/bibliography/CSL/header‑includes); typed Variables UI (add/remove/rename; string/number/boolean); header‑includes literal blocks; CSL status; `.bib` Browse.
- Figure Block inserts: one‑shot helper; Insert from File command with auto label from filename; helpers `\underline`, `\overline`, `\mathbb`, `\input`, `\include`.

## P0 — Stability & Release Prep

- [ ] Manifest/version alignment (manifest.json, versions.json; version-bump.mjs).
- [ ] Export paths and Pandoc detection across platforms (Windows/macOS/Linux).
- [ ] Docs final pass (Quick Start, Troubleshooting, Security notes).
- [ ] Test vault scenario across features (Concealment, Citations, Cross‑ref, Export, Focus Mode).

## P1 — UX Polish

- [ ] Command palette discoverability and help overlays for new tools.
- [ ] Settings organization for Authoring Tools and Export profiles.
- [ ] Minor style tokens pass (dark/light consistency).

## References

- Phase 2 authoring plan: CODEX-ENHANCEMENTS-2.md
- README, CLAUDE.md, CHANGELOG.md
