/**
 * Export Dialog
 * Modal dialog for configuring and initiating exports
 */

import { App, Modal, Setting, TFile, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { ExportProfile, ExportFormat } from './ExportInterfaces';

export class ExportDialog extends Modal {
	private selectedProfile: ExportProfile;
	private selectedFiles: TFile[];
	private outputPath: string = '';
	private onExport: (profile: ExportProfile, files: TFile[], outputPath?: string) => Promise<void>;

	constructor(
		app: App,
		private plugin: LatexPandocConcealerPlugin,
		files: TFile[],
		onExport: (profile: ExportProfile, files: TFile[], outputPath?: string) => Promise<void>,
	) {
		super(app);
		this.selectedFiles = files;
		this.selectedProfile = plugin.exportManager.getDefaultProfile();
		this.onExport = onExport;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('export-dialog');

		// Title
		contentEl.createEl('h2', { text: 'Export Manuscript' });

		// File info
		const fileInfo = contentEl.createDiv({ cls: 'export-file-info' });
		fileInfo.createEl('strong', { text: 'Files to export:' });
		const fileList = fileInfo.createEl('ul');
		for (const file of this.selectedFiles) {
			fileList.createEl('li', { text: file.basename });
		}

		// Profile selection
		new Setting(contentEl)
			.setName('Export Profile')
			.setDesc('Choose output format and configuration')
			.addDropdown((dropdown) => {
				const profiles = this.plugin.exportManager.getProfiles();
				for (const profile of profiles) {
					dropdown.addOption(profile.id, profile.name);
				}

				dropdown.setValue(this.selectedProfile.id);
				dropdown.onChange(async (value) => {
					const profile = this.plugin.exportManager.getProfile(value);
					if (profile) {
						this.selectedProfile = profile;
						this.updateProfileInfo();
					}
				});
			});

		// Profile description
		const profileDesc = contentEl.createDiv({ cls: 'export-profile-desc' });
		profileDesc.createEl('p', {
			text: this.selectedProfile.description || 'No description available',
			cls: 'setting-item-description',
		});

		// Profile details
		const profileDetails = contentEl.createDiv({ cls: 'export-profile-details' });
		this.renderProfileDetails(profileDetails);

		// Output path (optional)
		new Setting(contentEl)
			.setName('Output Path (optional)')
			.setDesc('Leave empty to use default output directory')
			.addText((text) => {
				text.setPlaceholder('/path/to/output.pdf');
				text.onChange((value) => {
					this.outputPath = value;
				});
			});

		// Export options
		contentEl.createEl('h3', { text: 'Options' });

		new Setting(contentEl)
			.setName('Open After Export')
			.setDesc('Automatically open the exported file')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.export?.openAfterExport ?? true);
				toggle.onChange(async (value) => {
					if (this.plugin.settings.export) {
						this.plugin.settings.export.openAfterExport = value;
						await this.plugin.saveSettings();
					}
				});
			});

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'export-buttons' });

		// Cancel button
		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => {
			this.close();
		});

		// Export button
		const exportBtn = buttonContainer.createEl('button', {
			text: `Export to ${this.selectedProfile.format.toUpperCase()}`,
			cls: 'mod-cta',
		});
		exportBtn.addEventListener('click', async () => {
			await this.handleExport();
		});
	}

	private renderProfileDetails(container: HTMLElement): void {
		container.empty();

		const details = container.createEl('div', { cls: 'export-details-grid' });

		// Format
		this.addDetail(details, 'Format', this.selectedProfile.format.toUpperCase());

		// Table of Contents
		if (this.selectedProfile.pandocOptions.toc) {
			this.addDetail(details, 'Table of Contents', 'Yes');
		}

		// Number Sections
		if (this.selectedProfile.pandocOptions.numberSections) {
			this.addDetail(details, 'Number Sections', 'Yes');
		}

		// PDF Engine
		if (this.selectedProfile.format === 'pdf' && this.selectedProfile.pandocOptions.pdfEngine) {
			this.addDetail(details, 'PDF Engine', this.selectedProfile.pandocOptions.pdfEngine);
		}

		// Citations
		if (this.selectedProfile.pandocOptions.citeproc) {
			this.addDetail(details, 'Process Citations', 'Yes');
		}
	}

	private addDetail(container: HTMLElement, label: string, value: string): void {
		const item = container.createEl('div', { cls: 'export-detail-item' });
		item.createEl('span', { text: label + ':', cls: 'export-detail-label' });
		item.createEl('span', { text: value, cls: 'export-detail-value' });
	}

	private updateProfileInfo(): void {
		// Update description
		const descEl = this.contentEl.querySelector('.export-profile-desc p');
		if (descEl) {
			descEl.textContent = this.selectedProfile.description || 'No description available';
		}

		// Update details
		const detailsEl = this.contentEl.querySelector('.export-profile-details');
		if (detailsEl instanceof HTMLElement) {
			this.renderProfileDetails(detailsEl);
		}

		// Update export button text
		const exportBtn = this.contentEl.querySelector('.export-buttons .mod-cta');
		if (exportBtn) {
			exportBtn.textContent = `Export to ${this.selectedProfile.format.toUpperCase()}`;
		}
	}

	private async handleExport(): Promise<void> {
		try {
			await this.onExport(this.selectedProfile, this.selectedFiles, this.outputPath || undefined);
			this.close();
		} catch (error) {
			console.error('Export failed:', error);
			new Notice(`Export failed: ${error.message}`);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
