import { ItemView, WorkspaceLeaf, Menu, setIcon, Notice } from 'obsidian';
import ManuscriptProPlugin from '../main';
import { ResearchNote, ResearchCategory, ResearchPriority, ResearchStatus } from './ResearchInterfaces';
import { ResearchManager } from './ResearchManager';
import { ResearchNoteModal } from './ResearchNoteModal';

export const RESEARCH_VIEW_TYPE = 'manuscript-pro-research';

/**
 * Research notes panel
 */
export class ResearchPanel extends ItemView {
	private plugin: ManuscriptProPlugin;
	private manager: ResearchManager;
	private searchQuery: string = '';
	private sortBy: 'title' | 'category' | 'priority' | 'status' | 'recent' | 'accessed' = 'recent';
	private filterCategory?: ResearchCategory;
	private filterPriority?: ResearchPriority;
	private filterStatus?: ResearchStatus;
	private selectedFolder?: string;

	constructor(leaf: WorkspaceLeaf, plugin: ManuscriptProPlugin, manager: ResearchManager) {
		super(leaf);
		this.plugin = plugin;
		this.manager = manager;
	}

	getViewType(): string {
		return RESEARCH_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Research Notes';
	}

	getIcon(): string {
		return 'book-open';
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	async onClose(): Promise<void> {
		// Cleanup if needed
	}

	/**
	 * Refresh the view
	 */
	refresh(): void {
		this.render();
	}

	/**
	 * Render the research panel
	 */
	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-pro-research-panel');

		// Header
		this.renderHeader();

		// Search and filters
		this.renderSearchBar();
		this.renderFilters();

		// Folder navigation if folder is selected
		if (this.selectedFolder) {
			this.renderFolderBreadcrumb();
		}

		// Research notes list
		this.renderNotesList();

		// Statistics (footer)
		this.renderStatistics();
	}

