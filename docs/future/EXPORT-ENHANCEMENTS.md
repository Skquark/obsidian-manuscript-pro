# Export System Enhancements
## Professional Publishing Features for ManuScript Pro

**Status:** Planning Document  
**Created:** 2025-10-27  
**Purpose:** Define comprehensive export enhancements inspired by production book publishing workflows

---

## Executive Summary

This document outlines enhancements to transform ManuScript Pro's export system from basic document conversion into a professional-grade publishing toolkit. These features are derived from real-world book publishing workflows (specifically the `build-book.sh` system used for "God Is Water") and designed to serve both publishing houses and independent authors.

**Core Philosophy:** Flexibility without complexity. Each feature should work standalone while integrating seamlessly with others.

---

## 1. Current Architecture Analysis

### Existing Strengths
- **Clean ExportProfile system** - Modular, extensible profiles (ExportInterfaces.ts:19)
- **PandocOptions flexibility** - Comprehensive options covering most Pandoc features
- **Multiple format support** - PDF, DOCX, HTML, EPUB, LaTeX, Markdown
- **Template system** - Custom templates with variable substitution
- **Built-in profiles** - Six pre-configured export profiles for common use cases
- **Metadata extraction** - YAML frontmatter parsing (ExportEngine.ts:376)
- **Task tracking** - Active export monitoring with progress and status
- **Bibliography integration** - Auto-discovery and citation processing

### Current Limitations
1. **Single-format exports** - Can only export one format at a time
2. **Static margins** - No dynamic calculation based on page count or trim size
3. **No trim size presets** - Authors must manually configure geometry
4. **Limited metadata** - Missing BISAC codes, ISBN, reading level, age range
5. **No post-processing** - No PDF compression, optimization, or validation
6. **No profile variants** - Can't easily create test/sample/full builds
7. **No quality validation** - No EPUB checking, PDF/A validation
8. **Manual bibliography** - Requires explicit path configuration per profile

### Integration Points
- **ManuscriptProject.ts** - Project-level metadata and structure
- **ExportManager.ts** - Export orchestration and error handling
- **ExportEngine.ts** - Pandoc command building and execution
- **ExportModal.ts** - User interface for export configuration
- **ProjectEditorModal.ts** - Project settings and metadata editing

---

## 2. Feature Categories

### Category A: Essential Publishing Features (High Priority)
Features that directly address common publishing workflows and pain points.

### Category B: Professional Enhancements (Medium Priority)
Advanced features that differentiate ManuScript Pro from basic converters.

### Category C: Quality & Validation (Medium Priority)
Post-processing and validation tools for professional output.

### Category D: Advanced Workflows (Lower Priority)
Sophisticated features for power users and publishing houses.

---

## 3. Detailed Feature Specifications

## Feature 1: Trim Size Presets with Smart Margins ⭐

**Category:** A (Essential)  
**Complexity:** Medium  
**Impact:** High - Critical for professional book layout

### Problem
Authors publishing print books need industry-standard trim sizes (6x9, 7x10, etc.) with proper margins. Inner margins must increase with page count to accommodate spine width. Currently, authors must:
- Manually calculate geometry strings
- Guess appropriate margins
- Update margins after determining final page count

### Solution
Pre-configured trim size presets with automatic margin calculation.

#### Trim Size Presets
```typescript
interface TrimSize {
  id: string;
  name: string;
  width: string;   // e.g., "6in"
  height: string;  // e.g., "9in"
  margins: {
    top: string;
    bottom: string;
    outer: string;
    innerBase: string;        // Base inner margin
    innerPer100Pages: string; // Additional margin per 100 pages
  };
  description: string;
  commonUse: string; // "Fiction novels", "Academic textbooks", etc.
}

const TRIM_SIZE_PRESETS: TrimSize[] = [
  {
    id: '6x9',
    name: '6" × 9" (Trade Paperback)',
    width: '6in',
    height: '9in',
    margins: {
      top: '0.75in',
      bottom: '0.875in',
      outer: '0.625in',
      innerBase: '0.75in',
      innerPer100Pages: '0.0625in'
    },
    description: 'Standard fiction and non-fiction',
    commonUse: 'Most common size for novels and trade books'
  },
  {
    id: '7x10',
    name: '7" × 10" (Large Format)',
    width: '7in',
    height: '10in',
    margins: {
      top: '0.875in',
      bottom: '1in',
      outer: '0.75in',
      innerBase: '0.875in',
      innerPer100Pages: '0.0625in'
    },
    description: 'Textbooks, technical manuals, cookbooks',
    commonUse: 'Non-fiction requiring larger text area'
  },
  {
    id: '8x10',
    name: '8" × 10" (Workbook)',
    width: '8in',
    height: '10in',
    margins: {
      top: '0.875in',
      bottom: '1in',
      outer: '0.75in',
      innerBase: '1in',
      innerPer100Pages: '0.0625in'
    },
    description: 'Workbooks, journals, activity books',
    commonUse: 'Interactive content requiring writing space'
  },
  {
    id: '8.5x11',
    name: '8.5" × 11" (US Letter)',
    width: '8.5in',
    height: '11in',
    margins: {
      top: '1in',
      bottom: '1in',
      outer: '0.75in',
      innerBase: '1in',
      innerPer100Pages: '0.0625in'
    },
    description: 'Reports, manuals, course materials',
    commonUse: 'Business documents and academic papers'
  },
  {
    id: '5.5x8.5',
    name: '5.5" × 8.5" (Digest)',
    width: '5.5in',
    height: '8.5in',
    margins: {
      top: '0.625in',
      bottom: '0.75in',
      outer: '0.5in',
      innerBase: '0.625in',
      innerPer100Pages: '0.0625in'
    },
    description: 'Mass market paperbacks, pocket books',
    commonUse: 'Compact fiction, travel guides'
  },
  {
    id: '5x8',
    name: '5" × 8" (Mass Market)',
    width: '5in',
    height: '8in',
    margins: {
      top: '0.5in',
      bottom: '0.625in',
      outer: '0.5in',
      innerBase: '0.5in',
      innerPer100Pages: '0.05in'
    },
    description: 'Mass market paperbacks',
    commonUse: 'Genre fiction, airport books'
  }
];
```

