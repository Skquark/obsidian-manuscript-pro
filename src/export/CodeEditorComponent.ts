/**
 * Code Editor Component
 * Flexible code editor for YAML, LaTeX, and JSON with multiple modes
 */

export type CodeEditorLanguage = 'yaml' | 'latex' | 'json';
export type CodeEditorMode = 'view' | 'edit' | 'override';

export interface CodeEditorOptions {
	language: CodeEditorLanguage;
	mode?: CodeEditorMode;
	initialValue?: string;
	placeholder?: string;
	minHeight?: string;
	maxHeight?: string;
	showLineNumbers?: boolean;
	onChange?: (value: string) => void;
	onApply?: (value: string) => void;
	onModeChange?: (mode: CodeEditorMode) => void;
}

export class CodeEditorComponent {
	private container: HTMLElement;
	private editorContainer: HTMLElement;
	private toolbar: HTMLElement;
	private textarea: HTMLTextAreaElement;
	private errorDisplay: HTMLElement;
	private applyButton: HTMLButtonElement | null = null;
	private unsavedIndicator: HTMLElement | null = null;

	private language: CodeEditorLanguage;
	private mode: CodeEditorMode;
	private hasUnsavedChanges = false;
	private options: CodeEditorOptions;

	constructor(container: HTMLElement, options: CodeEditorOptions) {
		this.container = container;
		this.language = options.language;
		this.mode = options.mode || 'view';
		this.options = options;

		this.render();
	}

	/**
	 * Render the code editor
	 */
	private render(): void {
		this.container.empty();

		// Create editor container
		this.editorContainer = this.container.createDiv({
			cls: 'code-editor-container',
		});

		// Create toolbar
		this.toolbar = this.editorContainer.createDiv({
			cls: 'code-editor-toolbar',
		});

		this.renderToolbar();

		// Create textarea wrapper
		const textareaWrapper = this.editorContainer.createDiv({
			cls: 'code-editor-textarea-wrapper',
		});

		// Create textarea
		this.textarea = textareaWrapper.createEl('textarea', {
			cls: `code-editor-textarea code-editor-${this.language}`,
			attr: {
				spellcheck: 'false',
				wrap: 'off',
			},
		});

		// Set initial value
		if (this.options.initialValue) {
			this.textarea.value = this.options.initialValue;
		}

		// Set placeholder
		if (this.options.placeholder) {
			this.textarea.placeholder = this.options.placeholder;
		}

		// Set dimensions
		if (this.options.minHeight) {
			this.textarea.style.minHeight = this.options.minHeight;
		}
		if (this.options.maxHeight) {
			this.textarea.style.maxHeight = this.options.maxHeight;
		}

		// Set read-only based on mode
		this.textarea.readOnly = this.mode === 'view';

		// Setup event handlers
		this.textarea.addEventListener('input', () => {
			this.hasUnsavedChanges = true;
			this.updateToolbar();
			this.clearError();

			if (this.options.onChange) {
				this.options.onChange(this.textarea.value);
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
				this.textarea.value = value.substring(0, start) + '  ' + value.substring(end);

				this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
			}
		});

		// Create error display
		this.errorDisplay = this.editorContainer.createDiv({
			cls: 'code-editor-error',
		});
		this.errorDisplay.style.display = 'none';
	}

	/**
	 * Render toolbar with buttons and controls
	 */
	private renderToolbar(): void {
		this.toolbar.empty();

		// Left side: language label and mode controls
		const leftSide = this.toolbar.createDiv({ cls: 'code-editor-toolbar-left' });

		// Language label
		leftSide.createSpan({
			text: this.language.toUpperCase(),
			cls: 'code-editor-language',
		});

		// Mode toggle for YAML
		if (this.language === 'yaml') {
			const modeToggle = leftSide.createEl('button', {
				text: this.mode === 'view' ? '✏️ Edit' : '👁️ View',
				cls: 'code-editor-mode-btn',
			});

			modeToggle.addEventListener('click', () => {
				this.toggleMode();
			});
		}

		// Override checkbox for LaTeX
		if (this.language === 'latex') {
			const overrideLabel = leftSide.createDiv({ cls: 'code-editor-override' });

			const checkbox = overrideLabel.createEl('input', {
				type: 'checkbox',
				cls: 'code-editor-override-checkbox',
			});

			checkbox.checked = this.mode === 'override';

			checkbox.addEventListener('change', () => {
				this.setOverrideMode(checkbox.checked);
			});

			overrideLabel.createSpan({
				text: 'Override (expert)',
				cls: 'code-editor-override-label',
			});
		}

		// Unsaved indicator
		if (this.mode !== 'view') {
			this.unsavedIndicator = leftSide.createSpan({
				text: '● Unsaved changes',
				cls: 'code-editor-unsaved',
			});
			this.unsavedIndicator.style.display = this.hasUnsavedChanges ? 'inline' : 'none';
		}

		// Right side: action buttons
		const rightSide = this.toolbar.createDiv({ cls: 'code-editor-toolbar-right' });

		// Copy button (always visible)
		const copyBtn = rightSide.createEl('button', {
			text: '📋 Copy',
			cls: 'code-editor-copy-btn',
		});

		copyBtn.addEventListener('click', () => {
			this.copyToClipboard();
		});

		// Apply button (only in edit mode for YAML)
		if (this.mode === 'edit' && this.options.onApply) {
			this.applyButton = rightSide.createEl('button', {
				text: '✓ Apply to UI',
				cls: 'code-editor-apply-btn mod-cta',
			});

			this.applyButton.disabled = !this.hasUnsavedChanges;

			this.applyButton.addEventListener('click', () => {
				this.applyChanges();
			});
		}
	}

