# Smart Citation Preview - Implementation Summary

## Overview
Contextual tooltips that display full bibliographic information when hovering over Pandoc citations, with automatic .bib file discovery, multiple citation style support, and quick copy actions.

## Features Implemented

### 1. BibTeX Parser (`src/citations/BibTeXParser.ts` - 270 lines)
A robust parser for BibTeX/BibLaTeX files:

#### Core Parsing Features
- **Entry extraction**: Parses @article, @book, @inproceedings, etc.
- **Field parsing**: Handles field = "value", field = {value}, field = value
- **String definitions**: Resolves @string abbreviations
- **Cross-references**: Resolves crossref fields from parent entries
- **LaTeX cleanup**: Removes LaTeX commands, special characters, and braces

#### Helper Methods
- `getAuthors()`: Extract author list from entry
- `getFirstAuthorLastName()`: Get first author's surname
- `getYear()`: Extract publication year
- `validate()`: Check for required fields by entry type

#### Field Cleaning
- Removes outer braces
- Strips LaTeX commands but keeps content
- Handles special characters (\\&, \\%, \\$, etc.)
- Processes accents
- Normalizes whitespace

### 2. Bibliography Manager (`src/citations/BibliographyManager.ts` - 280 lines)
Intelligent bibliography discovery and caching system:

#### Discovery Strategy
1. **YAML frontmatter**: Check `bibliography:` field
2. **User-configured paths**: From plugin settings
3. **Current folder**: Search for .bib files
4. **Common names**: Look for references.bib, bibliography.bib, library.bib

#### Features
- **Path resolution**: Handles absolute, relative, and vault-root paths
- **Caching**: 5-minute cache with invalidation support
- **Multi-file support**: Load and merge multiple .bib files
- **Search**: Find entries by text (key, title, author)
- **Statistics**: Track entries by type, files loaded, total count

### 3. Citation Formatters (`src/citations/CitationFormatter.ts` - 420 lines)
Three built-in citation styles with extensible architecture:

#### APA Style (7th edition)
- Author-date format: "Smith, J. (2020). Title..."
- Handles 1, 2, or 3+ authors with "et al."
- Italicizes journal/book titles
- Includes volume, issue, pages

#### Chicago Style (Author-Date)
- Full author names: "Smith, John, and Jane Doe. 2020..."
- Up to 3 authors listed, then "et al."
- Uses quotation marks for article titles
- Publisher location and name for books

#### MLA Style (9th edition)
- Last name first for first author only
- 1-2 authors listed, 3+ uses "et al."
- Quotation marks for articles, italics for books/journals
- Volume, number, year, pages format

#### Extensible Design
- `CitationStyle` interface for custom styles
- `CitationFormatter` manager class
- Active style switching
- Future: CSL file support

### 4. Hover Extension (`src/citations/citationHoverExtension.ts` - 220 lines)
CodeMirror 6 hover tooltip integration:

#### Citation Detection
- Detects Pandoc syntax: `[@key]`, `@key`, `[-@key]`
- Handles multi-citations: `[@a; @b; @c]`
- Extracts citation key at cursor position
- Works with locators: `[@smith2020, pp. 12-15]`

#### Tooltip Content

**For valid citations:**
- Entry type badge (color-coded by type)
- Citation key in monospace
- Validation status (✓ valid, ⚠ warning)
- Formatted citation in selected style
- DOI/URL links (if available)
- Expandable abstract section
- Copy Key and Copy Citation buttons
- Style indicator footer

**For undefined citations:**
- Error indicator (✗)
- "Citation not found" message
- Helpful hint about checking .bib file