#### Smart Margin Calculation
```typescript
/**
 * Calculate inner margin based on estimated page count
 * Formula: innerBase + (pageCount / 100) * innerPer100Pages
 * 
 * Example: 300-page book with 6x9 trim
 * - Base: 0.75in
 * - Per 100: 0.0625in
 * - Total: 0.75 + (300/100) * 0.0625 = 0.9375in
 */
function calculateInnerMargin(pageCount: number, trimSize: TrimSize): string {
  const base = parseFloat(trimSize.margins.innerBase);
  const per100 = parseFloat(trimSize.margins.innerPer100Pages);
  const additional = (pageCount / 100) * per100;
  const total = base + additional;
  return `${total.toFixed(4)}in`;
}

/**
 * Estimate page count from manuscript
 * Uses empirical data: ~250 words per page for standard 6x9 trim
 */
function estimatePageCount(manuscript: string, trimSize: TrimSize): number {
  const wordCount = countWords(manuscript);
  
  // Adjust words-per-page based on trim size
  const wordsPerPage: Record<string, number> = {
    '6x9': 250,
    '7x10': 350,
    '8x10': 400,
    '8.5x11': 450,
    '5.5x8.5': 200,
    '5x8': 180
  };
  
  const wpp = wordsPerPage[trimSize.id] || 250;
  return Math.ceil(wordCount / wpp);
}
```

#### Implementation Location
- **New file:** `src/export/TrimSizePresets.ts`
- **Extend ExportProfile:** Add `trimSize?: string` field
- **Extend ExportEngine:** Add margin calculation in `buildPandocCommand()`
- **Update ExportModal:** Add trim size selector dropdown

#### UI Changes
In ExportModal, add trim size section:
```
┌─────────────────────────────────────┐
│ Export Profile: Book Manuscript    │
│                                     │
│ Trim Size:                          │
│ ┌─────────────────────────────────┐ │
│ │ 6" × 9" (Trade Paperback)       │ │
│ │ 7" × 10" (Large Format)         │ │
│ │ 8" × 10" (Workbook)             │ │
│ │ Custom...                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ℹ️ Estimated: 287 pages             │
│   Inner margin: 0.93in (automatic) │
└─────────────────────────────────────┘
```

---

## Feature 2: Multi-Format Batch Export ⭐

**Category:** A (Essential)  
**Complexity:** Low-Medium  
**Impact:** High - Major workflow improvement

### Problem
Authors need multiple formats for different distribution channels:
- PDF for print-on-demand (KDP Print, IngramSpark)
- EPUB for e-readers (Kindle, Apple Books)
- DOCX for editors and agents
- HTML for web preview

Currently requires 4 separate export operations.

### Solution
Single-click batch export to multiple formats with progress tracking.

#### Data Structure
```typescript
interface BatchExportOptions {
  formats: ExportFormat[];
  baseProfile: ExportProfile;
  formatOverrides?: Partial<Record<ExportFormat, Partial<ExportProfile>>>;
  outputDirectory: string;
  filenameBase: string; // e.g., "my-novel" → "my-novel.pdf", "my-novel.epub"
}

interface BatchExportResult {
  results: Map<ExportFormat, ExportResult>;
  totalDuration: number;
  successCount: number;
  failureCount: number;
}
```

