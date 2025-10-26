# Changelog

All notable changes to Manuscript Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-10-26

### Added

#### Major Features
- **Enhanced Ribbon Menu** - Comprehensive hierarchical menu with organized categories
  - 📤 Export submenu with quick exports (PDF, DOCX, HTML, EPUB)
  - 📚 Citations & Bibliography submenu (import, reload, detect duplicates)
  - 🔗 Cross-References submenu (label browser, indexing, validation)
  - 📋 Manuscript Tools submenu (navigator, editor, validation, statistics)
  - 📝 Templates & Snippets submenu (insert templates, figures, tables, equations)
  - 👁️ Concealment Groups submenu (toggle syntax groups)
  - 🎯 Focus Mode toggle
  - ⚙️ Settings access
- **Export Testing Guide** - Comprehensive testing documentation (EXPORT-TESTING-GUIDE.md)
- **Sample Manuscript** - Test document with citations, equations, and cross-references
- **Troubleshooting Section** - Detailed troubleshooting guide in README.md

#### Documentation
- Enhanced README with "Accessing Features" section
- Added troubleshooting guide covering:
  - Export issues (Pandoc, LaTeX, citations)
  - Performance optimization
  - Concealment configuration
  - Citation and bibliography setup
  - Focus mode settings
  - General debugging tips
- Created EXPORT-TESTING-GUIDE.md with comprehensive test procedures
- Added sample-manuscript.md and references.bib for testing

### Changed

#### UX Improvements
- Ribbon menu now uses emoji icons without duplicate Obsidian icons
- Submenu items marked with → arrow for better discoverability
- All major features accessible with 1-2 clicks from ribbon menu
- Improved command palette organization

#### Settings & Configuration
- Cross-reference settings now include:
  - `maxFilesToIndex`: Limit indexing for large vaults (default: 1000)
  - `showIndexStats`: Toggle index statistics display
- Statistics panel respects user-configured refresh interval

### Fixed

#### TypeScript & Type Safety
- Added missing `maxFilesToIndex` and `showIndexStats` to CrossRef settings interface
- Fixed missing `Notice` import in LabelBrowser.ts
- Added `await` keywords for async `validateReferences()` calls (2 locations)
- Fixed `View.editor` typing in FocusModeManager.ts
- Fixed `View.editor` typing in CommandInsertModal.ts
- Added undefined safety check in CommandEditEngine.ts for RegExp match index

#### Bug Fixes
- Stats panel now uses settings.statistics.refreshInterval instead of hardcoded 5000ms
- RegExp 'd' flag fallback for older Electron builds (concealment view plugin)
- Cross-reference indexing now enforces maxFilesToIndex limit with console warnings
- Validation display now shows inline color-coded results instead of simple notices

#### Performance
- Cross-reference indexing limited to 1000 files by default to prevent slowdowns in large vaults
- Index statistics now optional (showIndexStats setting)
- Enhanced Index Labels command provides detailed performance metrics

### Technical

#### Code Quality
- Fixed 7 critical TypeScript errors
- Improved async/await correctness across validation code
- Better type safety with proper Obsidian API imports (MarkdownView)
- Added safety checks for undefined values

#### Architecture
- Organized ribbon menu with submenu pattern
- Separated concerns: main menu → submenus → actions
- Improved settings interface completeness

## [0.1.0] - 2025-10-25

### Initial Release

#### Core Features
- **Syntax Concealment** - Hide LaTeX and Pandoc markup in Live Preview
  - Math delimiters ($...$, $$...$$)
  - Citations ([@key], @key)
  - LaTeX commands (\textbf{}, \emph{}, etc.)
  - Pandoc markup (#id, .class, key=val)
  - Indexing and metadata
- **Citation Management** - BibTeX integration
  - Import from DOI, arXiv, PubMed
  - Citation autocomplete (@)
  - Hover preview with formatted citations
  - Multiple citation styles (APA, Chicago, MLA)
  - Duplicate detection
- **Cross-References** - Label and reference tracking
  - Label autocomplete (\ref{})
  - Label browser sidebar
  - Vault-wide indexing
  - Reference validation
- **Focus Mode** - Distraction-free writing
  - Markdown concealment
  - Typewriter dimming
  - Reading width control
  - UI minimization
  - Fullscreen support
- **Export System** - Pandoc-powered document generation
  - PDF (Academic)
  - DOCX (Standard)
  - HTML (Web)
  - EPUB (eBook)
  - Custom export profiles
  - Template support
- **Manuscript Management** - Project organization
  - Manuscript navigator
  - Metadata editor (ManuscriptEditorModal)
  - Pre-publication checklist
  - Progress tracking
- **Templates & Snippets** - Reusable content
  - Template system with variables
  - Quick snippets for figures, tables, equations
  - LaTeX command builder
  - Table wizard
- **Statistics** - Writing analytics
  - Word/character counts
  - Reading time estimates
  - Goal tracking
  - Configurable refresh interval
- **Profile System** - Quick setting switching
  - Full Concealment
  - Math Review
  - Citation Check
  - Clean Prose
  - Technical Edit
  - Final Proofread

#### LaTeX & Pandoc Tools
- Command insert modal with search
- Wrap with environment
- Edit command/attributes at cursor
- Pandoc attributes editor
- Backslash completions
- Frontmatter editor

#### Security
- Safe Pandoc execution (execFile with array args)
- No shell command injection risks
- Local-only processing
- No telemetry or tracking

## [Unreleased]

### Planned Features
- Settings tab reorganization with collapsible sections
- Enhanced tooltips and help text
- Improved command palette naming
- Additional export profiles
- Extended LaTeX command library
- Enhanced table wizard features

---

## Version History

- **0.2.0** (2025-10-26) - Enhanced UI accessibility, TypeScript fixes, comprehensive documentation
- **0.1.0** (2025-10-25) - Initial release with full feature set

## Upgrade Notes

### From 0.1.0 to 0.2.0

**Breaking Changes**: None

**New Settings**:
- Cross-References → Max Files to Index (default: 1000)
- Cross-References → Show Index Statistics (default: false)

**Migration**: No manual migration required. Settings will automatically include new defaults.

**What to Test**:
1. Ribbon menu - all features accessible
2. Cross-reference indexing - check console for file limit warnings
3. Export functionality - verify all formats work
4. Statistics refresh - confirm respects configured interval

## Links

- **Repository**: https://github.com/Skquark/obsidian-manuscript-pro
- **Issues**: https://github.com/Skquark/obsidian-manuscript-pro/issues
- **Original Plugin**: https://github.com/mattcoleanderson/obsidian-dynamic-text-concealer
