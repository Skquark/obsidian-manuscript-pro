import { App, Modal, Setting, Notice } from 'obsidian';
import ManuscriptProPlugin from '../main';
import { ComprehensiveReportGenerator, ComprehensiveReportOptions } from './ComprehensiveReportGenerator';

/**
 * Comprehensive Report Dialog
 * Configure and generate comprehensive project reports
 */
export class ComprehensiveReportDialog extends Modal {
	private plugin: ManuscriptProPlugin;
	private generator: ComprehensiveReportGenerator;
	private options: ComprehensiveReportOptions;

	constructor(app: App, plugin: ManuscriptProPlugin) {
		super(app);
		this.plugin = plugin;
		this.generator = new ComprehensiveReportGenerator(app, plugin);

		// Default options - include everything
		this.options = {
			includeManuscriptInfo: true,
			includeTimeline: true,
			includeCharacters: true,
			includeResearch: true,
			includeStatistics: true,
			includeStyleCheck: true,
			format: 'markdown'
		};
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('comprehensive-report-dialog');

		contentEl.createEl('h2', { text: 'Generate Project Report' });

		contentEl.createEl('p', {
			text: 'Create a comprehensive report combining data from all manuscript tools.',
			cls: 'setting-item-description'
		});

		// Format selection
		new Setting(contentEl)
			.setName('Export Format')
			.setDesc('Choose the output format')
			.addDropdown(dropdown => {
				dropdown
					.addOption('markdown', 'Markdown')
					.addOption('html', 'HTML')
					.setValue(this.options.format)
					.onChange(value => {
						this.options.format = value as any;
					});
			});

		contentEl.createEl('h3', { text: 'Include Sections' });

		// Manuscript info
		new Setting(contentEl)
			.setName('Manuscript Overview')
			.setDesc('Include manuscript metadata and structure')
			.addToggle(toggle => toggle
				.setValue(this.options.includeManuscriptInfo)
				.onChange(value => {
					this.options.includeManuscriptInfo = value;
				})
			);

		// Statistics
		new Setting(contentEl)
			.setName('Writing Statistics')
			.setDesc('Include word counts and writing progress')
			.addToggle(toggle => toggle
				.setValue(this.options.includeStatistics)
				.onChange(value => {
					this.options.includeStatistics = value;
				})
			);

		// Timeline
		const hasTimeline = this.plugin.timelineManager !== null;
		new Setting(contentEl)
			.setName('Timeline Summary')
			.setDesc(hasTimeline ? 'Include timeline events and statistics' : 'Timeline not available')
			.addToggle(toggle => toggle
				.setValue(this.options.includeTimeline && hasTimeline)
				.setDisabled(!hasTimeline)
				.onChange(value => {
					this.options.includeTimeline = value;
				})
			);

		// Characters
		const hasCharacters = this.plugin.characterManager !== null;
		new Setting(contentEl)
			.setName('Character Database')
			.setDesc(hasCharacters ? 'Include character statistics and top characters' : 'Character database not available')
			.addToggle(toggle => toggle
				.setValue(this.options.includeCharacters && hasCharacters)
				.setDisabled(!hasCharacters)
				.onChange(value => {
					this.options.includeCharacters = value;
				})
			);

		// Research
		const hasResearch = this.plugin.researchManager !== null;
		new Setting(contentEl)
			.setName('Research Notes')
			.setDesc(hasResearch ? 'Include research notes summary and statistics' : 'Research notes not available')
			.addToggle(toggle => toggle
				.setValue(this.options.includeResearch && hasResearch)
				.setDisabled(!hasResearch)
				.onChange(value => {
					this.options.includeResearch = value;
				})
			);

		// Style check
		const hasStyleChecker = this.plugin.settings.styleChecker?.enabled;
		new Setting(contentEl)
			.setName('Style Analysis')
			.setDesc(hasStyleChecker ? 'Include style checker configuration' : 'Style checker not enabled')
			.addToggle(toggle => toggle
				.setValue(this.options.includeStyleCheck && hasStyleChecker)
				.setDisabled(!hasStyleChecker)
				.onChange(value => {
					this.options.includeStyleCheck = value;
				})
			);

		// Buttons
		const buttonContainer = contentEl.createDiv('modal-button-container');

		const generateBtn = buttonContainer.createEl('button', {
			text: 'Generate Report',
			cls: 'mod-cta'
		});
		generateBtn.addEventListener('click', async () => {
			await this.performGenerate();
		});

		const cancelBtn = buttonContainer.createEl('button', {
			text: 'Cancel'
		});
		cancelBtn.addEventListener('click', () => {
			this.close();
		});
	}

	/**
	 * Perform the report generation
	 */
	private async performGenerate(): Promise<void> {
		try {
			new Notice('Generating project report...');

			// Generate report content
			const content = await this.generator.generateReport(this.options);

			// Save to file
			await this.generator.saveReport(content, this.options.format);

			this.close();
		} catch (error) {
			console.error('Report generation failed:', error);
			new Notice('Report generation failed');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
