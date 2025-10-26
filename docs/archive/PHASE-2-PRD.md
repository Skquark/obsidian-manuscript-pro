# Product Requirements Document: Phase 2 Enhancements

**Plugin**: LaTeX-Pandoc Concealer  
**Version**: 0.2.0  
**Phase**: 2 (Book Writer Toolkit)  
**Status**: Planning  
**Created**: 2025-10-25

---

## Executive Summary

Phase 2 transforms LaTeX-Pandoc Concealer from a syntax concealer into a comprehensive book writing toolkit. This PRD covers the top 5 highest-impact features identified for implementation:

1. **Focus Mode / Zen Mode** - Distraction-free writing environment
2. **Manuscript Statistics Panel** - Comprehensive progress tracking and analytics
3. **Export Profiles** - Quick-switch settings configurations for different workflows
4. **Smart Citation Preview on Hover** - Contextual bibliography information
5. **Cross-Reference Intelligence** - Intelligent label/ref management with validation

**Timeline**: 4-6 weeks  
**Target Users**: Book authors, academic writers, technical writers, researchers  
**Dependencies**: Phase 1 (Core Concealment) must be complete and stable

---

## Phase 2 Goals

### Primary Goals
1. **Enhance writing productivity** through distraction-free environments
2. **Provide actionable insights** via comprehensive manuscript statistics
3. **Streamline context switching** with workflow-based profiles
4. **Reduce cognitive load** by showing citation context on demand
5. **Prevent errors** through intelligent cross-reference management

### Success Metrics
- 70%+ user activation of at least one Phase 2 feature
- 4.5+ star average rating maintained
- <5% performance degradation from Phase 1
- 50%+ reduction in reference errors (user reported)
- 30%+ increase in writing session duration (indicates better flow)

---

## Feature 1: Focus Mode / Zen Mode

### Overview
A distraction-free writing environment that removes visual clutter beyond LaTeX/Pandoc concealment, enabling deep focus on prose composition.

### User Stories

**As a book author**, I want to hide all markdown syntax when writing so that I can focus purely on my prose without visual distractions.

**As a novelist**, I want to dim everything except my current paragraph so that I maintain better focus on the sentence I'm composing.

**As a technical writer**, I want to center my text with comfortable margins so that my writing environment feels more like a published page.

### Functional Requirements

