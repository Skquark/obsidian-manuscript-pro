/**
 * Table of Contents Generator Modal
 * UI for configuring and generating professional ToCs with live preview
 */

import { App, Modal, Setting, Notice, TFile } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import type { TocConfiguration, TocStyle, TocOutput } from './TocInterfaces';
import { TocGenerator } from './TocGenerator';
import { getAllTocStyleTemplates, getTocStyleTemplate } from './TocStyles';

export class TocGeneratorModal extends Modal {
	private plugin: ManuscriptProPlugin;
	private config: TocConfiguration;
	private previewContainer: HTMLElement | null = null;
	private generator: TocGenerator;
	private currentOutput: TocOutput | null = null;

	constructor(app: App, plugin: ManuscriptProPlugin) {
		super(app);
		this.plugin = plugin;
		this.generator = new TocGenerator(app);

		// Initialize with default (print-book style)
		const defaultTemplate = getTocStyleTemplate('print-book');
		this.config = { ...defaultTemplate.config };
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('toc-generator-modal');

		// Header
		contentEl.createEl('h2', { text: 'Table of Contents Generator' });
		contentEl.createEl('p', {
			text: 'Auto-detect your manuscript structure and generate a professional table of contents.',
			cls: 'toc-generator-description',
		});

		// Two-column layout
		const container = contentEl.createDiv({ cls: 'toc-generator-container' });

		// Left: Configuration
		const configPanel = container.createDiv({ cls: 'toc-config-panel' });
		this.renderConfigPanel(configPanel);

		// Right: Preview
		const previewPanel = container.createDiv({ cls: 'toc-preview-panel' });
		this.renderPreviewPanel(previewPanel);

		// Footer with action buttons
		const footer = contentEl.createDiv({ cls: 'toc-generator-footer' });
		this.renderFooter(footer);

		// Initial preview generation
		this.updatePreview();
	}

