# Panel UX Design Specification

This document provides detailed wireframes and UX specifications for the Publication Checklist Panel and Progress Stats Panel.

---

## Design Principles

### Follow Obsidian's Design Language
- Use Obsidian's native CSS variables for colors
- Match font sizes and spacing from core plugins
- Support both light and dark themes automatically
- Use consistent icon set (Lucide icons)
- Follow Obsidian's panel patterns (similar to File Explorer, Outline, etc.)

### User Experience Goals
1. **Scannable**: Key information visible at a glance
2. **Interactive**: Clear affordances for clickable elements
3. **Responsive**: Smooth updates, no janky animations
4. **Accessible**: Good contrast, keyboard navigation
5. **Informative**: Show status and progress clearly

---

## 1. Publication Checklist Panel

### Layout Structure

```
┌─────────────────────────────────────┐
│ Publication Checklist        [↻][⋮] │ ← Header with refresh + menu
├─────────────────────────────────────┤
│ manuscript.md                        │ ← Document name
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░ 65%            │ ← Progress bar
├─────────────────────────────────────┤
│ [Academic Paper ▼]  [⚙]             │ ← Type selector + filters
├─────────────────────────────────────┤
│ ▼ Content (3/5)                     │ ← Category section (collapsible)
│   ☐ Abstract written                │
│   ☑ Introduction complete           │
│   ☑ Methodology described           │
│   ☐ Results analyzed                │
│   ☐ Discussion written              │
│                                      │
│ ▼ Format (2/3)                      │
│   ☑ Word count appropriate          │
│   ☑ Sections properly ordered       │
│   ☐ Headings consistent   [Auto]   │ ← Auto-validate button
│                                      │
│ ▼ Citations (1/2)                   │
│   ☑ All citations in bibliography   │
│   ☐ Bibliography formatted   [Auto] │
│                                      │
│ ▼ Final Checks (0/4)                │
│   ☐ Proofread entire document       │
│   ☐ Figures properly labeled        │
│   ☐ Tables have captions            │
│   ☐ Acknowledgments included        │
├─────────────────────────────────────┤
│ 📝 Notes                             │ ← Notes section
│ ┌─────────────────────────────────┐ │
│ │ Remember to check APA format   │ │
│ │ for references                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Export Markdown]  [Mark All ✓]    │ ← Footer actions
└─────────────────────────────────────┘
```

### Component Details

#### Header
- **Title**: "Publication Checklist" with clipboard-check icon
- **Refresh button** (↻): Reloads checklist from active file
- **Menu button** (⋮): Dropdown with:
  - Reset all
  - Change type
  - Export to file
  - Settings

#### Document Info
- **File name**: Active document, truncated with ellipsis if long
- **Progress bar**: 
  - Filled portion in accent color (--interactive-accent)
  - Empty portion in muted background
  - Percentage label on right
  - Smooth animation on changes

#### Type Selector
- **Dropdown**: Academic Paper / Book / Article / Thesis
- **Changing type**: Shows confirmation dialog if progress > 0%
- **Filters icon**: Opens filter panel overlay

#### Category Sections
- **Collapsible**: Click category header to expand/collapse
- **Count badge**: Shows completed/total (e.g., "3/5")
- **Visual state**:
  - Expanded: chevron-down icon
  - Collapsed: chevron-right icon
  - All complete: Green checkmark next to count

#### Checklist Items
- **Checkbox**: 
  - Empty: Light border, hover shows accent color
  - Checked: Filled with accent color, white checkmark
  - Transition: 200ms ease animation
- **Title**: 
  - Unchecked: Normal weight, full opacity
  - Checked: Strikethrough, 60% opacity
- **Description**: Smaller text, muted color, shown below title
- **Badges**:
  - "Optional": Small pill badge, gray background
  - Category: Small colored badge
- **Auto-validate button**: 
  - Only shown if item.autoValidation exists
  - Compact secondary button
  - Shows spinner while validating
  - Updates checkbox on completion

#### Notes Section
- **Text area**: 
  - Multi-line, auto-growing
  - Placeholder: "Add notes about your checklist..."
  - Auto-save on blur (debounced 500ms)
  - Muted border, focus shows accent

#### Footer Actions
- **Export Markdown**: Secondary button, downloads/copies markdown
- **Mark All Complete**: Danger-style button, shows confirmation
- Both buttons full width on mobile

### Interaction Patterns

