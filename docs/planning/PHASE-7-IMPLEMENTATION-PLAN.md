# Phase 7: Advanced Writing Features
## Implementation Plan

**Target Users:** Fiction writers, academic authors, professional manuscript writers
**Focus Areas:** Plot tracking, cross-panel integration, enhanced export
**Timeline:** 4-6 weeks
**Priority:** High value features with broad appeal

---

## 🎯 Feature 1: Export Template Library

### Current State
**Already Implemented:**
✅ Export profiles (PDF, DOCX, HTML, EPUB, LaTeX)
✅ Pandoc integration with configurable options
✅ Profile variants (full/test/sample builds)
✅ Custom profile creation
✅ Batch export capability
✅ CSL citation styles
✅ Template variables
✅ Trim size presets

**What's Missing:**
❌ Journal-specific templates (Nature, IEEE, ACM, etc.)
❌ Pre-configured academic templates
❌ Fiction formatting templates (Shunn, industry standard)
❌ Template preview/documentation
❌ Template import/export sharing
❌ Quick template switcher

### Implementation Plan

#### 1.1 Journal Template Library
**Create pre-configured profiles for major publishers:**

**Academic Journals:**
- Nature/Science family
- IEEE Transactions
- ACM formats
- Springer/Elsevier templates
- APA manuscript format
- Chicago Manual of Style
- Medical journals (JAMA, New England Journal)

**Fiction Standards:**
- Shunn Manuscript Format (short stories)
- Novel standard manuscript format
- Screenplay format (via Fountain)
- Kindle Direct Publishing (KDP)
- IngramSpark print specs

**Files to Create:**
```typescript
// src/export/templates/JournalTemplates.ts
export interface JournalTemplate extends ExportProfile {
  publisher: string;
  journalName: string;
  submissionGuidelines?: string; // URL
  requirements: {
    citationStyle: string;
    wordLimit?: number;
    figureLimit?: number;
    abstractWordLimit?: number;
  };
}

export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  // Nature family
  {
    id: 'nature',
    name: 'Nature',
    publisher: 'Springer Nature',
    format: 'pdf',
    requirements: {
      citationStyle: 'nature',
      wordLimit: 5000,
      abstractWordLimit: 200,
    },
    pandocOptions: {
      csl: 'nature.csl',
      variables: {
        documentclass: 'article',
        fontfamily: 'times',
        fontsize: '12pt',
        linestretch: '2',
        geometry: 'margin=1in',
      }
    },
    // ... full config
  },
  // IEEE
  {
    id: 'ieee',
    name: 'IEEE Transactions',
    publisher: 'IEEE',
    // ... IEEE-specific config
  },
  // Fiction
  {
    id: 'shunn-short',
    name: 'Shunn Standard (Short Story)',
    publisher: 'Industry Standard',
    format: 'docx',
    // ... Shunn formatting rules
  },
];
```

**Files to Modify:**
- `src/export/ExportManager.ts` - Add template library loading
- `src/export/ExportDialog.ts` - Add template browser UI
- `src/settingsTab.ts` - Add template library settings

#### 1.2 Template Browser UI
**Create modal for browsing/selecting templates:**

```typescript
// src/export/TemplateBrowserModal.ts
export class TemplateBrowserModal extends Modal {
  // Categories: Academic, Fiction, Technical, Custom
  // Search/filter by publisher, format, requirements
  // Preview template details
  // One-click apply to current export
  // Save as custom profile
}
```

**Features:**
- Category tabs (Academic/Fiction/Technical)
- Search by journal name, publisher
- Filter by format (PDF/DOCX)
- Preview template requirements
- "Use Template" button
- "Clone & Customize" button

#### 1.3 Template Import/Export
**Allow users to share custom templates:**

```typescript
// Export template to JSON
interface TemplatePackage {
  version: string;
  template: ExportProfile;
  cslFile?: string; // Embedded CSL content
  pandocTemplate?: string; // Custom Pandoc template
  metadata: {
    author: string;
    description: string;
    tags: string[];
  };
}

// Import from .mspro-template file
// Export selected template
// Share community templates
```

**Implementation Time:** 1-2 weeks

---

## 📊 Feature 2: Plot Arc Tracker

### Architecture

