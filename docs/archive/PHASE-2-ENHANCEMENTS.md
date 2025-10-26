# Phase 2 Enhancements: Book Writer Toolkit

This document outlines potential enhancements to transform LaTeX-Pandoc Concealer from a syntax concealer into a comprehensive book writing toolkit for Obsidian.

## Overview

While Phase 1 successfully implemented core concealment functionality, Phase 2 focuses on features that specifically support the book writing workflow: tracking progress, navigating long manuscripts, managing citations and cross-references, and providing a distraction-free writing environment.

---

## 🌟 Priority Tier 1: High Impact, Core Features

### 1. Focus Mode / Zen Mode ⭐⭐⭐⭐⭐

**Problem**: Even with LaTeX/Pandoc concealment, markdown syntax (headings, lists, rules) still creates visual clutter during writing sessions.

**Solution**: A dedicated "focus mode" that provides a prose-only view optimized for creative writing flow.

**Features**:

#### 1.1 Prose-Only View
- Hide markdown heading markers (`#`, `##`, `###`)
- Hide horizontal rules (`---`, `***`)
- Hide list markers (`-`, `*`, `1.`)
- Hide blockquote markers (`>`)
- Optional: Hide inline code backticks
- Keep emphasized text visible (`**bold**`, `*italic*`)

#### 1.2 Typewriter Mode Enhancement
- Dim all text except current paragraph (configurable opacity)
- Smooth transitions when cursor moves
- Configurable "active zone" size (sentence/paragraph/section)
- Optional highlighting of active zone

#### 1.3 Reading Width Control
- Center text with configurable margins (like Typora/iA Writer)
- Adjustable line width (40-100 characters)
- Optional: Hide sidebar when focus mode active
- Smooth animations on enter/exit

#### 1.4 Distraction-Free Elements
- Hide file explorer
- Hide status bar (optional)
- Hide ribbon (optional)
- Fullscreen mode integration
- Minimal UI with just text

**Implementation Approach**:
```typescript
interface FocusModeSettings {
  enabled: boolean;
  hideMarkdownSyntax: boolean;
  dimNonActiveParagraphs: boolean;
  dimOpacity: number; // 0.1-0.9
  activeZone: 'sentence' | 'paragraph' | 'section';
  centerText: boolean;
  lineWidth: number; // characters
  hideUI: {
    explorer: boolean;
    statusBar: boolean;
    ribbon: boolean;
  };
}

class FocusModeManager {
  - Apply CSS classes for dimming
  - Track active paragraph position
  - Handle keyboard shortcuts (toggle focus mode)
  - Integrate with workspace layout
}
```

**Technical Considerations**:
- Use CSS filters for dimming (performance-friendly)
- CodeMirror decorations for active zone highlighting
- Workspace API for hiding/showing UI elements
- State persistence across sessions

**User Experience**:
- Command: "Toggle Focus Mode" (`Ctrl/Cmd+Shift+F`)
- Smooth fade-in/out animations
- Visual indicator when focus mode is active
- Quick settings panel for on-the-fly adjustments

**Estimated Effort**: Medium (2-3 days)

---

### 2. Manuscript Statistics Panel ⭐⭐⭐⭐⭐

**Problem**: Book writers need comprehensive statistics to track progress, ensure consistency, and meet publisher requirements.

**Solution**: A dedicated statistics panel/modal providing real-time manuscript metrics with historical tracking.

**Features**:

#### 2.1 Word Count Analytics
- **Total word count**: Excluding LaTeX/Pandoc syntax
- **Section-level counts**: By chapter, section, subsection
- **Target tracking**: Set goals, show progress bars
- **Daily word count**: Track writing velocity
- **Session statistics**: Words written in current session
- **Estimated reading time**: Based on average reading speed

#### 2.2 Citation & Reference Metrics
- **Citation count**: Total unique citations
- **Citation distribution**: Citations per chapter/section
- **Most cited sources**: Top 10 referenced works
- **Uncited bibliography entries**: Find unused .bib entries
- **Citation style consistency**: Detect mixed styles
- **Footnote count**: Total and per-section

#### 2.3 Structural Metrics
- **Figure count**: Total figures and per-chapter
- **Table count**: Total tables and per-chapter
- **Equation count**: Numbered equations
- **Index entries**: Total and by category
- **Section count**: Chapters, sections, subsections
- **Heading depth analysis**: Check for inconsistent nesting

