/**
 * Citation Import Dialog
 * UI for importing citations from DOI, arXiv, PubMed
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { CitationSource, CitationImportResult } from './EnhancedBibInterfaces';

export class CitationImportDialog extends Modal {
	private source: CitationSource = 'doi';
	private identifier = '';
	private onImport: (result: CitationImportResult) => Promise<void>;

	constructor(
		app: App,
		private plugin: LatexPandocConcealerPlugin,
		onImport: (result: CitationImportResult) => Promise<void>,
	) {
		super(app);
		this.onImport = onImport;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('citation-import-dialog');

		// Title
		contentEl.createEl('h2', { text: 'Import Citation' });

		const description = contentEl.createEl('p', {
			text: 'Import citations automatically from DOI, arXiv, or PubMed ID.',
		});
		description.style.color = 'var(--text-muted)';
		description.style.marginBottom = '1.5rem';

		// Source selection
		new Setting(contentEl)
			.setName('Source')
			.setDesc('Choose where to import from')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('doi', 'DOI (CrossRef)')
					.addOption('arxiv', 'arXiv ID')
					.addOption('pubmed', 'PubMed ID')
					.setValue(this.source)
					.onChange((value) => {
						this.source = value as CitationSource;
						this.updatePlaceholder();
					});
			});

		// Identifier input
		const identifierSetting = new Setting(contentEl)
			.setName('Identifier')
			.setDesc('Enter the DOI, arXiv ID, or PubMed ID');

		identifierSetting.addText((text) => {
			text.setPlaceholder('10.1000/example')
				.setValue(this.identifier)
				.onChange((value) => {
					this.identifier = value;
				});

			// Store reference for updating placeholder
			(this as any).identifierInput = text;
		});

		// Examples section
		const examplesDiv = contentEl.createDiv({ cls: 'citation-import-examples' });
		examplesDiv.createEl('h4', { text: 'Examples:' });

		const examplesList = examplesDiv.createEl('ul');
		examplesList.createEl('li', { text: 'DOI: 10.1038/s41586-021-03819-2' });
		examplesList.createEl('li', { text: 'arXiv: 2301.12345 or arXiv:2301.12345' });
		examplesList.createEl('li', { text: 'PubMed: 12345678' });

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'citation-import-buttons' });

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => {
			this.close();
		});

		const importBtn = buttonContainer.createEl('button', {
			text: 'Import',
			cls: 'mod-cta',
		});
		importBtn.addEventListener('click', async () => {
			await this.handleImport();
		});
	}

	private updatePlaceholder() {
		const placeholders: Record<CitationSource, string> = {
			doi: '10.1000/example',
			arxiv: '2301.12345',
			pubmed: '12345678',
			isbn: '978-3-16-148410-0',
			url: 'https://example.com/paper',
		};

		const input = (this as any).identifierInput;
		if (input) {
			input.setPlaceholder(placeholders[this.source] || '');
		}
	}

	private async handleImport() {
		if (!this.identifier.trim()) {
			new Notice('Please enter an identifier');
			return;
		}

		// Show loading notice
		const loadingNotice = new Notice('Importing citation...', 0);

		try {
			// Import via CitationImporter
			const importer = this.plugin.citationImporter;
			if (!importer) {
				throw new Error('Citation importer not initialized');
			}

			const result = await importer.importCitation({
				source: this.source,
				identifier: this.identifier.trim(),
			});

			loadingNotice.hide();

			if (result.success) {
				await this.onImport(result);
				new Notice(`✓ Citation imported: ${result.entry?.key}`);
				this.close();
			} else {
				new Notice(`✗ Import failed: ${result.error}`);
			}
		} catch (error: any) {
			loadingNotice.hide();
			new Notice(`✗ Import failed: ${error.message}`);
			console.error('Citation import error:', error);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Duplicate Management Dialog
 * UI for reviewing and merging duplicate citations
 */
export class DuplicateManagementDialog extends Modal {
	constructor(
		app: App,
		private plugin: LatexPandocConcealerPlugin,
		private duplicates: Array<{ canonical: string; duplicates: string[]; reason: string }>,
		private onMerge: (canonical: string, duplicates: string[]) => Promise<void>,
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('duplicate-management-dialog');

		// Title
		contentEl.createEl('h2', { text: 'Duplicate Citations' });

		if (this.duplicates.length === 0) {
			contentEl.createEl('p', {
				text: '✓ No duplicate citations found!',
				cls: 'duplicate-empty-state',
			});
			return;
		}

		const description = contentEl.createEl('p', {
			text: `Found ${this.duplicates.length} group(s) of duplicate citations. Review and merge them below.`,
		});
		description.style.color = 'var(--text-muted)';
		description.style.marginBottom = '1.5rem';

		// Duplicate groups
		for (const group of this.duplicates) {
			const groupDiv = contentEl.createDiv({ cls: 'duplicate-group' });

			// Header
			const headerDiv = groupDiv.createDiv({ cls: 'duplicate-group-header' });
			headerDiv.createEl('strong', { text: `Canonical: ${group.canonical}` });
			headerDiv.createEl('span', {
				text: group.reason,
				cls: 'duplicate-reason',
			});

			// Duplicates list
			const listDiv = groupDiv.createDiv({ cls: 'duplicate-list' });
			listDiv.createEl('p', { text: 'Duplicates:' });
			const list = listDiv.createEl('ul');
			for (const dup of group.duplicates) {
				list.createEl('li', { text: dup });
			}

			// Merge button
			const mergeBtn = groupDiv.createEl('button', {
				text: 'Merge Duplicates',
				cls: 'mod-cta',
			});
			mergeBtn.addEventListener('click', async () => {
				await this.onMerge(group.canonical, group.duplicates);
				groupDiv.remove();

				// Check if all done
				if (contentEl.querySelectorAll('.duplicate-group').length === 0) {
					contentEl.empty();
					contentEl.createEl('p', {
						text: '✓ All duplicates merged!',
						cls: 'duplicate-empty-state',
					});
				}
			});
		}

		// Close button
		const closeBtn = contentEl.createEl('button', {
			text: 'Close',
			cls: 'duplicate-close-button',
		});
		closeBtn.addEventListener('click', () => {
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
