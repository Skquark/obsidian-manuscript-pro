# Manuscript Pro - Next Enhancement Phase
*Strategic roadmap for professional-grade manuscript authoring features*

---

## 🎯 Vision

Transform Manuscript Pro from a solid academic writing tool into the **premier manuscript authoring platform** for professional authors, combining the flexibility of Obsidian with the power of professional publishing tools.

## 📊 Enhancement Priority Matrix

### High Impact, Quick Wins (Phase 6)
- Multi-format batch export
- Word count goals & tracking
- Table of contents generator
- Cover page generator

### High Impact, Medium Effort (Phase 7)
- Scene/chapter outliner
- Character database
- Research notes panel
- Style consistency checker

### Professional Polish (Phase 8)
- Direct KDP export
- CreateSpace/IngramSpark presets
- Readability dashboard
- Pacing visualizer

### Advanced Features (Phase 9+)
- Comment system & track changes
- Version comparison
- Custom preset sharing
- Live preview rendering

---

# Phase 6: Core Writing Enhancements

## 1. Multi-Format Batch Export 📦

### Concept
One-click export to multiple formats simultaneously, perfect for submitting to different publishers or platforms.

### Features
- **Export Profiles**: Save common export combinations
  - "Full Package": PDF (print), EPUB (digital), DOCX (editor review)
  - "Submission Ready": Industry-standard formats by publisher
  - "Beta Reader Pack": EPUB + PDF with comments enabled

- **UI Design**
  ```
  ┌─────────────────────────────────────┐
  │ Batch Export                        │
  │                                     │
  │ Select Formats:                     │
  │ ☑ PDF (Print Quality)               │
  │ ☑ EPUB (Reflowable)                 │
  │ ☑ DOCX (Track Changes)              │
  │ ☐ MOBI (Kindle Legacy)              │
  │ ☐ LaTeX Source                      │
  │                                     │
  │ Output Directory: [📁 Browse...]    │
  │ Naming Pattern: {title}-{format}    │
  │                                     │
  │ [Cancel]           [Export All →]   │
  └─────────────────────────────────────┘
  ```

- **Implementation Details**
  - Queue-based export with progress indicator
  - Parallel processing where possible
  - Error handling per format (continue on failure)
  - Export summary log with file sizes and locations
  - Archive option (create .zip of all outputs)

### Technical Approach
```typescript
interface BatchExportProfile {
  name: string;
  formats: ExportFormat[];
  outputPattern: string;
  createArchive: boolean;
  openAfterExport: boolean;
}

class BatchExportEngine {
  async exportMultiple(
    profile: BatchExportProfile,
    onProgress: (format: string, percent: number) => void
  ): Promise<BatchExportResult>
}
```

---

## 2. Word Count Goals & Tracking 🎯

### Concept
Professional writing goals with visual progress tracking, daily streaks, and productivity insights.

### Features

- **Goal Types**
  - Daily word count (e.g., 1,000 words/day)
  - Weekly targets (e.g., 5,000 words/week)
  - Project milestones (e.g., "Chapter 5 complete by Friday")
  - Session-based goals (e.g., "Write for 2 hours")

- **Dashboard Widget**
  ```
  ┌─────────────────────────────────────┐
  │ Today's Progress                    │
  │ ████████████░░░░░░░░ 1,247 / 2,000  │
  │ 62% • 753 words to go               │
  │                                     │
  │ This Week: 6,892 / 10,000 (69%)    │
  │ Current Streak: 🔥 12 days          │
  │                                     │
  │ Estimated Completion: Dec 15        │
  └─────────────────────────────────────┘
  ```

- **Visual Analytics**
  - Heatmap calendar (GitHub-style contribution graph)
  - Writing time patterns (most productive hours)
  - Chapter completion timeline
  - Velocity tracking (words per day trend)

- **Motivational Features**
  - Streak counter with badges
  - Celebration notifications on milestones
  - Estimated completion dates
  - Historical averages for realistic planning

### Technical Approach
```typescript
interface WritingGoal {
  type: 'daily' | 'weekly' | 'project' | 'session';
  target: number;
  unit: 'words' | 'hours' | 'chapters';
  deadline?: Date;
  manuscript?: string; // Specific manuscript or global
}

interface WritingSession {
  startTime: Date;
  endTime?: Date;
  startWordCount: number;
  endWordCount: number;
  manuscript: string;
  distractions: number; // Tracked via focus breaks
}

class GoalTracker {
  getCurrentStreak(): number;
  getProjectedCompletion(manuscript: string): Date;
  getProductivityInsights(): ProductivityReport;
}
```

---

## 3. Table of Contents Generator 📑

### Concept
Automatically generate professional TOC from manuscript structure with customizable styling and page number formatting.

### Features

- **TOC Styles**
  - Fiction (chapter titles only, no page numbers in digital)
  - Non-fiction (nested headings with page numbers)
  - Academic (numbered sections with subsections)
  - Custom (user-defined format)

- **Customization Options**
  ```
  TOC Configuration:
  - Include: [ ] Front Matter  [✓] Chapters  [✓] Back Matter
  - Depth: [2] levels deep
  - Numbering: [Roman] front matter, [Arabic] chapters
  - Style: [Chapter One] vs [1. Chapter Title]
  - Page Numbers: [✓] Right-aligned with leader dots
  - Hyperlinks: [✓] Interactive (EPUB/PDF)
  ```

