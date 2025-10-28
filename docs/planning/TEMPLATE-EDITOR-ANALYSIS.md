# Template Editor Analysis - Current vs. Comprehensive YAML Support

## Executive Summary

**Current State**: ManuScript Pro has basic Pandoc template support via `templateVariables: Record<string, string>` which passes variables to Pandoc using `-V key=value` flags.

**Gap Analysis**: The god-is-water-book YAML templates demonstrate comprehensive Pandoc YAML frontmatter with ~50+ configuration options covering typography, layout, headers/footers, chapter styling, and advanced LaTeX customization. Most of these are **not exposed in the UI** and require manual YAML editing.

**Recommendation**: Create a comprehensive Template Editor with categorized sections for all major Pandoc/LaTeX variables, with intelligent defaults and real-time preview capabilities.

---

## Current Implementation

### What Exists Today

**1. ExportProfile Interface**
```typescript
interface ExportProfile {
  template?: string;                          // Template file path
  templateVariables?: Record<string, string>; // Generic key-value variables
  pandocOptions: PandocOptions;               // Basic Pandoc flags
  trimSize?: string;                          // Trim size presets (Phase 1)
}
```

**2. PandocOptions Interface**
```typescript
interface PandocOptions {
  // General
  standalone?: boolean;
  selfContained?: boolean;
  toc?: boolean;
  tocDepth?: number;
  numberSections?: boolean;
  
  // PDF
  pdfEngine?: PdfEngine;
  
  // Bibliography
  bibliography?: string[];
  csl?: string;
  citeproc?: boolean;
  
  // Filters
  filters?: string[];
  luaFilters?: string[];
  
  // Generic
  variables?: Record<string, string>;
  metadata?: Record<string, any>;
  extraArgs?: string[];
}
```

**3. How Variables Are Applied**
```typescript
// ExportEngine.ts:419-423
if (profile.templateVariables) {
  for (const [key, value] of Object.entries(profile.templateVariables)) {
    args.push('-V', `${key}=${value}`);
  }
}
```

### Current Limitations

1. **No structured YAML editor** - Users must manually edit `templateVariables` as key-value pairs
2. **No UI for advanced options** - Typography, headers, footers, chapter styling hidden
3. **No presets** - No way to save/load common configurations
4. **No validation** - Invalid values pass through unchecked
5. **No documentation** - Users don't know what variables are available
6. **Manual LaTeX** - Complex `header-includes` must be hand-written

---

## Comprehensive YAML Analysis

### god-is-water-book/pandoc-modern-7x10.yaml

This template demonstrates professional book publishing configuration with ~50+ variables:

#### 1. Book Information (Metadata)
```yaml
title: "God Is Water"
subtitle: "The Seven Recognitions..."
author:
  - Julia Kamman
  - Alan Bedian
date: 2025
```
**Status in ManuScript Pro**: ✅ Supported via `metadata` but no dedicated UI

#### 2. Document Class & Geometry
```yaml
documentclass: book
classoption: openany
geometry:
  - paperwidth=7in
  - paperheight=10in
  - top=0.50in
  - bottom=0.50in
  - inner=0.625in
  - outer=0.50in
```
**Status**: ⚠️ Partially supported
- `documentclass` - via `variables` but no UI
- `classoption` - via `variables` but no UI  
- `geometry` - ✅ Handled by trimSize presets (Phase 1) but not fully customizable

#### 3. Typography Settings
```yaml
fontsize: 10.5pt
linestretch: 1.03
mainfont: "DejaVu Serif"
sansfont: "DejaVu Sans"
monofont: "DejaVu Sans Mono"
```
**Status**: ❌ Not supported in UI
- All must be manually added to `templateVariables`

#### 4. Paragraph Settings
```yaml
indent: true
# Manual parskip settings in header-includes:
#   \setlength{\parindent}{0.18in}
#   \setlength{\parskip}{0pt}
```
**Status**: ❌ Not supported
- No UI for indentation preferences
- No way to configure paragraph spacing

#### 5. Table of Contents
```yaml
toc: true
toc-depth: 1
toc-title: "Table of Contents"
```
**Status**: ✅ Supported via `PandocOptions`
- `toc` ✅
- `tocDepth` ✅  
- `toc-title` ⚠️ via variables but no UI

#### 6. Chapter/Section Numbering
```yaml
numbersections: false
secnumdepth: 0
```
**Status**: ⚠️ Partial
- `numbersections` ✅ via `numberSections` in PandocOptions
- `secnumdepth` ❌ Not exposed

#### 7. Bibliography
```yaml
bibliography: references.bib
csl: chicago-author-date.csl
link-citations: true
suppress-bibliography: true
```
**Status**: ⚠️ Partial
- `bibliography` ✅ Supported
- `csl` ✅ Supported with UI
- `link-citations` ❌ Not exposed
- `suppress-bibliography` ❌ Not exposed