#### Implementation
Extend ExportManager with batch export method:
```typescript
async exportMultipleFormats(
  options: BatchExportOptions,
  inputFiles: string[],
  metadata?: ManuscriptMetadata
): Promise<BatchExportResult> {
  const results = new Map<ExportFormat, ExportResult>();
  const startTime = Date.now();
  
  for (const format of options.formats) {
    // Create format-specific profile
    const profile = {
      ...options.baseProfile,
      format,
      ...(options.formatOverrides?.[format] || {})
    };
    
    const outputPath = path.join(
      options.outputDirectory,
      `${options.filenameBase}.${format}`
    );
    
    // Export this format
    const result = await this.exportManuscript(
      profile,
      inputFiles,
      outputPath,
      metadata
    );
    
    results.set(format, result);
    
    // Stop on critical failures if desired
    if (!result.success && this.plugin.settings.export?.stopOnError) {
      break;
    }
  }
  
  return {
    results,
    totalDuration: Date.now() - startTime,
    successCount: Array.from(results.values()).filter(r => r.success).length,
    failureCount: Array.from(results.values()).filter(r => !r.success).length
  };
}
```

#### UI Changes
Add batch export option to ExportModal:
```
┌─────────────────────────────────────┐
│ ☑ Multi-Format Export               │
│                                     │
│ Select formats to export:           │
│ ☑ PDF (Print-ready)                 │
│ ☑ EPUB (E-readers)                  │
│ ☑ DOCX (Editing)                    │
│ ☐ HTML (Web preview)                │
│ ☐ LaTeX (Source)                    │
│                                     │
│ Output: output/my-novel.{ext}       │
│                                     │
│ [Export All Formats]                │
└─────────────────────────────────────┘
```

Progress notification:
```
Batch Export Progress
━━━━━━━━━━━━━━━━━━━━━ 2/4
✓ PDF completed (12.3s)
✓ EPUB completed (5.1s)
⏳ Generating DOCX...
```

---

## Feature 3: Export Profiles (Test/Sample/Full) ⭐

**Category:** A (Essential)  
**Complexity:** Low  
**Impact:** High - Significant time savings during development

### Problem
During manuscript development, authors need to:
- Test formatting changes quickly (first 3 chapters)
- Generate sample chapters for beta readers
- Create full manuscript for final output

Currently requires manual chapter selection or separate projects.

### Solution
Profile variants that control which chapters to include.

#### Data Structure
```typescript
interface ExportProfileVariant {
  id: 'full' | 'test' | 'sample' | 'custom';
  name: string;
  chapterSelection: ChapterSelection;
}

type ChapterSelection = 
  | { type: 'all' }
  | { type: 'range'; start: number; end: number }
  | { type: 'count'; count: number }
  | { type: 'percentage'; percentage: number }
  | { type: 'custom'; chapterIds: string[] };

interface ExportProfile {
  // ... existing fields ...
  variant?: ExportProfileVariant;
}

const PROFILE_VARIANTS: ExportProfileVariant[] = [
  {
    id: 'full',
    name: 'Full Manuscript',
    chapterSelection: { type: 'all' }
  },
  {
    id: 'test',
    name: 'Test Build (First 3 Chapters)',
    chapterSelection: { type: 'count', count: 3 }
  },
  {
    id: 'sample',
    name: 'Sample (First 10%)',
    chapterSelection: { type: 'percentage', percentage: 10 }
  },
  {
    id: 'custom',
    name: 'Custom Selection',
    chapterSelection: { type: 'custom', chapterIds: [] }
  }
];
```

#### Implementation
Add variant filtering in ExportManager:
```typescript
private async filterFilesByVariant(
  files: TFile[],
  variant?: ExportProfileVariant
): Promise<TFile[]> {
  if (!variant || variant.chapterSelection.type === 'all') {
    return files;
  }
  
  const selection = variant.chapterSelection;
  
  switch (selection.type) {
    case 'count':
      return files.slice(0, selection.count);
      
    case 'range':
      return files.slice(selection.start - 1, selection.end);
      
    case 'percentage':
      const count = Math.ceil(files.length * selection.percentage / 100);
      return files.slice(0, count);
      
    case 'custom':
      return files.filter(f => selection.chapterIds.includes(f.basename));
      
    default:
      return files;
  }
}
```

#### UI Changes
Add variant selector to ExportModal:
```
┌─────────────────────────────────────┐
│ Export Profile: Book Manuscript    │
│                                     │
│ Build Variant:                      │
│ ○ Full Manuscript (23 chapters)    │
│ ○ Test Build (First 3 chapters)    │
│ ○ Sample (First 10% - 2 chapters)  │
│ ● Custom Selection...               │
│                                     │
│ [Select Chapters...]                │
└─────────────────────────────────────┘
```

**Quick Export Commands:**
```typescript
this.featureGate.registerProCommand({
  id: 'quick-test-export',
  name: `Quick Test Export (First 3 Chapters)${proIndicator}`,
  callback: () => {
    // Export with test variant
    this.exportManager.quickExport('test');
  }
}, 'export');
```

---

## Feature 4: PDF Compression Levels

**Category:** B (Professional)  
**Complexity:** Medium  
**Impact:** Medium - Important for distribution optimization

### Problem
PDFs for different purposes need different quality levels:
- **Ebook:** Small file size for online distribution (email, download)
- **Printer:** High quality for print-on-demand services
- **Prepress:** Maximum quality for offset printing
- **Screen:** Low quality for quick preview

