# Phase 5: Expert Mode - Implementation Plan

## Overview
Phase 5 adds advanced features for power users who want direct access to YAML and LaTeX code, with bidirectional synchronization between visual UI and code editors.

---

## Goals

### Primary Objectives
1. **Raw YAML Editor** - Direct editing of Pandoc YAML configuration
2. **Raw LaTeX Editor** - Direct editing of LaTeX header-includes
3. **Two-Way Sync** - Changes in UI update code, changes in code update UI
4. **Template Import/Export** - Save/load templates as JSON files
5. **Expert Mode Toggle** - Easy switching between visual and code modes

### User Benefits
- Power users get direct code access
- Ability to do things UI doesn't support yet
- Copy/paste configurations easily
- Share templates between users
- Learn YAML/LaTeX by seeing generated code
- Fine-tune beyond UI limitations

---

## Architecture Design

### 1. Expert Mode Tab

Add a new tab to `TemplateEditorModal`:
- Tab name: "Expert" or "Code" 
- Icon: `</>` or `⚡`
- Contains 3 sub-sections with toggle buttons

#### Sub-sections:
1. **YAML Editor** - Edit Pandoc YAML frontmatter
2. **LaTeX Editor** - Edit LaTeX header-includes  
3. **JSON Import/Export** - Load/save complete template

### 2. Code Editor Component

Create a new `CodeEditorComponent` class:

```typescript
class CodeEditorComponent {
    private container: HTMLElement;
    private textarea: HTMLTextAreaElement;
    private language: 'yaml' | 'latex' | 'json';
    private onChangeCallback: (value: string) => void;
    
    constructor(
        container: HTMLElement,
        language: 'yaml' | 'latex' | 'json',
        initialValue: string,
        onChange: (value: string) => void
    );
    
    // Methods
    getValue(): string;
    setValue(value: string): void;
    setError(message: string): void;
    clearError(): void;
}
```

**Features:**
- Monospace font with proper sizing
- Line numbers
- Basic syntax highlighting (CSS-based)
- Tab indentation (spaces)
- Auto-resize
- Error display area
- Copy button

**Why not Monaco/CodeMirror?**
- Obsidian already includes CodeMirror for note editing
- We can leverage Obsidian's existing editor or use plain textarea
- Lighter weight, faster loading
- Better integration with Obsidian theme

### 3. Synchronization Strategy

#### UI → Code (Easy)
When user changes UI settings:
1. Update `this.config` (already happening)
2. Regenerate YAML/LaTeX
3. Update code editor value
4. This already works via preview tab

#### Code → UI (Complex)
When user edits YAML/LaTeX:
1. Parse the code
2. Validate structure
3. Extract values into `TemplateConfiguration`
4. Update `this.config`
5. Re-render current UI tab (if not on Expert tab)

**Challenge:** Not all YAML/LaTeX maps to UI
- Some LaTeX commands aren't in our config
- User might add custom YAML fields
- Need to preserve "extra" content

**Solution:** Hybrid approach
- Parse what we recognize → update config
- Store unrecognized content in `config.customYAML` and `config.customLaTeX`
- Append custom content to generated output

### 4. Import/Export Design

#### Export Format (JSON)
```json
{
    "version": "1.0",
    "metadata": {
        "name": "My Template",
        "description": "...",
        "author": "User Name",
        "created": 1234567890,
        "modified": 1234567890
    },
    "configuration": {
        // Full TemplateConfiguration object
    }
}
```

#### Import Process
1. User clicks "Import Template"
2. File picker opens (`.json` files)
3. Read and parse JSON
4. Validate structure
5. Load into current config
6. Re-render all tabs

#### Export Process
1. User clicks "Export Template"
2. Generate JSON from current config
3. Trigger file download
4. Filename: `{template-name}-{date}.json`

---

## Implementation Steps

### Step 1: Add Expert Tab to Modal

**File:** `src/export/TemplateEditorModal.ts`

```typescript
type EditorTab = 
    | 'document' 
    | 'typography' 
    | 'headers' 
    | 'chapters' 
    | 'content' 
    | 'advanced' 
    | 'expert'    // NEW
    | 'preview';

// In renderTabs():
{ id: 'expert', label: 'Expert', icon: '⚡' },
```