#### Checking/Unchecking Items
1. Click checkbox → immediate visual feedback
2. Progress bar updates with smooth animation
3. Item text fades to strikethrough
4. Save to storage (debounced 300ms)
5. If all in category complete → category gets green badge

#### Auto-Validation
1. Click [Auto] button → button shows spinner
2. Run validation in background
3. Show result notice (✓ or ✗ with message)
4. Update checkbox if validation passes
5. Button spinner stops

#### Category Collapse/Expand
1. Click category header → smooth height animation (200ms)
2. Save collapse state to settings
3. Restore state on panel reopen

### Empty States

**No Active File**:
```
┌─────────────────────────────────────┐
│                                      │
│         📋                           │
│                                      │
│    No document selected              │
│                                      │
│    Open a markdown file to view      │
│    its publication checklist         │
│                                      │
└─────────────────────────────────────┘
```

**Checklist Not Initialized**:
```
┌─────────────────────────────────────┐
│ manuscript.md                        │
├─────────────────────────────────────┤
│                                      │
│    Create a checklist for this       │
│    document?                         │
│                                      │
│    [Academic Paper]                  │
│    [Book]                            │
│    [Article]                         │
│    [Thesis]                          │
│                                      │
└─────────────────────────────────────┘
```

### Keyboard Shortcuts
- `Space`: Toggle selected item checkbox
- `↑`/`↓`: Navigate between items
- `←`/`→`: Collapse/expand categories
- `Ctrl+Enter`: Mark all complete
- `Ctrl+E`: Export markdown

### CSS Classes

```css
.checklist-panel-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.checklist-header {
  padding: var(--size-4-3);
  border-bottom: 1px solid var(--background-modifier-border);
  display: flex;
  align-items: center;
  gap: var(--size-4-2);
}

.checklist-header-title {
  flex: 1;
  font-weight: var(--font-semibold);
  display: flex;
  align-items: center;
  gap: var(--size-4-1);
}

.checklist-header-actions {
  display: flex;
  gap: var(--size-2-1);
}

.checklist-progress-container {
  padding: var(--size-4-3);
  background: var(--background-secondary);
  border-bottom: 1px solid var(--background-modifier-border);
}

.checklist-document-name {
  font-size: var(--font-ui-small);
  color: var(--text-muted);
  margin-bottom: var(--size-2-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checklist-progress-bar {
  height: 8px;
  background: var(--background-modifier-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--size-2-1);
}

.checklist-progress-fill {
  height: 100%;
  background: var(--interactive-accent);
  transition: width 0.3s ease;
}

.checklist-progress-text {
  font-size: var(--font-ui-smaller);
  color: var(--text-muted);
  text-align: right;
}

.checklist-controls {
  padding: var(--size-4-2);
  border-bottom: 1px solid var(--background-modifier-border);
  display: flex;
  gap: var(--size-2-2);
}

.checklist-type-selector {
  flex: 1;
}

.checklist-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--size-4-2);
}

.checklist-category {
  margin-bottom: var(--size-4-4);
}

.checklist-category-header {
  display: flex;
  align-items: center;
  gap: var(--size-2-2);
  padding: var(--size-2-2) var(--size-2-3);
  cursor: pointer;
  border-radius: var(--radius-s);
  transition: background 0.15s ease;
}

.checklist-category-header:hover {
  background: var(--background-modifier-hover);
}

.checklist-category-icon {
  color: var(--text-muted);
}

.checklist-category-title {
  flex: 1;
  font-weight: var(--font-medium);
  font-size: var(--font-ui-small);
}

.checklist-category-badge {
  font-size: var(--font-ui-smaller);
  color: var(--text-muted);
  padding: 2px 8px;
  background: var(--background-modifier-border);
  border-radius: var(--radius-s);
}

.checklist-category-badge.complete {
  color: var(--text-on-accent);
  background: var(--interactive-success);
}

.checklist-items {
  padding-left: var(--size-4-6);
  margin-top: var(--size-2-2);
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: var(--size-2-3);
  padding: var(--size-2-3) var(--size-2-2);
  border-radius: var(--radius-s);
  transition: background 0.15s ease;
}

.checklist-item:hover {
  background: var(--background-modifier-hover);
}

.checklist-item-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--background-modifier-border);
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checklist-item-checkbox:hover {
  border-color: var(--interactive-accent);
}

.checklist-item-checkbox.checked {
  background: var(--interactive-accent);
  border-color: var(--interactive-accent);
}

.checklist-item-checkbox.checked::after {
  content: "✓";
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checklist-item-content {
  flex: 1;
}

.checklist-item-title {
  font-size: var(--font-ui-small);
  margin-bottom: var(--size-2-1);
  transition: opacity 0.2s ease;
}

.checklist-item.completed .checklist-item-title {
  text-decoration: line-through;
  opacity: 0.6;
}

.checklist-item-description {
  font-size: var(--font-ui-smaller);
  color: var(--text-muted);
  line-height: 1.4;
}

.checklist-item-badges {
  display: flex;
  gap: var(--size-2-1);
  margin-top: var(--size-2-1);
}

.checklist-badge {
  font-size: var(--font-ui-smaller);
  padding: 2px 6px;
  border-radius: var(--radius-s);
  background: var(--background-secondary);
  color: var(--text-muted);
}

.checklist-item-auto-validate {
  margin-left: auto;
  padding: 2px 8px;
  font-size: var(--font-ui-smaller);
}

.checklist-notes {
  padding: var(--size-4-3);
  border-top: 1px solid var(--background-modifier-border);
  background: var(--background-secondary);
}

.checklist-notes-label {
  font-size: var(--font-ui-smaller);
  color: var(--text-muted);
  margin-bottom: var(--size-2-2);
  display: flex;
  align-items: center;
  gap: var(--size-2-1);
}

.checklist-notes-textarea {
  width: 100%;
  min-height: 60px;
  padding: var(--size-4-2);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-s);
  resize: vertical;
  font-family: var(--font-interface);
  font-size: var(--font-ui-small);
  background: var(--background-primary);
  color: var(--text-normal);
}

.checklist-notes-textarea:focus {
  outline: none;
  border-color: var(--interactive-accent);
}

.checklist-footer {
  padding: var(--size-4-3);
  border-top: 1px solid var(--background-modifier-border);
  display: flex;
  gap: var(--size-2-2);
}

.checklist-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--size-4-8);
  text-align: center;
  color: var(--text-muted);
}

.checklist-empty-icon {
  font-size: 48px;
  margin-bottom: var(--size-4-4);
  opacity: 0.5;
}
```

