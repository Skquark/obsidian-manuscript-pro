# Unimplemented Features

This document tracks features that have placeholder code but are not yet fully implemented.

## High Priority - UI Panels

### 1. Pre-publication Checklist UI Panel
**Status**: Placeholder implemented  
**Location**: `src/main.ts` line 1909-1915  
**Current behavior**: Exports checklist to console with "UI panel coming soon" notice  
**Intended behavior**: Display checklist in an interactive UI panel  
**Code**:
```typescript
const checklist = this.checklistManager.getChecklist(activeFile);
// TODO: Display checklist object in UI panel instead of console
new Notice('Checklist exported to console (UI panel coming soon)');
```

### 2. Progress Stats UI Panel
**Status**: Placeholder notice  
**Location**: `src/main.ts` line 1993  
**Current behavior**: Notice says "Progress stats exported to console (UI panel coming soon)"  
**Intended behavior**: Display progress statistics in an interactive UI panel

### 3. Research Fact Input Modal
**Status**: Placeholder notice  
**Location**: `src/main.ts` line 2013  
**Current behavior**: Notice says "Research fact input modal coming soon"  
**Intended behavior**: Modal for adding research facts to the Research Bible

### 4. Research Bible Search Modal
**Status**: Placeholder notice  
**Location**: `src/main.ts` line 2027  
**Current behavior**: Notice says "Research Bible search modal coming soon"  
**Intended behavior**: Search interface for Research Bible entries

## Medium Priority - Validation Features

### 5. Citation Bibliography Validation
**Status**: Stub methods return `true` (always pass)  
**Location**: `src/quality/PublicationChecklistManager.ts` lines 503-523  
**Methods**:
- `checkAllCitationsInBib()` - Check if all citations are in bibliography
- `checkUnusedBibEntries()` - Check if all bibliography entries are cited  
- `checkOrphanedCitations()` - Check for citations without bibliography entries

**Current behavior**: All return `true` with "Placeholder" comments  
**Intended behavior**: Integrate with BibliographyManager to validate citations

**Code**:
```typescript
private async checkAllCitationsInBib(): Promise<boolean> {
    // Check if all citations are in bibliography
    // Note: bibliographyManager doesn't have validateCitations method yet
    // This would need to be implemented
    return true; // Placeholder
}
```

### 6. Manuscript Editor Confirmation Dialog
**Status**: TODO comment  
**Location**: `src/manuscript/ManuscriptEditorModal.ts` line 766  
**Current behavior**: No confirmation when making changes  
**Intended behavior**: Add confirmation dialog before destructive operations

## Low Priority - Enhancements

### 7. Publisher Address in Citations
**Status**: Field extracted but not used  
**Location**: `src/citations/CitationFormatter.ts` line 102  
**Current behavior**: `address` field is extracted from BibTeX but not included in formatted citations  
**Intended behavior**: Some academic citation styles include publisher location (e.g., Chicago style)

### 8. Inline Equation Counting
**Status**: Calculated but not included in total  
**Location**: `src/stats/StatsCalculator.ts` line 292  
**Current behavior**: Inline equations (`$...$`) are counted separately but not added to total equation count  
**Intended behavior**: May be intentional to only count display/numbered equations, or may need to add inline equations to total

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

When implementing these features:
- [ ] Pre-publication checklist UI panel displays correctly
- [ ] Progress stats UI panel shows real-time statistics
- [ ] Research fact input modal saves to Research Bible
- [ ] Research Bible search modal filters and displays results
- [ ] Citation validation catches missing bibliography entries
- [ ] Citation validation catches unused bibliography entries
- [ ] Citation validation catches orphaned citations
- [ ] Confirmation dialogs prevent accidental data loss

## Related Files

- `src/main.ts` - Main plugin file with command registrations
- `src/quality/PublicationChecklistManager.ts` - Checklist validation logic
- `src/quality/ProgressTrackingManager.ts` - Progress statistics
- `src/quality/ResearchBibleManager.ts` - Research Bible functionality
- `src/citations/BibliographyManager.ts` - Bibliography handling
- `src/manuscript/ManuscriptEditorModal.ts` - Manuscript editing UI

## Version History

- **2025-10-26**: Initial documentation created during ESLint cleanup review
