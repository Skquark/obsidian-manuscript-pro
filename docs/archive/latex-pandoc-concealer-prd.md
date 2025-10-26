# Product Requirements Document: Obsidian LaTeX-Pandoc Concealer Plugin

## Executive Summary

Create an Obsidian plugin called "LaTeX-Pandoc Concealer" that provides distraction-free writing/editing for academic and technical writers by selectively hiding LaTeX and Pandoc markdown syntax in Live Preview mode. The plugin is based on the `obsidian-dynamic-text-concealer` codebase and extends it with predefined patterns, enhanced features, and optimized UX for book manuscript editing.

## Project Context

**Base Repository**: Fork of `mattcoleanderson/obsidian-dynamic-text-concealer`

**Target Users**: Academic writers, technical authors, researchers, and book authors who write in Markdown with heavy LaTeX/Pandoc formatting

**Primary Use Case**: Editing long-form manuscripts (books, dissertations, research papers) with extensive LaTeX math, Pandoc citations, indexing markers, and custom formatting that clutters the editing experience

## Core Objectives

1. **Hide LaTeX/Pandoc syntax** while preserving it in the source files
2. **Provide cursor-aware revealing** - show hidden syntax when cursor enters that line
3. **Offer granular toggle controls** - enable/disable specific pattern groups
4. **Maintain editing integrity** - all edits affect the actual source text
5. **Optimize for performance** - handle 500+ page manuscripts smoothly
6. **Friendly UX** - simple settings, helpful defaults, keyboard shortcuts

## Feature Requirements

### 1. Predefined Pattern Groups

Create **five toggleable pattern groups** with comprehensive regex coverage:

#### Pattern Group 1: Math Delimiters
**Purpose**: Hide LaTeX math mode markers while preserving math content visibility

Patterns to conceal:
- Inline math delimiters: `$...$` → hide `$` markers only
- Display math delimiters: `$$...$$` → hide `$$` markers only  
- LaTeX inline math: `\(...\)` → hide `\(` and `\)`
- LaTeX display math: `\[...\]` → hide `\[` and `\]`
- Equation environments: `\begin{equation}`, `\end{equation}`
- Align environments: `\begin{align}`, `\end{align}`, `\begin{align*}`, `\end{align*}`
- Other math environments: `gather`, `multline`, `eqnarray`

**Regex patterns**:
```javascript
{
  name: "Math Delimiters",
  patterns: [
    { regex: /(?<!\\)\$(?=\S)/g, replacement: "" },  // opening $ before non-space
    { regex: /(?<=\S)\$(?!\\)/g, replacement: "" },  // closing $ after non-space
    { regex: /\$\$/g, replacement: "" },  // double dollar signs
    { regex: /\\\[/g, replacement: "" },  // \[
    { regex: /\\\]/g, replacement: "" },  // \]
    { regex: /\\\(/g, replacement: "" },  // \(
    { regex: /\\\)/g, replacement: "" },  // \)
    { regex: /\\begin\{(equation|align|align\*|gather|multline|eqnarray)\}/g, replacement: "" },
    { regex: /\\end\{(equation|align|align\*|gather|multline|eqnarray)\}/g, replacement: "" }
  ]
}
```

#### Pattern Group 2: Pandoc Citations
**Purpose**: Hide citation syntax clutter while keeping author/date visible when possible

Patterns to conceal:
- Basic citations: `[@smith2020]` → show "smith2020" or formatted output
- Multiple citations: `[@smith2020; @jones2021]`
- Citations with prefix/suffix: `[see @smith2020, pp. 12-15]`
- Author-in-text: `@smith2020` → keep visible but hide `@` or style differently
- Suppressed author: `[-@smith2020]` → hide `[-` and `]`
- Citation with locator in braces: `[@smith{ii, A, D-Z}]`
- URL citations: `[@{https://example.com}]`

**Regex patterns**:
```javascript
{
  name: "Citations",
  patterns: [
    { regex: /\[@/g, replacement: "[" },  // simplify opening citation bracket
    { regex: /(?<=\[)-@/g, replacement: "" },  // hide suppressed author marker
    { regex: /;\s*@/g, replacement: "; " },  // hide @ in multi-citations
    { regex: /@\{([^\}]+)\}/g, replacement: "$1" },  // unwrap braced citations
    { regex: /(?<!\[)@(?=[\w])/g, replacement: "" }  // hide standalone @ before citekey
  ]
}
```