---

## 2. Progress Stats Panel

### Layout Structure

```
┌─────────────────────────────────────┐
│ Writing Progress           [↻][⋮]   │ ← Header
├─────────────────────────────────────┤
│ [Today] [Week] [Month] [All Time]   │ ← Date range tabs
├─────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐    │ ← Stats cards grid
│ │   12,543    │ │    1,247    │    │
│ │ Total Words │ │ Today       │    │
│ └─────────────┘ └─────────────┘    │
│ ┌─────────────┐ ┌─────────────┐    │
│ │    3,821    │ │     456     │    │
│ │ This Week   │ │  Avg/Day    │    │
│ └─────────────┘ └─────────────┘    │
│ ┌─────────────┐ ┌─────────────┐    │
│ │  🔥 7 days  │ │  🏆 21 days │    │
│ │  Current    │ │  Longest    │    │
│ └─────────────┘ └─────────────┘    │
├─────────────────────────────────────┤
│ 📊 Active Goals                     │ ← Goals section
│                                      │
│ Daily Goal: 1,000 words             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ 1,247 / 1,000     │ ← Over goal (green)
│                                      │
│ Weekly Goal: 5,000 words            │
│ ▓▓▓▓▓▓▓░░░░░░░░ 3,821 / 5,000       │ ← On track
│                                      │
│ [+ Add Goal]                        │
├─────────────────────────────────────┤
│ 📅 Recent Sessions                  │ ← Sessions table
│ ┌─────────────────────────────────┐ │
│ │ Date       Duration  Words      │ │
│ │ ─────────────────────────────── │ │
│ │ Today      2h 15m    1,247  ✓  │ │
│ │ Yesterday  1h 45m      892      │ │
│ │ Oct 24     3h 30m    1,543  ✓  │ │
│ │ Oct 23     1h 20m      654      │ │
│ │ Oct 22     2h 45m    1,123  ✓  │ │
│ │                                 │ │
│ │ [View All Sessions →]           │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Export CSV]  [Start New Session]  │ ← Footer
└─────────────────────────────────────┘
```

### Component Details

#### Header
- **Title**: "Writing Progress" with trending-up icon
- **Refresh**: Auto-updates every 30s when visible
- **Menu**: Export options, settings, reset stats

