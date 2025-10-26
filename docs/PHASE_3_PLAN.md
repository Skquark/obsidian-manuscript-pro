# Phase 3: Manuscript Project Management & Productivity

## Overview

Phase 3 focuses on transforming the plugin from a single-file enhancement tool into a comprehensive manuscript project management system for book-length academic writing.

**Target User:** Scientific book authors managing multi-chapter manuscripts with hundreds of pages, dozens of figures/tables, and extensive cross-references and citations.

**Core Philosophy:** Provide writer-friendly tools that manage complexity at the manuscript level while maintaining professional academic standards.

---

## Feature Roadmap

### Phase 3A: Project Foundation (Priority: High)

#### 1. Manuscript Navigator ⭐⭐⭐
**Status:** Planned  
**Complexity:** Medium  
**Estimated Lines:** ~800 lines  

**Description:** A dedicated sidebar view that treats a collection of Markdown files as a single, cohesive book project with structural organization capabilities.

**Key Capabilities:**
- Define book structure via `book.json` or frontmatter-based configuration
- Visual hierarchical tree view (Parts → Chapters → Sections)
- Drag-and-drop reordering of chapters and sections
- Per-chapter statistics (word count, citations, figures, etc.)
- Include/exclude chapters from builds (draft mode)
- Quick navigation to any chapter/section
- Right-click context menu (Add Chapter, Split Chapter, Rename, etc.)

**User Stories:**
- As an author, I want to see my entire book structure at a glance
- As an author, I want to reorder chapters by dragging them
- As an author, I want to exclude draft chapters from my build
- As an author, I want to see which chapters need more work (word count goals)

---

#### 2. Pre-publication Checklist ⭐⭐⭐
**Status:** Planned  
**Complexity:** Medium  
**Estimated Lines:** ~600 lines  

**Description:** Comprehensive manuscript validation that scans the entire project for academic writing errors and inconsistencies.

**Key Capabilities:**
- **Cross-Reference Validation:** All `\ref{}`, `\eqref{}`, etc. point to valid labels
- **Citation Completeness:** All citations exist in bibliography, no orphaned bib entries
- **Figure/Table Audit:** All figures have captions and labels, proper numbering
- **Numbering Consistency:** Sequential numbering within chapters (Fig 3.1, 3.2, not 3.1, 3.5)
- **Structural Checks:** No duplicate labels, no empty sections
- **Issue Severity Levels:** Critical (blocking), Warnings (recommended fixes), Info

**Validation Categories:**
1. **References:** Undefined, duplicate labels, broken references
2. **Citations:** Missing entries, orphaned bibliography items, malformed keys
3. **Figures/Tables:** Missing captions, missing labels, duplicate numbers
4. **Structure:** Empty chapters, inconsistent heading levels
5. **Formatting:** Inconsistent math delimiters, malformed commands

**User Stories:**
- As an author, I want to catch all broken references before submission
- As an author, I want to know which bibliography entries are unused
- As an author, I want to ensure all figures are properly numbered
- As an author, I want a final "ready to publish" confidence check

---

### Phase 3B: Productivity Enhancers (Priority: Medium-High)

#### 3. Figure & Table Gallery ⭐⭐
**Status:** Planned  
**Complexity:** Medium  
**Estimated Lines:** ~500 lines  

**Description:** Visual browser and management interface for all floating elements (figures, tables, equations) in the manuscript.

**Key Capabilities:**
- Grid view of all figures with thumbnails (if images)
- List view of all tables with caption preview
- Filter by chapter, type (figure/table/equation), or label prefix
- Click to jump to definition
- Display: label, caption, file location, reference count
- Warnings for duplicate labels, missing captions, unused elements
- Export list as CSV or Markdown

**UI Layout:**
- Top toolbar: Type filter (All/Figures/Tables/Equations), Chapter dropdown, Search box
- Statistics bar: Total count, by type, warnings count
- Main grid/list area with cards for each element
- Preview pane (optional, for selected element)

**User Stories:**
- As an author, I want to see all my figures at once
- As an author, I want to find a specific table by partial caption
- As an author, I want to know which figures are never referenced
- As an author, I want to ensure caption consistency

---

#### 4. Academic Snippet Library ⭐⭐
**Status:** Planned  
**Complexity:** Low  
**Estimated Lines:** ~400 lines  

**Description:** Repository of reusable Markdown/LaTeX templates for common academic structures.

