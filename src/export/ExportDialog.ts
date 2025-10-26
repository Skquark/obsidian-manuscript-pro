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
    private cslOverride: string = '';
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
						// Also update inline CSL indicator if present
						try {
							const effEl = this.contentEl.querySelector('.export-csl-effective') as HTMLElement | null;
							if (effEl) {
								// Recompute by triggering a noop change in helper
								// The indicator relies on local state; we can re-render by simple textContent reset
								// and calling the same computation as renderProfileDetails
								const eff = (this.cslOverride && this.cslOverride.trim()) || this.selectedProfile.pandocOptions.csl || this.plugin.settings.export?.defaultCslPath || '';
								effEl.empty();
                            const label = effEl.createEl('span', { text: 'Effective CSL: ', cls: 'setting-item-description' });
                            const val = effEl.createEl('span', { text: eff || 'None', cls: 'setting-item-description' });
                            val.style.fontWeight = '600';
                            try {
                                const fs = require('fs');
                                const exists = eff ? fs.existsSync(eff) : undefined;
                                if (exists !== undefined) {
                                    const dot = effEl.createEl('span', { text: exists ? '  ✓' : '  ✗' });
                                    dot.style.marginLeft = '6px';
                                    dot.style.color = exists ? 'var(--text-success)' : 'var(--text-error)';
                                    dot.title = exists ? 'CSL file found' : 'CSL file not found';
                                }
                            } catch (_) {}
							}
						} catch (_) {}
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

        // CSL style (optional)
        // Leave override blank by default; details section will show effective value (override > profile > global)
        const cslSetting = new Setting(contentEl)
            .setName('CSL Style (optional)')
            .setDesc('Override citation style for this export (.csl path). Leave empty to use profile/global default');
        let cslTextRef: any;
        // Inline effective status indicator
        const effectiveCslEl = contentEl.createDiv({ cls: 'export-csl-effective' });
        const updateCslInlineIndicator = () => {
            const eff = (this.cslOverride && this.cslOverride.trim()) || this.selectedProfile.pandocOptions.csl || this.plugin.settings.export?.defaultCslPath || '';
            // Basic exists check if running in desktop (may be undefined in mobile)
            let exists: boolean | undefined = undefined;
            try {
                const fs = require('fs');
                exists = eff ? fs.existsSync(eff) : undefined;
            } catch (_) {
                exists = undefined;
            }
            effectiveCslEl.empty();
            const label = effectiveCslEl.createEl('span', { text: 'Effective CSL: ', cls: 'setting-item-description' });
            const val = effectiveCslEl.createEl('span', { text: eff || 'None', cls: 'setting-item-description' });
            val.style.fontWeight = '600';
            if (exists !== undefined) {
                const dot = effectiveCslEl.createEl('span', { text: exists ? '  ✓' : '  ✗' });
                dot.style.marginLeft = '6px';
                dot.style.color = exists ? 'var(--text-success)' : 'var(--text-error)';
                dot.title = exists ? 'CSL file found' : 'CSL file not found';
            }
        };
        cslSetting.addText((text) => {
            cslTextRef = text;
            text.setPlaceholder('/path/to/style.csl');
            text.setValue(this.cslOverride);
            text.onChange((value) => {
                this.cslOverride = value;
                this.updateProfileInfo();
                updateCslInlineIndicator();
            });
        });
        cslSetting.addExtraButton((btn) => {
            btn.setIcon('folder').setTooltip('Browse...').onClick(async () => {
                try {
                    const electron = require('electron');
                    const dialog = electron?.dialog || electron?.remote?.dialog;
                    if (!dialog) throw new Error('Dialog not available');
                    const res = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'CSL', extensions: ['csl'] }] });
                    if (!res.canceled && res.filePaths && res.filePaths[0]) {
                        this.cslOverride = res.filePaths[0];
                        if (cslTextRef) cslTextRef.setValue(this.cslOverride);
                        this.updateProfileInfo();
                        updateCslInlineIndicator();
                    }
                } catch (e) {
                    new Notice('File picker not available. Enter path manually.');
                }
            });
        });
        // Initial indicator
        updateCslInlineIndicator();

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
        const effCsl = this.cslOverride || this.selectedProfile.pandocOptions.csl || this.plugin.settings.export?.defaultCslPath;
        this.addDetail(details, 'Effective CSL', effCsl ? effCsl : 'None');
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
            let profileToUse: ExportProfile = this.selectedProfile;
            if (this.cslOverride && this.cslOverride.trim().length > 0) {
                profileToUse = {
                    ...this.selectedProfile,
                    pandocOptions: { ...this.selectedProfile.pandocOptions, csl: this.cslOverride.trim() },
                };
            }
            await this.onExport(profileToUse, this.selectedFiles, this.outputPath || undefined);
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
