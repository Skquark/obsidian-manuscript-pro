/**
 * Template & Snippet Dialogs
 * UI for inserting templates and snippets with variable inputs
 */

import { App, Modal, Setting, Notice } from 'obsidian';

import type { Template, Snippet, TemplateVariable } from './TemplateInterfaces';

/**
 * Template Selector Modal
 */
export class TemplateSelectorModal extends Modal {
	private templates: Template[];
	private onSelect: (template: Template) => void;
	private searchQuery = '';

	constructor(app: App, templates: Template[], onSelect: (template: Template) => void) {
		super(app);
		this.templates = templates;
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('latex-concealer-template-selector');

		// Title
		contentEl.createEl('h2', { text: 'Select Template' });

		// Search
		new Setting(contentEl).setName('Search').addText((text) =>
			text
				.setPlaceholder('Search templates...')
				.setValue(this.searchQuery)
				.onChange((value) => {
					this.searchQuery = value;
					this.renderTemplateList();
				}),
		);

		// Template list container
		const listContainer = contentEl.createDiv('template-list-container');
		this.renderTemplateList(listContainer);
	}

	private renderTemplateList(container?: HTMLElement) {
		const listContainer = container || (this.contentEl.querySelector('.template-list-container') as HTMLElement);
		if (!listContainer) return;

		listContainer.empty();

		// Filter templates
		const filteredTemplates =
			this.searchQuery ?
				this.templates.filter(
					(t) =>
						t.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
						t.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
						t.tags.some((tag) => tag.toLowerCase().includes(this.searchQuery.toLowerCase())),
				)
			:	this.templates;

		// Group by category
		const categories = new Map<string, Template[]>();
		filteredTemplates.forEach((template) => {
			if (!categories.has(template.category)) {
				categories.set(template.category, []);
			}
			categories.get(template.category)!.push(template);
		});

		// Render categories
		categories.forEach((templates, category) => {
			const categoryEl = listContainer.createDiv('template-category');
			categoryEl.createEl('h3', { text: category.charAt(0).toUpperCase() + category.slice(1) });

			templates.forEach((template) => {
				const templateEl = categoryEl.createDiv('template-item');

				templateEl.createEl('div', {
					text: template.name,
					cls: 'template-name',
				});

				templateEl.createEl('div', {
					text: template.description,
					cls: 'template-description',
				});

				if (template.isBuiltIn) {
					templateEl.createEl('span', {
						text: 'Built-in',
						cls: 'template-badge',
					});
				}

				templateEl.addEventListener('click', () => {
					this.onSelect(template);
					this.close();
				});
			});
		});

		if (filteredTemplates.length === 0) {
			listContainer.createEl('p', {
				text: 'No templates found',
				cls: 'template-empty',
			});
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Template Variable Input Modal
 */
export class TemplateVariableModal extends Modal {
	private template?: Template;
	private snippet?: Snippet;
	private variableValues: Record<string, string> = {};
	private onSubmit: (values: Record<string, string>) => void;
	private plugin?: any; // LatexPandocConcealerPlugin (optional for autocomplete)

	constructor(app: App, item: Template | Snippet, onSubmit: (values: Record<string, string>) => void, plugin?: any) {
		super(app);
		if ('trigger' in item) {
			this.snippet = item;
		} else {
			this.template = item;
		}
		this.onSubmit = onSubmit;
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('latex-concealer-variable-input');

		const item = this.template || this.snippet;
		if (!item) return;

		// Title
		contentEl.createEl('h2', { text: `Insert ${this.template ? 'Template' : 'Snippet'}: ${item.name}` });

		// Description
		if (item.description) {
			contentEl.createEl('p', {
				text: item.description,
				cls: 'variable-description',
			});
		}

		// Load auto-suggestions if plugin is available
		if (this.plugin?.templateVariableHelper && item.variables.length > 0) {
			const activeFile = this.app.workspace.getActiveFile();
			const suggestions = await this.plugin.templateVariableHelper.getSuggestedValues(item.variables, activeFile);

			// Pre-fill suggested values
			Object.assign(this.variableValues, suggestions);
		}

		// Variables
		if (item.variables.length === 0) {
			// No variables, just show insert button
			new Setting(contentEl).addButton((btn) =>
				btn
					.setButtonText('Insert')
					.setCta()
					.onClick(() => {
						this.onSubmit(this.variableValues);
						this.close();
					}),
			);
		} else {
			// Create input for each variable
			item.variables.forEach((variable) => {
				this.renderVariableInput(contentEl, variable);
			});

			// Buttons
			const buttonContainer = contentEl.createDiv('variable-buttons');

			new Setting(buttonContainer)
				.addButton((btn) =>
					btn.setButtonText('Cancel').onClick(() => {
						this.close();
					}),
				)
				.addButton((btn) =>
					btn
						.setButtonText('Insert')
						.setCta()
						.onClick(() => {
							// Validate required fields
							const missingRequired = item.variables
								.filter((v) => v.required && !this.variableValues[v.name])
								.map((v) => v.label);

							if (missingRequired.length > 0) {
								new Notice(`Missing required fields: ${missingRequired.join(', ')}`);
								return;
							}

							this.onSubmit(this.variableValues);
							this.close();
						}),
				);
		}
	}

	private renderVariableInput(container: HTMLElement, variable: TemplateVariable) {
		const setting = new Setting(container).setName(variable.label);

		if (variable.required) {
			setting.setName(`${variable.label} *`);
		}

		// Get current value (from suggestions or default)
		const currentValue = this.variableValues[variable.name] || variable.defaultValue || '';

		switch (variable.type) {
			case 'number':
				setting.addText((text) =>
					text
						.setPlaceholder(variable.placeholder || '')
						.setValue(currentValue)
						.onChange((value) => {
							this.variableValues[variable.name] = value;
						}),
				);
				break;

			case 'date':
				setting.addText((text) =>
					text
						.setPlaceholder(variable.placeholder || 'YYYY-MM-DD')
						.setValue(currentValue)
						.onChange((value) => {
							this.variableValues[variable.name] = value;
						}),
				);
				break;

			case 'select':
				if (variable.options && variable.options.length > 0) {
					setting.addDropdown((dropdown) => {
						variable.options!.forEach((option) => {
							dropdown.addOption(option, option);
						});
						dropdown.setValue(variable.defaultValue || variable.options![0]);
						dropdown.onChange((value) => {
							this.variableValues[variable.name] = value;
						});

						// Set initial value
						this.variableValues[variable.name] = variable.defaultValue || variable.options![0];
					});
				}
				break;

			case 'text':
			default:
				setting.addTextArea((text) => {
					text
						.setPlaceholder(variable.placeholder || '')
						.setValue(currentValue)
						.onChange((value) => {
							this.variableValues[variable.name] = value;
						});

					// Auto-expand textarea
					text.inputEl.rows = 3;
					text.inputEl.style.width = '100%';
				});
				break;
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Snippet Selector Modal
 */
export class SnippetSelectorModal extends Modal {
	private snippets: Snippet[];
	private onSelect: (snippet: Snippet) => void;
	private searchQuery = '';

	constructor(app: App, snippets: Snippet[], onSelect: (snippet: Snippet) => void) {
		super(app);
		this.snippets = snippets;
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('latex-concealer-snippet-selector');

		// Title
		contentEl.createEl('h2', { text: 'Select Snippet' });

		// Search
		new Setting(contentEl).setName('Search').addText((text) =>
			text
				.setPlaceholder('Search snippets...')
				.setValue(this.searchQuery)
				.onChange((value) => {
					this.searchQuery = value;
					this.renderSnippetList();
				}),
		);

		// Snippet list container
		const listContainer = contentEl.createDiv('snippet-list-container');
		this.renderSnippetList(listContainer);
	}

	private renderSnippetList(container?: HTMLElement) {
		const listContainer = container || (this.contentEl.querySelector('.snippet-list-container') as HTMLElement);
		if (!listContainer) return;

		listContainer.empty();

		// Filter snippets
		const filteredSnippets =
			this.searchQuery ?
				this.snippets.filter(
					(s) =>
						s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
						s.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
						s.tags.some((tag) => tag.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
						(s.trigger && s.trigger.toLowerCase().includes(this.searchQuery.toLowerCase())),
				)
			:	this.snippets;

		// Group by category
		const categories = new Map<string, Snippet[]>();
		filteredSnippets.forEach((snippet) => {
			if (!categories.has(snippet.category)) {
				categories.set(snippet.category, []);
			}
			categories.get(snippet.category)!.push(snippet);
		});

		// Render categories
		categories.forEach((snippets, category) => {
			const categoryEl = listContainer.createDiv('snippet-category');
			categoryEl.createEl('h3', { text: category.charAt(0).toUpperCase() + category.slice(1) });

			snippets.forEach((snippet) => {
				const snippetEl = categoryEl.createDiv('snippet-item');

				const headerEl = snippetEl.createDiv('snippet-header');
				headerEl.createEl('span', {
					text: snippet.name,
					cls: 'snippet-name',
				});

				if (snippet.trigger) {
					headerEl.createEl('code', {
						text: snippet.trigger,
						cls: 'snippet-trigger',
					});
				}

				snippetEl.createEl('div', {
					text: snippet.description,
					cls: 'snippet-description',
				});

				if (snippet.isBuiltIn) {
					snippetEl.createEl('span', {
						text: 'Built-in',
						cls: 'snippet-badge',
					});
				}

				snippetEl.addEventListener('click', () => {
					this.onSelect(snippet);
					this.close();
				});
			});
		});

		if (filteredSnippets.length === 0) {
			listContainer.createEl('p', {
				text: 'No snippets found',
				cls: 'snippet-empty',
			});
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
