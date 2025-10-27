/**
 * Manuscript Editor Modal
 * Comprehensive UI for editing manuscript metadata, structure, and configuration
 */

import { App, Modal, Setting, TFile, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { ManuscriptProject, Author, Edition, TrimSize, BuildProfile } from './ManuscriptSchema';
import { ManuscriptLoader } from './ManuscriptLoader';

type EditorTab = 'info' | 'authors' | 'metadata' | 'editions' | 'structure' | 'profiles' | 'advanced';

export class ManuscriptEditorModal extends Modal {
	plugin: LatexPandocConcealerPlugin;
	manuscript: ManuscriptProject;
	manifestFile: TFile;
	loader: ManuscriptLoader;
	currentTab: EditorTab = 'info';
	hasUnsavedChanges: boolean = false;

	constructor(app: App, plugin: LatexPandocConcealerPlugin, manifestFile: TFile, manuscript: ManuscriptProject) {
		super(app);
		this.plugin = plugin;
		this.manifestFile = manifestFile;
		this.manuscript = manuscript;
		this.loader = new ManuscriptLoader(app.vault);
	}

	onOpen() {
		const { contentEl, titleEl, modalEl } = this;

		titleEl.setText('Manuscript Editor');

		// Make modal resizable
		modalEl.style.resize = 'both';
		modalEl.style.overflow = 'auto';

		contentEl.empty();
		contentEl.addClass('manuscript-editor-modal');

		// Create tab navigation
		const tabBar = contentEl.createDiv({ cls: 'manuscript-editor-tabs' });
		this.renderTabs(tabBar);

		// Create content area
		const contentArea = contentEl.createDiv({ cls: 'manuscript-editor-content' });
		this.renderCurrentTab(contentArea);

		// Create footer with actions
		const footer = contentEl.createDiv({ cls: 'manuscript-editor-footer' });
		this.renderFooter(footer);
	}

	private renderTabs(container: HTMLElement): void {
		const tabs: Array<{ id: EditorTab; label: string; icon: string }> = [
			{ id: 'info', label: 'Book Info', icon: 'book' },
			{ id: 'authors', label: 'Authors', icon: 'users' },
			{ id: 'metadata', label: 'Metadata', icon: 'tags' },
			{ id: 'editions', label: 'Editions', icon: 'layout' },
			{ id: 'structure', label: 'Structure', icon: 'list' },
			{ id: 'profiles', label: 'Profiles', icon: 'layers' },
			{ id: 'advanced', label: 'Advanced', icon: 'settings' },
		];

		for (const tab of tabs) {
			const tabEl = container.createDiv({
				cls: this.currentTab === tab.id ? 'manuscript-tab active' : 'manuscript-tab',
			});

			tabEl.createSpan({ cls: 'manuscript-tab-icon', text: '' }); // Icon would go here
			tabEl.createSpan({ cls: 'manuscript-tab-label', text: tab.label });

			tabEl.onclick = () => {
				this.switchTab(tab.id);
			};
		}
	}

	private switchTab(tabId: EditorTab): void {
		this.currentTab = tabId;
		this.onOpen(); // Re-render
	}

	private renderCurrentTab(container: HTMLElement): void {
		container.empty();

		switch (this.currentTab) {
			case 'info':
				this.renderInfoTab(container);
				break;
			case 'authors':
				this.renderAuthorsTab(container);
				break;
			case 'metadata':
				this.renderMetadataTab(container);
				break;
			case 'editions':
				this.renderEditionsTab(container);
				break;
			case 'structure':
				this.renderStructureTab(container);
				break;
			case 'profiles':
				this.renderProfilesTab(container);
				break;
			case 'advanced':
				this.renderAdvancedTab(container);
				break;
		}
	}

	private renderInfoTab(container: HTMLElement): void {
		new Setting(container)
			.setName('Title')
			.setDesc('The main title of your manuscript')
			.addText((text) =>
				text.setValue(this.manuscript.book.title).onChange((value) => {
					this.manuscript.book.title = value;
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(container)
			.setName('Subtitle')
			.setDesc('Optional subtitle')
			.addText((text) =>
				text.setValue(this.manuscript.book.subtitle || '').onChange((value) => {
					this.manuscript.book.subtitle = value;
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(container)
			.setName('Version')
			.setDesc('Manuscript version (e.g., 1.0.0)')
			.addText((text) =>
				text.setValue(this.manuscript.book.version).onChange((value) => {
					this.manuscript.book.version = value;
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(container)
			.setName('Language')
			.setDesc('ISO 639-1 language code (e.g., en-US)')
			.addText((text) =>
				text.setValue(this.manuscript.book.metadata.language).onChange((value) => {
					this.manuscript.book.metadata.language = value;
					this.hasUnsavedChanges = true;
				}),
			);

		// Copyright section
		container.createEl('h3', { text: 'Copyright' });

		new Setting(container).setName('Copyright Year').addText((text) =>
			text.setValue(this.manuscript.book.copyright.year.toString()).onChange((value) => {
				this.manuscript.book.copyright.year = parseInt(value) || new Date().getFullYear();
				this.hasUnsavedChanges = true;
			}),
		);

		new Setting(container).setName('Copyright Holder').addText((text) =>
			text.setValue(this.manuscript.book.copyright.holder).onChange((value) => {
				this.manuscript.book.copyright.holder = value;
				this.hasUnsavedChanges = true;
			}),
		);

		new Setting(container).setName('Copyright Statement').addTextArea((text) =>
			text.setValue(this.manuscript.book.copyright.statement).onChange((value) => {
				this.manuscript.book.copyright.statement = value;
				this.hasUnsavedChanges = true;
			}),
		);
	}

	private renderAuthorsTab(container: HTMLElement): void {
		container.createEl('h3', { text: 'Authors & Contributors' });

		const authorsList = container.createDiv({ cls: 'manuscript-authors-list' });

		for (let i = 0; i < this.manuscript.book.authors.length; i++) {
			const author = this.manuscript.book.authors[i];
			this.renderAuthor(authorsList, author, i);
		}

		new Setting(container).setName('Add Author').addButton((button) =>
			button.setButtonText('Add').onClick(() => {
				this.manuscript.book.authors.push({
					name: '',
					role: 'primary',
				});
				this.hasUnsavedChanges = true;
				this.renderCurrentTab(container.parentElement!);
			}),
		);
	}

	private renderAuthor(container: HTMLElement, author: Author, index: number): void {
		const authorCard = container.createDiv({ cls: 'manuscript-author-card' });

		new Setting(authorCard).setName(`Author ${index + 1}`).addButton((button) =>
			button
				.setButtonText('Remove')
				.setWarning()
				.onClick(() => {
					this.manuscript.book.authors.splice(index, 1);
					this.hasUnsavedChanges = true;
					this.renderCurrentTab(container.parentElement!.parentElement!);
				}),
		);

		new Setting(authorCard).setName('Name').addText((text) =>
			text.setValue(author.name).onChange((value) => {
				author.name = value;
				this.hasUnsavedChanges = true;
			}),
		);

		new Setting(authorCard).setName('Role').addDropdown((dropdown) =>
			dropdown
				.addOption('primary', 'Primary Author')
				.addOption('co-author', 'Co-Author')
				.addOption('contributor', 'Contributor')
				.addOption('editor', 'Editor')
				.addOption('translator', 'Translator')
				.addOption('illustrator', 'Illustrator')
				.addOption('foreword', 'Foreword Author')
				.setValue(author.role)
				.onChange((value: any) => {
					author.role = value;
					this.hasUnsavedChanges = true;
				}),
		);

		new Setting(authorCard)
			.setName('Bio')
			.setDesc('Optional author biography')
			.addTextArea((text) =>
				text.setValue(author.bio || '').onChange((value) => {
					author.bio = value;
					this.hasUnsavedChanges = true;
				}),
			);
	}

	private renderMetadataTab(container: HTMLElement): void {
		const metadata = this.manuscript.book.metadata;

		// Keywords
		container.createEl('h3', { text: 'Keywords & Subjects' });

		new Setting(container)
			.setName('Keywords')
			.setDesc('Comma-separated keywords')
			.addTextArea((text) =>
				text.setValue((metadata.keywords || []).join(', ')).onChange((value) => {
					metadata.keywords = value
						.split(',')
						.map((k) => k.trim())
						.filter((k) => k);
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(container)
			.setName('Subjects')
			.setDesc('Comma-separated subject areas')
			.addTextArea((text) =>
				text.setValue((metadata.subjects || []).join(', ')).onChange((value) => {
					metadata.subjects = value
						.split(',')
						.map((s) => s.trim())
						.filter((s) => s);
					this.hasUnsavedChanges = true;
				}),
			);

		// Classification
		container.createEl('h3', { text: 'Classification' });

		new Setting(container)
			.setName('BISAC Codes')
			.setDesc('Book Industry Standards codes (comma-separated)')
			.addTextArea((text) =>
				text.setValue((metadata.bisacCodes || []).join(', ')).onChange((value) => {
					metadata.bisacCodes = value
						.split(',')
						.map((c) => c.trim())
						.filter((c) => c);
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(container).setName('Reading Level').addDropdown((dropdown) =>
			dropdown
				.addOption('', 'Not specified')
				.addOption('children', 'Children')
				.addOption('young-adult', 'Young Adult')
				.addOption('adult', 'Adult')
				.addOption('professional', 'Professional')
				.addOption('academic', 'Academic')
				.setValue(metadata.readingLevel || '')
				.onChange((value: any) => {
					metadata.readingLevel = value || undefined;
					this.hasUnsavedChanges = true;
				}),
		);

		new Setting(container)
			.setName('Age Range')
			.setDesc('e.g., "18+", "8-12"')
			.addText((text) =>
				text.setValue(metadata.ageRange || '').onChange((value) => {
					metadata.ageRange = value || undefined;
					this.hasUnsavedChanges = true;
				}),
			);

		// Descriptions
		container.createEl('h3', { text: 'Descriptions' });

		new Setting(container)
			.setName('Short Description')
			.setDesc('150-200 characters for catalogs')
			.addTextArea((text) =>
				text.setValue(metadata.shortDescription || '').onChange((value) => {
					metadata.shortDescription = value || undefined;
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(container)
			.setName('Long Description')
			.setDesc('Full back cover copy')
			.addTextArea((text) =>
				text.setValue(metadata.longDescription || '').onChange((value) => {
					metadata.longDescription = value || undefined;
					this.hasUnsavedChanges = true;
				}),
			);
	}

	private renderEditionsTab(container: HTMLElement): void {
		container.createEl('h3', { text: 'Editions' });
		container.createEl('p', { text: 'Manage different formats and versions of your manuscript' });

		const editionsList = container.createDiv({ cls: 'manuscript-editions-list' });

		for (const [editionId, edition] of Object.entries(this.manuscript.editions)) {
			this.renderEdition(editionsList, editionId, edition);
		}

		new Setting(container).setName('Add Edition').addButton((button) =>
			button.setButtonText('Add').onClick(() => {
				const newId = `edition-${Date.now()}`;
				this.manuscript.editions[newId] = {
					name: 'New Edition',
					identifiers: {},
					trimSize: '6x9',
					binding: 'perfect',
					pricing: {},
					barcode: { position: 'back-cover-bottom-right' },
				};
				this.hasUnsavedChanges = true;
				this.renderCurrentTab(container.parentElement!);
			}),
		);
	}

	private renderEdition(container: HTMLElement, editionId: string, edition: Edition): void {
		const card = container.createDiv({ cls: 'manuscript-edition-card' });

		new Setting(card).setName(edition.name).addButton((button) =>
			button
				.setButtonText('Remove')
				.setWarning()
				.onClick(() => {
					delete this.manuscript.editions[editionId];
					this.hasUnsavedChanges = true;
					this.renderCurrentTab(container.parentElement!.parentElement!);
				}),
		);

		new Setting(card).setName('Edition Name').addText((text) =>
			text.setValue(edition.name).onChange((value) => {
				edition.name = value;
				this.hasUnsavedChanges = true;
			}),
		);

		new Setting(card).setName('ISBN-13').addText((text) =>
			text.setValue(edition.identifiers.isbn13 || '').onChange((value) => {
				edition.identifiers.isbn13 = value || undefined;
				this.hasUnsavedChanges = true;
			}),
		);

		new Setting(card).setName('Binding').addDropdown((dropdown) =>
			dropdown
				.addOption('hardcover', 'Hardcover')
				.addOption('perfect', 'Perfect Bound')
				.addOption('saddle-stitch', 'Saddle Stitch')
				.addOption('spiral', 'Spiral')
				.addOption('digital', 'Digital')
				.addOption('audio', 'Audio')
				.setValue(edition.binding)
				.onChange((value: any) => {
					edition.binding = value;
					this.hasUnsavedChanges = true;
				}),
		);

		new Setting(card).setName('Price (USD)').addText((text) =>
			text.setValue(edition.pricing.usd?.toString() || '').onChange((value) => {
				edition.pricing.usd = parseFloat(value) || undefined;
				this.hasUnsavedChanges = true;
			}),
		);
	}

	private renderStructureTab(container: HTMLElement): void {
		container.createEl('h3', { text: 'Manuscript Structure' });

		// Frontmatter
		this.renderSection(container, 'Frontmatter', this.manuscript.frontmatter);

		// Mainmatter
		this.renderSection(container, 'Mainmatter', this.manuscript.mainmatter);

		// Backmatter
		this.renderSection(container, 'Backmatter', this.manuscript.backmatter);
	}

	private renderSection(container: HTMLElement, title: string, files: any[]): void {
		const section = container.createDiv({ cls: 'manuscript-structure-section' });
		section.createEl('h4', { text: title });

		const filesList = section.createDiv({ cls: 'manuscript-files-list' });

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const fileItem = filesList.createDiv({ cls: 'manuscript-file-item' });

			fileItem.createSpan({ text: file.file });

			if (file.comment) {
				fileItem.createSpan({ cls: 'manuscript-file-comment', text: ` // ${file.comment}` });
			}

			// Add remove button
			const removeBtn = fileItem.createEl('button', { text: '✕', cls: 'manuscript-file-remove' });
			removeBtn.onclick = () => {
				files.splice(i, 1);
				this.hasUnsavedChanges = true;
				this.renderCurrentTab(container.parentElement!);
			};
		}

		new Setting(section)
			.setName('Add File')
			.addText((text) => text.setPlaceholder('File path'))
			.addButton((button) =>
				button.setButtonText('Add').onClick((evt) => {
					const input = (evt.target as HTMLElement).parentElement?.querySelector('input');
					if (input && input.value) {
						files.push({ file: input.value });
						this.hasUnsavedChanges = true;
						this.renderCurrentTab(container.parentElement!);
					}
				}),
			);
	}

	private renderProfilesTab(container: HTMLElement): void {
		container.createEl('h3', { text: 'Build Profiles' });
		container.createEl('p', { text: 'Define different versions of your manuscript for various purposes' });

		const profilesList = container.createDiv({ cls: 'manuscript-profiles-list' });

		for (const [profileId, profile] of Object.entries(this.manuscript.profiles)) {
			this.renderProfile(profilesList, profileId, profile);
		}

		new Setting(container).setName('Add Profile').addButton((button) =>
			button.setButtonText('Add').onClick(() => {
				const newId = `profile-${Date.now()}`;
				this.manuscript.profiles[newId] = {
					name: newId,
					comment: '',
					frontmatter: 'all',
					mainmatter: 'all',
					backmatter: 'all',
				};
				this.hasUnsavedChanges = true;
				this.renderCurrentTab(container.parentElement!);
			}),
		);
	}

	private renderProfile(container: HTMLElement, profileId: string, profile: BuildProfile): void {
		const card = container.createDiv({ cls: 'manuscript-profile-card' });

		new Setting(card).setName(profile.name).addButton((button) =>
			button
				.setButtonText('Remove')
				.setWarning()
				.onClick(() => {
					delete this.manuscript.profiles[profileId];
					this.hasUnsavedChanges = true;
					this.renderCurrentTab(container.parentElement!.parentElement!);
				}),
		);

		new Setting(card).setName('Profile Name').addText((text) =>
			text.setValue(profile.name).onChange((value) => {
				profile.name = value;
				this.hasUnsavedChanges = true;
			}),
		);

		new Setting(card).setName('Comment').addText((text) =>
			text.setValue(profile.comment || '').onChange((value) => {
				profile.comment = value;
				this.hasUnsavedChanges = true;
			}),
		);
	}

	private renderAdvancedTab(container: HTMLElement): void {
		container.createEl('h3', { text: 'Advanced Settings' });

		// Trim Sizes
		const trimSizesHeader = container.createDiv({ cls: 'manuscript-section-header' });
		trimSizesHeader.createEl('h4', { text: 'Trim Sizes' });

		new Setting(trimSizesHeader).setName('').addButton((button) =>
			button
				.setButtonText('Add Trim Size')
				.setIcon('plus')
				.onClick(() => {
					const newId = `trim-${Date.now()}`;
					this.manuscript.trimSizes[newId] = {
						name: 'Custom Size',
						width: '6in',
						height: '9in',
						margins: {
							top: '0.75in',
							bottom: '0.75in',
							outer: '0.75in',
							innerBase: '0.875in',
							innerPerPage: '0.0025in',
						},
					};
					this.hasUnsavedChanges = true;
					this.renderCurrentTab(container);
				}),
		);

		const trimSizesList = container.createDiv({ cls: 'manuscript-trim-sizes-list' });

		if (Object.keys(this.manuscript.trimSizes).length === 0) {
			trimSizesList.createEl('p', {
				text: 'No trim sizes defined. Add a trim size to specify paper dimensions and margins.',
				cls: 'manuscript-empty-message',
			});
		} else {
			for (const [sizeId, size] of Object.entries(this.manuscript.trimSizes)) {
				this.renderTrimSize(trimSizesList, sizeId, size);
			}
		}

		// Validation
		container.createEl('h4', { text: 'Validation', cls: 'manuscript-section-spacing' });

		const validationContainer = container.createDiv({ cls: 'manuscript-validation-section' });

		new Setting(validationContainer)
			.setName('Validate Manifest')
			.setDesc('Check for errors and warnings in the manuscript configuration')
			.addButton((button) =>
				button.setButtonText('Run Validation').onClick(() => {
					this.showValidationResults(validationContainer);
				}),
			);
	}

	private showValidationResults(container: HTMLElement): void {
		// Remove any existing results
		const existingResults = container.querySelector('.manuscript-validation-results');
		if (existingResults) {
			existingResults.remove();
		}

		const result = this.loader.validate(this.manuscript);
		const resultsDiv = container.createDiv({ cls: 'manuscript-validation-results' });

		// Summary header
		const summaryDiv = resultsDiv.createDiv({ cls: 'manuscript-validation-summary' });

		if (result.valid) {
			summaryDiv.addClass('validation-success');
			summaryDiv.createEl('strong', { text: '✓ Manifest is valid!' });
			summaryDiv.createEl('p', { text: 'No errors or warnings found.' });
		} else {
			summaryDiv.addClass('validation-has-issues');
			const title = summaryDiv.createEl('strong');
			title.setText(
				`Found ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''} and ${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}`,
			);
		}

		// Show errors
		if (result.errors.length > 0) {
			const errorsSection = resultsDiv.createDiv({ cls: 'manuscript-validation-errors' });
			errorsSection.createEl('h5', { text: 'Errors', cls: 'validation-section-title error' });

			const errorsList = errorsSection.createEl('ul', { cls: 'validation-issues-list' });
			result.errors.forEach((error) => {
				const li = errorsList.createEl('li', { cls: 'validation-error-item' });
				li.createSpan({ cls: 'validation-icon', text: '✗' });
				li.createSpan({ text: error.message });
			});
		}

		// Show warnings
		if (result.warnings.length > 0) {
			const warningsSection = resultsDiv.createDiv({ cls: 'manuscript-validation-warnings' });
			warningsSection.createEl('h5', { text: 'Warnings', cls: 'validation-section-title warning' });

			const warningsList = warningsSection.createEl('ul', { cls: 'validation-issues-list' });
			result.warnings.forEach((warning) => {
				const li = warningsList.createEl('li', { cls: 'validation-warning-item' });
				li.createSpan({ cls: 'validation-icon', text: '⚠' });
				li.createSpan({ text: warning.message });
			});
		}

		// Show simple notice as well
		if (result.valid) {
			new Notice('✓ Manifest is valid');
		} else {
			new Notice(
				`Validation complete: ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}, ${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}`,
			);
		}
	}

	private renderTrimSize(container: HTMLElement, sizeId: string, size: TrimSize): void {
		const card = container.createDiv({ cls: 'manuscript-trim-size-card' });

		// Header with name and remove button
		const header = card.createDiv({ cls: 'manuscript-card-header' });
		header.createEl('strong', { text: size.name });

		const removeBtn = header.createEl('button', {
			text: '×',
			cls: 'manuscript-remove-button',
		});
		removeBtn.onclick = () => {
			delete this.manuscript.trimSizes[sizeId];
			this.hasUnsavedChanges = true;
			this.renderCurrentTab(container.parentElement!);
		};

		// Trim Size Settings
		new Setting(card)
			.setName('Name')
			.setDesc('Descriptive name for this trim size')
			.addText((text) =>
				text.setValue(size.name).onChange((value) => {
					size.name = value;
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(card)
			.setName('Width')
			.setDesc('Paper width (e.g., "6in", "5.5in")')
			.addText((text) =>
				text.setValue(size.width).onChange((value) => {
					size.width = value;
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(card)
			.setName('Height')
			.setDesc('Paper height (e.g., "9in", "8.5in")')
			.addText((text) =>
				text.setValue(size.height).onChange((value) => {
					size.height = value;
					this.hasUnsavedChanges = true;
				}),
			);

		// Margins Section
		card.createEl('h5', { text: 'Margins', cls: 'manuscript-subsection-title' });

		new Setting(card)
			.setName('Top Margin')
			.setDesc('Distance from top edge')
			.addText((text) =>
				text.setValue(size.margins.top).onChange((value) => {
					size.margins.top = value;
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(card)
			.setName('Bottom Margin')
			.setDesc('Distance from bottom edge')
			.addText((text) =>
				text.setValue(size.margins.bottom).onChange((value) => {
					size.margins.bottom = value;
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(card)
			.setName('Outer Margin')
			.setDesc('Distance from outer edge')
			.addText((text) =>
				text.setValue(size.margins.outer).onChange((value) => {
					size.margins.outer = value;
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(card)
			.setName('Inner Base Margin')
			.setDesc('Base gutter width (spine side)')
			.addText((text) =>
				text.setValue(size.margins.innerBase).onChange((value) => {
					size.margins.innerBase = value;
					this.hasUnsavedChanges = true;
				}),
			);

		new Setting(card)
			.setName('Inner Per Page')
			.setDesc('Additional gutter per 100 pages (optional)')
			.addText((text) =>
				text
					.setValue(size.margins.innerPerPage || '')
					.setPlaceholder('0.0025in')
					.onChange((value) => {
						if (value) {
							size.margins.innerPerPage = value;
						} else {
							delete size.margins.innerPerPage;
						}
						this.hasUnsavedChanges = true;
					}),
			);
	}

	private renderFooter(container: HTMLElement): void {
		const buttonContainer = container.createDiv({ cls: 'manuscript-editor-buttons' });

		// Cancel button
		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel', cls: 'mod-cancel' });
		cancelBtn.onclick = () => {
			if (this.hasUnsavedChanges) {
				// TODO: Add confirmation dialog
			}
			this.close();
		};

		// Save button
		const saveBtn = buttonContainer.createEl('button', { text: 'Save', cls: 'mod-cta' });
		saveBtn.onclick = async () => {
			try {
				await this.loader.saveManuscript(this.manifestFile, this.manuscript);
				new Notice('✓ Manuscript saved');
				this.hasUnsavedChanges = false;
				this.close();
			} catch (error) {
				new Notice('✗ Failed to save manuscript');
				console.error('Save error:', error);
			}
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