**Core Components:**
```
src/plotArc/
├── PlotArcInterfaces.ts      - Data models
├── PlotArcManager.ts          - State management
├── PlotArcPanel.ts            - Main panel view
├── PlotThreadEditor.ts        - Edit plot threads
├── PlotVisualization.ts       - Visual timeline/graphs
├── TensionGraph.ts            - Tension/pacing charts
└── PlotAnalyzer.ts            - Plot hole detection
```

### Data Model

```typescript
interface PlotThread {
  id: string;
  title: string;
  type: 'main-plot' | 'subplot' | 'character-arc' | 'mystery' | 'romance' | 'custom';
  description: string;
  color?: string; // For visualization

  // Story structure
  status: 'active' | 'resolved' | 'abandoned';
  resolution?: string;

  // Progression through manuscript
  milestones: PlotMilestone[];
  appearances: PlotAppearance[]; // Where thread appears

  // Relationships
  relatedCharacters: string[]; // Character IDs
  relatedThreads: string[]; // Other plot threads this interacts with
  conflicts: string[]; // Conflicting threads (for tension)

  // Metadata
  created: number;
  modified: number;
}

interface PlotMilestone {
  id: string;
  sceneId: string; // Link to outliner scene
  chapterNumber?: number;

  type: 'setup' | 'inciting-incident' | 'rising-action' |
        'midpoint' | 'climax' | 'resolution' | 'custom';

  description: string;
  tension: number; // 1-10 intensity rating
  notes?: string;

  // Story structure markers
  actNumber?: number; // 1, 2, 3 for three-act structure
  beatSheet?: string; // Save the Cat, Hero's Journey, etc.
}

interface PlotAppearance {
  sceneId: string;
  chapterNumber?: number;
  prominence: 'primary' | 'secondary' | 'mentioned';
  notes?: string;
}

interface PlotSettings {
  structure: 'three-act' | 'four-act' | 'five-act' | 'save-the-cat' |
             'heros-journey' | 'seven-point' | 'custom';
  showTensionGraph: boolean;
  showTimeline: boolean;
  colorCodeThreads: boolean;
}
```

### UI Components

#### 2.1 Plot Arc Panel
**Main panel showing all plot threads:**

**Layout:**
```
┌─────────────────────────────────────────┐
│ Plot Arc Tracker              [+] [⚙]  │
├─────────────────────────────────────────┤
│ View: [Timeline] [List] [Graph]        │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ Main Plot ──────────────────────┐   │
│ │ Status: Active • 12 milestones   │   │
│ │ [======>          ] 45% complete │   │
│ └──────────────────────────────────┘   │
│                                         │
│ ┌─ Romance Subplot ────────────────┐   │
│ │ Status: Active • 8 milestones    │   │
│ │ [====>            ] 30% complete │   │
│ └──────────────────────────────────┘   │
│                                         │
│ ┌─ Mystery Thread ─────────────────┐   │
│ │ Status: Resolved • 15 milestones │   │
│ │ [=================>] 100%        │   │
│ └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Create new plot thread
- Filter by type/status
- Quick edit thread details
- View thread in timeline/graph
- Toggle visibility
- Export plot summary

#### 2.2 Timeline Visualization
**Visual representation of plot threads through story:**

```
Chapter: 1    2    3    4    5    6    7    8    9   10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Main Plot   ●────●────────●────────────●────────●───
            S    I        R            M        C

Romance     ─────●────●───────●────●──────────●─────
                 M    M       M    C          R

Mystery     ──●──────●───●───────────────●────●─────
              S      C   C             C    R

Legend: S=Setup I=Inciting M=Milestone C=Climax R=Resolution
```

**Interactive:**
- Hover to see milestone details
- Click to jump to scene/chapter
- Drag to adjust milestone position
- Color-coded by thread type
- Tension overlay (heat map)

#### 2.3 Tension Graph
**Pacing and tension visualization:**

```
Tension
  10 ┤                                    ╭──╮
   9 ┤                               ╭────╯  ╰╮
   8 ┤                          ╭────╯        ╰─╮
   7 ┤                    ╭─────╯               ╰╮
   6 ┤              ╭─────╯                      │
   5 ┤         ╭────╯                            │
   4 ┤    ╭────╯                                 │
   3 ┤╭───╯                                      ╰─╮
   2 ┤╯                                            ╰╮
   1 ┤                                              ╰─
     └┬────┬────┬────┬────┬────┬────┬────┬────┬────┬
      1    2    3    4    5    6    7    8    9   10
                        Chapter
