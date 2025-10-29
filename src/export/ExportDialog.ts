/**
 * Export Dialog
 * Modal dialog for configuring and initiating exports
 */

import { App, Modal, Setting, TFile, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type {
	ExportProfile,
	ExportFormat,
	ExportProfileVariant,
	CompressionLevel,
	CompressionSettings,
} from './ExportInterfaces';
import { TRIM_SIZE_PRESETS, getTrimSizeById, estimatePageCount, countWords } from './TrimSizePresets';
import { PROFILE_VARIANTS } from './ExportInterfaces';
import { TemplateBrowserModal } from './templates/TemplateBrowserModal';
import type { JournalTemplate } from './templates/JournalTemplates';

export class ExportDialog extends Modal {
	private selectedProfile: ExportProfile;
	private selectedFiles: TFile[];
	private outputPath = '';
	private cslOverride = '';
	private selectedTrimSize?: string;
	private selectedVariant?: ExportProfileVariant;
	private batchExportFormats: Set<ExportFormat> = new Set();
	private compressionSettings?: CompressionSettings;
	private validateEpub: boolean = false;
	private onExport: (profile: ExportProfile, files: TFile[], outputPath?: string) => Promise<void>;

	// Lightweight CSL metadata extraction (title/id) without XML deps
	private getCslMetadata(path: string): { title?: string; id?: string } | null {
		if (!path) return null;
		try {
			const fs = require('fs');
			if (!fs.existsSync(path)) return null;
			// Read a reasonable chunk; CSL files are small
			const buf = fs.readFileSync(path, 'utf8');
			// Prefer <info><title> but fallback to first <title>
			let title: string | undefined;
			const infoTitle = buf.match(/<info>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<\/info>/i);
			if (infoTitle && infoTitle[1]) title = infoTitle[1].trim();
			if (!title) {
				const t2 = buf.match(/<title>([^<]+)<\/title>/i);
				if (t2 && t2[1]) title = t2[1].trim();
			}
			let id: string | undefined;
			const idMatch = buf.match(/<id>([^<]+)<\/id>/i);
			if (idMatch && idMatch[1]) id = idMatch[1].trim();
			return { title, id };
		} catch (_) {
			/* CSL metadata extraction failed - return null */
			return null;
		}
	}

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
						// Update inline CSL indicator to reflect new effective value
						try {
							updateCslInlineIndicator();
						} catch (_) {
							/* intentionally empty */
						}
					}
				});
			})
			.addButton((btn) =>
				btn
					.setButtonText('Browse Templates')
					.setTooltip('Choose from journal and publisher templates')
					.onClick(() => {
						const browser = new TemplateBrowserModal(this.app, this.plugin, (template: JournalTemplate) => {
							// Apply template as the selected profile
							this.selectedProfile = template;
							this.updateProfileInfo();
							// Refresh the dialog to show new profile
							this.onOpen();
						});
						browser.open();
					}),
			);

		// Profile description
		const profileDesc = contentEl.createDiv({ cls: 'export-profile-desc' });
		profileDesc.createEl('p', {
			text: this.selectedProfile.description || 'No description available',
			cls: 'setting-item-description',
		});

		// Profile details
		const profileDetails = contentEl.createDiv({ cls: 'export-profile-details' });
		this.renderProfileDetails(profileDetails);

		// Trim Size Selection (for PDF books)
		if (this.selectedProfile.format === 'pdf') {
			const trimSizeContainer = contentEl.createDiv({ cls: 'export-trim-size-section' });

			new Setting(trimSizeContainer)
				.setName('Trim Size')
				.setDesc('Industry-standard book sizes with automatic margin calculation')
				.addDropdown((dropdown) => {
					dropdown.addOption('', 'Default (from profile)');
					for (const trimSize of TRIM_SIZE_PRESETS) {
						dropdown.addOption(trimSize.id, trimSize.name);
					}
					dropdown.setValue(this.selectedTrimSize || '');
					dropdown.onChange((value) => {
						this.selectedTrimSize = value || undefined;
						this.updateTrimSizeInfo();
					});
				});

			// Trim size info display
			const trimSizeInfo = trimSizeContainer.createDiv({ cls: 'export-trim-size-info' });
			this.renderTrimSizeInfo(trimSizeInfo);
		}

		// Profile Variant Selection (test/sample/full builds)
		const variantContainer = contentEl.createDiv({ cls: 'export-variant-section' });

		new Setting(variantContainer)
			.setName('Build Variant')
			.setDesc('Quick test builds or full manuscript')
			.addDropdown((dropdown) => {
				dropdown.addOption('', 'Full Manuscript (All Chapters)');
				for (const variant of PROFILE_VARIANTS) {
					if (variant.id !== 'full') {
						dropdown.addOption(variant.id, variant.name);
					}
				}
				dropdown.setValue(this.selectedVariant?.id || '');
				dropdown.onChange((value) => {
					if (value) {
						this.selectedVariant = PROFILE_VARIANTS.find((v) => v.id === value);
					} else {
						this.selectedVariant = undefined;
					}
					this.updateVariantInfo();
				});
			});

		// Variant info display
		const variantInfo = variantContainer.createDiv({ cls: 'export-variant-info' });
		this.renderVariantInfo(variantInfo);

		// PDF Compression Options (for PDF exports)
		if (this.selectedProfile.format === 'pdf' || this.batchExportFormats.has('pdf')) {
			const compressionContainer = contentEl.createDiv({ cls: 'export-compression-section' });
			compressionContainer.createEl('h3', { text: 'PDF Compression' });

			const compressionDesc = compressionContainer.createDiv({ cls: 'setting-item-description' });
			compressionDesc.style.marginBottom = '1rem';
			compressionDesc.textContent = 'Compress PDF for different distribution channels (requires Ghostscript)';

			// Compression level
			new Setting(compressionContainer)
				.setName('Compression Level')
				.setDesc('Choose quality level based on distribution channel')
				.addDropdown((dropdown) => {
					dropdown.addOption('none', 'None (fastest, largest file)');
					dropdown.addOption('screen', 'Screen (~72 DPI, smallest file)');
					dropdown.addOption('ebook', 'Ebook (~150 DPI, good for web/email)');
					dropdown.addOption('printer', 'Printer (~300 DPI, print-on-demand)');
					dropdown.addOption('prepress', 'Prepress (maximum quality, offset printing)');

					const defaultLevel: CompressionLevel = 'ebook';
					dropdown.setValue(defaultLevel);

					dropdown.onChange((value) => {
						const level = value as CompressionLevel;
						if (!this.compressionSettings) {
							this.compressionSettings = {
								level: level,
								detectDuplicateImages: true,
								downsampleImages: true,
								embedFonts: true,
							};
						} else {
							this.compressionSettings.level = level;
						}
						this.updateCompressionInfo();
					});

					// Initialize default
					this.compressionSettings = {
						level: defaultLevel,
						detectDuplicateImages: true,
						downsampleImages: true,
						embedFonts: true,
					};
				});

			// Advanced compression options
			new Setting(compressionContainer)
				.setName('Detect Duplicate Images')
				.setDesc('Remove duplicate images to reduce file size')
				.addToggle((toggle) => {
					toggle.setValue(true);
					toggle.onChange((value) => {
						if (this.compressionSettings) {
							this.compressionSettings.detectDuplicateImages = value;
						}
					});
				});

			new Setting(compressionContainer)
				.setName('Downsample Images')
				.setDesc('Reduce image resolution for smaller file size')
				.addToggle((toggle) => {
					toggle.setValue(true);
					toggle.onChange((value) => {
						if (this.compressionSettings) {
							this.compressionSettings.downsampleImages = value;
						}
					});
				});

			// Compression info display
			const compressionInfo = compressionContainer.createDiv({ cls: 'export-compression-info' });
			this.renderCompressionInfo(compressionInfo);
		}

		// EPUB Validation Section (only for EPUB format)
		if (this.selectedProfile.format === 'epub' || this.batchExportFormats.has('epub')) {
			const validationContainer = contentEl.createDiv({ cls: 'export-validation-section' });
			validationContainer.createEl('h3', { text: 'EPUB Validation' });

			const validationDesc = validationContainer.createDiv({ cls: 'setting-item-description' });
			validationDesc.style.marginBottom = '1rem';
			validationDesc.textContent =
				'Automatically validate EPUB files against industry standards (requires EPUBCheck and Java)';

			// Validation toggle
			new Setting(validationContainer)
				.setName('Validate After Export')
				.setDesc('Run EPUBCheck validation and show results after EPUB generation')
				.addToggle((toggle) => {
					toggle.setValue(this.selectedProfile.validateEpub || false);
					toggle.onChange((value) => {
						this.validateEpub = value;
					});

					// Initialize
					this.validateEpub = this.selectedProfile.validateEpub || false;
				});

			// Validation info
			const validationInfo = validationContainer.createDiv({ cls: 'export-info-box' });
			validationInfo.style.fontSize = '0.9em';
			validationInfo.style.color = 'var(--text-muted)';
			validationInfo.style.marginTop = '0.75rem';
			validationInfo.innerHTML = `
				<div style="margin-bottom: 0.5rem;">
					<strong>Why validate?</strong> Major retailers (Amazon, Apple Books, Kobo) require valid EPUB files.
				</div>
				<div style="margin-bottom: 0.5rem;">
					<strong>What's checked:</strong> File structure, metadata, HTML validity, navigation, and accessibility.
				</div>
				<div>
					<strong>Requirements:</strong> Java and EPUBCheck must be installed. You'll be prompted if missing.
				</div>
			`;
		}

		// Multi-Format Batch Export
		const batchContainer = contentEl.createDiv({ cls: 'export-batch-section' });
		batchContainer.createEl('h3', { text: 'Multi-Format Export' });

		const batchDesc = batchContainer.createDiv({ cls: 'setting-item-description' });
		batchDesc.style.marginBottom = '1rem';
		batchDesc.textContent = 'Export to multiple formats in one operation';

		// Format checkboxes
		const formats: Array<{ format: ExportFormat; label: string }> = [
			{ format: 'pdf', label: 'PDF (Print-ready)' },
			{ format: 'epub', label: 'EPUB (E-readers)' },
			{ format: 'docx', label: 'DOCX (Editing)' },
			{ format: 'html', label: 'HTML (Web preview)' },
			{ format: 'latex', label: 'LaTeX (Source)' },
		];

		for (const { format, label } of formats) {
			new Setting(batchContainer).setName(label).addToggle((toggle) => {
				toggle.setValue(format === this.selectedProfile.format); // Pre-select current format
				if (format === this.selectedProfile.format) {
					this.batchExportFormats.add(format);
				}
				toggle.onChange((value) => {
					if (value) {
						this.batchExportFormats.add(format);
					} else {
						this.batchExportFormats.delete(format);
					}
				});
			});
		}

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
			const eff =
				(this.cslOverride && this.cslOverride.trim()) ||
				this.selectedProfile.pandocOptions.csl ||
				this.plugin.settings.export?.defaultCslPath ||
				'';
			// Basic exists check if running in desktop (may be undefined in mobile)
			let exists: boolean | undefined = undefined;
			try {
				const fs = require('fs');
				exists = eff ? fs.existsSync(eff) : undefined;
			} catch (_) {
				/* fs module not available - leave exists undefined */
				exists = undefined;
			}
			effectiveCslEl.empty();
			effectiveCslEl.createEl('span', { text: 'Effective CSL: ', cls: 'setting-item-description' });
			const val = effectiveCslEl.createEl('span', { text: eff || 'None', cls: 'setting-item-description' });
			val.style.fontWeight = '600';
			// Add style title if available
			if (exists && eff) {
				const meta = this.getCslMetadata(eff);
				if (meta?.title) {
					effectiveCslEl.createEl('span', { text: ' — ', cls: 'setting-item-description' });
					const titleSpan = effectiveCslEl.createEl('span', {
						text: `“${meta.title}”`,
						cls: 'setting-item-description',
					});
					titleSpan.style.opacity = '0.8';
				}
			}
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
			btn
				.setIcon('folder')
				.setTooltip('Browse...')
				.onClick(async () => {
					try {
						const electron = require('electron');
						const dialog = electron?.dialog || electron?.remote?.dialog;
						if (!dialog) throw new Error('Dialog not available');
						const res = await dialog.showOpenDialog({
							properties: ['openFile'],
							filters: [{ name: 'CSL', extensions: ['csl'] }],
						});
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
		const effCsl =
			this.cslOverride || this.selectedProfile.pandocOptions.csl || this.plugin.settings.export?.defaultCslPath;
		this.addDetail(details, 'Effective CSL', effCsl ? effCsl : 'None');
		if (effCsl) {
			const meta = this.getCslMetadata(effCsl);
			if (meta?.title) {
				this.addDetail(details, 'CSL Title', meta.title);
			}
		}
	}

	private addDetail(container: HTMLElement, label: string, value: string): void {
		const item = container.createEl('div', { cls: 'export-detail-item' });
		item.createEl('span', { text: label + ':', cls: 'export-detail-label' });
		item.createEl('span', { text: value, cls: 'export-detail-value' });
	}

	private renderTrimSizeInfo(container: HTMLElement): void {
		container.empty();

		if (!this.selectedTrimSize) {
			return;
		}

		const trimSize = getTrimSizeById(this.selectedTrimSize);
		if (!trimSize) {
			return;
		}

		// Estimate page count from selected files
		let totalText = '';
		for (const file of this.selectedFiles) {
			try {
				const content = this.app.vault.cachedRead(file);
				content.then((text) => {
					totalText += text;
				});
			} catch (error) {
				console.warn('Could not read file for page count estimation:', file.path);
			}
		}

		// Calculate estimates
		const wordCount = countWords(totalText);
		const pageCount = estimatePageCount(totalText, trimSize);

		// Display info
		const infoBox = container.createDiv({ cls: 'export-info-box' });
		infoBox.style.padding = '0.75rem';
		infoBox.style.marginTop = '0.5rem';
		infoBox.style.background = 'var(--background-secondary)';
		infoBox.style.borderRadius = '6px';

		infoBox.createEl('div', {
			text: `📏 ${trimSize.description}`,
			cls: 'setting-item-description',
		});
		infoBox.createEl('div', {
			text: `📐 Dimensions: ${trimSize.width} × ${trimSize.height}`,
			cls: 'setting-item-description',
		});
		infoBox.createEl('div', {
			text: `📖 Estimated: ${pageCount.toLocaleString()} pages (~${wordCount.toLocaleString()} words)`,
			cls: 'setting-item-description',
		});
		infoBox.createEl('div', {
			text: `ℹ️ ${trimSize.commonUse}`,
			cls: 'setting-item-description',
		});
	}

	private updateTrimSizeInfo(): void {
		const infoEl = this.contentEl.querySelector('.export-trim-size-info');
		if (infoEl instanceof HTMLElement) {
			this.renderTrimSizeInfo(infoEl);
		}
	}

	private renderVariantInfo(container: HTMLElement): void {
		container.empty();

		if (!this.selectedVariant) {
			return;
		}

		const totalChapters = this.selectedFiles.length;
		let selectedChapters = totalChapters;

		const selection = this.selectedVariant.chapterSelection;
		switch (selection.type) {
			case 'count':
				selectedChapters = Math.min(selection.count, totalChapters);
				break;
			case 'range':
				selectedChapters = Math.min(selection.end - selection.start + 1, totalChapters);
				break;
			case 'percentage':
				selectedChapters = Math.ceil((totalChapters * selection.percentage) / 100);
				break;
			case 'custom':
				selectedChapters = selection.chapterIds.length;
				break;
		}

		// Display info
		const infoBox = container.createDiv({ cls: 'export-info-box' });
		infoBox.style.padding = '0.75rem';
		infoBox.style.marginTop = '0.5rem';
		infoBox.style.background = 'var(--background-secondary)';
		infoBox.style.borderRadius = '6px';

		infoBox.createEl('div', {
			text: `📚 Exporting ${selectedChapters} of ${totalChapters} chapters`,
			cls: 'setting-item-description',
		});

		if (selection.type === 'count' && selectedChapters < totalChapters) {
			infoBox.createEl('div', {
				text: `⚡ Perfect for quick formatting tests`,
				cls: 'setting-item-description',
			});
		} else if (selection.type === 'percentage') {
			infoBox.createEl('div', {
				text: `📄 Sample for beta readers or preview`,
				cls: 'setting-item-description',
			});
		}
	}

	private updateVariantInfo(): void {
		const infoEl = this.contentEl.querySelector('.export-variant-info');
		if (infoEl instanceof HTMLElement) {
			this.renderVariantInfo(infoEl);
		}
	}

	private renderCompressionInfo(container: HTMLElement): void {
		container.empty();

		if (!this.compressionSettings || this.compressionSettings.level === 'none') {
			return;
		}

		// Display info
		const infoBox = container.createDiv({ cls: 'export-info-box' });
		infoBox.style.padding = '0.75rem';
		infoBox.style.marginTop = '0.5rem';
		infoBox.style.background = 'var(--background-secondary)';
		infoBox.style.borderRadius = '6px';

		const levelDescriptions: Record<CompressionLevel, string> = {
			none: '',
			screen: '📱 Screen preview quality (~72 DPI) - Smallest file, good for quick review',
			ebook: '📧 Ebook distribution quality (~150 DPI) - Balanced size, good for web/email',
			printer: '🖨️ Print-on-demand quality (~300 DPI) - High quality for POD services',
			prepress: '📰 Prepress quality (max DPI) - Maximum quality for offset printing',
		};

		const desc = levelDescriptions[this.compressionSettings.level];
		if (desc) {
			infoBox.createEl('div', {
				text: desc,
				cls: 'setting-item-description',
			});
		}

		const features: string[] = [];
		if (this.compressionSettings.detectDuplicateImages) features.push('Duplicate image detection');
		if (this.compressionSettings.downsampleImages) features.push('Image downsampling');
		if (this.compressionSettings.embedFonts) features.push('Font embedding');

		if (features.length > 0) {
			infoBox.createEl('div', {
				text: `🔧 Optimizations: ${features.join(', ')}`,
				cls: 'setting-item-description',
			});
		}

		infoBox.createEl('div', {
			text: '💾 Typical reduction: 40-60% file size',
			cls: 'setting-item-description',
		});
	}

	private updateCompressionInfo(): void {
		const infoEl = this.contentEl.querySelector('.export-compression-info');
		if (infoEl instanceof HTMLElement) {
			this.renderCompressionInfo(infoEl);
		}
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
			// Build profile with overrides
			let profileToUse: ExportProfile = { ...this.selectedProfile };

			// Apply CSL override
			if (this.cslOverride && this.cslOverride.trim().length > 0) {
				profileToUse.pandocOptions = {
					...profileToUse.pandocOptions,
					csl: this.cslOverride.trim(),
				};
			}

			// Apply trim size selection
			if (this.selectedTrimSize) {
				profileToUse.trimSize = this.selectedTrimSize;
			}

			// Apply variant selection
			if (this.selectedVariant) {
				profileToUse.variant = this.selectedVariant;
			}

			// Apply compression settings
			if (this.compressionSettings && this.compressionSettings.level !== 'none') {
				profileToUse.postProcessing = {
					compression: this.compressionSettings,
				};
			}

			// Apply EPUB validation setting
			if (profileToUse.format === 'epub' && this.validateEpub) {
				profileToUse.validateEpub = true;
			}

			// Determine files to export (apply variant filtering)
			let filesToExport = this.selectedFiles;
			if (this.selectedVariant) {
				filesToExport = this.plugin.exportManager['filterFilesByVariant'](this.selectedFiles, this.selectedVariant);
			}

			// Check if batch export is requested (more than one format selected)
			if (this.batchExportFormats.size > 1) {
				// Batch export to multiple formats
				const vaultPath = (this.plugin.app.vault.adapter as any).basePath || '';
				const outputDir = this.outputPath || this.plugin.settings.export?.defaultOutputDir || vaultPath;

				// Determine filename base
				const firstFile = filesToExport[0];
				const filenameBase = firstFile ? firstFile.basename : 'manuscript';

				const batchOptions = {
					formats: Array.from(this.batchExportFormats),
					baseProfile: profileToUse,
					outputDirectory: outputDir,
					filenameBase: filenameBase,
				};

				await this.plugin.exportManager.exportMultipleFormats(batchOptions, filesToExport);
			} else {
				// Single format export
				await this.onExport(profileToUse, filesToExport, this.outputPath || undefined);
			}

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