### Step 2: Create Code Editor Component

**New File:** `src/export/CodeEditorComponent.ts`

```typescript
export class CodeEditorComponent {
    private container: HTMLElement;
    private editorContainer: HTMLElement;
    private textarea: HTMLTextAreaElement;
    private errorDisplay: HTMLElement;
    private language: 'yaml' | 'latex' | 'json';
    private onChangeCallback?: (value: string) => void;
    
    constructor(
        container: HTMLElement,
        language: 'yaml' | 'latex' | 'json',
        options?: {
            initialValue?: string;
            onChange?: (value: string) => void;
            readOnly?: boolean;
            lineNumbers?: boolean;
        }
    ) {
        this.container = container;
        this.language = language;
        this.onChangeCallback = options?.onChange;
        
        this.render(options);
    }
    
    private render(options?: any) {
        // Create editor container
        this.editorContainer = this.container.createDiv({ 
            cls: 'code-editor-container' 
        });
        
        // Create toolbar
        const toolbar = this.editorContainer.createDiv({ 
            cls: 'code-editor-toolbar' 
        });
        
        toolbar.createSpan({ 
            text: this.language.toUpperCase(),
            cls: 'code-editor-language' 
        });
        
        const copyBtn = toolbar.createEl('button', {
            text: '📋 Copy',
            cls: 'code-editor-copy-btn'
        });
        
        copyBtn.addEventListener('click', () => this.copyToClipboard());
        
        // Create textarea
        this.textarea = this.editorContainer.createEl('textarea', {
            cls: `code-editor-textarea code-editor-${this.language}`,
            attr: {
                spellcheck: 'false',
                wrap: 'off'
            }
        });
        
        if (options?.initialValue) {
            this.textarea.value = options.initialValue;
        }
        
        if (options?.readOnly) {
            this.textarea.readOnly = true;
        }
        
        // Setup change handler
        this.textarea.addEventListener('input', () => {
            this.clearError();
            if (this.onChangeCallback) {
                this.onChangeCallback(this.textarea.value);
            }
        });
        
        // Handle tab key for indentation
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.textarea.selectionStart;
                const end = this.textarea.selectionEnd;
                const value = this.textarea.value;
                
                // Insert 2 spaces
                this.textarea.value = 
                    value.substring(0, start) + 
                    '  ' + 
                    value.substring(end);
                
                this.textarea.selectionStart = 
                    this.textarea.selectionEnd = start + 2;
            }
        });
        
        // Create error display
        this.errorDisplay = this.editorContainer.createDiv({ 
            cls: 'code-editor-error' 
        });
        this.errorDisplay.style.display = 'none';
    }
    
    getValue(): string {
        return this.textarea.value;
    }
    
    setValue(value: string): void {
        this.textarea.value = value;
        this.clearError();
    }
    
    setError(message: string): void {
        this.errorDisplay.textContent = `⚠️ ${message}`;
        this.errorDisplay.style.display = 'block';
        this.textarea.addClass('has-error');
    }
    
    clearError(): void {
        this.errorDisplay.style.display = 'none';
        this.textarea.removeClass('has-error');
    }
    
    private copyToClipboard(): void {
        navigator.clipboard.writeText(this.textarea.value);
        // Could add visual feedback here
    }
}
```

### Step 3: Render Expert Tab

**File:** `src/export/TemplateEditorModal.ts`