	/**
	 * Render header with actions
	 */
	private renderHeader(): void {
		const header = this.contentEl.createDiv('research-header');

		const title = header.createEl('h3', { text: 'Research Notes', cls: 'research-title' });

		const actions = header.createDiv('research-actions');

		// Add note button
		const addBtn = actions.createEl('button', { cls: 'research-action-btn' });
		setIcon(addBtn, 'plus');
		addBtn.title = 'New research note';
		addBtn.addEventListener('click', () => this.createNewNote());

		// Folders button
		const foldersBtn = actions.createEl('button', { cls: 'research-action-btn' });
		setIcon(foldersBtn, 'folder');
		foldersBtn.title = 'Manage folders';
		foldersBtn.addEventListener('click', (e) => this.showFoldersMenu(e));

		// Sort menu button
		const sortBtn = actions.createEl('button', { cls: 'research-action-btn' });
		setIcon(sortBtn, 'arrow-up-down');
		sortBtn.title = 'Sort notes';
		sortBtn.addEventListener('click', (e) => this.showSortMenu(e));

		// Refresh button
		const refreshBtn = actions.createEl('button', { cls: 'research-action-btn' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.title = 'Refresh';
		refreshBtn.addEventListener('click', () => this.refresh());
	}

	/**
	 * Render search bar
	 */
	private renderSearchBar(): void {
		const searchContainer = this.contentEl.createDiv('research-search-container');

		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search research notes...',
			cls: 'research-search-input'
		});

		searchInput.value = this.searchQuery;
		searchInput.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value;
			this.renderNotesList();
		});

		// Clear button
		if (this.searchQuery) {
			const clearBtn = searchContainer.createEl('button', { cls: 'research-search-clear' });
			setIcon(clearBtn, 'x');
			clearBtn.addEventListener('click', () => {
				this.searchQuery = '';
				searchInput.value = '';
				this.renderNotesList();
			});
		}
	}

	/**
	 * Render filter chips
	 */
	private renderFilters(): void {
		if (!this.filterCategory && !this.filterPriority && !this.filterStatus) return;

		const filtersContainer = this.contentEl.createDiv('research-filters-container');

		if (this.filterCategory) {
			const chip = filtersContainer.createDiv('research-filter-chip');
			chip.createSpan({ text: `Category: ${this.filterCategory}` });
			const removeBtn = chip.createSpan({ cls: 'research-filter-remove' });
			setIcon(removeBtn, 'x');
			removeBtn.addEventListener('click', () => {
				this.filterCategory = undefined;
				this.render();
			});
		}

		if (this.filterPriority) {
			const chip = filtersContainer.createDiv('research-filter-chip');
			chip.createSpan({ text: `Priority: ${this.filterPriority}` });
			const removeBtn = chip.createSpan({ cls: 'research-filter-remove' });
			setIcon(removeBtn, 'x');
			removeBtn.addEventListener('click', () => {
				this.filterPriority = undefined;
				this.render();
			});
		}

		if (this.filterStatus) {
			const chip = filtersContainer.createDiv('research-filter-chip');
			chip.createSpan({ text: `Status: ${this.filterStatus}` });
			const removeBtn = chip.createSpan({ cls: 'research-filter-remove' });
			setIcon(removeBtn, 'x');
			removeBtn.addEventListener('click', () => {
				this.filterStatus = undefined;
				this.render();
			});
		}
	}

	/**
	 * Render folder breadcrumb
	 */
	private renderFolderBreadcrumb(): void {
		const breadcrumb = this.contentEl.createDiv('research-breadcrumb');

		const homeBtn = breadcrumb.createEl('button', { text: 'All Notes', cls: 'research-breadcrumb-item' });
		homeBtn.addEventListener('click', () => {
			this.selectedFolder = undefined;
			this.render();
		});

		breadcrumb.createSpan({ text: '/', cls: 'research-breadcrumb-sep' });

		const folder = this.manager.getFolder(this.selectedFolder!);
		if (folder) {
			breadcrumb.createSpan({ text: folder.name, cls: 'research-breadcrumb-item active' });
		}
	}

	/**
	 * Render research notes list
	 */
	private renderNotesList(): void {
		// Remove old list if it exists
		const oldList = this.contentEl.querySelector('.research-list-container');
		if (oldList) oldList.remove();

		const listContainer = this.contentEl.createDiv('research-list-container');

		// Get notes
		let notes = this.manager.getAllNotes();

		// Filter by folder if selected
		if (this.selectedFolder) {
			notes = this.manager.getNotesInFolder(this.selectedFolder);
		}

		// Apply search
		if (this.searchQuery.trim()) {
			const results = this.manager.searchNotes(this.searchQuery);
			notes = results.map(r => r.note);
		} else {
			// Apply filters
			if (this.filterCategory || this.filterPriority || this.filterStatus) {
				notes = this.manager.filterNotes({
					category: this.filterCategory,
					priority: this.filterPriority,
					status: this.filterStatus
				});
			}

			// Sort
			notes = this.manager.sortNotes(notes, this.sortBy);
		}

		// Render notes
		if (notes.length === 0) {
			this.renderEmptyState(listContainer);
		} else {
			notes.forEach(note => {
				this.renderNoteCard(listContainer, note);
			});
		}
	}

	/**
	 * Render a research note card
	 */
	private renderNoteCard(container: HTMLElement, note: ResearchNote): void {
		const card = container.createDiv('research-card');
		card.setAttribute('data-note-id', note.id);

		// Header
		const cardHeader = card.createDiv('research-card-header');

		// Color indicator
		if (note.color) {
			const colorDot = cardHeader.createDiv('research-color-dot');
			colorDot.style.backgroundColor = note.color;
		}

		// Title
		const title = cardHeader.createDiv('research-title-text');
		title.textContent = note.title;

		// Category badge
		const categoryBadge = cardHeader.createDiv('research-category-badge');
		categoryBadge.textContent = note.category;
		categoryBadge.addClass(`category-${note.category}`);

		// Summary
		if (note.summary) {
			const summary = card.createDiv('research-summary');
			summary.textContent = note.summary;
		}

		// Metadata
		const metadata = card.createDiv('research-metadata');

		// Priority indicator
		const priorityIcon = metadata.createSpan({ cls: 'research-meta-item' });
		setIcon(priorityIcon, this.getPriorityIcon(note.priority));
		metadata.createSpan({ text: note.priority, cls: `research-meta-text priority-${note.priority}` });

		// Status indicator
		const statusIcon = metadata.createSpan({ cls: 'research-meta-item' });
		setIcon(statusIcon, this.getStatusIcon(note.status));
		metadata.createSpan({ text: note.status, cls: `research-meta-text status-${note.status}` });

		// Tags
		if (note.tags && note.tags.length > 0) {
			const tagsContainer = card.createDiv('research-tags');
			note.tags.slice(0, 3).forEach(tag => {
				const tagEl = tagsContainer.createSpan({ text: `#${tag}`, cls: 'research-tag' });
			});
			if (note.tags.length > 3) {
				tagsContainer.createSpan({ text: `+${note.tags.length - 3}`, cls: 'research-tag-more' });
			}
		}

		// Citations count
		if (note.citations && note.citations.length > 0) {
			const citationIcon = metadata.createSpan({ cls: 'research-meta-item' });
			setIcon(citationIcon, 'quote');
			metadata.createSpan({
				text: `${note.citations.length} citations`,
				cls: 'research-meta-text'
			});
		}

		// Click to view details
		card.addEventListener('click', () => this.viewNoteDetails(note.id));

		// Context menu
		card.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showNoteContextMenu(e, note);
		});
	}

	/**
	 * Get icon for priority
	 */
	private getPriorityIcon(priority: ResearchPriority): string {
		switch (priority) {
			case 'high': return 'alert-circle';
			case 'medium': return 'circle';
			case 'low': return 'circle-dot';
			default: return 'circle';
		}
	}

	/**
	 * Get icon for status
	 */
	private getStatusIcon(status: ResearchStatus): string {
		switch (status) {
			case 'to-verify': return 'help-circle';
			case 'verified': return 'check-circle';
			case 'needs-citation': return 'alert-triangle';
			case 'complete': return 'check-circle-2';
			default: return 'circle';
		}
	}

	/**
	 * Render empty state
	 */
	private renderEmptyState(container: HTMLElement): void {
		const empty = container.createDiv('research-empty-state');

		if (this.searchQuery.trim()) {
			empty.createEl('p', { text: 'No research notes found' });
		} else if (this.selectedFolder) {
			empty.createEl('p', { text: 'This folder is empty' });
			const createBtn = empty.createEl('button', {
				text: 'Create First Note',
				cls: 'mod-cta'
			});
			createBtn.addEventListener('click', () => this.createNewNote());
		} else {
			empty.createEl('p', { text: 'No research notes yet' });
			const createBtn = empty.createEl('button', {
				text: 'Create First Note',
				cls: 'mod-cta'
			});
			createBtn.addEventListener('click', () => this.createNewNote());
		}
	}

	/**
	 * Render statistics footer
	 */
	private renderStatistics(): void {
		const stats = this.manager.getStatistics();
		const footer = this.contentEl.createDiv('research-statistics');

		footer.createSpan({
			text: `${stats.totalNotes} total`,
			cls: 'research-stat-item'
		});

		if (stats.needsVerification > 0) {
			footer.createSpan({
				text: `${stats.needsVerification} to verify`,
				cls: 'research-stat-item warning'
			});
		}

		if (stats.needsCitation > 0) {
			footer.createSpan({
				text: `${stats.needsCitation} need citations`,
				cls: 'research-stat-item warning'
			});
		}
	}

	// ========== MENUS ==========

	/**
	 * Show sort menu
	 */
	private showSortMenu(e: MouseEvent): void {
		const menu = new Menu();

		menu.addItem(item => item
			.setTitle('Sort by Title')
			.setIcon('sort-asc')
			.setChecked(this.sortBy === 'title')
			.onClick(() => {
				this.sortBy = 'title';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Category')
			.setIcon('tag')
			.setChecked(this.sortBy === 'category')
			.onClick(() => {
				this.sortBy = 'category';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Priority')
			.setIcon('alert-circle')
			.setChecked(this.sortBy === 'priority')
			.onClick(() => {
				this.sortBy = 'priority';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Status')
			.setIcon('check-circle')
			.setChecked(this.sortBy === 'status')
			.onClick(() => {
				this.sortBy = 'status';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Recent')
			.setIcon('clock')
			.setChecked(this.sortBy === 'recent')
			.onClick(() => {
				this.sortBy = 'recent';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Accessed')
			.setIcon('eye')
			.setChecked(this.sortBy === 'accessed')
			.onClick(() => {
				this.sortBy = 'accessed';
				this.render();
			})
		);

		menu.showAtMouseEvent(e);
	}

	/**
	 * Show folders menu
	 */
	private showFoldersMenu(e: MouseEvent): void {
		const menu = new Menu();

		// All notes
		menu.addItem(item => item
			.setTitle('All Notes')
			.setIcon('book-open')
			.setChecked(!this.selectedFolder)
			.onClick(() => {
				this.selectedFolder = undefined;
				this.render();
			})
		);

		menu.addSeparator();

		// List folders
		const folders = this.manager.getAllFolders();
		folders.forEach(folder => {
			menu.addItem(item => item
				.setTitle(folder.name)
				.setIcon('folder')
				.setChecked(this.selectedFolder === folder.id)
				.onClick(() => {
					this.selectedFolder = folder.id;
					this.render();
				})
			);
		});

		menu.addSeparator();

		// Create new folder
		menu.addItem(item => item
			.setTitle('New Folder')
			.setIcon('folder-plus')
			.onClick(() => this.createNewFolder())
		);

		menu.showAtMouseEvent(e);
	}

	/**
	 * Show note context menu
	 */
	private showNoteContextMenu(e: MouseEvent, note: ResearchNote): void {
		const menu = new Menu();

		menu.addItem(item => item
			.setTitle('View Details')
			.setIcon('eye')
			.onClick(() => this.viewNoteDetails(note.id))
		);

		menu.addSeparator();

		// Filter by category
		menu.addItem(item => item
			.setTitle(`Filter by ${note.category}`)
			.setIcon('filter')
			.onClick(() => {
				this.filterCategory = note.category;
				this.render();
			})
		);

		// Filter by priority
		menu.addItem(item => item
			.setTitle(`Filter by ${note.priority} priority`)
			.setIcon('alert-circle')
			.onClick(() => {
				this.filterPriority = note.priority;
				this.render();
			})
		);

		// Filter by status
		menu.addItem(item => item
			.setTitle(`Filter by ${note.status}`)
			.setIcon('check-circle')
			.onClick(() => {
				this.filterStatus = note.status;
				this.render();
			})
		);

		menu.addSeparator();

		menu.addItem(item => item
			.setTitle('Delete')
			.setIcon('trash')
			.onClick(() => this.deleteNote(note.id))
		);

		menu.showAtMouseEvent(e);
	}

	// ========== ACTIONS ==========

	private async createNewNote(): Promise<void> {
		const title = await this.promptForInput('New Research Note', 'Enter note title:');
		if (!title) return;

		const note = this.manager.createNote(title, 'other', 'medium');

		// Add to selected folder if any
		if (this.selectedFolder) {
			this.manager.addNoteToFolder(note.id, this.selectedFolder);
		}

		await this.plugin.saveSettings();
		this.refresh();
		new Notice('Research note created');
	}

	private async createNewFolder(): Promise<void> {
		const name = await this.promptForInput('New Folder', 'Enter folder name:');
		if (!name) return;

		this.manager.createFolder(name);
		await this.plugin.saveSettings();
		this.refresh();
		new Notice('Folder created');
	}

	private viewNoteDetails(noteId: string): void {
		new ResearchNoteModal(
			this.app,
			this.manager,
			noteId,
			async () => {
				await this.plugin.saveSettings();
				this.refresh();
			}
		).open();
	}

	private async deleteNote(noteId: string): Promise<void> {
		const note = this.manager.getNote(noteId);
		if (!note) return;

		const confirmed = confirm(`Delete research note "${note.title}"? This cannot be undone.`);
		if (!confirmed) return;

		this.manager.deleteNote(noteId);
		await this.plugin.saveSettings();
		this.refresh();
		new Notice('Research note deleted');
	}

	/**
	 * Simple input prompt
	 */
	private async promptForInput(title: string, placeholder: string, defaultValue?: string): Promise<string | null> {
		return new Promise((resolve) => {
			const input = prompt(title + '\n' + placeholder, defaultValue || '');
			resolve(input);
		});
	}
}
