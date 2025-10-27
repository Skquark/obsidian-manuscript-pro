# UI Panels Architecture Design

This document outlines the architecture for implementing 4 new UI panels and 2 modals for Manuscript Pro.

## Overview

### Current State
All features currently export to console with "coming soon" notices:
- Publication Checklist → console.log(markdown)
- Progress Stats → console output
- Research Bible operations → placeholder notices

### Target State
Interactive UI panels and modals with:
- Real-time data display
- User interaction (checkboxes, filters, search)
- Proper Obsidian integration (ribbon icons, commands, views)
- Persistent state across sessions

---

## 1. Publication Checklist Panel

### Purpose
Display manual checklist items that authors check off before publication.

### Data Source
**Backend**: `PublicationChecklistManager` (already implemented)
- Located: `src/quality/PublicationChecklistManager.ts`
- Method: `getChecklist(file: TFile): PublicationChecklist`
- Returns: Checklist with items, progress %, notes

### Architecture

**View Class**: `ChecklistPanelView` (NEW)
- File: `src/views/ChecklistPanelView.ts`
- Extends: `ItemView`
- View Type: `'checklist-panel'`
- Icon: `'clipboard-check'`

**Data Structure** (already exists):
```typescript
interface PublicationChecklist {
    type: ChecklistType; // 'academic-paper' | 'book' | 'article' | 'thesis'
    items: ChecklistItem[];
    progress: number; // 0-100
    lastUpdated: number;
    notes: string;
    documentPath: string;
}

interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    category: string;
    completed: boolean;
    optional: boolean;
    autoValidation?: string; // Reference to validation method
}
```

### UI Components

**Header**:
- Title: "Publication Checklist"
- Document name
- Progress bar (0-100%)
- Checklist type selector dropdown

**Filters** (collapsible):
- Category filter (All, Content, Format, Citations, etc.)
- Show: All / Only incomplete / Only complete

**Checklist Items**:
- Checkbox + Title (bold if incomplete)
- Description (smaller text, gray)
- Category badge
- Optional badge (if optional)
- Auto-validate button (if autoValidation exists)

**Footer**:
- Text area for notes
- Export to Markdown button
- Mark all complete button

**Actions**:
- Click checkbox → toggle item completion → update progress → save
- Click auto-validate → run validation → update item status
- Type in notes → debounced save
- Export → generate markdown report

### Registration

```typescript
// In main.ts onload()
this.registerView(
    CHECKLIST_PANEL_VIEW_TYPE,
    (leaf) => new ChecklistPanelView(leaf, this)
);

// Add ribbon icon
this.addRibbonIcon('clipboard-check', 'Open Checklist', () => {
    this.activateChecklistPanel();
});

// Add command
this.addCommand({
    id: 'open-checklist-panel',
    name: 'Open Publication Checklist',
    callback: () => this.activateChecklistPanel()
});
```

### Update main.ts Command

**Before**:
```typescript
const checklist = this.checklistManager.getChecklist(activeFile);
// TODO: Display checklist object in UI panel instead of console
new Notice('Checklist exported to console (UI panel coming soon)');
console.log(markdown);
```

**After**:
```typescript
const checklist = this.checklistManager.getChecklist(activeFile);
await this.activateChecklistPanel();
```

---

## 2. Progress Stats Panel

### Purpose
Display writing progress statistics and goals.

### Data Source
**Backend**: `ProgressTrackingManager` (already implemented)
- Located: `src/quality/ProgressTrackingManager.ts`
- Methods: `getProgressStats()`, `getGoals()`, `getSessionStats()`

### Architecture

**View Class**: `ProgressPanelView` (NEW)
- File: `src/views/ProgressPanelView.ts`
- Extends: `ItemView`
- View Type: `'progress-panel'`
- Icon: `'trending-up'`

**Data Structure** (already exists):
```typescript
interface ProgressStats {
    totalWords: number;
    todayWords: number;
    weekWords: number;
    averageWordsPerDay: number;
    writingDays: number;
    currentStreak: number;
    longestStreak: number;
    goals: Goal[];
    sessions: WritingSession[];
}
```

### UI Components