- **Smart Detection**
  - Automatically identify chapter breaks
  - Detect part divisions (Book I, Book II)
  - Recognize front matter (Dedication, Acknowledgments)
  - Find appendices and back matter

- **Export Integration**
  - LaTeX `\tableofcontents` for print PDF
  - EPUB NCX/NAV for e-books
  - DOCX native TOC field
  - Standalone TOC markdown for reference

### Technical Approach
```typescript
interface TOCEntry {
  title: string;
  level: number; // 1 = chapter, 2 = section, etc.
  pageNumber?: number;
  href?: string; // For hyperlinked TOCs
  children?: TOCEntry[];
}

interface TOCConfiguration {
  style: 'fiction' | 'non-fiction' | 'academic' | 'custom';
  maxDepth: number;
  includePageNumbers: boolean;
  numberingScheme: {
    frontMatter: 'roman' | 'none';
    mainMatter: 'arabic' | 'chapter-names';
    backMatter: 'roman' | 'arabic' | 'none';
  };
  formatting: {
    leaderDots: boolean;
    indentation: string; // e.g., "  " or "\t"
    chapterPrefix: string; // e.g., "Chapter ", empty for just numbers
  };
}

class TOCGenerator {
  parseManuscript(files: TFile[]): TOCEntry[];
  generateLaTeX(entries: TOCEntry[], config: TOCConfiguration): string;
  generateEPUB(entries: TOCEntry[]): { ncx: string; nav: string };
  generateMarkdown(entries: TOCEntry[], config: TOCConfiguration): string;
}
```

---

## 4. Cover Page Generator 📄

### Concept
Professional front matter templates for title pages, copyright, dedication, and more.

### Features

- **Page Templates**
  - **Title Page**: Book title, subtitle, author name, publisher logo
  - **Copyright Page**: © notice, ISBN, publisher info, edition
  - **Dedication**: Formatted dedication text
  - **Epigraph**: Opening quote or passage
  - **Acknowledgments**: Thank you section
  - **About the Author**: Bio with photo

- **Style Presets**
  - Minimalist (clean typography)
  - Classic (centered, traditional)
  - Modern (asymmetric, bold)
  - Academic (formal, structured)

- **Data Entry Modal**
  ```
  ┌─────────────────────────────────────────────┐
  │ Front Matter Generator                      │
  │                                             │
  │ Title Page:                                 │
  │   Book Title: [________________________]    │
  │   Subtitle:   [________________________]    │
  │   Author:     [________________________]    │
  │   Publisher:  [________________________]    │
  │                                             │
  │ Copyright Page:                             │
  │   © Year:     [2025]                        │
  │   ISBN:       [978-_______________]         │
  │   Edition:    [First Edition]               │
  │   ☑ Include "All Rights Reserved"          │
  │   ☑ Include Library of Congress info       │
  │                                             │
  │ Dedication:                                 │
  │   [_____________________________________]   │
  │   [_____________________________________]   │
  │                                             │
  │ Style: [Classic ▼]                          │
  │                                             │
  │ [Preview]       [Cancel]    [Generate →]    │
  └─────────────────────────────────────────────┘
  ```

- **Output Options**
  - Generate as separate markdown files
  - Include in export LaTeX preamble
  - Embed in EPUB metadata
  - Create standalone PDF front matter

### Technical Approach
```typescript
interface FrontMatterData {
  title: string;
  subtitle?: string;
  author: string;
  publisher?: string;
  copyright: {
    year: number;
    holder: string;
    isbn?: string;
    edition?: string;
    lccn?: string; // Library of Congress Control Number
    additionalNotices?: string[];
  };
  dedication?: string;
  epigraph?: {
    text: string;
    attribution: string;
  };
  acknowledgments?: string;
  aboutAuthor?: {
    bio: string;
    photo?: string; // Path to author photo
  };
}

interface FrontMatterStyle {
  name: string;
  titlePageTemplate: string; // LaTeX template
  copyrightPageTemplate: string;
  typography: {
    titleFont: string;
    bodyFont: string;
    alignment: 'left' | 'center' | 'right';
  };
}

class FrontMatterGenerator {
  renderTitlePage(data: FrontMatterData, style: FrontMatterStyle): string;
  renderCopyrightPage(data: FrontMatterData): string;
  generateLaTeXPreamble(data: FrontMatterData, style: FrontMatterStyle): string;
  createMarkdownFiles(data: FrontMatterData, outputDir: string): Promise<void>;
}
```

---

# Phase 7: Organizational Tools

## 5. Scene/Chapter Outliner 🗂️

### Concept
Visual drag-and-drop organizer for scenes and chapters with word counts, status tracking, and quick navigation.

### Features

- **Tree View Interface**
  ```
  Manuscript Structure:
  │
  ├─ 📖 Part I: The Beginning
  │  ├─ 📝 Chapter 1: The Call (2,847 words) ✓
  │  │  ├─ 🎬 Scene 1: Morning at the cafe (1,203)
  │  │  └─ 🎬 Scene 2: The mysterious letter (1,644)
  │  ├─ 📝 Chapter 2: First Steps (0 words) 📋 Draft
  │  │  └─ [Add Scene +]
  │  └─ [Add Chapter +]
  │
  ├─ 📖 Part II: The Journey (In Progress)
  │  └─ [Add Chapter +]
  │
  └─ [Add Part +]
  ```