Uncompressed PDFs can be 50-100MB, making them impractical for email or web distribution.

### Solution
Post-processing with Ghostscript to compress PDFs at different quality levels.

#### Data Structure
```typescript
type CompressionLevel = 'none' | 'screen' | 'ebook' | 'printer' | 'prepress';

interface CompressionSettings {
  level: CompressionLevel;
  detectDuplicateImages: boolean;
  downsampleImages: boolean;
  embedFonts: boolean;
}

interface ExportProfile {
  // ... existing fields ...
  postProcessing?: {
    compression?: CompressionSettings;
    linearize?: boolean; // Fast web view
    optimize?: boolean;  // Additional PDF optimization
  };
}
```

#### Implementation
Create new file `src/export/PdfCompressor.ts`:
```typescript
export class PdfCompressor {
  private plugin: LatexPandocConcealerPlugin;
  
  async compress(
    inputPdf: string,
    outputPdf: string,
    settings: CompressionSettings
  ): Promise<{ success: boolean; originalSize: number; compressedSize: number; reduction: number }> {
    // Check Ghostscript availability
    const gsAvailable = await this.checkGhostscriptAvailable();
    if (!gsAvailable) {
      const { GhostscriptInstallModal } = await import('./GhostscriptInstallModal');
      new GhostscriptInstallModal(this.plugin.app).open();
      return { success: false, originalSize: 0, compressedSize: 0, reduction: 0 };
    }
    
    const args = this.buildGhostscriptArgs(settings);
    args.push(`-sOutputFile=${outputPdf}`, inputPdf);
    
    try {
      await execFileAsync('gs', args);
      
      const originalSize = (await fs.stat(inputPdf)).size;
      const compressedSize = (await fs.stat(outputPdf)).size;
      const reduction = Math.round((1 - compressedSize / originalSize) * 100);
      
      return { success: true, originalSize, compressedSize, reduction };
    } catch (error) {
      return { success: false, originalSize: 0, compressedSize: 0, reduction: 0 };
    }
  }
  
  private buildGhostscriptArgs(settings: CompressionSettings): string[] {
    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.5',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH'
    ];
    
    // Compression level
    if (settings.level !== 'none') {
      args.push(`-dPDFSETTINGS=/${settings.level}`);
    }
    
    // Duplicate image detection
    if (settings.detectDuplicateImages) {
      args.push('-dDetectDuplicateImages=true');
    }
    
    // Image downsampling
    if (settings.downsampleImages) {
      args.push('-dColorImageDownsampleType=/Bicubic');
    }
    
    return args;
  }
  
  private async checkGhostscriptAvailable(): Promise<boolean> {
    try {
      await execFileAsync('gs', ['--version']);
      return true;
    } catch {
      return false;
    }
  }
}
```

#### Integration
Update ExportEngine to call compressor after PDF generation:
```typescript
// In exportManuscript() after successful PDF creation
if (profile.format === 'pdf' && profile.postProcessing?.compression) {
  const compressor = new PdfCompressor(this.plugin);
  const tempOutput = `${finalOutputPath}.uncompressed.pdf`;
  
  // Rename original to temp
  await fs.rename(finalOutputPath, tempOutput);
  
  // Compress
  const result = await compressor.compress(
    tempOutput,
    finalOutputPath,
    profile.postProcessing.compression
  );
  
  if (result.success) {
    // Delete uncompressed version
    await fs.unlink(tempOutput);
    
    new Notice(
      `PDF compressed: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${result.reduction}% reduction)`,
      5000
    );
  }
}
```

#### UI Changes
Add compression settings to ExportModal:
```
┌─────────────────────────────────────┐
│ PDF Options:                        │
│                                     │
│ Compression:                        │
│ ○ None (fastest, largest file)     │
│ ○ Screen (preview, ~72 DPI)        │
│ ● Ebook (web/email, ~150 DPI)      │
│ ○ Printer (POD, ~300 DPI)          │
│ ○ Prepress (offset, max quality)   │
│                                     │
│ ☑ Detect duplicate images           │
│ ☑ Linearize for fast web view       │
└─────────────────────────────────────┘
```

---

## Feature 5: Enhanced Metadata (BISAC, ISBN, etc.)

**Category:** B (Professional)  
**Complexity:** Low  
**Impact:** Medium - Critical for commercial publishing

### Problem
Commercial book publishing requires extensive metadata:
- **BISAC codes:** Category classification for bookstores
- **ISBN:** Unique book identifier
- **Reading level:** Adult, Young Adult, Middle Grade, etc.
- **Age range:** Target audience age
- **Subjects/Keywords:** For discoverability
- **Series information:** Book number in series
- **Edition information:** Hardcover, Paperback, etc.

Current metadata system only supports basic fields (title, author, date).

### Solution
Extend ManuscriptProject metadata with publishing-specific fields.