**Header**:
- Title: "Writing Progress"
- Date range selector (Today, Week, Month, All Time)

**Stats Grid** (cards):
- Total Words (large number + label)
- Today's Words (with goal progress bar if set)
- This Week (with goal progress bar)
- Average/Day (trend indicator)
- Current Streak (flame icon + days)
- Longest Streak

**Goals Section**:
- List of active goals
- Progress bars for each
- Add Goal button

**Session History** (table):
- Date | Duration | Words | Progress
- Sortable columns
- Last 10 sessions, "View All" link

**Footer**:
- Refresh button
- Export CSV button

### Registration

```typescript
// In main.ts onload()
this.registerView(
    PROGRESS_PANEL_VIEW_TYPE,
    (leaf) => new ProgressPanelView(leaf, this)
);

this.addRibbonIcon('trending-up', 'Open Progress Stats', () => {
    this.activateProgressPanel();
});
```

---

## 3. Research Fact Input Modal

### Purpose
Quick modal for adding research facts to Research Bible.

### Data Source
**Backend**: `ResearchBibleManager` (already implemented)
- Located: `src/quality/ResearchBibleManager.ts`
- Method: `addFact(fact: ResearchFact): void`

### Architecture

**Modal Class**: `ResearchFactModal` (NEW)
- File: `src/modals/ResearchFactModal.ts`
- Extends: `Modal`
- Opens: From command or ribbon

**Data Structure** (already exists):
```typescript
interface ResearchFact {
    id: string;
    term: string;
    definition: string;
    category: string;
    tags: string[];
    sources: string[];
    notes: string;
    dateAdded: number;
}
```

### UI Components

**Form Fields**:
- Term (required, text input)
- Category (dropdown: Character, Setting, Event, Concept, Custom)
- Definition (textarea, 3 rows)
- Tags (comma-separated, text input)
- Sources (textarea, 2 rows)
- Notes (textarea, 3 rows)

**Buttons**:
- Save & Close (primary)
- Save & New (secondary)
- Cancel

**Validation**:
- Term is required
- Show error if term already exists (with option to update)

### Actions

```typescript
onSubmit() {
    const fact: ResearchFact = {
        id: generateId(),
        term: this.termInput.value,
        definition: this.definitionInput.value,
        category: this.categoryDropdown.value,
        tags: this.tagsInput.value.split(',').map(t => t.trim()),
        sources: this.sourcesInput.value.split('\n'),
        notes: this.notesInput.value,
        dateAdded: Date.now()
    };
    
    this.plugin.researchBible.addFact(fact);
    new Notice(`✓ Added: ${fact.term}`);
    
    if (this.saveAndNew) {
        this.clearForm();
    } else {
        this.close();
    }
}
```

### Registration

```typescript
this.addCommand({
    id: 'add-research-fact',
    name: 'Add Research Fact',
    callback: () => {
        new ResearchFactModal(this.app, this).open();
    }
});
```

### Update main.ts Command

**Before**:
```typescript
new Notice('Research fact input modal coming soon');
```

**After**:
```typescript
new ResearchFactModal(this.app, this).open();
```

---

## 4. Research Bible Search Modal

### Purpose
Search and browse Research Bible entries.

### Data Source
**Backend**: `ResearchBibleManager` (already implemented)
- Method: `search(query: string): ResearchFact[]`
- Method: `getAllFacts(): ResearchFact[]`
- Method: `getByCategory(category: string): ResearchFact[]`

### Architecture

**Modal Class**: `ResearchSearchModal` (NEW)
- File: `src/modals/ResearchSearchModal.ts`
- Extends: `Modal`
- Wide modal (800px)

### UI Components

**Search Bar**:
- Text input with live search
- Filter by category dropdown
- Filter by tags (multi-select)

**Results List**:
- Scrollable container (max-height: 400px)
- Each result shows:
  - Term (bold, clickable)
  - Category badge
  - Definition preview (truncated to 100 chars)
  - Tags (small badges)

**Detail Pane** (shows when item selected):
- Full term
- Category
- Full definition
- Tags
- Sources (bulleted list)
- Notes
- Date added
- Actions: Edit, Delete, Insert into document

