import { App, Modal, Setting, Notice } from 'obsidian';
import { StyleRule, RuleCategory, IssueSeverity } from './StyleCheckerInterfaces';

/**
 * Modal for creating and editing custom style rules
 */
export class CustomRuleModal extends Modal {
	private rule: StyleRule;
	private onSave: (rule: StyleRule) => void;
	private isNew: boolean;
	private testText: string = '';
	private previewContainer: HTMLElement | null = null;

	constructor(
		app: App,
		rule: StyleRule | null,
		onSave: (rule: StyleRule) => void
	) {
		super(app);
		this.onSave = onSave;
		this.isNew = !rule;

		// Create new rule or deep copy existing
		this.rule = rule ? JSON.parse(JSON.stringify(rule)) : {
			id: `custom-${Date.now()}`,
			name: '',
			description: '',
			category: 'custom',
			severity: 'warning',
			enabled: true,
			pattern: '',
			flags: 'g',
			scope: 'document',
			message: '',
			suggestion: '',
			autoFix: false,
			fixPattern: '',
			caseSensitive: false
		};
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('custom-rule-modal');

		contentEl.createEl('h2', { text: this.isNew ? 'Create Custom Rule' : 'Edit Custom Rule' });

		// Basic Info Section
		this.renderBasicInfo(contentEl);

		// Pattern Section
		this.renderPattern(contentEl);

		// Auto-Fix Section
		this.renderAutoFix(contentEl);

		// Advanced Section
		this.renderAdvanced(contentEl);

		// Test Section
		this.renderTest(contentEl);

		// Buttons
		this.renderButtons(contentEl);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	/**
	 * Render basic info fields
	 */
	private renderBasicInfo(container: HTMLElement): void {
		const section = container.createDiv('rule-section');
		section.createEl('h3', { text: 'Basic Information' });

		// Name
		new Setting(section)
			.setName('Rule Name')
			.setDesc('A descriptive name for this rule')
			.addText(text => text
				.setValue(this.rule.name)
				.setPlaceholder('e.g., Avoid passive voice')
				.onChange(value => {
					this.rule.name = value;
				})
			);

		// Description
		new Setting(section)
			.setName('Description')
			.setDesc('Detailed explanation of what this rule checks')
			.addTextArea(text => {
				text.setValue(this.rule.description)
					.setPlaceholder('e.g., Detects passive voice constructions that weaken writing')
					.onChange(value => {
						this.rule.description = value;
					});
				text.inputEl.rows = 3;
			});

		// Category
		new Setting(section)
			.setName('Category')
			.setDesc('Classification of this rule')
			.addDropdown(dropdown => {
				const categories: RuleCategory[] = [
					'custom',
					'punctuation',
					'formatting',
					'tense',
					'pov',
					'dialogue',
					'repetition',
					'readability',
					'academic',
					'latex'
				];

				categories.forEach(cat => {
					dropdown.addOption(cat, cat);
				});

				dropdown.setValue(this.rule.category)
					.onChange(value => {
						this.rule.category = value as RuleCategory;
					});
			});

		// Severity
		new Setting(section)
			.setName('Severity')
			.setDesc('How serious is this issue?')
			.addDropdown(dropdown => {
				const severities: IssueSeverity[] = ['error', 'warning', 'info', 'suggestion'];

				severities.forEach(sev => {
					dropdown.addOption(sev, sev);
				});

				dropdown.setValue(this.rule.severity)
					.onChange(value => {
						this.rule.severity = value as IssueSeverity;
					});
			});

		// Message
		new Setting(section)
			.setName('Issue Message')
			.setDesc('Message shown when this rule matches')
			.addText(text => text
				.setValue(this.rule.message || '')
				.setPlaceholder('e.g., Passive voice detected')
				.onChange(value => {
					this.rule.message = value;
				})
			);

		// Suggestion
		new Setting(section)
			.setName('Suggestion')
			.setDesc('Helpful suggestion for fixing the issue')
			.addText(text => text
				.setValue(this.rule.suggestion || '')
				.setPlaceholder('e.g., Consider using active voice')
				.onChange(value => {
					this.rule.suggestion = value;
				})
			);
	}

	/**
	 * Render pattern fields
	 */
	private renderPattern(container: HTMLElement): void {
		const section = container.createDiv('rule-section');
		section.createEl('h3', { text: 'Pattern Matching' });

		// Pattern
		new Setting(section)
			.setName('Regular Expression Pattern')
			.setDesc('JavaScript regex pattern to match (without delimiters)')
			.addTextArea(text => {
				text.setValue(this.rule.pattern || '')
					.setPlaceholder('e.g., \\b(was|were|been)\\s+(\\w+ed)\\b')
					.onChange(value => {
						this.rule.pattern = value;
						this.updatePreview();
					});
				text.inputEl.rows = 3;
				text.inputEl.style.fontFamily = 'monospace';
			});

		// Regex help
		const help = section.createDiv('regex-help');
		help.createEl('small', { text: 'Common patterns: ' });
		help.createEl('code', { text: '\\b' });
		help.createSpan({ text: ' word boundary, ' });
		help.createEl('code', { text: '\\s+' });
		help.createSpan({ text: ' whitespace, ' });
		help.createEl('code', { text: '[a-z]+' });
		help.createSpan({ text: ' letters, ' });
		help.createEl('code', { text: '(...)' });
		help.createSpan({ text: ' capture group' });

		// Flags
		new Setting(section)
			.setName('Regex Flags')
			.setDesc('Modifiers for pattern matching')
			.addText(text => text
				.setValue(this.rule.flags || 'g')
				.setPlaceholder('g')
				.onChange(value => {
					this.rule.flags = value;
					this.updatePreview();
				})
			);

		const flagsHelp = section.createDiv('flags-help');
		flagsHelp.createEl('small', { text: 'g=global, i=case-insensitive, m=multiline' });

		// Scope
		new Setting(section)
			.setName('Scope')
			.setDesc('Where to apply this rule')
			.addDropdown(dropdown => {
				dropdown.addOption('document', 'Entire document');
				dropdown.addOption('paragraph', 'Per paragraph');
				dropdown.addOption('sentence', 'Per sentence');
				dropdown.addOption('line', 'Per line');

				dropdown.setValue(this.rule.scope || 'document')
					.onChange(value => {
						this.rule.scope = value as any;
					});
			});
	}

	/**
	 * Render auto-fix fields
	 */
	private renderAutoFix(container: HTMLElement): void {
		const section = container.createDiv('rule-section');
		section.createEl('h3', { text: 'Auto-Fix (Optional)' });

		// Enable auto-fix
		new Setting(section)
			.setName('Enable Auto-Fix')
			.setDesc('Allow automatic correction of this issue')
			.addToggle(toggle => toggle
				.setValue(this.rule.autoFix || false)
				.onChange(value => {
					this.rule.autoFix = value;
					this.onOpen(); // Re-render to show/hide fix pattern
				})
			);

		// Fix pattern (only if auto-fix enabled)
		if (this.rule.autoFix) {
			new Setting(section)
				.setName('Replacement Pattern')
				.setDesc('Text to replace matched pattern (can use capture groups: $1, $2, etc.)')
				.addText(text => text
					.setValue(this.rule.fixPattern || '')
					.setPlaceholder('e.g., $2 by $1 (reverses passive voice)')
					.onChange(value => {
						this.rule.fixPattern = value;
					})
				);

			const fixHelp = section.createDiv('fix-help');
			fixHelp.createEl('small', { text: 'Use $1, $2, etc. to reference capture groups from the pattern' });
		}
	}

	/**
	 * Render advanced options
	 */
	private renderAdvanced(container: HTMLElement): void {
		const section = container.createDiv('rule-section');
		section.createEl('h3', { text: 'Advanced Options' });

		// Case sensitive
		new Setting(section)
			.setName('Case Sensitive')
			.setDesc('Match pattern case-sensitively')
			.addToggle(toggle => toggle
				.setValue(this.rule.caseSensitive || false)
				.onChange(value => {
					this.rule.caseSensitive = value;
				})
			);

		// Threshold
		new Setting(section)
			.setName('Threshold')
			.setDesc('Minimum count before flagging (for repetition rules)')
			.addText(text => text
				.setValue(this.rule.threshold?.toString() || '')
				.setPlaceholder('e.g., 3')
				.onChange(value => {
					const num = parseInt(value);
					if (!isNaN(num)) {
						this.rule.threshold = num;
					} else {
						delete this.rule.threshold;
					}
				})
			);

		// Enabled
		new Setting(section)
			.setName('Enabled')
			.setDesc('Rule is active and will be checked')
			.addToggle(toggle => toggle
				.setValue(this.rule.enabled)
				.onChange(value => {
					this.rule.enabled = value;
				})
			);
	}

	/**
	 * Render test section
	 */
	private renderTest(container: HTMLElement): void {
		const section = container.createDiv('rule-section');
		section.createEl('h3', { text: 'Test Your Rule' });

		// Test text input
		new Setting(section)
			.setName('Sample Text')
			.setDesc('Enter text to test your pattern')
			.addTextArea(text => {
				text.setValue(this.testText)
					.setPlaceholder('Enter sample text here...')
					.onChange(value => {
						this.testText = value;
						this.updatePreview();
					});
				text.inputEl.rows = 5;
			});

		// Preview container
		this.previewContainer = section.createDiv('rule-preview');
		this.updatePreview();
	}

	/**
	 * Update preview with current pattern
	 */
	private updatePreview(): void {
		if (!this.previewContainer) return;

		this.previewContainer.empty();

		if (!this.rule.pattern || !this.testText) {
			this.previewContainer.createEl('p', {
				text: 'Enter a pattern and sample text to see matches',
				cls: 'rule-preview-empty'
			});
			return;
		}

		try {
			const regex = new RegExp(this.rule.pattern, this.rule.flags || 'g');
			const matches: RegExpExecArray[] = [];
			let match: RegExpExecArray | null;

			regex.lastIndex = 0;
			while ((match = regex.exec(this.testText)) !== null) {
				matches.push(match);
				if (matches.length > 100) break; // Safety limit
			}

			if (matches.length === 0) {
				this.previewContainer.createEl('p', {
					text: '✗ No matches found',
					cls: 'rule-preview-no-match'
				});
			} else {
				const header = this.previewContainer.createDiv('rule-preview-header');
				header.createEl('strong', {
					text: `✓ ${matches.length} match${matches.length > 1 ? 'es' : ''} found`,
					cls: 'rule-preview-success'
				});

				// Show highlighted text
				const highlighted = this.previewContainer.createDiv('rule-preview-highlighted');
				let lastIndex = 0;
				let result = '';

				matches.forEach(m => {
					result += this.escapeHtml(this.testText.substring(lastIndex, m.index));
					result += `<mark>${this.escapeHtml(m[0])}</mark>`;
					lastIndex = m.index + m[0].length;
				});
				result += this.escapeHtml(this.testText.substring(lastIndex));

				highlighted.innerHTML = result;

				// Show capture groups
				if (matches[0].length > 1) {
					const groups = this.previewContainer.createDiv('rule-preview-groups');
					groups.createEl('strong', { text: 'Capture Groups:' });
					const groupList = groups.createEl('ul');
					for (let i = 1; i < matches[0].length; i++) {
						groupList.createEl('li', { text: `$${i}: "${matches[0][i]}"` });
					}
				}
			}
		} catch (error) {
			this.previewContainer.createEl('p', {
				text: `✗ Invalid regex: ${error.message}`,
				cls: 'rule-preview-error'
			});
		}
	}

	/**
	 * Escape HTML
	 */
	private escapeHtml(text: string): string {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	/**
	 * Render buttons
	 */
	private renderButtons(container: HTMLElement): void {
		const buttons = container.createDiv('rule-modal-buttons');

		const saveBtn = buttons.createEl('button', { text: 'Save Rule', cls: 'mod-cta' });
		saveBtn.addEventListener('click', () => this.save());

		const cancelBtn = buttons.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());
	}

	/**
	 * Validate and save rule
	 */
	private save(): void {
		// Validate
		if (!this.rule.name.trim()) {
			new Notice('Rule name is required');
			return;
		}

		if (!this.rule.pattern) {
			new Notice('Pattern is required');
			return;
		}

		// Test pattern is valid
		try {
			new RegExp(this.rule.pattern, this.rule.flags || 'g');
		} catch (error) {
			new Notice(`Invalid regex pattern: ${error.message}`);
			return;
		}

		if (!this.rule.message) {
			this.rule.message = this.rule.name;
		}

		this.onSave(this.rule);
		this.close();
		new Notice(`Rule "${this.rule.name}" saved`);
	}
}

/**
 * Modal for managing all custom rules
 */
export class CustomRulesManagerModal extends Modal {
	private customRules: StyleRule[];
	private onSave: (rules: StyleRule[]) => void;