- **Scene Cards**
  ```
  ┌─────────────────────────────────────┐
  │ 🎬 Scene 1: Morning at the cafe     │
  │ ─────────────────────────────────── │
  │ POV: Emma                           │
  │ Location: Joe's Coffee Shop         │
  │ Time: 7:30 AM, Thursday             │
  │ Status: ✓ Complete (1,203 words)    │
  │                                     │
  │ Summary: Emma receives a mysterious │
  │ letter that changes everything...   │
  │                                     │
  │ [Open] [Edit] [↑] [↓] [⋮]          │
  └─────────────────────────────────────┘
  ```

- **Metadata Tracking**
  - POV character
  - Location/setting
  - Time of day/date
  - Emotional tone
  - Plot threads (tag system)
  - Status (outline, draft, revision, complete)

- **Operations**
  - Drag-and-drop reordering
  - Quick scene creation
  - Bulk status updates
  - Filter by status/POV/location
  - Export outline to markdown/PDF

### Technical Approach
```typescript
interface Scene {
  id: string;
  title: string;
  file?: TFile; // Linked to actual markdown file
  metadata: {
    pov?: string;
    location?: string;
    timeOfDay?: string;
    dateInStory?: string;
    tone?: string;
    plotThreads?: string[];
    status: 'outline' | 'draft' | 'revision' | 'complete';
  };
  summary?: string;
  wordCount: number;
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  scenes: Scene[];
  wordCount: number; // Sum of scenes
  order: number;
  status: 'planned' | 'in-progress' | 'complete';
}

interface ManuscriptStructure {
  parts: {
    id: string;
    title: string;
    chapters: Chapter[];
  }[];
}

class OutlinerPanel extends ItemView {
  renderTree(structure: ManuscriptStructure): void;
  handleDragDrop(sceneId: string, newParent: string, newOrder: number): void;
  exportOutline(format: 'markdown' | 'pdf'): Promise<void>;
}
```

---

## 6. Character Database 👥

### Concept
Comprehensive character tracking with traits, relationships, and timeline integration.

### Features

- **Character Profiles**
  ```
  ┌─────────────────────────────────────────────┐
  │ Character: Emma Blackwood                   │
  │ ─────────────────────────────────────────── │
  │                                             │
  │ [Photo]  Role: Protagonist                  │
  │          Age: 32                            │
  │          Occupation: Investigative Reporter │
  │                                             │
  │ Physical Description:                       │
  │ • Height: 5'7"                              │
  │ • Hair: Dark brown, shoulder-length         │
  │ • Eyes: Green                               │
  │ • Distinctive: Scar on left hand            │
  │                                             │
  │ Personality Traits:                         │
  │ [Determined] [Curious] [Stubborn] [Loyal]   │
  │                                             │
  │ Backstory:                                  │
  │ [Rich text editor...]                       │
  │                                             │
  │ Character Arc:                              │
  │ From: Naive idealist                        │
  │ To:   Hardened realist                      │
  │                                             │
  │ Appears in: 47 scenes                       │
  │ First: Ch. 1, Scene 1                       │
  │ Last: Ch. 24, Scene 3                       │
  │                                             │
  │ [Save]  [Delete]  [View Timeline]           │
  └─────────────────────────────────────────────┘
  ```

- **Relationship Map**
  - Visual graph of character connections
  - Relationship types (family, friend, enemy, love interest)
  - Relationship evolution over time
  - Conflict tracking

- **Character Appearances**
  - List all scenes featuring character
  - Quick navigation to scenes
  - Ensure consistency (age, appearance, traits)
  - Track character development

- **Quick Reference**
  - Sidebar widget with current scene's characters
  - Hover tooltips showing character details
  - Inline character mentions linkable to profiles

### Technical Approach
```typescript
interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  photo?: string;

  physical: {
    age?: number;
    height?: string;
    hair?: string;
    eyes?: string;
    distinctiveFeatures?: string[];
  };

  personality: {
    traits: string[];
    motivations?: string;
    fears?: string;
    strengths?: string[];
    weaknesses?: string[];
  };

  backstory?: string;

  arc?: {
    start: string;
    end: string;
    keyMoments: { scene: string; description: string }[];
  };

  appearances: {
    sceneId: string;
    description?: string; // Character-specific notes for this scene
  }[];

  relationships: {
    characterId: string;
    type: string;
    description: string;
    evolution?: { scene: string; change: string }[];
  }[];
}

class CharacterDatabase {
  addCharacter(character: Character): void;
  getCharactersInScene(sceneId: string): Character[];
  checkConsistency(characterId: string): ConsistencyReport;
  exportCharacterSheet(characterId: string, format: 'md' | 'pdf'): Promise<void>;
}
```

---

## 7. Research Notes Panel 📚

### Concept
Quick-access research snippets, fact-checking, and reference management integrated into the writing flow.

### Features

- **Research Vault**
  - Categorized notes (Setting, History, Science, Culture)
  - Tag-based organization
  - Quick search and filter
  - Import from web (web clipper integration)

- **Fact Tracking**
  ```
  Research: Victorian London
  ━━━━━━━━━━━━━━━━━━━━━━━━

  📍 Geography
  • Fleet Street: Newspaper district
  • Whitechapel: East End slums
  • Mayfair: Wealthy district

  📅 Timeline
  • 1888: Jack the Ripper murders
  • 1890: First electric underground railway

  🏛️ Society
  • Class system strictly enforced
  • Women's suffrage movement growing

  💡 Daily Life
  • Gas lamps lit by lamplighters
  • Hansom cabs primary transport
  • Tea served at 4 PM

  Source: "Victorian London" by Liza Picard
  ```

