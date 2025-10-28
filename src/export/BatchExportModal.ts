/**
 * Batch Export Modal
 * UI for multi-format batch export with progress tracking
 */

import { App, Modal, Setting, Notice, TFile } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import type {
	BatchExportConfiguration,
	BatchExportFormat,
	BatchExportProgress,
	BatchExportResult,
} from './BatchExportInterfaces';
import { BatchExportEngine } from './BatchExportEngine';
import { getAllBatchExportPresets, getBatchExportPreset } from './BatchExportInterfaces';

export class BatchExportModal extends Modal {
	private plugin: ManuscriptProPlugin;
	private config: BatchExportConfiguration;
	private engine: BatchExportEngine;
	private progressContainer: HTMLElement | null = null;
	private isExporting = false;

	constructor(app: App, plugin: ManuscriptProPlugin) {
		super(app);
		this.plugin = plugin;
		this.engine = new BatchExportEngine(app, plugin, plugin.exportManager);

		// Initialize with default configuration
		this.config = {
			formats: [
				{ format: 'pdf', profileId: 'pdf-print', enabled: true },
				{ format: 'docx', profileId: 'docx-standard', enabled: true },
				{ format: 'epub', profileId: 'epub-ebook', enabled: true },
			],
			scope: 'manuscript',
			outputDirectory: '',
			organizeByFormat: true,
			includeTimestamp: false,
			overwriteExisting: true,
			openAfterExport: true,
		};
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('batch-export-modal');

		// Header
		contentEl.createEl('h2', { text: 'Batch Export' });
		contentEl.createEl('p', {
			text: 'Export your manuscript to multiple formats at once.',
			cls: 'batch-export-description',
		});

		// Preset selector
		this.renderPresetSection(contentEl);

		// Configuration
		this.renderConfigSection(contentEl);

		// Format selection
		this.renderFormatSection(contentEl);

		// Progress section (hidden initially)
		this.progressContainer = contentEl.createDiv({ cls: 'batch-export-progress-section hidden' });

		// Footer with action buttons
		const footer = contentEl.createDiv({ cls: 'batch-export-footer' });
		this.renderFooter(footer);
	}

	private renderPresetSection(container: HTMLElement) {
		container.createEl('h3', { text: 'Quick Presets' });

		const presetButtons = container.createDiv({ cls: 'batch-export-preset-buttons' });

		const presets = getAllBatchExportPresets();
		presets.forEach((preset) => {
			const button = presetButtons.createEl('button', {
				text: preset.name,
				cls: 'batch-export-preset-button',
			});
			button.createEl('small', { text: preset.description });

			button.onclick = () => {
				this.applyPreset(preset.id);
				this.onOpen(); // Re-render
			};
		});
	}

	private applyPreset(presetId: string) {
		const preset = getBatchExportPreset(presetId);
		if (preset) {
			this.config.formats = preset.formats.map((f) => ({ ...f }));
			this.config.organizeByFormat = preset.organizeByFormat;
		}
	}

