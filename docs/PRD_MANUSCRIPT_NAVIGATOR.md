# Product Requirements Document: Manuscript Navigator

**Feature Name:** Manuscript Navigator  
**Version:** 1.0  
**Priority:** High (Phase 3A - Sprint 1)  
**Complexity:** Medium  
**Estimated Effort:** 2 weeks  
**Owner:** Obsidian LaTeX-Pandoc Concealer Plugin  

---

## Executive Summary

The Manuscript Navigator transforms the plugin from a single-file text enhancement tool into a comprehensive book project management system. It provides a dedicated sidebar that displays the entire manuscript structure as a hierarchical tree, allowing authors to visualize, navigate, and reorganize their multi-chapter books within Obsidian.

**Key Value Proposition:** Authors can see their entire book at a glance, reorder chapters with drag-and-drop, track progress with per-chapter statistics, and manage which content is included in builds—all without leaving the editor.

---

## Goals & Non-Goals

### Goals
✅ Provide a single, authoritative view of the book's structure  
✅ Enable drag-and-drop chapter reordering  
✅ Display per-chapter statistics (word count, figures, citations)  
✅ Allow selective inclusion/exclusion of chapters from builds  
✅ Quick navigation to any chapter or section  
✅ Support multi-level structure (Parts → Chapters → Sections)  
✅ Work seamlessly with existing Phase 1 & 2 features  

### Non-Goals
❌ Building/compiling the manuscript (external build system exists)  
❌ Version control or change tracking (use Git)  
❌ Real-time collaborative editing  
❌ Cloud synchronization  
❌ PDF preview (Obsidian/Pandoc handles this)  

---

## User Stories

### Primary User Stories

**US-1: Visualize Book Structure**
> As an author, I want to see my entire book structure (parts, chapters, sections) in a sidebar tree view, so I can understand the organization of my manuscript at a glance.

**Acceptance Criteria:**
- Tree view shows hierarchical structure: Parts → Chapters → Sections
- Each node displays: icon, title, chapter number (if applicable)
- Collapsible/expandable nodes
- Visual distinction between included and excluded chapters
- Active chapter (currently open file) is highlighted

---

**US-2: Navigate to Chapters**
> As an author, I want to click on any chapter in the navigator to open it in the editor, so I can quickly jump between chapters without using file explorer.