```typescript
private renderExpertTab() {
    const container = this.contentContainer;
    
    container.createEl('h3', { 
        text: 'Expert Mode', 
        cls: 'template-section-title' 
    });
    
    const info = container.createDiv({ cls: 'template-info-box' });
    info.innerHTML = `
        <strong>⚡ Expert Mode:</strong> Direct access to YAML and LaTeX code.
        Changes made here will update the visual editor and vice versa.
    `;
    
    // Section: YAML Editor
    this.renderYAMLEditor(container);
    
    // Section: LaTeX Editor
    this.renderLaTeXEditor(container);
    
    // Section: Import/Export
    this.renderImportExport(container);
}

private renderYAMLEditor(container: HTMLElement) {
    const section = container.createDiv({ cls: 'expert-section' });
    
    const header = section.createDiv({ cls: 'expert-section-header' });
    header.createEl('h4', { text: 'Pandoc YAML Configuration' });
    
    const toggle = header.createEl('button', {
        text: 'Show YAML',
        cls: 'expert-toggle-btn'
    });
    
    const editorContainer = section.createDiv({ 
        cls: 'expert-editor-container' 
    });
    editorContainer.style.display = 'none';
    
    let editor: CodeEditorComponent | null = null;
    
    toggle.addEventListener('click', () => {
        if (editorContainer.style.display === 'none') {
            // Show editor
            editorContainer.style.display = 'block';
            toggle.textContent = 'Hide YAML';
            
            if (!editor) {
                const yamlGen = new YAMLGenerator();
                const yaml = yamlGen.generate(this.config);
                
                editor = new CodeEditorComponent(
                    editorContainer,
                    'yaml',
                    {
                        initialValue: yaml,
                        onChange: (value) => this.handleYAMLChange(value)
                    }
                );
            }
        } else {
            // Hide editor
            editorContainer.style.display = 'none';
            toggle.textContent = 'Show YAML';
        }
    });
}

private renderLaTeXEditor(container: HTMLElement) {
    // Similar structure to YAML editor
}

private renderImportExport(container: HTMLElement) {
    const section = container.createDiv({ cls: 'expert-section' });
    
    section.createEl('h4', { text: 'Import/Export Template' });
    
    const buttonGroup = section.createDiv({ 
        cls: 'expert-button-group' 
    });
    
    // Import button
    const importBtn = buttonGroup.createEl('button', {
        text: '📥 Import from JSON',
        cls: 'expert-action-btn'
    });
    
    importBtn.addEventListener('click', () => this.importTemplate());
    
    // Export button
    const exportBtn = buttonGroup.createEl('button', {
        text: '📤 Export as JSON',
        cls: 'expert-action-btn mod-cta'
    });
    
    exportBtn.addEventListener('click', () => this.exportTemplate());
}
```

### Step 4: Implement YAML Parsing

**New File:** `src/export/YAMLParser.ts`

```typescript
import yaml from 'js-yaml';
import type { TemplateConfiguration } from './TemplateConfiguration';

export class YAMLParser {
    /**
     * Parse YAML string into TemplateConfiguration
     * Returns null if parsing fails
     */
    parse(yamlString: string): TemplateConfiguration | null {
        try {
            const parsed = yaml.load(yamlString) as any;
            
            // Map YAML fields to our configuration
            const config: Partial<TemplateConfiguration> = {
                document: {
                    documentClass: parsed.documentclass || 'book',
                    // ... map other fields
                },
                // ... map other sections
            };
            
            // Store any unrecognized YAML for preservation
            config.customYAML = this.extractCustomFields(parsed);
            
            return config as TemplateConfiguration;
        } catch (error) {
            console.error('YAML parse error:', error);
            return null;
        }
    }
    
    private extractCustomFields(parsed: any): string {
        // Extract fields we don't recognize
        // Return as YAML string for preservation
        return '';
    }
}
```

### Step 5: Implement LaTeX Parsing

**New File:** `src/export/LaTeXParser.ts`

```typescript
export class LaTeXParser {
    /**
     * Parse LaTeX string into configuration
     * This is more challenging than YAML due to LaTeX complexity
     */
    parse(latexString: string): Partial<TemplateConfiguration> | null {
        try {
            const config: Partial<TemplateConfiguration> = {};
            
            // Extract geometry settings
            const geometryMatch = latexString.match(
                /\\usepackage\[([^\]]+)\]{geometry}/
            );
            if (geometryMatch) {
                config.geometry = this.parseGeometry(geometryMatch[1]);
            }
            
            // Extract font settings
            const fontMatch = latexString.match(
                /\\setmainfont{([^}]+)}/
            );
            if (fontMatch) {
                if (!config.typography) config.typography = {};
                config.typography.bodyFont = fontMatch[1];
            }
            
            // ... more parsing
            
            // Store unrecognized LaTeX
            config.customLaTeX = this.extractCustomLaTeX(latexString);
            
            return config;
        } catch (error) {
            console.error('LaTeX parse error:', error);
            return null;
        }
    }
    
    private parseGeometry(geometryString: string): any {
        // Parse geometry options
        // Example: "letterpaper,top=1in,bottom=1in"
        const options: any = {};
        
        const pairs = geometryString.split(',');
        for (const pair of pairs) {
            const [key, value] = pair.split('=').map(s => s.trim());
            if (value) {
                options[key] = value;
            } else {
                options.paperSize = key;
            }
        }
        
        return options;
    }
    
    private extractCustomLaTeX(latexString: string): string {
        // Extract LaTeX we don't recognize
        // This is complex - might just store entire input
        return '';
    }
}
```