#### 8. Headers & Footers (via header-includes)
```latex
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhead[LE]{\small\itshape God Is Water}
\fancyhead[RO]{\small\itshape \leftmark}
\fancyfoot[C]{\small\thepage}
\renewcommand{\headrulewidth}{0.2pt}
```
**Status**: ❌ Not supported
- Requires manual LaTeX in `header-includes`
- No visual editor for headers/footers
- No presets for common patterns

#### 9. Chapter Styling (via header-includes)
```latex
\titleformat{\chapter}[display]{...}
\titlespacing*{\chapter}{0pt}{0pt}{15pt}
\titleformat{\section}{...}
\titlespacing*{\section}{0pt}{12pt}{6pt}
```
**Status**: ❌ Not supported
- Requires advanced LaTeX knowledge
- No visual configuration

#### 10. Advanced Typography (via header-includes)
```latex
\usepackage{microtype}
\setlength{\emergencystretch}{3em}
\widowpenalty=10000
\clubpenalty=10000
\hyphenpenalty=500
\tolerance=2000
\raggedbottom
```
**Status**: ❌ Not supported
- Professional typesetting features hidden
- No presets for print quality

#### 11. Image Settings (via header-includes)
```latex
\usepackage{graphicx}
\setkeys{Gin}{width=0.9\textwidth,keepaspectratio}
```
**Status**: ❌ Not supported
- No control over default image sizing
- No aspect ratio settings

#### 12. PDF Metadata
```yaml
lang: en-US
keywords:
  - water consciousness
  - spiritual science
```
**Status**: ⚠️ Partial
- Can be set via `metadata` but no dedicated UI

---

## Gap Summary

### Missing UI Elements (High Priority)

| Category | Variables | Current Support | Impact |
|----------|-----------|-----------------|--------|
| **Typography** | fontsize, linestretch, fonts | ❌ None | High - Essential for professional look |
| **Paragraph** | parindent, parskip, indent | ❌ None | High - Affects readability |
| **Headers/Footers** | fancyhdr configuration | ❌ None | High - Professional appearance |
| **Chapter Styling** | titleformat, titlespacing | ❌ None | Medium - Custom chapter looks |
| **Document Class** | documentclass, classoption | ❌ Manual | Medium - Book vs. article |
| **Geometry** | Full margin control | ⚠️ Partial | Low - Trim presets cover most |
| **Advanced Typo** | microtype, penalties | ❌ None | Low - Expert users only |

### What Works Well

✅ **Trim Size Presets** (Phase 1) - Industry-standard sizes with auto margins  
✅ **CSL Citations** - Good UI for bibliography styles  
✅ **Basic Pandoc Options** - TOC, standalone, number sections  
✅ **Batch Export** (Phase 1) - Multiple formats in one go  
✅ **PDF Compression** (Phase 2) - Ghostscript integration  
✅ **EPUB Validation** (Phase 3) - EPUBCheck integration

---

## Proposed Solution: Enhanced Template Editor

### Design Philosophy

1. **Progressive Disclosure**: Basic settings visible by default, advanced settings in expandable sections
2. **Presets First**: Common configurations as one-click presets
3. **Visual Feedback**: Live preview when possible (or sample output images)
4. **Smart Defaults**: Intelligent defaults based on format and trim size
5. **Expert Mode**: Raw YAML editor for power users

### UI Structure