#### FR1.1: Markdown Syntax Concealment
- **FR1.1.1**: Hide markdown heading markers (`#`, `##`, `###`) while preserving heading text
- **FR1.1.2**: Hide horizontal rules (`---`, `***`, `___`)
- **FR1.1.3**: Hide list markers (`-`, `*`, `+`, `1.`, `a.`)
- **FR1.1.4**: Hide blockquote markers (`>`)
- **FR1.1.5**: Optional: Hide inline code backticks (`` ` ``)
- **FR1.1.6**: Preserve emphasized text visibility (`**bold**`, `*italic*`)
- **FR1.1.7**: Apply rules only in Live Preview mode

#### FR1.2: Typewriter Mode Enhancement
- **FR1.2.1**: Dim non-active text with configurable opacity (0.1-0.9, default 0.3)
- **FR1.2.2**: Define "active zone": sentence, paragraph, or section
- **FR1.2.3**: Smooth opacity transitions when cursor moves (200ms fade)
- **FR1.2.4**: Optional background highlight for active zone
- **FR1.2.5**: Respect Obsidian's built-in typewriter scroll mode if enabled

#### FR1.3: Reading Width Control
- **FR1.3.1**: Center editor content with configurable margins
- **FR1.3.2**: Adjustable line width: 40-120 characters (default 80)
- **FR1.3.3**: Smooth animation on enable/disable (300ms)
- **FR1.3.4**: Responsive to window resizing
- **FR1.3.5**: Preserve line width across sessions

#### FR1.4: UI Minimization
- **FR1.4.1**: Optional: Auto-hide file explorer when Focus Mode enabled
- **FR1.4.2**: Optional: Hide status bar
- **FR1.4.3**: Optional: Hide ribbon (left sidebar)
- **FR1.4.4**: Optional: Enter fullscreen mode
- **FR1.4.5**: Restore UI state when Focus Mode disabled

#### FR1.5: Commands & Shortcuts
- **FR1.5.1**: Command: "Toggle Focus Mode"
- **FR1.5.2**: Default hotkey: `Ctrl/Cmd+Shift+Z`
- **FR1.5.3**: Command: "Toggle Typewriter Dimming"
- **FR1.5.4**: Command: "Toggle Reading Width"
- **FR1.5.5**: Visual indicator in status bar when Focus Mode active

### Technical Specifications

#### Implementation Architecture
```typescript
// Settings interface
interface FocusModeSettings {
  enabled: boolean;
  
  // Markdown concealment
  hideMarkdownSyntax: boolean;
  hideHeadingMarkers: boolean;
  hideListMarkers: boolean;
  hideBlockquoteMarkers: boolean;
  hideInlineCode: boolean;
  
  // Typewriter mode
  typewriterMode: boolean;
  activeZone: 'sentence' | 'paragraph' | 'section';
  dimOpacity: number; // 0.1-0.9
  highlightActive: boolean;
  highlightColor: string;
  
  // Reading width
  centerText: boolean;
  lineWidth: number; // characters
  
  // UI minimization
  hideExplorer: boolean;
  hideStatusBar: boolean;
  hideRibbon: boolean;
  fullscreen: boolean;
}

// Core manager class
class FocusModeManager {
  private plugin: LatexPandocConcealerPlugin;
  private activeElement: HTMLElement | null;
  private uiState: {
    explorerVisible: boolean;
    statusBarVisible: boolean;
    ribbonVisible: boolean;
  };
  
  enable(): void;
  disable(): void;
  toggle(): void;
  
  // Markdown concealment via CSS
  applyMarkdownConcealment(): void;
  
  // Typewriter dimming via decorations
  updateActiveZone(view: EditorView): void;
  dimInactiveText(): void;
  
  // Reading width via CSS
  applyCenteredLayout(): void;
  
  // UI management
  hideUIElements(): void;
  restoreUIElements(): void;
}
```

#### CodeMirror Integration
```typescript
// View plugin for typewriter dimming
const focusModePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    
    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    
    update(update: ViewUpdate) {
      if (update.selectionSet || update.docChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    
    buildDecorations(view: EditorView): DecorationSet {
      const settings = getFocusModeSettings();
      if (!settings.typewriterMode) return Decoration.none;
      
      const activeZone = this.getActiveZone(view, settings.activeZone);
      return this.dimNonActiveText(view, activeZone);
    }
    
    getActiveZone(view: EditorView, zone: string): {from: number, to: number};
    dimNonActiveText(view: EditorView, active: {from: number, to: number}): DecorationSet;
  },
  {decorations: v => v.decorations}
);
```

#### CSS Styling
```css
/* Markdown concealment */
.focus-mode .cm-header-mark,
.focus-mode .cm-list-marker,
.focus-mode .cm-quote,
.focus-mode .cm-hr {
  display: none;
}

/* Centered reading width */
.focus-mode-centered .cm-content {
  max-width: var(--focus-line-width);
  margin: 0 auto;
  transition: max-width 300ms ease;
}

/* Dimmed text */
.focus-mode-dim {
  opacity: var(--focus-dim-opacity);
  transition: opacity 200ms ease;
}

/* Active zone highlight */
.focus-mode-active {
  background-color: var(--focus-highlight-color);
  border-radius: 4px;
  padding: 2px 4px;
}
```

### UI/UX Requirements

#### Settings Panel
- **Location**: Settings → LaTeX-Pandoc Concealer → Focus Mode
- **Layout**: Collapsible section with subsections
- **Grouping**:
  - Markdown Concealment (toggles)
  - Typewriter Mode (toggle + sliders)
  - Reading Width (toggle + slider)
  - UI Minimization (toggles)

#### Visual Indicators
- **Status bar icon**: 🎯 when Focus Mode active
- **Tooltip**: "Focus Mode: Active (Zen Mode enabled)"
- **Smooth animations**: All transitions use easing functions

#### User Feedback
- **Notice on toggle**: "Focus Mode enabled" / "Focus Mode disabled"
- **Settings validation**: Line width capped at reasonable limits
- **Conflict detection**: Warn if conflicts with other plugins detected

### Performance Requirements
- **Decoration update**: <10ms when cursor moves
- **CSS application**: <5ms for layout changes
- **Memory overhead**: <5MB additional
- **Smooth scrolling**: Maintain 60 FPS

### Testing Requirements

#### Unit Tests
- Markdown pattern matching accuracy
- Active zone calculation (sentence, paragraph, section)
- CSS class application logic
- Settings persistence

#### Integration Tests
- Focus Mode enable/disable workflow
- UI state save/restore
- Interaction with Phase 1 concealment
- Multi-file switching behavior

#### Manual Testing
- Test on various document sizes (1-1000 pages)
- Verify smooth animations
- Check with different Obsidian themes
- Test with other plugins (Outliner, Sliding Panes, etc.)

---

## Feature 2: Manuscript Statistics Panel

### Overview
A comprehensive analytics dashboard providing real-time manuscript metrics, progress tracking, and actionable insights for book writers.

### User Stories

**As a book author**, I want to see my total word count excluding LaTeX syntax so that I know my true manuscript length.

**As an academic writer**, I want to track citations per chapter so that I can ensure balanced sourcing across my dissertation.

**As a novelist**, I want to see my daily word count progress so that I can maintain my writing goals and streaks.

### Functional Requirements

#### FR2.1: Word Count Analytics
- **FR2.1.1**: Calculate total word count excluding all LaTeX/Pandoc syntax
- **FR2.1.2**: Calculate word count per section (chapter, section, subsection)
- **FR2.1.3**: Track session word count (words written since file opened)
- **FR2.1.4**: Track daily word count with historical data
- **FR2.1.5**: Calculate estimated reading time (250 words/min average)
- **FR2.1.6**: Support target word count with progress bars

#### FR2.2: Citation & Reference Metrics
- **FR2.2.1**: Count total citations in document
- **FR2.2.2**: Count unique citation keys
- **FR2.2.3**: Show citation distribution by section
- **FR2.2.4**: List most-cited sources (top 10)
- **FR2.2.5**: Detect uncited bibliography entries (if .bib available)
- **FR2.2.6**: Count footnotes (total and per-section)

#### FR2.3: Structural Metrics
- **FR2.3.1**: Count chapters, sections, subsections
- **FR2.3.2**: Count figures and tables
- **FR2.3.3**: Count numbered equations
- **FR2.3.4**: Count index entries
- **FR2.3.5**: Analyze heading depth (warn if too deep)
- **FR2.3.6**: Calculate average section length

#### FR2.4: Content Analysis
- **FR2.4.1**: Count paragraphs and calculate average words/paragraph
- **FR2.4.2**: Count sentences and calculate average words/sentence
- **FR2.4.3**: Calculate Flesch-Kincaid readability score
- **FR2.4.4**: Calculate vocabulary richness (unique/total ratio)
- **FR2.4.5**: Optional: Detect passive voice constructions
- **FR2.4.6**: Optional: Highlight overused words/phrases

#### FR2.5: Progress Tracking
- **FR2.5.1**: Store daily word counts in persistent data
- **FR2.5.2**: Visualize progress with line/bar charts
- **FR2.5.3**: Track writing streaks (consecutive days written)
- **FR2.5.4**: Set and track milestone goals (e.g., "50,000 words by Dec 31")
- **FR2.5.5**: Export historical data as CSV/JSON
- **FR2.5.6**: Optional: Daily writing reminders

#### FR2.6: Comparison & Analysis
- **FR2.6.1**: Compare sections (e.g., which chapters need expansion)
- **FR2.6.2**: Show writing velocity trends (words/day over time)
- **FR2.6.3**: Highlight outlier sections (too short/long)
- **FR2.6.4**: Optional: Compare with previous versions (if git available)

### Technical Specifications

#### Data Models
```typescript
interface ManuscriptStats {
  timestamp: number;
  
  wordCount: {
    total: number;
    excludingQuotes: number;
    bySection: SectionStats[];
    session: number;
    today: number;
    target?: number;
  };
  
  citations: {
    total: number;
    unique: number;
    bySection: Record<string, number>;
    topCited: Array<{key: string; count: number; title?: string}>;
    uncited?: string[];
    footnotes: number;
  };
  
  structure: {
    chapters: number;
    sections: number;
    subsections: number;
    figures: number;
    tables: number;
    equations: number;
    indexEntries: number;
    headingDepth: {max: number; avg: number};
  };
  
  content: {
    paragraphs: number;
    sentences: number;
    avgWordsPerParagraph: number;
    avgWordsPerSentence: number;
    readability: {
      fleschKincaid: number;
      grade: string;
    };
    vocabularyRichness: number;
  };
  
  readingTime: {
    minutes: number;
    formatted: string; // "2 hours 15 minutes"
  };
}

interface SectionStats {
  title: string;
  level: number; // 1=chapter, 2=section, etc.
  line: number;
  wordCount: number;
  citations: number;
  figures: number;
  tables: number;
}

interface StatsHistory {
  [date: string]: {
    wordCount: number;
    citationCount: number;
    sessionDuration: number; // minutes
  };
}
```

#### Core Calculator
```typescript
class StatsCalculator {
  private content: string;
  private settings: PluginSettings;
  
  constructor(content: string, settings: PluginSettings);
  
  // Main calculation
  calculateAll(): ManuscriptStats;
  
  // Word counting (exclude syntax)
  countWords(text: string): number;
  stripLatexPandoc(text: string): string;
  
  // Section parsing
  parseSections(): SectionStats[];
  
  // Citation analysis
  extractCitations(): string[];
  analyzeCitations(): CitationStats;
  
  // Structure analysis
  countStructuralElements(): StructureStats;
  
  // Readability
  calculateFleschKincaid(text: string): number;
  calculateVocabularyRichness(text: string): number;
}
```

#### UI Component
```typescript
class StatsPanel extends ItemView {
  getViewType(): string { return 'manuscript-stats'; }
  getDisplayText(): string { return 'Manuscript Statistics'; }
  
  async onOpen(): Promise<void> {
    this.renderPanel();
    this.startAutoRefresh();
  }
  
  renderPanel(): void {
    // Render tabs: Overview, Details, History, Goals
    this.renderOverviewTab();
    this.renderDetailsTab();
    this.renderHistoryTab();
    this.renderGoalsTab();
  }
  
  renderOverviewTab(): void {
    // Summary cards with key metrics
  }
  
  renderHistoryTab(): void {
    // Chart.js line chart of daily word counts
  }
  
  refresh(): void {
    // Recalculate stats and update UI
  }
  
  exportData(format: 'csv' | 'json'): void;
}
```

#### Charts Integration
```typescript
// Use Chart.js for visualizations
import { Chart } from 'chart.js';

class StatsChartRenderer {
  renderWordCountHistory(data: StatsHistory, canvas: HTMLCanvasElement): Chart;
  renderCitationDistribution(data: Record<string, number>, canvas: HTMLCanvasElement): Chart;
  renderSectionComparison(sections: SectionStats[], canvas: HTMLCanvasElement): Chart;
}
```

### UI/UX Requirements

#### Panel Layout
```
┌─────────────────────────────────────┐
│  Manuscript Statistics       [↻] [⚙]│
├─────────────────────────────────────┤
│  [Overview] [Details] [History] [Goals] │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐ ┌──────────┐ ┌─────┐│
│  │ 45,231   │ │ 127      │ │ 23  ││
│  │ Words    │ │ Citations│ │ Figs││
│  └──────────┘ └──────────┘ └─────┘│
│                                     │
│  Today: +1,243 words ██████ 62%    │
│                                     │
│  ▼ By Chapter                       │
│    Chapter 1: 5,432 words ████ 24% │
│    Chapter 2: 8,901 words ██████ 40%│
│    ...                              │
│                                     │
│  [Export Data]                      │
└─────────────────────────────────────┘
```

#### Visual Design
- **Cards**: Material design cards for key metrics
- **Progress bars**: Color-coded (green=on track, yellow=warning, red=behind)
- **Charts**: Clean, professional styling matching Obsidian theme
- **Icons**: Consistent iconography (📝 words, 📚 citations, 📊 figures)
- **Tooltips**: Hover for detailed breakdowns

#### Interactions
- **Click section**: Jump to that section in editor
- **Hover metric**: Show detailed calculation
- **Refresh button**: Manual recalculation
- **Export button**: Download CSV or JSON

### Performance Requirements
- **Calculation time**: <500ms for 100,000 word manuscript
- **UI render**: <100ms after calculation
- **Auto-refresh**: Every 30 seconds (configurable)
- **Memory**: <10MB for historical data

### Testing Requirements

#### Unit Tests
- Word counting accuracy (exclude LaTeX/Pandoc)
- Section parsing correctness
- Citation extraction and counting
- Readability calculation accuracy
- Historical data storage/retrieval

#### Integration Tests
- Stats panel open/close workflow
- Auto-refresh behavior
- Export functionality
- Chart rendering with various data sizes

#### Manual Testing
- Verify accuracy against manual counts
- Test with manuscripts of varying sizes (1K-500K words)
- Validate citation counting with complex citation patterns
- Check readability scores against online calculators

---

## Feature 3: Export Profiles

### Overview
Quick-switch configuration presets that allow writers to instantly change concealment settings for different workflows (editing, reviewing, proofreading).

### User Stories

**As a book author**, I want to save my "editing mode" settings and "review mode" settings so that I can switch between them with one click.

**As an academic writer**, I want a "citation check" profile that shows only citations so that I can review my bibliography easily.

**As a collaborative writer**, I want to share my profile settings with co-authors so that we have consistent editing environments.

### Functional Requirements

#### FR3.1: Profile Management
- **FR3.1.1**: Create new profile from current settings
- **FR3.1.2**: Load existing profile (apply settings instantly)
- **FR3.1.3**: Edit profile settings
- **FR3.1.4**: Delete profile
- **FR3.1.5**: Duplicate profile (create variant)
- **FR3.1.6**: Reset profile to defaults

#### FR3.2: Default Profiles
Ship with 6 predefined profiles:
- **FR3.2.1**: "Full Concealment" - All groups enabled (default Phase 1)
- **FR3.2.2**: "Math Review" - Only math visible, everything else concealed
- **FR3.2.3**: "Citation Check" - Only citations visible
- **FR3.2.4**: "Clean Prose" - All syntax + Focus Mode
- **FR3.2.5**: "Technical Edit" - No concealment, all syntax visible
- **FR3.2.6**: "Final Proofread" - Minimal concealment, readable but clean

#### FR3.3: Profile Properties
- **FR3.3.1**: Name (required, max 50 chars)
- **FR3.3.2**: Description (optional, max 200 chars)
- **FR3.3.3**: Icon (emoji or icon name)
- **FR3.3.4**: Settings snapshot (complete plugin settings)
- **FR3.3.5**: Optional hotkey assignment
- **FR3.3.6**: Timestamps (created, modified)

#### FR3.4: Quick Switcher UI
- **FR3.4.1**: Status bar dropdown menu
- **FR3.4.2**: Command palette commands: "Switch to Profile: [name]"
- **FR3.4.3**: Keyboard shortcuts (assignable per profile)
- **FR3.4.4**: Quick cycle command (rotate through profiles)
- **FR3.4.5**: Visual indicator of active profile

#### FR3.5: Import/Export
- **FR3.5.1**: Export profile as JSON file
- **FR3.5.2**: Import profile from JSON file
- **FR3.5.3**: Export all profiles
- **FR3.5.4**: Share URL (encode profile in base64)
- **FR3.5.5**: Validate imported profiles

#### FR3.6: Advanced Features
- **FR3.6.1**: Per-file profile preference (in frontmatter)
- **FR3.6.2**: Per-folder default profile
- **FR3.6.3**: Auto-apply profile based on time of day
- **FR3.6.4**: Profile activation history

### Technical Specifications

#### Data Models
```typescript
interface ConcealerProfile {
  id: string; // UUID
  name: string;
  description: string;
  icon: string; // emoji or Lucide icon name
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
    // Any other plugin settings
  };
  hotkey?: string;
  createdAt: number;
  modifiedAt: number;
  isDefault: boolean; // Can't be deleted
  isActive: boolean;
}