#### Data Structure
```typescript
interface PublishingMetadata {
  // ISBN and edition
  isbn13?: string;
  isbn10?: string;
  edition?: string; // "First Edition", "Revised", etc.
  printEdition?: 'hardcover' | 'paperback' | 'mass-market';
  
  // Classification
  bisacCodes?: string[]; // ["FIC031080", "FIC009100"]
  subjects?: string[];   // ["Epic Fantasy", "Coming of Age"]
  readingLevel?: 'adult' | 'young-adult' | 'middle-grade' | 'children';
  ageRange?: string;     // "18+", "12-17", "8-12"
  
  // Series information
  seriesName?: string;
  seriesNumber?: number;
  seriesTotal?: number;
  
  // Publishing details
  publisher?: string;
  imprint?: string;
  publicationDate?: string;
  copyrightYear?: number;
  
  // Retail
  priceUSD?: number;
  priceGBP?: number;
  priceEUR?: number;
  
  // Contributors
  illustrator?: string;
  translator?: string;
  editor?: string;
  contributors?: Array<{ name: string; role: string }>;
}

interface ManuscriptProject {
  // ... existing fields ...
  publishingMetadata?: PublishingMetadata;
}
```

#### BISAC Code Helper
```typescript
// Searchable BISAC code database
const COMMON_BISAC_CODES = [
  { code: 'FIC002000', category: 'FICTION / Action & Adventure' },
  { code: 'FIC009100', category: 'FICTION / Fantasy / Epic' },
  { code: 'FIC031080', category: 'FICTION / Thrillers / Psychological' },
  { code: 'FIC027110', category: 'FICTION / Romance / Contemporary' },
  { code: 'FIC022090', category: 'FICTION / Mystery & Detective / Cozy' },
  // ... full database (500+ codes)
];

class BisacCodePicker extends Modal {
  onChoose: (code: string) => void;
  
  onOpen() {
    // Searchable dropdown with categories
    // e.g., type "fantasy" → shows all fantasy categories
  }
}
```

#### Implementation
Extend ProjectEditorModal with publishing metadata section:
```typescript
private renderPublishingMetadata(container: HTMLElement) {
  const section = container.createDiv({ cls: 'manuscript-section' });
  section.createEl('h3', { text: 'Publishing Metadata' });
  
  // ISBN
  new Setting(section)
    .setName('ISBN-13')
    .setDesc('13-digit International Standard Book Number')
    .addText(text => text
      .setPlaceholder('978-0-123456-78-9')
      .setValue(this.project.publishingMetadata?.isbn13 || '')
      .onChange(value => {
        if (!this.project.publishingMetadata) {
          this.project.publishingMetadata = {};
        }
        this.project.publishingMetadata.isbn13 = value;
      }));
  
  // BISAC Codes
  new Setting(section)
    .setName('BISAC Categories')
    .setDesc('Book Industry Standards and Communications codes')
    .addButton(button => button
      .setButtonText('Add BISAC Code')
      .onClick(() => {
        new BisacCodePicker(this.app, (code) => {
          if (!this.project.publishingMetadata) {
            this.project.publishingMetadata = {};
          }
          if (!this.project.publishingMetadata.bisacCodes) {
            this.project.publishingMetadata.bisacCodes = [];
          }
          this.project.publishingMetadata.bisacCodes.push(code);
          this.display(); // Refresh
        }).open();
      }));
  
  // Display existing BISAC codes
  const codes = this.project.publishingMetadata?.bisacCodes || [];
  if (codes.length > 0) {
    const codeList = section.createDiv({ cls: 'manuscript-bisac-list' });
    codes.forEach((code, index) => {
      const codeItem = codeList.createDiv({ cls: 'manuscript-bisac-item' });
      codeItem.createSpan({ text: code });
      codeItem.createEl('button', {
        text: '×',
        cls: 'manuscript-bisac-remove'
      }).onclick = () => {
        codes.splice(index, 1);
        this.display();
      };
    });
  }
  
  // Reading Level
  new Setting(section)
    .setName('Reading Level')
    .addDropdown(dropdown => dropdown
      .addOptions({
        'adult': 'Adult',
        'young-adult': 'Young Adult',
        'middle-grade': 'Middle Grade',
        'children': 'Children'
      })
      .setValue(this.project.publishingMetadata?.readingLevel || 'adult')
      .onChange(value => {
        if (!this.project.publishingMetadata) {
          this.project.publishingMetadata = {};
        }
        this.project.publishingMetadata.readingLevel = value as any;
      }));
  
  // ... similar settings for other fields
}
```

