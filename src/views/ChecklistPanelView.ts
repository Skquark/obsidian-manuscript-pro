import { ItemView, WorkspaceLeaf, TFile, MarkdownView } from 'obsidian';
import ManuscriptProPlugin from '../main';
import { PublicationChecklist, ChecklistItem } from '../quality/QualityInterfaces';

export const CHECKLIST_PANEL_VIEW_TYPE = 'manuscript-pro-checklist-panel';

export class ChecklistPanelView extends ItemView {
	private plugin: ManuscriptProPlugin;
	private currentFile: TFile | null = null;
	private checklist: PublicationChecklist | null = null;
	private notesTextarea: HTMLTextAreaElement | null = null;
	private notesDebounceTimer: NodeJS.Timeout | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: ManuscriptProPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return CHECKLIST_PANEL_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Publication Checklist';
	}

	getIcon(): string {
		return 'clipboard-check';
	}

	async onOpen(): Promise<void> {
		this.containerEl.empty();
		this.containerEl.addClass('manuscript-pro-checklist-panel');

		// Listen for active file changes
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.refreshChecklist();
			}),
		);

		this.registerEvent(
			this.app.workspace.on('file-open', () => {
				this.refreshChecklist();
			}),
		);

		await this.refreshChecklist();
	}

	async onClose(): Promise<void> {
		this.containerEl.empty();
	}

	async refreshChecklist(): Promise<void> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (!activeView || !activeView.file) {
			this.renderEmptyState('no-file');
			return;
		}

		this.currentFile = activeView.file;
		this.checklist = this.plugin.checklistManager.getChecklist(this.currentFile);

		this.renderChecklist();
	}

	private renderEmptyState(type: 'no-file' | 'uninitialized'): void {
		this.containerEl.empty();

		const emptyState = this.containerEl.createDiv('checklist-empty-state');

		if (type === 'no-file') {
			emptyState.createEl('div', {
				cls: 'checklist-empty-icon',
				text: '📄',
			});
			emptyState.createEl('h3', {
				cls: 'checklist-empty-title',
				text: 'No file open',
			});
			emptyState.createEl('p', {
				cls: 'checklist-empty-message',
				text: 'Open a manuscript file to view its publication checklist.',
			});
		}
	}

	private renderChecklist(): void {
		if (!this.checklist || !this.currentFile) return;

		this.containerEl.empty();

		// Header
		const header = this.containerEl.createDiv('checklist-header');

		const titleRow = header.createDiv('checklist-header-row');
		titleRow.createEl('h2', {
			cls: 'checklist-title',
			text: 'Publication Checklist',
		});

		const headerActions = titleRow.createDiv('checklist-header-actions');

		const refreshBtn = headerActions.createEl('button', {
			cls: 'checklist-btn-icon',
			attr: { 'aria-label': 'Refresh checklist' },
		});
		refreshBtn.innerHTML = '🔄';
		refreshBtn.addEventListener('click', () => this.refreshChecklist());

		const menuBtn = headerActions.createEl('button', {
			cls: 'checklist-btn-icon',
			attr: { 'aria-label': 'Checklist menu' },
		});
		menuBtn.innerHTML = '⋮';
		menuBtn.addEventListener('click', (e) => this.showMenu(e));

		// Document info
		const docInfo = header.createDiv('checklist-document-info');
		docInfo.createEl('div', {
			cls: 'checklist-document-name',
			text: this.currentFile.basename,
		});

		// Progress bar
		const progress = this.calculateProgress();
		const progressContainer = docInfo.createDiv('checklist-progress-container');
		progressContainer.createEl('div', {
			cls: 'checklist-progress-label',
			text: `${progress.completed} of ${progress.total} items complete`,
		});

		const progressBar = progressContainer.createDiv('checklist-progress-bar');
		const progressFill = progressBar.createDiv('checklist-progress-fill');
		progressFill.style.width = `${progress.percentage}%`;

		progressContainer.createEl('div', {
			cls: 'checklist-progress-percentage',
			text: `${progress.percentage}%`,
		});

		// Type selector and filters
		const controls = header.createDiv('checklist-controls');

		const typeGroup = controls.createDiv('checklist-control-group');
		typeGroup.createEl('label', {
			cls: 'checklist-control-label',
			text: 'Type:',
		});

		const typeSelect = typeGroup.createEl('select', {
			cls: 'checklist-type-select',
		});
		['academic-paper', 'thesis', 'technical-doc', 'conference-paper', 'grant-proposal'].forEach((type) => {
			const option = typeSelect.createEl('option', {
				value: type,
				text: type
					.split('-')
					.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
					.join(' '),
			});
			if (type === this.checklist!.type) {
				option.selected = true;
			}
		});
		typeSelect.addEventListener('change', async () => {
			if (this.currentFile && this.checklist) {
				this.checklist.type = typeSelect.value as any;
				await this.refreshChecklist();
			}
		});

		const filterGroup = controls.createDiv('checklist-control-group');

		const showAllBtn = filterGroup.createEl('button', {
			cls: 'checklist-filter-btn checklist-filter-active',
			text: 'All',
		});
		const showPendingBtn = filterGroup.createEl('button', {
			cls: 'checklist-filter-btn',
			text: 'Pending',
		});
		const showCompleteBtn = filterGroup.createEl('button', {
			cls: 'checklist-filter-btn',
			text: 'Complete',
		});

		let currentFilter: 'all' | 'pending' | 'complete' = 'all';

		const updateFilter = (filter: 'all' | 'pending' | 'complete', btn: HTMLElement) => {
			currentFilter = filter;
			[showAllBtn, showPendingBtn, showCompleteBtn].forEach((b) => b.removeClass('checklist-filter-active'));
			btn.addClass('checklist-filter-active');
			this.renderItems(currentFilter);
		};

		showAllBtn.addEventListener('click', () => updateFilter('all', showAllBtn));
		showPendingBtn.addEventListener('click', () => updateFilter('pending', showPendingBtn));
		showCompleteBtn.addEventListener('click', () => updateFilter('complete', showCompleteBtn));

		// Items container (will be populated by renderItems)
		const itemsContainer = this.containerEl.createDiv('checklist-items-container');
		this.containerEl.setAttribute('data-items-container', 'true');

		// Notes section
		const notesSection = this.containerEl.createDiv('checklist-notes-section');
		notesSection.createEl('label', {
			cls: 'checklist-notes-label',
			text: 'Notes',
		});

		this.notesTextarea = notesSection.createEl('textarea', {
			cls: 'checklist-notes-textarea',
			attr: {
				placeholder: 'Add notes about this checklist...',
				rows: '4',
			},
		});
		this.notesTextarea.value = this.checklist.notes || '';
		this.notesTextarea.addEventListener('input', () => this.handleNotesChange());

		// Footer
		const footer = this.containerEl.createDiv('checklist-footer');

		const exportBtn = footer.createEl('button', {
			cls: 'checklist-btn-secondary',
			text: 'Export',
		});
		exportBtn.addEventListener('click', () => this.exportChecklist());

		const markAllBtn = footer.createEl('button', {
			cls: 'checklist-btn-primary',
			text: 'Mark All Complete',
		});
		markAllBtn.addEventListener('click', () => this.markAllComplete());

		// Initial render of items
		this.renderItems(currentFilter);
	}

	private renderItems(filter: 'all' | 'pending' | 'complete'): void {
		if (!this.checklist) return;

		const container = this.containerEl.querySelector('.checklist-items-container');
		if (!container) return;

		container.empty();

		// Group items by category
		const categories = new Map<string, ChecklistItem[]>();

		this.checklist.items.forEach((item) => {
			if (filter === 'pending' && item.checked) return;
			if (filter === 'complete' && !item.checked) return;

			const category = item.category || 'General';
			if (!categories.has(category)) {
				categories.set(category, []);
			}
			categories.get(category)!.push(item);
		});

		// Render each category
		categories.forEach((items, category) => {
			const categorySection = container.createDiv('checklist-category');

			const categoryHeader = categorySection.createDiv('checklist-category-header');

			const toggleBtn = categoryHeader.createEl('button', {
				cls: 'checklist-category-toggle',
				attr: { 'aria-label': 'Toggle category' },
			});
			toggleBtn.innerHTML = '▼';

			categoryHeader.createEl('h3', {
				cls: 'checklist-category-title',
				text: category,
			});

			const completedCount = items.filter((i) => i.checked).length;
			categoryHeader.createEl('span', {
				cls: 'checklist-category-count',
				text: `${completedCount}/${items.length}`,
			});

			const itemsList = categorySection.createDiv('checklist-items-list');

			// Render items in this category
			items.forEach((item) => {
				this.renderItem(itemsList, item);
			});

			// Toggle collapse
			categoryHeader.addEventListener('click', () => {
				const isCollapsed = categorySection.hasClass('checklist-category-collapsed');
				if (isCollapsed) {
					categorySection.removeClass('checklist-category-collapsed');
					toggleBtn.innerHTML = '▼';
				} else {
					categorySection.addClass('checklist-category-collapsed');
					toggleBtn.innerHTML = '▶';
				}
			});
		});
	}

	private renderItem(container: HTMLElement, item: ChecklistItem): void {
		const itemEl = container.createDiv('checklist-item');
		if (item.checked) {
			itemEl.addClass('checklist-item-completed');
		}

		const checkbox = itemEl.createEl('input', {
			type: 'checkbox',
			cls: 'checklist-item-checkbox',
		});
		checkbox.checked = item.checked;
		checkbox.addEventListener('change', async () => {
			await this.toggleItem(item.id);
		});

		const label = itemEl.createDiv('checklist-item-label');
		label.createEl('div', {
			cls: 'checklist-item-title',
			text: item.text,
		});

		if (item.helpText) {
			label.createEl('div', {
				cls: 'checklist-item-description',
				text: item.helpText,
			});
		}

		const actions = itemEl.createDiv('checklist-item-actions');

		if (item.autoCheck) {
			const validateBtn = actions.createEl('button', {
				cls: 'checklist-btn-icon-small',
				attr: { 'aria-label': 'Auto-validate' },
			});
			validateBtn.innerHTML = '🔍';
			validateBtn.addEventListener('click', async () => {
				await this.autoValidateItem(item);
			});
		}
	}

	private async toggleItem(itemId: string): Promise<void> {
		if (!this.currentFile || !this.checklist) return;

		this.plugin.checklistManager.toggleItem(this.currentFile.path, itemId);
		await this.refreshChecklist();
	}

	private async autoValidateItem(item: ChecklistItem): Promise<void> {
		if (!this.currentFile || !item.autoCheck) return;

		const result = await item.autoCheck();
		if (result !== item.checked) {
			this.plugin.checklistManager.toggleItem(this.currentFile.path, item.id);
			await this.refreshChecklist();
		}
	}

	private handleNotesChange(): void {
		if (this.notesDebounceTimer) {
			clearTimeout(this.notesDebounceTimer);
		}

		this.notesDebounceTimer = setTimeout(() => {
			if (this.currentFile && this.checklist && this.notesTextarea) {
				this.checklist.notes = this.notesTextarea.value;
				// Note: The manager saves automatically when toggling items
				// Notes are saved when the checklist object is modified
			}
		}, 500);
	}

	private calculateProgress(): { completed: number; total: number; percentage: number } {
		if (!this.checklist) {
			return { completed: 0, total: 0, percentage: 0 };
		}

		const completed = this.checklist.items.filter((i) => i.checked).length;
		const total = this.checklist.items.length;
		const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

		return { completed, total, percentage };
	}

	private async markAllComplete(): Promise<void> {
		if (!this.currentFile || !this.checklist) return;

		this.checklist.items.forEach((item) => {
			if (!item.checked) {
				this.plugin.checklistManager.toggleItem(this.currentFile!.path, item.id);
			}
		});

		await this.refreshChecklist();
	}

	private exportChecklist(): void {
		if (!this.checklist || !this.currentFile) return;

		const markdown = this.plugin.checklistManager.exportAsMarkdown(this.currentFile.path);
		navigator.clipboard.writeText(markdown);

		// TODO: Replace with Obsidian Notice when available
		console.log('Checklist exported to clipboard');
	}

	private showMenu(event: MouseEvent): void {
		// TODO: Implement menu with options like:
		// - Reset checklist
		// - Import checklist
		// - Settings
		console.log('Menu clicked');
	}
}
