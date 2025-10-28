import { App, Modal, Setting, Notice } from 'obsidian';
import { CharacterExporter, CharacterExportOptions } from './CharacterExporter';

/**
 * Character Export Dialog
 * Configure and execute character database exports
 */
export class CharacterExportDialog extends Modal {
	private exporter: CharacterExporter;
	private options: CharacterExportOptions;

	constructor(app: App, exporter: CharacterExporter) {
		super(app);
		this.exporter = exporter;

		// Default options
		this.options = {
			format: 'markdown',
			includeAppearance: true,
			includePersonality: true,
			includeBackground: true,
			includeArc: true,
			includeRelationships: true,
			includeAppearances: false,
			groupBy: 'role'
		};
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('character-export-dialog');

		contentEl.createEl('h2', { text: 'Export Character Database' });

		// Format selection
		new Setting(contentEl)
			.setName('Export Format')
			.setDesc('Choose the output format')
			.addDropdown(dropdown => {
				dropdown
					.addOption('markdown', 'Markdown')
					.addOption('csv', 'CSV (Spreadsheet)')
					.addOption('json', 'JSON (Data)')
					.setValue(this.options.format)
					.onChange(value => {
						this.options.format = value as any;
					});
			});

		// Group by
		new Setting(contentEl)
			.setName('Group Characters By')
			.setDesc('Organize characters into groups')
			.addDropdown(dropdown => {
				dropdown
					.addOption('none', 'No Grouping')
					.addOption('role', 'Character Role')
					.addOption('importance', 'Importance Level')
					.addOption('alphabetical', 'Alphabetical')
					.setValue(this.options.groupBy || 'role')
					.onChange(value => {
						this.options.groupBy = value as any;
					});
			});

		contentEl.createEl('h3', { text: 'Include Sections' });

		// Include appearance
		new Setting(contentEl)
			.setName('Appearance')
			.setDesc('Include physical appearance details')
			.addToggle(toggle => toggle
				.setValue(this.options.includeAppearance)
				.onChange(value => {
					this.options.includeAppearance = value;
				})
			);

		// Include personality
		new Setting(contentEl)
			.setName('Personality')
			.setDesc('Include personality traits and characteristics')
			.addToggle(toggle => toggle
				.setValue(this.options.includePersonality)
				.onChange(value => {
					this.options.includePersonality = value;
				})
			);

		// Include background
		new Setting(contentEl)
			.setName('Background')
			.setDesc('Include background and history')
			.addToggle(toggle => toggle
				.setValue(this.options.includeBackground)
				.onChange(value => {
					this.options.includeBackground = value;
				})
			);

		// Include arc
		new Setting(contentEl)
			.setName('Character Arc')
			.setDesc('Include character development arc')
			.addToggle(toggle => toggle
				.setValue(this.options.includeArc)
				.onChange(value => {
					this.options.includeArc = value;
				})
			);

		// Include relationships
		new Setting(contentEl)
			.setName('Relationships')
			.setDesc('Include character relationships')
			.addToggle(toggle => toggle
				.setValue(this.options.includeRelationships)
				.onChange(value => {
					this.options.includeRelationships = value;
				})
			);

		// Include appearances
		new Setting(contentEl)
			.setName('Scene Appearances')
			.setDesc('Include scene appearance counts')
			.addToggle(toggle => toggle
				.setValue(this.options.includeAppearances)
				.onChange(value => {
					this.options.includeAppearances = value;
				})
			);

		// Buttons
		const buttonContainer = contentEl.createDiv('modal-button-container');

		const exportBtn = buttonContainer.createEl('button', {
			text: 'Export',
			cls: 'mod-cta'
		});
		exportBtn.addEventListener('click', async () => {
			await this.performExport();
		});

		const cancelBtn = buttonContainer.createEl('button', {
			text: 'Cancel'
		});
		cancelBtn.addEventListener('click', () => {
			this.close();
		});
	}

	/**
	 * Perform the export
	 */
	private async performExport(): Promise<void> {
		try {
			let content: string;

			// Generate export content based on format
			switch (this.options.format) {
				case 'markdown':
					content = await this.exporter.exportToMarkdown(this.options);
					break;

				case 'csv':
					content = await this.exporter.exportToCSV(this.options);
					break;

				case 'json':
					content = await this.exporter.exportToJSON(this.options);
					break;

				default:
					new Notice('Unknown export format');
					return;
			}

			// Save to file
			await this.exporter.saveExport(content, this.options.format, 'characters_export');

			this.close();
		} catch (error) {
			console.error('Character export failed:', error);
			new Notice('Character export failed');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