interface ProfileManagerData {
  profiles: ConcealerProfile[];
  activeProfileId: string;
  defaultProfileId: string;
  perFileProfiles: Record<string, string>; // filePath -> profileId
  perFolderProfiles: Record<string, string>; // folderPath -> profileId
}
```

#### Core Manager
```typescript
class ProfileManager {
  private plugin: LatexPandocConcealerPlugin;
  private profiles: Map<string, ConcealerProfile>;
  private activeProfile: string;
  
  // CRUD operations
  createProfile(name: string, description?: string): ConcealerProfile;
  getProfile(id: string): ConcealerProfile | undefined;
  updateProfile(id: string, updates: Partial<ConcealerProfile>): void;
  deleteProfile(id: string): void;
  duplicateProfile(id: string, newName: string): ConcealerProfile;
  
  // Profile application
  applyProfile(id: string): void;
  getActiveProfile(): ConcealerProfile;
  
  // Default profiles
  createDefaultProfiles(): void;
  resetProfile(id: string): void;
  
  // Import/Export
  exportProfile(id: string): string; // JSON
  exportAllProfiles(): string; // JSON array
  importProfile(json: string): ConcealerProfile;
  importProfiles(json: string): ConcealerProfile[];
  generateShareURL(id: string): string;
  importFromURL(url: string): ConcealerProfile;
  