- **Inline References**
  - Insert research facts directly into manuscript
  - Maintain source citations
  - Flag inconsistencies (e.g., anachronisms)
  - Quick fact-check mode

- **Research Bible**
  - Consolidated reference document
  - Export to PDF for offline reference
  - Version tracking (as research evolves)

### Technical Approach
```typescript
interface ResearchNote {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  source?: {
    title: string;
    author?: string;
    url?: string;
    dateAccessed?: Date;
  };
  linkedScenes?: string[]; // Scenes using this research
}

interface ResearchCategory {
  name: string;
  icon: string;
  color: string;
  notes: ResearchNote[];
}

class ResearchPanel extends ItemView {
  searchNotes(query: string): ResearchNote[];
  insertFactIntoEditor(noteId: string, editor: Editor): void;
  checkConsistency(manuscript: string): InconsistencyReport[];
  exportBible(format: 'md' | 'pdf'): Promise<void>;
}
```

---

## 8. Style Consistency Checker ✅

### Concept
Automated detection of style inconsistencies, formatting errors, and common manuscript issues.

### Features

- **Checks Performed**
  - **Formatting**
    - Inconsistent em dash usage (— vs --)
    - Smart quotes vs straight quotes
    - Multiple spaces
    - Inconsistent punctuation (Oxford comma)

  - **Style**
    - POV shifts (1st/2nd/3rd person mixing)
    - Tense consistency (past/present)
    - Dialogue tag overuse ("he said" after every line)
    - Adverb overuse ("very", "really", "-ly" words)

  - **Structure**
    - Chapter length variance
    - Paragraph length (too long/too short)
    - Scene breaks not marked

  - **Naming**
    - Character name variants (Bob vs Robert)
    - Location name spelling
    - Made-up term consistency

- **Results Panel**
  ```
  Style Consistency Report
  ━━━━━━━━━━━━━━━━━━━━━━━━

  ⚠️ 127 issues found

  High Priority (23):
  • Ch. 3: POV shift from 3rd to 1st person
  • Ch. 7: Character "Sarah" also called "Sara"
  • Ch. 12: Tense shift to present tense

  Medium Priority (58):
  • Em dash inconsistency (15 instances)
  • Dialogue tag overuse (43 "said" in Ch. 5)

  Low Priority (46):
  • Adverb candidates (very, really, etc.)
  • Long paragraphs (>200 words)

  [Fix All] [Review] [Ignore] [Export Report]
  ```

- **Auto-Fix Options**
  - Replace all em dash variants with —
  - Convert straight quotes to smart quotes
  - Standardize character name variants
  - Remove multiple spaces

- **Custom Rules**
  - Define house style preferences
  - Add words to ignore list
  - Set threshold for warnings

### Technical Approach
```typescript
interface StyleRule {
  id: string;
  name: string;
  category: 'formatting' | 'style' | 'structure' | 'naming';
  severity: 'high' | 'medium' | 'low';
  check: (text: string) => StyleIssue[];
  autoFix?: (text: string, issue: StyleIssue) => string;
}

interface StyleIssue {
  ruleId: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
  suggestion?: string;
  canAutoFix: boolean;
}

class StyleChecker {
  private rules: StyleRule[];

  checkManuscript(files: TFile[]): Promise<StyleIssue[]>;
  autoFixIssues(issues: StyleIssue[]): Promise<void>;
  exportReport(issues: StyleIssue[], format: 'md' | 'pdf'): Promise<void>;
  addCustomRule(rule: StyleRule): void;
}
```

---

# Phase 8: Professional Publishing

## 9. Direct KDP Export 📘

### Concept
One-click export with Amazon Kindle Direct Publishing specifications pre-configured.

### Features