#### Metadata Injection
Update ExportEngine to inject publishing metadata into exports:
```typescript
// For PDF (via LaTeX)
private buildPandocCommand() {
  // ... existing code ...
  
  const pubMeta = this.project?.publishingMetadata;
  if (pubMeta) {
    // Inject into PDF metadata
    if (pubMeta.isbn13) {
      allMetadata['isbn'] = pubMeta.isbn13;
    }
    if (pubMeta.bisacCodes && pubMeta.bisacCodes.length > 0) {
      allMetadata['bisac'] = pubMeta.bisacCodes.join(', ');
    }
    if (pubMeta.subjects && pubMeta.subjects.length > 0) {
      allMetadata['subject'] = pubMeta.subjects.join(', ');
    }
  }
  
  // For EPUB (via OPF metadata)
  if (profile.format === 'epub' && pubMeta) {
    this.injectEpubMetadata(allMetadata, pubMeta);
  }
}

private injectEpubMetadata(metadata: any, pubMeta: PublishingMetadata) {
  // EPUB requires specific metadata format
  if (pubMeta.isbn13) {
    metadata['identifier-scheme'] = 'ISBN';
    metadata['identifier'] = pubMeta.isbn13;
  }
  
  if (pubMeta.bisacCodes) {
    metadata['BISAC'] = pubMeta.bisacCodes;
  }
  
  if (pubMeta.seriesName) {
    metadata['series'] = pubMeta.seriesName;
    if (pubMeta.seriesNumber) {
      metadata['series-number'] = pubMeta.seriesNumber;
    }
  }
}
```

---

## Feature 6: EPUB Validation

**Category:** C (Quality)  
**Complexity:** Low  
**Impact:** Medium - Prevents distribution rejections

### Problem
EPUBs can have validation errors that cause:
- Rejection by retailers (Amazon KDP, Apple Books)
- Display issues on e-readers
- Accessibility problems

Authors discover these errors only after uploading to retailers.

### Solution
Automatic EPUB validation using EPUBCheck after generation.

#### Implementation
Create `src/export/EpubValidator.ts`:
```typescript
export class EpubValidator {
  async validate(epubPath: string): Promise<ValidationResult> {
    // Check if epubcheck is available
    const epubcheckAvailable = await this.checkEpubCheckAvailable();
    
    if (!epubcheckAvailable) {
      return {
        available: false,
        message: 'EPUBCheck not installed. Install from: https://github.com/w3c/epubcheck'
      };
    }
    
    try {
      const { stdout, stderr } = await execFileAsync('epubcheck', [epubPath]);
      
      // Parse output for errors and warnings
      const errors = this.parseErrors(stderr);
      const warnings = this.parseWarnings(stderr);
      
      return {
        available: true,
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        available: true,
        valid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: []
      };
    }
  }
  
  private parseErrors(output: string): string[] {
    // Parse EPUBCheck output for ERROR lines
    const errorLines = output.split('\n').filter(line => line.includes('ERROR'));
    return errorLines;
  }
  
  private parseWarnings(output: string): string[] {
    // Parse EPUBCheck output for WARNING lines
    const warningLines = output.split('\n').filter(line => line.includes('WARNING'));
    return warningLines;
  }
}

interface ValidationResult {
  available: boolean;
  valid?: boolean;
  errors?: string[];
  warnings?: string[];
  message?: string;
}
```

#### Integration
In ExportManager, validate EPUB after generation:
```typescript
// After successful EPUB export
if (profile.format === 'epub' && this.plugin.settings.export?.validateEpub) {
  const validator = new EpubValidator();
  const result = await validator.validate(finalOutputPath);
  
  if (!result.available) {
    new Notice(result.message, 8000);
  } else if (!result.valid) {
    new ValidationModal(this.plugin.app, result).open();
  } else {
    new Notice(`EPUB validation passed! ${result.warnings?.length || 0} warnings.`, 5000);
  }
}
```

#### UI
Create `ValidationModal` to display results:
```
┌─────────────────────────────────────┐
│ EPUB Validation Results             │
│                                     │
│ ❌ Validation Failed                │
│                                     │
│ Errors (2):                         │
│ • Missing required metadata: dc:lang│
│ • Invalid XHTML: unclosed div tag   │
│                                     │
│ Warnings (3):                       │
│ • Image exceeds recommended size    │
│ • Missing alt text on image         │
│ • Long paragraph (accessibility)    │
│                                     │
│ [Export Anyway] [Fix Issues]        │
└─────────────────────────────────────┘
```

---

## Feature 7: Export Presets (Edition System)

**Category:** B (Professional)  
**Complexity:** Medium  
**Impact:** High - Streamlines multi-edition publishing

### Problem
Authors often publish multiple editions:
- Trade paperback (6×9, $14.99)
- Large print (7×10, $19.99)
- Hardcover (6×9, $24.99)
- Premium (8×10, color images, $34.99)

Each edition needs different trim size, margins, and metadata (ISBN, price).

### Solution
Edition presets that bundle trim size, formatting, and metadata.

