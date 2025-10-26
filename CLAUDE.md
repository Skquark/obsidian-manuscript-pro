# Obsidian Manuscript Pro - Developer Guide

## Overview

Obsidian Manuscript Pro is a comprehensive plugin for academic writing and manuscript management in Obsidian. It provides LaTeX syntax concealment, citation management (BibTeX), cross-reference handling, template/snippet systems, and professional document export via Pandoc.

**Fork Source:** Based on [Dynamic Text Concealer](https://github.com/mattcoleanderson/obsidian-dynamic-text-concealer) by Matt Cole Anderson.

**Current Version:** 0.1.0

---

## Quick Start

### Build Commands

```bash
# Development build (watch mode)
npm run dev

# Production build
npm run build

# Copy main.js to root (required for plugin loading)
npm run copy-main

# Type checking
npm run check
```

### Development Setup

#### Fast Development Loop with Test Vault

The repository includes a `test-vault/` directory for rapid iteration:

**Initial Setup:**
```bash
# Clone repository
git clone https://github.com/Skquark/obsidian-manuscript-pro
cd obsidian-manuscript-pro

# Install dependencies
npm install

# Build and watch for changes
npm run dev
```

**Development Workflow:**
1. `npm run dev` starts Rollup in watch mode
2. Changes to `src/**/*.ts` automatically rebuild to `test-vault/.obsidian/plugins/manuscript-pro/`
3. In Obsidian:
   - Open the `test-vault` folder as a vault
   - Settings → Community Plugins → Enable "Manuscript Pro"
   - **Hot Reload**: Install [Hot Reload plugin](https://github.com/pjeby/hot-reload) for automatic plugin reloading on file changes
   - **Manual Reload**: Press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac) to reload Obsidian

**Why This Works:**
- Rollup dev config outputs directly to `test-vault/.obsidian/plugins/manuscript-pro/`
- No manual copying needed
- With Hot Reload plugin, changes appear instantly

#### Production Deployment

**Deploy to Your Working Vault:**
```bash
# Edit deploy-to-vault.bat (Windows) or create deploy script (Mac/Linux)
# Set your vault path
npm run deploy

# Or manually:
npm run build
cp -r build/* /path/to/vault/.obsidian/plugins/manuscript-pro/
cp manifest.json styles.css /path/to/vault/.obsidian/plugins/manuscript-pro/
```

**Alternative: Symlink Development (Advanced)**
```bash
# Windows (Admin PowerShell)
New-Item -ItemType SymbolicLink -Path "C:\path\to\vault\.obsidian\plugins\manuscript-pro" -Target "C:\Projects\obsidian-manuscript-pro"

# Linux/Mac
ln -s /path/to/obsidian-manuscript-pro /path/to/vault/.obsidian/plugins/manuscript-pro

# Then run dev mode and changes apply to your vault directly
npm run dev
```

**⚠️ Important Notes:**
- After building, `main.js` must exist in plugin root (build script auto-copies)
- If you get "Failed to load plugin", verify `main.js` is in the project root
- Dev mode watches `src/` and rebuilds on save
- Styles (CSS) are not hot-reloaded by Hot Reload plugin - requires manual Ctrl+R

### Repository

- **GitHub:** https://github.com/Skquark/obsidian-manuscript-pro
- **Issues:** https://github.com/Skquark/obsidian-manuscript-pro/issues

---

## Architecture (Current Structure)

### Core Modules

**Editor Concealment**
- `src/editorExtensions/conceal-view-plugin.ts` - CM6 ViewPlugin with cursor-aware revealing, RegExp 'd' flag fallback
- `src/markdownPostProcessors/conceal-post-processor.ts` - Reading mode support (registered when enabled)
- `src/patterns/*` - Pattern groups (math, citations, formatting, LaTeX commands)

**Citations**
- `src/citations/BibliographyManager.ts` - BibTeX parser/cache, toBibTeX conversion (10K entry limit)
- `src/citations/CitationImporter.ts` - DOI/arXiv/PubMed import with validation
- `src/citations/citationHoverExtension.ts` - Hover tooltips with formatted previews
- `src/citations/CitationFormatter.ts` - Built-in styles (APA/Chicago/MLA for previews)

**Cross-References**
- `src/crossref/CrossRefManager.ts` - Label indexing with configurable file limits, validation
- `src/crossref/refAutoComplete.ts` - CM6 autocomplete for \ref, \eqref, etc.
- `src/crossref/LabelBrowser.ts` - Label browser panel with rename/update functionality
- `src/crossref/CrossRefInterfaces.ts` - Type definitions

**Export System**
- `src/export/ExportEngine.ts` - Pandoc invocation via execFile (secure)
- `src/export/ExportManager.ts` - Profile management, global CSL injection
- `src/export/ExportDialog.ts` - Per-export CSL override with existence validation
- `src/export/ProfileDropdown.ts` - Quick profile switcher

**LaTeX Authoring Tools** (NEW)
- `src/latex/command-spec.ts` - Spec-driven command library (~50 commands)
- `src/latex/CommandInsertModal.ts` - Searchable command palette
- `src/latex/CommandEditEngine.ts` - Edit-in-place for commands
- `src/latex/LatexCommandSuggest.ts` - Backslash completion
- `src/latex/TableWizardModal.ts` - Table builder with CSV/TSV paste

**Frontmatter System** (NEW)
- `src/frontmatter/FrontmatterEditorModal.ts` - Structured YAML editor
- `src/frontmatter/FrontmatterHelper.ts` - Safe round-trip updates

**Manuscript Management**
- `src/manuscript/ManuscriptNavigator.ts` - TOC navigator with word counts
- `src/manuscript/ManuscriptLoader.ts` - book-manifest.json loader with legacy migration
- `src/manuscript/ManuscriptEditorModal.ts` - Full metadata editor with validation display
- `src/manuscript/ManuscriptSchema.ts` - TypeScript interfaces for manuscript data

**Validation**
- `src/validation/ValidationEngine.ts` - Rule-based validation
- `src/validation/PrePublicationPanel.ts` - Validation results panel

**Quality Features** (settings.quality.*)
- `src/quality/ChecklistManager.ts` - Pre-publication checklist
- `src/quality/ProgressManager.ts` - Writing progress tracking
- `src/quality/ResearchBible.ts` - Research fact management
- `src/quality/ReadabilityAnalyzer.ts` - Readability metrics

**Templates & Snippets**
- `src/templates/TemplateManager.ts` - Template registry
- `src/templates/TemplateDialog.ts` - Template insertion UI
- `src/templates/SnippetSuggest.ts` - CM6 snippet expansion
- `src/templates/TemplateVariableHelper.ts` - Variable substitution

**Focus Mode**
- `src/focusMode/FocusModeManager.ts` - Typewriter mode, UI hiding
- Status bar integration with zone cycling

**Statistics**
- `src/stats/StatsPanel.ts` - Configurable refresh interval (honors settings)
- `src/stats/StatsData.ts` - Word count history, goals

### Important Notes

- **Security**: All Pandoc calls use `execFile` with array args (no shell injection)
- **Performance**: Cross-ref indexing respects `maxFilesToIndex` limit (default: 1000)
- **Compatibility**: RegExp 'd' flag fallback for older Electron builds
- **Settings**: Use `settings.quality.*` for quality features (replaces legacy `phase4`)
- **CSL Handling**: Three-tier precedence: export override > profile > global default
- **Validation**: Inline results display in manuscript editor Advanced tab

### Core Technologies

- **TypeScript** (strict mode with null checks)
- **CodeMirror 6** (ViewPlugin, Decorations, StateField)
- **Rollup** (bundling with CommonJS output)
- **Node.js APIs** (fs, path, child_process for export features)
- **Obsidian API** (Plugin, TFile, Notice, MarkdownView)

---

## Key Components

### 1. Concealment System

**Purpose:** Visually hide/replace LaTeX commands while preserving source text.

**Files:**
- `src/concealment/ConcealmentManager.ts` - Pattern matching, decoration generation
- `src/concealment/ConcealmentPlugin.ts` - CodeMirror 6 ViewPlugin integration
- `src/concealment/ConcealmentDecorations.ts` - Widget/mark decorations

**Pattern:**
```typescript
// Concealment patterns stored in settings
interface ConcealmentPattern {
  pattern: string;        // RegEx pattern
  replacement: string;    // Replacement text/symbol
  enabled: boolean;
  category: 'math' | 'formatting' | 'citations' | 'custom';
}

// CodeMirror 6 ViewPlugin applies decorations
class ConcealmentViewPlugin extends ViewPlugin {
  update(update: ViewUpdate) {
    // Scan visible ranges, apply decorations based on patterns
  }
}
```

**Key Consideration:** Performance: incremental decorations; fallbacks when RegExp indices are unavailable.

### 2. Citation Management

**Purpose:** BibTeX bibliography parsing, citation insertion, DOI/arXiv/PubMed import.

**Files:**
- `src/citations/BibliographyManager.ts` - BibTeX parser, cache (MAX 10,000 entries)
- `src/citations/CitationEngine.ts` - Citation commands, formatting
- `src/citations/CitationImporter.ts` - External metadata import

**Security Features:**
- **Input Validation:** DOI, arXiv, PubMed IDs validated with regex before API calls
  ```typescript
  // DOI: Must match 10.xxxx/... format
  if (!/^10\.\d{4,}[\d.]*\/\S+$/.test(cleanDOI)) {
    return { success: false, error: 'Invalid DOI format...' };
  }
  
  // arXiv: YYMM.NNNNN or subject-class/YYMMXXX
  if (!/^\d{4}\.\d{4,5}(v\d+)?$/.test(cleanId) && !/^[a-z-]+\/\d{7}$/.test(cleanId)) {
    return { success: false, error: 'Invalid arXiv ID format...' };
  }
  ```

- **Cache Limits:** BibliographyManager enforces 10,000 entry max to prevent unbounded memory growth
  ```typescript
  private readonly MAX_CACHE_ENTRIES = 10000;
  
  if (this.entries.size < this.MAX_CACHE_ENTRIES) {
    this.entries.set(key, entry);
  } else {
    console.warn('Bibliography cache limit reached...');
  }
  ```

### 3. Export System

**Purpose:** Generate publication-ready documents via Pandoc (DOCX, PDF, LaTeX, etc.).

**Files:**
- `src/export/ExportEngine.ts` - Pandoc command execution
- `src/export/ExportProfiles.ts` - Format templates (APA, Chicago, IEEE, etc.)
- `src/export/ExportInterfaces.ts` - Type definitions

**CRITICAL SECURITY PATTERN:**
```typescript
// ALWAYS use execFile, NEVER exec (prevents command injection)
import { execFile } from 'child_process';
const execFileAsync = promisify(execFile);

// Build args as array, NOT as concatenated string
const args = [
  '-f', 'markdown',
  '-t', format,
  '--bibliography', bibPath,
  '--citeproc',
  '-o', outputPath,
  inputPath
];

await execFileAsync(pandocPath, args);
```

**Never manually quote arguments** - execFile handles escaping automatically.

**Path Sanitization:**
```typescript
// Pandoc path must not contain shell metacharacters
if (/[;&|`$()<>]/.test(sanitized)) {
  console.error('Invalid Pandoc path detected');
  return 'pandoc'; // Fall back to system default
}
```

### 4. Template System

**Purpose:** Reusable document templates with variable substitution.

**Files:**
- `src/templates/TemplateManager.ts` - Template rendering, variable replacement
- `src/templates/SnippetManager.ts` - Quick text snippets

**Type Safety Note:**
```typescript
// Obsidian's View type doesn't expose 'editor' property
// Use type casting when accessing editor from View
const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
if (activeView) {
  const editor = (activeView as any).editor; // Required cast
}
```

### 5. Stats & History

**Files:**
- `src/main.ts` (stats tracking, pruning)

**Memory Management:**
```typescript
// Prune stats history to last 365 days (prevents unbounded growth)
private pruneStatsHistory() {
  const MAX_HISTORY_DAYS = 365;
  const cutoffDate = new Date(Date.now() - MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
  const cutoffKey = cutoffDate.toISOString().split('T')[0];
  
  for (const date in this.settings.writing?.stats?.dailyHistory) {
    if (date < cutoffKey) {
      delete this.settings.writing.stats.dailyHistory[date];
    }
  }
}
```

---

## Settings Structure

Settings are stored in `.obsidian/plugins/manuscript-pro/data.json`:

```typescript
interface ManuscriptProSettings {
  concealment: {
    enabled: boolean;
    patterns: ConcealmentPattern[];
    customPatterns: ConcealmentPattern[];
  };
  
  citations: {
    bibliographyPath: string;
    citationStyle: string; // 'apa', 'chicago', 'mla', etc.
    autoSync: boolean;
  };
  
  export: {
    pandocPath?: string;
    defaultProfile: string;
    outputDirectory: string;
    profiles: ExportProfile[];
  };
  
  writing: {
    stats: {
      enabled: boolean;
      dailyHistory: { [date: string]: WritingStats };
    };
  };
  
  quality: {  // IMPORTANT: Was renamed from 'phase4' - always use 'quality'
    checklist: {
      enabled: boolean;
      items: ChecklistItem[];
    };
  };
}
```

**CRITICAL:** The quality settings were renamed from `phase4` in a previous refactor. Always use `this.settings.quality`, never `this.settings.phase4`.

---

## Common Patterns & Conventions

### 1. Error Handling

```typescript
try {
  const result = await someOperation();
  if (!result.success) {
    new Notice(`Operation failed: ${result.error}`);
    return;
  }
} catch (error) {
  console.error('Detailed error for debugging:', error);
  new Notice('User-friendly error message');
}
```

### 2. Settings Updates

```typescript
// Always save after modifying settings
this.plugin.settings.someProperty = newValue;
await this.plugin.saveSettings();
```

### 3. CodeMirror 6 Extensions

```typescript
// Register extensions in onload()
this.registerEditorExtension([
  ViewPlugin.fromClass(ConcealmentViewPlugin, {
    decorations: v => v.decorations
  })
]);
```

### 4. Command Registration

```typescript
this.addCommand({
  id: 'command-id',
  name: 'Command Name',
  editorCallback: (editor: Editor, view: MarkdownView) => {
    // Command logic
  }
});
```

---

## Known Issues & Gotchas

### 1. Plugin Loading Requires main.js in Root

**Symptom:** "Failed to load plugin 'manuscript-pro'" error in Obsidian.

**Cause:** Obsidian expects `main.js` in plugin root, not in `build/` subdirectory.

**Solution:** Run `npm run copy-main` after building, or ensure build script includes copy step.

### 2. Pandoc Required for Export

Export features require Pandoc installed on the system. Download from https://pandoc.org

Check availability with:
```typescript
const available = await this.exportEngine.checkPandocAvailable();
```

### 3. Node.js APIs Required

Export functionality uses Node.js APIs (`child_process`, `fs`, `path`) which may not be available in all Obsidian environments (e.g., mobile). Desktop-only features should check API availability:

```typescript
if (typeof execFile === 'undefined') {
  new Notice('This feature requires desktop Obsidian');
  return;
}
```

### 4. TypeScript Strict Mode

Project uses strict null checks. Always check for null/undefined:

```typescript
// BAD
const file = this.app.vault.getAbstractFileByPath(path);
const content = await this.app.vault.read(file); // Error if file is null

// GOOD
const file = this.app.vault.getAbstractFileByPath(path);
if (file instanceof TFile) {
  const content = await this.app.vault.read(file);
}
```

---

## Security Considerations

### 1. Command Injection Prevention

**NEVER use `exec()` with user-provided input:**

```typescript
// UNSAFE - DO NOT USE
import { exec } from 'child_process';
await exec(`"${userPath}" --option "${userInput}"`); // VULNERABLE
```

**ALWAYS use `execFile()` with argument arrays:**

```typescript
// SAFE
import { execFile } from 'child_process';
const execFileAsync = promisify(execFile);
await execFileAsync(userPath, ['--option', userInput]); // SECURE
```

### 2. Input Validation

Always validate user input before making external API calls or file operations:

```typescript
// Validate DOI format
if (!/^10\.\d{4,}[\d.]*\/\S+$/.test(doi)) {
  return { success: false, error: 'Invalid DOI' };
}

// Sanitize file paths
const sanitized = path.normalize(userPath).replace(/\\/g, '/');
if (sanitized.includes('..')) {
  throw new Error('Path traversal attempt detected');
}
```

### 3. Path Sanitization

Check for shell metacharacters in paths used with child_process:

```typescript
if (/[;&|`$()<>]/.test(path)) {
  console.error('Invalid path contains shell metacharacters');
  return defaultPath;
}
```

---

## Testing & Debugging

### Manual Testing

1. Open test vault in Obsidian
2. Enable "Manuscript Pro" in Settings > Community Plugins
3. Test features:
   - Concealment: Create note with `\textbf{test}`, verify it displays as formatted
   - Citations: Add BibTeX file, insert citations with `Ctrl+Shift+C`
   - Export: Export note to DOCX/PDF (requires Pandoc)
   - Templates: Use template insertion command

### Console Debugging

Open Obsidian Developer Console (Ctrl+Shift+I):

```typescript
// Log plugin instance
console.log(app.plugins.plugins['manuscript-pro']);

// Check settings
console.log(app.plugins.plugins['manuscript-pro'].settings);

// Test citation manager
const plugin = app.plugins.plugins['manuscript-pro'];
await plugin.citationEngine.insertCitation();
```

### Common Debug Checks

```bash
# Verify build output exists
ls -la build/main.js
ls -la main.js  # Must exist in root

# Check file sizes (main.js should be ~500KB+)
du -h main.js

# Verify manifest
cat manifest.json | grep version

# Check for TypeScript errors
npm run check
```

---

## Build System Details

### Rollup Configuration (rollup.config.mjs)

- **Format:** CommonJS (`format: 'cjs'`)
- **External:** Obsidian API, Node.js modules (fs, path, child_process, etc.)
- **Output:** `build/main.js` → copied to root `main.js`
- **Plugins:**
  - `@rollup/plugin-typescript` - TypeScript compilation
  - `@rollup/plugin-node-resolve` - Module resolution
  - `@rollup/plugin-commonjs` - CommonJS conversion

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "strictNullChecks": true,
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

---

## Contributing Guidelines

### Code Style

- Use tabs for indentation (not spaces)
- Single quotes for strings
- Trailing commas in multiline objects/arrays
- Type everything - avoid `any` unless absolutely necessary

### Naming Conventions

- **Files:** PascalCase for classes (`CitationEngine.ts`), camelCase for utilities
- **Variables:** camelCase
- **Constants:** UPPER_SNAKE_CASE for true constants, camelCase for readonly
- **Interfaces:** PascalCase with descriptive names (`ExportProfile`, `ConcealmentPattern`)

### Commit Messages

Follow conventional commits:
```
feat: Add new citation style support
fix: Resolve command injection vulnerability in ExportEngine
docs: Update CLAUDE.md with security patterns
refactor: Rename phase4 to quality in settings
```

### Pull Request Process

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes with descriptive commits
4. Run `npm run check` to verify TypeScript
5. Run `npm run build` to verify build succeeds
6. Test in Obsidian with test vault
7. Push and create PR

---

## Additional Resources

### Obsidian Plugin Development

- [Obsidian Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Obsidian API Reference](https://docs.obsidian.md/Reference/TypeScript+API)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)

### Tools & Libraries

- [Pandoc Manual](https://pandoc.org/MANUAL.html)
- [BibTeX Format Spec](http://www.bibtex.org/Format/)
- [Citation Style Language](https://citationstyles.org/)

### Related Projects

- [Dynamic Text Concealer](https://github.com/mattcoleanderson/obsidian-dynamic-text-concealer) - Original fork source
- [Obsidian Citation Plugin](https://github.com/hans/obsidian-citation-plugin) - Alternative citation manager

---

## Version History

### v0.1.0 (2025-10-25)

Initial release with:
- LaTeX syntax concealment
- BibTeX citation management
- DOI/arXiv/PubMed import
- Pandoc export (DOCX, PDF, LaTeX)
- Template and snippet system
- Cross-reference management
- Writing statistics tracking

**Security fixes:**
- Command injection prevention (exec → execFile)
- Input validation for citation imports
- Path sanitization for Pandoc
- Cache size limits (10k entries)
- Stats history pruning (365 days)

**Code quality:**
- Fixed all TypeScript compilation errors
- Renamed phase4 → quality settings
- Removed all @ts-expect-error directives
- Zero build warnings

---

## License

See LICENSE file for details.

## Support

- **Issues:** https://github.com/Skquark/obsidian-manuscript-pro/issues
- **Fork Source:** https://github.com/mattcoleanderson/obsidian-dynamic-text-concealer

---

*Last Updated: 2025-10-25*
*Plugin Version: 0.1.0*