#### Date Range Tabs
- **Active tab**: Accent background, bold text
- **Inactive tabs**: Muted, hover shows background
- **Smooth transition**: Content fades in/out (200ms)

#### Stats Cards
- **Layout**: 2-column grid, stack on narrow panels
- **Number**: Large, bold (--font-ui-larger)
- **Label**: Small, muted, below number
- **Special formatting**:
  - Streak cards show fire emoji
  - Numbers over goal show in green
  - Trend indicators (↑/↓/→) show next to changing stats

#### Goals Section
- **Goal item**:
  - Title with target number
  - Progress bar (colored based on progress)
  - Current/target ratio
  - Edit/delete icons on hover
- **Progress bar colors**:
  - < 50%: Gray
  - 50-90%: Yellow
  - 90-100%: Green
  - > 100%: Bright green with celebration icon
- **Add Goal button**: Opens modal with:
  - Type: Daily / Weekly / Monthly / Total
  - Target: Number input
  - Name: Optional custom name

#### Sessions Table
- **Columns**: Date, Duration, Words, Achievement badge
- **Achievement badge** (✓): Shown if goal met
- **Sortable**: Click headers to sort
- **Hover**: Row highlights
- **Compact**: Shows last 10, "View All" expands

#### Footer
- **Export CSV**: Downloads session history
- **Start New Session**: Opens modal or starts timer

### Visual Design Details

#### Color Coding
```
Success (goal met):     --color-green
Warning (near goal):    --color-yellow  
Neutral (in progress):  --text-muted
Accent (highlights):    --interactive-accent
```

#### Typography Scale
```
Large numbers:  24px / --font-ui-larger
Card labels:    11px / --font-ui-smaller
Headers:        14px / --font-ui-medium
Body text:      13px / --font-ui-small
```

#### Spacing
```
Card padding:    16px / --size-4-4
Section gaps:    24px / --size-4-6
Element gaps:    12px / --size-4-3
Tight gaps:       8px / --size-2-2
```

### Interaction Patterns

#### Auto-Refresh
1. Panel opens → start 30s interval
2. Every 30s → fetch new stats
3. Animate changed numbers (count-up effect)
4. Panel closes → clear interval

#### Goal Progress Update
1. User types → word count increases
2. Check active goals
3. Update progress bars (smooth animation)
4. If goal reached → show celebration notice
5. Update achievement badges in session table

#### Add Goal Flow
1. Click "+ Add Goal" → modal opens
2. Select type → shows relevant input
3. Enter target → validates (> 0, reasonable number)
4. Click Save → creates goal, updates panel
5. Goal appears in list with 0% progress

### Empty States

**No Stats Yet**:
```
┌─────────────────────────────────────┐
│                                      │
│         📊                           │
│                                      │
│    No writing stats yet              │
│                                      │
│    Start writing to track your       │
│    progress and set goals            │
│                                      │
│    [Start Writing]                   │
│                                      │
└─────────────────────────────────────┘
```

**No Goals Set**:
```
┌─────────────────────────────────────┐
│ 📊 Active Goals                     │
│                                      │
│    No goals set yet                  │
│                                      │
│    Set goals to track your writing   │
│    progress and stay motivated       │
│                                      │
│    [+ Add Your First Goal]          │
└─────────────────────────────────────┘
```

### Keyboard Shortcuts
- `Ctrl+R`: Refresh stats
- `Ctrl+G`: Add new goal
- `Ctrl+E`: Export CSV

### CSS Classes