**Acceptance Criteria:**
- Single click opens chapter in current pane
- Ctrl/Cmd + click opens in new pane
- Right-click shows context menu with "Open in New Pane" option
- Double-click expands/collapses (doesn't open)
- Currently open chapter is visually highlighted

---

**US-3: Reorder Chapters**
> As an author, I want to drag and drop chapters to reorder them, so I can reorganize my book structure without manually renaming files or editing configuration.

**Acceptance Criteria:**
- Drag handle appears on hover
- Visual feedback during drag (ghost outline)
- Drop zones highlighted when dragging
- Can reorder within same part or move between parts
- Changes persist to `book.json`
- Undo/redo support
- Confirmation dialog if move would affect 10+ references

---

**US-4: View Chapter Statistics**
> As an author, I want to see per-chapter statistics (word count, figure count, citation count) next to each chapter in the navigator, so I can track progress and balance chapter lengths.

**Acceptance Criteria:**
- Display word count next to chapter name
- Optional: Show figure count, table count, citation count (configurable in settings)
- Progress bar toward chapter word count goal (if set)
- Color coding: under goal (orange), at goal (green)
- Statistics update when chapter is edited
- Tooltip on hover shows detailed breakdown

---

**US-5: Include/Exclude Chapters**
> As an author, I want to toggle whether a chapter is included in the build, so I can exclude draft chapters or optional appendices without deleting them.

**Acceptance Criteria:**
- Checkbox or eye icon to toggle inclusion
- Excluded chapters appear grayed out or with strike-through
- Changes save to `book.json` immediately
- Visual indicator shows current inclusion state
- Bulk operations: "Include All", "Exclude All Selected"

---

**US-6: Manage Book Configuration**
> As an author, I want to create or edit my book configuration file through a UI, so I don't need to manually write JSON.

**Acceptance Criteria:**
- Command: "Create New Manuscript Project"
- Wizard prompts for: title, author, initial chapter list
- Auto-discovers markdown files in common locations
- Option to import from existing folder structure
- Settings panel to edit book metadata
- Validation of configuration with helpful error messages

---

### Secondary User Stories

**US-7: Add New Chapters**
> As an author, I want to add a new chapter from the navigator via right-click menu, so I can quickly expand my manuscript.

**Acceptance Criteria:**
- Right-click → "Add Chapter After"
- Prompts for chapter title
- Creates new markdown file with template
- Adds entry to `book.json`
- Opens new chapter in editor

---

**US-8: Split Chapters**
> As an author, I want to split a long chapter into two chapters, so I can reorganize overly long content.

**Acceptance Criteria:**
- Right-click on chapter → "Split Chapter"
- Prompts for split location (heading level 1 or 2)
- Creates new file with content after split point
- Updates `book.json` with new chapter
- Preserves labels and references

---

**US-9: Rename Chapters**
> As an author, I want to rename a chapter's title without manually editing the file and configuration.

**Acceptance Criteria:**
- Right-click → "Rename Chapter"
- Updates chapter title in `book.json`
- Optionally updates first heading in markdown file
- Does NOT rename the file (keeps stable paths)

---

**US-10: Manuscript-Wide Statistics**
> As an author, I want to see total manuscript statistics at the top of the navigator, so I can track overall progress.

**Acceptance Criteria:**
- Display: total word count, chapter count, included/excluded count
- Progress toward book word count goal
- Estimated reading time for entire manuscript
- Last modified timestamp

---

## Functional Requirements

### FR-1: Configuration File Format

**Format:** JSON (book.json)  
**Location:** Vault root or configured path  
**Schema Version:** 1.0  

**Required Fields:**
```json
{
  "version": "1.0",
  "metadata": {
    "title": "Book Title",
    "author": "Author Name"
  },
  "structure": {
    "chapters": [
      {
        "id": "unique-id",
        "title": "Chapter Title",
        "file": "path/to/chapter.md",
        "included": true,
        "order": 1
      }
    ]
  }
}
```

**Optional Fields:**
- `structure.parts[]` - Group chapters into parts/sections
- `structure.frontmatter[]` - Preface, acknowledgments, etc.
- `structure.appendices[]` - Appendix chapters
- `structure.backmatter[]` - Index, bibliography
- `settings.wordCountGoals` - Target word counts
- `build.outputDir` - Where to output compiled manuscript

**Validation Rules:**
- All `file` paths must exist in vault
- All `id` values must be unique
- `order` values should be sequential (warnings only)
- `version` must be "1.0" (for this implementation)

---

### FR-2: Navigator UI Components

**View Type:** `MANUSCRIPT_NAVIGATOR_VIEW_TYPE`  
**Default Position:** Left sidebar  
**Icon:** 📖 (book emoji or custom SVG)  

**UI Structure:**
```
┌─────────────────────────────────────┐
│ Manuscript Navigator          [⚙️] │ ← Header with settings
├─────────────────────────────────────┤
│ 📊 Total: 45,231 words             │ ← Manuscript stats
│    12 chapters (10 included)        │
├─────────────────────────────────────┤
│ [🔍 Search chapters...]            │ ← Search/filter
├─────────────────────────────────────┤
│ 📁 Part I: Introduction            │ ← Tree view
│   ✓ 📄 Ch 1: Background  (3,241)   │   (collapsible)
│   ✓ 📄 Ch 2: Methods     (4,892)   │
│ 📁 Part II: Results                │
│   ✓ 📄 Ch 3: Experiment  (5,120)   │ ← Active chapter
│   ☐ 📄 Ch 4: Discussion  (2,451)   │ ← Excluded (grayed)
│ 📄 Appendix A            (1,203)   │ ← No part
└─────────────────────────────────────┘
```

**Icons:**
- ✓ = Included in build (checkbox checked)
- ☐ = Excluded from build (checkbox unchecked)
- 📁 = Part (collapsible folder)
- 📄 = Chapter (document)
- 📊 = Statistics
- 🔍 = Search

**Interaction:**
- Click chapter → opens in editor
- Click checkbox → toggle inclusion
- Drag chapter → reorder
- Hover → show tooltip with details
- Right-click → context menu

---

### FR-3: Tree View Behavior

**Collapsible Nodes:**
- Parts are collapsible by default (user can expand/collapse)
- State persists across Obsidian restarts
- Expand/collapse with click on arrow/folder icon
- Keyboard: Arrow keys to navigate, Space to expand/collapse

**Drag & Drop:**
- Draggable: Chapters only (not parts, not sections)
- Drop targets: Between chapters, inside parts
- Visual feedback: 
  - Drag ghost shows chapter title
  - Drop zone highlighted (blue line)
  - Invalid drop zones grayed out
- Constraints:
  - Cannot drop on itself
  - Cannot drop into excluded chapters
  - Can reorder within part or move to different part

**Filtering/Search:**
- Search box filters by chapter title (case-insensitive)
- Filter by inclusion status: All / Included / Excluded
- Filter by part
- Matched chapters highlighted, non-matched grayed

---

### FR-4: Statistics Integration

**Per-Chapter Stats:**
Uses existing `StatsCalculator` from Phase 2.

**Displayed Metrics:**
- Word count (always)
- Figure count (optional, configurable)
- Table count (optional, configurable)
- Citation count (optional, configurable)
- Last modified date (tooltip only)

**Update Triggers:**
- On file change (debounced, 2 second delay)
- On manual refresh command
- On navigator first load
- When chapter is included/excluded

**Caching:**
- Cache stats in memory with timestamp
- Invalidate cache on file modification
- Persist cache to plugin data (optional, for faster startup)

---

### FR-5: Context Menu Actions

**Chapter Context Menu:**
- 📂 Open in New Pane
- ➕ Add Chapter After
- 📝 Rename Chapter
- ✂️ Split Chapter At... (shows submenu of headings)
- 🗑️ Remove from Project (doesn't delete file)
- ℹ️ Chapter Details (modal with full stats)

**Part Context Menu:**
- ➕ Add Chapter to Part
- 📝 Rename Part
- 🗑️ Delete Part (moves chapters to root)
- ⬆️ Move Part Up
- ⬇️ Move Part Down

**Root Context Menu (click on empty space):**
- ➕ Add New Chapter
- ➕ Add New Part
- 📊 Refresh Statistics
- ⚙️ Configure Project

---

### FR-6: Commands

Register the following commands in Obsidian:

1. **Open Manuscript Navigator**
   - ID: `open-manuscript-navigator`
   - Hotkey: None (default)
   - Opens the navigator sidebar

2. **Create New Manuscript Project**
   - ID: `create-manuscript-project`
   - Hotkey: None
   - Wizard to create `book.json`

3. **Refresh Manuscript Statistics**
   - ID: `refresh-manuscript-stats`
   - Hotkey: None
   - Forces recalculation of all chapter stats

4. **Add New Chapter**
   - ID: `add-manuscript-chapter`
   - Hotkey: None
   - Prompts for title and location

5. **Toggle Chapter Inclusion**
   - ID: `toggle-chapter-inclusion`
   - Hotkey: None
   - Toggles active chapter's inclusion status

6. **Go to Next Chapter**
   - ID: `manuscript-next-chapter`
   - Hotkey: `Ctrl+Alt+]` (configurable)
   - Opens next chapter in sequence

7. **Go to Previous Chapter**
   - ID: `manuscript-previous-chapter`
   - Hotkey: `Ctrl+Alt+[` (configurable)
   - Opens previous chapter in sequence

---

### FR-7: Settings Integration

Add new section to plugin settings:

**Manuscript Navigator Settings:**

```typescript
manuscriptNavigator: {
  enabled: boolean;              // Master toggle
  showInSidebar: boolean;        // Auto-open on startup
  configFile: string;            // Path to book.json (default: "book.json")
  
  // Display options
  showWordCount: boolean;        // Show word counts
  showFigureCount: boolean;      // Show figure counts
  showCitationCount: boolean;    // Show citation counts
  showLastModified: boolean;     // Show timestamps
  
  // Behavior
  autoRefreshStats: boolean;     // Recalc on file change
  confirmReorder: boolean;       // Confirm before reordering
  expandPartsOnLoad: boolean;    // Expand all parts by default
  
  // Goals
  defaultChapterWordGoal: number;  // Default word count goal per chapter
  totalWordGoal: number;           // Total manuscript word count goal
}
```

**Settings UI:**
- Toggle switches for boolean options
- Text input for config file path with validation
- Number inputs for word count goals
- "Create New Project" button
- "Reload Configuration" button

---

## Technical Architecture

### Component Structure

```
src/manuscript/
  ├── ManuscriptConfig.ts          # Parse and validate book.json
  ├── ManuscriptNavigator.ts       # Main sidebar view
  ├── ManuscriptTreeView.ts        # Tree rendering component
  ├── ManuscriptStats.ts           # Project-wide statistics
  ├── ChapterNode.ts               # Individual chapter component
  ├── PartNode.ts                  # Part/section component
  ├── DragDropHandler.ts           # Drag & drop logic
  ├── ContextMenuHandler.ts        # Right-click menus
  └── ProjectWizard.ts             # New project creation wizard
```

### Data Models

```typescript
/**
 * Root configuration object
 */
interface ManuscriptConfig {
  version: string;
  metadata: ManuscriptMetadata;
  structure: ManuscriptStructure;
  settings?: ManuscriptSettings;
  build?: BuildSettings;
}

interface ManuscriptMetadata {
  title: string;
  subtitle?: string;
  author: string;
  publisher?: string;
  year?: number;
  isbn?: string;
}

interface ManuscriptStructure {
  frontmatter?: ChapterEntry[];
  parts?: Part[];
  chapters: ChapterEntry[];
  appendices?: ChapterEntry[];
  backmatter?: ChapterEntry[];
}

interface Part {
  id: string;
  title: string;
  chapters: string[];  // Array of chapter IDs
  order?: number;
}

interface ChapterEntry {
  id: string;
  number?: number;        // Chapter number (e.g., 1, 2, 3)
  title: string;
  file: string;           // Relative path from vault root
  included: boolean;
  order: number;
  notes?: string;         // Internal notes (not displayed in output)
}

interface ManuscriptSettings {
  wordCountGoals?: {
    chapter?: number;
    total?: number;
  };
  numberingFormat?: {
    figures?: string;     // "chapter.sequential" | "continuous"
    tables?: string;
    equations?: string;
  };
}

interface BuildSettings {
  outputDir?: string;
  includeOnly?: 'all' | 'included';
}

/**
 * Runtime statistics for chapters
 */
interface ChapterStats {
  chapterId: string;
  wordCount: number;
  figureCount: number;
  tableCount: number;
  citationCount: number;
  lastModified: number;  // Timestamp
  cached: boolean;
}

/**
 * Manuscript-wide statistics
 */
interface ManuscriptStatsData {
  totalWordCount: number;
  includedWordCount: number;
  chapterCount: number;
  includedChapterCount: number;
  figureCount: number;
  tableCount: number;
  citationCount: number;
  lastCalculated: number;
  chapters: Map<string, ChapterStats>;  // Keyed by chapter ID
}

/**
 * Tree node for rendering
 */
interface TreeNode {
  type: 'part' | 'chapter' | 'frontmatter' | 'backmatter';
  id: string;
  title: string;
  file?: string;          // Only for chapters
  included?: boolean;     // Only for chapters
  children?: TreeNode[];  // For parts
  stats?: ChapterStats;   // Only for chapters
  collapsed?: boolean;    // UI state
}
```

---

### Class Definitions

#### ManuscriptConfig.ts

```typescript
export class ManuscriptConfig {
  private config: ManuscriptConfig | null = null;
  private configPath: string;
  
  constructor(private plugin: LatexPandocConcealerPlugin) {
    this.configPath = plugin.settings.manuscriptNavigator.configFile;
  }
  
  /**
   * Load and parse book.json
   */
  async load(): Promise<boolean> {
    const file = this.plugin.app.vault.getAbstractFileByPath(this.configPath);
    if (!file || !(file instanceof TFile)) {
      return false;
    }
    
    const content = await this.plugin.app.vault.read(file);
    this.config = JSON.parse(content);
    
    // Validate configuration
    const errors = this.validate();
    if (errors.length > 0) {
      console.error('Manuscript configuration errors:', errors);
      return false;
    }
    
    return true;
  }
  
  /**
   * Save configuration back to book.json
   */
  async save(): Promise<void> {
    if (!this.config) return;
    
    const content = JSON.stringify(this.config, null, 2);
    const file = this.plugin.app.vault.getAbstractFileByPath(this.configPath);
    
    if (file instanceof TFile) {
      await this.plugin.app.vault.modify(file, content);
    }
  }
  
  /**
   * Validate configuration structure
   */
  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.config) {
      errors.push('No configuration loaded');
      return errors;
    }
    
    // Check required fields
    if (!this.config.version) errors.push('Missing version field');
    if (!this.config.metadata?.title) errors.push('Missing metadata.title');
    if (!this.config.structure?.chapters) errors.push('Missing structure.chapters');
    
    // Validate chapter entries
    const chapterIds = new Set<string>();
    for (const chapter of this.config.structure.chapters) {
      if (!chapter.id) errors.push(`Chapter missing id: ${chapter.title}`);
      if (chapterIds.has(chapter.id)) {
        errors.push(`Duplicate chapter id: ${chapter.id}`);
      }
      chapterIds.add(chapter.id);
      
      if (!chapter.file) errors.push(`Chapter missing file: ${chapter.title}`);
      if (chapter.included === undefined) {
        errors.push(`Chapter missing included flag: ${chapter.title}`);
      }
    }
    
    // Validate file paths exist
    for (const chapter of this.config.structure.chapters) {
      const file = this.plugin.app.vault.getAbstractFileByPath(chapter.file);
      if (!file) {
        errors.push(`Chapter file not found: ${chapter.file}`);
      }
    }
    
    return errors;
  }
  
  /**
   * Get flat list of all chapters in order
   */
  getChaptersInOrder(): ChapterEntry[] {
    if (!this.config) return [];
    
    const chapters = [...this.config.structure.chapters];
    chapters.sort((a, b) => a.order - b.order);
    return chapters;
  }
  
  /**
   * Get chapters grouped by parts
   */
  getStructuredChapters(): TreeNode[] {
    if (!this.config) return [];
    
    const nodes: TreeNode[] = [];
    
    // Add frontmatter
    if (this.config.structure.frontmatter) {
      for (const fm of this.config.structure.frontmatter) {
        nodes.push(this.chapterToNode(fm, 'frontmatter'));
      }
    }
    
    // Add parts and chapters
    if (this.config.structure.parts) {
      for (const part of this.config.structure.parts) {
        const partNode: TreeNode = {
          type: 'part',
          id: part.id,
          title: part.title,
          children: [],
          collapsed: false,
        };
        
        for (const chapterId of part.chapters) {
          const chapter = this.config.structure.chapters.find(c => c.id === chapterId);
          if (chapter) {
            partNode.children!.push(this.chapterToNode(chapter, 'chapter'));
          }
        }
        
        nodes.push(partNode);
      }
    } else {
      // No parts, just chapters
      for (const chapter of this.getChaptersInOrder()) {
        nodes.push(this.chapterToNode(chapter, 'chapter'));
      }
    }
    
    // Add appendices
    if (this.config.structure.appendices) {
      for (const app of this.config.structure.appendices) {
        nodes.push(this.chapterToNode(app, 'chapter'));
      }
    }
    
    // Add backmatter
    if (this.config.structure.backmatter) {
      for (const bm of this.config.structure.backmatter) {
        nodes.push(this.chapterToNode(bm, 'backmatter'));
      }
    }
    
    return nodes;
  }
  
  private chapterToNode(chapter: ChapterEntry, type: TreeNode['type']): TreeNode {
    return {
      type,
      id: chapter.id,
      title: chapter.title,
      file: chapter.file,
      included: chapter.included,
    };
  }
  
  /**
   * Update chapter order after drag-and-drop
   */
  async reorderChapters(newOrder: string[]): Promise<void> {
    if (!this.config) return;
    
    for (let i = 0; i < newOrder.length; i++) {
      const chapter = this.config.structure.chapters.find(c => c.id === newOrder[i]);
      if (chapter) {
        chapter.order = i + 1;
      }
    }
    
    await this.save();
  }
  
  /**
   * Toggle chapter inclusion
   */
  async toggleChapterInclusion(chapterId: string): Promise<void> {
    if (!this.config) return;
    
    const chapter = this.config.structure.chapters.find(c => c.id === chapterId);
    if (chapter) {
      chapter.included = !chapter.included;
      await this.save();
    }
  }
  
  getConfig(): ManuscriptConfig | null {
    return this.config;
  }
}
```

---

#### ManuscriptNavigator.ts

```typescript
import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { ManuscriptConfig } from './ManuscriptConfig';
import { ManuscriptStats } from './ManuscriptStats';

export const MANUSCRIPT_NAVIGATOR_VIEW_TYPE = 'manuscript-navigator';

export class ManuscriptNavigator extends ItemView {
  private config: ManuscriptConfig;
  private stats: ManuscriptStats;
  private containerEl: HTMLElement;
  
  constructor(leaf: WorkspaceLeaf, private plugin: LatexPandocConcealerPlugin) {
    super(leaf);
    this.config = new ManuscriptConfig(plugin);
    this.stats = new ManuscriptStats(plugin);
  }
  
  getViewType(): string {
    return MANUSCRIPT_NAVIGATOR_VIEW_TYPE;
  }
  
  getDisplayText(): string {
    return 'Manuscript Navigator';
  }
  
  getIcon(): string {
    return 'book-open';
  }
  
  async onOpen(): Promise<void> {
    this.containerEl = this.contentEl;
    this.containerEl.empty();
    this.containerEl.addClass('manuscript-navigator-view');
    
    await this.render();
  }
  
  async onClose(): Promise<void> {
    // Cleanup
  }
  
  async render(): Promise<void> {
    this.containerEl.empty();
    
    // Load configuration
    const loaded = await this.config.load();
    
    if (!loaded) {
      this.renderEmptyState();
      return;
    }
    
    // Render header
    this.renderHeader();
    
    // Render manuscript stats
    await this.renderManuscriptStats();
    
    // Render search/filter
    this.renderSearchFilter();
    
    // Render tree view
    this.renderTreeView();
  }
  
  private renderEmptyState(): void {
    const emptyContainer = this.containerEl.createDiv({ cls: 'manuscript-empty-state' });
    
    emptyContainer.createEl('h3', { text: 'No Manuscript Project Found' });
    emptyContainer.createEl('p', {
      text: 'Create a book.json file to define your manuscript structure.',
    });
    
    const button = emptyContainer.createEl('button', {
      text: 'Create New Project',
      cls: 'mod-cta',
    });
    
    button.addEventListener('click', async () => {
      await this.plugin.createManuscriptProject();
      await this.render();
    });
  }
  
  private renderHeader(): void {
    const header = this.containerEl.createDiv({ cls: 'manuscript-navigator-header' });
    
    const title = header.createEl('h2', { text: 'Manuscript Navigator' });
    
    const settingsButton = header.createEl('button', {
      cls: 'manuscript-settings-button',
      attr: { 'aria-label': 'Settings' },
    });
    settingsButton.innerHTML = '⚙️';
    settingsButton.addEventListener('click', () => {
      // Open settings to manuscript section
      (this.app as any).setting.open();
      (this.app as any).setting.openTabById('latex-pandoc-concealer');
    });
  }
  
  private async renderManuscriptStats(): Promise<void> {
    const statsContainer = this.containerEl.createDiv({ cls: 'manuscript-stats-summary' });
    
    const manuscriptStats = await this.stats.calculateManuscriptStats();
    
    const totalWords = statsContainer.createDiv({ cls: 'stat-item' });
    totalWords.innerHTML = `📊 Total: <strong>${manuscriptStats.totalWordCount.toLocaleString()}</strong> words`;
    
    const chapterInfo = statsContainer.createDiv({ cls: 'stat-item' });
    chapterInfo.innerHTML = `${manuscriptStats.chapterCount} chapters (${manuscriptStats.includedChapterCount} included)`;
    
    // Progress bar if goal is set
    const goal = this.plugin.settings.manuscriptNavigator.totalWordGoal;
    if (goal && goal > 0) {
      const progress = (manuscriptStats.includedWordCount / goal) * 100;
      const progressBar = statsContainer.createDiv({ cls: 'manuscript-progress' });
      progressBar.innerHTML = `
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}%"></div>
        </div>
        <div class="progress-text">${progress.toFixed(1)}% of ${goal.toLocaleString()} word goal</div>
      `;
    }
  }
  
  private renderSearchFilter(): void {
    const filterContainer = this.containerEl.createDiv({ cls: 'manuscript-filter' });
    
    const searchInput = filterContainer.createEl('input', {
      type: 'text',
      placeholder: '🔍 Search chapters...',
      cls: 'manuscript-search-input',
    });
    
    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      this.filterTree(query);
    });
  }
  
  private renderTreeView(): void {
    const treeContainer = this.containerEl.createDiv({ cls: 'manuscript-tree-view' });
    
    const nodes = this.config.getStructuredChapters();
    
    for (const node of nodes) {
      this.renderNode(treeContainer, node, 0);
    }
  }
  
  private renderNode(container: HTMLElement, node: TreeNode, depth: number): void {
    const nodeEl = container.createDiv({
      cls: `tree-node tree-node-${node.type} tree-depth-${depth}`,
    });
    
    if (node.type === 'part') {
      this.renderPartNode(nodeEl, node, depth);
    } else {
      this.renderChapterNode(nodeEl, node, depth);
    }
  }
  
  private renderPartNode(container: HTMLElement, node: TreeNode, depth: number): void {
    const partHeader = container.createDiv({ cls: 'part-header' });
    
    const toggleIcon = partHeader.createSpan({ cls: 'collapse-icon' });
    toggleIcon.textContent = node.collapsed ? '▶' : '▼';
    
    const partTitle = partHeader.createSpan({ cls: 'part-title' });
    partTitle.textContent = `📁 ${node.title}`;
    
    partHeader.addEventListener('click', () => {
      node.collapsed = !node.collapsed;
      this.render();
    });
    
    if (!node.collapsed && node.children) {
      const childrenContainer = container.createDiv({ cls: 'part-children' });
      for (const child of node.children) {
        this.renderNode(childrenContainer, child, depth + 1);
      }
    }
  }
  
  private renderChapterNode(container: HTMLElement, node: TreeNode, depth: number): void {
    const chapterEl = container.createDiv({ cls: 'chapter-node' });
    
    // Inclusion checkbox
    const checkbox = chapterEl.createEl('input', {
      type: 'checkbox',
      cls: 'chapter-checkbox',
    });
    checkbox.checked = node.included ?? true;
    checkbox.addEventListener('change', async () => {
      await this.config.toggleChapterInclusion(node.id);
      await this.render();
    });
    
    // Chapter title
    const titleEl = chapterEl.createSpan({ cls: 'chapter-title' });
    titleEl.textContent = `📄 ${node.title}`;
    
    // Word count
    if (this.plugin.settings.manuscriptNavigator.showWordCount && node.stats) {
      const wordCount = chapterEl.createSpan({ cls: 'chapter-word-count' });
      wordCount.textContent = `(${node.stats.wordCount.toLocaleString()})`;
    }
    
    // Click to open
    titleEl.addEventListener('click', async (e) => {
      if (node.file) {
        const file = this.plugin.app.vault.getAbstractFileByPath(node.file);
        if (file instanceof TFile) {
          const leaf = this.plugin.app.workspace.getLeaf(e.ctrlKey || e.metaKey);
          await leaf.openFile(file);
        }
      }
    });
    
    // Right-click context menu
    chapterEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showChapterContextMenu(node, e);
    });
    
    // Highlight active chapter
    const activeFile = this.plugin.app.workspace.getActiveFile();
    if (activeFile && activeFile.path === node.file) {
      chapterEl.addClass('active-chapter');
    }
    
    // Gray out if excluded
    if (!node.included) {
      chapterEl.addClass('excluded-chapter');
    }
  }
  
  private showChapterContextMenu(node: TreeNode, event: MouseEvent): void {
    const menu = new Menu();
    
    menu.addItem((item) => {
      item
        .setTitle('Open in New Pane')
        .setIcon('go-to-file')
        .onClick(async () => {
          if (node.file) {
            const file = this.plugin.app.vault.getAbstractFileByPath(node.file);
            if (file instanceof TFile) {
              const leaf = this.plugin.app.workspace.getLeaf('split');
              await leaf.openFile(file);
            }
          }
        });
    });
    
    menu.addItem((item) => {
      item
        .setTitle('Chapter Details')
        .setIcon('info')
        .onClick(() => {
          this.showChapterDetails(node);
        });
    });
    
    menu.showAtMouseEvent(event);
  }
  
  private showChapterDetails(node: TreeNode): void {
    // TODO: Show modal with detailed stats
    new Notice(`Chapter: ${node.title}\nWord count: ${node.stats?.wordCount || 0}`);
  }
  
  private filterTree(query: string): void {
    const treeNodes = this.containerEl.querySelectorAll('.tree-node');
    
    treeNodes.forEach((nodeEl) => {
      const titleEl = nodeEl.querySelector('.chapter-title, .part-title');
      const title = titleEl?.textContent?.toLowerCase() || '';
      
      if (title.includes(query)) {
        (nodeEl as HTMLElement).style.display = '';
      } else {
        (nodeEl as HTMLElement).style.display = 'none';
      }
    });
  }
}
```

---

### Styling (styles.css additions)

```css
/* Manuscript Navigator */
.manuscript-navigator-view {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.manuscript-navigator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--background-modifier-border);
}

.manuscript-navigator-header h2 {
  margin: 0;
  font-size: 1.1em;
}

.manuscript-settings-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.manuscript-settings-button:hover {
  opacity: 1;
}

/* Stats Summary */
.manuscript-stats-summary {
  padding: 0.75rem 1rem;
  background: var(--background-secondary);
  border-bottom: 1px solid var(--background-modifier-border);
  font-size: 0.9em;
}

.manuscript-stats-summary .stat-item {
  margin-bottom: 0.25rem;
}

.manuscript-progress {
  margin-top: 0.5rem;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: var(--background-modifier-border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.85em;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* Search/Filter */
.manuscript-filter {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--background-modifier-border);
}

.manuscript-search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-primary);
  color: var(--text-normal);
}

/* Tree View */
.manuscript-tree-view {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

/* Tree Nodes */
.tree-node {
  margin-bottom: 0.25rem;
}

.tree-depth-0 {
  margin-left: 0;
}

.tree-depth-1 {
  margin-left: 1rem;
}

.tree-depth-2 {
  margin-left: 2rem;
}

/* Part Nodes */
.part-header {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  font-weight: 600;
  transition: background 0.2s;
}

.part-header:hover {
  background: var(--background-modifier-hover);
}

.collapse-icon {
  margin-right: 0.5rem;
  font-size: 0.8em;
  color: var(--text-muted);
}

.part-title {
  flex: 1;
}

.part-children {
  margin-top: 0.25rem;
}

/* Chapter Nodes */
.chapter-node {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
  cursor: pointer;
}

.chapter-node:hover {
  background: var(--background-modifier-hover);
}

.chapter-checkbox {
  margin-right: 0.5rem;
}

.chapter-title {
  flex: 1;
  font-size: 0.95em;
}

.chapter-word-count {
  font-size: 0.85em;
  color: var(--text-muted);
  margin-left: 0.5rem;
}

.active-chapter {
  background: var(--interactive-accent-hover);
  font-weight: 600;
}

.excluded-chapter {
  opacity: 0.5;
}

.excluded-chapter .chapter-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Empty State */
.manuscript-empty-state {
  padding: 2rem;
  text-align: center;
}

.manuscript-empty-state h3 {
  margin-bottom: 1rem;
  color: var(--text-muted);
}

.manuscript-empty-state p {
  margin-bottom: 1.5rem;
  color: var(--text-faint);
}

.manuscript-empty-state button {
  padding: 0.75rem 1.5rem;
  font-size: 1em;
}
```

---

## Implementation Plan

### Week 1: Foundation
- [ ] Day 1-2: Create `ManuscriptConfig.ts` with JSON parsing and validation
- [ ] Day 2-3: Implement `ManuscriptNavigator.ts` basic UI (empty state, header)
- [ ] Day 3-4: Build tree view rendering (static, no interactions)
- [ ] Day 4-5: Add CSS styling, test rendering with sample book.json

### Week 2: Interactivity & Statistics
- [ ] Day 1-2: Implement `ManuscriptStats.ts` (integrate with StatsCalculator)
- [ ] Day 2-3: Add per-chapter statistics display
- [ ] Day 3-4: Implement click-to-open navigation
- [ ] Day 4-5: Add inclusion/exclusion toggle
- [ ] Day 5: Context menus and commands

### Testing Checklist
- [ ] Load valid book.json successfully
- [ ] Display validation errors for invalid book.json
- [ ] Render tree with parts and chapters correctly
- [ ] Click chapter opens file in editor
- [ ] Ctrl+click opens in new pane
- [ ] Toggle inclusion updates book.json
- [ ] Active chapter is highlighted
- [ ] Excluded chapters are grayed out
- [ ] Search filters chapters
- [ ] Statistics display correctly
- [ ] Performance: Loads <1s for 50-chapter book

---

## Success Criteria

✅ **Functional:**
- Authors can visualize entire book structure
- Navigation to any chapter works reliably
- Chapter statistics are accurate
- Inclusion/exclusion persists correctly

✅ **Performance:**
- Initial load <1 second for typical book
- Statistics update <2 seconds after file change
- UI remains responsive during operations

✅ **Usability:**
- Intuitive UI that requires no tutorial
- Visual feedback for all interactions
- Clear indication of active chapter
- Helpful error messages for config issues

✅ **Quality:**
- No data loss or corruption of book.json
- Graceful handling of missing files
- Works with existing Phase 1 & 2 features
- Zero regression bugs

---

## Future Enhancements (Post-MVP)

### Drag & Drop (Phase 3A.1)
- Full drag-and-drop reordering
- Visual drop zones
- Undo/redo support

### Project Wizard (Phase 3A.2)
- Interactive wizard for creating book.json
- Auto-discovery of existing markdown files
- Template selection (monograph, edited volume, thesis, etc.)

### Advanced Features (Phase 3B+)
- Multi-select chapters for bulk operations
- Duplicate chapter structure
- Split/merge chapters
- Chapter templates
- Export structure as outline

---

**Document Status:** Ready for Implementation  
**Approved By:** [Pending]  
**Implementation Start:** [Pending]
