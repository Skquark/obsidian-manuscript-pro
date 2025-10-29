/**
 * Template Browser Modal
 * Browse and select from journal/publisher template library
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../../main';
import {
	JOURNAL_TEMPLATE_LIBRARY,
	getTemplatesByCategory,
	searchTemplates,
	type JournalTemplate,
} from './JournalTemplates';

export class TemplateBrowserModal extends Modal {
	private plugin: LatexPandocConcealerPlugin;
	private onSelect: (template: JournalTemplate) => void;
	private currentCategory: 'all' | 'academic' | 'fiction' | 'technical' = 'all';
	private searchQuery = '';
	private selectedTemplate: JournalTemplate | null = null;

	constructor(app: App, plugin: LatexPandocConcealerPlugin, onSelect: (template: JournalTemplate) => void) {
		super(app);
		this.plugin = plugin;
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('template-browser-modal');

		// Header
		contentEl.createEl('h2', { text: 'Template Library' });
		contentEl.createEl('p', {
			text: 'Choose from pre-configured templates for academic journals, fiction submissions, and technical documents',
			cls: 'template-browser-description',
		});

		// Search bar
		const searchContainer = contentEl.createDiv({ cls: 'template-search-container' });
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search templates, publishers, or tags...',
			cls: 'template-search-input',
		});
		searchInput.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value;
			this.refreshTemplateList();
		});

		// Category tabs
		const tabsContainer = contentEl.createDiv({ cls: 'template-category-tabs' });
		this.createCategoryTab(tabsContainer, 'all', 'All Templates');
		this.createCategoryTab(tabsContainer, 'academic', 'Academic');
		this.createCategoryTab(tabsContainer, 'fiction', 'Fiction');
		this.createCategoryTab(tabsContainer, 'technical', 'Technical');

		// Template list
		const listContainer = contentEl.createDiv({ cls: 'template-list-container' });
		this.refreshTemplateList(listContainer);

		// Action buttons
		const buttonContainer = contentEl.createDiv({ cls: 'template-browser-buttons' });

		new Setting(buttonContainer)
			.addButton((btn) =>
				btn
					.setButtonText('Cancel')
					.onClick(() => {
						this.close();
					}),
			)
			.addButton((btn) =>
				btn
					.setButtonText('Use Template')
					.setCta()
					.onClick(() => {
						if (this.selectedTemplate) {
							this.onSelect(this.selectedTemplate);
							new Notice(`Applied template: ${this.selectedTemplate.name}`);
							this.close();
						} else {
							new Notice('Please select a template first');
						}
					}),
			);
	}

	private createCategoryTab(
		container: HTMLElement,
		category: 'all' | 'academic' | 'fiction' | 'technical',
		label: string,
	): void {
		const tab = container.createEl('button', {
			text: label,
			cls: 'template-category-tab',
		});

		if (category === this.currentCategory) {
			tab.addClass('is-active');
		}

		tab.addEventListener('click', () => {
			this.currentCategory = category;
			this.refreshTemplateList();

			// Update tab styling
			container.querySelectorAll('.template-category-tab').forEach((t) => {
				t.removeClass('is-active');
			});
			tab.addClass('is-active');
		});
	}

	private refreshTemplateList(container?: HTMLElement): void {
		const listContainer = container || (this.contentEl.querySelector('.template-list-container') as HTMLElement);
		if (!listContainer) return;

		listContainer.empty();

		// Get filtered templates
		let templates = this.getFilteredTemplates();

		if (templates.length === 0) {
			listContainer.createEl('p', {
				text: 'No templates found matching your criteria.',
				cls: 'template-no-results',
			});
			return;
		}

		// Group by publisher for academic, otherwise list all
		if (this.currentCategory === 'academic' && !this.searchQuery) {
			this.renderGroupedTemplates(listContainer, templates);
		} else {
			this.renderTemplateList(listContainer, templates);
		}
	}

	private getFilteredTemplates(): JournalTemplate[] {
		let templates: JournalTemplate[];

		// Apply search filter
		if (this.searchQuery) {
			templates = searchTemplates(this.searchQuery);
		} else if (this.currentCategory === 'all') {
			templates = JOURNAL_TEMPLATE_LIBRARY;
		} else {
			templates = getTemplatesByCategory(this.currentCategory);
		}

		return templates;
	}

	private renderTemplateList(container: HTMLElement, templates: JournalTemplate[]): void {
		for (const template of templates) {
			this.createTemplateCard(container, template);
		}
	}

	private renderGroupedTemplates(container: HTMLElement, templates: JournalTemplate[]): void {
		// Group by publisher
		const grouped = new Map<string, JournalTemplate[]>();

		for (const template of templates) {
			const publisher = template.publisher || 'Other';
			if (!grouped.has(publisher)) {
				grouped.set(publisher, []);
			}
			grouped.get(publisher)!.push(template);
		}

		// Render each group
		for (const [publisher, publisherTemplates] of grouped.entries()) {
			const groupHeader = container.createEl('h3', {
				text: publisher,
				cls: 'template-group-header',
			});

			for (const template of publisherTemplates) {
				this.createTemplateCard(container, template);
			}
		}
	}

	private createTemplateCard(container: HTMLElement, template: JournalTemplate): void {
		const card = container.createDiv({ cls: 'template-card' });

		if (this.selectedTemplate?.id === template.id) {
			card.addClass('is-selected');
		}

		// Header
		const header = card.createDiv({ cls: 'template-card-header' });
		header.createEl('h4', { text: template.name });

		if (template.publisher) {
			header.createEl('span', {
				text: template.publisher,
				cls: 'template-publisher',
			});
		}

		// Description
		if (template.description) {
			card.createEl('p', {
				text: template.description,
				cls: 'template-description',
			});
		}

		// Metadata
		const metadata = card.createDiv({ cls: 'template-metadata' });

		metadata.createEl('span', {
			text: `Format: ${template.format.toUpperCase()}`,
			cls: 'template-meta-item',
		});

		if (template.requirements?.citationStyle) {
			metadata.createEl('span', {
				text: `Style: ${template.requirements.citationStyle.toUpperCase()}`,
				cls: 'template-meta-item',
			});
		}

		if (template.requirements?.wordLimit) {
			metadata.createEl('span', {
				text: `Max: ${template.requirements.wordLimit.toLocaleString()} words`,
				cls: 'template-meta-item',
			});
		}

		// Requirements section (expandable)
		if (template.requirements) {
			const reqToggle = card.createEl('button', {
				text: '▸ Requirements',
				cls: 'template-requirements-toggle',
			});

			const reqDetails = card.createDiv({ cls: 'template-requirements-details' });
			reqDetails.style.display = 'none';

			const req = template.requirements;
			const reqList = reqDetails.createEl('ul');

			if (req.abstractWordLimit) {
				reqList.createEl('li', { text: `Abstract: max ${req.abstractWordLimit} words` });
			}
			if (req.figureLimit) {
				reqList.createEl('li', { text: `Figures: max ${req.figureLimit}` });
			}
			if (req.tableLimit) {
				reqList.createEl('li', { text: `Tables: max ${req.tableLimit}` });
			}
			if (req.keywordCount) {
				reqList.createEl('li', { text: `Keywords: ${req.keywordCount}` });
			}

			if (template.submissionGuidelines) {
				const guidelineLink = reqDetails.createEl('a', {
					text: '→ View submission guidelines',
					cls: 'template-guidelines-link',
					href: template.submissionGuidelines,
				});
				guidelineLink.setAttr('target', '_blank');
			}

			reqToggle.addEventListener('click', (e) => {
				e.stopPropagation();
				const isHidden = reqDetails.style.display === 'none';
				reqDetails.style.display = isHidden ? 'block' : 'none';
				reqToggle.textContent = isHidden ? '▾ Requirements' : '▸ Requirements';
			});
		}

		// Tags
		if (template.tags && template.tags.length > 0) {
			const tagsContainer = card.createDiv({ cls: 'template-tags' });
			for (const tag of template.tags) {
				tagsContainer.createEl('span', {
					text: tag,
					cls: 'template-tag',
				});
			}
		}

		// Click handler
		card.addEventListener('click', () => {
			// Deselect previous
			container.querySelectorAll('.template-card').forEach((c) => {
				c.removeClass('is-selected');
			});

			// Select this one
			card.addClass('is-selected');
			this.selectedTemplate = template;
		});

		// Double-click to immediately apply
		card.addEventListener('dblclick', () => {
			this.onSelect(template);
			new Notice(`Applied template: ${template.name}`);
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