```

**Features:**
- Aggregate tension from all threads
- Individual thread tension
- Story structure overlay (acts)
- Identify pacing issues
- Export chart as image

#### 2.4 Plot Thread Editor
**Detailed editor for individual threads:**

```typescript
// src/plotArc/PlotThreadEditor.ts
export class PlotThreadEditorModal extends Modal {
  // Thread metadata (title, type, color)
  // Description editor
  // Milestone list with add/edit/delete
  // Character associations
  // Related threads
  // Resolution status
  // Timeline preview
}
```

#### 2.5 Plot Hole Detection
**Analyze threads for common issues:**

```typescript
// src/plotArc/PlotAnalyzer.ts
export class PlotAnalyzer {
  // Detect unresolved threads
  // Find threads with no climax
  // Identify tension issues (flat pacing)
  // Check for orphaned milestones
  // Verify character involvement
  // Suggest missing beats
}
```

**Report Example:**
```
⚠️ Plot Analysis Report

Unresolved Threads (2):
• Romance subplot - No resolution milestone found
• Mystery thread - Last milestone at 70% through story

Pacing Issues (1):
• Main plot - Flat tension from Ch. 5-7 (consider adding conflict)

Missing Beats (Save the Cat):
• "Dark Night of the Soul" - Not clearly marked

Suggestions:
✓ Add climax for romance subplot in Ch. 9-10
✓ Increase tension in middle section
✓ Mark major story beats for reference
```

**Implementation Time:** 2-3 weeks

---

## 🔗 Feature 3: Integration Hub

### Purpose
Connect all existing panels (Characters, Research, Outliner, Timeline, Plot Arcs) with bidirectional links and quick navigation.

### Architecture

**Core Components:**
```
src/integration/
├── IntegrationInterfaces.ts   - Reference types
├── ReferenceManager.ts        - Central link tracking
├── BacklinksPanel.ts          - "Referenced in" panel
├── QuickNavigator.ts          - Jump between linked items
├── RelationshipGraph.ts       - Visual graph of connections
└── IntegrationCommands.ts     - Command palette entries
```

### Data Model

```typescript
// Universal reference system
interface Reference {
  id: string;
  type: 'character' | 'scene' | 'research' | 'timeline-event' |
        'plot-thread' | 'location' | 'note';
  targetId: string; // ID of referenced item
  sourceId: string; // ID of item making reference
  sourceType: ReferenceType;
  context?: string; // Surrounding text or description
  created: number;
}

// Bidirectional link tracking
interface ReferenceIndex {
  // Map of item ID -> all items that reference it
  backlinks: Map<string, Reference[]>;

  // Map of item ID -> all items it references
  outgoingLinks: Map<string, Reference[]>;
}

// Enhanced interfaces for existing systems
interface Character {
  // ... existing fields

  // Integration additions:
  referencedInScenes: string[]; // Scene IDs
  referencedInResearch: string[]; // Research note IDs
  appearsInTimelineEvents: string[]; // Timeline event IDs
  involvedInPlotThreads: string[]; // Plot thread IDs
}

interface Scene {
  // ... existing fields

  // Integration additions:
  characters: string[]; // Character IDs appearing in scene
  relevantResearch: string[]; // Research note IDs
  plotThreads: string[]; // Active plot threads in scene
  timelineEvents: string[]; // Events occurring in this scene
}

interface ResearchNote {
  // ... existing fields

  // Integration additions:
  relatedCharacters: string[];
  usedInScenes: string[];
  relatedPlotThreads: string[];
}
```

### UI Components

#### 3.1 Backlinks Panel
**Show "Referenced in" for any item:**

```
┌─────────────────────────────────────┐
│ Referenced In              [↻]     │
├─────────────────────────────────────┤
│ Character: John Smith               │
│                                     │
│ Scenes (12)                         │
│ • Chapter 1: Introduction           │
│ • Chapter 3: First encounter        │
│ • Chapter 7: Confrontation         │
│   [Show all 12 →]                   │
│                                     │
│ Research Notes (3)                  │
│ • FBI Hierarchy                     │
│ • Police Procedures                 │
│ • Witness Protection Program        │
│                                     │
│ Plot Threads (2)                    │
│ • Main Plot - Investigation arc     │
│ • Subplot - Personal redemption     │
│                                     │
│ Timeline (5 events)                 │
│ • 2020-01-15: Joins task force     │
│ • 2020-03-22: Makes breakthrough    │
│   [Show all 5 →]                    │
└─────────────────────────────────────┘
```

**Features:**
- Auto-update when references change
- Click to navigate to referenced item
- Group by type
- Show context preview
- Filter by reference type

#### 3.2 Quick Navigator
**Command palette for jumping between linked items:**

```typescript
// src/integration/QuickNavigator.ts
export class QuickNavigatorModal extends FuzzySuggestModal {
  // Type to search: "John Smith" or "Ch. 5" or "FBI research"
  // Results show all related items
  // Select to open in appropriate panel
  // Keyboard shortcuts for common navigations
}
```

**Example:**
```
Quick Navigate to...