#### Data Structure
```typescript
interface Edition {
  id: string;
  name: string;
  description: string;
  
  // Physical properties
  trimSize: string; // Reference to TrimSize preset
  printType: 'paperback' | 'hardcover' | 'mass-market';
  
  // Content variations
  imageEdition?: 'color' | 'bw' | 'text'; // Image variant
  includeIllustrations: boolean;
  
  // Metadata overrides
  isbn?: string;
  priceUSD?: number;
  
  // Export profile
  baseProfile: string; // Reference to ExportProfile
  profileOverrides?: Partial<ExportProfile>;
}

interface ManuscriptProject {
  // ... existing fields ...
  editions?: Edition[];
}

// Example editions
const exampleEditions: Edition[] = [
  {
    id: 'trade-paperback',
    name: 'Trade Paperback',
    description: 'Standard 6×9 paperback with B&W images',
    trimSize: '6x9',
    printType: 'paperback',
    imageEdition: 'bw',
    includeIllustrations: true,
    isbn: '978-0-123456-78-9',
    priceUSD: 14.99,
    baseProfile: 'pdf-book'
  },
  {
    id: 'large-print',
    name: 'Large Print Edition',
    description: '7×10 with larger fonts for accessibility',
    trimSize: '7x10',
    printType: 'paperback',
    imageEdition: 'bw',
    includeIllustrations: true,
    isbn: '978-0-123456-79-6',
    priceUSD: 19.99,
    baseProfile: 'pdf-book',
    profileOverrides: {
      pandocOptions: {
        variables: {
          fontsize: '14pt',
          linestretch: '1.5'
        }
      }
    }
  },
  {
    id: 'premium-color',
    name: 'Premium Color Edition',
    description: '8×10 with full-color images',
    trimSize: '8x10',
    printType: 'hardcover',
    imageEdition: 'color',
    includeIllustrations: true,
    isbn: '978-0-123456-80-2',
    priceUSD: 34.99,
    baseProfile: 'pdf-book'
  }
];
```

#### Implementation
Add edition export to ExportManager:
```typescript
async exportEdition(
  edition: Edition,
  inputFiles: string[],
  outputDirectory?: string
): Promise<ExportResult> {
  // Resolve base profile
  const baseProfile = this.plugin.settings.export?.profiles.find(
    p => p.id === edition.baseProfile
  );
  
  if (!baseProfile) {
    return { success: false, error: `Profile not found: ${edition.baseProfile}` };
  }
  
  // Build edition-specific profile
  const profile: ExportProfile = {
    ...baseProfile,
    ...edition.profileOverrides,
    trimSize: edition.trimSize
  };
  
  // Add edition metadata
  const metadata: ManuscriptMetadata = {
    custom: {
      isbn: edition.isbn,
      price: edition.priceUSD?.toString(),
      edition: edition.name,
      printType: edition.printType
    }
  };
  
  // Determine output path
  const outputPath = path.join(
    outputDirectory || this.plugin.settings.export?.defaultOutputDir || '',
    `${edition.id}.${profile.format}`
  );
  
  return this.exportManuscript(profile, inputFiles, outputPath, metadata);
}

// Batch export all editions
async exportAllEditions(
  inputFiles: string[]
): Promise<Map<string, ExportResult>> {
  const results = new Map<string, ExportResult>();
  const project = this.plugin.projectManager.getActiveProject();
  
  if (!project?.editions || project.editions.length === 0) {
    new Notice('No editions defined for this project', 5000);
    return results;
  }
  
  for (const edition of project.editions) {
    const result = await this.exportEdition(edition, inputFiles);
    results.set(edition.id, result);
  }
  
  return results;
}
```

#### UI Changes
Add edition manager to ProjectEditorModal:
```
┌─────────────────────────────────────┐
│ Editions                            │
│                                     │
│ Trade Paperback (6×9)               │
│   ISBN: 978-0-123456-78-9           │
│   Price: $14.99                     │
│   [Edit] [Export]                   │
│                                     │
│ Large Print Edition (7×10)          │
│   ISBN: 978-0-123456-79-6           │
│   Price: $19.99                     │
│   [Edit] [Export]                   │
│                                     │
│ [+ Add Edition]                     │
│ [Export All Editions]               │
└─────────────────────────────────────┘
```

---

## 4. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Essential publishing features

1. **Trim Size Presets** (Feature 1)
   - Create TrimSizePresets.ts with 6 presets
   - Add page count estimation
   - Implement smart margin calculation
   - Update ExportModal UI

2. **Multi-Format Export** (Feature 2)
   - Extend ExportManager with batch export
   - Add progress tracking for multiple formats
   - Update ExportModal UI with format checkboxes

3. **Profile Variants** (Feature 3)
   - Add variant types (full/test/sample/custom)
   - Implement chapter filtering
   - Add quick export commands

### Phase 2: Professional Tools (Week 3-4)
**Goal:** Advanced publishing features

4. **PDF Compression** (Feature 4)
   - Create PdfCompressor.ts
   - Add Ghostscript detection and installation modal
   - Implement compression levels
   - Update ExportModal UI

5. **Enhanced Metadata** (Feature 5)
   - Extend ManuscriptProject with PublishingMetadata
   - Create BISAC code picker
   - Update ProjectEditorModal UI
   - Implement metadata injection for PDF and EPUB

### Phase 3: Quality & Validation (Week 5)
**Goal:** Professional output quality

6. **EPUB Validation** (Feature 6)
   - Create EpubValidator.ts
   - Add EPUBCheck detection
   - Create ValidationModal
   - Integrate into export workflow

