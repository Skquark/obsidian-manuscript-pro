# ManuScript Pro

**LaTeX & Pandoc Academic Writing & Publishing Toolkit**

Transform Obsidian into a professional academic writing environment. ManuScript Pro provides everything you need to write, organize, and publish academic papers, theses, books, and technical documentation—all within your favorite knowledge base.

[![Version](https://img.shields.io/github/v/release/Skquark/obsidian-manuscript-pro)](https://github.com/Skquark/obsidian-manuscript-pro/releases)
[![License](https://img.shields.io/github/license/Skquark/obsidian-manuscript-pro)](LICENSE)

---

## 📖 What is ManuScript Pro?

ManuScript Pro bridges the gap between Obsidian's powerful note-taking capabilities and professional academic publishing requirements. If you're writing anything that needs citations, equations, cross-references, or professional formatting—research papers, PhD theses, technical manuals, academic books—this plugin is for you.

### Quick Start

- Install Pandoc and ensure it’s on your PATH (pandoc.org).
- Enable ManuScript Pro in Obsidian. In settings, turn on “Enable in Live Preview”.
- Optional: Set a global default CSL in Settings → Export → “Default CSL Style”.
- Try an export via the command palette: “ManuScript Pro: Export Current File”.
- Use Focus Mode (Mod+Shift+Z) to write distraction‑free. The status bar indicates focus state; Ctrl+Click cycles zone.

### The Problem It Solves

Academic and technical writing requires:
- **LaTeX equations** for mathematical notation
- **Citation management** with BibTeX
- **Cross-references** for figures, tables, and equations
- **Professional export** to PDF, DOCX, or LaTeX
- **Structured organization** for long documents

But raw LaTeX/Pandoc syntax in your notes looks like this:

```markdown
The mass-energy equivalence $E = mc^2$ was derived by 
\textcite{einstein1905} and later expanded \autocite{einstein1915}.

See \autoref{fig:results} for details.

$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$

\begin{figure}
  \includegraphics{results.png}
  \caption{Experimental results}
  \label{fig:results}
\end{figure}
```

**It's functional but hard to read and write in.**

### The Solution

ManuScript Pro makes your academic writing clean, readable, and enjoyable:

```markdown
The mass-energy equivalence E = mc² was derived by 
einstein1905 and later expanded einstein1915.

See fig:results for details.

∫₀^∞ e^(-x²) dx = √π/2

[Figure with caption: Experimental results]
```

Plus it gives you:
- **Intelligent citation management** - Auto-fetch from DOI, manage BibTeX entries
- **Smart cross-references** - Track all your labels automatically
- **One-click publishing** - Export to PDF, DOCX, HTML, EPUB
- **Progress tracking** - Word counts, goals, writing statistics
- **Pre-publication checks** - Catch broken references before submission

---

## ✨ Key Features

### 1. 📝 Intelligent Syntax Concealment

**Hide the noise, see your content.**

ManuScript Pro conceals LaTeX and Pandoc markup in Live Preview mode, making your documents readable while you write. Syntax automatically reveals when your cursor is on that line, so editing is seamless.

#### What Gets Concealed

**Math Delimiters**
```markdown
Before: The equation $E = mc^2$ shows...
After:  The equation E = mc² shows...

Before: $$\int_0^\infty e^{-x^2} dx$$
After:  ∫₀^∞ e^(-x²) dx
```

**Citations**
```markdown
Before: Recent studies [@smith2020; @jones2021] show...
After:  Recent studies [smith2020; jones2021] show...

Before: As @brown2019 demonstrates...
After:  As brown2019 demonstrates...
```

**LaTeX Commands**
```markdown
Before: This is \textbf{bold} and \emph{italic}
After:  This is bold and italic

Before: See \ref{sec:intro} in \autoref{fig:1}
After:  See sec:intro in fig:1
```

**Pandoc Markup**
```markdown
Before: [This is a note]{.note #id}
After:  This is a note

Before: :::warning
After:  (warning box, cleaner display)
```

#### Smart Revealing

- **Cursor-aware** - Syntax appears when you're editing that line
- **Non-destructive** - All original markup is preserved
- **Customizable** - Toggle individual pattern groups on/off
- **Performance optimized** - Handles 500+ page manuscripts smoothly

### 2. 📚 Advanced Bibliography Management

**Your personal research library, integrated.**

Full BibTeX integration with modern enhancements that make citation management actually enjoyable.

#### Core Features

**BibTeX File Support**
- Automatically parse `.bib` files in your vault
- Support for all standard entry types (article, book, inproceedings, etc.)
- Multi-file bibliography support
- Real-time updates when .bib files change

**Citation Auto-Completion**
- Type `@` to see all available citations
- Fuzzy search by author, title, year, or citation key
- Keyboard navigation (↑↓ to select, Enter to insert)
- Preview citation details in suggestion list

**Citation Styles**

ManuScript Pro supports citation formatting in two modes:

**Built-in Preview Styles** (for hover tooltips in Live Preview):
- APA (7th edition)
- Chicago (author-date)
- MLA (9th edition)

These styles format citations for quick reference while writing. They provide fast, approximate formatting without requiring external CSL files.

**CSL Export Styles** (for final output via Pandoc):
- **Any CSL style** - Download from [Zotero Style Repository](https://www.zotero.org/styles) (10,000+ styles)
- Set per-export in the Export Dialog, or per-profile, or globally in settings
- Full Pandoc/citeproc support including IEEE, Vancouver, Harvard, Nature, ACS, etc.

**Important**: Built-in preview styles are for convenience during writing. Your final exported document (PDF/DOCX/HTML) will use whichever CSL file you specify, giving you access to any citation style you need.

**Hover Previews**
Hover over any citation to see:
- Full bibliographic details
- Author names and publication year
- Title and venue
- DOI/URL if available

#### Advanced Features

**🌐 Citation Import from External Sources**

Automatically fetch complete citation data:

```
DOI: 10.1038/nature12345
→ Fetches from CrossRef API
→ Adds complete BibTeX entry to your bibliography

arXiv: 2103.12345
→ Fetches from arXiv API
→ Includes abstract and metadata

PubMed ID: 12345678
→ Fetches from PubMed API
→ Medical/biological literature
```

**Command**: "ManuScript Pro: Import Citation"

**🔍 Duplicate Detection**

Find and merge duplicate bibliography entries:
- Uses Levenshtein distance for fuzzy matching
- Compares author names, titles, years, DOIs
- Smart suggestions for which version to keep
- Automatic bibliography cleanup

**Command**: "ManuScript Pro: Find Duplicate Citations"

**🧠 Smart Citation Suggestions**

Context-aware citation recommendations:
- Suggests relevant citations based on current paragraph
- Analyzes co-citation patterns
- Considers document topic and keywords
- Shows recently used citations

**Rate Limiting**
- Respects API rate limits (CrossRef, arXiv, PubMed)
- Queues requests automatically
- Shows progress for batch imports

### 3. 🔗 Cross-Reference System

**Never lose track of your figures, tables, and equations.**

Automatic indexing and tracking of all labels in your manuscript with intelligent auto-completion.

#### Features

**Automatic Label Indexing**
- Scans entire vault on startup (configurable)
- Detects `\label{...}` commands
- Categorizes by type: figures, tables, equations, sections, custom
- Updates in real-time as you write
- Cross-file reference support

**Label Types**
```latex
\label{eq:einstein}     → Equation
\label{fig:results}     → Figure  
\label{tab:data}        → Table
\label{sec:intro}       → Section
\label{thm:main}        → Custom (theorem)
```

**Reference Auto-Completion**
Type `\ref{` and get:
- Dropdown with all available labels
- Filtered by type if using `\autoref{`, `\eqref{`, etc.
- Shows label context (surrounding text)
- Sorted by file and position

**Label Browser Panel**
Dedicated sidebar view showing:
- All labels organized by type
- Jump to label definition with one click
- Reference count for each label
- Unused labels highlighted
- Search and filter labels

**Validation**
- Detects broken references (`\ref{missing-label}`)
- Highlights undefined labels
- Shows reference usage statistics
- Pre-publication checklist integration

### 4. 📊 Manuscript Statistics & Progress Tracking

**Know exactly how your writing is progressing.**

Comprehensive statistics for long-form academic writing projects.

#### Real-Time Statistics

**Word Counts**
- Total document word count
- Selection word count
- Per-section word counts
- Excludes LaTeX commands and citations (accurate content count)
- Character counts (with/without spaces)

**Reading Time**
- Estimated reading time
- Based on average reading speed (configurable)
- Useful for presentations and articles

**Writing Sessions**
- Tracks active writing time
- Session word count
- Words per minute during active writing
- Daily writing streaks

#### Progress Goals

**Chapter Goals**
```markdown
Set individual goals for each chapter:
Chapter 1: 5000 words (3,247 / 5,000) - 65%
Chapter 2: 4000 words (4,203 / 4,000) - 105% ✓
Chapter 3: 6000 words (1,892 / 6,000) - 32%
```

**Total Goals**
- Set overall manuscript word count goals
- Visual progress indicators
- Estimated completion date based on writing pace

#### Historical Data

**Writing History**
- Daily word count tracking
- Writing activity calendar
- Productivity trends
- Export statistics to CSV

**Views**
- **Status Bar** - Quick word count at a glance
- **Sidebar Panel** - Detailed statistics and charts
- **Manuscript Navigator** - Per-section breakdown

### 5. 🎨 Templates & Snippets System

**Reusable content with intelligent auto-completion.**

Professional templates and snippets that save time and ensure consistency.

#### Built-In Templates

**Academic Paper Template**
```markdown
---
title: {{title}}
author: {{author}}
date: {{date}}
abstract: {{abstract}}
keywords: {{keywords}}
bibliography: references.bib
---

# Introduction
{{introduction}}

# Literature Review
{{literature}}

# Methodology
{{methodology}}

# Results
{{results}}

# Discussion
{{discussion}}

# Conclusion
{{conclusion}}

# References
```

**Book Chapter Template**
- Full chapter structure
- Section placeholders
- Consistent formatting

#### Built-In Snippets

**LaTeX Environments** (with variable substitution):

```latex
Figure snippet:
\begin{figure}[{{placement}}]
  \centering
  \includegraphics[width={{width}}]{{{path}}}
  \caption{{{caption}}}
  \label{{{label}}}
\end{figure}

Table snippet:
\begin{table}[{{placement}}]
  \centering
  \caption{{{caption}}}
  \label{{{label}}}
  \begin{tabular}{{{columns}}}
    {{content}}
  \end{tabular}
\end{table}

Equation snippet:
\begin{equation}
  {{equation}}
  \label{{{label}}}
\end{equation}

Theorem snippet:
\begin{theorem}[{{name}}]
  {{statement}}
\end{theorem}
```

**Markdown Snippets**:
- Code blocks with syntax highlighting
- Obsidian callouts (note, warning, tip, etc.)
- Definition lists
- Proof environments

#### Advanced Features

**Snippet Autocomplete**
Type trigger characters (e.g., `fig`, `eq`, `thm`) → dropdown appears → press Enter → variables auto-filled.

Triggers:
- `fig` → Figure environment
- `tab` → Table environment  
- `eq` → Equation environment
- `def` → Definition
- `thm` → Theorem
- `prf` → Proof

**Smart Variable Auto-Fill**

Template variables automatically populated from:
- **File metadata** (frontmatter: title, author, date, keywords)
- **Current context** (file name, folder name)
- **Bibliography** (available citation keys)
- **Cross-references** (existing labels)
- **System** (current date, time)

Example:
```markdown
Insert figure snippet in file "chapter3-results.md"
→ {{path}} auto-filled with "../figures/"
→ {{label}} auto-filled with "fig:chapter3-"
→ {{width}} suggested as "0.8\textwidth"
```

**Custom Templates**

Create your own templates in `.templates/` folder:
```markdown
---
template: true
name: My Custom Template
description: Template for X
category: academic
variables:
  - name: title
    label: Title
    description: Document title
    required: true
  - name: author
    label: Author
    default: "{{author}}"
---

# {{title}}
Author: {{author}}
```

**Custom Snippets**

```markdown
---
snippet: true
name: My Snippet
trigger: mysnip
category: custom
---

Content with {{variable1}} and {{variable2}}
```

### 6. 📤 Professional Export & Publishing

**One-click export to any academic format.**

Export via Pandoc to professional publication-ready formats with zero configuration required.

#### Export Profiles

**PDF - Academic**
```
Format: PDF via LaTeX
Features:
  - Numbered sections
  - Bibliography with citation links
  - Cross-reference resolution
  - Professional typography
  - Customizable templates
Use: Journal submissions, theses
```

**DOCX - Manuscript**
```
Format: Microsoft Word
Features:
  - Styles and formatting
  - Track changes compatible
  - Embedded equations (MathML)
  - Bibliography
Use: Publisher submissions, collaborators
```

**HTML - Website**
```
Format: Standalone HTML
Features:
  - MathJax for equations
  - Responsive design
  - Syntax highlighting
  - Bibliography with links
Use: Personal website, blog, online publication
```

**EPUB - eBook**
```
Format: EPUB3
Features:
  - Reflowable layout
  - eReader compatible
  - Embedded images
  - Chapter navigation
Use: eBook distribution, Kindle
```

**LaTeX - Source**
```
Format: Standalone .tex
Features:
  - Full LaTeX source
  - All packages included
  - Bibliography .bib file
  - Ready for custom compilation
Use: Advanced LaTeX users, journal templates
```

**Markdown - Clean**
```
Format: Pandoc Markdown
Features:
  - No Obsidian-specific syntax
  - Portable format
  - Compatible with other tools
Use: Archiving, migration, sharing
```

#### Custom Export Profiles

Create custom profiles with:
- Custom Pandoc arguments
- Template files
- CSS stylesheets
- Bibliography styles
- Metadata defaults

#### Export Features

**Batch Export**
- Export multiple files at once
- Maintain folder structure
- Automatic output naming

**Metadata Extraction**
- Uses frontmatter from your notes
- Override with export dialog
- Template variable substitution

**Image Handling**
- Automatic path resolution
- Copy images to output directory
- Format conversion if needed

**Requirements**
- Pandoc must be installed ([pandoc.org](https://pandoc.org))
- Desktop Obsidian (Node.js integration required)
- LaTeX distribution for PDF export (TeX Live, MiKTeX)

### Export Troubleshooting

- Pandoc not found
  - Install Pandoc and restart Obsidian so PATH updates apply.
  - If Pandoc is installed, ensure its folder is in PATH for your OS user, or set a custom path in Settings → Export & Publishing → Pandoc Path.
- PDF writer errors
  - PDF uses LaTeX engines via `--pdf-engine`. Ensure a LaTeX distribution is installed.
  - Try exporting to LaTeX to inspect the generated `.tex` for clues.
- CSL style not applied
  - Precedence: dialog override > profile setting > global default.
  - Use the UI indicators (✓/✗) to verify the selected CSL file exists.
- Debug Pandoc runs
  - Enable “Verbose Logging” in Settings → Export to print Pandoc args and output in the developer console.

### 7. ✅ Pre-Publication Validation

**Catch errors before submission.**

Comprehensive manuscript checking to ensure everything is publication-ready.

#### Validation Rules

**Reference Validation**
```
✗ Broken reference: \ref{fig:missing}
✓ All cross-references resolve

✗ Undefined equation: \eqref{eq:undefined}
✓ All equation references valid

✗ Dead internal link: [[Non-existent Note]]
✓ All internal links valid
```

**Citation Validation**
```
✗ Missing citation: [@undefined2023]
✓ All citations in bibliography

✗ Unused bibliography entry: smith2020
✓ All entries cited (or ignored)

✗ Duplicate entries in .bib file
✓ No duplicates found
```

**Figure/Table Validation**
```
✗ Missing image: \includegraphics{notfound.png}
✓ All images exist

✗ Empty caption: \caption{}
✓ All captions present

✗ Unlabeled figure (referenced by number)
✓ All figures labeled
```

**Structural Validation**
```
✗ Inconsistent heading levels (jumps from # to ###)
✓ Proper heading hierarchy

✗ Unmatched LaTeX environments (\begin without \end)
✓ All environments properly closed

✗ Unclosed citation bracket [@author
✓ All syntax properly formed
```

#### Severity Levels

- 🔴 **Error** - Must fix before publishing (broken references, missing files)
- 🟡 **Warning** - Should review (unused citations, empty sections)
- 🔵 **Info** - Suggestions (style improvements, optimizations)

#### Validation Panel

Dedicated sidebar showing:
- All validation issues organized by category
- Click to jump to problem location
- Fix suggestions for common issues
- Export validation report

**Auto-Validation**
- Optional validation on save
- Real-time validation as you write
- Pre-export validation check

### 8. 📑 Manuscript Navigator

**Navigate long documents with ease.**

Hierarchical document structure browser for books, theses, and multi-chapter projects.

#### Features

**Document Structure Tree**
```
📘 My Thesis
  📄 00-frontmatter.md (1,234 words)
  📄 01-introduction.md (5,678 words)
    # Introduction
    ## Background
    ## Research Questions
  📄 02-literature.md (8,901 words)
    # Literature Review
    ## Theoretical Framework
    ## Previous Studies
  📄 03-methodology.md (6,543 words)
  ...
```

**Per-Section Statistics**
- Word count for each section
- Progress percentage
- Last modified date
- Estimated reading time

**Navigation**
- Click any heading to jump to it
- Expand/collapse chapters
- Drag to reorder sections (configurable)
- Breadcrumb navigation

**Outlining**
- See your entire manuscript structure at a glance
- Identify missing sections
- Balance chapter lengths
- Reorganize structure

### 9. 🎯 Focus Mode

**Distraction-free writing at its finest.**

Enhanced writing environment that helps you stay in flow state.

#### Features

**Typewriter Mode**
- Keeps cursor vertically centered
- Reduces eye movement
- Smoother writing experience

**Dimming Modes**
```
Sentence Focus: Dim all sentences except current
Paragraph Focus: Dim all paragraphs except current
Section Focus: Dim everything outside current section
```

**UI Hiding**
- Hide sidebars
- Hide status bar
- Hide ribbon
- Hide tab headers
- Minimal interface for maximum focus

**Syntax Concealment**
- Enhanced concealment in focus mode
- Hide all markdown formatting
- Show only rendered content

**Customization**
- Adjustable dimming intensity
- Custom focus scope
- Keyboard shortcuts
- Per-document focus settings

### 10. 🎭 Profile System

**Switch configurations instantly.**

Save and switch between different plugin configurations for different projects or writing styles.

#### Use Cases

**Academic Paper Profile**
```
Pattern Groups: All enabled
Citation Style: APA
Export Default: PDF - Academic
Validation: Strict
Statistics: Show in sidebar
```

**Novel Writing Profile**
```
Pattern Groups: Minimal (only basic markdown)
Citation Style: None
Export Default: DOCX - Manuscript
Validation: Relaxed
Statistics: Full tracking enabled
Focus Mode: Paragraph dimming
```

**Technical Manual Profile**
```
Pattern Groups: LaTeX commands + code
Citation Style: IEEE
Export Default: HTML - Website
Validation: Technical (code blocks, references)
Focus Mode: Off
```

**Blog Post Profile**
```
Pattern Groups: Pandoc markup only
Export Default: Markdown - Clean
Validation: Minimal
Statistics: Basic word count
```

#### Profile Features

**Quick Switching**
- Dropdown in status bar
- Command palette
- Keyboard shortcuts
- Auto-profile per folder (optional)

**Profile Management**
- Create unlimited profiles
- Export/import profiles
- Share profiles with team
- Default profile per vault

**What's Included in Profiles**
- All plugin settings
- Pattern group states
- Citation style
- Export preferences
- UI preferences
- Validation rules
- Statistics settings

---

## 📦 Installation

### From Obsidian Community Plugins *(Coming Soon)*

1. Open Obsidian Settings
2. Go to **Community Plugins** and disable Safe Mode
3. Click **Browse** and search for "ManuScript Pro"
4. Click **Install** and then **Enable**

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/Skquark/obsidian-manuscript-pro/releases)
2. Extract `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/manuscript-pro/` directory
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

---

## 🔒 Security & Networking

ManuScript Pro takes security seriously. Here's what you should know:

### Safe Command Execution

**Pandoc Exports**: All exports use Node.js `execFile` with array arguments instead of shell strings. This prevents command injection attacks:

```typescript
// Safe ✓
execFile('pandoc', ['-f', 'markdown', '-t', 'pdf', input], ...)

// Unsafe ✗ (NOT used)
exec(`pandoc -f markdown -t pdf ${input}`)
```

**Why this matters**: Even if a malicious file path or option were passed, it cannot execute arbitrary shell commands.

### Network Requests

ManuScript Pro makes **optional** network requests only when you explicitly use citation import features:

| Service | Endpoint | Purpose | Data Sent |
|---------|----------|---------|-----------|
| **CrossRef** | `https://api.crossref.org/works/{doi}` | DOI → BibTeX | DOI string only |
| **arXiv** | `https://export.arxiv.org/api/query` | arXiv ID → metadata | arXiv ID only |
| **PubMed** | `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/` | PMID → metadata | PubMed ID only |

**User-Agent Header**: All requests identify as "ObsidianManuscriptPro/version" for API rate limit compliance.

**CrossRef Polite Pool**: You can optionally add your email in settings (`Citations → CrossRef Email`). This gives you access to CrossRef's "polite" rate limits (50 req/s vs 5 req/s). Your email is only sent to CrossRef and only in the User-Agent header.

**No Tracking**: ManuScript Pro never sends:
- Your vault contents
- File names or paths
- Usage analytics
- Personal information (except optional email to CrossRef as described above)

### File System Access

ManuScript Pro operates entirely within your Obsidian vault:
- **Read**: Reads `.md`, `.bib`, `.csl`, `.json` files in your vault
- **Write**: Writes export outputs to configured directories (default: `exports/`)
- **Index**: Builds in-memory indexes of labels and citations for quick access

**Permissions**: Standard Obsidian plugin permissions (vault read/write). No special privileges required.

### Third-Party Dependencies

All dependencies are audited and pinned to specific versions. See `package.json` for the complete list. Major dependencies:
- **Obsidian API** - Core functionality
- **CodeMirror 6** - Editor extensions
- No analytics or tracking libraries

### Privacy

**100% Local**: All processing happens on your machine. Your writing never leaves your device unless you explicitly export or sync via your chosen method (Git, cloud storage, etc.).

**No Telemetry**: ManuScript Pro collects zero usage statistics or crash reports.


## 🚀 Quick Start Guide

### Accessing Features

**Ribbon Menu** (Click the scroll icon in the left sidebar)

All major features are organized in an easy-to-access ribbon menu:

- **📤 Export** - Quick exports to PDF, DOCX, HTML, EPUB or full export dialog
- **📚 Citations & Bibliography** - Import citations from DOI/arXiv/PubMed, detect duplicates, reload bibliography
- **🔗 Cross-References** - Open label browser, index all labels, validate references
- **📋 Manuscript Tools** - Open navigator, edit project metadata, run pre-publication validation, view statistics
- **📝 Templates & Snippets** - Insert templates, snippets, figures, tables, equations
- **👁️ Concealment Groups** - Toggle syntax concealment for different markup types
- **🎯 Focus Mode** - Enter distraction-free writing mode
- **⚙️ Settings** - Open plugin settings

**Command Palette** (Ctrl/Cmd + P)

All features are also available via the command palette by searching for "ManuScript Pro".

**Status Bar**

- Shows current profile and enabled concealment groups
- Click to switch profiles
- Displays word count and writing statistics (when enabled)

### For Academic Paper Writers

**Step 1: Set Up Bibliography**
```
1. Create or copy your references.bib file into your vault
2. Open ManuScript Pro settings → Citations
3. Set bibliography file path to "references.bib"
4. Choose citation style (e.g., APA)
```

**Step 2: Start Writing**
```
1. Create new note "my-paper.md"
2. Add frontmatter:
---
title: My Research Paper
author: Your Name
bibliography: references.bib
---

3. Switch to Live Preview mode
4. Start writing with LaTeX and citations
```

**Step 3: Use Features**
```
- Type @ for citation autocomplete
- Type \ref{ for cross-reference autocomplete
- Insert snippets with Commands (Ctrl/Cmd + P)
- Check word count in status bar
```

**Step 4: Export**
```
1. Open Command Palette
2. Run "ManuScript Pro: Export Document"
3. Choose "PDF - Academic"
4. Select output location
5. Done!
```

### For Thesis/Dissertation Writers

**Folder Structure**
```
My Thesis/
  ├── 00-frontmatter.md
  ├── 01-introduction.md
  ├── 02-literature-review.md
  ├── 03-methodology.md
  ├── 04-results.md
  ├── 05-discussion.md
  ├── 06-conclusion.md
  ├── references.bib
  └── figures/
      ├── fig1.png
      ├── fig2.png
      └── ...
```

**Use Manuscript Navigator**
```
1. Open Manuscript Navigator panel (Command Palette)
2. See entire thesis structure
3. Track progress per chapter
4. Navigate between sections
```

**Set Chapter Goals**
```
Settings → Statistics → Goals
Chapter 1: 5000 words
Chapter 2: 6000 words
Chapter 3: 8000 words
...
```

### For Technical Documentation

**Use Templates**
```
1. Create custom template for API documentation
2. Define variables (function name, parameters, returns)
3. Use "Insert Template" command
4. Fill variables → instant structured documentation
```

**Export to Multiple Formats**
```
- HTML for website
- PDF for printing
- Markdown for version control
```

---

## ⚙️ Configuration

### Essential Settings

**Pattern Groups** (Settings → ManuScript Pro → Pattern Groups)
```
☑ Math Delimiters - Hide $ and $$
☑ Citations - Clean [@author] syntax  
☑ LaTeX Commands - Hide \textbf, \ref, etc.
☑ Pandoc Markup - Hide []{} attributes
☑ Indexing & Metadata - Hide \index, comments
```

**Citations** (Settings → ManuScript Pro → Citations)
```
Bibliography File: references.bib
Citation Style: APA
Enable Auto-Completion: ✓
Show Hover Previews: ✓
```

**Export** (Settings → ManuScript Pro → Export)
```
Pandoc Path: (auto-detected)
Default Output Directory: exports/
Default Profile: PDF - Academic
Open After Export: ✓
```

**Statistics** (Settings → ManuScript Pro → Statistics)
```
Show in Sidebar: ✓
Show in Status Bar: ✓
Track Writing Sessions: ✓
Default Chapter Goal: 5000 words
```

### Advanced Settings

**Cross-References**
```
Index on Startup: ✓
Show Label Browser: ✓
Auto-Complete Delay: 300ms
```

**Templates**
```
Custom Templates Path: .templates
Custom Snippets Path: .snippets
Enable Triggers: ✓
Enable Variable Hints: ✓
```

**Validation**
```
Auto-Validate on Save: □
Show Panel: □
Validate References: ✓
Validate Citations: ✓
Severity Filter: All
```

**Focus Mode**
```
Typewriter Scrolling: ✓
Dim Intensity: 0.5
Hide Sidebars in Focus: ✓
```

---

## 🎓 Use Cases & Workflows

### Research Paper from Start to Finish

1. **Planning** - Use manuscript navigator to outline sections
2. **Literature Review** - Import citations from DOI, organize in references.bib
3. **Writing** - Focus mode for distraction-free writing, syntax concealment for readability
4. **Figures/Tables** - Insert with snippets, auto-labeled and tracked
5. **Citations** - Auto-complete as you write, smart suggestions based on context
6. **Editing** - Validation to catch broken refs, word count tracking for journal limits
7. **Submission** - Export to PDF (preprint) and DOCX (journal submission)

### PhD Thesis Management

1. **Structure** - Manuscript navigator shows all chapters
2. **Goals** - Set per-chapter word count goals, track progress
3. **Consistency** - Templates ensure consistent formatting across chapters
4. **References** - One central .bib file, duplicate detection keeps it clean
5. **Revision** - Track changes in DOCX export for advisor feedback
6. **Defense** - Export chapters individually or complete thesis to PDF

### Technical Book Writing

1. **Organization** - Folder per chapter, manuscript navigator for structure
2. **Code Snippets** - Syntax-highlighted code blocks with snippets
3. **Cross-References** - Extensive figure/table/equation labeling
4. **Multiple Outputs** - HTML for website preview, PDF for print, EPUB for distribution
5. **Collaboration** - Profiles for different co-authors, export .bib for sharing

### Conference Paper Speed Writing

1. **Template** - Start with Academic Paper template
2. **Import References** - Fetch key citations from DOI in minutes
3. **Write Fast** - Focus mode + typewriter scrolling for flow state
4. **Word Limit** - Real-time word count in status bar, alerts at limit
5. **Export** - PDF with correct formatting for submission in one click

---

## 🔧 Advanced Topics

### Custom Pandoc Templates

Create custom export templates in `.templates/pandoc/`:

**custom-pdf.tex**
```latex
\documentclass[$if(fontsize)$$fontsize$,$endif$article]{article}
% Your custom preamble
\usepackage{custom-package}

\begin{document}
$body$
\end{document}
```

Reference in export profile settings.

### Citation Style Language (CSL)

Add custom CSL styles:
```
1. Download .csl file from Zotero Style Repository
2. Place in vault: .csl/my-style.csl
3. Settings → Citations → Add Custom Style
4. Select from dropdown
```

### Custom Snippet Triggers

Create smart triggers:
```markdown
---
snippet: true
name: Quick Figure
trigger: qfig
description: Fast figure insertion
---

\begin{figure}[htbp]
  \centering
  \includegraphics[width=0.8\textwidth]{{{path}}}
  \caption{{{caption}}}
  \label{fig:{{filename}}}
\end{figure}
```

### Regex Patterns for Custom Concealment

Add custom patterns in Settings → Advanced → Custom Patterns:
```json
{
  "description": "Hide custom command",
  "regexString": "\\\\mycommand\\{([^}]+)\\}",
  "hideIndexes": [0],
  "revealIndexes": [1]
}
```

### Multi-Vault Workflows

Share configurations across vaults:
```
1. Export profile from Vault A
2. Import profile to Vault B
3. Or sync .obsidian/plugins/manuscript-pro/ folder
```

### Git Integration

Track manuscript versions:
```
1. Initialize git in vault
2. Commit after each writing session
3. .bib file tracks citation changes
4. Export outputs to separate branch
```

---

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Compatibility Notes

- RegExp indices fallback: Some Electron builds do not support the `d` (indices) flag for regular expressions. The plugin gracefully degrades by hiding the full match rather than partial delimiters. Concealed content remains intact.
- Reading Mode concealment: A DOM post‑processor applies conceal rules. It closely matches Live Preview but complex nested markup may be less precise. Toggle “Enable in Reading Mode” as desired.
- File pickers: On some builds “Browse…” dialogs may be unavailable. Enter file paths manually; the UI will still show existence status when possible.

### Development Setup

```bash
# Clone repository
git clone https://github.com/Skquark/obsidian-manuscript-pro
cd obsidian-manuscript-pro

# Install dependencies
npm install

# Build plugin
npm run build

# Development mode (auto-rebuild on changes)
npm run dev

# Link to test vault
ln -s $(pwd) /path/to/test-vault/.obsidian/plugins/manuscript-pro
```

### Project Structure

```
src/
  ├── citations/           # Bibliography & citation management
  │   ├── BibliographyManager.ts
  │   ├── CitationFormatter.ts
  │   ├── CitationImporter.ts
  │   ├── DuplicateDetector.ts
  │   └── CitationSuggestionEngine.ts
  ├── crossref/            # Cross-reference tracking
  │   ├── CrossRefManager.ts
  │   ├── LabelBrowser.ts
  │   └── refAutoComplete.ts
  ├── export/              # Pandoc export system
  │   ├── ExportEngine.ts
  │   ├── ExportManager.ts
  │   └── ExportDialog.ts
  ├── focusMode/           # Focus mode features
  ├── manuscript/          # Document navigation
  ├── patterns/            # Concealment patterns
  ├── profiles/            # Profile system
  ├── stats/               # Statistics tracking
  ├── templates/           # Templates & snippets
  │   ├── TemplateManager.ts
  │   ├── SnippetManager.ts
  │   ├── SnippetSuggest.ts
  │   └── TemplateVariableHelper.ts
  ├── validation/          # Pre-publication checks
  ├── main.ts              # Plugin entry point
  └── settingsTab.ts       # Settings UI
```

### Reporting Issues

When reporting bugs, please include:
- Obsidian version
- Plugin version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (Ctrl+Shift+I)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

This project is a fork of [Dynamic Text Concealer](https://github.com/mattcoleanderson/obsidian-dynamic-text-concealer) by Matt Cole Anderson, used under the MIT License.

---

## 🙏 Acknowledgments

- **Matt Cole Anderson** - Original Dynamic Text Concealer plugin concept and implementation
- **Pandoc** - Universal document converter ([pandoc.org](https://pandoc.org))
- **Obsidian** - Powerful knowledge base platform ([obsidian.md](https://obsidian.md))
- **CrossRef, arXiv, PubMed** - Citation metadata APIs
- **Obsidian Community** - Feedback, testing, and support

---

## 📞 Support & Community

- **Documentation**: [Wiki](https://github.com/Skquark/obsidian-manuscript-pro/wiki)
- **Issues**: [GitHub Issues](https://github.com/Skquark/obsidian-manuscript-pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Skquark/obsidian-manuscript-pro/discussions)
- **Feature Requests**: [GitHub Issues](https://github.com/Skquark/obsidian-manuscript-pro/issues/new?template=feature_request.md)

---

## 🗺️ Roadmap

### Planned Features

**Version 0.2**
- [ ] Zotero integration for citation sync
- [ ] Enhanced equation editor with preview
- [ ] Table editor UI
- [ ] Citation network visualization

**Version 0.3**
- [ ] Real-time collaboration (via Git)
- [ ] AI-powered writing suggestions
- [ ] Grammar and style checking
- [ ] Citation recommendation engine

**Version 0.4**
- [ ] Custom export template gallery
- [ ] Multi-language citation styles
- [ ] Version control integration (advanced Git UI)
- [ ] Publishing workflow automation

**Future**
- [ ] Integration with LaTeX editors (Overleaf)
- [ ] Reference manager import (Mendeley, EndNote)
- [ ] Academic search integration
- [ ] Plagiarism checking
- [ ] Collaborative reviewing
- [ ] Journal submission automation

### Community Requests

Vote on features or suggest new ones in [GitHub Discussions](https://github.com/Skquark/obsidian-manuscript-pro/discussions/categories/feature-requests)!

---

## 💡 Tips & Tricks

### Productivity Hacks

**Daily Writing Ritual**
```
1. Open ManuScript Pro statistics panel
2. Set session goal (e.g., 500 words)
3. Enable Focus Mode (Ctrl/Cmd + Shift + F)
4. Write until goal met
5. Review validation panel before closing
```

**Citation Management**
```
- Import all key papers at start of project
- Use smart suggestions to discover related work
- Run duplicate detection monthly
- Export .bib file to backup folder regularly
```

**Export Workflow**
```
Create export profiles for each destination:
- "Draft PDF" - Quick preview, no bibliography
- "Full PDF" - Complete with all references
- "Submission DOCX" - Journal formatting
- "Advisor PDF" - With comments and todos
```

**Keyboard Shortcuts**
```
Set custom shortcuts in Obsidian settings:
- Insert Citation: Ctrl+Shift+C
- Insert Template: Ctrl+Shift+T
- Export Document: Ctrl+Shift+E
- Toggle Focus Mode: Ctrl+Shift+F
- Validate Document: Ctrl+Shift+V
```

### Best Practices

**File Organization**
```
Vault/
  ├── Manuscripts/
  │   ├── Paper1/
  │   │   ├── draft.md
  │   │   ├── references.bib
  │   │   └── figures/
  │   └── Paper2/
  ├── .templates/
  │   ├── academic-paper.md
  │   └── snippets/
  └── .csl/
      └── custom-styles/
```

**Version Control**
```
1. Use git for manuscript tracking
2. Commit after each writing session
3. Tag versions (v1-draft, v2-revision, v3-final)
4. Keep exports in separate branch
```

**Collaboration**
```
1. Export to DOCX with track changes
2. Share .bib file with co-authors
3. Use profiles for different reviewer preferences
4. Maintain single source of truth in Obsidian
```

---

## ❓ FAQ

**Q: Do I need to know LaTeX to use this?**  
A: No! While the plugin supports LaTeX, you can use it with basic Pandoc markdown. Templates and snippets make it easy to insert LaTeX when needed.

**Q: Can I use this for non-academic writing?**  
A: Absolutely! It's great for any long-form writing: novels, technical docs, books. Just disable features you don't need.

**Q: Will this work on mobile?**  
A: Syntax concealment and statistics work on mobile. Export requires desktop Obsidian with Pandoc installed.

**Q: How do I get Pandoc?**  
A: Download from [pandoc.org](https://pandoc.org). For PDF export, also install LaTeX (TeX Live or MiKTeX).

**Q: Can I export to my journal's template?**  
A: Yes! Create a custom export profile with your journal's LaTeX template.

**Q: Does this work with existing Dynamic Text Concealer settings?**  
A: Yes, it automatically migrates old settings on first run.

**Q: Can I disable features I don't use?**  
A: Yes, everything is modular. Disable any feature in settings.

**Q: How do I backup my bibliography?**  
A: Your .bib file is just a text file in your vault. It's backed up with your normal Obsidian backups.

**Q: Can I use multiple bibliography files?**  
A: Yes, specify multiple files in frontmatter:
```yaml
bibliography: [refs1.bib, refs2.bib]
```

**Q: What if my .bib file is huge?**  
A: The plugin handles thousands of entries efficiently. Use duplicate detection to clean it up.

---

## 🔧 Troubleshooting

### Export Issues

**"Pandoc not found" error**
- **Cause**: Pandoc is not installed or not in system PATH
- **Solution**: 
  1. Download and install Pandoc from https://pandoc.org
  2. Restart Obsidian completely (not just reload)
  3. Open terminal and verify: `pandoc --version`
  4. If still not working, manually set Pandoc path in Settings → ManuScript Pro → Export

**PDF export fails with "pdflatex not found"**
- **Cause**: LaTeX distribution not installed
- **Solution**:
  - **Windows**: Install MiKTeX from https://miktex.org
  - **macOS**: Install MacTeX from https://www.tug.org/mactex/
  - **Linux**: `sudo apt install texlive-full` or equivalent

**Citations not appearing in export**
- **Check**:
  1. Bibliography file exists and path is correct in frontmatter
  2. Citation keys match exactly (`@smith2023` vs `@Smith2023`)
  3. .bib file has valid BibTeX syntax
- **Test**: Try `pandoc --citeproc yourfile.md -o test.pdf` manually

**Cross-references showing "??" or not working**
- **Cause**: LaTeX needs multiple passes to resolve references
- **Solution**: This is expected on first export - export twice, or Pandoc/LaTeX will handle automatically

**Math equations not rendering in DOCX**
- **Note**: Depends on Pandoc version and Word settings
- **Workaround**: Use PDF export for final math-heavy documents, or try `--mathml` flag

### Performance Issues

**Vault indexing is slow (1000+ files)**
- **Solution**: Settings → Cross-References → Set "Max Files to Index" to 1000 or lower
- **Note**: Only frequently-referenced files need indexing

**Statistics panel updates lag**
- **Solution**: Settings → Statistics → Increase "Refresh Interval" to 10-30 seconds

**Obsidian freezes during large export**
- **Check**: Task Manager/Activity Monitor for Pandoc process
- **Solution**: Close other applications, or export in smaller chunks

### Concealment Issues

**Syntax not concealing in Live Preview**
- **Check**:
  1. Settings → ManuScript Pro → "Enable in Live Preview" is ON
  2. Current view mode is Live Preview (not Source Mode or Reading Mode)
  3. Specific syntax group is enabled (Math Delimiters, Citations, etc.)
- **Try**: Toggle ManuScript Pro off and on (Ctrl+P → "Toggle ManuScript Pro")

**Concealment reveals when not expected**
- **Note**: Cursor proximity reveals syntax - this is intentional for editing
- **Adjust**: Settings → Concealment → "Cursor Reveal Delay" (increase to 200-500ms)

**Math symbols look wrong after concealing**
- **Cause**: Unicode approximation vs actual LaTeX rendering
- **Note**: Concealment is for editing comfort - export renders correctly

### Citation & Bibliography Issues

**Autocomplete not showing citations**
- **Check**:
  1. Bibliography file loaded (Settings → Citations → Bibliography File)
  2. File exists and has valid BibTeX entries
  3. Reload bibliography: Ribbon Menu → Citations & Bibliography → Reload Bibliography

**Duplicate citations detected incorrectly**
- **Adjust**: Settings → Enhanced Bibliography → "Duplicate Similarity Threshold"
- **Note**: Lower = stricter matching, higher = more lenient

**Citation hover preview not showing**
- **Check**: Settings → Citations → "Citation Preview" is enabled
- **Try**: Reload Obsidian (Ctrl+R)

### Focus Mode Issues

**Focus Mode UI changes not reverting**
- **Solution**: Toggle Focus Mode off and wait 2 seconds
- **Manual Reset**: Settings → Appearance → Show/hide UI elements manually

**Typewriter dimming too aggressive**
- **Adjust**: Settings → Focus Mode → "Dim Opacity" (try 0.5 instead of 0.3)
- **Disable**: Uncheck "Typewriter Mode" while keeping other Focus Mode features

### General Issues

**Plugin not loading or grayed out**
- **Check**:
  1. Community Plugins are enabled (Settings → Community Plugins)
  2. Restricted Mode is OFF
  3. Check Developer Console (Ctrl+Shift+I) for errors

**Settings changes not saving**
- **Cause**: Vault sync conflict or permissions issue
- **Solution**:
  1. Disable sync temporarily
  2. Change setting and wait 5 seconds
  3. Reload Obsidian
  4. Re-enable sync

**Features accessible via Command Palette but not ribbon menu**
- **Note**: This is expected - ribbon menu has most common features
- **Solution**: Use Ctrl+P to access all 50+ commands

### Getting Help

If you encounter issues not covered here:

1. **Check Documentation**: Review EXPORT-TESTING-GUIDE.md for detailed export testing
2. **Enable Debug Mode**: Settings → ManuScript Pro → Enable "Verbose Logging"
3. **Check Console**: Open Developer Console (Ctrl+Shift+I) for error messages
4. **GitHub Issues**: https://github.com/Skquark/obsidian-manuscript-pro/issues
   - Search existing issues first
   - Include: Obsidian version, OS, error messages, steps to reproduce

---

## Credits

The syntax concealment feature was inspired by [Dynamic Text Concealer](https://github.com/mattcoleanderson/obsidian-dynamic-text-concealer) by Matt Cole Anderson.

---

**ManuScript Pro** - *Write better. Publish faster.*

Transform your academic writing workflow today.
- Authoring Tools (LaTeX & Pandoc)
  - Insert LaTeX Command: Open a searchable palette of common commands (bold/emphasis/tt, sectioning, label/ref/eqref, math, includegraphics). Fill a simple form and insert at cursor or wrap the selection.
  - Wrap with Environment: Quickly surround text with equation/align/itemize/enumerate/figure blocks.
  - Edit at Cursor: Place the caret on a LaTeX command or environment and open an editor pre-filled with current values.
  - Edit Pandoc Attributes: Add or edit trailing `{#id .class key=val}` on the current line via a structured editor.
- Backslash Completions: Start typing `\inc` to see `\includegraphics[…]` with signature; pick to get guided insertion.
- Expanded coverage: subfigure, minted/lstlisting, theorem/lemma/proof, autoref, textcite/parencite, product/limit with limits, caption/centering/captionof.
- Table Wizard: Build Markdown or LaTeX tables with alignment, caption/label. Paste CSV/TSV to auto-fill headers and rows. Options for LaTeX rules (booktabs or \hline), vertical bars, and including \centering. Live preview updates as you tweak options and a one-click Copy Preview is available.
  - Frontmatter Editor: Structured modal to edit title, authors, date, abstract, keywords, bibliography, CSL, and header-includes with safe round‑trip updates.