#### 2.4 Content Analysis
- **Paragraph count**: Average words per paragraph
- **Sentence count**: Average words per sentence
- **Readability scores**: Flesch-Kincaid, Coleman-Liau
- **Vocabulary richness**: Unique words / total words
- **Passive voice detection**: Highlight passive constructions
- **Adverb frequency**: Find overused adverbs

#### 2.5 Progress Tracking
- **Historical data**: Store daily word counts
- **Visualization**: Charts showing writing progress over time
- **Milestone tracking**: Mark chapter completions
- **Writing streaks**: Days written consecutively
- **Export data**: CSV/JSON for external analysis
- **Goal reminders**: Notifications for daily targets

#### 2.6 Comparison View
- **Compare versions**: Word count changes between commits
- **Section comparisons**: See which sections grew/shrank
- **Citation changes**: New/removed citations

**Implementation Approach**:
```typescript
interface ManuscriptStats {
  wordCount: {
    total: number;
    bySection: Record<string, number>;
    excludingQuotes: number;
    session: number;
    today: number;
  };
  citations: {
    total: number;
    unique: number;
    bySection: Record<string, number>;
    topCited: Array<{key: string; count: number}>;
    uncited: string[];
  };
  structure: {
    chapters: number;
    sections: number;
    figures: number;
    tables: number;
    equations: number;
    indexEntries: number;
  };
  readability: {
    fleschKincaid: number;
    avgWordsPerSentence: number;
    avgWordsPerParagraph: number;
  };
  progress: {
    targetWords: number;
    percentComplete: number;
    estimatedCompletion: Date;
  };
}

class StatsPanel extends ItemView {
  - Real-time stat calculation
  - Historical data storage
  - Chart rendering (Chart.js or similar)
  - Export functionality
}
```

**UI Design**:
- **Left sidebar panel** (like Outline or File Explorer)
- **Tabbed interface**: Overview, Details, History, Goals
- **Collapsible sections**: Expand/collapse stat categories
- **Click to navigate**: Jump to sections from stats
- **Refresh button**: Manual recalculation
- **Auto-update**: Recalculate on save or timer

**Data Storage**:
```typescript
// Store in plugin data
interface StatsHistory {
  [date: string]: {
    wordCount: number;
    citationCount: number;
    sessionDuration: number;
  };
}
```

**Estimated Effort**: High (4-5 days)

---

### 3. Export Profiles ⭐⭐⭐⭐

**Problem**: Writers need different concealment settings for different tasks (editing vs. reviewing math vs. checking citations), and switching manually is tedious.

**Solution**: Savable, switchable profiles that store complete plugin configurations for different workflows.

**Features**:

#### 3.1 Profile Management
- **Create profiles**: Save current settings with a name
- **Load profiles**: Instantly switch to saved configuration
- **Default profiles**: Ship with 5-6 common presets
- **Edit profiles**: Modify and re-save profiles
- **Delete profiles**: Remove unused profiles
- **Import/Export**: Share profiles as JSON files

#### 3.2 Preset Profiles (Shipped by Default)
1. **"Full Concealment"**: All groups enabled (default)
2. **"Math Review"**: Only math visible, everything else concealed
3. **"Citation Check"**: Only citations visible, perfect for bibliography review
4. **"Clean Prose"**: All syntax hidden + focus mode enabled
5. **"Technical Edit"**: All syntax visible, no concealment
6. **"Figure Review"**: Hide text markup, show figure references
7. **"Index Building"**: Only index entries visible

#### 3.3 Profile Properties
Each profile stores:
```typescript
interface ConcealerProfile {
  id: string;
  name: string;
  description: string;
  icon?: string; // emoji or icon name
  settings: {
    enabled: boolean;
    groups: {
      mathDelimiters: boolean;
      citations: boolean;
      latexCommands: boolean;
      pandocMarkup: boolean;
      indexingMeta: boolean;
    };
    cursorReveal: Partial<CursorRevealSettings>;
    focusMode?: Partial<FocusModeSettings>;
  };
  hotkey?: string; // optional keyboard shortcut
  createdAt: number;
  modifiedAt: number;
}
```

