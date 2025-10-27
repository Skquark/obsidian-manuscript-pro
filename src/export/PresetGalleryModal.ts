/**
 * Preset Gallery Modal
 * Visual browser for template presets with categories, search, and one-click loading
 */

import { App, Modal, Setting } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { presetManager, TemplatePreset } from './TemplatePreset';
import type { TemplateConfiguration } from './TemplateConfiguration';

export class PresetGalleryModal extends Modal {
	private plugin: LatexPandocConcealerPlugin;
	private onSelectPreset: (config: TemplateConfiguration) => void;
	private currentCategory = 'all';
	private searchQuery = '';

	constructor(app: App, plugin: LatexPandocConcealerPlugin, onSelectPreset: (config: TemplateConfiguration) => void) {
		super(app);
		this.plugin = plugin;
		this.onSelectPreset = onSelectPreset;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('preset-gallery-modal');

		// Add class to outer modal for width override
		this.modalEl.addClass('preset-gallery-modal-container');

		// Modal title
		const header = contentEl.createDiv({ cls: 'preset-gallery-header' });
		header.createEl('h2', { text: 'Template Presets', cls: 'preset-gallery-title' });
		header.createEl('p', {
			text: 'Choose a professional template to get started quickly',
			cls: 'preset-gallery-subtitle',
		});

		// Search and filter bar
		this.renderSearchBar(contentEl);

		// Category tabs
		this.renderCategoryTabs(contentEl);

		// Preset grid
		this.renderPresetGrid(contentEl);
	}

	/**
	 * Render search bar
	 */
	private renderSearchBar(container: HTMLElement) {
		const searchBar = container.createDiv({ cls: 'preset-gallery-search' });

		new Setting(searchBar).setName('Search templates').addText((text) => {
			text.setPlaceholder('Search by name, description, or tags...');
			text.onChange((value) => {
				this.searchQuery = value.toLowerCase();
				this.renderPresetGrid(container.querySelector('.preset-gallery-grid-container') as HTMLElement);
			});
		});
	}

	/**
	 * Render category tabs
	 */
	private renderCategoryTabs(container: HTMLElement) {
		const tabsContainer = container.createDiv({ cls: 'preset-gallery-tabs' });

		const categories = [
			{ id: 'all', name: 'All Templates', icon: '📚' },
			{ id: 'fiction', name: 'Fiction', icon: '📕' },
			{ id: 'non-fiction', name: 'Non-Fiction', icon: '📗' },
			{ id: 'academic', name: 'Academic', icon: '🎓' },
			{ id: 'technical', name: 'Technical', icon: '⚙️' },
			{ id: 'special', name: 'Special', icon: '✨' },
		];

		for (const category of categories) {
			const tab = tabsContainer.createEl('button', {
				cls: 'preset-gallery-tab',
			});

			if (category.id === this.currentCategory) {
				tab.addClass('is-active');
			}

			tab.createSpan({ text: category.icon, cls: 'preset-gallery-tab-icon' });
			tab.createSpan({ text: category.name, cls: 'preset-gallery-tab-label' });

			tab.addEventListener('click', () => {
				this.currentCategory = category.id;

				// Update active state
				tabsContainer.querySelectorAll('.preset-gallery-tab').forEach((t) => {
					t.removeClass('is-active');
				});
				tab.addClass('is-active');

				// Re-render grid
				const gridContainer = container.querySelector('.preset-gallery-grid-container') as HTMLElement;
				this.renderPresetGrid(gridContainer);
			});
		}
	}

	/**
	 * Render preset grid
	 */
	private renderPresetGrid(container: HTMLElement) {
		// Clear existing grid if re-rendering
		if (container.querySelector('.preset-gallery-grid')) {
			container.querySelector('.preset-gallery-grid')?.remove();
		} else {
			// First time, create container
			container = container.createDiv({ cls: 'preset-gallery-grid-container' });
		}

		const grid = container.createDiv({ cls: 'preset-gallery-grid' });

		// Get filtered presets
		const presets = this.getFilteredPresets();

		if (presets.length === 0) {
			const emptyState = grid.createDiv({ cls: 'preset-gallery-empty' });
			emptyState.createEl('p', { text: '📭 No templates found' });
			emptyState.createEl('p', {
				text: 'Try a different search or category',
				cls: 'preset-gallery-empty-hint',
			});
			return;
		}

		// Render each preset as a card
		for (const preset of presets) {
			this.renderPresetCard(grid, preset);
		}
	}

	/**
	 * Get filtered presets based on category and search
	 */
	private getFilteredPresets(): TemplatePreset[] {
		let presets = presetManager.getAllPresets();

		// Filter by category
		if (this.currentCategory !== 'all') {
			presets = presets.filter((p) => p.category === this.currentCategory);
		}

		// Filter by search query
		if (this.searchQuery) {
			presets = presetManager.searchPresets(this.searchQuery);
			// Further filter by category if needed
			if (this.currentCategory !== 'all') {
				presets = presets.filter((p) => p.category === this.currentCategory);
			}
		}

		return presets;
	}