  // Advanced
  getProfileForFile(filePath: string): ConcealerProfile;
  setFileProfile(filePath: string, profileId: string): void;
  setFolderProfile(folderPath: string, profileId: string): void;
}
```

#### UI Components
```typescript
// Status bar dropdown
class ProfileDropdown {
  private containerEl: HTMLElement;
  private manager: ProfileManager;
  
  render(): HTMLElement {
    // Create dropdown menu
    const menu = new Menu();
    
    this.manager.getAllProfiles().forEach(profile => {
      menu.addItem(item => {
        item
          .setTitle(profile.name)
          .setIcon(profile.icon)
          .setChecked(profile.isActive)
          .onClick(() => this.manager.applyProfile(profile.id));
      });
    });
    
    menu.addSeparator();
    menu.addItem(item => {
      item
        .setTitle('Manage Profiles...')
        .setIcon('settings')
        .onClick(() => this.openProfileManager());
    });
    
    return menu;
  }
}

// Profile editor modal
class ProfileEditorModal extends Modal {
  private profile: ConcealerProfile;
  
  onOpen(): void {
    this.renderForm();
  }
  
  renderForm(): void {
    // Name input
    // Description textarea
    // Icon picker
    // Settings checkboxes
    // Hotkey assignment
    // Save/Cancel buttons
  }
  
  save(): void {
    // Validate and save profile
  }
}

// Profile manager view
class ProfileManagerView extends ItemView {
  getViewType(): string { return 'profile-manager'; }
  
  renderList(): void {
    // List all profiles with edit/delete/duplicate buttons
  }
  
  renderImportExport(): void {
    // Import/Export buttons and instructions
  }
}
```

### UI/UX Requirements

#### Status Bar Integration
```
[Other status items] | 👁️ Full Concealment ▼ |
                      └─> Click to open dropdown
```

Dropdown menu:
```
✓ Full Concealment
  Math Review
  Citation Check
  Clean Prose
  Technical Edit
  Final Proofread
  ─────────────────
  + Create Profile...
  ⚙ Manage Profiles...
```

#### Settings Panel Section
```
[Profiles]
  
  Active Profile: Full Concealment [Switch ▼]
  
  ┌────────────────────────────────────┐
  │ 👁️ Full Concealment              ⭐│
  │ All syntax concealed               │
  │ [Edit] [Duplicate] [Export]        │
  ├────────────────────────────────────┤
  │ 🔬 Math Review                     │
  │ Only math visible                  │
  │ [Edit] [Duplicate] [Delete]        │
  └────────────────────────────────────┘
  
  [+ Create New Profile]
  [📥 Import Profile]
```

#### Profile Editor Modal
```
┌─────────────────────────────────────┐
│ Edit Profile: Math Review      [×] │
├─────────────────────────────────────┤
│ Name: [Math Review____________]     │
│ Icon: [🔬] [Choose...]              │
│ Description:                        │
│ [Show only math, hide all other__] │
│ [syntax for reviewing equations___] │
│                                     │
│ ☐ Enable Concealer                 │
│ Pattern Groups:                     │
│   ☑ Math Delimiters                │
│   ☐ Citations                       │
│   ☐ LaTeX Commands                 │
│   ...                               │
│                                     │
│ Hotkey: [Ctrl+Shift+M] [Clear]     │
│                                     │
│        [Cancel]  [Save Profile]    │
└─────────────────────────────────────┘
```

### Performance Requirements
- **Profile switch**: <100ms (instant feel)
- **Profile save**: <50ms
- **Import/Export**: <200ms for 100 profiles
- **Memory**: <1MB for 50 profiles

### Testing Requirements

#### Unit Tests
- Profile CRUD operations
- Settings merging logic
- Import/Export JSON validation
- Hotkey conflict detection

#### Integration Tests
- Profile switch workflow
- Settings persistence
- Command palette integration
- Status bar dropdown interaction

#### Manual Testing
- Create, edit, delete profiles
- Switch between profiles rapidly
- Import/Export roundtrip
- Share URL encoding/decoding
- Hotkey assignments

---

## Feature 4: Smart Citation Preview on Hover

### Overview
Contextual tooltips that display full bibliographic information when hovering over citations, reducing the need to constantly check reference files.

### User Stories

**As an academic writer**, I want to see citation details on hover so that I don't need to keep opening my .bib file to check references.

**As a book author**, I want to quickly copy citation keys so that I can reuse them elsewhere in my manuscript.

**As a researcher**, I want to see which citations are undefined so that I can fix bibliography errors before compiling.

### Functional Requirements

#### FR4.1: Citation Detection
- **FR4.1.1**: Detect Pandoc citation syntax: `[@key]`, `@key`, `[-@key]`
- **FR4.1.2**: Extract citation key from cursor position
- **FR4.1.3**: Handle multi-citations: `[@a; @b; @c]`
- **FR4.1.4**: Parse locators: `[@smith2020, pp. 12-15]`
- **FR4.1.5**: Support all Pandoc citation variants

#### FR4.2: Bibliography Discovery
- **FR4.2.1**: Parse YAML frontmatter for `bibliography:` field
- **FR4.2.2**: Search current folder for `.bib` files
- **FR4.2.3**: Check user-configured bibliography paths
- **FR4.2.4**: Support multiple bibliography files
- **FR4.2.5**: Cache parsed .bib data for performance

#### FR4.3: BibTeX Parsing
- **FR4.3.1**: Parse BibTeX/BibLaTeX format
- **FR4.3.2**: Support all standard entry types (article, book, inproceedings, etc.)
- **FR4.3.3**: Handle special characters and LaTeX commands in fields
- **FR4.3.4**: Parse crossref and string abbreviations
- **FR4.3.5**: Validate entry completeness

#### FR4.4: Tooltip Display
- **FR4.4.1**: Show formatted citation in selected style
- **FR4.4.2**: Display entry type badge
- **FR4.4.3**: Show key fields: authors, title, year, venue
- **FR4.4.4**: Display DOI/URL if available
- **FR4.4.5**: Expandable section for abstract/keywords
- **FR4.4.6**: Style tooltip to match Obsidian theme

#### FR4.5: Quick Actions
- **FR4.5.1**: "Copy Citation Key" button
- **FR4.5.2**: "Copy Formatted Citation" button (in active style)
- **FR4.5.3**: "Open DOI/URL" button (if available)
- **FR4.5.4**: "Edit in .bib File" (jump to entry)
- **FR4.5.5**: "Find All Uses" (show all citations of this key)
- **FR4.5.6**: "Open in Zotero" (if Zotero integration available)

#### FR4.6: Visual Indicators
- **FR4.6.1**: Green dot: Citation found
- **FR4.6.2**: Red dot: Citation not found (undefined)
- **FR4.6.3**: Blue dot: Citation has DOI/URL
- **FR4.6.4**: Yellow dot: Citation missing required fields
- **FR4.6.5**: Underline undefined citations
- **FR4.6.6**: Color-code by entry type (optional)

#### FR4.7: Citation Styles
- **FR4.7.1**: Built-in styles: APA, Chicago, MLA, Harvard, IEEE
- **FR4.7.2**: CSL file support (load custom styles)
- **FR4.7.3**: Style selection in settings
- **FR4.7.4**: Preview citation in multiple styles (tooltip)
- **FR4.7.5**: Per-profile style overrides

### Technical Specifications

#### BibTeX Parser
```typescript
interface BibEntry {
  key: string;
  type: string; // article, book, inproceedings, etc.
  fields: Map<string, string>;
  rawEntry: string;
  file: string;
  line: number;
}

