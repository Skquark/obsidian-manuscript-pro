import { App, Modal, Setting, Notice } from 'obsidian';
import { TimelineExporter } from './TimelineExporter';
import { TimelineExportOptions } from './TimelineInterfaces';

/**
 * Timeline Export Dialog
 * Configure and execute timeline exports
 */
export class TimelineExportDialog extends Modal {
	private exporter: TimelineExporter;
	private options: TimelineExportOptions;

	constructor(app: App, exporter: TimelineExporter) {
		super(app);
		this.exporter = exporter;

		// Default options
		this.options = {
			format: 'markdown',
			includeDescriptions: true,
			includeConflicts: true,
			includeCharacterAges: false,
			groupBy: 'type',
			dateFormat: 'display'
		};
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('timeline-export-dialog');

		contentEl.createEl('h2', { text: 'Export Timeline' });

		// Format selection
		new Setting(contentEl)
			.setName('Export Format')
			.setDesc('Choose the output format')
			.addDropdown(dropdown => {
				dropdown
					.addOption('markdown', 'Markdown')
					.addOption('csv', 'CSV (Spreadsheet)')
					.addOption('gantt', 'Gantt Chart (Mermaid)')
					.addOption('json', 'JSON (Data)')
					.setValue(this.options.format)
					.onChange(value => {
						this.options.format = value as any;
					});
			});

		// Group by
		new Setting(contentEl)
			.setName('Group Events By')
			.setDesc('Organize events into groups')
			.addDropdown(dropdown => {
				dropdown
					.addOption('none', 'No Grouping')
					.addOption('type', 'Event Type')
					.addOption('year', 'Year')
					.addOption('character', 'Character')
					.setValue(this.options.groupBy || 'type')
					.onChange(value => {
						this.options.groupBy = value as any;
					});
			});

		// Include descriptions
		new Setting(contentEl)
			.setName('Include Descriptions')
			.setDesc('Include full event descriptions in export')
			.addToggle(toggle => toggle
				.setValue(this.options.includeDescriptions)
				.onChange(value => {
					this.options.includeDescriptions = value;
				})
			);

		// Include conflicts
		new Setting(contentEl)
			.setName('Include Conflicts')
			.setDesc('Include timeline conflicts and warnings')
			.addToggle(toggle => toggle
				.setValue(this.options.includeConflicts)
				.onChange(value => {
					this.options.includeConflicts = value;
				})
			);

		// Include character ages
		new Setting(contentEl)
			.setName('Include Character Information')
			.setDesc('Include character IDs and relationships')
			.addToggle(toggle => toggle
				.setValue(this.options.includeCharacterAges)
				.onChange(value => {
					this.options.includeCharacterAges = value;
				})
			);

		// Date format
		new Setting(contentEl)
			.setName('Date Format')
			.setDesc('How to format dates in export')
			.addDropdown(dropdown => {
				dropdown
					.addOption('display', 'Display Format (As shown)')
					.addOption('iso', 'ISO Format (YYYY-MM-DD)')
					.addOption('custom', 'Custom Format')
					.setValue(this.options.dateFormat)
					.onChange(value => {
						this.options.dateFormat = value as any;
					});
			});

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

				case 'gantt':
					content = await this.exporter.exportToGantt(this.options);
					break;

				case 'json':
					content = await this.exporter.exportToJSON(this.options);
					break;

				default:
					new Notice('Unknown export format');
					return;
			}

			// Save to file
			await this.exporter.saveExport(content, this.options.format, 'timeline_export');

			this.close();
		} catch (error) {
			console.error('Timeline export failed:', error);
			new Notice('Timeline export failed');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