	/**
	 * Render preset card
	 */
	private renderPresetCard(container: HTMLElement, preset: TemplatePreset) {
		const card = container.createDiv({ cls: 'preset-card' });

		// Icon/thumbnail
		const iconContainer = card.createDiv({ cls: 'preset-card-icon' });
		iconContainer.createSpan({ text: preset.icon || '📄', cls: 'preset-card-icon-emoji' });

		// Content
		const content = card.createDiv({ cls: 'preset-card-content' });

		// Title
		content.createEl('h3', { text: preset.name, cls: 'preset-card-title' });

		// Description
		content.createEl('p', { text: preset.description, cls: 'preset-card-description' });

		// Best for
		if (preset.bestFor) {
			const bestFor = content.createDiv({ cls: 'preset-card-meta' });
			bestFor.createEl('strong', { text: 'Best for: ' });
			bestFor.createSpan({ text: preset.bestFor });
		}

		// Trim sizes
		if (preset.trimSizes && preset.trimSizes.length > 0) {
			const sizes = content.createDiv({ cls: 'preset-card-meta' });
			sizes.createEl('strong', { text: 'Sizes: ' });
			sizes.createSpan({ text: preset.trimSizes.join(', ') });
		}

		// Tags
		if (preset.tags && preset.tags.length > 0) {
			const tagsContainer = content.createDiv({ cls: 'preset-card-tags' });
			for (const tag of preset.tags.slice(0, 3)) {
				// Show max 3 tags
				tagsContainer.createSpan({ text: tag, cls: 'preset-card-tag' });
			}
		}

		// Footer with actions
		const footer = card.createDiv({ cls: 'preset-card-footer' });

		const selectBtn = footer.createEl('button', {
			text: 'Use This Template',
			cls: 'preset-card-button mod-cta',
		});

		selectBtn.addEventListener('click', () => {
			// Clone the configuration to avoid mutations
			const config = JSON.parse(JSON.stringify(preset.configuration));
			this.onSelectPreset(config);
			this.close();
		});

		const previewBtn = footer.createEl('button', {
			text: 'Preview',
			cls: 'preset-card-button',
		});

		previewBtn.addEventListener('click', () => {
			this.showPresetPreview(preset);
		});
	}

	/**
	 * Show preset preview (configuration details)
	 */
	private showPresetPreview(preset: TemplatePreset) {
		const previewModal = new Modal(this.app);
		previewModal.contentEl.addClass('preset-preview-modal');

		const { contentEl } = previewModal;

		// Title
		const header = contentEl.createDiv({ cls: 'preset-preview-header' });
		header.createSpan({ text: preset.icon || '📄', cls: 'preset-preview-icon' });
		header.createEl('h2', { text: preset.name });

		// Description
		contentEl.createEl('p', { text: preset.description, cls: 'preset-preview-description' });

		// Configuration details
		const details = contentEl.createDiv({ cls: 'preset-preview-details' });

		const config = preset.configuration;

		// Document settings
		this.addPreviewSection(details, 'Document', [
			`Class: ${config.document.documentClass}`,
			`Font: ${config.typography.bodyFont} ${config.typography.fontSize}`,
			`Line spacing: ${config.typography.lineSpacing}`,
		]);

		// Page settings
		if (config.geometry) {
			this.addPreviewSection(details, 'Page', [
				`Size: ${config.geometry.paperSize || 'Custom'}`,
				`Margins: ${config.geometry.top} top, ${config.geometry.bottom} bottom`,
				`Inner: ${config.geometry.inner}, Outer: ${config.geometry.outer}`,
			]);
		}

		// Chapter settings
		if (config.chapters) {
			this.addPreviewSection(details, 'Chapters', [
				`Style: ${config.chapters.display || 'default'}`,
				`Numbering: ${config.chapters.numberFormat || 'arabic'}`,
				`New page: ${config.chapters.newPage ? 'Yes' : 'No'}`,
			]);
		}

		// TOC
		this.addPreviewSection(details, 'Table of Contents', [
			`Enabled: ${config.tableOfContents.enabled ? 'Yes' : 'No'}`,
			`Depth: ${config.tableOfContents.depth} level(s)`,
			`Title: "${config.tableOfContents.title}"`,
		]);

		// Actions
		const actions = contentEl.createDiv({ cls: 'preset-preview-actions' });

		const cancelBtn = actions.createEl('button', { text: 'Close' });
		cancelBtn.addEventListener('click', () => previewModal.close());

		const useBtn = actions.createEl('button', { text: 'Use This Template', cls: 'mod-cta' });
		useBtn.addEventListener('click', () => {
			const config = JSON.parse(JSON.stringify(preset.configuration));
			this.onSelectPreset(config);
			previewModal.close();
			this.close();
		});

		previewModal.open();
	}

	/**
	 * Add preview section helper
	 */
	private addPreviewSection(container: HTMLElement, title: string, items: string[]) {
		const section = container.createDiv({ cls: 'preset-preview-section' });
		section.createEl('h4', { text: title });
		const list = section.createEl('ul');
		for (const item of items) {
			list.createEl('li', { text: item });
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