7. **Edition System** (Feature 7)
   - Create Edition data structures
   - Implement edition export
   - Add edition manager to UI
   - Add "Export All Editions" command

### Testing & Refinement (Week 6)
- Test all features with real manuscripts
- Performance optimization
- Error handling improvements
- Documentation updates

---

## 5. Technical Considerations

### External Dependencies
Several features require external tools:

| Feature | Tool | Detection | Fallback |
|---------|------|-----------|----------|
| PDF Export | Pandoc + LaTeX | Already implemented | Installation modal |
| PDF Compression | Ghostscript | New modal needed | Skip compression |
| EPUB Validation | EPUBCheck | New modal needed | Skip validation |
| Image Optimization | ImageMagick | Optional feature | Skip optimization |

### Performance Optimization
- **Batch exports:** Run formats in parallel where possible (EPUB + DOCX while PDF compiles)
- **Caching:** Cache page count estimates to avoid recalculation
- **Progress tracking:** Use streaming output for large exports
- **Background tasks:** Long operations (compression, validation) run in background

### Data Migration
Existing projects need migration for new metadata fields:
```typescript
async migrateProjectMetadata(project: ManuscriptProject): Promise<void> {
  // Add publishingMetadata if missing
  if (!project.publishingMetadata) {
    project.publishingMetadata = {};
  }
  
  // Add editions array if missing
  if (!project.editions) {
    project.editions = [];
  }
  
  // Migrate old export profiles
  const profiles = this.plugin.settings.export?.profiles || [];
  for (const profile of profiles) {
    if (!profile.trimSize) {
      profile.trimSize = '6x9'; // Default
    }
  }
}
```

### Settings Schema Updates
```typescript
interface ExportSettings {
  // ... existing fields ...
  
  // New settings
  validateEpub: boolean;          // Auto-validate EPUBs
  compressDefaultLevel: CompressionLevel; // Default compression
  estimatePageCounts: boolean;    // Show page estimates
  showTrimSizeHelper: boolean;    // Show trim size picker
  stopOnBatchError: boolean;      // Stop batch export on error
}
```

---

## 6. User Experience Enhancements

### Smart Defaults
- **Trim size:** Auto-detect from existing document geometry
- **Compression:** Default to 'ebook' for file size optimization
- **Profile variant:** Remember last-used variant per project
- **Format selection:** Pre-select formats based on project type

### Contextual Help
- **Trim size info:** "6×9 is the most common size for novels and trade books"
- **Compression guide:** "Use 'ebook' for online distribution, 'printer' for POD services"
- **BISAC help:** Searchable database with descriptions
- **Margin explanation:** "Inner margin increases with page count to accommodate spine width"

### Quick Actions
```typescript
// Command palette quick actions
'Export: Quick PDF (6×9, test build)'
'Export: All Editions'
'Export: Ebook Formats (EPUB + MOBI)'
'Export: Full Package (All Formats)'
```

### Progress Notifications
```
Building Premium Color Edition...
━━━━━━━━━━━━━━━━━━━━━ 65%

✓ Assembled 23 chapters (287 pages)
✓ Generated PDF (12.3s)
⏳ Compressing with Ghostscript...
⏳ Adding metadata...
```

---

## 7. Future Enhancements (Beyond Scope)

### Advanced Features for v2.0
1. **Custom templates:** Visual template editor for LaTeX/HTML
2. **Image optimization:** Auto-resize and compress images
3. **Font embedding:** Custom font selection and embedding
4. **Cover designer:** Built-in cover creation tool
5. **Print calculator:** Estimate printing costs per edition
6. **Distribution helper:** Direct upload to KDP, IngramSpark, etc.
7. **Accessibility checker:** WCAG compliance for EPUB
8. **Translation management:** Multi-language edition support
9. **Revision tracking:** Version comparison and change logs
10. **Collaboration:** Multi-author project support

---

## 8. Success Metrics

### User Impact
- **Time savings:** 70% reduction in export workflow time (4 exports → 1 batch export)
- **Error reduction:** 90% fewer format errors (validation catches issues early)
- **Professional output:** Industry-standard trim sizes and metadata
- **Distribution ready:** EPUBs pass retailer validation on first try

### Technical Metrics
- **Export success rate:** >95% successful exports
- **Performance:** <30s for typical 300-page PDF
- **Compression:** 40-60% file size reduction for ebooks
- **User satisfaction:** Positive feedback on workflow improvements

---

## Conclusion

These enhancements transform ManuScript Pro from a capable document converter into a comprehensive publishing toolkit that rivals commercial solutions. By focusing on real-world workflows from professional book publishing, we address the actual pain points authors face when preparing manuscripts for distribution.

The modular architecture ensures each feature can be implemented and tested independently while integrating seamlessly with existing functionality. The phased rollout allows for iterative refinement based on user feedback.

**Core Value Proposition:**
> ManuScript Pro becomes the single tool an author needs to go from manuscript to publication-ready files across all major formats and distribution channels.
