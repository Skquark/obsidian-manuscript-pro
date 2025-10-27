# Phase 5: Hybrid Expert Mode - Smart Design

## Philosophy: Give Experts What They Actually Need

After analyzing real-world expert use cases, here's what power users actually want:

### What Experts Want:
1. ✅ **View generated code** to learn/verify
2. ✅ **Copy code** to use elsewhere
3. ✅ **Edit YAML** (easy to parse, well-structured)
4. ✅ **Override LaTeX** when UI is limiting
5. ✅ **Import/Export templates** to share
6. ✅ **Quick toggle** between UI and code
7. ❌ **NOT:** Fight with bidirectional sync bugs

### What Experts DON'T Want:
- Sync conflicts where UI and code fight
- Parse errors breaking their work
- Having to fix the sync logic themselves
- Losing custom code when switching tabs

---

## The Hybrid Solution: "Smart Defaults with Expert Overrides"

### Design Principles

1. **YAML is editable** (easy to parse, structured)
2. **LaTeX has "override mode"** (complex, but experts know what they're doing)
3. **No automatic bidirectional sync** (avoids conflicts)
4. **Explicit "Apply Changes" buttons** (user control)
5. **Preserve custom content** (don't lose user work)

### User Experience Flow

#### Scenario 1: Visual User (95% of users)
1. Use UI tabs normally
2. Check Expert tab to see generated code
3. Copy code if needed
4. Never worry about sync

#### Scenario 2: YAML Expert
1. Open Expert tab
2. Click "Edit YAML"
3. Modify YAML directly
4. Click "Apply YAML to UI"
5. UI updates with parsed values
6. Continue using UI or keep editing YAML

#### Scenario 3: LaTeX Power User
1. UI doesn't support custom package they need
2. Open Expert tab → LaTeX section
3. Toggle "Override LaTeX"
4. Edit LaTeX directly
5. When overridden, UI-generated LaTeX is replaced
6. Toggle back to let UI generate LaTeX again

---

## Technical Implementation

### 1. Three-Mode System

#### Mode 1: View Only (Default)
```typescript
{
    mode: 'view',
    editable: false,
    showApplyButton: false,
    syncDirection: 'ui-to-code' // UI changes update code display
}
```

#### Mode 2: YAML Edit
```typescript
{
    mode: 'yaml-edit',
    editable: true,
    showApplyButton: true,
    syncDirection: 'manual' // User clicks "Apply" to sync
}
```

#### Mode 3: LaTeX Override
```typescript
{
    mode: 'latex-override',
    editable: true,
    showApplyButton: false,
    syncDirection: 'code-only' // Code replaces generated LaTeX
}
```

### 2. Enhanced Configuration Interface

```typescript
export interface TemplateConfiguration {
    // ... existing fields
    
    // Expert mode additions
    expertMode?: {
        yamlOverride?: boolean;      // Is YAML manually edited?
        latexOverride?: boolean;     // Is LaTeX manually edited?
        customYAML?: string;         // User's YAML (when overridden)
        customLaTeX?: string;        // User's LaTeX (when overridden)
        lastSyncDirection?: 'ui' | 'yaml' | 'latex';
    };
}
```

### 3. Code Editor Component with Modes

```typescript
export interface CodeEditorOptions {
    language: 'yaml' | 'latex' | 'json';
    mode: 'view' | 'edit' | 'override';
    initialValue: string;
    onChange?: (value: string) => void;
    onApply?: (value: string) => void;
    showApplyButton?: boolean;
    placeholder?: string;
}

export class CodeEditorComponent {
    private mode: 'view' | 'edit' | 'override';
    private hasUnsavedChanges: boolean = false;
    
    render() {
        // Toolbar with mode toggle
        const toolbar = this.createToolbar();
        
        if (this.mode === 'view') {
            this.textarea.readOnly = true;
            this.hideApplyButton();
        } else {
            this.textarea.readOnly = false;
            this.showApplyButton();
            this.showUnsavedIndicator();
        }
    }
    
    private createToolbar() {
        const toolbar = document.createElement('div');
        
        // Language label
        const label = toolbar.createSpan({ text: this.language });
        
        // Mode toggle (for YAML only)
        if (this.language === 'yaml') {
            const toggle = toolbar.createEl('button', {
                text: this.mode === 'view' ? '✏️ Edit' : '👁️ View'
            });
            toggle.onclick = () => this.toggleMode();
        }
        
        // Override toggle (for LaTeX only)
        if (this.language === 'latex') {
            const override = this.createCheckbox({
                label: 'Override (expert)',
                checked: this.mode === 'override',
                onChange: (checked) => this.setOverride(checked)
            });
            toolbar.append(override);
        }
        
        // Copy button (always visible)
        const copy = toolbar.createEl('button', {
            text: '📋 Copy'
        });
        copy.onclick = () => this.copyToClipboard();
        
        // Apply button (only in edit/override mode)
        if (this.mode !== 'view' && this.options.showApplyButton) {
            const apply = toolbar.createEl('button', {
                text: '✓ Apply Changes',
                cls: 'mod-cta'
            });
            apply.onclick = () => this.applyChanges();
            
            if (!this.hasUnsavedChanges) {
                apply.disabled = true;
            }
        }
        
        return toolbar;
    }
    
    private toggleMode() {
        if (this.mode === 'view') {
            this.mode = 'edit';
            this.textarea.readOnly = false;
        } else {
            if (this.hasUnsavedChanges) {
                if (!confirm('Discard unsaved changes?')) {
                    return;
                }
            }
            this.mode = 'view';
            this.textarea.readOnly = true;
            this.hasUnsavedChanges = false;
        }
        this.render();
    }
    
    private applyChanges() {
        if (this.options.onApply) {
            this.options.onApply(this.getValue());
            this.hasUnsavedChanges = false;
            this.render();
        }
    }
}
```

### 4. Expert Tab UI Layout

```
┌─────────────────────────────────────────────────────┐
│ ⚡ Expert Mode                                       │
│ Direct access to YAML and LaTeX. UI changes update  │
│ code automatically. Use "Apply" to update UI.       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📝 Pandoc YAML Configuration                        │
│                                                      │
│ ┌─────────────────────────────────────────────────┐│
│ │ YAML  [✏️ Edit] [📋 Copy]                       ││
│ ├─────────────────────────────────────────────────┤│
│ │ documentclass: book                              ││
│ │ fontsize: 11pt                                   ││
│ │ geometry:                                        ││
│ │   - paperwidth=6in                               ││
│ │   - paperheight=9in                              ││
│ │ ...                                              ││
│ └─────────────────────────────────────────────────┘│
│                                                      │
│ [✓ Apply YAML to UI] ← Only when edited            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🔧 LaTeX Header-Includes                            │
│                                                      │
│ ☐ Override generated LaTeX (expert mode)            │
│                                                      │
│ ┌─────────────────────────────────────────────────┐│
│ │ LATEX  [📋 Copy]                                ││
│ ├─────────────────────────────────────────────────┤│
│ │ \usepackage[letterpaper]{geometry}               ││
│ │ \geometry{top=1in,bottom=1in}                    ││
│ │ \setmainfont{Palatino}                           ││
│ │ ...                                              ││
│ └─────────────────────────────────────────────────┘│
│                                                      │
│ ℹ️ When overridden, your LaTeX replaces UI output  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 💾 Template Management                              │
│                                                      │
│ [📥 Import from JSON]  [📤 Export as JSON]         │
│                                                      │
│ Export includes all settings and custom code.       │
└─────────────────────────────────────────────────────┘
```

### 5. Synchronization Logic

#### UI → Code (Always Active)
```typescript
private updatePreview() {
    // Already exists, just enhance it
    
    // Only regenerate YAML if not overridden
    if (!this.config.expertMode?.yamlOverride) {
        const yamlGen = new YAMLGenerator();
        const yaml = yamlGen.generate(this.config);
        this.yamlEditor?.setValue(yaml);
    }
    
    // Only regenerate LaTeX if not overridden
    if (!this.config.expertMode?.latexOverride) {
        const latexGen = new LaTeXGenerator();
        const latex = latexGen.generate(this.config);
        this.latexEditor?.setValue(latex);
    }
    
    // Always update preview tab
    this.renderPreviewPanel();
}
```

#### YAML → UI (Manual, via "Apply" button)
```typescript
private applyYAMLToUI(yamlString: string) {
    try {
        // Parse YAML using js-yaml
        const yaml = require('js-yaml');
        const parsed = yaml.load(yamlString);
        
        // Update configuration
        const parser = new YAMLParser();
        const updates = parser.parseToConfig(parsed);
        
        // Merge updates into config
        Object.assign(this.config, updates);
        
        // Mark as overridden
        if (!this.config.expertMode) {
            this.config.expertMode = {};
        }
        this.config.expertMode.yamlOverride = true;
        this.config.expertMode.customYAML = yamlString;
        this.config.modifiedAt = Date.now();
        
        // Re-render all UI tabs
        this.renderCurrentTab();
        
        // Success message
        new Notice('YAML applied to UI successfully');
        
    } catch (error) {
        // Show error in editor
        this.yamlEditor?.setError(error.message);
        new Notice('YAML parse error: ' + error.message);
    }
}
```

#### LaTeX → Output (Direct Override)
```typescript
private setLatexOverride(enabled: boolean, customLatex?: string) {
    if (!this.config.expertMode) {
        this.config.expertMode = {};
    }
    
    this.config.expertMode.latexOverride = enabled;
    
    if (enabled && customLatex) {
        this.config.expertMode.customLaTeX = customLatex;
    }
    
    this.config.modifiedAt = Date.now();
    this.updatePreview();
}

// In LaTeXGenerator
generate(config: TemplateConfiguration): string {
    // Check for override first
    if (config.expertMode?.latexOverride && config.expertMode?.customLaTeX) {
        return config.expertMode.customLaTeX;
    }
    
    // Otherwise generate normally
    return this.generateFromConfig(config);
}
```

---

## Benefits of This Approach

### 1. Best of Both Worlds
- ✅ Beginners never see complexity
- ✅ Experts get full control
- ✅ Clear mental model (no mysterious sync)

### 2. Predictable Behavior
- ✅ UI changes → code updates automatically
- ✅ Code changes → require explicit "Apply"
- ✅ Override mode → clear indication of custom behavior

### 3. Safety
- ✅ No accidental overwrites
- ✅ Confirmation for unsaved changes
- ✅ Can always revert by turning off override

### 4. Complexity Management
- ✅ YAML parsing is straightforward (js-yaml library)
- ✅ LaTeX parsing avoided (override instead)
- ✅ Sync bugs eliminated (manual triggers)

### 5. Expert Workflow
```
Expert wants custom package not in UI:
1. Toggle "Override LaTeX" ✓
2. Add \usepackage{mypackage} ✓
3. Export works with custom package ✓
4. Toggle off when done ✓
```

---

## Implementation Complexity

### Easy (2-3 hours)
- ✅ CodeEditorComponent base
- ✅ Expert tab structure
- ✅ View-only mode
- ✅ Copy buttons
- ✅ Import/Export JSON

### Medium (2-3 hours)
- ⚠️ YAML edit mode
- ⚠️ YAML parsing with js-yaml
- ⚠️ Apply button logic
- ⚠️ Error handling

### Simple (1 hour)
- ✅ LaTeX override toggle
- ✅ Override persistence
- ✅ Generator checks for override

**Total: 5-7 hours, ~1,200 lines**

---

## Error Handling Strategy

### YAML Parse Errors
```typescript
try {
    const parsed = yaml.load(yamlString);
    // ... apply to config
} catch (error) {
    // Show error in editor
    this.yamlEditor.setError(
        `Line ${error.mark?.line}: ${error.message}`
    );
    
    // Don't apply partial changes
    // Keep UI in previous state
    
    new Notice('Fix YAML errors before applying');
}
```

### Invalid Configuration Values
```typescript
// Validate after parsing
const validator = new ConfigValidator();
const errors = validator.validate(parsedConfig);

if (errors.length > 0) {
    const message = errors.map(e => `• ${e.field}: ${e.message}`).join('\n');
    this.yamlEditor.setError(message);
    return;
}
```

### Unsaved Changes Warning
```typescript
private switchTab(newTab: EditorTab) {
    if (this.yamlEditor?.hasUnsavedChanges()) {
        const confirmed = confirm(
            'You have unsaved YAML changes. Apply or discard?'
        );
        
        if (!confirmed) {
            return; // Stay on current tab
        }
        
        // Discard changes
        this.yamlEditor.reset();
    }
    
    this.currentTab = newTab;
    this.renderCurrentTab();
}
```

---

## User Documentation

### For Visual Users
> The Expert tab lets you see the YAML and LaTeX code that will be used for export. You can copy this code to use in other tools. Most users won't need to edit this.

### For YAML Users
> Click "Edit" in the YAML section to modify configuration directly. Click "Apply YAML to UI" when done, and the visual editor will update with your changes.

### For LaTeX Experts
> Check "Override generated LaTeX" to use your own LaTeX code. The UI will no longer generate LaTeX - your custom code will be used instead. Uncheck to return to UI-generated LaTeX.

---

## Phase 5 Implementation Plan

### Step 1: CodeEditorComponent (2 hours)
- Create component with three modes
- Add toolbar with toggles
- Handle view/edit/override states

### Step 2: Expert Tab Structure (1 hour)
- Add Expert tab to modal
- Create three sections (YAML, LaTeX, Import/Export)
- Add info boxes

### Step 3: YAML Editor (2 hours)
- Integrate js-yaml library
- Implement YAMLParser helper
- Add Apply button logic
- Error handling

### Step 4: LaTeX Override (1 hour)
- Add override checkbox
- Store custom LaTeX
- Update LaTeXGenerator to check override

### Step 5: Import/Export (1 hour)
- JSON export with expertMode data
- JSON import with validation
- File picker integration

### Step 6: CSS & Polish (1 hour)
- Style code editor
- Style toolbar buttons
- Responsive adjustments

**Total: ~8 hours, ~1,200 lines, medium complexity**

---

## Decision

This hybrid approach gives experts exactly what they need:
1. **View code** to learn and verify
2. **Edit YAML** when UI is limiting
3. **Override LaTeX** for advanced customization
4. **Import/Export** to share templates
5. **No sync bugs** to fight with

And it keeps the codebase maintainable by avoiding complex bidirectional sync.

**Ready to implement?**