	/**
	 * Update toolbar state
	 */
	private updateToolbar(): void {
		// Update unsaved indicator
		if (this.unsavedIndicator) {
			this.unsavedIndicator.style.display = this.hasUnsavedChanges ? 'inline' : 'none';
		}

		// Update apply button
		if (this.applyButton) {
			(this.applyButton as HTMLButtonElement).disabled = !this.hasUnsavedChanges;
		}
	}

	/**
	 * Toggle between view and edit mode
	 */
	private toggleMode(): void {
		if (this.mode === 'view') {
			// Switch to edit mode
			this.mode = 'edit';
			this.textarea.readOnly = false;
		} else {
			// Switch to view mode
			if (this.hasUnsavedChanges) {
				// Warn about unsaved changes
				const confirmed = confirm('You have unsaved changes. Discard them?');
				if (!confirmed) {
					return;
				}
				this.hasUnsavedChanges = false;
			}
			this.mode = 'view';
			this.textarea.readOnly = true;
		}

		// Notify mode change
		if (this.options.onModeChange) {
			this.options.onModeChange(this.mode);
		}

		// Re-render toolbar
		this.renderToolbar();
	}

	/**
	 * Set LaTeX override mode
	 */
	private setOverrideMode(enabled: boolean): void {
		if (enabled) {
			this.mode = 'override';
			this.textarea.readOnly = false;
		} else {
			if (this.hasUnsavedChanges) {
				const confirmed = confirm('Disable override? Your custom LaTeX will be replaced with UI-generated code.');
				if (!confirmed) {
					// Re-check the checkbox
					const checkbox = this.toolbar.querySelector('.code-editor-override-checkbox') as HTMLInputElement;
					if (checkbox) checkbox.checked = true;
					return;
				}
			}
			this.mode = 'view';
			this.textarea.readOnly = true;
			this.hasUnsavedChanges = false;
		}

		// Notify mode change
		if (this.options.onModeChange) {
			this.options.onModeChange(this.mode);
		}

		// Re-render toolbar
		this.renderToolbar();
	}

	/**
	 * Apply changes to UI
	 */
	private applyChanges(): void {
		if (this.options.onApply) {
			this.options.onApply(this.textarea.value);
			this.hasUnsavedChanges = false;
			this.updateToolbar();
		}
	}

	/**
	 * Copy content to clipboard
	 */
	private copyToClipboard(): void {
		navigator.clipboard.writeText(this.textarea.value).then(
			() => {
				// Show success feedback
				const copyBtn = this.toolbar.querySelector('.code-editor-copy-btn') as HTMLElement;
				if (copyBtn) {
					const originalText = copyBtn.textContent;
					copyBtn.textContent = '✓ Copied!';
					setTimeout(() => {
						copyBtn.textContent = originalText;
					}, 2000);
				}
			},
			(err) => {
				console.error('Failed to copy:', err);
			},
		);
	}

	/**
	 * Get current value
	 */
	getValue(): string {
		return this.textarea.value;
	}

	/**
	 * Set value programmatically
	 */
	setValue(value: string): void {
		this.textarea.value = value;
		this.hasUnsavedChanges = false;
		this.updateToolbar();
		this.clearError();
	}

	/**
	 * Get current mode
	 */
	getMode(): CodeEditorMode {
		return this.mode;
	}

	/**
	 * Check if has unsaved changes
	 */
	hasChanges(): boolean {
		return this.hasUnsavedChanges;
	}

	/**
	 * Set error message
	 */
	setError(message: string): void {
		this.errorDisplay.textContent = `⚠️ ${message}`;
		this.errorDisplay.style.display = 'block';
		this.textarea.addClass('has-error');
	}

	/**
	 * Clear error message
	 */
	clearError(): void {
		this.errorDisplay.style.display = 'none';
		this.textarea.removeClass('has-error');
	}

	/**
	 * Reset to initial value
	 */
	reset(): void {
		if (this.options.initialValue) {
			this.textarea.value = this.options.initialValue;
		} else {
			this.textarea.value = '';
		}
		this.hasUnsavedChanges = false;
		this.updateToolbar();
		this.clearError();
	}

	/**
	 * Destroy the editor
	 */
	destroy(): void {
		this.container.empty();
	}
}