**Key Capabilities:**
- Pre-built snippet categories: Figures, Tables, Equations, Theorems, Proofs
- Quick insertion via command palette or context menu
- User-customizable snippets (save selection as snippet)
- Variable substitution (e.g., `{{label}}`, `{{caption}}`)
- Snippet preview before insertion
- Import/export snippet collections

**Default Snippet Categories:**

1. **Figures:**
   - Single figure with caption
   - Side-by-side subfigures
   - Figure with multiple panels
   - Wrapped figure (text flow)

2. **Tables:**
   - Basic table (3x3, 5x5)
   - Multi-column header table
   - Longtable (spanning pages)
   - Statistical results table

3. **Equations:**
   - Numbered equation
   - Aligned equations
   - Cases/piecewise
   - Matrix notation

4. **Academic Boxes:**
   - Theorem/Lemma/Proof
   - Example box
   - Definition box
   - Note/Remark callout

**User Stories:**
- As an author, I want to quickly insert a complex table structure
- As an author, I want consistent formatting for all my theorems
- As an author, I want to save my custom figure layout as a template
- As an author, I want to avoid memorizing LaTeX syntax

---

#### 5. Smart Footnote/Endnote Manager ⭐⭐
**Status:** Planned  
**Complexity:** Low-Medium  
**Estimated Lines:** ~350 lines  

**Description:** Visual management interface for all footnotes and endnotes with conversion and validation capabilities.

**Key Capabilities:**
- List all footnotes/endnotes with preview
- Show context (which paragraph contains the note)
- Convert between inline footnotes and reference-style
- Convert between footnotes and endnotes (per-chapter or book-level)
- Auto-renumber after editing
- Check for orphaned references
- Find duplicate or similar content

**UI Features:**
- Sidebar panel with searchable list
- Click to jump to footnote definition
- Inline editing of note content
- Bulk operations (convert all to endnotes)

**User Stories:**
- As an author, I want to see all my footnotes in one place
- As an author, I want to convert footnotes to endnotes for final submission
- As an author, I want to find and merge duplicate footnotes
- As an author, I want to ensure footnote numbering is correct

---

#### 6. Glossary & Index Manager ⭐⭐
**Status:** Planned  
**Complexity:** Medium  
**Estimated Lines:** ~450 lines  

**Description:** Centralized management for book index and glossary terms, abstracting LaTeX `\index{}` and `\gls{}` commands.

**Key Capabilities:**
- Auto-discover all existing index/glossary entries
- Central term browser with search and filtering
- Mark selected text as index entry via context menu
- Multi-level index support (main entry, sub-entry)
- Glossary definition editor
- Consistency checking (capitalization, plural forms)
- Cross-reference index entries (see also...)
- Generate glossary Markdown file

**Index Entry Types:**
- Simple: `\index{term}`
- Sub-entry: `\index{main!sub}`
- See also: `\index{term|see{other}}`
- Page range: `\index{term|(}` ... `\index{term|)}`

**User Stories:**
- As an author, I want to mark important terms for the index
- As an author, I want consistent capitalization of indexed terms
- As an author, I want to see all glossary terms in one place
- As an author, I want to ensure I've defined all acronyms

---

#### 7. Dynamic Outline & Sync ⭐⭐
**Status:** Planned  
**Complexity:** Medium  
**Estimated Lines:** ~550 lines  

**Description:** Two-way synchronized outline view where structural changes reflect in the markdown and vice-versa.