### Step 6: Handle Code Changes

**File:** `src/export/TemplateEditorModal.ts`

```typescript
private handleYAMLChange(yamlString: string): void {
    // Debounce to avoid parsing on every keystroke
    if (this.yamlParseTimeout) {
        clearTimeout(this.yamlParseTimeout);
    }
    
    this.yamlParseTimeout = setTimeout(() => {
        const parser = new YAMLParser();
        const parsed = parser.parse(yamlString);
        
        if (parsed) {
            // Update config
            Object.assign(this.config, parsed);
            this.config.modifiedAt = Date.now();
            
            // Update preview
            this.updatePreview();
            
            // Re-render current tab if not on Expert tab
            if (this.currentTab !== 'expert') {
                this.renderCurrentTab();
            }
        } else {
            // Show error in editor
            // (pass error display callback to editor)
        }
    }, 500); // 500ms debounce
}

private handleLaTeXChange(latexString: string): void {
    // Similar to YAML handler
}
```

### Step 7: Implement Import/Export

**File:** `src/export/TemplateEditorModal.ts`

```typescript
private async importTemplate(): Promise<void> {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const imported = JSON.parse(text);
            
            // Validate structure
            if (!imported.version || !imported.configuration) {
                throw new Error('Invalid template file format');
            }
            
            // Load configuration
            this.config = imported.configuration;
            this.config.modifiedAt = Date.now();
            
            // Re-render entire modal
            this.onOpen();
            
            // Show success message
            new Notice('Template imported successfully');
        } catch (error) {
            new Notice(`Import failed: ${error.message}`);
        }
    });
    
    input.click();
}

private exportTemplate(): void {
    // Create export object
    const exportData = {
        version: '1.0',
        metadata: {
            name: this.config.name,
            description: this.config.description,
            author: this.config.author || 'Unknown',
            created: this.config.createdAt || Date.now(),
            modified: this.config.modifiedAt
        },
        configuration: this.config
    };
    
    // Convert to JSON
    const json = JSON.stringify(exportData, null, 2);
    
    // Create blob and download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.config.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    new Notice('Template exported successfully');
}
```

### Step 8: Add CSS Styling

**File:** `styles.css`

```css
/* ============================================
   CODE EDITOR COMPONENT
   ============================================ */

.code-editor-container {
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    overflow: hidden;
    background: var(--background-primary);
}

.code-editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
}

.code-editor-language {
    font-size: 0.75em;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.code-editor-copy-btn {
    padding: 4px 8px;
    font-size: 0.85em;
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    background: var(--interactive-normal);
    color: var(--text-normal);
    cursor: pointer;
    transition: all 0.2s ease;
}

.code-editor-copy-btn:hover {
    background: var(--interactive-hover);
}

.code-editor-textarea {
    width: 100%;
    min-height: 300px;
    max-height: 500px;
    padding: 12px;
    border: none;
    resize: vertical;
    font-family: var(--font-monospace);
    font-size: 0.9em;
    line-height: 1.5;
    background: var(--background-primary);
    color: var(--text-normal);
    tab-size: 2;
}

.code-editor-textarea:focus {
    outline: none;
}

.code-editor-textarea.has-error {
    border-left: 3px solid var(--text-error);
}

.code-editor-error {
    padding: 8px 12px;
    background: var(--background-modifier-error);
    color: var(--text-error);
    font-size: 0.9em;
    border-top: 1px solid var(--background-modifier-border);
}

/* Expert mode sections */
.expert-section {
    margin-bottom: 24px;
    padding: 16px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    background: var(--background-secondary);
}

.expert-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.expert-section-header h4 {
    margin: 0;
    font-size: 1.1em;
    font-weight: 600;
}

.expert-toggle-btn {
    padding: 6px 12px;
    font-size: 0.9em;
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    background: var(--interactive-normal);
    color: var(--text-normal);
    cursor: pointer;
    transition: all 0.2s ease;
}

.expert-toggle-btn:hover {
    background: var(--interactive-hover);
}

.expert-editor-container {
    margin-top: 12px;
}

.expert-button-group {
    display: flex;
    gap: 12px;
    margin-top: 12px;
}

.expert-action-btn {
    flex: 1;
    padding: 8px 16px;
    border: 2px solid var(--background-modifier-border);
    border-radius: 6px;
    background: var(--interactive-normal);
    color: var(--text-normal);
    font-size: 0.95em;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.expert-action-btn:hover {
    background: var(--interactive-hover);
    border-color: var(--interactive-accent);
    transform: translateY(-1px);
}

.expert-action-btn.mod-cta {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
}

.expert-action-btn.mod-cta:hover {
    background: var(--interactive-accent-hover);
}
```