**Footer**:
- Count: "Showing X of Y results"
- Add New button
- Close button

### Actions

```typescript
onSearch(query: string) {
    const results = this.plugin.researchBible.search(query);
    this.renderResults(results);
}

onSelectResult(fact: ResearchFact) {
    this.selectedFact = fact;
    this.renderDetailPane(fact);
}

onInsertToDocument() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
        const cursor = view.editor.getCursor();
        view.editor.replaceRange(
            `**${this.selectedFact.term}**: ${this.selectedFact.definition}`,
            cursor
        );
        new Notice('✓ Inserted into document');
        this.close();
    }
}
```

### Registration

```typescript
this.addCommand({
    id: 'search-research-bible',
    name: 'Search Research Bible',
    callback: () => {
        new ResearchSearchModal(this.app, this).open();
    }
});
```

---

## 5. Citation Validation Implementation

### Purpose
Implement the 3 placeholder validation methods in PublicationChecklistManager.

### Current State
```typescript
private async checkAllCitationsInBib(): Promise<boolean> {
    return true; // Placeholder
}

private async checkUnusedBibEntries(): Promise<boolean> {
    return true; // Placeholder
}

private async checkOrphanedCitations(): Promise<boolean> {
    return true; // Placeholder
}
```

### Implementation Plan

#### Step 1: Extend BibliographyManager

Add new methods to `src/citations/BibliographyManager.ts`:

```typescript
/**
 * Get all citation keys used in a document
 */
async getCitationsInDocument(file: TFile): Promise<Set<string>> {
    const content = await this.app.vault.read(file);
    const citations = new Set<string>();
    
    // Match [@key] and @key patterns
    const citeRegex = /\[@?([\w\-:]+)\]/g;
    let match;
    
    while ((match = citeRegex.exec(content)) !== null) {
        citations.add(match[1]);
    }
    
    return citations;
}

/**
 * Check if all citations have bibliography entries
 */
async validateCitationsInDocument(file: TFile): Promise<{
    valid: boolean;
    missing: string[];
}> {
    const citedKeys = await this.getCitationsInDocument(file);
    const missing: string[] = [];
    
    for (const key of citedKeys) {
        if (!this.hasCitation(key)) {
            missing.push(key);
        }
    }
    
    return {
        valid: missing.length === 0,
        missing
    };
}

/**
 * Find unused bibliography entries
 */
async getUnusedEntries(file: TFile): Promise<string[]> {
    const citedKeys = await this.getCitationsInDocument(file);
    const unused: string[] = [];
    
    this.entries.forEach((entry, key) => {
        if (!citedKeys.has(key)) {
            unused.push(key);
        }
    });
    
    return unused;
}
```

#### Step 2: Update PublicationChecklistManager

Replace placeholders with real validation:

```typescript
private async checkAllCitationsInBib(): Promise<boolean> {
    const file = this.app.workspace.getActiveFile();
    if (!file) return true;
    
    const bibPaths = await this.plugin.bibliographyManager.discoverBibliography(file);
    await this.plugin.bibliographyManager.loadBibliography(bibPaths);
    
    const result = await this.plugin.bibliographyManager.validateCitationsInDocument(file);
    
    if (!result.valid) {
        console.warn('Missing bibliography entries:', result.missing);
    }
    
    return result.valid;
}

private async checkUnusedBibEntries(): Promise<boolean> {
    const file = this.app.workspace.getActiveFile();
    if (!file) return true;
    
    const unused = await this.plugin.bibliographyManager.getUnusedEntries(file);
    
    if (unused.length > 0) {
        console.info('Unused bibliography entries:', unused);
        // Note: This is informational, not necessarily an error
    }
    
    return true; // Don't fail for unused entries
}

private async checkOrphanedCitations(): Promise<boolean> {
    // This is the same as checkAllCitationsInBib
    return this.checkAllCitationsInBib();
}
```

---

## Implementation Order

### Phase 1: Foundation
1. ✅ Create this architecture document
2. Create shared UI components (if needed)
3. Add CSS styles for all panels

### Phase 2: Quick Wins (Modals)
4. **Research Fact Input Modal** (simplest, single form)
   - New file: `src/modals/ResearchFactModal.ts`
   - Update: `src/main.ts` command

