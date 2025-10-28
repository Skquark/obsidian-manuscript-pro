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

## Additional Recently Completed

- Export UX: Export Dialog shows live “Effective CSL” with ✓/✗ existence check and parses CSL title; updates instantly on text edit and profile change.
- Settings: Global Default CSL path added (Export & Publishing) and used automatically when profiles don’t specify CSL.
- Export Manager: Injects global default CSL into effective profile.
- Export Engine: Avoids brittle `-t pdf`; relies on output extension and `--pdf-engine` for PDF.
- Concealment: Delimiter-only hiding for patterns like `@{…}` so inner content remains visible; graceful fallback when RegExp indices are unavailable.
- Citations: Hover popup adds “📚 Copy BibTeX” (uses `toBibTeX`) and DOI/URL opener fallback.
- Cross‑references: “Rename Label and Update Refs” updates `\label{…}` and all `\ref`/`\eqref`/`\cref`/`\autoref` usages across the vault.
- Focus Mode: Status bar indicator + toggle; hotkey (Mod+Shift+Z); typewriter/centered layout; opacity controls; updates indicator on enable/disable.
- Stats Panel: Auto‑refresh now respects settings cadence and enablement.
- Quality gating: Renamed phase4→quality across initialization and commands; commands now respect `settings.quality.*`.

## Additional P0 Checks

- [ ] Verify Reading Mode conceal post‑processor for interleaved matches and no truncation (indices and fallback).
- [ ] Validate cross‑ref rename against substring keys (e.g., `fig1` vs `fig10`).
- [ ] Exercise export across PDF/DOCX/HTML/EPUB; confirm global CSL and override precedence.
- [ ] Confirm Focus Mode commands and status indicator remain in sync after toggle/cycle.