#### Pattern Group 3: LaTeX Commands
**Purpose**: Hide LaTeX command syntax while keeping formatted content

Patterns to conceal:
- Text formatting: `\textbf{bold}` → **bold**, `\emph{italic}` → *italic*
- Sections: `\section{Title}`, `\subsection{Title}`, `\chapter{Title}`
- Labels and refs: `\label{sec:intro}`, `\ref{sec:intro}`, `\eqref{eq:1}`
- Footnotes: `\footnote{text}`
- Special characters: `\&`, `\%`, `\$`, `\{`, `\}`
- Text styling: `\textit{}`, `\textsc{}`, `\underline{}`
- Quotations: `\enquote{text}`
- Spacing: `\vspace{}`, `\hspace{}`, `\\`

**Regex patterns**:
```javascript
{
  name: "LaTeX Commands",
  patterns: [
    { regex: /\\textbf\{/g, replacement: "**" },  // convert to markdown bold
    { regex: /\\emph\{/g, replacement: "*" },  // convert to markdown italic
    { regex: /\\textit\{/g, replacement: "*" },
    { regex: /\\(section|subsection|subsubsection|chapter)\{/g, replacement: "" },
    { regex: /\\label\{[^\}]*\}/g, replacement: "" },  // hide labels completely
    { regex: /\\(ref|eqref|cref)\{/g, replacement: "→" },  // replace with arrow
    { regex: /\\footnote\{/g, replacement: "[^" },  // convert to markdown footnote style
    { regex: /\\(textsc|underline|enquote)\{/g, replacement: "" },
    { regex: /\\\\/g, replacement: "" },  // hide line breaks
    { regex: /\\([&%${}])/g, replacement: "$1" }  // unescape special chars
  ]
}
```

#### Pattern Group 4: Pandoc Markup
**Purpose**: Hide Pandoc-specific markdown extensions

Patterns to conceal:
- Custom divs: `:::` and `:::{.classname}`
- Div attributes: `{.class #id key=value}`
- Span attributes: `[text]{.class #id}`
- Line blocks: `|` at start of lines
- Definition lists: `:` marker
- Fancy lists: `#.`, `(@)`, `A)`, `i.`
- Footnote markers: `[^1]`, `[^longnote]`
- Image attributes: `![caption](image.png){width=50%}`
- Table attributes: `{.striped}`
- Fenced div closers: `:::`

**Regex patterns**:
```javascript
{
  name: "Pandoc Markup",  
  patterns: [
    { regex: /^:::\s*\{[^\}]*\}/gm, replacement: "" },  // hide div openers with attributes
    { regex: /^:::$/gm, replacement: "" },  // hide div closers
    { regex: /\{\.[\w-]+(?:\s+#[\w-]+)?(?:\s+[\w-]+=(?:"[^"]*"|[\w-]+))*\}/g, replacement: "" },  // hide attributes
    { regex: /\[\^([\w-]+)\]/g, replacement: "[$1]" },  // simplify footnote refs
    { regex: /^\|\s+/gm, replacement: "" },  // hide line block markers
    { regex: /^\(@[\w-]+\)\s+/gm, replacement: "" },  // hide example list markers
    { regex: /\{(?:width|height)=[^\}]+\}/g, replacement: "" }  // hide image sizing
  ]
}
```

#### Pattern Group 5: Indexing & Metadata
**Purpose**: Hide indexing, metadata, and processing directives

Patterns to conceal:
- Index entries: `\index{term}`, `\index{main!sub}`
- Glossary: `\gls{term}`, `\glspl{term}`
- Custom IDs/anchors: `{#sec:intro}`, `{#fig:diagram}`
- Metadata blocks: `---` YAML frontmatter delimiters
- Comments: `<!-- HTML comments -->`
- Processing instructions: `{-}`, `{.unnumbered}`
- Cross-reference labels: `{#eq:schrodinger}`
- Bibliography files: `bibliography: refs.bib`

