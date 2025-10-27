/**
 * Research Fact Input Modal
 * Quick modal for adding research facts to Research Bible
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import type { FactCategory } from '../quality/QualityInterfaces';

export class ResearchFactModal extends Modal {
	private termInput: HTMLInputElement;
	private categoryDropdown: HTMLSelectElement;
	private definitionInput: HTMLTextAreaElement;
	private tagsInput: HTMLInputElement;
	private sourceInput: HTMLTextAreaElement;
	private saveAndNew = false;

	constructor(
		app: App,
		private plugin: ManuscriptProPlugin,
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('research-fact-modal');

		// Title
		contentEl.createEl('h2', { text: 'Add Research Fact' });

		// Term (required)
		new Setting(contentEl)
			.setName('Term')
			.setDesc('The term, name, or concept (required)')
			.addText((text) => {
				this.termInput = text.inputEl;
				text.setPlaceholder('e.g., Quantum entanglement')
					.inputEl.focus();
			});

		// Category
		new Setting(contentEl)
			.setName('Category')
			.setDesc('Type of research fact')
			.addDropdown((dropdown) => {
				this.categoryDropdown = dropdown.selectEl;
				dropdown
					.addOption('definition', 'Definition')
					.addOption('acronym', 'Acronym')
					.addOption('person', 'Person')
					.addOption('organization', 'Organization')
					.addOption('concept', 'Concept')
					.addOption('date', 'Date')
					.addOption('location', 'Location')
					.addOption('custom', 'Custom')
					.setValue('definition');
			});

		// Definition
		new Setting(contentEl)
			.setName('Definition')
			.setDesc('Description or explanation')
			.addTextArea((text) => {
				this.definitionInput = text.inputEl;
				text.setPlaceholder('Detailed description...');
				text.inputEl.rows = 4;
			});

		// Tags
		new Setting(contentEl)
			.setName('Tags')
			.setDesc('Comma-separated tags for organization')
			.addText((text) => {
				this.tagsInput = text.inputEl;
				text.setPlaceholder('e.g., physics, quantum-mechanics');
			});

		// Source
		new Setting(contentEl)
			.setName('Source')
			.setDesc('Reference or citation (optional)')
			.addTextArea((text) => {
				this.sourceInput = text.inputEl;
				text.setPlaceholder('Source reference or URL...');
				text.inputEl.rows = 2;
			});

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

		// Cancel button
		buttonContainer.createEl('button', {
			text: 'Cancel',
			cls: 'mod-cancel',
		}).addEventListener('click', () => {
			this.close();
		});

		// Save & New button
		buttonContainer.createEl('button', {
			text: 'Save & New',
		}).addEventListener('click', () => {
			this.saveAndNew = true;
			this.handleSubmit();
		});

		// Save & Close button (primary)
		buttonContainer.createEl('button', {
			text: 'Save & Close',
			cls: 'mod-cta',
		}).addEventListener('click', () => {
			this.saveAndNew = false;
			this.handleSubmit();
		});

		// Enter key to submit
		contentEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				this.saveAndNew = false;
				this.handleSubmit();
			}
		});
	}

	private handleSubmit() {
		const term = this.termInput.value.trim();
		const category = this.categoryDropdown.value as FactCategory;
		const definition = this.definitionInput.value.trim();
		const tags = this.tagsInput.value
			.split(',')
			.map((t) => t.trim())
			.filter((t) => t.length > 0);
		const source = this.sourceInput.value.trim();

		// Validate required fields
		if (!term) {
			new Notice('⚠ Term is required');
			this.termInput.focus();
			return;
		}

		if (!definition && category !== 'acronym') {
			new Notice('⚠ Definition is required');
			this.definitionInput.focus();
			return;
		}

		try {
			// Add fact using ResearchBibleManager
			this.plugin.researchBible.addFact(
				category,
				term,
				definition,
				source || undefined,
				tags,
			);

			new Notice(`✓ Added: ${term}`);

			if (this.saveAndNew) {
				// Clear form and keep modal open
				this.clearForm();
				this.termInput.focus();
			} else {
				// Close modal
				this.close();
			}
		} catch (error) {
			new Notice(`✗ Failed to add fact: ${error.message}`);
			console.error('Failed to add research fact:', error);
		}
	}

	private clearForm() {
		this.termInput.value = '';
		this.definitionInput.value = '';
		this.tagsInput.value = '';
		this.sourceInput.value = '';
		this.categoryDropdown.value = 'definition';
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