#### 3.4 Quick Switcher UI
- **Status bar dropdown**: Click to see profile list
- **Command palette**: "Switch to Profile: [name]"
- **Hotkeys**: Assign keyboard shortcuts to profiles
- **Quick toggle**: Cycle through favorite profiles
- **Visual indicator**: Show active profile name in status bar

#### 3.5 Workflow Integration
- **Per-file profiles**: Store preferred profile in frontmatter
- **Folder profiles**: Auto-apply profile based on folder
- **Time-based profiles**: Auto-switch at specific times
- **Activity profiles**: Different profiles for writing vs. reviewing

**Implementation Approach**:
```typescript
class ProfileManager {
  profiles: ConcealerProfile[];
  activeProfile: string;
  
  createProfile(name: string, settings: Partial<PluginSettings>): void;
  loadProfile(id: string): void;
  deleteProfile(id: string): void;
  exportProfile(id: string): string; // JSON
  importProfile(json: string): void;
  
  // Apply profile settings to plugin
  applyProfile(profile: ConcealerProfile): void;
}

// Status bar dropdown component
class ProfileDropdown {
  render(): HTMLElement;
  onProfileSelect(id: string): void;
}
```

**Storage**:
```typescript
// In plugin data file
{
  profiles: ConcealerProfile[],
  activeProfileId: string,
  defaultProfile: string
}
```

**UI Components**:
1. **Settings tab section**: "Profiles"
   - List of profiles with edit/delete buttons
   - "Create New Profile" button
   - "Import Profile" button

2. **Profile editor modal**:
   - Name input
   - Description textarea
   - Icon picker
   - Settings toggles (mirroring main settings)
   - Hotkey assignment
   - Save/Cancel buttons

3. **Status bar integration**:
   - Profile name display
   - Dropdown icon
   - Click to show profile menu
   - Hover to show profile description

**Estimated Effort**: Medium (3-4 days)

---

### 4. Smart Citation Preview on Hover ⭐⭐⭐⭐

**Problem**: When citations are concealed as `[smith2020]`, writers lose context about what the reference actually is, requiring them to check the bibliography file.

**Solution**: Hover tooltips that display full bibliographic information for citations, with quick actions for common tasks.

**Features**:

#### 4.1 Citation Detection & Parsing
- Detect Pandoc citation syntax: `[@key]`, `@key`, `[-@key]`
- Extract citation key(s) from multi-citations: `[@a; @b; @c]`
- Handle locators: `[@smith2020, pp. 12-15]`
- Support all Pandoc citation variants

#### 4.2 Bibliography Lookup
- **Auto-discover bibliography files**: 
  - From YAML frontmatter: `bibliography: refs.bib`
  - From folder: Search for `.bib` files in vault
  - From settings: User-specified bibliography paths
- **Parse .bib files**: Support BibTeX/BibLaTeX format
- **Cache parsed data**: Avoid re-parsing on every hover
- **Handle multiple bibliography files**: Merge entries

#### 4.3 Hover Tooltip Display
- **Formatted citation**: Show in APA, Chicago, MLA, or custom style
- **Entry type**: Book, Article, InProceedings, etc.
- **Key fields**:
  - Authors/Editors
  - Title
  - Year
  - Publisher/Journal
  - DOI/URL (if available)
- **Additional metadata**: Tags, keywords, abstract (expandable)
- **Visual styling**: Themed to match Obsidian

#### 4.4 Quick Actions
- **Copy citation key**: One-click copy to clipboard
- **Copy formatted citation**: Copy in selected style
- **Open in Zotero**: Launch Zotero with this entry (if integration available)
- **Open DOI/URL**: Click to open in browser
- **Edit .bib entry**: Jump to entry in .bib file
- **Find other citations**: Show all uses of this citation in vault

#### 4.5 Visual Indicators
- **Citation status markers**:
  - ✅ Green dot: Citation found in bibliography
  - ⚠️ Yellow dot: Citation key not found
  - 🔗 Blue dot: Citation has URL/DOI
- **Inline suggestions**: Underline undefined citations
- **Color coding**: Different colors for different entry types

#### 4.6 Citation Style Selection
- **Built-in styles**: APA, Chicago, MLA, Harvard
- **CSL support**: Load custom Citation Style Language files
- **Per-profile styles**: Different styles for different profiles
- **Preview in tooltip**: See citation in multiple styles