- **KDP Print Preset**
  - Standard trim sizes (6×9, 5.5×8.5, 5×8)
  - Bleed settings (0.125" for color, none for B&W)
  - Page number positioning (outside corner)
  - Gutter margins for binding
  - Professional chapter starts (always recto/odd page)

- **KDP eBook Preset**
  - EPUB 3.0 compliant
  - Proper metadata (title, author, ASIN)
  - Embedded fonts (if allowed)
  - Table of contents with NCX
  - Cover image validation (minimum 1000px, 1.6:1 ratio)

- **Validation**
  - Pre-flight check before export
  - Kindle Previewer integration (if installed)
  - Page count estimation
  - File size warnings

- **Metadata Helper**
  ```
  KDP Export Settings
  ━━━━━━━━━━━━━━━━━━━━━━━━

  Format: [Print ▼]

  Trim Size: [6" × 9" ▼]
  Interior Type: [☑ Black & White] [☐ Color]
  Bleed: [☐ No Bleed] (B&W doesn't support bleed)

  Paper Type: [White ▼]
  Binding: [Perfect Bound ▼]

  Page Count: 324 pages (estimated)
  Interior Price: $2.43

  Cover:
  [📁 Upload Cover PDF...]
  Dimensions: 12.375" × 9.25" (with bleed)

  [Validate] [Export for KDP →]
  ```

### Technical Approach
```typescript
interface KDPPrintSpec {
  trimSize: { width: number; height: number }; // inches
  bleed: boolean;
  paperType: 'white' | 'cream';
  binding: 'perfect' | 'hardcover';
  startChaptersOnRecto: boolean;

  margins: {
    top: string;
    bottom: string;
    inside: string; // Gutter
    outside: string;
  };
}

interface KDPEbookSpec {
  includeNCX: boolean;
  embedFonts: boolean;
  imageQuality: 'standard' | 'high';

  metadata: {
    title: string;
    author: string;
    publisher?: string;
    language: string;
    asin?: string;
  };
}

class KDPExporter {
  validateCover(imagePath: string, spec: KDPPrintSpec): ValidationResult;
  estimatePageCount(manuscript: TFile[], spec: KDPPrintSpec): number;
  calculateInteriorCost(pageCount: number, spec: KDPPrintSpec): number;
  exportForPrint(spec: KDPPrintSpec): Promise<string>; // PDF path
  exportForEbook(spec: KDPEbookSpec): Promise<string>; // EPUB path
}
```

---

## 10. CreateSpace/IngramSpark Presets 🖨️

### Concept
Industry-standard presets for print-on-demand services with professional specifications.

### Features

- **Print Service Templates**
  - IngramSpark (industry standard, wide distribution)
  - Lightning Source (Ingram's professional division)
  - Lulu (independent publishing)
  - BookBaby (full-service POD)

- **Professional Trim Sizes**
  - Trade paperback: 6×9
  - Mass market: 4.25×6.87
  - Large trade: 7×10
  - Digest: 5.5×8.5
  - Custom sizes with validation

- **Color Management**
  - CMYK conversion for color interiors
  - RGB for digital/EPUB
  - Grayscale optimization for B&W
  - Color profile embedding

- **Print Specifications**
  ```
  IngramSpark Specifications
  ━━━━━━━━━━━━━━━━━━━━━━━━

  Trim: [6" × 9" ▼]
  Page Count: 324 pages

  Binding: [Perfect Bound (Paperback) ▼]
  Paper Color: [White ▼]
  Paper Weight: [50# ▼]

  Laminate: [Matte ▼]
  Bleed: [Yes - 0.125" ▼]

  Interior Color: [Black & White ▼]

  Spine Width: 0.648" (calculated)
  Cover Dimensions:
  - Width: 12.648" (6 + 6 + 0.648)
  - Height: 9.25" (9 + 0.125 top + 0.125 bottom)

  [Generate Cover Template] [Export Print-Ready PDF →]
  ```

- **Pre-Flight Checks**
  - Font embedding validation
  - Image resolution (300 DPI minimum)
  - Color space verification
  - Bleed area check
  - Gutter margin safety
  - Page number positioning

### Technical Approach
```typescript
interface PODServiceSpec {
  name: 'IngramSpark' | 'LightningSource' | 'Lulu' | 'BookBaby';

  allowedTrimSizes: { width: number; height: number; name: string }[];

  requirements: {
    minImageDPI: number;
    colorSpace: 'CMYK' | 'RGB' | 'Grayscale';
    fontEmbedding: boolean;
    bleedSize: number; // inches
    safeZone: number; // inches from edge
  };

  pricing: {
    basePrice: number;
    perPagePrice: number;
    colorSurcharge?: number;
  };
}

class PODExporter {
  validateManuscript(files: TFile[], spec: PODServiceSpec): ValidationResult;
  calculateSpineWidth(pageCount: number, paperWeight: number): number;
  generateCoverTemplate(spec: PODServiceSpec, spineWidth: number): string; // SVG
  exportPrintReady(spec: PODServiceSpec): Promise<string>; // PDF/X-1a path
}
```

---

## 11. Readability Dashboard 📊

### Concept
Comprehensive writing metrics and readability analysis in a visual dashboard.

### Features

- **Core Metrics**
  - Flesch Reading Ease (0-100 scale)
  - Flesch-Kincaid Grade Level
  - Gunning Fog Index
  - SMOG Index
  - Coleman-Liau Index
  - Automated Readability Index

- **Genre Benchmarks**
  ```
  Readability Analysis: Chapter 5
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Overall Score: 68/100 (Standard)
  Target Audience: 8th grade reading level

  Flesch Reading Ease: 68.3
  ├─────────█──────┤
  Easy    Medium   Hard

  Genre Comparison (Contemporary Fiction):
  Your Score: 68.3
  Genre Average: 72.5 ⬇ 4.2 points below average

  Recommendations:
  • Shorten average sentence length (23 words → 18 words)
  • Reduce complex words by 12%
  • Current: 3.2 syllables/word
    Target: 2.8 syllables/word
  ```

- **Sentence Structure**
  - Average sentence length
  - Sentence length variance (monotony detection)
  - Paragraph length distribution
  - Dialogue vs. narrative ratio

- **Vocabulary Analysis**
  - Unique word count
  - Lexical diversity (type-token ratio)
  - Common words vs. sophisticated vocabulary
  - Repeated word detection

- **Visual Charts**
  - Reading level trend over chapters
  - Sentence length histogram
  - Vocabulary richness timeline
  - Comparison with published benchmarks

### Technical Approach
```typescript
interface ReadabilityMetrics {
  fleschReadingEase: number; // 0-100
  fleschKincaidGrade: number; // School grade level
  gunningFog: number;
  smog: number;
  colemanLiau: number;
  automatedReadability: number;

  sentenceStats: {
    averageLength: number;
    variance: number;
    shortest: number;
    longest: number;
  };

  wordStats: {
    totalWords: number;
    uniqueWords: number;
    lexicalDiversity: number; // 0-1
    averageSyllables: number;
    complexWords: number; // 3+ syllables
  };

  paragraphStats: {
    averageLength: number;
    count: number;
  };
}

interface GenreBenchmark {
  genre: string;
  averageFleschScore: number;
  averageSentenceLength: number;
  targetAudience: string;
}

class ReadabilityAnalyzer {
  analyzeText(text: string): ReadabilityMetrics;
  compareToGenre(metrics: ReadabilityMetrics, genre: string): Comparison;
  generateReport(manuscript: TFile[]): ReadabilityReport;
  visualizeMetrics(metrics: ReadabilityMetrics): HTMLElement;
}
```

---

## 12. Pacing Visualizer 📈

### Concept
Visual analysis of story pacing, scene length, and narrative rhythm.

### Features

- **Scene Length Analysis**
  ```
  Pacing Overview
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Chapter 1: The Beginning
  ▓▓▓▓▓░░░░ Scene 1 (2,847 words) - Action
  ▓▓░░░░░░░ Scene 2 (1,203 words) - Dialogue
  ▓▓▓▓▓▓▓░░ Scene 3 (3,492 words) - Description

  Chapter 2: Rising Action
  ▓▓▓░░░░░░ Scene 1 (1,876 words) - Tension
  ▓▓▓▓▓▓▓▓▓ Scene 2 (4,301 words) - Climax
  ▓▓░░░░░░░ Scene 3 (1,104 words) - Resolution

  Recommendations:
  ⚠️ Chapter 2, Scene 2 is significantly longer
     Consider breaking into two scenes
  ```

- **Tension Mapping**
  ```
    High ┤                  ╱╲
         │                ╱   ╲
         │              ╱      ╲
   Medium│         ╱╲  ╱        ╲
         │       ╱   ╲╱          ╲╱╲
         │     ╱                     ╲
     Low ┼───╱─────────────────────────╲──
         └──────────────────────────────────
          Ch1  Ch2  Ch3  Ch4  Ch5  Ch6  Ch7

  Pattern: Classic three-act structure
  • Act I: Setup (Chapters 1-2)
  • Act II: Confrontation (Chapters 3-5)
  • Act III: Resolution (Chapters 6-7)
  ```

- **Pacing Indicators**
  - Action density (action verbs per 100 words)
  - Dialogue ratio (dialogue vs narrative)
  - Description length (setting/character detail)
  - Time compression (story time vs page time)

- **Genre Templates**
  - Thriller: High tension, short chapters
  - Romance: Emotional beats, dialogue-heavy
  - Literary: Reflective pacing, description-rich
  - Epic Fantasy: World-building, varied pacing

### Technical Approach
```typescript
interface ScenePacing {
  sceneId: string;
  wordCount: number;
  type: 'action' | 'dialogue' | 'description' | 'reflection' | 'mixed';
  tensionLevel: number; // 0-10 scale

  metrics: {
    actionDensity: number; // Action verbs per 100 words
    dialogueRatio: number; // 0-1
    descriptionDensity: number;
    averageSentenceLength: number;
  };

  timeSpan?: {
    storyTime: number; // minutes/hours in story
    pageTime: number; // words/pages to tell
    compression: number; // ratio
  };
}

interface PacingPattern {
  name: string; // "Three-Act", "Five-Act", "Hero's Journey"
  expectedTensionCurve: number[]; // Tension levels per section
  acts: {
    name: string;
    startPercent: number;
    endPercent: number;
    expectedTension: number;
  }[];
}

class PacingAnalyzer {
  analyzeScene(text: string): ScenePacing;
  detectPattern(manuscript: ScenePacing[]): PacingPattern;
  visualizePacing(scenes: ScenePacing[]): HTMLCanvasElement;
  compareToGenre(pacing: ScenePacing[], genre: string): Comparison;
}
```

---

# Phase 9: Collaboration & Advanced

## 13. Comment System & Track Changes 💬

### Concept
Word-style commenting and revision tracking for editorial collaboration.

### Features

- **Inline Comments**
  - Attach comments to specific text ranges
  - Thread replies (conversation mode)
  - @mention other editors
  - Resolve/unresolve status
  - Comment types: suggestion, question, praise, issue

- **Track Changes**
  - Record insertions, deletions, formatting changes
  - Author attribution
  - Timestamp all changes
  - Accept/reject individual changes
  - Accept/reject all in selection

- **Review Mode UI**
  ```
  ┌────────────────────────────────────────────┐
  │ Chapter 3.md [Review Mode: Editing]        │
  │ ──────────────────────────────────────────│
  │                                            │
  │ The old man [walked]───┐ slowly across    │
  │                         └─ Comment (1)     │
  │ the street. [His eyes were tired.]──┐     │
  │                                      │     │
  │ [She ran]───────┐                    └─ Deletion
  │      └─ Insertion                          │
  │                                            │
  │ ─────────────────────────────────────────│
  │ Comments (2):                              │
  │                                            │
  │ 📝 Emma Johnson • 2 hours ago              │
  │    "walked" is weak - use "shuffled"?      │
  │    [Reply] [Resolve]                       │
  │                                            │
  │ ✂️ Delete suggestion • 3 hours ago         │
  │    This sentence feels redundant           │
  │    [Accept] [Reject]                       │
  └────────────────────────────────────────────┘
  ```

- **Change Acceptance Workflow**
  - Review changes one by one
  - Batch accept/reject by author
  - Show/hide changes toggle
  - Final clean version export

### Technical Approach
```typescript
interface Comment {
  id: string;
  author: string;
  timestamp: Date;
  range: { start: number; end: number }; // Character offsets
  text: string;
  type: 'suggestion' | 'question' | 'praise' | 'issue';
  resolved: boolean;
  replies: Comment[];
}

interface Change {
  id: string;
  author: string;
  timestamp: Date;
  type: 'insertion' | 'deletion' | 'formatting';
  range: { start: number; end: number };
  oldText?: string;
  newText?: string;
  accepted?: boolean; // undefined = pending
}

class ReviewManager {
  addComment(range: EditorRange, comment: Comment): void;
  trackChange(change: Change): void;
  acceptChange(changeId: string): void;
  rejectChange(changeId: string): void;
  exportCleanVersion(): string; // All accepted, no comments
}
```

---

## 14. Version Comparison 🔄

### Concept
Side-by-side diff view of manuscript versions with intelligent change detection.

### Features

- **Version Selection**
  ```
  Compare Versions
  ━━━━━━━━━━━━━━━━━━━━━━━━

  Left:  [v2.1 - Editorial Draft ▼]
  Right: [v3.0 - Author Revisions ▼]

  [Swap] [Compare →]
  ```

- **Diff View**
  ```
  ┌──────────────────┬──────────────────┐
  │ v2.1 Editorial   │ v3.0 Revisions   │
  ├──────────────────┼──────────────────┤
  │ The old man      │ The old man      │
  │ walked slowly    │ shuffled         │
  │ across the       │ across the       │
  │ street.          │ street.          │
  │                  │                  │
  │ His eyes were    │ [DELETED]        │
  │ tired.           │                  │
  │                  │                  │
  │ [NOT PRESENT]    │ She ran toward   │
  │                  │ him.             │
  └──────────────────┴──────────────────┘

  Summary: 12 changes
  • 3 deletions (red)
  • 5 additions (green)
  • 4 modifications (yellow)
  ```

- **Change Summary**
  - Word count delta
  - Major structural changes
  - Character/scene additions/removals
  - Percentage of text modified

- **Smart Detection**
  - Paragraph reordering
  - Scene moves
  - Character name changes
  - Semantic similarity (not just string match)

### Technical Approach
```typescript
interface VersionDiff {
  additions: { line: number; text: string }[];
  deletions: { line: number; text: string }[];
  modifications: { line: number; oldText: string; newText: string }[];
  moves: { fromLine: number; toLine: number; text: string }[];

  summary: {
    totalChanges: number;
    wordCountDelta: number;
    percentModified: number;
  };
}

class VersionComparer {
  loadVersion(identifier: string): string; // Git tag, file snapshot, etc.
  compare(versionA: string, versionB: string): VersionDiff;
  renderSideBySide(diff: VersionDiff): HTMLElement;
  exportDiffReport(diff: VersionDiff, format: 'md' | 'html' | 'pdf'): Promise<void>;
}
```

---

## 15. Custom Preset Sharing 🌐

### Concept
Community-driven template marketplace with rating, importing, and sharing.

### Features

- **Preset Marketplace**
  ```
  Community Template Gallery
  ━━━━━━━━━━━━━━━━━━━━━━━━

  🔥 Trending    📅 Recent    ⭐ Top Rated

  ┌─────────────────────────────────┐
  │ 📖 Modern Literary Novel        │
  │ by @AuthorName • ⭐⭐⭐⭐⭐ (142) │
  │ ────────────────────────────── │
  │ Clean, elegant formatting for   │
  │ contemporary fiction. Perfect   │
  │ for literary submissions.       │
  │                                 │
  │ Downloads: 1,247                │
  │ Tags: fiction, literary, modern │
  │                                 │
  │ [Preview] [Download] [♥ 89]     │
  └─────────────────────────────────┘
  ```

- **Preset Packaging**
  - Metadata (name, author, description, tags)
  - Preview images/PDFs
  - License information
  - Version history
  - Dependencies (fonts, packages)

- **Import/Export**
  - Export preset as `.mspreset` file
  - Share via URL or file
  - Import from file or URL
  - Dependency checking

- **Rating & Reviews**
  - 5-star rating system
  - Written reviews
  - Usage examples
  - Community improvements (forks)

### Technical Approach
```typescript
interface SharedPreset extends TemplatePreset {
  sharing: {
    author: string;
    authorUrl?: string;
    license: 'MIT' | 'CC-BY' | 'CC-BY-SA' | 'Proprietary';
    version: string;
    uploadDate: Date;
    downloads: number;
    rating: {
      average: number;
      count: number;
    };
    reviews: Review[];
    dependencies?: {
      fonts?: string[];
      latexPackages?: string[];
    };
  };

  preview?: {
    thumbnail: string; // Base64
    samplePDF?: string; // URL to preview PDF
  };
}

interface Review {
  author: string;
  rating: number; // 1-5
  text: string;
  date: Date;
  helpful: number; // Upvotes
}

class PresetMarketplace {
  browsePresets(filter: { category?: string; tags?: string[]; minRating?: number }): SharedPreset[];
  downloadPreset(id: string): Promise<TemplatePreset>;
  uploadPreset(preset: TemplatePreset, sharing: SharedPreset['sharing']): Promise<string>;
  ratePreset(id: string, rating: number, review?: string): Promise<void>;
}
```

---

## 16. Live Preview Rendering 🎨

### Concept
Real-time PDF preview as you edit template settings (like print-shop software).

### Features

- **Split Preview Mode**
  ```
  ┌──────────────┬───────────────────┐
  │ Settings     │ Live Preview      │
  │              │                   │
  │ Font Size:   │ ┌───────────────┐ │
  │ [12pt ▼]     │ │ Chapter 1     │ │
  │              │ │               │ │
  │ Line Spacing:│ │ Lorem ipsum   │ │
  │ ────█────    │ │ dolor sit...  │ │
  │ 1.0   2.0    │ │               │ │
  │              │ │               │ │
  │ Margins:     │ │               │ │
  │ Top: [1in]   │ └───────────────┘ │
  │              │                   │
  │ [Recompile]  │ Page 1 of 247     │
  └──────────────┴───────────────────┘
  ```

- **Auto-Recompile Options**
  - On setting change (instant, may lag)
  - Manual button click (user-controlled)
  - Debounced (500ms after last change)

- **Preview Controls**
  - Zoom in/out
  - Page navigation
  - Full-screen mode
  - Download current preview

- **Performance**
  - Incremental compilation (only changed sections)
  - Preview caching
  - Background worker threads
  - Low-resolution preview option

### Technical Approach
```typescript
interface PreviewSettings {
  mode: 'instant' | 'manual' | 'debounced';
  debounceMs: number;
  resolution: 'low' | 'medium' | 'high'; // DPI
  sampleChapters?: number; // Render first N chapters only
}

class LivePreviewRenderer {
  private compiler: LaTeXCompiler;
  private previewCache: Map<string, string>; // Config hash → PDF path

  async renderPreview(
    config: TemplateConfiguration,
    settings: PreviewSettings
  ): Promise<string>; // PDF blob URL

  private compileIncremental(
    oldConfig: TemplateConfiguration,
    newConfig: TemplateConfiguration
  ): Promise<string>;

  clearCache(): void;
}
```

---

# Implementation Strategy

## Development Phases

### Phase 6: Core Writing (Months 1-2)
Priority: High impact, quick implementation
- Multi-format batch export
- Word count goals
- TOC generator
- Cover page generator

**Estimated Effort**: 80-100 hours

### Phase 7: Organization (Months 3-4)
Priority: High value for authors
- Scene/chapter outliner
- Character database
- Research notes panel
- Style consistency checker

**Estimated Effort**: 120-140 hours

### Phase 8: Publishing (Months 5-6)
Priority: Professional differentiation
- KDP export presets
- POD service integration
- Readability dashboard
- Pacing visualizer

**Estimated Effort**: 100-120 hours

### Phase 9: Advanced (Months 7+)
Priority: Power features
- Comment system
- Version comparison
- Preset sharing
- Live preview

**Estimated Effort**: 140-160 hours

## Testing Strategy

### Unit Tests
- Each feature module tested independently
- Mock Obsidian API interactions
- Test edge cases (empty manuscripts, huge files)

### Integration Tests
- End-to-end export workflows
- Multi-file manuscript handling
- Settings persistence

### User Acceptance Testing
- Beta program with real authors
- Genre-specific testing (fiction, non-fiction, academic)
- Accessibility compliance

## Documentation

### User Guides
- Video tutorials for major features
- Step-by-step written guides
- FAQ and troubleshooting
- Best practices by genre

### Developer Docs
- Architecture decision records
- API documentation
- Contributing guidelines
- Plugin extension points

---

# Marketing & Community

## Feature Highlights

### For Fiction Authors
- Character database with relationship mapping
- Pacing visualizer for story flow
- Scene outliner with drag-drop
- Clean, distraction-free templates

### For Academic Writers
- Citation management (already implemented)
- Multi-format export (conferences, journals)
- Style consistency checking
- Research notes integration

### For Self-Publishers
- Direct KDP export (one-click)
- Print-ready formatting (IngramSpark, etc.)
- Professional cover page generation
- Quality checks before publishing

## Competitive Advantages

vs. **Scrivener**:
- Obsidian's knowledge graph
- Markdown-native (future-proof)
- Lightweight, faster
- Free core editor

vs. **Atticus**:
- More flexible formatting
- Better version control (Git-friendly)
- Extensible via plugins
- Advanced LaTeX support

vs. **Vellum** (Mac only):
- Cross-platform (Windows, Linux, Mac)
- Open-source community
- Lower cost (one-time vs subscription)
- Academic writing support

---

# Success Metrics

## User Engagement
- Active installations
- Feature usage statistics
- Export counts per month
- Template downloads

## Quality Indicators
- GitHub issues resolved
- User ratings/reviews
- Community contributions
- Support ticket volume

## Adoption Goals
- **Year 1**: 5,000 active users
- **Year 2**: 15,000 active users
- **Year 3**: 30,000+ active users

---

# Conclusion

These enhancements position Manuscript Pro as a **comprehensive, professional authoring platform** that rivals expensive commercial software while maintaining the openness and flexibility of Obsidian.

**Next Steps:**
1. Prioritize Phase 6 features based on user feedback
2. Create detailed technical specs for chosen features
3. Set up project tracking (GitHub Projects or similar)
4. Begin development on highest-impact features
5. Establish beta testing program

**Let's build something amazing!** 🚀