	private renderConfigSection(container: HTMLElement) {
		container.createEl('h3', { text: 'Export Configuration' });

		// Scope
		new Setting(container)
			.setName('Export Scope')
			.setDesc('What to export')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('manuscript', 'Entire Manuscript')
					.addOption('current-file', 'Current File Only')
					.setValue(this.config.scope)
					.onChange((value) => {
						this.config.scope = value as any;
					});
			});

		// Output directory
		new Setting(container)
			.setName('Output Directory')
			.setDesc('Leave empty to use vault/Exports')
			.addText((text) => {
				text.setPlaceholder('vault/Exports')
					.setValue(this.config.outputDirectory)
					.onChange((value) => {
						this.config.outputDirectory = value;
					});
				text.inputEl.style.width = '100%';
			});

		// Organize by format
		new Setting(container)
			.setName('Organize by Format')
			.setDesc('Create subdirectories for each format (e.g., pdf/, docx/)')
			.addToggle((toggle) => {
				toggle.setValue(this.config.organizeByFormat).onChange((value) => {
					this.config.organizeByFormat = value;
				});
			});

		// Include timestamp
		new Setting(container)
			.setName('Include Timestamp')
			.setDesc('Add timestamp to filenames')
			.addToggle((toggle) => {
				toggle.setValue(this.config.includeTimestamp).onChange((value) => {
					this.config.includeTimestamp = value;
				});
			});

		// Overwrite existing
		new Setting(container)
			.setName('Overwrite Existing Files')
			.setDesc('Overwrite files if they already exist')
			.addToggle((toggle) => {
				toggle.setValue(this.config.overwriteExisting).onChange((value) => {
					this.config.overwriteExisting = value;
				});
			});

		// Open after export
		new Setting(container)
			.setName('Open After Export')
			.setDesc('Open output directory when complete')
			.addToggle((toggle) => {
				toggle.setValue(this.config.openAfterExport).onChange((value) => {
					this.config.openAfterExport = value;
				});
			});
	}

	private renderFormatSection(container: HTMLElement) {
		container.createEl('h3', { text: 'Select Formats' });

		const formatList = container.createDiv({ cls: 'batch-export-format-list' });

		const availableFormats: { format: BatchExportFormat['format']; label: string; icon: string }[] = [
			{ format: 'pdf', label: 'PDF', icon: '📄' },
			{ format: 'docx', label: 'Word (DOCX)', icon: '📝' },
			{ format: 'epub', label: 'EPUB', icon: '📚' },
			{ format: 'html', label: 'HTML', icon: '🌐' },
			{ format: 'latex', label: 'LaTeX', icon: '📐' },
			{ format: 'markdown', label: 'Markdown', icon: '📋' },
		];

		availableFormats.forEach((formatInfo) => {
			const formatCard = formatList.createDiv({ cls: 'batch-export-format-card' });

			// Find if this format is in config
			let formatConfig = this.config.formats.find((f) => f.format === formatInfo.format);
			if (!formatConfig) {
				// Add with default profile
				formatConfig = {
					format: formatInfo.format,
					profileId: this.getDefaultProfile(formatInfo.format),
					enabled: false,
				};
				this.config.formats.push(formatConfig);
			}

			// Checkbox
			const checkbox = formatCard.createEl('input', { type: 'checkbox' });
			checkbox.checked = formatConfig.enabled;
			checkbox.onchange = () => {
				formatConfig!.enabled = checkbox.checked;
			};

			// Label
			const label = formatCard.createEl('label');
			label.createEl('span', { text: formatInfo.icon, cls: 'batch-export-format-icon' });
			label.createEl('span', { text: formatInfo.label, cls: 'batch-export-format-label' });

			// Profile selector
			const profileSelect = formatCard.createEl('select', { cls: 'batch-export-profile-select' });
			const profiles = this.getProfilesForFormat(formatInfo.format);
			profiles.forEach((profile) => {
				const option = profileSelect.createEl('option', { value: profile.id, text: profile.name });
				if (profile.id === formatConfig!.profileId) {
					option.selected = true;
				}
			});
			profileSelect.onchange = () => {
				formatConfig!.profileId = profileSelect.value;
			};
		});
	}

	private getDefaultProfile(format: string): string {
		const defaults: { [key: string]: string } = {
			pdf: 'pdf-print',
			docx: 'docx-standard',
			epub: 'epub-ebook',
			html: 'html-web',
			latex: 'latex-academic',
			markdown: 'markdown-github',
		};
		return defaults[format] || 'default';
	}

	private getProfilesForFormat(format: string): { id: string; name: string }[] {
		// Return available export profiles for this format
		// This is a simplified version - you could get actual profiles from ExportManager
		return [
			{ id: `${format}-standard`, name: 'Standard' },
			{ id: `${format}-print`, name: 'Print Quality' },
			{ id: `${format}-academic`, name: 'Academic' },
		];
	}

	private renderFooter(container: HTMLElement) {
		const buttonContainer = container.createDiv({ cls: 'batch-export-button-container' });

		// Cancel
		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.onclick = () => {
			if (!this.isExporting) {
				this.close();
			}
		};

		// Export
		const exportBtn = buttonContainer.createEl('button', { text: 'Start Batch Export', cls: 'mod-cta' });
		exportBtn.onclick = async () => {
			await this.startExport();
		};
	}

	private async startExport() {
		// Validate
		const enabledFormats = this.config.formats.filter((f) => f.enabled);
		if (enabledFormats.length === 0) {
			new Notice('Please select at least one format');
			return;
		}

		this.isExporting = true;

		// Show progress section
		if (this.progressContainer) {
			this.progressContainer.removeClass('hidden');
			this.renderProgress();
		}

		// Set up progress callback
		this.engine.setProgressCallback((progress) => {
			this.renderProgress(progress);
		});

		try {
			const result = await this.engine.export(this.config);
			this.renderResults(result);
		} catch (error) {
			new Notice(`Batch export failed: ${error.message}`);
			console.error('Batch export error:', error);
		}

		this.isExporting = false;
	}

	private renderProgress(progress?: BatchExportProgress) {
		if (!this.progressContainer) return;

		this.progressContainer.empty();
		this.progressContainer.createEl('h3', { text: 'Export Progress' });

		if (!progress) {
			this.progressContainer.createEl('p', { text: 'Initializing...' });
			return;
		}

		// Progress bar
		const progressBarContainer = this.progressContainer.createDiv({ cls: 'batch-export-progress-bar-container' });
		const progressBar = progressBarContainer.createDiv({ cls: 'batch-export-progress-bar' });
		const progressFill = progressBar.createDiv({ cls: 'batch-export-progress-fill' });
		const percent = progress.totalFormats > 0 ? (progress.completedFormats / progress.totalFormats) * 100 : 0;
		progressFill.style.width = `${percent}%`;

		const progressLabel = progressBarContainer.createDiv({ cls: 'batch-export-progress-label' });
		progressLabel.createEl('span', { text: `${progress.completedFormats} / ${progress.totalFormats} formats` });
		progressLabel.createEl('span', { text: `${Math.round(percent)}%` });

		// Current status
		if (progress.currentFormat) {
			this.progressContainer.createEl('p', {
				text: `${progress.currentStatus}`,
				cls: 'batch-export-current-status',
			});
		}

		// Errors
		if (progress.errors.length > 0) {
			const errorSection = this.progressContainer.createDiv({ cls: 'batch-export-errors' });
			errorSection.createEl('h4', { text: 'Errors' });
			progress.errors.forEach((error) => {
				errorSection.createEl('div', {
					text: `${error.format.toUpperCase()}: ${error.error}`,
					cls: 'batch-export-error',
				});
			});
		}
	}

	private renderResults(result: BatchExportResult) {
		if (!this.progressContainer) return;

		this.progressContainer.empty();
		this.progressContainer.createEl('h3', { text: 'Export Complete' });

		// Summary
		const summary = this.progressContainer.createDiv({ cls: 'batch-export-summary' });
		const summaryGrid = summary.createDiv({ cls: 'batch-export-summary-grid' });

		summaryGrid.createDiv({ cls: 'batch-export-summary-item' }).innerHTML = `
			<div class="batch-export-summary-value">${result.successfulFormats}</div>
			<div class="batch-export-summary-label">Successful</div>
		`;

		summaryGrid.createDiv({ cls: 'batch-export-summary-item' }).innerHTML = `
			<div class="batch-export-summary-value">${result.failedFormats}</div>
			<div class="batch-export-summary-label">Failed</div>
		`;

		summaryGrid.createDiv({ cls: 'batch-export-summary-item' }).innerHTML = `
			<div class="batch-export-summary-value">${Math.round(result.totalDuration / 1000)}s</div>
			<div class="batch-export-summary-label">Duration</div>
		`;

		// Results list
		const resultsList = this.progressContainer.createDiv({ cls: 'batch-export-results-list' });
		result.outputs.forEach((output) => {
			const item = resultsList.createDiv({
				cls: `batch-export-result-item ${output.success ? 'success' : 'failed'}`,
			});

			const icon = item.createEl('span', {
				text: output.success ? '✓' : '✗',
				cls: 'batch-export-result-icon',
			});

			const text = item.createEl('span', {
				text: output.format.toUpperCase(),
				cls: 'batch-export-result-format',
			});

			if (output.success && output.outputPath) {
				item.createEl('small', {
					text: output.outputPath,
					cls: 'batch-export-result-path',
				});
			} else if (output.error) {
				item.createEl('small', {
					text: output.error,
					cls: 'batch-export-result-error',
				});
			}
		});

		// Success notice
		if (result.success) {
			new Notice(`Batch export complete: ${result.successfulFormats} formats exported`);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