class BibTeXParser {
  parse(content: string): Map<string, BibEntry>;
  parseEntry(entry: string): BibEntry;
  resolveStrings(entry: BibEntry, strings: Map<string, string>): void;
  resolveCrossRefs(entries: Map<string, BibEntry>): void;
  cleanField(field: string): string; // Remove LaTeX, braces, etc.
}
```

#### Bibliography Manager
```typescript
class BibliographyManager {
  private entries: Map<string, BibEntry>;
  private files: string[];
  private lastLoaded: number;
  
  async discoverBibliography(file: TFile): Promise<string[]>;
  async loadBibliography(files: string[]): Promise<void>;
  getCitation(key: string): BibEntry | undefined;
  getAllCitations(): Map<string, BibEntry>;
  
  // Caching
  invalidateCache(): void;
  shouldReload(file: string): boolean;
}
```

#### Citation Formatter
```typescript
interface CitationStyle {
  name: string;
  format(entry: BibEntry): string;
}

class APAStyle implements CitationStyle {
  format(entry: BibEntry): string {
    // Author, A. (Year). Title. Journal, vol(issue), pages.
  }
}

class CSLStyle implements CitationStyle {
  private csl: any; // Parsed CSL XML
  
  constructor(cslPath: string);
  format(entry: BibEntry): string;
}

class CitationFormatter {
  private styles: Map<string, CitationStyle>;
  
  registerStyle(name: string, style: CitationStyle): void;
  format(entry: BibEntry, styleName: string): string;
}
```

#### Hover Extension
```typescript
// CodeMirror 6 hover extension
const citationHoverExtension = hoverTooltip((view, pos, side) => {
  const citation = getCitationAtPos(view.state, pos);
  if (!citation) return null;
  
  const entry = bibliographyManager.getCitation(citation.key);
  if (!entry) {
    return {
      pos: citation.from,
      end: citation.to,
      above: true,
      create: () => createUndefinedTooltip(citation.key)
    };
  }
  
  return {
    pos: citation.from,
    end: citation.to,
    above: true,
    create: () => createCitationTooltip(entry)
  };
});

function createCitationTooltip(entry: BibEntry): TooltipView {
  const dom = document.createElement('div');
  dom.className = 'citation-tooltip';
  
  // Header
  const header = dom.createEl('div', {cls: 'citation-header'});
  header.createEl('span', {cls: 'citation-type', text: entry.type});
  header.createEl('span', {cls: 'citation-key', text: entry.key});
  
  // Formatted citation
  const formatted = citationFormatter.format(entry, activeStyle);
  dom.createEl('div', {cls: 'citation-formatted', text: formatted});
  
  // Fields
  const fields = dom.createEl('div', {cls: 'citation-fields'});
  if (entry.fields.has('doi')) {
    const doi = fields.createEl('div');
    doi.createEl('strong', {text: 'DOI: '});
    doi.createEl('a', {
      href: `https://doi.org/${entry.fields.get('doi')}`,
      text: entry.fields.get('doi')
    });
  }
  
  // Quick actions
  const actions = dom.createEl('div', {cls: 'citation-actions'});
  actions.createEl('button', {text: 'Copy Key'})
    .addEventListener('click', () => copyToClipboard(entry.key));
  actions.createEl('button', {text: 'Copy Citation'})
    .addEventListener('click', () => copyToClipboard(formatted));
  
  return {dom, offset: {x: 0, y: 8}};
}
```

#### Visual Indicators
```typescript
// Decoration for citation status
const citationDecorations = StateField.define<DecorationSet>({
  create(state) {
    return buildCitationDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.effects.some(e => e.is(refreshCitations))) {
      return buildCitationDecorations(tr.state);
    }
    return decorations.map(tr.changes);
  },
  provide: f => EditorView.decorations.from(f)
});

function buildCitationDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  
  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === 'citation') {
        const citation = state.sliceDoc(node.from, node.to);
        const key = extractCitationKey(citation);
        const entry = bibliographyManager.getCitation(key);
        
        const cls = entry ? 'citation-valid' : 'citation-invalid';
        builder.add(node.from, node.to, Decoration.mark({class: cls}));
      }
    }
  });
  
  return builder.finish();
}
```

### UI/UX Requirements

#### Tooltip Design
```html
<div class="citation-tooltip">
  <div class="citation-header">
    <span class="citation-type-badge">Article</span>
    <span class="citation-key">smith2020</span>
    <span class="citation-status">✓</span>
  </div>
  
  <div class="citation-formatted">
    Smith, J., & Doe, A. (2020). Title of the Article. 
    <em>Journal of Examples</em>, 12(3), 45-67.
  </div>
  
  <div class="citation-fields">
    <div class="citation-field">
      <strong>DOI:</strong>
      <a href="https://doi.org/10.1234/example">10.1234/example</a>
    </div>
  </div>
  
  <details class="citation-abstract">
    <summary>Abstract</summary>
    <p>Lorem ipsum dolor sit amet...</p>
  </details>
  
  <div class="citation-actions">
    <button class="copy-key">📋 Copy Key</button>
    <button class="copy-cite">📄 Copy Citation</button>
    <button class="open-doi">🔗 Open DOI</button>
    <button class="find-uses">🔍 Find Uses</button>
  </div>