```
┌─────────────────────────────────────────────────────────┐
│ Template Editor: Professional PDF                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Quick Presets]                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Modern   │ │ Classic  │ │ Academic │ │ Minimal  │   │
│ │ Fiction  │ │ Non-Fict │ │ Thesis   │ │ Draft    │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│ ▼ Basic Settings                                         │
│   Document Type:    [Book ▼]  (Book/Article/Report)    │
│   Page Numbering:   [✓] Enabled                         │
│   Table of Contents:[✓] Include   Depth: [1 ▼]         │
│                                                          │
│ ▼ Typography                                             │
│   Body Font:        [DejaVu Serif ▼]                    │
│   Font Size:        [10.5pt ▼]  (9pt - 14pt)           │
│   Line Spacing:     [1.03 ▼]    (1.0 - 2.0)            │
│   Paragraph Indent: [0.18in]     [✓] First line only   │
│   Paragraph Space:  [0pt]                               │
│                                                          │
│ ▼ Headers & Footers                                      │
│   Style Preset:     [Book - Left/Right ▼]              │
│   ┌─────────────────────────────────────────────────┐   │
│   │ Left Page (Even):                                │   │
│   │   Header Left:  [Book Title]                     │   │
│   │   Header Center:[         ]                      │   │
│   │   Header Right: [         ]                      │   │
│   │   Footer Center:[Page #]                         │   │
│   │                                                   │   │
│   │ Right Page (Odd):                                │   │
│   │   Header Left:  [         ]                      │   │
│   │   Header Center:[         ]                      │   │
│   │   Header Right: [Chapter Name]                   │   │
│   │   Footer Center:[Page #]                         │   │
│   └─────────────────────────────────────────────────┘   │
│   Header Rule:      [Thin line ▼]  [0.2pt]             │
│                                                          │
│ ▼ Chapter Styling                                        │
│   Chapter Format:   [Centered Display ▼]               │
│   Chapter Size:     [LARGE ▼]                           │
│   Chapter Spacing:                                       │
│     Before: [0pt]   After: [15pt]                       │
│   New Page:         [✓] Start each chapter on new page │
│                                                          │
│ ▼ Advanced Typography (Expert)                           │
│   Widow/Orphan:     [10000] (prevent single lines)     │
│   Hyphenation:      [500]   (penalty for hyphens)      │
│   Tolerance:        [2000]  (line breaking tolerance)  │
│   Microtype:        [✓] Enable (better spacing)        │
│   Ragged Bottom:    [✓] Don't stretch vertical space   │
│                                                          │
│ ▼ Images & Figures                                       │
│   Default Width:    [90% ▼]  (of text width)           │
│   Keep Aspect:      [✓] Maintain aspect ratio          │
│   Caption Style:    [Small, bold label ▼]              │
│                                                          │
│ ▼ Bibliography                                           │
│   Citation Style:   [Chicago Author-Date ▼] [Browse]   │
│   Link Citations:   [✓] Hyperlink citations            │
│   Suppress Bib:     [ ] Hide bibliography section       │
│                                                          │
│ [Export as YAML]  [Load from YAML]  [Reset to Default] │
│                                                          │
│ [Save Preset...]  [Cancel]  [Apply & Export]            │
└─────────────────────────────────────────────────────────┘
```

### Preset Categories

**Fiction**
- Modern Fiction: Clean, readable, minimal headers
- Classic Fiction: Traditional serif, ornate chapter starts
- Thriller: Tight spacing, bold chapter numbers

**Non-Fiction**
- Professional: Headers with book/chapter titles
- Academic: Numbered sections, strict formatting
- Reference: Dense layout, minimal spacing

**Special**
- Draft: Large font, double-space, page numbers only
- Print-on-Demand: Optimized margins, microtype
- Large Print: 14pt font, 1.5x spacing

### Implementation Strategy

#### Phase 1: Data Structure
```typescript
interface TemplateConfiguration {
  // Basic
  documentClass: 'book' | 'article' | 'report';
  classOptions: string[];
  
  // Typography
  typography: {
    bodyFont: string;
    sansFont: string;
    monoFont: string;
    fontSize: string;
    lineSpacing: number;
    paragraphIndent: string;
    paragraphSpacing: string;
    firstLineIndent: boolean;
  };
  
  // Headers & Footers
  headersFooters: {
    preset: string;
    leftPage: PageHeader;
    rightPage: PageHeader;
    headerRule: { style: string; width: string };
    footerRule: { style: string; width: string };
  };
  
  // Chapters
  chapterStyling: {
    format: 'display' | 'inline' | 'centered';
    size: string;
    spacingBefore: string;
    spacingAfter: string;
    newPage: boolean;
    numberStyle: 'arabic' | 'roman' | 'none';
  };
  
  // Advanced
  advanced: {
    widowPenalty: number;
    clubPenalty: number;
    hyphenPenalty: number;
    tolerance: number;
    microtype: boolean;
    raggedBottom: boolean;
  };
  
  // Images
  images: {
    defaultWidth: string;
    keepAspectRatio: boolean;
    captionStyle: string;
  };
  
  // Raw overrides
  headerIncludes?: string;  // Expert mode LaTeX
  rawYAML?: string;         // Full YAML override
}

interface PageHeader {
  left: string;
  center: string;
  right: string;
}
```

#### Phase 2: Preset System
```typescript
interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: 'fiction' | 'non-fiction' | 'academic' | 'special';
  configuration: TemplateConfiguration;
  thumbnail?: string;  // Preview image
}

const BUILTIN_PRESETS: TemplatePreset[] = [
  {
    id: 'modern-fiction',
    name: 'Modern Fiction',
    description: 'Clean, readable layout for contemporary novels',
    category: 'fiction',
    configuration: { /* ... */ }
  },
  // ... more presets
];
```