```css
.progress-panel-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.progress-header {
  padding: var(--size-4-3);
  border-bottom: 1px solid var(--background-modifier-border);
  display: flex;
  align-items: center;
  gap: var(--size-4-2);
}

.progress-tabs {
  display: flex;
  border-bottom: 1px solid var(--background-modifier-border);
  background: var(--background-secondary);
}

.progress-tab {
  flex: 1;
  padding: var(--size-2-3);
  text-align: center;
  font-size: var(--font-ui-small);
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--text-muted);
  transition: all 0.15s ease;
}

.progress-tab:hover {
  background: var(--background-modifier-hover);
}

.progress-tab.active {
  color: var(--text-normal);
  background: var(--background-primary);
  font-weight: var(--font-semibold);
  border-bottom: 2px solid var(--interactive-accent);
}

.progress-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--size-4-3);
}

.progress-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--size-2-3);
  margin-bottom: var(--size-4-6);
}

.progress-stat-card {
  padding: var(--size-4-4);
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-m);
  text-align: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.progress-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.progress-stat-number {
  font-size: 24px;
  font-weight: var(--font-bold);
  color: var(--text-normal);
  margin-bottom: var(--size-2-1);
}

.progress-stat-number.highlight {
  color: var(--interactive-accent);
}

.progress-stat-label {
  font-size: var(--font-ui-smaller);
  color: var(--text-muted);
}

.progress-section {
  margin-bottom: var(--size-4-6);
}

.progress-section-header {
  display: flex;
  align-items: center;
  gap: var(--size-2-2);
  margin-bottom: var(--size-4-3);
  font-size: var(--font-ui-small);
  font-weight: var(--font-semibold);
}

.progress-goal-item {
  margin-bottom: var(--size-4-3);
  padding: var(--size-4-3);
  background: var(--background-secondary);
  border-radius: var(--radius-m);
}

.progress-goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--size-2-2);
}

.progress-goal-title {
  font-size: var(--font-ui-small);
  font-weight: var(--font-medium);
}

.progress-goal-bar {
  height: 8px;
  background: var(--background-modifier-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--size-2-1);
}

.progress-goal-fill {
  height: 100%;
  transition: width 0.3s ease, background 0.3s ease;
}

.progress-goal-fill.low {
  background: var(--text-muted);
}

.progress-goal-fill.medium {
  background: var(--color-yellow);
}

.progress-goal-fill.high {
  background: var(--color-green);
}

.progress-goal-fill.exceeded {
  background: var(--interactive-success);
}

.progress-goal-progress {
  font-size: var(--font-ui-smaller);
  color: var(--text-muted);
  text-align: right;
}

.progress-sessions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-ui-small);
}

.progress-sessions-table th {
  text-align: left;
  padding: var(--size-2-2);
  border-bottom: 1px solid var(--background-modifier-border);
  color: var(--text-muted);
  font-weight: var(--font-medium);
}

.progress-sessions-table td {
  padding: var(--size-2-2);
  border-bottom: 1px solid var(--background-modifier-border);
}

.progress-sessions-table tr:hover {
  background: var(--background-modifier-hover);
}

.progress-achievement-badge {
  color: var(--interactive-success);
}

.progress-footer {
  padding: var(--size-4-3);
  border-top: 1px solid var(--background-modifier-border);
  display: flex;
  gap: var(--size-2-2);
}
```

---

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Arrow keys for tab navigation
- Escape to close modals/menus

### Screen Readers
- Proper ARIA labels for icons
- Role attributes for custom elements
- Live regions for dynamic updates
- Semantic HTML where possible

### Color Contrast
- All text meets WCAG AA standards
- Important info not conveyed by color alone
- Focus indicators clearly visible

---

## Responsive Behavior

### Panel Width
- **Min width**: 280px
- **Ideal width**: 320-400px
- **Adapts**: Content stacks on narrow panels
- **Grid**: 2-column becomes 1-column under 300px

### Mobile Considerations
- Larger touch targets (44x44px minimum)
- Increased spacing between interactive elements
- Simplified layouts on small screens
- No hover-only actions

---

## Performance

### Optimization Strategies
1. **Lazy rendering**: Only render visible items
2. **Debounced saves**: Batch updates to reduce I/O
3. **Virtual scrolling**: For long lists (100+ items)
4. **Memoization**: Cache computed values
5. **Smooth animations**: Use CSS transforms

### Target Metrics
- **First paint**: < 100ms
- **Interaction response**: < 16ms (60fps)
- **Auto-save delay**: 300ms debounce
- **Auto-refresh**: 30s interval (when visible)

---

## Testing Checklist

### Visual
- [ ] Looks good in light theme
- [ ] Looks good in dark theme
- [ ] Icons render correctly
- [ ] Progress bars animate smoothly
- [ ] Empty states display properly
- [ ] Long text truncates gracefully

### Functional
- [ ] Checkboxes toggle correctly
- [ ] Progress updates accurately
- [ ] Notes auto-save works
- [ ] Auto-validation runs
- [ ] Goals create/edit/delete work
- [ ] Sessions table sorts
- [ ] Export functions work

### Edge Cases
- [ ] No active file handling
- [ ] Very long document names
- [ ] 100% complete checklists
- [ ] Goals exceeded by large amounts
- [ ] Empty goals/sessions lists
- [ ] Rapid clicking/typing

### Cross-Browser
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if macOS)

---

**Version**: 1.0  
**Date**: 2025-10-26  
**Status**: Ready for Implementation