**Implementation Approach**:
```typescript
// BibTeX parser
class BibliographyManager {
  private entries: Map<string, BibEntry>;
  private bibliographyFiles: string[];
  
  async loadBibliography(files: string[]): Promise<void>;
  parseBibTeX(content: string): Map<string, BibEntry>;
  getCitation(key: string): BibEntry | undefined;
  formatCitation(entry: BibEntry, style: CitationStyle): string;
}

interface BibEntry {
  key: string;
  type: string; // article, book, inproceedings, etc.
  fields: {
    author?: string;
    title: string;
    year?: string;
    journal?: string;
    publisher?: string;
    doi?: string;
    url?: string;
    [key: string]: any;
  };
}

// CodeMirror extension for hover
class CitationHoverPlugin {
  // Detect citation under cursor
  getCitationAtPos(view: EditorView, pos: number): string | null;
  
  // Show tooltip
  showCitationTooltip(citation: BibEntry, pos: number): void;
  
  // Handle quick actions
  onCopyKey(key: string): void;
  onOpenUrl(url: string): void;
}

// Tooltip widget
class CitationTooltip extends WidgetType {
  render(entry: BibEntry, style: CitationStyle): HTMLElement;
  renderQuickActions(): HTMLElement;
}
```

**UI Design**:
```html
<!-- Tooltip structure -->
<div class="citation-tooltip">
  <div class="citation-header">
    <span class="citation-type">Article</span>
    <span class="citation-key">smith2020</span>
  </div>
  <div class="citation-content">
    <div class="citation-formatted">
      Smith, J. (2020). Title of Article. <em>Journal Name</em>, 12(3), 45-67.
    </div>
    <div class="citation-fields">
      <div class="citation-field">
        <strong>DOI:</strong> <a href="...">10.1234/example</a>
      </div>
    </div>
  </div>
  <div class="citation-actions">
    <button class="copy-key">Copy Key</button>
    <button class="copy-formatted">Copy Citation</button>
    <button class="open-url">Open DOI</button>
  </div>
</div>
```

**Integration with Obsidian Citations Plugin**:
- Detect if Citations plugin is installed
- Use its bibliography data if available
- Provide fallback parser if not installed
- Compatible with Zotero integration

**Settings**:
```typescript
interface CitationPreviewSettings {
  enabled: boolean;
  citationStyle: 'apa' | 'chicago' | 'mla' | 'harvard' | 'custom';
  customCSLPath?: string;
  showQuickActions: boolean;
  showStatusIndicators: boolean;
  hoverDelay: number; // ms
  bibliographyPaths: string[]; // manual paths to .bib files
  autoDiscoverBibliography: boolean;
  cacheEnabled: boolean;
}
```

**Estimated Effort**: High (5-6 days, includes BibTeX parser)

---

### 5. Cross-Reference Intelligence ⭐⭐⭐

**Problem**: Managing `\label{}` and `\ref{}` in long manuscripts is error-prone. Writers create undefined references, orphaned labels, and inconsistent naming.

**Solution**: Intelligent cross-reference management with auto-completion, validation, navigation, and refactoring support.

**Features**:

#### 5.1 Label Indexing
- **Scan document(s)**: Find all `\label{key}` commands
- **Categorize labels**: By type (section, figure, table, equation)
- **Extract context**: Store surrounding text for context
- **Multi-file support**: Index across entire vault
- **Real-time updates**: Update index on document changes
- **Cache management**: Persistent index for performance

#### 5.2 Auto-Completion
- **Trigger**: Type `\ref{` or `\eqref{` or `\cref{`
- **Suggestion list**: Show all available labels
- **Fuzzy search**: Filter labels as you type
- **Contextual suggestions**: Prioritize nearby labels
- **Type filtering**: Show only relevant label types
  - `\ref{}` → all labels
  - `\eqref{}` → only equation labels
  - `\figref{}` → only figure labels
- **Preview**: Show label definition in tooltip
- **Insert with Tab/Enter**: Complete the reference

#### 5.3 Reference Validation
- **Detect undefined references**: `\ref{missing-label}`
- **Visual indicators**:
  - ❌ Red underline for undefined refs
  - ✅ Green/normal for valid refs
  - ⚠️ Yellow for duplicate labels