**Regex patterns**:
```javascript
{
  name: "Indexing & Metadata",
  patterns: [
    { regex: /\\index\{[^\}]*\}/g, replacement: "" },
    { regex: /\\g ls(pl)?\{/g, replacement: "" },
    { regex: /\{#[\w:-]+\}/g, replacement: "" },  // hide custom IDs
    { regex: /^---\s*$/gm, replacement: "" },  // hide YAML delimiters
    { regex: /<!--.*?-->/gs, replacement: "" },  // hide HTML comments
    { regex: /\{-\}/g, replacement: "" },  // hide unnumbered markers
    { regex: /\{\.unnumbered\}/g, replacement: "" },
    { regex: /^bibliography:\s*.+$/gm, replacement: "" }  // hide bib declarations
  ]
}
```

### 2. Cursor-Aware Revealing

**Behavior**: When cursor enters a line with concealed text, temporarily show the hidden syntax

**Implementation**:
- Use CodeMirror 6 `EditorView.decorations` with cursor position tracking
- Detect cursor line changes with `ViewPlugin.update`
- Remove decorations for the active line only
- Add slight delay (100ms) before concealing again when cursor leaves
- Optional: highlight the revealed syntax with subtle background color

**Settings**:
- Enable/disable cursor revealing (default: enabled)
- Reveal delay time (default: 100ms, range: 0-1000ms)
- Reveal entire paragraph vs. just cursor line (default: just line)

### 3. Toggle Commands & UI

**Command Palette Commands**:
1. "Toggle LaTeX-Pandoc Concealer" - master on/off
2. "Toggle Math Delimiters" - group 1
3. "Toggle Citations" - group 2  
4. "Toggle LaTeX Commands" - group 3
5. "Toggle Pandoc Markup" - group 4
6. "Toggle Indexing & Metadata" - group 5
7. "Show All Hidden Syntax" - temporarily reveal everything
8. "Hide All Syntax" - apply all patterns

**Status Bar Indicator**:
- Show icon indicating concealer is active (e.g., 🔍 or 👁️)
- Click to toggle main concealer on/off
- Tooltip shows which groups are active
- Optional: show count of concealed items on current page

**Keyboard Shortcuts** (default, user-configurable):
- `Ctrl/Cmd + Shift + H` - Toggle main concealer
- `Ctrl/Cmd + Shift + M` - Toggle math delimiters
- `Ctrl/Cmd + Shift + C` - Toggle citations
- `Ctrl/Cmd + Shift + L` - Toggle LaTeX commands

### 4. Settings Panel

**General Settings**:
- ☑️ Enable LaTeX-Pandoc Concealer (master toggle)
- ☑️ Enable in Live Preview (default: on)
- ☑️ Enable in Reading Mode (default: off)
- ☑️ Enable in Source Mode (default: off)

**Pattern Group Toggles**:
- ☑️ Hide Math Delimiters (Group 1)
- ☑️ Hide Citations (Group 2)
- ☑️ Hide LaTeX Commands (Group 3)
- ☑️ Hide Pandoc Markup (Group 4)
- ☑️ Hide Indexing & Metadata (Group 5)

**Cursor Revealing**:
- ☑️ Enable cursor revealing (default: on)
- Reveal delay: [slider 0-1000ms, default 100]
- ☑️ Reveal entire paragraph (default: off)
- ☑️ Highlight revealed syntax (default: off)
- Highlight color: [color picker, default: light yellow]

**Advanced Settings**:
- ☑️ Show status bar indicator (default: on)
- ☑️ Show concealed count (default: off)
- ☑️ Log pattern matches (debug mode, default: off)
- Custom regex patterns: [text area for user-defined patterns]

**User Experience**:
- Settings organized in collapsible sections
- Inline help text for each setting
- "Reset to Defaults" button
- "Test Patterns" button - opens modal to test patterns on sample text

### 5. Performance Optimization

**Requirements**:
- Handle documents up to 500 pages (≈150,000 words)
- Decoration updates < 16ms for smooth typing
- Initial render < 500ms
- Memory usage < 50MB for typical manuscript

