# Manuscript Pro — Phase 2: Pro Authoring UX (LaTeX + Pandoc)

This live TODO scopes and sequences the usability upgrade that makes LaTeX/Pandoc/BibTeX authoring approachable and professional. The goal is to make complex commands and attributes easy to insert, view, and edit — without forcing users to remember syntax.

## Goals & Principles

- Professional-grade, low-friction authoring for LaTeX + Pandoc
- Non-destructive and compatible with raw editing at any time
- Assistive: UI forms everywhere, but never a lock-in format
- Cursor-aware: “edit the thing I’m on” works reliably
- Spec-driven: add commands via data, not code rewrites

## Deliverables (Phased)

1) Phase A — Command Builder + Attributes Editor
- LaTeX Command Builder modal (search → form → insert/wrap)
- Wrap selection with environment (equation/align/itemize/etc.)
- Pandoc Attributes Editor (block/inline `{#id .class key=val}`)
- Edit-in-place for the command/attributes under cursor

2) Phase B — Backslash Completion & Quick Wrappers
- CodeMirror completion for `\command` with signatures
- Quick wrap commands: `\textbf{}`, `\emph{}`, `\texttt{}`, `\label{}`, `\ref{}`

3) Phase C — Wizards & Library Expansion
- Table wizard (columns, alignment, headers, caption+label)
- Subfigures, minted/listings, theorem families, float tuning
- Expand spec library to ~50–100 common commands/envs

4) Phase D — Frontmatter (YAML) Editor
- Structured editor for common Pandoc metadata/vars
- Safety: merge/round-trip YAML; no reflow surprises

## Architecture

### Spec-Driven Commands
- New: `src/latex/command-spec.ts`
  - CommandSpec: id, kind (command|environment|wrapper), label, doc, signature, args (positional/optional), default values, advanced options (free-form key=val), insertion templates, detection regexes.
- Examples:
  - includegraphics: optional `[width=0.8\textwidth]`, positional `{path}`
  - sectioning: `\section{title}`
  - math inlines: `\frac{num}{den}`
  - wrappers: `\textbf{…}` around selection

### Parsers & Rewriters
- New: `src/latex/CommandEditEngine.ts`
  - Given cursor position, detect current invocation (regex + token-scan on current line and neighbors)
  - Parse optional arg block `[…]`, positional `{…}` pairs, and environment begin/end blocks
  - Return a data object that matches CommandSpec args; provide safe rewrite for updates
- New: `src/pandoc/AttributesHelper.ts`
  - Identify block/inline under cursor
  - Parse/serialize Pandoc attributes `{#id .class key=val}` (order-preserving where possible)
  - Safe attach/merge strategy when attributes already exist

### UI
- New: `src/latex/CommandInsertModal.ts` — search list (by name, alias, tags), right pane with dynamic form built from CommandSpec; preview of inserted text; “Insert” and “Wrap Selection” buttons when supported
- New: `src/pandoc/AttributesModal.ts` — form for id, classes, key/values with add/remove rows; live preview
- Integrations in `src/main.ts` commands:
  - Insert LaTeX Command…
  - Wrap with Environment…
  - Edit Command/Attributes at Cursor…

### Editor Extensions
- New: `src/editorExtensions/latex-command-suggest.ts`
  - Backslash completion for curated commands; show signature; tabstops in inserted snippet
- Hook into existing concealment so inserted text looks clean in Live Preview

## UX Details

### LaTeX Command Builder
- Search by name/alias/tags
- Show signature and short doc; “More” link to docs (optional)
- Form fields map to args:
  - Optional args: checkbox to include; key=val rows for advanced
  - Positional args: required inputs; validation on required fields
- Insert behavior:
  - Insert at cursor or wrap selection if supported
  - Cursor ends at best-known editing point (e.g., inside last braces)

Supported set (Phase A initial)
- Formatting: `\textbf{}`, `\emph{}`, `\texttt{}`
- Structure: `\section{}`, `\subsection{}`
- Referencing: `\label{}`, `\ref{}`, `\eqref{}`
- Math: `\frac{a}{b}`, `\sqrt{…}`
- Graphics: `\includegraphics[width=…]{path}`
- Environments: `equation`, `align`, `itemize`, `enumerate`, `figure`

### Wrap with Environment
- Pick environment (with options where applicable)
- Wrap current selection; normalize surrounding whitespace
- If no selection, insert a block with placeholder body

### Pandoc Attributes Editor
- Detect block at cursor (heading, list item, paragraph, fenced code, image parens)
- Add/edit `{#id .class key=val}`
- Validate keys and warn on duplicates; preserve unknown keys
- Live preview of how attributes serialize on the current line

### Edit-in-Place
- If cursor is inside a known command/env/attributes block, open the relevant form with parsed current values
- On submit, rewrite the source with minimal diffs (keep user spacing when possible)

### Backslash Completions (Phase B)
- Typing `\inc…` suggests `\includegraphics[opts]{path}`
- Signature hint and snippet tabstops (`${1:path}` etc.)
- Works without interfering with plain typing; ESC to dismiss

### Table Wizard (Phase C)
- Choose columns, header row, alignment per column, caption, and optional label
- Outputs Markdown table or LaTeX table env per profile preference
- Optional CSV/TSV paste to auto-fill headers and data rows