- **Warning panel**: List all issues in sidebar
- **Quick fixes**: "Create label", "Jump to similar label"
- **Validation on save**: Check before committing
- **Batch validation**: Check entire vault

#### 5.4 Navigation
- **Ctrl/Cmd+Click**: Jump from `\ref{}` to `\label{}`
- **Bidirectional**: From label, see all references
- **Breadcrumb trail**: Show navigation history
- **"Go to Definition"**: Command palette action
- **"Find All References"**: Show all uses of a label
- **Peek definition**: Inline preview without jumping

#### 5.5 Rename Refactoring
- **Rename label**: Update label and all references
- **Smart suggestions**: Generate semantic label names
  - `\section{Introduction}` → suggest `sec:introduction`
  - `\begin{figure}` → suggest `fig:descriptive-name`
- **Preview changes**: Show all affected locations
- **Undo support**: Revert rename operation
- **Scope selection**: Rename in current file or vault-wide

#### 5.6 Label Generation
- **Auto-suggest labels**: Based on content
  - Section title: `sec:title-slugified`
  - Figure caption: `fig:caption-keywords`
  - Equation: `eq:physics-name` or `eq:chapter-number`
- **Numbering schemes**: Auto-increment labels
  - `sec:intro-1`, `sec:intro-2`, etc.
- **Prefix management**: Enforce consistent prefixes
  - Sections: `sec:`
  - Figures: `fig:`
  - Tables: `tab:`
  - Equations: `eq:`
- **Quick insert**: Command to add label at cursor

#### 5.7 Label Browser
- **Sidebar panel**: "Cross-References"
- **Tree view**: Group by type and location
- **Search/filter**: Find specific labels
- **Usage count**: Show how many times each label is referenced
- **Orphan detection**: Find labels with zero references
- **Click to navigate**: Jump to label definition
- **Context menu**: Rename, delete, copy label key

**Implementation Approach**:
```typescript
// Label index
interface LabelEntry {
  key: string;
  type: 'section' | 'figure' | 'table' | 'equation' | 'other';
  file: string;
  line: number;
  context: string; // surrounding text
  references: Array<{file: string; line: number}>;
}

class CrossRefManager {
  private labels: Map<string, LabelEntry>;
  
  // Indexing
  async indexVault(): Promise<void>;
  async indexFile(file: TFile): Promise<void>;
  extractLabels(content: string): LabelEntry[];
  
  // Validation
  validateReferences(content: string): ReferenceIssue[];
  findUndefinedRefs(): Array<{file: string; ref: string}>;
  findOrphanedLabels(): LabelEntry[];
  findDuplicateLabels(): Array<LabelEntry[]>;
  
  // Auto-completion
  getSuggestions(prefix: string, refType?: string): LabelEntry[];
  
  // Navigation
  jumpToLabel(labelKey: string): void;
  findReferences(labelKey: string): Array<{file: string; line: number}>;
  
  // Refactoring
  renameLabel(oldKey: string, newKey: string): Promise<void>;
  generateLabel(context: string, type: string): string;
}

// CodeMirror auto-complete extension
class RefAutoComplete {
  provide(context: CompletionContext): CompletionResult | null;
  renderLabel(entry: LabelEntry): HTMLElement;
}

// Diagnostic provider for validation
class RefDiagnostics {
  provideDiagnostics(view: EditorView): Diagnostic[];
  createQuickFix(diagnostic: Diagnostic): CodeAction[];
}
```

**UI Components**:

1. **Auto-complete dropdown**:
```html
<div class="ref-completion-item">
  <span class="ref-type">eq</span>
  <span class="ref-key">eq:schrodinger</span>
  <span class="ref-context">Schrödinger equation</span>
  <span class="ref-location">line 42</span>
</div>
```