	private renderConfigPanel(container: HTMLElement) {
		container.createEl('h3', { text: 'Configuration' });

		// Style Preset
		new Setting(container)
			.setName('Style Preset')
			.setDesc('Choose a pre-configured style')
			.addDropdown((dropdown) => {
				const templates = getAllTocStyleTemplates();
				templates.forEach((template) => {
					dropdown.addOption(template.id, template.name);
				});
				dropdown.setValue(this.config.style).onChange((value) => {
					const template = getTocStyleTemplate(value as TocStyle);
					this.config = { ...template.config };
					this.onOpen(); // Re-render with new config
				});
			});

		// Show current style description
		const currentTemplate = getTocStyleTemplate(this.config.style);
		container.createEl('p', {
			text: currentTemplate.description,
			cls: 'toc-style-description',
		});

		// Structure Section
		container.createEl('h4', { text: 'Structure' });

		new Setting(container)
			.setName('Include Depth')
			.setDesc('How many heading levels to include')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('1', 'Chapters only')
					.addOption('2', 'Chapters + Sections')
					.addOption('3', 'Chapters + Sections + Subsections')
					.addOption('4', 'All levels (detailed)')
					.setValue(this.config.includeDepth.toString())
					.onChange((value) => {
						this.config.includeDepth = parseInt(value) as any;
						this.updatePreview();
					});
			});

		new Setting(container)
			.setName('Include Front Matter')
			.setDesc('Add dedication, acknowledgments, etc.')
			.addToggle((toggle) => {
				toggle.setValue(this.config.includeFrontMatter).onChange((value) => {
					this.config.includeFrontMatter = value;
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Include Back Matter')
			.setDesc('Add appendices, glossary, etc.')
			.addToggle((toggle) => {
				toggle.setValue(this.config.includeBackMatter).onChange((value) => {
					this.config.includeBackMatter = value;
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Include Part Dividers')
			.setDesc('For multi-part books')
			.addToggle((toggle) => {
				toggle.setValue(this.config.includePartDividers).onChange((value) => {
					this.config.includePartDividers = value;
					this.updatePreview();
				});
			});

		// Formatting Section
		container.createEl('h4', { text: 'Formatting' });

		new Setting(container)
			.setName('Show Page Numbers')
			.setDesc('Add page number placeholders')
			.addToggle((toggle) => {
				toggle.setValue(this.config.showPageNumbers).onChange((value) => {
					this.config.showPageNumbers = value;
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Use Leader Dots')
			.setDesc('Add ........... between title and page number')
			.addToggle((toggle) => {
				toggle.setValue(this.config.useLeaderDots).onChange((value) => {
					this.config.useLeaderDots = value;
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Indent Sublevels')
			.setDesc('Indent sections and subsections')
			.addToggle((toggle) => {
				toggle.setValue(this.config.indentSublevels).onChange((value) => {
					this.config.indentSublevels = value;
					this.updatePreview();
				});
			});

		// Numbering Section
		container.createEl('h4', { text: 'Numbering' });

		new Setting(container)
			.setName('Number Chapters')
			.setDesc('Add chapter numbers')
			.addToggle((toggle) => {
				toggle.setValue(this.config.numberChapters).onChange((value) => {
					this.config.numberChapters = value;
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Chapter Prefix')
			.setDesc('Prefix for chapter numbers (e.g., "Chapter", "Ch.", or leave empty)')
			.addText((text) => {
				text.setPlaceholder('Chapter')
					.setValue(this.config.chapterPrefix)
					.onChange((value) => {
						this.config.chapterPrefix = value;
						this.updatePreview();
					});
			});

		new Setting(container)
			.setName('Number Sections')
			.setDesc('Add section numbering (1.1, 1.2, etc.)')
			.addToggle((toggle) => {
				toggle.setValue(this.config.numberSections).onChange((value) => {
					this.config.numberSections = value;
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Roman Numerals (Front Matter)')
			.setDesc('Use roman numerals for front matter')
			.addToggle((toggle) => {
				toggle.setValue(this.config.useRomanNumerals).onChange((value) => {
					this.config.useRomanNumerals = value;
					this.updatePreview();
				});
			});

		// Digital Features Section
		container.createEl('h4', { text: 'Digital Features' });

		new Setting(container)
			.setName('Create Hyperlinks')
			.setDesc('Link to actual files (for digital formats)')
			.addToggle((toggle) => {
				toggle.setValue(this.config.createHyperlinks).onChange((value) => {
					this.config.createHyperlinks = value;
					this.updatePreview();
				});
			});
	}

	private renderPreviewPanel(container: HTMLElement) {
		container.createEl('h3', { text: 'Preview' });

		const previewWrapper = container.createDiv({ cls: 'toc-preview-wrapper' });
		this.previewContainer = previewWrapper.createDiv({ cls: 'toc-preview-content' });

		// Stats
		const stats = container.createDiv({ cls: 'toc-preview-stats' });
		stats.createEl('small', { text: 'Preview will update as you change settings' });
	}

	private async updatePreview() {
		if (!this.previewContainer) return;

		this.previewContainer.empty();
		this.previewContainer.createEl('div', { text: 'Generating preview...', cls: 'toc-preview-loading' });

		try {
			// Get manuscript data if available
			// TODO: Add manuscript data access when available
			const manuscriptData = null;

			// Generate ToC
			this.currentOutput = await this.generator.generate(manuscriptData, this.config);

			// Render preview
			this.previewContainer.empty();

			// Stats
			const statsDiv = this.previewContainer.createDiv({ cls: 'toc-preview-stats-box' });
			statsDiv.createEl('small', {
				text: `${this.currentOutput.metadata.totalEntries} entries • Max depth: ${this.currentOutput.metadata.maxDepth}`,
			});

			// Markdown preview (render as code block for now)
			const pre = this.previewContainer.createEl('pre', { cls: 'toc-preview-markdown' });
			pre.createEl('code', { text: this.currentOutput.markdown });
		} catch (error) {
			this.previewContainer.empty();
			this.previewContainer.createEl('div', {
				text: `Error generating ToC: ${error.message}`,
				cls: 'toc-preview-error',
			});
			console.error('ToC generation error:', error);
		}
	}

	private renderFooter(container: HTMLElement) {
		const buttonContainer = container.createDiv({ cls: 'toc-generator-button-container' });

		// Cancel
		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.onclick = () => this.close();

		// Copy to Clipboard
		const copyBtn = buttonContainer.createEl('button', { text: 'Copy to Clipboard' });
		copyBtn.onclick = () => {
			if (this.currentOutput) {
				navigator.clipboard.writeText(this.currentOutput.markdown);
				new Notice('Table of Contents copied to clipboard');
			}
		};

		// Save as File
		const saveBtn = buttonContainer.createEl('button', { text: 'Save as File', cls: 'mod-cta' });
		saveBtn.onclick = async () => {
			await this.saveToFile();
		};
	}

	private async saveToFile() {
		if (!this.currentOutput) {
			new Notice('Please wait for the preview to generate');
			return;
		}

		// Create filename
		const filename = 'Table of Contents.md';
		const filePath = filename;

		try {
			// Check if file exists
			const existingFile = this.app.vault.getAbstractFileByPath(filePath);

			if (existingFile instanceof TFile) {
				// Overwrite
				await this.app.vault.modify(existingFile, this.currentOutput.markdown);
				new Notice(`Updated ${filename}`);
			} else {
				// Create new
				await this.app.vault.create(filePath, this.currentOutput.markdown);
				new Notice(`Created ${filename}`);
			}

			this.close();
		} catch (error) {
			new Notice(`Error saving file: ${error.message}`);
			console.error('ToC save error:', error);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
