/**
 * Citation Editor Modal
 * Modal for editing BibTeX entries inline
 */

import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { BibEntry } from './BibTeXParser';

export class CitationEditorModal extends Modal {
	private plugin: LatexPandocConcealerPlugin;
	private entry: BibEntry;
	private onSave: () => void;
	private fields: Map<string, HTMLInputElement | HTMLTextAreaElement> = new Map();

	constructor(
		app: App,
		plugin: LatexPandocConcealerPlugin,
		entry: BibEntry,
		onSave: () => void,
	) {
		super(app);
		this.plugin = plugin;
		this.entry = entry;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('citation-editor-modal');

		// Header
		contentEl.createEl('h2', { text: 'Edit Citation' });

		// Entry type and key (read-only)
		const metaDiv = contentEl.createDiv({ cls: 'citation-meta' });
		new Setting(metaDiv)
			.setName('Entry Type')
			.setDesc('BibTeX entry type')
			.addText((text) => {
				text.setValue(this.entry.type);
				text.setDisabled(true);
			});

		new Setting(metaDiv)
			.setName('Citation Key')
			.setDesc('Unique identifier for this citation')
			.addText((text) => {
				text.setValue(this.entry.key);
				text.setDisabled(true);
			});

		contentEl.createEl('h3', { text: 'Fields' });

		// Create editable fields
		const fieldsDiv = contentEl.createDiv({ cls: 'citation-fields-editor' });

		// Common fields first (in typical order)
		const commonFields = [
			'author',
			'title',
			'journal',
			'booktitle',
			'year',
			'volume',
			'number',
			'pages',
			'publisher',
			'doi',
			'url',
			'abstract',
		];

		// Add common fields that exist in the entry
		for (const field of commonFields) {
			const value = this.entry.fields.get(field);
			if (value !== undefined) {
				this.createFieldEditor(fieldsDiv, field, value);
			}
		}

		// Add remaining fields
		this.entry.fields.forEach((value, key) => {
			if (!commonFields.includes(key)) {
				this.createFieldEditor(fieldsDiv, key, value);
			}
		});

		// Add new field button
		new Setting(fieldsDiv).addButton((btn) =>
			btn
				.setButtonText('+ Add Field')
				.setTooltip('Add a new BibTeX field')
				.onClick(() => {
					const fieldName = prompt('Enter field name:');
					if (fieldName && fieldName.trim()) {
						this.createFieldEditor(fieldsDiv, fieldName.trim(), '');
					}
				}),
		);

		// Action buttons
		const buttonDiv = contentEl.createDiv({ cls: 'citation-editor-buttons' });

		new Setting(buttonDiv)
			.addButton((btn) =>
				btn
					.setButtonText('Cancel')
					.setClass('mod-cancel')
					.onClick(() => {
						this.close();
					}),
			)
			.addButton((btn) =>
				btn
					.setButtonText('Save')
					.setCta()
					.onClick(async () => {
						await this.saveChanges();
					}),
			);
	}

	/**
	 * Create an editable field
	 */
	private createFieldEditor(container: HTMLElement, fieldName: string, value: string): void {
		const setting = new Setting(container)
			.setName(fieldName)
			.setClass('citation-field-setting');

		// Use textarea for long fields
		const isLongField = ['abstract', 'note', 'annote'].includes(fieldName);

		if (isLongField) {
			setting.addTextArea((text) => {
				text.setValue(value);
				text.inputEl.rows = 4;
				text.inputEl.style.width = '100%';
				this.fields.set(fieldName, text.inputEl);
			});
		} else {
			setting.addText((text) => {
				text.setValue(value);
				text.inputEl.style.width = '100%';
				this.fields.set(fieldName, text.inputEl);
			});
		}

		// Delete button
		setting.addButton((btn) =>
			btn
				.setIcon('trash')
				.setTooltip('Remove this field')
				.onClick(() => {
					this.fields.delete(fieldName);
					setting.settingEl.remove();
				}),
		);
	}

	/**
	 * Save changes to the bibliography file
	 */
	private async saveChanges(): Promise<void> {
		try {
			// Collect updated fields
			const updatedFields = new Map<string, string>();
			this.fields.forEach((input, fieldName) => {
				const value = input.value.trim();
				if (value) {
					updatedFields.set(fieldName, value);
				}
			});

			// Update entry in memory
			this.entry.fields = updatedFields;

			// Update in BibliographyManager
			this.plugin.bibliographyManager.addEntry(this.entry.key, this.entry);

			// Write back to file if we know the source file
			const bibFile = this.plugin.bibliographyManager.getBibFileForEntry(this.entry.key);
			if (bibFile) {
				await this.updateBibFile(bibFile);
				new Notice('Citation updated successfully');
			} else {
				new Notice('Citation updated in memory (source file not found)');
			}

			// Trigger callback
			this.onSave();

			this.close();
		} catch (error) {
			console.error('Failed to save citation:', error);
			new Notice('Failed to save citation');
		}
	}

	/**
	 * Update the bibliography file with the modified entry
	 */
	private async updateBibFile(filePath: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) {
			throw new Error('Bibliography file not found');
		}

		// Read current content
		const content = await this.app.vault.read(file);

		// Find and replace the entry
		const entryPattern = new RegExp(
			`(@\\w+\\{${this.entry.key}\\s*,)[\\s\\S]*?\\n\\}`,
			'i',
		);

		const newEntry = this.plugin.bibliographyManager.toBibTeX(this.entry);

		const updatedContent = content.replace(entryPattern, newEntry);

		// Write back to file
		await this.app.vault.modify(file, updatedContent);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