5. **Research Bible Search Modal** (more complex, search + detail)
   - New file: `src/modals/ResearchSearchModal.ts`
   - Update: `src/main.ts` command

### Phase 3: Side Panels
6. **Publication Checklist Panel** (most complete backend)
   - New file: `src/views/ChecklistPanelView.ts`
   - Update: `src/main.ts` view registration + command

7. **Progress Stats Panel** (visualization heavy)
   - New file: `src/views/ProgressPanelView.ts`
   - Update: `src/main.ts` view registration + command

### Phase 4: Backend
8. **Citation Validation** (backend logic)
   - Update: `src/citations/BibliographyManager.ts` (add methods)
   - Update: `src/quality/PublicationChecklistManager.ts` (replace placeholders)

### Phase 5: Polish
9. Add CSS styles for all components
10. Add icons and visual polish
11. Test all features
12. Update documentation

---

## File Structure

```
src/
├── modals/                          (NEW DIRECTORY)
│   ├── ResearchFactModal.ts        (NEW)
│   └── ResearchSearchModal.ts      (NEW)
├── views/                           (NEW DIRECTORY)
│   ├── ChecklistPanelView.ts       (NEW)
│   └── ProgressPanelView.ts        (NEW)
├── citations/
│   └── BibliographyManager.ts      (UPDATE - add validation methods)
├── quality/
│   └── PublicationChecklistManager.ts  (UPDATE - replace placeholders)
└── main.ts                          (UPDATE - register views + commands)
```

---

## CSS Classes

### Checklist Panel
```css
.checklist-panel-view { }
.checklist-header { }
.checklist-progress-bar { }
.checklist-filters { }
.checklist-item { }
.checklist-item.completed { }
.checklist-item-checkbox { }
.checklist-item-title { }
.checklist-item-description { }
.checklist-category-badge { }
.checklist-optional-badge { }
.checklist-notes { }
```

### Progress Panel
```css
.progress-panel-view { }
.progress-stats-grid { }
.progress-stat-card { }
.progress-stat-number { }
.progress-stat-label { }
.progress-goal-item { }
.progress-goal-bar { }
.progress-session-table { }
```

### Research Modals
```css
.research-fact-modal { }
.research-search-modal { }
.research-search-results { }
.research-result-item { }
.research-detail-pane { }
.research-tag-badge { }
```

---

## State Management

### Checklist Panel
- Current file path
- Current checklist
- Filter settings (persist in settings)
- Dirty state (unsaved changes)

### Progress Panel
- Date range selection (persist in settings)
- Sort order for sessions table
- Auto-refresh interval (every 30s when visible)

### Research Modals
- Search query
- Selected fact
- Filter settings

---

## Testing Checklist

Before committing:
- [ ] All panels open from commands
- [ ] All panels open from ribbon icons
- [ ] Checklist items can be checked/unchecked
- [ ] Checklist progress updates correctly
- [ ] Progress stats display correctly
- [ ] Research fact can be added
- [ ] Research Bible can be searched
- [ ] Citation validation works
- [ ] All panels close properly
- [ ] State persists across reloads
- [ ] No console errors
- [ ] Responsive layout works

---

## Success Metrics

1. **Usability**: Users can complete checklist without console
2. **Performance**: Panels load in <100ms
3. **Persistence**: State saved between sessions
4. **Integration**: Works with existing commands and workflows
5. **Polish**: Matches Obsidian design language

---

## Future Enhancements (Not in Scope)

- Export checklist to PDF
- Share checklist templates
- Progress graphs and charts
- Research Bible export to CSV/JSON
- Bulk import research facts
- Citation validation auto-fix
- Real-time collaboration

---

## Notes

- All panels should handle "no active file" gracefully
- All panels should auto-refresh when data changes
- Use Obsidian's Notice API for user feedback
- Follow Obsidian's design patterns (icons, colors, spacing)
- Make panels collapsible/resizable where appropriate
- Add keyboard shortcuts for power users
- Support both light and dark themes

---

**Version**: 1.0  
**Date**: 2025-10-26  
**Status**: Ready for Implementation