---

## Complexity Analysis

### Easy Parts
- ✅ Adding Expert tab
- ✅ Creating code editor component
- ✅ Displaying generated YAML/LaTeX
- ✅ JSON import/export

### Medium Parts
- ⚠️ YAML parsing (use js-yaml library)
- ⚠️ UI updates from code changes
- ⚠️ Error handling and validation

### Hard Parts
- ❗ LaTeX parsing (complex, many edge cases)
- ❗ Preserving custom YAML/LaTeX
- ❗ Bidirectional sync without conflicts
- ❗ Handling parse errors gracefully

---

## Proposed Simplification

### Phase 5a: Read-Only Expert Mode (Simpler)
Start with viewing code only:
1. Add Expert tab
2. Show generated YAML/LaTeX (read-only)
3. Add copy buttons
4. Add JSON import/export
5. **No bidirectional sync** (avoids parsing complexity)

**Benefits:**
- Much simpler implementation
- Still very useful
- No parsing bugs
- Users can copy/paste to external editors if needed

### Phase 5b: Full Expert Mode (Later)
Add editing after Phase 5a is stable:
1. Make editors editable
2. Add YAML parser
3. Add LaTeX parser (basic)
4. Implement sync logic
5. Handle edge cases

---

## Recommendation

**Start with Phase 5a (Read-Only Expert Mode)**

This provides immediate value with much less complexity:
- Users can view generated code
- Users can export/import templates
- Users can copy code to external editors
- No risk of parse errors breaking UI
- Foundation for Phase 5b

**Then add Phase 5b (Editable) if user feedback demands it.**

---

## Implementation Estimate

### Phase 5a (Read-Only)
- **Complexity:** Medium
- **Time:** 2-3 hours
- **Risk:** Low
- **Files:** 3 new, 2 modified
- **Lines:** ~800

### Phase 5b (Editable)
- **Complexity:** High
- **Time:** 6-8 hours
- **Risk:** Medium-High
- **Files:** 2 new, 3 modified
- **Lines:** ~1,500

---

## Next Steps

**Recommendation: Implement Phase 5a first**

1. Create `CodeEditorComponent.ts`
2. Add Expert tab to `TemplateEditorModal.ts`
3. Render read-only YAML editor
4. Render read-only LaTeX editor
5. Add JSON import/export
6. Add CSS styling
7. Test and document

**Total: ~800 lines, medium complexity, high value**

This gives users the expert features they need without the complexity of bidirectional sync.

---

## Questions to Consider

1. **Should we start with Phase 5a or jump to 5b?**
   - Recommendation: Start with 5a

2. **Do we need LaTeX editing?**
   - Most users will edit YAML, not LaTeX
   - Could skip LaTeX editor entirely

3. **Should import/export be in Expert tab or main UI?**
   - Expert tab makes sense (advanced feature)
   - Could add to footer later for discoverability

4. **Do we need syntax highlighting?**
   - Nice to have but not essential
   - Can use CSS for basic highlighting
   - Full highlighting requires CodeMirror integration

Let me know which approach you'd like to take!