**Optimization Strategies**:
1. **Incremental Processing**: Only process visible viewport + small buffer
2. **Debounced Updates**: Wait 100ms after typing stops before applying patterns
3. **Pattern Caching**: Compile regex patterns once at startup
4. **Decoration Reuse**: Reuse decoration objects when possible
5. **Lazy Loading**: Only activate pattern groups that are enabled
6. **Worker Thread**: Consider moving heavy regex processing to worker (future)

**Performance Settings**:
- Viewport buffer size (default: 500 lines)
- Update debounce delay (default: 100ms)
- Max decorations per update (default: 1000)

### 6. Error Handling & Debugging

**Error Cases**:
- Invalid regex in custom patterns → show error message, disable pattern
- Performance degradation → warn user, suggest disabling groups
- CodeMirror compatibility issues → fallback to simpler implementation

**Debug Mode**:
- Toggle in settings: "Enable debug logging"
- Console logs show:
  - Which patterns matched
  - Number of decorations applied
  - Rendering performance metrics
  - Errors in pattern matching

**User Notifications**:
- Success: "LaTeX-Pandoc Concealer activated"
- Warning: "High decoration count may affect performance"
- Error: "Invalid custom pattern: [pattern] - [error message]"

### 7. Documentation

**README.md** must include:
1. Installation instructions
2. Quick start guide with screenshots
3. Pattern group descriptions
4. Keyboard shortcuts reference
5. Settings explanations
6. Performance tips for large documents
7. Custom pattern examples
8. Troubleshooting section
9. Comparison with other plugins
10. Credits to original Dynamic Text Concealer

**In-Plugin Help**:
- Help icon in settings opens documentation
- Contextual tooltips on all settings
- Sample text demos for each pattern group

## Technical Specifications

### Technology Stack
- **Language**: TypeScript
- **Framework**: Obsidian Plugin API (v1.6+)
- **Editor**: CodeMirror 6
- **Build**: esbuild
- **Testing**: Jest (unit tests), Obsidian Plugin Test Framework

### Key Dependencies
- `obsidian` (^1.6.0) - Core API
- `@codemirror/state` - State management
- `@codemirror/view` - View plugins and decorations
- `@codemirror/language` - Syntax tree access

### Architecture

**File Structure**:
```
obsidian-latex-pandoc-concealer/
├── src/
│   ├── main.ts                 # Plugin entry point
│   ├── settings.ts             # Settings interface & defaults
│   ├── settingsTab.ts          # Settings UI
│   ├── patterns/
│   │   ├── mathDelimiters.ts   # Group 1 patterns
│   │   ├── citations.ts        # Group 2 patterns
│   │   ├── latexCommands.ts    # Group 3 patterns
│   │   ├── pandocMarkup.ts     # Group 4 patterns
│   │   └── indexingMeta.ts     # Group 5 patterns
│   ├── decorations/
│   │   ├── decorationBuilder.ts # Core decoration logic
│   │   ├── cursorRevealer.ts    # Cursor-aware revealing
│   │   └── viewPlugin.ts        # CodeMirror view plugin
│   ├── ui/
│   │   ├── statusBar.ts         # Status bar indicator
│   │   └── commands.ts          # Command palette commands
│   └── utils/
│       ├── performance.ts       # Performance monitoring
│       └── logger.ts            # Debug logging
├── styles.css                   # Plugin styles
├── manifest.json                # Plugin manifest
├── package.json
└── README.md
```

**Core Classes**:

```typescript
// settings.ts
interface LatexPandocConcealerSettings {
  enabled: boolean;
  enableInLivePreview: boolean;
  enableInReadingMode: boolean;
  enableInSourceMode: boolean;
  
  // Pattern groups
  groups: {
    mathDelimiters: boolean;
    citations: boolean;
    latexCommands: boolean;
    pandocMarkup: boolean;
    indexingMeta: boolean;
  };
  
  // Cursor revealing
  cursorReveal: {
    enabled: boolean;
    delay: number;
    revealParagraph: boolean;
    highlightRevealed: boolean;
    highlightColor: string;
  };
  
  // UI
  showStatusBar: boolean;
  showConcealedCount: boolean;
  
  // Advanced
  debugMode: boolean;
  customPatterns: string[];
  performance: {
    viewportBuffer: number;
    debounceDelay: number;
    maxDecorationsPerUpdate: number;
  };
}

// patterns/base.ts
interface PatternGroup {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  patterns: Pattern[];
}

interface Pattern {
  regex: RegExp;
  replacement: string | ((match: string) => string);
  description?: string;
}

// decorations/decorationBuilder.ts
class DecorationBuilder {
  constructor(settings: LatexPandocConcealerSettings);
  buildDecorations(view: EditorView): DecorationSet;
  applyPattern(pattern: Pattern, view: EditorView): Decoration[];
}

// main.ts
export default class LatexPandocConcealerPlugin extends Plugin {
  settings: LatexPandocConcealerSettings;
  viewPlugin: ViewPlugin;
  statusBarItem: HTMLElement;
  
  async onload(): Promise<void>;
  async onunload(): Promise<void>;
  async loadSettings(): Promise<void>;
  async saveSettings(): Promise<void>;
  registerCommands(): void;
  setupStatusBar(): void;
}
```

