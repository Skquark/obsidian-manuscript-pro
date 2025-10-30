/**
 * Plot Arc Panel
 * Main panel view for managing plot threads and story structure
 */

import { ItemView, WorkspaceLeaf, Menu, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { PlotThread, PlotThreadType, PlotThreadStatus } from './PlotArcInterfaces';
import { DEFAULT_THREAD_COLORS } from './PlotArcInterfaces';
import { PlotThreadEditorModal } from './PlotThreadEditorModal';

export const PLOT_ARC_VIEW_TYPE = 'plot-arc-panel';

export class PlotArcPanelView extends ItemView {
	private plugin: LatexPandocConcealerPlugin;
	private currentView: 'list' | 'timeline' | 'graph' = 'list';
	private filterType: PlotThreadType | 'all' = 'all';
	private filterStatus: PlotThreadStatus | 'all' = 'all';

	constructor(leaf: WorkspaceLeaf, plugin: LatexPandocConcealerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return PLOT_ARC_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Plot Arc Tracker';
	}

	getIcon(): string {
		return 'trending-up';
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('plot-arc-panel');

		this.renderPanel(container);
	}

	async onClose(): Promise<void> {
		// Cleanup if needed
	}

	private renderPanel(container: HTMLElement): void {
		// Header
		const header = container.createDiv({ cls: 'plot-arc-header' });

		const titleContainer = header.createDiv({ cls: 'plot-arc-title-container' });
		titleContainer.createEl('h4', { text: 'Plot Arc Tracker' });

		// Action buttons
		const actions = header.createDiv({ cls: 'plot-arc-actions' });

		// Create thread button
		const createBtn = actions.createEl('button', {
			cls: 'plot-arc-btn',
			attr: { 'aria-label': 'Create new plot thread' },
		});
		createBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
		createBtn.addEventListener('click', () => this.createNewThread());

		// Analyze button
		const analyzeBtn = actions.createEl('button', {
			cls: 'plot-arc-btn',
			attr: { 'aria-label': 'Analyze plot' },
		});
		analyzeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>';
		analyzeBtn.addEventListener('click', () => this.runAnalysis());

		// Refresh button
		const refreshBtn = actions.createEl('button', {
			cls: 'plot-arc-btn',
			attr: { 'aria-label': 'Refresh' },
		});
		refreshBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"></path><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>';
		refreshBtn.addEventListener('click', () => this.refresh());

		// View switcher
		const viewSwitcher = container.createDiv({ cls: 'plot-arc-view-switcher' });
		this.createViewButton(viewSwitcher, 'list', 'List');
		this.createViewButton(viewSwitcher, 'timeline', 'Timeline');
		this.createViewButton(viewSwitcher, 'graph', 'Graph');

		// Filters
		const filters = container.createDiv({ cls: 'plot-arc-filters' });

		// Type filter
		const typeFilter = filters.createDiv({ cls: 'plot-arc-filter' });
		typeFilter.createEl('label', { text: 'Type:' });
		const typeSelect = typeFilter.createEl('select');
		typeSelect.createEl('option', { text: 'All', value: 'all' });
		typeSelect.createEl('option', { text: 'Main Plot', value: 'main-plot' });
		typeSelect.createEl('option', { text: 'Subplot', value: 'subplot' });
		typeSelect.createEl('option', { text: 'Character Arc', value: 'character-arc' });
		typeSelect.createEl('option', { text: 'Mystery', value: 'mystery' });
		typeSelect.createEl('option', { text: 'Romance', value: 'romance' });
		typeSelect.createEl('option', { text: 'Custom', value: 'custom' });
		typeSelect.value = this.filterType;
		typeSelect.addEventListener('change', () => {
			this.filterType = typeSelect.value as PlotThreadType | 'all';
			this.refresh();
		});

		// Status filter
		const statusFilter = filters.createDiv({ cls: 'plot-arc-filter' });
		statusFilter.createEl('label', { text: 'Status:' });
		const statusSelect = statusFilter.createEl('select');
		statusSelect.createEl('option', { text: 'All', value: 'all' });
		statusSelect.createEl('option', { text: 'Active', value: 'active' });
		statusSelect.createEl('option', { text: 'Resolved', value: 'resolved' });
		statusSelect.createEl('option', { text: 'Abandoned', value: 'abandoned' });
		statusSelect.value = this.filterStatus;
		statusSelect.addEventListener('change', () => {
			this.filterStatus = statusSelect.value as PlotThreadStatus | 'all';
			this.refresh();
		});

		// Content area
		const content = container.createDiv({ cls: 'plot-arc-content' });

		// Render based on current view
		switch (this.currentView) {
			case 'list':
				this.renderListView(content);
				break;
			case 'timeline':
				this.renderTimelineView(content);
				break;
			case 'graph':
				this.renderGraphView(content);
				break;
		}
	}

	private createViewButton(container: HTMLElement, view: 'list' | 'timeline' | 'graph', label: string): void {
		const btn = container.createEl('button', {
			text: label,
			cls: 'plot-arc-view-btn',
		});

		if (this.currentView === view) {
			btn.addClass('is-active');
		}

		btn.addEventListener('click', () => {
			this.currentView = view;
			this.refresh();
		});
	}

	private renderListView(container: HTMLElement): void {
		const threads = this.getFilteredThreads();

		if (threads.length === 0) {
			const empty = container.createDiv({ cls: 'plot-arc-empty' });
			empty.createEl('p', { text: 'No plot threads found.' });
			empty.createEl('p', {
				text: 'Click the + button to create your first plot thread.',
				cls: 'plot-arc-empty-hint'
			});
			return;
		}

		const list = container.createDiv({ cls: 'plot-arc-list' });

		for (const thread of threads) {
			this.renderThreadCard(list, thread);
		}
	}

	private renderThreadCard(container: HTMLElement, thread: PlotThread): void {
		const card = container.createDiv({ cls: 'plot-arc-thread-card' });

		// Color indicator
		const indicator = card.createDiv({ cls: 'plot-arc-thread-indicator' });
		indicator.style.backgroundColor = thread.color;

		// Header
		const header = card.createDiv({ cls: 'plot-arc-thread-header' });

		const titleContainer = header.createDiv({ cls: 'plot-arc-thread-title-container' });
		titleContainer.createEl('h5', { text: thread.title });

		const typeBadge = titleContainer.createEl('span', {
			text: this.formatThreadType(thread.type),
			cls: 'plot-arc-thread-type',
		});

		const statusBadge = header.createEl('span', {
			text: thread.status,
			cls: `plot-arc-thread-status status-${thread.status}`,
		});

		// Description
		if (thread.description) {
			card.createEl('p', {
				text: thread.description,
				cls: 'plot-arc-thread-description',
			});
		}

		// Stats
		const stats = card.createDiv({ cls: 'plot-arc-thread-stats' });
		stats.createEl('span', { text: `${thread.milestones.length} milestones` });
		stats.createEl('span', { text: `${thread.appearances.length} scenes` });

		// Progress
		const completion = this.plugin.plotArcManager.getThreadCompletion(thread.id);
		const progressContainer = card.createDiv({ cls: 'plot-arc-thread-progress-container' });
		progressContainer.createEl('span', {
			text: `${Math.round(completion)}% complete`,
			cls: 'plot-arc-thread-progress-label'
		});
		const progressBar = progressContainer.createDiv({ cls: 'plot-arc-thread-progress-bar' });
		const progressFill = progressBar.createDiv({ cls: 'plot-arc-thread-progress-fill' });
		progressFill.style.width = `${completion}%`;
		progressFill.style.backgroundColor = thread.color;

		// Actions
		const actions = card.createDiv({ cls: 'plot-arc-thread-actions' });

		const editBtn = actions.createEl('button', {
			text: 'Edit',
			cls: 'plot-arc-thread-btn',
		});
		editBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.editThread(thread.id);
		});

		const menuBtn = actions.createEl('button', {
			text: '⋮',
			cls: 'plot-arc-thread-btn plot-arc-menu-btn',
		});
		menuBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.showThreadMenu(thread, menuBtn);
		});
	}

	private renderTimelineView(container: HTMLElement): void {
		const placeholder = container.createDiv({ cls: 'plot-arc-placeholder' });
		placeholder.createEl('h3', { text: 'Timeline View' });
		placeholder.createEl('p', { text: 'Timeline visualization coming soon...' });
		placeholder.createEl('p', {
			text: 'This will show all plot threads on a visual timeline with milestones.',
			cls: 'plot-arc-placeholder-hint'
		});
	}

	private renderGraphView(container: HTMLElement): void {
		const placeholder = container.createDiv({ cls: 'plot-arc-placeholder' });
		placeholder.createEl('h3', { text: 'Tension Graph' });
		placeholder.createEl('p', { text: 'Tension graph coming soon...' });
		placeholder.createEl('p', {
			text: 'This will show story pacing and tension over time.',
			cls: 'plot-arc-placeholder-hint'
		});
	}

	private getFilteredThreads(): PlotThread[] {
		let threads = this.plugin.plotArcManager.getThreads();

		// Apply type filter
		if (this.filterType !== 'all') {
			threads = threads.filter(t => t.type === this.filterType);
		}

		// Apply status filter
		if (this.filterStatus !== 'all') {
			threads = threads.filter(t => t.status === this.filterStatus);
		}

		return threads;
	}

	private formatThreadType(type: PlotThreadType): string {
		const map: Record<PlotThreadType, string> = {
			'main-plot': 'Main Plot',
			'subplot': 'Subplot',
			'character-arc': 'Character Arc',
			'mystery': 'Mystery',
			'romance': 'Romance',
			'custom': 'Custom',
		};
		return map[type] || type;
	}

	private createNewThread(): void {
		// Simple prompt for now, will be replaced with modal
		const title = prompt('Enter plot thread title:');
		if (!title) return;

		const type = 'main-plot' as PlotThreadType; // Default type
		const thread = this.plugin.plotArcManager.createThread(title, type);

		new Notice(`Created plot thread: ${title}`);
		this.refresh();
	}

	private editThread(threadId: string): void {
		const thread = this.plugin.plotArcManager.getThread(threadId);
		if (!thread) return;

		new Notice('Thread editor modal coming soon...');
		// Will open PlotThreadEditorModal
	}

	private showThreadMenu(thread: PlotThread, targetEl: HTMLElement): void {
		const menu = new Menu();

		// Change status
		menu.addItem((item) =>
			item
				.setTitle('Mark as Resolved')
				.setIcon('check-circle')
				.onClick(() => {
					this.plugin.plotArcManager.updateThread(thread.id, { status: 'resolved' });
					new Notice(`Marked "${thread.title}" as resolved`);
					this.refresh();
				})
		);

		menu.addItem((item) =>
			item
				.setTitle('Mark as Abandoned')
				.setIcon('x-circle')
				.onClick(() => {
					this.plugin.plotArcManager.updateThread(thread.id, { status: 'abandoned' });
					new Notice(`Marked "${thread.title}" as abandoned`);
					this.refresh();
				})
		);

		menu.addSeparator();

		// Delete
		menu.addItem((item) =>
			item
				.setTitle('Delete Thread')
				.setIcon('trash')
				.onClick(() => {
					if (confirm(`Delete plot thread "${thread.title}"?`)) {
						this.plugin.plotArcManager.deleteThread(thread.id);
						new Notice(`Deleted plot thread: ${thread.title}`);
						this.refresh();
					}
				})
		);

		menu.showAtMouseEvent(targetEl as any);
	}

	private runAnalysis(): void {
		const issues = this.plugin.plotArcManager.analyzePlot();

		if (issues.length === 0) {
			new Notice('✓ No plot issues found!');
		} else {
			new Notice(`Found ${issues.length} plot issue(s). Check the analysis panel for details.`);
		}

		// TODO: Show analysis panel
	}

	private refresh(): void {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('plot-arc-panel');
		this.renderPanel(container);
	}
}
