# Future Features Roadmap

This document tracks planned features for future development phases.

---

## Option B: Integration & Cross-Referencing

### 1. Character-Timeline Integration
**Purpose:** Create bidirectional connections between characters and timeline events

**Features:**
- Link timeline events to specific characters (participants, witnesses, affected parties)
- Automatically calculate and display character ages at event times
- Filter timeline view by character to see their personal timeline
- Track character appearance history across events
- Character journey visualization

**Technical Considerations:**
- Add `characters: string[]` field to TimelineEvent interface
- Add character age calculation based on birthdate in character profile
- Create character filter in TimelinePanel
- Add "View Timeline" button in CharacterProfileModal

**Files to Modify:**
- `src/timeline/TimelineInterfaces.ts` - Add character references
- `src/timeline/TimelinePanel.ts` - Add character filtering
- `src/characters/CharacterProfileModal.ts` - Add timeline view
- `src/timeline/TimelineEventModal.ts` - Add character selection

---

### 2. Research-Character Integration
**Purpose:** Link research notes to character backgrounds and development

**Features:**
- Link research notes to specific characters
- View associated research from character profile modal
- Auto-suggest research when editing character backgrounds
- Research citations in character backstories
- Research validity warnings (e.g., "3 research notes need verification")

**Technical Considerations:**
- Already have `relatedCharacters` field in ResearchNote
- Add research panel/tab in CharacterProfileModal
- Create research suggestion system based on character tags/keywords
- Add research validation indicators

**Files to Modify:**
- `src/characters/CharacterProfileModal.ts` - Add research tab
- `src/research/ResearchPanel.ts` - Add character filtering
- `src/characters/CharacterInterfaces.ts` - Add research summary stats

---

### 3. Scene-Character-Research Integration
**Purpose:** Enhanced scene metadata with character and research tracking

**Features:**
- Track which characters appear in scenes (already partially exists)
- Link research notes to specific scenes
- Scene planning with character/research checklists
- Quick access to character profiles from scene view
- Research quick-reference in scene editor

**Technical Considerations:**
- Outliner Scene interface has metadata fields
- Create scene-research linking system
- Add "Characters in Scene" widget in editor
- Add "Relevant Research" sidebar panel

**Files to Create:**
- `src/outliner/SceneCharacterWidget.ts` - Editor widget for character tracking
- `src/outliner/SceneResearchPanel.ts` - Research quick-reference panel

**Files to Modify:**
- `src/outliner/OutlinerInterfaces.ts` - Add research references to Scene
- `src/research/ResearchInterfaces.ts` - Add scene references

---

### 4. Cross-Reference Navigation
**Purpose:** Seamless navigation between all connected manuscript elements

**Features:**
- Bidirectional links between all tools (characters ↔ timeline ↔ research ↔ scenes)
- Quick navigation menu ("Go to Character", "View in Timeline", etc.)
- Reference graph visualization showing connections
- Backlinks panel showing all references to current item
- Breadcrumb navigation trail

**Technical Considerations:**
- Create centralized reference tracking system
- Implement graph data structure for relationships
- Add navigation command palette entries
- Consider using canvas API for graph visualization

**Files to Create:**
- `src/references/ReferenceManager.ts` - Central reference tracking
- `src/references/ReferenceGraph.ts` - Graph visualization
- `src/references/BacklinksPanel.ts` - Backlinks display
- `src/references/NavigationMenu.ts` - Quick navigation UI

---

## Option C: Additional Workflow Tools

### 1. Plot Arc Tracker
**Purpose:** Track and visualize story arcs and plot progression

**Features:**
- Define multiple plot threads (main plot, subplots, character arcs)
- Mark plot milestones and turning points
- Visualize arc progression through story structure
- Tension/pacing graphs by chapter/scene
- Plot hole detection (unresolved threads)
- Arc completion tracking

**Technical Details:**
- Plot thread with scenes/chapters where it appears
- Intensity/tension ratings at different points
- Visual timeline representation
- Integration with outliner structure

**Files to Create:**
- `src/plotArc/PlotArcInterfaces.ts`
- `src/plotArc/PlotArcManager.ts`
- `src/plotArc/PlotArcPanel.ts`
- `src/plotArc/PlotArcVisualization.ts` - Graphs and charts
- `src/plotArc/PlotThreadModal.ts` - Edit plot threads

**Data Structure:**
```typescript
interface PlotThread {
  id: string;
  title: string;
  type: 'main' | 'subplot' | 'character-arc' | 'mystery' | 'romance';
  description: string;

  // Progression through story
  milestones: PlotMilestone[];
  appearances: string[]; // Scene/chapter IDs

  // Status
  status: 'active' | 'resolved' | 'abandoned';
  resolution?: string;

  // Metadata
  color?: string;
  characters?: string[]; // Related characters
  created: number;
  modified: number;
}

interface PlotMilestone {
  sceneId: string;
  description: string;
  type: 'setup' | 'development' | 'climax' | 'resolution';
  tension: number; // 1-10 intensity rating
}
```

---

### 2. World Building Database
**Purpose:** Comprehensive world building reference system

**Features:**
- **Locations:** Places, buildings, cities, regions, maps
- **Magic/Technology:** Systems, rules, limitations, costs
- **Cultures/Factions:** Groups, hierarchies, relationships, conflicts
- **History/Timeline:** World history separate from story timeline
- **Languages/Names:** Naming conventions, vocabulary
- **Hierarchical organization:** Nested categories and subcategories
- **Quick reference lookup** during writing