	constructor(
		app: App,
		customRules: StyleRule[],
		onSave: (rules: StyleRule[]) => void
	) {
		super(app);
		this.customRules = JSON.parse(JSON.stringify(customRules)); // Deep copy
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('custom-rules-manager-modal');

		contentEl.createEl('h2', { text: 'Manage Custom Rules' });

		// Add new rule button
		const header = contentEl.createDiv('rules-manager-header');
		const addBtn = header.createEl('button', { text: 'Create New Rule', cls: 'mod-cta' });
		addBtn.addEventListener('click', () => this.createNewRule());

		// Rules list
		const list = contentEl.createDiv('custom-rules-list');
		this.renderRulesList(list);

		// Buttons
		const buttons = contentEl.createDiv('rules-manager-buttons');

		const saveBtn = buttons.createEl('button', { text: 'Save All', cls: 'mod-cta' });
		saveBtn.addEventListener('click', () => {
			this.onSave(this.customRules);
			this.close();
			new Notice('Custom rules saved');
		});

		const cancelBtn = buttons.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	/**
	 * Render list of custom rules
	 */
	private renderRulesList(container: HTMLElement): void {
		container.empty();

		if (this.customRules.length === 0) {
			container.createEl('p', {
				text: 'No custom rules yet. Create your first rule!',
				cls: 'rules-empty-state'
			});
			return;
		}

		this.customRules.forEach((rule, index) => {
			const ruleEl = container.createDiv('custom-rule-item');

			const info = ruleEl.createDiv('rule-item-info');
			info.createEl('strong', { text: rule.name });
			info.createEl('p', { text: rule.description, cls: 'rule-item-description' });

			const badges = info.createDiv('rule-item-badges');
			badges.createSpan({ text: rule.category, cls: 'rule-badge category' });
			badges.createSpan({ text: rule.severity, cls: `rule-badge severity-${rule.severity}` });
			if (!rule.enabled) {
				badges.createSpan({ text: 'disabled', cls: 'rule-badge disabled' });
			}

			const actions = ruleEl.createDiv('rule-item-actions');

			// Edit
			const editBtn = actions.createEl('button', { text: 'Edit' });
			editBtn.addEventListener('click', () => this.editRule(index));

			// Toggle
			const toggleBtn = actions.createEl('button', {
				text: rule.enabled ? 'Disable' : 'Enable'
			});
			toggleBtn.addEventListener('click', () => {
				this.customRules[index].enabled = !this.customRules[index].enabled;
				this.onOpen();
			});

			// Delete
			const deleteBtn = actions.createEl('button', { text: 'Delete', cls: 'mod-warning' });
			deleteBtn.addEventListener('click', () => this.deleteRule(index));
		});
	}

	/**
	 * Create new rule
	 */
	private createNewRule(): void {
		new CustomRuleModal(
			this.app,
			null,
			(rule) => {
				this.customRules.push(rule);
				this.onOpen();
			}
		).open();
	}

	/**
	 * Edit existing rule
	 */
	private editRule(index: number): void {
		new CustomRuleModal(
			this.app,
			this.customRules[index],
			(rule) => {
				this.customRules[index] = rule;
				this.onOpen();
			}
		).open();
	}

	/**
	 * Delete rule
	 */
	private deleteRule(index: number): void {
		const rule = this.customRules[index];
		const confirmed = confirm(`Delete rule "${rule.name}"?`);
		if (confirmed) {
			this.customRules.splice(index, 1);
			this.onOpen();
		}
	}
}