### Frontmatter Editor (Phase D)
- Dedicated modal for YAML top matter: title, author(s), date, bibliography, csl, variables, header-includes
- Safely updates YAML block; preserves unrelated keys; avoids reflow when possible

## Data Models

```ts
// src/latex/command-spec.ts
export interface CommandArg { name: string; required?: boolean; kind: 'positional' | 'optional'; key?: string; defaultValue?: string; options?: string[]; }
export interface CommandSpec {
  id: string; kind: 'command' | 'environment' | 'wrapper'; name: string; aliases?: string[]; tags?: string[];
  signature: string; // human readable
  args: CommandArg[];
  template: (args: Record<string,string>, selection?: string) => string; // insertion
  detect: RegExp[]; // regexes that find this instance around cursor
}
export const COMMAND_SPECS: CommandSpec[] = [ /* seed with core commands */ ];
```

## Implementation Plan & Tasks

Phase A — Builder + Attributes + Edit-in-Place
- [ ] Command spec module and initial specs (includegraphics, textbf, emph, section, label/ref/eqref, equation/envs)
- [ ] Insert modal with search + dynamic form + preview
- [ ] AttributesHelper parse/serialize with tests (id/classes/keyvals)
- [ ] Edit engine for command/env detection + parsing (line/neighbor scan + balanced braces)
- [ ] Commands in main.ts: insert, wrap, edit-at-cursor, edit-attributes
- [ ] Docs: README “Authoring Tools” section with gifs

Phase B — Backslash completion + quick wraps
- [ ] CM6 completion source for `\\` prefix; display signatures; tabstops
- [ ] Quick wrap commands (bold/italic/tt/label/ref) as palette actions
- [ ] Setting toggles to enable/disable completions

Phase C — Wizards + library expansion
- [x] Table wizard modal; generate Markdown/LaTeX
- [x] Add minted/listings envs and subfigure to specs
- [x] Expand COMMAND_SPECS: theorem/lemma/proof, autoref, textcite/parencite, sum/integral/product limits, limit-to, subcaption, caption/centering/captionof
- [x] Table wizard CSV/TSV, booktabs/\hline, vertical bars, live preview, copy preview
- [x] Insert Figure Block from File command; auto-label from filename
- [x] More helpers: \underline, \overline, \mathbb, \input, \include, Figure Block one-shot helper
- [ ] Add more math helpers and figure/table utilities as needed

Phase D — Frontmatter editor
- [x] YAML editor UI with common fields (title, authors, date, abstract, keywords, bibliography, csl, header-includes)
- [x] Round-trip updates that preserve unknown keys via targeted replacement
- [x] Variables UI: add/remove/rename; typed controls (string/number/boolean); reserved-key protection; proper YAML typing
- [x] Header-includes: add multi-line block (literal) with prompt
- [x] CSL status indicator and .bib Browse integration
- [ ] Add advanced fields (complex variables, header-includes objects), schema validation (optional)

## Acceptance Criteria

Core
- Insert/Wrap dialogs produce valid LaTeX/Pandoc syntax for supported commands
- Edit-in-place reliably detects and updates target under cursor without breaking content
- Attributes editor correctly adds/merges `{#id .class key=val}` on headings, blocks, inlines

UX
- All flows are keyboard-first; Tab to move fields; Enter to insert
- Backslash completion does not interfere with normal typing; suggestions are relevant

Safety & Perf
- No destructive rewrites; minimal diffs when editing existing commands
- Large files remain responsive; scanning is bounded (line + small window)

## Risks & Mitigations
- Parsing complexity: scope to a curated library first; provide raw mode fallback fields
- Brace matching/option parsing errors: use simple tokenizer for `[]` and `{}` blocks rather than regex only
- Attribute collisions: preserve unknown key/vals; warn on duplicates; never drop user data

## Files & Modules (planned)

- New
  - `src/latex/command-spec.ts`
  - `src/latex/CommandInsertModal.ts`
  - `src/latex/CommandEditEngine.ts`
  - `src/editorExtensions/latex-command-suggest.ts`
  - `src/pandoc/AttributesHelper.ts`
  - `src/pandoc/AttributesModal.ts`
- Modified
  - `src/main.ts` — new commands and wiring
  - `src/templates/TemplateDialog.ts` — optional reuse of form pieces
  - `README.md` — Authoring tools section

## Testing Plan

- Unit tests for AttributesHelper (parse/serialize round-trips; edge cases)
- Unit tests for CommandEditEngine on representative commands
- Manual flows in test-vault: insert/wrap/edit for each supported command; backslash completion; attribute editor on headings, lists, paragraphs, images, code blocks

## Documentation

- New README sections with short gifs:
  - Insert LaTeX Command, Wrap with Environment, Edit at Cursor
  - Add/Edit Pandoc Attributes
  - Backslash Completions & Quick Wraps

## Timeline (suggested)

- Week 1: Phase A core (specs + insert + attributes + edit-at-cursor)
- Week 2: Phase B completion + quick wraps; start table wizard
- Week 3: Phase C expansions; polish; docs + gifs
- Week 4: Phase D frontmatter editor and final QA