**Key Capabilities:**
- Generate collapsible outline from markdown headers
- Drag-and-drop to reorder sections within a document
- Rename heading in outline → updates markdown
- Promote/demote headings (# ↔ ## ↔ ###)
- Focus/hoist on specific section (hide others)
- Word count per section
- Visual indicators for empty sections
- Breadcrumb navigation

**Outline Operations:**
- Move section (with all subsections)
- Split section (create new section from selection)
- Merge sections
- Duplicate section structure
- Export outline as separate document

**User Stories:**
- As an author, I want to restructure my chapter without cut/paste
- As an author, I want to focus on one section while hiding others
- As an author, I want to see my chapter structure at a glance
- As an author, I want to balance section lengths

---

### Phase 3C: Advanced Features (Priority: Medium)

#### 8. Chapter Template Wizard
**Status:** Future  
**Complexity:** Low  
**Estimated Lines:** ~250 lines  

**Description:** Guided wizard for creating new chapters with consistent structure and metadata.

**Templates Include:**
- Standard chapter (Introduction, Body, Conclusion)
- Literature review chapter
- Methods chapter
- Results chapter
- Appendix

---

## Implementation Priority

### Sprint 1: Foundation
1. **Manuscript Navigator** (Week 1-2)
   - Book configuration format
   - Tree view component
   - Drag-and-drop reordering
   - Statistics integration

### Sprint 2: Quality Assurance
2. **Pre-publication Checklist** (Week 3)
   - Extends existing validation systems
   - Manuscript-wide scanning
   - Issue reporting UI

### Sprint 3: Productivity Pack A
3. **Academic Snippet Library** (Week 4)
   - Snippet storage and retrieval
   - Insertion UI
   - Default snippet collection

4. **Smart Footnote Manager** (Week 4-5)
   - Footnote extraction
   - Management UI
   - Conversion utilities

### Sprint 4: Productivity Pack B
5. **Figure & Table Gallery** (Week 5-6)
   - Element extraction
   - Gallery UI
   - Filtering and search

6. **Glossary & Index Manager** (Week 6-7)
   - Term extraction
   - Management UI
   - Consistency checking

### Sprint 5: Advanced Structure
7. **Dynamic Outline & Sync** (Week 7-8)
   - Outline generation
   - Sync mechanism
   - Restructuring operations

---

## Technical Architecture

### New Components

```
src/
  manuscript/
    ManuscriptConfig.ts         # Book.json parsing and structure
    ManuscriptNavigator.ts      # Sidebar tree view
    ManuscriptStats.ts          # Project-wide statistics
    
  validation/
    ValidationEngine.ts         # Core validation framework
    PrePublicationPanel.ts      # Checklist UI
    ValidationRules.ts          # Individual rule implementations
    
  gallery/
    ElementExtractor.ts         # Find figures/tables/equations
    GalleryView.ts              # Grid/list display
    ElementCard.ts              # Individual element component
    
  snippets/
    SnippetManager.ts           # Storage and retrieval
    SnippetLibrary.ts           # Default snippets
    SnippetPicker.ts            # Insertion UI
    VariableSubstitution.ts     # Template variable handling
    
  footnotes/
    FootnoteParser.ts           # Extract footnotes
    FootnoteManager.ts          # Manage and convert
    FootnotePanel.ts            # Management UI
    
  glossary/
    GlossaryManager.ts          # Term management
    IndexManager.ts             # Index entry management
    TermBrowser.ts              # Browser UI
    ConsistencyChecker.ts       # Term consistency validation
    
  outline/
    OutlineGenerator.ts         # Parse headers to outline
    OutlineSync.ts              # Two-way synchronization
    OutlineView.ts              # Tree view UI
    OutlineOperations.ts        # Move, promote, demote, etc.
```

### Data Models

```typescript
// Manuscript Configuration
interface ManuscriptConfig {
  title: string;
  author: string;
  structure: ManuscriptStructure;
  metadata: ManuscriptMetadata;
}

interface ManuscriptStructure {
  parts?: Part[];
  chapters: Chapter[];
}

interface Part {
  id: string;
  title: string;
  chapters: string[];  // Chapter IDs
}

interface Chapter {
  id: string;
  title: string;
  file: string;        // Path to .md file
  included: boolean;   // Include in build
  order: number;
}

// Validation Issues
interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'reference' | 'citation' | 'figure' | 'structure' | 'format';
  message: string;
  location: {
    file: string;
    line?: number;
    ch?: number;
  };
  suggestion?: string;
  autoFixable: boolean;
}

// Gallery Elements
interface FloatingElement {
  type: 'figure' | 'table' | 'equation';
  label: string;
  caption?: string;
  file: string;
  position: Position;
  referenceCount: number;
  imagePath?: string;  // For figures
}

// Snippets
interface Snippet {
  id: string;
  name: string;
  category: string;
  description: string;
  template: string;
  variables: SnippetVariable[];
}

interface SnippetVariable {
  name: string;
  description: string;
  defaultValue?: string;
}

// Footnotes
interface Footnote {
  id: string;
  content: string;
  type: 'inline' | 'reference';
  file: string;
  position: Position;
  context: string;  // Surrounding paragraph
}

// Glossary & Index
interface GlossaryTerm {
  term: string;
  definition: string;
  acronym?: string;
  firstUse?: {
    file: string;
    line: number;
  };
  usageCount: number;
}

interface IndexEntry {
  term: string;
  subterm?: string;
  locations: IndexLocation[];
  seeAlso?: string[];
}

// Outline
interface OutlineNode {
  id: string;
  level: number;       // 1-6 for #-######
  text: string;
  line: number;
  children: OutlineNode[];
  wordCount: number;
}
```

---

## File Format: book.json

The Manuscript Navigator uses a `book.json` file at the vault root to define the book structure.

```json
{
  "version": "1.0",
  "metadata": {
    "title": "Machine Learning Fundamentals",
    "subtitle": "A Comprehensive Guide",
    "author": "Dr. Jane Smith",
    "publisher": "Academic Press",
    "year": 2025,
    "isbn": "978-0-12345-678-9"
  },
  "structure": {
    "frontmatter": [
      {
        "id": "preface",
        "title": "Preface",
        "file": "frontmatter/preface.md",
        "included": true
      },
      {
        "id": "acknowledgments",
        "title": "Acknowledgments",
        "file": "frontmatter/acknowledgments.md",
        "included": true
      }
    ],
    "parts": [
      {
        "id": "part1",
        "title": "Part I: Foundations",
        "chapters": ["ch01", "ch02", "ch03"]
      },
      {
        "id": "part2",
        "title": "Part II: Advanced Topics",
        "chapters": ["ch04", "ch05", "ch06"]
      }
    ],
    "chapters": [
      {
        "id": "ch01",
        "number": 1,
        "title": "Introduction to Machine Learning",
        "file": "chapters/01-introduction.md",
        "included": true,
        "order": 1
      },
      {
        "id": "ch02",
        "number": 2,
        "title": "Linear Regression",
        "file": "chapters/02-linear-regression.md",
        "included": true,
        "order": 2
      },
      {
        "id": "ch03",
        "number": 3,
        "title": "Classification Algorithms",
        "file": "chapters/03-classification.md",
        "included": false,
        "order": 3,
        "notes": "Still in draft"
      }
    ],
    "appendices": [
      {
        "id": "app-a",
        "title": "Appendix A: Mathematical Notation",
        "file": "appendices/notation.md",
        "included": true
      }
    ],
    "backmatter": [
      {
        "id": "bibliography",
        "title": "Bibliography",
        "file": "bibliography.md",
        "included": true
      },
      {
        "id": "index",
        "title": "Index",
        "file": "index.md",
        "included": true
      }
    ]
  },
  "build": {
    "outputDir": "build",
    "includeOnly": "included"
  },
  "settings": {
    "wordCountGoals": {
      "chapter": 5000,
      "total": 80000
    },
    "numberingFormat": {
      "figures": "chapter.sequential",
      "tables": "chapter.sequential",
      "equations": "chapter.sequential"
    }
  }
}
```

### Alternative: Frontmatter-Based Configuration

For simpler projects, metadata can be in a main file's frontmatter:

```yaml
---
manuscript:
  title: "My Book"
  chapters:
    - file: "chapters/chapter1.md"
      title: "Introduction"
      included: true
    - file: "chapters/chapter2.md"
      title: "Background"
      included: true
---
```

---

## Success Metrics

### User Experience
- ✅ Authors can visualize entire book structure in <5 seconds
- ✅ Reordering chapters takes <10 seconds (vs. minutes with file renaming)
- ✅ Pre-publication validation completes in <30 seconds for 100k word manuscript
- ✅ Finding a specific figure/table takes <15 seconds (vs. minutes of searching)
- ✅ Inserting complex structure (table, figure) takes <30 seconds (vs. 5+ minutes)

### Quality Improvements
- ✅ 95%+ reduction in broken cross-references at submission
- ✅ 100% of figures have proper captions and labels
- ✅ Zero orphaned bibliography entries
- ✅ Consistent index term capitalization

### Performance
- ✅ Navigator loads <1 second for 50-chapter book
- ✅ Validation runs in background without blocking editor
- ✅ Gallery renders 200+ figures in <2 seconds
- ✅ Outline sync updates in real-time (<100ms delay)

---

## Next Steps

1. **Review and approve** this Phase 3 plan
2. **Create detailed PRD** for Manuscript Navigator (Sprint 1 start)
3. **Design book.json schema** and validation
4. **Implement ManuscriptConfig parser**
5. **Build ManuscriptNavigator UI component**
6. **Integrate with existing stats system**

---

## Notes & Considerations

### Backward Compatibility
- All Phase 3 features are optional and additive
- Plugin works perfectly without `book.json` (single-file mode)
- Existing Phase 1 & 2 features unaffected

### Extensibility
- Book.json format versioned for future enhancements
- Validation rules pluggable for custom checks
- Snippet format allows user contributions
- Gallery supports custom element types

### Integration Points
- Navigator uses existing StatsCalculator for per-chapter metrics
- Validation extends CrossRefManager and BibliographyManager
- Gallery uses existing label/caption detection
- All features share common UI patterns and styling

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-25  
**Status:** Ready for PRD Development