### CodeMirror 6 Integration

**View Plugin Structure**:
```typescript
import { ViewPlugin, ViewUpdate, EditorView, Decoration, DecorationSet } from "@codemirror/view";

const latexPandocConcealerPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    
    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    
    update(update: ViewUpdate) {
      // Rebuild decorations on document or selection change
      if (update.docChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    
    buildDecorations(view: EditorView): DecorationSet {
      // Apply pattern groups and build decoration set
      // Handle cursor position for revealing
    }
  },
  {
    decorations: v => v.decorations
  }
);
```

**Decoration Types**:
- `Decoration.replace()` - Hide text completely
- `Decoration.mark()` - Style hidden text with CSS
- `Decoration.widget()` - Replace with custom element (for complex cases)

### Testing Requirements

**Unit Tests** (Jest):
- Pattern matching accuracy (each regex pattern)
- Decoration building logic
- Settings persistence
- Command registration
- Edge cases (nested patterns, special characters)

**Integration Tests**:
- Full document processing
- Cursor revealing behavior
- Performance benchmarks
- Multi-pattern interaction

**Manual Test Cases**:
1. Open 500-page manuscript → verify smooth scrolling
2. Type in math environment → verify real-time concealment
3. Toggle groups → verify instant update
4. Cursor movement → verify revealing/concealing
5. Settings changes → verify persistence across reload

## Success Metrics

**User Experience**:
- ✅ Users can edit manuscripts without visual clutter
- ✅ Cursor revealing feels natural and responsive
- ✅ Toggle commands work instantly
- ✅ No noticeable lag on documents < 500 pages

**Technical**:
- ✅ < 16ms decoration update time (60 FPS)
- ✅ < 500ms initial load time
- ✅ < 50MB memory usage
- ✅ 95%+ pattern match accuracy
- ✅ Zero data loss (all edits preserve source)

**Adoption**:
- ✅ Clear documentation with examples
- ✅ Positive user feedback
- ✅ Community contributions (pattern suggestions)

## Development Phases

### Phase 1: Core Concealment (Week 1)
- Fork Dynamic Text Concealer
- Implement 5 pattern groups with regex
- Basic decoration application
- Settings structure
- Unit tests for patterns

### Phase 2: Cursor Revealing (Week 2)
- Cursor position tracking
- Line-based revealing logic
- Delay/timing implementation
- Paragraph revealing option
- Integration tests

### Phase 3: UI & Commands (Week 3)
- Command palette commands
- Status bar indicator
- Settings tab UI
- Keyboard shortcuts
- Help documentation

### Phase 4: Optimization (Week 4)
- Performance profiling
- Viewport-based processing
- Debouncing and caching
- Large document testing
- Memory optimization

### Phase 5: Polish (Week 5)
- Error handling
- Debug mode
- User notifications
- README and documentation
- Visual refinements
- Beta testing

## Example Use Cases

### Use Case 1: Book Manuscript Editing
**Scenario**: Author writing 600-page book with heavy LaTeX math and Pandoc citations

**Before**: Document cluttered with `\begin{equation}`, `[@author2020]`, `\label{}`, making it hard to focus on prose

**After**: Math appears clean, citations show as "author2020", labels hidden completely. Cursor reveals syntax only when editing that specific line.

### Use Case 2: Academic Paper
**Scenario**: Researcher writing paper with 50+ citations and complex equations