#### Visual Design
- Max width 500px
- Themed colors matching Obsidian
- Hover delay: 300ms
- Positioned above citation
- Type-specific badge colors:
  - Article: Green (#4caf50)
  - Book: Blue (#2196f3)
  - Conference: Orange (#ff9800)
  - Thesis: Purple (#9c27b0)

### 5. CSS Styling (`styles.css` - 200+ lines)
Comprehensive tooltip styling:

#### Layout
- Flexible header with badges and status
- Formatted citation with background highlight
- Collapsible sections (abstract)
- Button row for quick actions
- Responsive max-width

#### Visual Indicators
- Border-left accent (green for valid, red for undefined)
- Type-specific badge colors
- Status icons with semantic colors
- Hover effects on interactive elements

#### Typography
- Obsidian theme variables
- Monospace for citation keys
- Italic for journal/book titles
- Scaled font sizes for hierarchy

### 6. Integration Points

#### Settings (`src/interfaces/plugin-settings.ts`)
```typescript
citations: {
  enabled: boolean;              // Master toggle
  showTooltip: boolean;          // Show hover tooltips
  citationStyle: string;         // APA, Chicago, MLA
  showVisualIndicators: boolean; // Color-coded indicators
  bibliographyPaths: string[];   // User-configured paths
  cacheTimeout: number;          // Minutes
}
```

#### Main Plugin (`src/main.ts`)
- Initialize `BibliographyManager` and `CitationFormatter`
- Register hover extension in editor extensions
- Load bibliography on file open/change
- Set active citation style from settings
- Provide invalidation on settings change

#### Commands
1. **Reload Bibliography** - Force reload of .bib files
2. **Toggle Citation Preview** - Enable/disable feature

#### Settings UI
Comprehensive settings section:
- Enable/disable citation preview
- Toggle hover tooltips
- Citation style dropdown (APA, Chicago, MLA)
- Visual indicators toggle
- Cache timeout slider (1-60 minutes)
- Bibliography paths manager:
  - Add custom .bib file paths
  - Remove paths
  - Reload button

### 7. Event Handling

#### File Events
- **active-leaf-change**: Load bibliography when switching files
- **file-open**: Load bibliography when opening file
- Both events trigger `loadBibliographyForActiveFile()`

#### Caching Strategy
- Cache valid for 5 minutes (configurable)
- Invalidate on:
  - Settings change
  - Manual reload command
  - Bibliography path modification
- Reuse cache if files unchanged

## Technical Highlights

### Performance Optimizations
- **Lazy loading**: Bibliography loaded on demand
- **Smart caching**: Avoid re-parsing unchanged files
- **Hover delay**: 300ms prevents accidental triggers
- **Efficient regex**: Single-pass citation detection

### Robustness Features
- **Fallback formatting**: Default format if style fails
- **Error handling**: Try-catch around .bib parsing
- **Path resolution**: Multiple strategies for finding files
- **Validation**: Check required fields by entry type

### User Experience
- **Auto-discovery**: No manual configuration needed
- **Multiple sources**: Frontmatter, settings, folder, common names
- **Quick actions**: One-click copy key/citation
- **Visual feedback**: Clear status indicators
- **Style preview**: See formatted citation immediately

## File Structure
```
src/citations/
  ├── BibTeXParser.ts              (270 lines) - Parse .bib files
  ├── BibliographyManager.ts       (280 lines) - Discovery & caching
  ├── CitationFormatter.ts         (420 lines) - APA, Chicago, MLA
  └── citationHoverExtension.ts    (220 lines) - CodeMirror integration

styles.css                         (+ 200 lines) - Tooltip styling
```

## Usage

### For Users
1. Enable in Settings → Citation Preview
2. Choose citation style (APA, Chicago, MLA)
3. Hover over any citation: `[@smith2020]`
4. See formatted bibliographic information
5. Click to copy citation key or formatted text
6. Expand abstract if available

### For Academic Writers
- Check citations without opening .bib file
- Verify DOI/URL links are present
- See validation warnings for incomplete entries
- Quick copy citation keys for reuse
- Switch between citation styles

### Bibliography Discovery
Plugin automatically searches for .bib files in:
1. YAML frontmatter `bibliography:` field
2. User-configured paths (Settings)
3. Current file's folder
4. Vault root (references.bib, bibliography.bib, library.bib)

### Supported Citation Syntax
- `[@smith2020]` - Standard citation
- `@smith2020` - In-text citation
- `[-@smith2020]` - Suppress author
- `[@smith2020; @doe2021]` - Multiple citations
- `[@smith2020, pp. 12-15]` - With locator

## Build Results
- **Compiled successfully**: No errors or warnings
- **Bundle size**: 363KB (was 274KB before citations)
- **Added size**: ~89KB for comprehensive citation preview feature

## Future Enhancements
From PHASE-2-ENHANCEMENTS.md:
- CSL file support for custom styles
- "Find All Uses" command for citations
- Zotero integration
- Visual indicators in editor (underlines, dots)
- Citation validation highlighting
- Bibliography export utilities
- Citation statistics in stats panel

## Limitations & Notes
- Requires .bib files in BibTeX/BibLaTeX format
- Maximum hover tooltip width: 500px
- Cache timeout: 1-60 minutes (default 5)
- Hover delay: 300ms (not configurable)
- Abstract text limited to 200px height (scrollable)