</div>
```

#### Visual Indicators in Editor
```markdown
Recent studies [smith2020]• show... (• = green dot)
             ├─────────┤
             └─ Underline in green
             
Missing ref [missing2020]• (• = red dot)
           ├──────────┤
           └─ Underline in red/wavy
```

### Performance Requirements
- **Tooltip display**: <50ms from hover
- **BibTeX parsing**: <200ms for 1000 entries
- **Cache invalidation**: <10ms
- **Visual decorations**: <20ms update

### Testing Requirements

#### Unit Tests
- BibTeX parser accuracy (all entry types)
- Citation key extraction
- Citation style formatting (test against known outputs)
- Bibliography file discovery

#### Integration Tests
- Tooltip display workflow
- Quick action functionality
- Visual indicator rendering
- Multi-file bibliography support

#### Manual Testing
- Test with various .bib formats
- Verify style formatting against Zotero/JabRef output
- Test with large bibliographies (1000+ entries)
- Verify performance on hover

---

## Feature 5: Cross-Reference Intelligence

### Overview
Intelligent management of LaTeX labels and references with auto-completion, validation, navigation, and refactoring capabilities.

### User Stories

**As a book author**, I want autocomplete when typing `\ref{}` so that I don't have to remember exact label names.

**As a technical writer**, I want to be warned about undefined references so that I can fix them before generating output.

**As an academic writer**, I want to rename a label and update all references automatically so that I can reorganize without breaking links.

### Functional Requirements

#### FR5.1: Label Indexing
- **FR5.1.1**: Scan document for all `\label{key}` commands
- **FR5.1.2**: Categorize labels by type (section, figure, table, equation)
- **FR5.1.3**: Extract context (surrounding text for preview)
- **FR5.1.4**: Support multi-file indexing (entire vault)
- **FR5.1.5**: Real-time index updates on document changes
- **FR5.1.6**: Persistent cache for performance

#### FR5.2: Auto-Completion
- **FR5.2.1**: Trigger on `\ref{`, `\eqref{`, `\cref{`, `\pageref{`
- **FR5.2.2**: Show filtered list of available labels
- **FR5.2.3**: Fuzzy search as user types
- **FR5.2.4**: Prioritize nearby labels (same section)
- **FR5.2.5**: Type filtering (e.g., `\eqref{}` shows only equations)
- **FR5.2.6**: Show preview of label definition
- **FR5.2.7**: Insert with Tab/Enter

#### FR5.3: Reference Validation
- **FR5.3.1**: Detect undefined references (red underline)
- **FR5.3.2**: Detect valid references (no decoration or green dot)
- **FR5.3.3**: Detect duplicate labels (yellow underline)
- **FR5.3.4**: Show warning panel with all issues
- **FR5.3.5**: Quick fixes: "Create label", "Change to similar"
- **FR5.3.6**: Validation on save (optional)
- **FR5.3.7**: Batch validation command (entire vault)

#### FR5.4: Navigation
- **FR5.4.1**: Ctrl/Cmd+Click on `\ref{}` jumps to `\label{}`
- **FR5.4.2**: From label, show all references (bidirectional)
- **FR5.4.3**: Breadcrumb trail for navigation history
- **FR5.4.4**: "Go to Definition" command
- **FR5.4.5**: "Find All References" command
- **FR5.4.6**: Peek definition (inline preview without jumping)

#### FR5.5: Rename Refactoring
- **FR5.5.1**: Rename label and update all references atomically
- **FR5.5.2**: Preview all affected locations before applying
- **FR5.5.3**: Scope selection: current file or vault-wide
- **FR5.5.4**: Undo support (single operation)
- **FR5.5.5**: Conflict detection (if new name exists)
- **FR5.5.6**: Batch rename (regex-based patterns)

#### FR5.6: Label Generation
- **FR5.6.1**: Auto-suggest labels based on context
  - Section: `sec:title-slugified`
  - Figure: `fig:caption-keywords`
  - Equation: `eq:descriptive-name`
- **FR5.6.2**: Enforce prefix conventions (configurable)
- **FR5.6.3**: Auto-increment numbering schemes
- **FR5.6.4**: Quick insert command
- **FR5.6.5**: Validate label format (warn about spaces, special chars)

#### FR5.7: Label Browser
- **FR5.7.1**: Sidebar panel: "Cross-References"
- **FR5.7.2**: Tree view grouped by type and location
- **FR5.7.3**: Search/filter labels
- **FR5.7.4**: Show usage count (number of references)
- **FR5.7.5**: Detect orphaned labels (zero references)
- **FR5.7.6**: Click to navigate to label
- **FR5.7.7**: Context menu: Rename, Delete, Copy key

### Technical Specifications

#### Data Models
```typescript
interface LabelEntry {
  key: string;
  type: 'section' | 'subsection' | 'figure' | 'table' | 'equation' | 'listing' | 'other';
  file: string;
  position: {line: number; ch: number};
  context: string; // Surrounding text
  references: ReferenceLocation[];
  metadata?: {
    sectionTitle?: string;
    figureCaption?: string;
  };
}

interface ReferenceLocation {
  file: string;
  position: {line: number; ch: number};
  refType: 'ref' | 'eqref' | 'cref' | 'pageref';
}

interface ValidationIssue {
  type: 'undefined-ref' | 'duplicate-label' | 'orphaned-label' | 'invalid-format';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: {file: string; line: number; ch: number};
  suggestions?: string[];
}
```

#### Core Manager
```typescript
class CrossRefManager {
  private labels: Map<string, LabelEntry>;
  private indexedFiles: Set<string>;
  
  // Indexing
  async indexVault(): Promise<void>;
  async indexFile(file: TFile): Promise<void>;
  extractLabels(content: string, file: string): LabelEntry[];
  extractReferences(content: string, file: string): Map<string, ReferenceLocation[]>;
  
  // Querying
  getLabel(key: string): LabelEntry | undefined;
  getAllLabels(): LabelEntry[];
  getLabelsByType(type: string): LabelEntry[];
  getLabelsInFile(file: string): LabelEntry[];
  
  // Validation
  validateReferences(file?: string): ValidationIssue[];
  findUndefinedRefs(): Array<{file: string; ref: string}>;
  findDuplicateLabels(): Map<string, LabelEntry[]>;
  findOrphanedLabels(): LabelEntry[];
  
  // Auto-completion
  getSuggestions(prefix: string, refType?: string, currentFile?: string): LabelEntry[];
  
  // Navigation
  async jumpToLabel(key: string): Promise<void>;
  findReferences(key: string): ReferenceLocation[];
  
  // Refactoring
  async renameLabel(oldKey: string, newKey: string, scope: 'file' | 'vault'): Promise<void>;
  previewRename(oldKey: string, newKey: string): ReferenceLocation[];
  
  // Label generation
  generateLabel(context: string, type: string): string;
  suggestLabel(position: number, content: string): string;
  validateLabelFormat(key: string): {valid: boolean; message?: string};
}
```

#### Auto-Completion Provider
```typescript
// CodeMirror 6 autocomplete
const refAutoComplete = autocompletion({
  override: [
    (context: CompletionContext) => {
      const before = context.matchBefore(/\\(ref|eqref|cref|pageref)\{[^}]*/);
      if (!before) return null;
      
      const refType = extractRefType(before.text);
      const prefix = extractPrefix(before.text);
      
      const suggestions = crossRefManager.getSuggestions(prefix, refType);
      
      return {
        from: before.from,
        options: suggestions.map(label => ({
          label: label.key,
          type: 'text',
          detail: label.context,
          info: () => createLabelInfoWidget(label),
          apply: label.key
        }))
      };
    }
  ]
});

function createLabelInfoWidget(label: LabelEntry): HTMLElement {
  const dom = document.createElement('div');
  dom.className = 'ref-completion-info';
  
  dom.createEl('div', {
    cls: 'ref-type',
    text: `Type: ${label.type}`
  });
  
  dom.createEl('div', {
    cls: 'ref-location',
    text: `${label.file}:${label.position.line}`
  });
  
  dom.createEl('div', {
    cls: 'ref-context',
    text: label.context
  });
  
  return dom;
}
```

#### Diagnostics Provider
```typescript
// CodeMirror 6 linter
const refLinter = linter((view: EditorView) => {
  const diagnostics: Diagnostic[] = [];
  const issues = crossRefManager.validateReferences(view.state.file);
  
  issues.forEach(issue => {
    diagnostics.push({
      from: posToOffset(view.state, issue.location),
      to: posToOffset(view.state, issue.location) + 10, // Estimate length
      severity: issue.severity,
      message: issue.message,
      actions: createQuickFixes(issue)
    });
  });
  
  return diagnostics;
});

function createQuickFixes(issue: ValidationIssue): Action[] {
  const actions: Action[] = [];
  
  if (issue.type === 'undefined-ref' && issue.suggestions) {
    issue.suggestions.forEach(suggestion => {
      actions.push({
        name: `Change to '${suggestion}'`,
        apply: (view, from, to) => {
          view.dispatch({
            changes: {from, to, insert: suggestion}
          });
        }
      });
    });
    
    actions.push({
      name: 'Create label',
      apply: (view, from, to) => {
        const key = view.state.sliceDoc(from, to);
        insertLabelAtCursor(view, key);
      }
    });
  }
  
  return actions;
}
```

#### Navigation
```typescript
// Click handler for Ctrl+Click
const refClickHandler = EditorView.domEventHandlers({
  mousedown: (event: MouseEvent, view: EditorView) => {
    if (!event.ctrlKey && !event.metaKey) return false;
    
    const pos = view.posAtCoords({x: event.clientX, y: event.clientY});
    if (!pos) return false;
    
    const ref = getRefAtPos(view.state, pos);
    if (!ref) return false;
    
    event.preventDefault();
    crossRefManager.jumpToLabel(ref.key);
    return true;
  }
});
```

#### Label Browser Panel
```typescript
class LabelBrowserView extends ItemView {
  getViewType(): string { return 'label-browser'; }
  getDisplayText(): string { return 'Cross-References'; }
  
  async onOpen(): Promise<void> {
    this.renderBrowser();
    this.registerRefresh();
  }
  
  renderBrowser(): void {
    const {contentEl} = this;
    contentEl.empty();
    
    // Search box
    const search = contentEl.createEl('input', {
      type: 'search',
      placeholder: 'Search labels...'
    });
    search.addEventListener('input', () => this.filterLabels(search.value));
    
    // Label tree
    const tree = contentEl.createEl('div', {cls: 'label-tree'});
    this.renderLabelTree(tree);
  }
  
  renderLabelTree(container: HTMLElement): void {
    const labels = crossRefManager.getAllLabels();
    const grouped = groupBy(labels, l => l.type);
    
    grouped.forEach((labels, type) => {
      const category = container.createEl('div', {cls: 'label-category'});
      
      const header = category.createEl('div', {cls: 'category-header'});
      header.createEl('span', {text: `${type} (${labels.length})`});
      
      const list = category.createEl('div', {cls: 'label-list'});
      labels.forEach(label => {
        const item = list.createEl('div', {cls: 'label-item'});
        item.createEl('span', {
          cls: 'label-key',
          text: label.key
        });
        item.createEl('span', {
          cls: 'label-refs',
          text: `${label.references.length} refs`
        });
        
        item.addEventListener('click', () => {
          crossRefManager.jumpToLabel(label.key);
        });
        
        // Context menu
        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.showContextMenu(e, label);
        });
      });
    });
  }
  
  showContextMenu(event: MouseEvent, label: LabelEntry): void {
    const menu = new Menu();
    
    menu.addItem(item => {
      item.setTitle('Rename').onClick(() => this.renameLabel(label));
    });
    
    menu.addItem(item => {
      item.setTitle('Copy Key').onClick(() => {
        navigator.clipboard.writeText(label.key);
      });
    });
    
    menu.addItem(item => {
      item.setTitle('Find All References').onClick(() => {
        this.findReferences(label);
      });
    });
    
    if (label.references.length === 0) {
      menu.addItem(item => {
        item.setTitle('Delete (Orphaned)').onClick(() => {
          this.deleteLabel(label);
        });
      });
    }
    
    menu.showAtMouseEvent(event);
  }
}
```

### UI/UX Requirements

#### Auto-completion UI
```
\ref{sch
     ├─────────────────────────────┐
     │ eq:schrodinger              │ ← Type: equation
     │ "Schrödinger equation"      │   line 142
     ├─────────────────────────────┤
     │ sec:schrodinger-theory      │ ← Type: section
     │ "Schrödinger's Wave Theory" │   line 85
     └─────────────────────────────┘
```

#### Visual Indicators
```latex
See equation \ref{eq:example}.
              ├────────────┤
              └─ Green underline (valid)
              
Invalid: \ref{eq:missing}
          ├──────────┤
          └─ Red wavy underline (undefined)
```

#### Label Browser
```
┌─────────────────────────────────┐
│ Cross-References          [↻][⚙]│
├─────────────────────────────────┤
│ [Search labels...          🔍]  │
├─────────────────────────────────┤
│ ▼ Sections (12)                 │
│   sec:intro (3 refs)            │
│   sec:methods (5 refs)          │
│   ...                           │
│ ▼ Figures (8)                   │
│   fig:diagram (2 refs)          │
│   fig:chart (0 refs) ⚠️         │
│   ...                           │
│ ▼ Equations (15)                │
│   eq:schrodinger (4 refs)       │
│   ...                           │
└─────────────────────────────────┘
```

### Performance Requirements
- **Index build**: <1s for 100,000 word manuscript
- **Auto-complete**: <50ms to show suggestions
- **Validation**: <200ms for full document
- **Navigation**: <100ms to jump to label
- **Rename**: <500ms to preview changes

### Testing Requirements

#### Unit Tests
- Label extraction regex accuracy
- Reference extraction accuracy
- Type categorization logic
- Fuzzy search algorithm
- Label generation algorithms

#### Integration Tests
- Full index build and query
- Auto-complete workflow
- Validation and quick fixes
- Navigation (jump to definition)
- Rename refactoring

#### Manual Testing
- Test with documents of varying sizes
- Verify auto-complete with 100+ labels
- Test rename with 50+ references
- Validate multi-file indexing
- Check performance with large vaults

---

## Development Plan

### Phase 2A: Foundation (Week 1-2)
**Focus**: Core infrastructure for Phase 2 features

**Tasks**:
1. Set up Phase 2 branch and testing environment
2. Create data models and interfaces
3. Implement Focus Mode (FR1)
4. Implement Export Profiles (FR3)
5. Write unit tests for both features

**Deliverables**:
- Working Focus Mode with all options
- Profile management system
- 6 default profiles
- Updated settings UI

### Phase 2B: Analytics (Week 3-4)
**Focus**: Manuscript statistics and progress tracking

**Tasks**:
1. Implement statistics calculator (FR2.1-2.4)
2. Build statistics panel UI
3. Add progress tracking and historical data (FR2.5)
4. Integrate Chart.js for visualizations
5. Implement export functionality
6. Write comprehensive tests

**Deliverables**:
- Functional statistics panel
- Historical tracking system
- Export to CSV/JSON
- Performance benchmarks

### Phase 2C: Citations (Week 5)
**Focus**: Smart citation preview

**Tasks**:
1. Implement BibTeX parser (FR4.3)
2. Build bibliography manager (FR4.2)
3. Create hover tooltip UI (FR4.4)
4. Add quick actions (FR4.5)
5. Implement visual indicators (FR4.6)
6. Add citation style support (FR4.7)

**Deliverables**:
- Working citation tooltips
- BibTeX parser with 95%+ accuracy
- 5 built-in citation styles
- Visual indicator system

### Phase 2D: Cross-References (Week 6)
**Focus**: Intelligent label management

**Tasks**:
1. Implement label indexing (FR5.1)
2. Build auto-completion system (FR5.2)
3. Add validation and diagnostics (FR5.3)
4. Implement navigation (FR5.4)
5. Build rename refactoring (FR5.5)
6. Create label browser panel (FR5.7)

**Deliverables**:
- Label index with real-time updates
- Auto-completion for references
- Validation with quick fixes
- Label browser panel
- Rename refactoring

### Testing & Polish (Week 7)
**Focus**: Integration testing, bug fixes, documentation

**Tasks**:
1. End-to-end integration testing
2. Performance optimization
3. Bug fixes from testing
4. Update README and documentation
5. Create video demos
6. Prepare release notes

**Deliverables**:
- Comprehensive test coverage (>80%)
- Performance benchmarks met
- Updated documentation
- Release-ready build

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| BibTeX parser complexity | High | Medium | Use existing libraries (e.g., bibtex-parser) or simplify to support common cases |
| Performance degradation | High | Medium | Extensive profiling, lazy loading, caching strategies |
| CodeMirror compatibility | Medium | Low | Test with latest Obsidian versions, use stable APIs |
| Large vault indexing | Medium | Medium | Implement incremental indexing, background workers |

### User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Feature overload (too complex) | Medium | High | Clear settings organization, progressive disclosure |
| Conflicts with other plugins | Medium | Medium | Test with popular plugins, provide conflict warnings |
| Learning curve too steep | Medium | Medium | Excellent documentation, video tutorials, sensible defaults |

### Project Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep | High | Medium | Stick to PRD, defer nice-to-haves to Phase 3 |
| Timeline overrun | Medium | Medium | Weekly checkpoints, adjust scope if needed |
| Breaking changes in dependencies | Medium | Low | Pin dependency versions, gradual upgrades |

---

## Success Criteria

### Functional Completeness
- ✅ All FR requirements implemented
- ✅ 95%+ test coverage for critical paths
- ✅ Zero P0/P1 bugs at release

### Performance
- ✅ <5% performance degradation from Phase 1
- ✅ All performance requirements met
- ✅ Smooth operation on 500-page manuscripts

### User Adoption
- ✅ 70%+ of users enable at least one Phase 2 feature
- ✅ 4.5+ star rating maintained
- ✅ Positive feedback on new features

### Quality
- ✅ Comprehensive documentation
- ✅ No critical bugs reported within 2 weeks
- ✅ Clean, maintainable code

---

## Appendix A: User Research Insights

**Target User Interviews** (to be conducted):
- 5 book authors using Obsidian
- 3 academic writers (PhD students/researchers)
- 2 technical writers

**Key Questions**:
1. What's your biggest pain point when writing long manuscripts?
2. How do you track your writing progress currently?
3. How do you manage citations and references?
4. What would make you more productive?

**Preliminary Findings** (from community forums):
- Writers want better word count tracking (excluding syntax)
- Citation management is a common frustration
- Navigation in long documents is challenging
- Desire for distraction-free writing modes

---

## Appendix B: Competitive Analysis

| Feature | LaTeX-Pandoc (Phase 2) | Zettlr | Ulysses | Scrivener |
|---------|----------------------|--------|---------|-----------|
| Focus Mode | ✅ Full | ✅ Basic | ✅ Excellent | ✅ Good |
| Statistics | ✅ Comprehensive | ✅ Good | ✅ Excellent | ✅ Excellent |
| Citation Preview | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Cross-Ref Mgmt | ✅ Intelligent | ⚠️ Basic | ❌ No | ⚠️ Basic |
| Profiles | ✅ Yes | ❌ No | ⚠️ Limited | ❌ No |
| LaTeX Support | ✅ Excellent | ✅ Good | ❌ No | ⚠️ Limited |

**Competitive Advantages**:
- Only tool with intelligent LaTeX cross-reference management
- Most comprehensive statistics for academic writing
- Best integration of focus mode + citation management
- Open-source and extensible

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-25  
**Approval Status**: Draft  
**Next Review**: After user research completion

