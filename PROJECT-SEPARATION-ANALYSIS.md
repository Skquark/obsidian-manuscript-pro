# Project Separation Analysis
## Manuscript Pro vs Fountain Pro Code Mix-up

**Date:** 2025-10-27
**Issue:** Fountain Pro code has been accidentally mixed into Manuscript Pro repository

---

## Summary

The other coding agent appears to have mixed code between two separate projects:
- **Manuscript Pro** - `/mnt/c/Projects/obsidian-manuscript-pro` (this repository)
- **Fountain Pro** - `/mnt/c/Projects/obsidian-fountain-pro` (separate repository)

## Git History Context

Commit `8fe149f` (Oct 26) attempted to remove Fountain Pro files with message:
> "Remove Fountain Pro files incorrectly mixed into Manuscript Pro"

Files removed:
- src/editor/classify.ts, completions.ts, elementMode.ts
- src/io/layout.ts, pdf.ts
- src/views/OutlineView.ts, TitlePageModal.ts

**However**, these files are back in the working directory as UNTRACKED files (not committed).

---

## Files Mixed Into Manuscript Pro

### 1. Fountain Pro Source Code (Untracked ⚠️)

**In Manuscript Pro (shouldn't be here):**
```
src/fountain/classify.ts              (45 lines, Oct 27 18:56)
src/editor/FountainCompletions.ts     (84 lines, Oct 27 19:01)
src/editor/elementMode.ts             (103 lines, Oct 27 19:02)
src/views/OutlineView.ts              (104 lines, Oct 27 18:56)
```

**Corresponding files in Fountain Pro (where they belong):**
```
/mnt/c/Projects/obsidian-fountain-pro/src/editor/classify.ts      (21 lines, Oct 26 16:45)
/mnt/c/Projects/obsidian-fountain-pro/src/editor/completions.ts  (125 lines, Oct 26 19:47)
/mnt/c/Projects/obsidian-fountain-pro/src/editor/elementMode.ts  (238 lines, Oct 27 03:29)
/mnt/c/Projects/obsidian-fountain-pro/src/views/OutlineView.ts   (326 lines, Oct 27 18:42)
```

**Analysis:**
- **classify.ts**: MP version (45 lines) is MORE sophisticated than FP version (21 lines)
  - Has context awareness, better character detection
  - MP version should be copied TO Fountain Pro
- **completions.ts**: FP version (125 lines) is MORE complete than MP version (84 lines)
  - FP version is 41 lines longer
- **elementMode.ts**: FP version (238 lines) is MUCH MORE complete than MP version (103 lines)
  - FP version is 135 lines longer (2.3x larger)
- **OutlineView.ts**: FP version (326 lines) is MUCH MORE complete than MP version (104 lines)
  - FP version is 222 lines longer (3.1x larger)

### 2. Fountain Pro Integration in main.ts (Tracked, Modified ⚠️)

**Lines with Fountain code in src/main.ts:**
- Line 13: `import { OutlineView, FOUNTAIN_OUTLINE_VIEW } from './views/OutlineView';`
- Lines 53-54: Fountain imports (createFountainCompletions, fountainElementKeymap)
- Line 313: `fountainStatusEl: HTMLElement | null = null;`
- Lines 472-474: Register Fountain editor extensions
- Lines 532-567: Fountain status bar initialization
- Lines 590-609: `updateFountainStatusBar()` method
- Lines 1299-1340: Fountain commands (6 commands):
  - `fountain-to-scene`
  - `fountain-to-action`
  - `fountain-to-character`
  - `fountain-to-parenthetical`
  - `fountain-to-dialogue`
  - `fountain-to-transition`
  - `fountain-open-outline`
- Lines 2494-2495: Register Fountain Outline View

**Total Fountain integration:** ~150 lines of code in main.ts

### 3. Documentation Files

**Wrong README (Modified ⚠️):**
- `README.md` - First 8 lines are Fountain Pro, then switches to Manuscript Pro features
- Completely mixed/confused content

**Wrong Enhancement Doc (Untracked):**
- `CODEX-ENHANCEMENTS-FP.md` - Fountain Pro roadmap (shouldn't be in MP repo)

### 4. Configuration Files (Fixed ✅)

**These were WRONG but are NOW FIXED:**
- `manifest.json` - Was Fountain Pro, now correctly Manuscript Pro
- `package.json` - Was Fountain Pro, now correctly Manuscript Pro
- `package-lock.json` - Still shows "obsidian-fountain-pro" (will regenerate on next build)

---

## Recommended Action Plan

### Phase 1: Backup Current State ✅

**Already done by Git:** All Fountain files are untracked, so they can be safely removed without losing git history.

### Phase 2: Code Transfer Strategy

**For classify.ts (MP → FP):**
```bash
# MP version is BETTER - copy it to Fountain Pro
cp /mnt/c/Projects/obsidian-manuscript-pro/src/fountain/classify.ts \
   /mnt/c/Projects/obsidian-fountain-pro/src/editor/classify.ts
```

**For other files (no action needed):**
- FP already has more complete versions
- MP versions can be safely deleted

### Phase 3: Clean Manuscript Pro

**Remove Fountain Pro files:**
```bash
# In Manuscript Pro directory
rm -rf src/fountain/
rm src/editor/FountainCompletions.ts
rm src/editor/elementMode.ts
rm src/views/OutlineView.ts
rm CODEX-ENHANCEMENTS-FP.md
```

**Clean main.ts:**
- Remove Fountain imports (lines 13, 53-54)
- Remove fountainStatusEl property (line 313)
- Remove Fountain editor extensions (lines 472-474)
- Remove Fountain status bar code (lines 532-567, 590-609)
- Remove Fountain commands (lines 1299-1340)
- Remove Fountain view registration (lines 2494-2495)

**Restore README.md:**
- Replace with proper Manuscript Pro README
- Check git history for last good version

### Phase 4: Verify Fountain Pro

**Check Fountain Pro has everything it needs:**
```bash
cd /mnt/c/Projects/obsidian-fountain-pro
ls -la src/editor/    # Should have classify, completions, elementMode, etc.
ls -la src/views/     # Should have OutlineView
```

**If classify.ts needs update:**
```bash
# Copy improved version from MP
cp /mnt/c/Projects/obsidian-manuscript-pro/src/fountain/classify.ts \
   src/editor/classify.ts
```

### Phase 5: Rebuild Both Projects

**Manuscript Pro:**
```bash
cd /mnt/c/Projects/obsidian-manuscript-pro
npm run build
```

**Fountain Pro:**
```bash
cd /mnt/c/Projects/obsidian-fountain-pro
npm run build
```

---

## File Comparison Details

### classify.ts Comparison

**Manuscript Pro version (MORE ADVANCED):**
- 45 lines
- Has `LineContext` interface for context tracking
- Has `isLikelyCharacter()` helper function
- Smarter dialogue detection based on previous element
- More comprehensive transition patterns
- Better character detection heuristics

**Fountain Pro version (SIMPLER):**
- 21 lines
- No context tracking
- Simpler pattern matching
- Less sophisticated character detection

**RECOMMENDATION:** Copy MP version → FP

### Other Files

**completions.ts:**
- FP: 125 lines (MORE COMPLETE)
- MP: 84 lines
- **Action:** Delete MP version, keep FP version

**elementMode.ts:**
- FP: 238 lines (MUCH MORE COMPLETE)
- MP: 103 lines
- **Action:** Delete MP version, keep FP version

**OutlineView.ts:**
- FP: 326 lines (MUCH MORE COMPLETE)
- MP: 104 lines
- **Action:** Delete MP version, keep FP version

---

## Lines to Remove from main.ts

### Imports (lines 13, 53-54)
```typescript
import { OutlineView, FOUNTAIN_OUTLINE_VIEW } from './views/OutlineView';
import { createFountainCompletions } from './editor/FountainCompletions';
import { fountainElementKeymap, transformCurrentLine } from './editor/elementMode';
```

### Property (line 313)
```typescript
fountainStatusEl: HTMLElement | null = null;
```

### Editor Extensions (lines 472-474)
```typescript
// Fountain Pro: SmartType completions and element keymap
this.editorExtensions.push(createFountainCompletions(this as any));
this.editorExtensions.push(fountainElementKeymap(this as any));
```

### Status Bar Setup (lines 532-567)
```typescript
// Fountain element indicator
this.fountainStatusEl = this.addStatusBarItem();
this.fountainStatusEl.addClass('fountain-pro-status');
// ... entire status bar initialization block
```

### Update Method (lines 590-609)
```typescript
private updateFountainStatusBar() {
    // ... entire method
}
```

### Commands (lines 1299-1340)
```typescript
// Fountain Pro — Convert current line commands
this.addCommand({ id: 'fountain-to-scene', ... });
this.addCommand({ id: 'fountain-to-action', ... });
this.addCommand({ id: 'fountain-to-character', ... });
this.addCommand({ id: 'fountain-to-parenthetical', ... });
this.addCommand({ id: 'fountain-to-dialogue', ... });
this.addCommand({ id: 'fountain-to-transition', ... });

// Fountain Pro — Outline
this.addCommand({ id: 'fountain-open-outline', ... });
```

### View Registration (lines 2494-2495)
```typescript
// Register Fountain Outline View
this.registerView(FOUNTAIN_OUTLINE_VIEW, (leaf: WorkspaceLeaf) => new OutlineView(leaf, this as any));
```

---

## Verification Checklist

After cleanup, verify:

**Manuscript Pro:**
- [ ] No Fountain imports in main.ts
- [ ] No src/fountain/ directory
- [ ] No src/editor/FountainCompletions.ts
- [ ] No src/editor/elementMode.ts
- [ ] No src/views/OutlineView.ts
- [ ] No Fountain commands registered
- [ ] README.md describes Manuscript Pro
- [ ] manifest.json has id: "manuscript-pro"
- [ ] package.json has name: "obsidian-manuscript-pro"
- [ ] Build succeeds with no errors
- [ ] grep -r "fountain" returns no results (case-insensitive)

**Fountain Pro:**
- [ ] Has src/editor/classify.ts (updated with better MP version)
- [ ] Has src/editor/completions.ts
- [ ] Has src/editor/elementMode.ts
- [ ] Has src/views/OutlineView.ts
- [ ] Build succeeds with no errors

---

## Risk Assessment

**Low Risk:**
- All Fountain files in MP are UNTRACKED (not committed)
- Can safely delete without affecting git history
- FP project already has more complete versions
- Only classify.ts in MP is potentially more advanced

**Medium Risk:**
- main.ts has Fountain code COMMITTED
- Need to carefully remove ~150 lines
- Must not break other Manuscript Pro functionality

**Mitigation:**
- Create git branch before changes
- Test build after each step
- Keep both projects' git history intact

---

## Next Steps

**Waiting for user confirmation:**

1. **Copy improved classify.ts to Fountain Pro?** (Yes/No)
2. **Remove all Fountain code from Manuscript Pro?** (Yes/No)
3. **Restore Manuscript Pro README?** (Yes/No)

Once confirmed, I can execute the cleanup with a single script.

---

**Generated:** 2025-10-27
**Status:** Analysis complete, awaiting user decision
