import { App, Modal, Setting, setIcon, Notice } from 'obsidian';
import { ResearchManager } from './ResearchManager';
import { ResearchNote, ResearchCategory, ResearchPriority, ResearchStatus, ResearchCitation } from './ResearchInterfaces';

/**
 * Modal for editing research note details
 */
export class ResearchNoteModal extends Modal {
	private manager: ResearchManager;
	private noteId: string;
	private note: ResearchNote;
	private onSave: () => void;
	private activeTab: string = 'basic';

	constructor(
		app: App,
		manager: ResearchManager,
		noteId: string,
		onSave: () => void
	) {
		super(app);
		this.manager = manager;
		this.noteId = noteId;
		this.onSave = onSave;

		// Get note and create deep copy for editing
		const original = this.manager.getNote(noteId);
		if (!original) {
			throw new Error(`Research note ${noteId} not found`);
		}
		this.note = JSON.parse(JSON.stringify(original));
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('research-note-modal');

		// Title
		const titleEl = contentEl.createEl('h2', { text: 'Edit Research Note' });

		// Tabs
		this.renderTabs();

		// Tab content
		const tabContent = contentEl.createDiv('research-note-tab-content');
		this.renderTabContent(tabContent);

		// Buttons
		const buttonContainer = contentEl.createDiv('research-note-buttons');

		const saveBtn = buttonContainer.createEl('button', { text: 'Save', cls: 'mod-cta' });
		saveBtn.addEventListener('click', () => this.save());

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	/**
	 * Render tab navigation
	 */
	private renderTabs(): void {
		const tabsContainer = this.contentEl.createDiv('research-note-tabs');

		const tabs = [
			{ id: 'basic', label: 'Basic Info', icon: 'info' },
			{ id: 'content', label: 'Content', icon: 'file-text' },
			{ id: 'citations', label: 'Citations', icon: 'quote' },
			{ id: 'links', label: 'Links', icon: 'link' }
		];

		tabs.forEach(tab => {
			const tabEl = tabsContainer.createDiv('research-note-tab');
			if (tab.id === this.activeTab) {
				tabEl.addClass('active');
			}

			const iconEl = tabEl.createSpan({ cls: 'research-note-tab-icon' });
			setIcon(iconEl, tab.icon);
			tabEl.createSpan({ text: tab.label });

			tabEl.addEventListener('click', () => {
				this.activeTab = tab.id;
				this.onOpen();
			});
		});
	}

	/**
	 * Render active tab content
	 */
	private renderTabContent(container: HTMLElement): void {
		container.empty();

		switch (this.activeTab) {
			case 'basic':
				this.renderBasicTab(container);
				break;
			case 'content':
				this.renderContentTab(container);
				break;
			case 'citations':
				this.renderCitationsTab(container);
				break;
			case 'links':
				this.renderLinksTab(container);
				break;
		}
	}

	/**
	 * Render basic info tab
	 */
	private renderBasicTab(container: HTMLElement): void {
		// Title
		new Setting(container)
			.setName('Title')
			.setDesc('Research note title')
			.addText(text => text
				.setValue(this.note.title)
				.onChange(value => {
					this.note.title = value;
				})
			);

		// Category
		new Setting(container)
			.setName('Category')
			.setDesc('Type of research')
			.addDropdown(dropdown => {
				const categories: ResearchCategory[] = [
					'historical-fact',
					'technical-detail',
					'location',
					'terminology',
					'character-research',
					'plot-research',
					'reference',
					'quote',
					'other'
				];

				categories.forEach(cat => {
					dropdown.addOption(cat, cat);
				});

				dropdown.setValue(this.note.category)
					.onChange(value => {
						this.note.category = value as ResearchCategory;
					});
			});

		// Priority
		new Setting(container)
			.setName('Priority')
			.setDesc('Research priority level')
			.addDropdown(dropdown => {
				const priorities: ResearchPriority[] = ['high', 'medium', 'low'];

				priorities.forEach(pri => {
					dropdown.addOption(pri, pri);
				});

				dropdown.setValue(this.note.priority)
					.onChange(value => {
						this.note.priority = value as ResearchPriority;
					});
			});

		// Status
		new Setting(container)
			.setName('Status')
			.setDesc('Verification status')
			.addDropdown(dropdown => {
				const statuses: ResearchStatus[] = [
					'to-verify',
					'verified',
					'needs-citation',
					'complete'
				];

				statuses.forEach(status => {
					dropdown.addOption(status, status);
				});

				dropdown.setValue(this.note.status)
					.onChange(value => {
						this.note.status = value as ResearchStatus;
					});
			});

		// Summary
		new Setting(container)
			.setName('Summary')
			.setDesc('Brief summary for quick reference')
			.addTextArea(text => {
				text.setValue(this.note.summary || '')
					.onChange(value => {
						this.note.summary = value;
					});
				text.inputEl.rows = 3;
			});

		// Tags
		new Setting(container)
			.setName('Tags')
			.setDesc('Comma-separated tags')
			.addText(text => text
				.setValue(this.note.tags.join(', '))
				.setPlaceholder('tag1, tag2, tag3')
				.onChange(value => {
					this.note.tags = value
						.split(',')
						.map(t => t.trim().toLowerCase())
						.filter(t => t.length > 0);
				})
			);

		// Color
		new Setting(container)
			.setName('Color')
			.setDesc('Visual identification color')
			.addText(text => {
				text.setValue(this.note.color || '#808080')
					.setPlaceholder('#808080')
					.onChange(value => {
						this.note.color = value;
					});
				text.inputEl.type = 'color';
			});
	}

	/**
	 * Render content tab
	 */
	private renderContentTab(container: HTMLElement): void {
		new Setting(container)
			.setName('Content')
			.setDesc('Main research content')
			.addTextArea(text => {
				text.setValue(this.note.content)
					.onChange(value => {
						this.note.content = value;
					});
				text.inputEl.rows = 20;
				text.inputEl.style.width = '100%';
				text.inputEl.style.fontFamily = 'monospace';
			});
	}

	/**
	 * Render citations tab
	 */
	private renderCitationsTab(container: HTMLElement): void {
		const citationsHeader = container.createDiv('citations-header');
		citationsHeader.createEl('h3', { text: 'Citations' });

		const addBtn = citationsHeader.createEl('button', { text: 'Add Citation', cls: 'mod-cta' });
		addBtn.addEventListener('click', () => this.addCitation());

		// List existing citations
		if (!this.note.citations) {
			this.note.citations = [];
		}

		if (this.note.citations.length === 0) {
			container.createEl('p', { text: 'No citations yet', cls: 'setting-item-description' });
		} else {
			this.note.citations.forEach((citation, index) => {
				this.renderCitation(container, citation, index);
			});
		}
	}

	/**
	 * Render a single citation
	 */
	private renderCitation(container: HTMLElement, citation: ResearchCitation, index: number): void {
		const citationEl = container.createDiv('citation-item');

		const citationHeader = citationEl.createDiv('citation-header');
		citationHeader.createEl('h4', { text: `Citation ${index + 1}` });

		const deleteBtn = citationHeader.createEl('button', { text: 'Remove', cls: 'mod-warning' });
		deleteBtn.addEventListener('click', () => {
			this.note.citations!.splice(index, 1);
			this.onOpen();
		});

		// Source
		new Setting(citationEl)
			.setName('Source')
			.addText(text => text
				.setValue(citation.source)
				.onChange(value => {
					citation.source = value;
				})
			);

		// Author
		new Setting(citationEl)
			.setName('Author')
			.addText(text => text
				.setValue(citation.author || '')
				.onChange(value => {
					citation.author = value;
				})
			);

		// Title
		new Setting(citationEl)
			.setName('Title')
			.addText(text => text
				.setValue(citation.title || '')
				.onChange(value => {
					citation.title = value;
				})
			);

		// Year
		new Setting(citationEl)
			.setName('Year')
			.addText(text => text
				.setValue(citation.year || '')
				.onChange(value => {
					citation.year = value;
				})
			);

		// URL
		new Setting(citationEl)
			.setName('URL')
			.addText(text => text
				.setValue(citation.url || '')
				.onChange(value => {
					citation.url = value;
				})
			);

		// Page Numbers
		new Setting(citationEl)
			.setName('Page Numbers')
			.addText(text => text
				.setValue(citation.pageNumbers || '')
				.onChange(value => {
					citation.pageNumbers = value;
				})
			);

		// Notes
		new Setting(citationEl)
			.setName('Notes')
			.addTextArea(text => {
				text.setValue(citation.notes || '')
					.onChange(value => {
						citation.notes = value;
					});
				text.inputEl.rows = 2;
			});

		// Bibliography key
		new Setting(citationEl)
			.setName('Bibliography Key')
			.setDesc('Link to bibliography entry')
			.addText(text => text
				.setValue(citation.bibKey || '')
				.setPlaceholder('@citekey')
				.onChange(value => {
					citation.bibKey = value;
				})
			);
	}

	/**
	 * Add new citation
	 */
	private addCitation(): void {
		if (!this.note.citations) {
			this.note.citations = [];
		}

		this.note.citations.push({
			source: '',
			author: '',
			title: '',
			year: '',
			url: '',
			pageNumbers: '',
			notes: '',
			bibKey: ''
		});

		this.onOpen();
	}

	/**
	 * Render links tab
	 */
	private renderLinksTab(container: HTMLElement): void {
		// Linked Notes
		new Setting(container)
			.setName('Linked Notes')
			.setDesc('Related research note IDs (comma-separated)')
			.addText(text => text
				.setValue((this.note.linkedNotes || []).join(', '))
				.setPlaceholder('note_id1, note_id2')
				.onChange(value => {
					this.note.linkedNotes = value
						.split(',')
						.map(id => id.trim())
						.filter(id => id.length > 0);
				})
			);

		// Related Scenes
		new Setting(container)
			.setName('Related Scenes')
			.setDesc('Scene IDs where this research is relevant (comma-separated)')
			.addText(text => text
				.setValue((this.note.relatedScenes || []).join(', '))
				.setPlaceholder('scene_id1, scene_id2')
				.onChange(value => {
					this.note.relatedScenes = value
						.split(',')
						.map(id => id.trim())
						.filter(id => id.length > 0);
				})
			);

		// Related Characters
		new Setting(container)
			.setName('Related Characters')
			.setDesc('Character IDs this research relates to (comma-separated)')
			.addText(text => text
				.setValue((this.note.relatedCharacters || []).join(', '))
				.setPlaceholder('char_id1, char_id2')
				.onChange(value => {
					this.note.relatedCharacters = value
						.split(',')
						.map(id => id.trim())
						.filter(id => id.length > 0);
				})
			);

		// Linked File
		new Setting(container)
			.setName('Linked File')
			.setDesc('Path to detailed research file')
			.addText(text => text
				.setValue(this.note.linkedFile?.path || '')
				.setPlaceholder('path/to/file.md')
				.onChange(value => {
					// Will be set when saved
				})
			);
	}

	/**
	 * Save changes
	 */
	private save(): void {
		// Validate
		if (!this.note.title.trim()) {
			new Notice('Title is required');
			return;
		}

		// Update the note
		this.manager.updateNote(this.noteId, this.note);

		// Mark as accessed
		this.manager.markAccessed(this.noteId);

		this.onSave();
		this.close();
	}
}