2. **Label browser panel**:
```html
<div class="label-browser">
  <input class="label-search" placeholder="Search labels..." />
  <div class="label-tree">
    <div class="label-category" data-type="section">
      <span class="category-icon">📑</span>
      <span class="category-name">Sections (12)</span>
      <div class="label-list">
        <div class="label-item">
          <span class="label-key">sec:intro</span>
          <span class="label-refs">3 refs</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

3. **Validation warnings**:
```typescript
// Diagnostic messages
{
  severity: 'error',
  message: 'Undefined reference: fig:missing',
  from: pos,
  to: pos + length,
  actions: [
    { name: 'Create label', apply: () => {...} },
    { name: 'Change to similar label', apply: () => {...} }
  ]
}
```

**Settings**:
```typescript
interface CrossRefSettings {
  enabled: boolean;
  autoComplete: boolean;
  validation: boolean;
  showIndicators: boolean;
  labelPrefixes: {
    section: 'sec:' | 'ch:' | string;
    figure: 'fig:' | string;
    table: 'tab:' | 'tbl:' | string;
    equation: 'eq:' | string;
  };
  autoGenerateLabels: boolean;
  indexScope: 'current-file' | 'current-folder' | 'entire-vault';
  validationOnSave: boolean;
}
```

**Estimated Effort**: Very High (7-8 days, complex feature)

---

## 🎯 Priority Tier 2: High Value Add-ons

### 6. Chapter/Section Navigation Panel

**Problem**: Navigating large manuscripts with many chapters and sections.

**Solution**: Hierarchical navigation tree with jump-to functionality.

**Key Features**:
- Parse document structure (`\chapter{}`, `\section{}`, markdown headings)
- Tree view with expand/collapse
- Word count per section
- Click to jump to section
- Drag-to-reorder (advanced)
- Minimap visualization

**Estimated Effort**: Medium (3-4 days)

---

### 7. LaTeX Math Preview

**Problem**: Complex math equations are hard to read even with concealment.

**Solution**: Render LaTeX math with MathJax/KaTeX on hover or inline.

**Key Features**:
- Detect math environments
- Render with MathJax/KaTeX
- Hover tooltip or inline widget
- Click to toggle source/rendered
- Export rendered equations as images
- Copy rendered output

**Estimated Effort**: Medium-High (4-5 days)

---

### 8. Smart Template Snippets

**Problem**: Repeatedly typing LaTeX structures is tedious.

**Solution**: Quick-insert templates for common patterns.

**Key Features**:
- Predefined templates (figure, table, equation, citation block)
- Custom template editor
- Smart placeholders with tab stops
- Auto-generate labels
- Variable interpolation (e.g., `{{DATE}}`, `{{CHAPTER}}`)
- Template library sharing

**Estimated Effort**: Medium (3 days)

---

## 🔧 Priority Tier 3: Advanced Features

### 9. Pandoc Preview Integration

**Problem**: Want to see final output without leaving Obsidian.

**Key Features**:
- Live preview panel with Pandoc rendering
- Side-by-side view
- Multiple format support (PDF, HTML, DOCX)
- Sync scrolling
- Custom Pandoc templates
- Error display

**Estimated Effort**: Very High (8-10 days)

---

### 10. Bibliography Management

**Problem**: Managing citations across files and finding unused entries.

**Key Features**:
- Citation key search
- Unused citation detection
- Citation graph visualization
- Zotero integration
- BibTeX file editing
- Citation count analytics

**Estimated Effort**: High (5-6 days, overlaps with citation preview)

---

### 11. Figure/Table Manager

**Problem**: Tracking figures and tables across manuscript.

**Key Features**:
- Gallery view of all figures
- Table of figures/tables generator
- Caption editing
- Auto-renumbering
- Missing file detection
- Thumbnail generation

**Estimated Effort**: High (5-6 days)

---

### 12. Index Assistant

**Problem**: Building comprehensive indexes is tedious.

**Key Features**:
- Index entry browser
- Hierarchical view (main/sub entries)
- Duplicate detection
- AI/ML-based term suggestions
- Preview final index
- Export index

**Estimated Effort**: Very High (7-8 days)

---

### 13. Customizable Concealment Rules

**Problem**: Every author has unique patterns to hide.

**Key Features**:
- Visual rule builder (no regex needed)
- Pattern tester with live preview
- Community pattern library
- Import/export rules
- Per-folder rules
- Conditional rules (e.g., only in certain sections)

**Estimated Effort**: Medium-High (4-5 days)

---

### 14. Performance Dashboard

**Problem**: Large manuscripts can slow down editor.

**Key Features**:
- Real-time performance metrics
- Decoration count display
- Render time tracking
- Memory usage monitor
- Optimization suggestions
- Performance profiling mode

**Estimated Effort**: Medium (3 days)

---

### 15. Collaboration Mode

**Problem**: Different collaborators need different settings.

**Key Features**:
- Per-file settings in frontmatter
- Shared profile configs in repo
- Comment/annotation visibility
- Track changes visualization
- User-specific overrides
- Conflict resolution

**Estimated Effort**: High (6-7 days)

---

## 📊 Feature Prioritization Matrix

| Feature | Impact | Effort | Priority | Dependencies |
|---------|--------|--------|----------|--------------|
| Focus Mode | Very High | Medium | 1 | None |
| Manuscript Stats | Very High | High | 2 | None |
| Export Profiles | High | Medium | 3 | None |
| Citation Preview | Very High | High | 4 | BibTeX parser |
| Cross-Ref Intelligence | High | Very High | 5 | Label indexing |
| Chapter Navigation | Medium | Medium | 6 | None |
| Math Preview | Medium | Medium-High | 7 | MathJax/KaTeX |
| Template Snippets | Medium | Medium | 8 | None |
| Pandoc Preview | High | Very High | 9 | Pandoc binary |
| Bibliography Mgmt | Medium | High | 10 | Citation Preview |
| Figure Manager | Medium | High | 11 | None |
| Index Assistant | Medium | Very High | 12 | NLP/ML |
| Custom Rules | Medium | Medium-High | 13 | None |
| Performance Dashboard | Low | Medium | 14 | None |
| Collaboration Mode | Medium | High | 15 | Profiles |

---

## 🚀 Recommended Development Phases

### **Phase 2A** (Weeks 6-7): Writer Experience
1. Focus Mode / Zen Mode
2. Export Profiles
3. Template Snippets

**Goal**: Dramatically improve the writing experience

### **Phase 2B** (Weeks 8-9): Analytics & Progress
1. Manuscript Statistics Panel
2. Chapter/Section Navigation

**Goal**: Help writers track and manage their progress

### **Phase 2C** (Weeks 10-12): Academic Features
1. Smart Citation Preview
2. Cross-Reference Intelligence
3. Math Preview

**Goal**: Support academic/technical writing workflows

### **Phase 2D** (Weeks 13-14): Advanced Tools
1. Bibliography Management
2. Figure/Table Manager

**Goal**: Complete the book-writing toolkit

### **Phase 2E** (Future): Power Features
1. Pandoc Preview Integration
2. Index Assistant
3. Collaboration Mode

**Goal**: Advanced features for power users

---

## 💡 Innovation Opportunities

### AI/ML Integration
- **Smart citation suggestions**: Based on context
- **Index term extraction**: NLP-based important term detection
- **Writing style analysis**: Consistency checking
- **Automated cross-reference**: Suggest where to add references

### Cloud Sync
- **Settings sync**: Across devices
- **Statistics sync**: Combined writing stats
- **Profile sharing**: Team collaboration

### Mobile Support
- **Simplified mobile UI**: Focus on statistics
- **Reading mode**: Optimized concealment for mobile
- **Voice writing**: Dictation with auto-formatting

---

## 📚 Research & Inspiration

**Similar Tools to Study**:
- Scrivener (manuscript organization)
- Ulysses (distraction-free writing)
- Typora (clean markdown editing)
- Zettlr (academic writing)
- Overleaf (collaborative LaTeX)
- TeXstudio (LaTeX IDE features)
- Pandoc Scholar (academic workflows)

**Obsidian Plugins to Reference**:
- Better Word Count
- Obsidian Outliner
- Focus Mode
- Obsidian Citations
- Dataview (for statistics querying)
- Kanban (for progress tracking)

---

## 🎯 Success Metrics for Phase 2

**User Engagement**:
- 50%+ of users enable Focus Mode
- Average 5+ profile switches per day
- Statistics panel opened daily

**User Satisfaction**:
- 4.5+ star rating maintained
- Feature requests for Phase 3
- Community contributions (templates, profiles)

**Performance**:
- No degradation with new features
- <100ms for statistics calculation
- <50ms for citation preview display

---

## 📝 Next Steps

1. **Validate priorities** with target users (book writers, academics)
2. **Create detailed PRD** for Phase 2A features
3. **Design UI mockups** for major features
4. **Prototype** Focus Mode to test performance impact
5. **Plan testing strategy** for each feature

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-25  
**Status**: Planning Phase  
**Target Start**: After Phase 1 stabilization and community feedback