#### Phase 3: YAML Generator
```typescript
class YAMLGenerator {
  generateFromConfig(config: TemplateConfiguration): string {
    // Convert structured config to Pandoc YAML
    const yaml: any = {
      documentclass: config.documentClass,
      fontsize: config.typography.fontSize,
      linestretch: config.typography.lineSpacing,
      mainfont: config.typography.bodyFont,
      // ... map all fields
    };
    
    // Generate header-includes for complex formatting
    yaml['header-includes'] = this.generateHeaderIncludes(config);
    
    return YAML.stringify(yaml);
  }
  
  private generateHeaderIncludes(config: TemplateConfiguration): string {
    const latex: string[] = [];
    
    // Headers/footers
    if (config.headersFooters.preset !== 'none') {
      latex.push(this.generateFancyHdr(config.headersFooters));
    }
    
    // Chapter styling
    latex.push(this.generateTitleFormat(config.chapterStyling));
    
    // Advanced typography
    if (config.advanced.microtype) {
      latex.push('\\usepackage{microtype}');
    }
    
    // ... more LaTeX generation
    
    return latex.join('\n');
  }
}
```

#### Phase 4: UI Components
```typescript
// TemplateEditorModal.ts
class TemplateEditorModal extends Modal {
  private config: TemplateConfiguration;
  private presets: TemplatePreset[];
  
  onOpen() {
    this.renderPresetSelector();
    this.renderBasicSettings();
    this.renderTypographySection();
    this.renderHeadersFootersSection();
    this.renderChapterStylingSection();
    this.renderAdvancedSection();
    this.renderExpertMode();
  }
  
  private renderHeadersFootersSection() {
    const container = this.contentEl.createDiv();
    
    // Preset dropdown
    new Setting(container)
      .setName('Style Preset')
      .addDropdown(dropdown => {
        dropdown.addOption('book-lr', 'Book - Left/Right');
        dropdown.addOption('book-center', 'Book - Centered');
        dropdown.addOption('academic', 'Academic');
        dropdown.addOption('custom', 'Custom');
      });
    
    // Visual header/footer editor
    this.renderPageHeaderEditor(container, 'left');
    this.renderPageHeaderEditor(container, 'right');
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)
**Goal**: Data structures and YAML generation  
**Effort**: 2-3 days  

- [ ] Create `TemplateConfiguration` interface
- [ ] Create `TemplatePreset` interface
- [ ] Build `YAMLGenerator` class
- [ ] Add template config to `ExportProfile`
- [ ] Integrate with `ExportEngine`

### Phase 2: Basic UI (Essential Controls)
**Goal**: Typography and basic layout settings  
**Effort**: 3-4 days  

- [ ] Create `TemplateEditorModal`
- [ ] Typography section (fonts, size, spacing)
- [ ] Paragraph settings (indent, spacing)
- [ ] Basic document options (class, TOC)
- [ ] Save/load configuration

### Phase 3: Advanced UI (Professional Features)
**Goal**: Headers, footers, chapter styling  
**Effort**: 4-5 days  

- [ ] Headers/footers visual editor
- [ ] Chapter styling controls
- [ ] Image defaults
- [ ] Advanced typography section
- [ ] Preview generation

### Phase 4: Preset System
**Goal**: One-click professional templates  
**Effort**: 2-3 days  

- [ ] Build 10-15 built-in presets
- [ ] Preset browser with thumbnails
- [ ] Preset import/export
- [ ] User preset management
- [ ] Preset sharing

### Phase 5: Expert Mode
**Goal**: Power user features  
**Effort**: 1-2 days  

- [ ] Raw YAML editor
- [ ] Raw LaTeX header-includes
- [ ] Validation and error checking
- [ ] YAML import from external files
- [ ] Documentation links

---

## Benefits

### For Authors
- **No LaTeX knowledge required** - Visual controls generate proper code
- **Professional output** - Industry-standard presets
- **Consistency** - Templates ensure uniform formatting
- **Experimentation** - Try different looks without breaking files

### For Publishers
- **Brand compliance** - Create templates matching house style
- **Efficiency** - Distribute templates to authors
- **Quality control** - Consistent formatting across titles
- **Flexibility** - Adapt templates for different series/imprints

### For Technical Users
- **Full control** - Expert mode for advanced customization
- **Learning tool** - See generated LaTeX from visual settings
- **Extensibility** - Build on existing presets
- **Portability** - Export YAML for use outside Obsidian

---

## Conclusion

The current `templateVariables: Record<string, string>` approach works but requires users to:
1. Know what Pandoc variables exist
2. Understand LaTeX for advanced formatting
3. Manually type key-value pairs
4. Debug YAML/LaTeX errors

A comprehensive Template Editor would:
1. Expose all 50+ common variables in organized UI
2. Generate correct LaTeX automatically
3. Provide visual controls for complex features
4. Include professional presets

**Recommendation**: Implement in phases, starting with most impactful features (typography, headers/footers, chapter styling) and building toward comprehensive editor with presets.

**Estimated Total Effort**: 12-17 development days for complete implementation.