**Technical Details:**
- Flexible categorization system
- Rich metadata per item type
- Image/diagram support
- Cross-references between world elements
- Export to wiki/reference format

**Files to Create:**
- `src/worldbuilding/WorldBuildingInterfaces.ts`
- `src/worldbuilding/WorldBuildingManager.ts`
- `src/worldbuilding/WorldBuildingPanel.ts`
- `src/worldbuilding/LocationEditor.ts`
- `src/worldbuilding/MagicSystemEditor.ts`
- `src/worldbuilding/FactionEditor.ts`
- `src/worldbuilding/WorldBuildingExporter.ts`

**Data Structure:**
```typescript
interface WorldElement {
  id: string;
  type: 'location' | 'magic-system' | 'faction' | 'historical-event' | 'custom';
  name: string;
  description: string;

  // Metadata varies by type
  metadata: Record<string, any>;

  // Organization
  category?: string;
  parentId?: string; // For hierarchical structure
  tags: string[];

  // References
  relatedElements: string[];
  relatedCharacters: string[];
  relatedScenes: string[];

  // Rich content
  images?: string[];
  diagrams?: string[];

  created: number;
  modified: number;
}
```

---

### 3. Revision Tracking
**Purpose:** Track manuscript revisions and changes across drafts

**Features:**
- Draft version management (Draft 1, Draft 2, etc.)
- Mark sections/scenes for revision with specific notes
- Revision todo list and priorities
- Track what changed between versions
- Compare drafts side-by-side
- Revision history per scene/chapter
- Accept/reject change workflow

**Technical Details:**
- Integrate with version control concepts
- Store revision metadata in frontmatter
- Visual diff highlighting
- Revision comment threads

**Files to Create:**
- `src/revision/RevisionInterfaces.ts`
- `src/revision/RevisionManager.ts`
- `src/revision/RevisionPanel.ts`
- `src/revision/RevisionMarker.ts` - Mark sections for revision
- `src/revision/DraftComparison.ts` - Side-by-side comparison
- `src/revision/RevisionTodoPanel.ts`

**Data Structure:**
```typescript
interface Draft {
  id: string;
  version: string; // "Draft 1", "Draft 2", "Final", etc.
  created: number;
  description?: string;
  snapshot: Record<string, string>; // fileId -> content hash
}

interface RevisionMark {
  id: string;
  fileId: string;
  draftId: string;

  // Location
  startLine: number;
  endLine: number;

  // Revision details
  type: 'rewrite' | 'expand' | 'cut' | 'polish' | 'fact-check';
  priority: 'high' | 'medium' | 'low';
  notes: string;
  status: 'pending' | 'in-progress' | 'done';

  created: number;
  modified: number;
}
```

---

### 4. Writing Sessions & Goals
**Purpose:** Enhanced writing analytics and goal tracking

**Features:**
- **Session Tracking:**
  - Start/stop writing sessions
  - Session word count and time
  - Distraction tracking
  - Session notes/reflections

- **Goal Management:**
  - Daily/weekly/monthly word goals
  - Project milestone goals
  - Custom goals (chapters, scenes, revision passes)
  - Goal progress visualization

- **Streaks & Habits:**
  - Writing streak tracking
  - Consistency metrics
  - Achievement badges
  - Motivation reminders

- **Analytics Dashboard:**
  - Writing velocity trends
  - Most productive times of day
  - Word count heatmaps
  - Progress forecasting
  - Export analytics reports

**Technical Details:**
- Expand existing stats system
- Add session state management
- Create dashboard visualization
- Goal notification system

**Files to Create:**
- `src/sessions/SessionInterfaces.ts`
- `src/sessions/SessionManager.ts`
- `src/sessions/SessionPanel.ts` - Active session UI
- `src/sessions/GoalManager.ts`
- `src/sessions/GoalPanel.ts`
- `src/sessions/AnalyticsDashboard.ts` - Comprehensive analytics view
- `src/sessions/StreakTracker.ts`

**Files to Modify:**
- `src/stats/StatsData.ts` - Extend with session data
- `src/stats/StatsPanel.ts` - Enhanced statistics view

**Data Structure:**
```typescript
interface WritingSession {
  id: string;
  startTime: number;
  endTime?: number;

  // Metrics
  wordsWritten: number;
  filesModified: string[];
  breaks: SessionBreak[];

  // Context
  goal?: string; // Reference to active goal
  notes?: string;
  mood?: 'great' | 'good' | 'okay' | 'difficult';
}

interface WritingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project' | 'custom';
  target: number; // Words or other metric
  current: number;
  deadline?: number;
  description: string;
  status: 'active' | 'completed' | 'abandoned';
  created: number;
}

interface WritingStreak {
  currentStreak: number; // Days
  longestStreak: number;
  totalDays: number;
  lastWritingDate: number;
}
```

---

## Implementation Priority Recommendations

Based on user value and implementation complexity:

**High Priority (Implement Soon):**
1. Writing Sessions & Goals - Immediate user value, motivational
2. Character-Timeline Integration - Enhances existing tools significantly
3. Settings Organization - Quality of life improvement

**Medium Priority (Future Releases):**
1. Plot Arc Tracker - Complex but high value for plotters
2. World Building Database - Extensive but valuable
3. Cross-Reference Navigation - Nice to have, requires infrastructure

**Lower Priority (As Needed):**
1. Revision Tracking - Useful but can be partially handled externally
2. Research-Character Integration - Nice enhancement
3. Scene-Character-Research - Incremental improvement

---

*Document created: 2025-10-28*
*Last updated: 2025-10-28*