**Before**: Citation syntax breaks reading flow: `[see @smith2020, pp. 12-15; @jones2021]`

**After**: Shows as "see smith2020, pp. 12-15; jones2021" with brackets minimized

### Use Case 3: Collaborative Editing
**Scenario**: Co-author needs to edit content but is distracted by LaTeX

**Before**: Cannot focus on writing due to syntax overload

**After**: Toggle "Hide LaTeX Commands" and "Hide Citations" for clean prose view. Technical author keeps all syntax visible.

## Non-Goals (Out of Scope)

❌ WYSIWYG rendering (showing formatted output instead of markdown)
❌ LaTeX compilation or preview
❌ Citation management or bibliography formatting
❌ Spell-checking or grammar
❌ Converting LaTeX to other formats
❌ Supporting non-English characters in pattern matching (Phase 1)
❌ Mobile/tablet optimization (Phase 1)
❌ Real-time collaboration features

## References & Prior Art

**Inspiration**:
- Vim's `conceal` feature (`:help conceal`)
- Obsidian Latex Suite conceal implementation
- VS Code's inline folding extensions
- Typora's "focus mode"

**Related Plugins**:
- Obsidian Latex Suite - math-focused concealing
- Dynamic Text Concealer - base implementation
- Pandoc Extended Markdown - syntax support

**Documentation**:
- Pandoc Manual: https://pandoc.org/MANUAL.html
- LaTeX Commands Reference: https://en.wikibooks.org/wiki/LaTeX/Commands
- CodeMirror 6 Decorations: https://codemirror.net/docs/ref/#view.Decoration
- Obsidian Plugin API: https://docs.obsidian.md/

## Appendix: Pattern Testing

### Test Document Template
```markdown
---
title: Test Document
author: Test Author
bibliography: refs.bib
---

# Chapter 1

This is a test with inline math $E = mc^2$ and display math:

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

Citations appear like this [@smith2020; @jones2021]. Some authors
prefer author-in-text style like @brown2019 says...

We use \textbf{bold} and \emph{italic} text. Cross-references 
use \ref{sec:intro} and \eqref{eq:main}.

Custom divs for notes:

:::warning
This is a warning block.
:::

Index entries\index{term} are invisible. Labels {#sec:test} too.
```

### Expected Output (All Groups Enabled)
```markdown
# Chapter 1

This is a test with inline math E = mc^2 and display math:

∫₀^∞ e^(-x²) dx = √π/2

Citations appear like this [smith2020; jones2021]. Some authors
prefer author-in-text style like brown2019 says...

We use **bold** and *italic* text. Cross-references 
use →sec:intro and →eq:main.

Custom divs for notes:

This is a warning block.

Index entries are invisible. Labels  too.
```

---

## Implementation Checklist for Claude Code

- [ ] Fork `obsidian-dynamic-text-concealer` repository
- [ ] Update manifest.json with new plugin name and details
- [ ] Implement 5 pattern group modules with complete regex patterns
- [ ] Create DecorationBuilder class with pattern application logic
- [ ] Implement cursor-aware revealing with ViewPlugin
- [ ] Add command palette commands (8 commands)
- [ ] Create status bar indicator with click handler
- [ ] Build settings tab UI with all controls
- [ ] Implement settings persistence (load/save)
- [ ] Add keyboard shortcut registration
- [ ] Write comprehensive README.md
- [ ] Create unit tests for each pattern group
- [ ] Add performance monitoring and debug logging
- [ ] Implement error handling for invalid patterns
- [ ] Add sample test document for verification
- [ ] Profile performance with large documents
- [ ] Document custom pattern syntax for advanced users
- [ ] Create animated GIF demo for README
- [ ] Add inline help tooltips in settings
- [ ] Implement "Reset to Defaults" functionality
- [ ] Final testing on Windows, Mac, Linux

**Estimated Development Time**: 4-5 weeks
**Technical Difficulty**: Intermediate-Advanced
**Plugin Complexity**: Medium-High

**Next Steps**: 
1. Set up development environment with forked repo
2. Implement pattern groups starting with Math Delimiters
3. Test each group individually before integration
4. Build cursor revealing as separate module
5. Integrate all components and test end-to-end