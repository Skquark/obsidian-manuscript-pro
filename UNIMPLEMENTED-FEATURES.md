# Unimplemented Features

This document tracks features that have placeholder code but are not yet fully implemented.

## ✅ Completed Features

### 1. Pre-publication Checklist UI Panel
**Status**: ✅ IMPLEMENTED  
**Location**: `src/views/ChecklistPanelView.ts`  
**Implementation**: Full ItemView panel with interactive checklist, categories, progress tracking, notes, and export functionality
**Command**: "Show Pre-Publication Checklist"

### 2. Progress Stats UI Panel
**Status**: ✅ IMPLEMENTED  
**Location**: `src/views/ProgressPanelView.ts`  
**Implementation**: Full ItemView panel with stats cards, goals tracking, session history, auto-refresh, and CSV export
**Command**: "Show Progress Statistics"

### 3. Research Fact Input Modal
**Status**: ✅ IMPLEMENTED  
**Location**: `src/modals/ResearchFactModal.ts`  
**Implementation**: Full modal with form for adding research facts (term, category, definition, tags, source)
**Command**: "Add Research Fact"

### 4. Research Bible Search Modal
**Status**: ✅ IMPLEMENTED  
**Location**: `src/modals/ResearchSearchModal.ts`  
**Implementation**: Full search interface with live search, category filtering, split view, and insert functionality
**Command**: "Search Research Bible"

### 5. Citation Bibliography Validation
**Status**: ✅ IMPLEMENTED  
**Location**: `src/quality/PublicationChecklistManager.ts`  
**Implementation**: Three fully functional validation methods:
- `checkCitationsInBibliography()` - Validates all citations exist in bibliography
- `checkUnusedBibEntries()` - Identifies unused bibliography entries
- `checkOrphanedCitations()` - Detects orphaned citations

**Features**:
- Multi-format citation detection (Pandoc, LaTeX, Markdown)
- Integration with BibliographyManager
- Console warnings for validation issues
- Automatic checklist validation

### 6. Manuscript Editor Confirmation Dialog
**Status**: ✅ IMPLEMENTED  
**Location**: `src/manuscript/ManuscriptEditorModal.ts`  
**Implementation**: Added confirmation dialog when closing with unsaved changes
**Features**:
- Checks `hasUnsavedChanges` flag before closing
- Prompts user with confirm dialog
- Prevents accidental data loss

### 7. Publisher Address in Citations
**Status**: ✅ IMPLEMENTED  
**Location**: `src/citations/CitationFormatter.ts`  
**Implementation**: Added publisher location to book citations (Chicago style)
**Features**:
- Extracts `address` field from BibTeX entries
- Formats as "Location: Publisher" when both available
- Falls back to publisher only if location not provided

### 8. Inline Equation Counting
**Status**: ✅ IMPLEMENTED  
**Location**: `src/stats/StatsCalculator.ts` line 290  
**Implementation**: Inline equations now included in total equation count
**Features**:
- Counts inline equations (`$...$`)
- Counts display equations (`$$...$$`)
- Counts numbered equations (`\begin{equation}`)
- All three types added to total equations count

## Implementation Notes

### UI Panel Pattern
All "coming soon" UI panels follow this pattern:
1. Data is retrieved/calculated
2. Data is exported to markdown or logged to console
3. Notice tells user "UI panel coming soon"
4. Console.log provides fallback output

**To implement**: Create ItemView classes for each panel type and register them in plugin lifecycle.

### Citation Validation Pattern  
All citation validation methods are stubs that:
1. Return `true` (always pass)
2. Have "Placeholder" comments
3. Include notes about needing BibliographyManager integration

**To implement**: Add validation methods to BibliographyManager and call them from PublicationChecklistManager.

## Testing Checklist

All features implemented and tested:
- [x] Pre-publication checklist UI panel displays correctly
- [x] Progress stats UI panel shows real-time statistics
- [x] Research fact input modal saves to Research Bible
- [x] Research Bible search modal filters and displays results
- [x] Citation validation catches missing bibliography entries
- [x] Citation validation catches unused bibliography entries
- [x] Citation validation catches orphaned citations
- [x] Confirmation dialogs prevent accidental data loss
- [x] Publisher addresses included in book citations
- [x] Inline equations counted in statistics

## Related Files

- `src/main.ts` - Main plugin file with command registrations
- `src/quality/PublicationChecklistManager.ts` - Checklist validation logic
- `src/quality/ProgressTrackingManager.ts` - Progress statistics
- `src/quality/ResearchBibleManager.ts` - Research Bible functionality
- `src/citations/BibliographyManager.ts` - Bibliography handling
- `src/manuscript/ManuscriptEditorModal.ts` - Manuscript editing UI

## Version History

- **2025-10-26**: Initial documentation created during ESLint cleanup review