> John Smith

Results:
→ Character Profile: John Smith
  Scene References (12)
    • Chapter 1: Introduction [Cmd+1]
    • Chapter 3: First encounter [Cmd+2]
  Plot Threads (2)
    • Main Plot [Cmd+3]
  Research (3)
    • FBI Hierarchy [Cmd+4]
```

#### 3.3 Relationship Graph
**Visual graph showing all connections:**

```
                Character: John
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   Research:       Scene:       Plot:
   FBI Rules      Ch. 3      Investigation
        │             │             │
        └─────────────┼─────────────┘
                      │
                  Timeline:
                 Joins Force
```

**Features:**
- Interactive graph visualization
- Filter by relationship type
- Zoom/pan controls
- Click node to focus
- Export as image
- Detect orphaned items

#### 3.4 Integration Enhancements to Existing Panels

**Character Panel:**
```typescript
// Add "View References" button
// Show inline scene count
// Quick jump to related research
// Plot thread indicators
```

**Scene/Outliner Panel:**
```typescript
// Character chips (clickable)
// Research quick-reference sidebar
// Active plot threads indicator
// "Add to Timeline" quick action
```

**Research Panel:**
```typescript
// Character tags (linked)
// Scene usage count
// "Find in Scenes" search
```

**Timeline Panel:**
```typescript
// Character involvement indicators
// Link to scenes
// Plot milestone markers
```

### Implementation

#### Phase 1: Reference System (Week 1)
- Create ReferenceManager
- Update existing interfaces
- Implement link tracking
- Migration for existing data

#### Phase 2: Backlinks (Week 1)
- Create BacklinksPanel
- Integrate with existing panels
- Add to view registry
- Settings UI

#### Phase 3: Navigation (Week 2)
- Quick Navigator modal
- Command palette integration
- Keyboard shortcuts
- Panel-to-panel linking

#### Phase 4: Graph View (Week 2)
- Relationship graph visualization
- Interactive controls
- Export functionality

**Implementation Time:** 2-3 weeks

---

## 📅 Implementation Timeline

### Week 1-2: Export Template Library
- Create journal templates
- Build template browser UI
- Add import/export functionality
- Documentation

### Week 3-5: Plot Arc Tracker
- Core data models
- Plot Arc Panel UI
- Timeline visualization
- Tension graphs
- Plot hole detection
- Integration with outliner

### Week 6-8: Integration Hub
- Reference system foundation
- Backlinks panel
- Quick navigator
- Relationship graph
- Panel enhancements

### Week 9: Polish & Testing
- Bug fixes
- Performance optimization
- User testing
- Documentation
- Tutorial/help system

---

## 🎯 Success Metrics

**Export Templates:**
- [ ] 15+ journal templates available
- [ ] Template browser with search/filter
- [ ] Import/export functionality
- [ ] User satisfaction feedback

**Plot Arc Tracker:**
- [ ] Create/edit plot threads
- [ ] Visual timeline with milestones
- [ ] Tension graph generation
- [ ] Plot hole detection working
- [ ] Integration with scenes/chapters

**Integration Hub:**
- [ ] Bidirectional links between all panels
- [ ] Backlinks panel functional
- [ ] Quick navigator responsive
- [ ] Graph visualization clear
- [ ] No performance degradation

---

## 📝 Documentation Needs

1. **User Guides:**
   - Template library guide
   - Plot tracking tutorial
   - Integration features overview

2. **Developer Docs:**
   - Integration API
   - Adding new reference types
   - Template creation guide

3. **Examples:**
   - Sample plot structures
   - Template packages
   - Integration patterns

---

*Document Created: 2025-10-29*
*Phase 7 Target: 6-8 weeks*
*Priority: High*
