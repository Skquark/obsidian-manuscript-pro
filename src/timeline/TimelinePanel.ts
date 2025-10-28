import { ItemView, WorkspaceLeaf, Menu, setIcon, Notice } from 'obsidian';
import ManuscriptProPlugin from '../main';
import { TimelineManager } from './TimelineManager';
import { TimelineEvent, EventType, TimelineConflict } from './TimelineInterfaces';
import { TimelineEventModal } from './TimelineEventModal';
import { TimelineExporter } from './TimelineExporter';
import { TimelineExportDialog } from './TimelineExportDialog';

export const TIMELINE_VIEW_TYPE = 'manuscript-pro-timeline';

/**
 * Timeline Panel
 * Visual timeline management interface
 */
export class TimelinePanel extends ItemView {
	private plugin: ManuscriptProPlugin;
	private manager: TimelineManager;
	private filterType: EventType | 'all' = 'all';
	private filterImportance: string | 'all' = 'all';
	private filterCharacter: string | 'all' = 'all';
	private showConflictsOnly: boolean = false;
	private sortBy: 'chronological' | 'importance' | 'type' | 'recent' = 'chronological';
	private viewMode: 'list' | 'timeline' = 'list';

	constructor(leaf: WorkspaceLeaf, plugin: ManuscriptProPlugin, manager: TimelineManager) {
		super(leaf);
		this.plugin = plugin;
		this.manager = manager;
	}

	getViewType(): string {
		return TIMELINE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Timeline';
	}

	getIcon(): string {
		return 'calendar';
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	async onClose(): Promise<void> {
		// Cleanup
	}

	/**
	 * Refresh the view
	 */
	refresh(): void {
		this.render();
	}

	/**
	 * Render the timeline panel
	 */
	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-pro-timeline-panel');

		// Header
		this.renderHeader();

		// Statistics
		this.renderStatistics();

		// Filters
		this.renderFilters();

		// Events list or timeline view
		if (this.viewMode === 'list') {
			this.renderEventsList();
		} else {
			this.renderTimelineView();
		}
	}

	/**
	 * Render header with actions
	 */
	private renderHeader(): void {
		const header = this.contentEl.createDiv('timeline-header');

		const title = header.createEl('h3', { text: 'Timeline', cls: 'timeline-title' });

		const actions = header.createDiv('timeline-actions');

		// Add event button
		const addBtn = actions.createEl('button', { cls: 'timeline-action-btn' });
		setIcon(addBtn, 'plus');
		addBtn.title = 'New timeline event';
		addBtn.addEventListener('click', () => this.createNewEvent());

		// View mode toggle
		const viewBtn = actions.createEl('button', { cls: 'timeline-action-btn' });
		setIcon(viewBtn, this.viewMode === 'list' ? 'list' : 'layout');
		viewBtn.title = this.viewMode === 'list' ? 'Switch to timeline view' : 'Switch to list view';
		viewBtn.addEventListener('click', () => {
			this.viewMode = this.viewMode === 'list' ? 'timeline' : 'list';
			this.render();
		});

		// Sort menu button
		const sortBtn = actions.createEl('button', { cls: 'timeline-action-btn' });
		setIcon(sortBtn, 'arrow-up-down');
		sortBtn.title = 'Sort events';
		sortBtn.addEventListener('click', (e) => this.showSortMenu(e));

		// Detect conflicts button
		const conflictBtn = actions.createEl('button', { cls: 'timeline-action-btn' });
		setIcon(conflictBtn, 'alert-triangle');
		conflictBtn.title = 'Detect conflicts';
		conflictBtn.addEventListener('click', () => this.detectConflicts());

		// Export button
		const exportBtn = actions.createEl('button', { cls: 'timeline-action-btn' });
		setIcon(exportBtn, 'download');
		exportBtn.title = 'Export timeline';
		exportBtn.addEventListener('click', () => this.exportTimeline());

		// Refresh button
		const refreshBtn = actions.createEl('button', { cls: 'timeline-action-btn' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.title = 'Refresh';
		refreshBtn.addEventListener('click', () => this.refresh());
	}

	/**
	 * Render statistics summary
	 */
	private renderStatistics(): void {
		const stats = this.manager.getStatistics();
		const statsEl = this.contentEl.createDiv('timeline-statistics');

		statsEl.createSpan({ text: `${stats.totalEvents} events`, cls: 'timeline-stat-item' });

		if (stats.unresolvedConflicts > 0) {
			const conflictSpan = statsEl.createSpan({
				text: `${stats.unresolvedConflicts} conflicts`,
				cls: 'timeline-stat-item warning'
			});
			conflictSpan.title = 'Unresolved timeline conflicts';
		}

		if (stats.earliestEvent && stats.latestEvent) {
			const span = this.manager.formatDate(stats.earliestEvent.startDate) +
				' — ' +
				this.manager.formatDate(stats.latestEvent.startDate);
			statsEl.createSpan({ text: span, cls: 'timeline-stat-item' });
		}
	}

	/**
	 * Render filter controls
	 */
	private renderFilters(): void {
		const filtersContainer = this.contentEl.createDiv('timeline-filters');

		// Event type filter
		const typeFilter = filtersContainer.createDiv('filter-group');
		typeFilter.createSpan({ text: 'Type:', cls: 'filter-label' });

		const types: Array<EventType | 'all'> = [
			'all', 'scene', 'character-event', 'plot-point', 'historical-fact', 'world-event', 'research', 'other'
		];

		types.forEach(type => {
			const btn = typeFilter.createEl('button', {
				text: type,
				cls: `filter-btn ${this.filterType === type ? 'active' : ''}`
			});
			btn.addEventListener('click', () => {
				this.filterType = type;
				this.render();
			});
		});

		// Importance filter
		const importanceFilter = filtersContainer.createDiv('filter-group');
		importanceFilter.createSpan({ text: 'Importance:', cls: 'filter-label' });

		const importances: Array<string> = ['all', 'critical', 'major', 'moderate', 'minor'];
		importances.forEach(imp => {
			const btn = importanceFilter.createEl('button', {
				text: imp,
				cls: `filter-btn ${this.filterImportance === imp ? 'active' : ''}`
			});
			btn.addEventListener('click', () => {
				this.filterImportance = imp;
				this.render();
			});
		});

		// Conflicts filter
		const conflictsToggle = filtersContainer.createDiv('filter-group');
		const toggleBtn = conflictsToggle.createEl('button', {
			text: 'Show conflicts only',
			cls: `filter-btn ${this.showConflictsOnly ? 'active' : ''}`
		});
		toggleBtn.addEventListener('click', () => {
			this.showConflictsOnly = !this.showConflictsOnly;
			this.render();
		});
	}

	/**
	 * Render events list view
	 */
	private renderEventsList(): void {
		const listContainer = this.contentEl.createDiv('timeline-events-list');

		// Get and filter events
		let events = this.manager.getAllEvents();

		// Apply filters
		if (this.filterType !== 'all') {
			events = events.filter(e => e.type === this.filterType);
		}

		if (this.filterImportance !== 'all') {
			events = events.filter(e => e.importance === this.filterImportance);
		}

		if (this.showConflictsOnly) {
			events = events.filter(e => e.conflicts && e.conflicts.length > 0);
		}

		// Sort events
		events = this.sortEvents(events);

		// Render events
		if (events.length === 0) {
			this.renderEmptyState(listContainer);
		} else {
			events.forEach(event => {
				this.renderEventCard(listContainer, event);
			});
		}
	}

	/**
	 * Sort events based on current sort setting
	 */
	private sortEvents(events: TimelineEvent[]): TimelineEvent[] {
		switch (this.sortBy) {
			case 'chronological':
				return this.manager.sortEvents(events);

			case 'importance':
				const importanceOrder = { critical: 0, major: 1, moderate: 2, minor: 3 };
				return events.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);

			case 'type':
				return events.sort((a, b) => a.type.localeCompare(b.type));

			case 'recent':
				return events.sort((a, b) => b.modified - a.modified);

			default:
				return events;
		}
	}

	/**
	 * Render single event card
	 */
	private renderEventCard(container: HTMLElement, event: TimelineEvent): void {
		const card = container.createDiv('timeline-event-card');
		card.setAttribute('data-event-id', event.id);
		card.addClass(`importance-${event.importance}`);
		card.addClass(`type-${event.type}`);

		// Header
		const cardHeader = card.createDiv('timeline-event-header');

		// Type badge
		const typeBadge = cardHeader.createDiv('timeline-event-type');
		typeBadge.textContent = event.type;

		// Title
		const title = cardHeader.createDiv('timeline-event-title');
		title.textContent = event.title;

		// Importance indicator
		const importanceBadge = cardHeader.createDiv('timeline-event-importance');
		importanceBadge.textContent = event.importance;

		// Date
		const dateEl = card.createDiv('timeline-event-date');
		const dateText = this.manager.formatDate(event.startDate);
		if (event.endDate) {
			dateEl.textContent = `${dateText} — ${this.manager.formatDate(event.endDate)}`;
		} else {
			dateEl.textContent = dateText;
		}

		// Description
		if (event.description) {
			const desc = card.createDiv('timeline-event-description');
			desc.textContent = event.description;
		}

		// Metadata
		const metadata = card.createDiv('timeline-event-metadata');

		if (event.location) {
			const loc = metadata.createSpan({ cls: 'timeline-meta-item' });
			setIcon(loc, 'map-pin');
			loc.createSpan({ text: event.location });
		}

		if (event.characterIds && event.characterIds.length > 0) {
			const chars = metadata.createSpan({ cls: 'timeline-meta-item' });
			setIcon(chars, 'users');
			chars.createSpan({ text: `${event.characterIds.length} characters` });
		}

		if (event.tags && event.tags.length > 0) {
			const tagsContainer = card.createDiv('timeline-event-tags');
			event.tags.forEach(tag => {
				tagsContainer.createSpan({ text: `#${tag}`, cls: 'timeline-tag' });
			});
		}

		// Conflicts
		if (event.conflicts && event.conflicts.length > 0) {
			this.renderConflicts(card, event.conflicts);
		}

		// Actions (on click/context menu)
		card.addEventListener('click', () => this.viewEventDetails(event.id));
		card.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showEventContextMenu(e, event);
		});
	}

	/**
	 * Render conflicts for an event
	 */
	private renderConflicts(container: HTMLElement, conflicts: TimelineConflict[]): void {
		const conflictsEl = container.createDiv('timeline-event-conflicts');

		conflicts.forEach(conflict => {
			if (conflict.resolved || conflict.ignoredByUser) return;

			const conflictItem = conflictsEl.createDiv('timeline-conflict-item');
			conflictItem.addClass(`severity-${conflict.severity}`);

			const icon = conflictItem.createSpan({ cls: 'conflict-icon' });
			setIcon(icon, 'alert-triangle');

			conflictItem.createSpan({ text: conflict.message, cls: 'conflict-message' });
		});
	}

	/**
	 * Render timeline visual view
	 */
	private renderTimelineView(): void {
		const timelineContainer = this.contentEl.createDiv('timeline-visual-view');

		// Get and sort events
		let events = this.manager.getAllEvents();

		// Apply filters
		if (this.filterType !== 'all') {
			events = events.filter(e => e.type === this.filterType);
		}

		if (this.filterImportance !== 'all') {
			events = events.filter(e => e.importance === this.filterImportance);
		}

		events = this.manager.sortEvents(events);

		if (events.length === 0) {
			this.renderEmptyState(timelineContainer);
			return;
		}

		// Simple vertical timeline view
		events.forEach((event, index) => {
			const eventRow = timelineContainer.createDiv('timeline-visual-event');

			// Timeline line
			const line = eventRow.createDiv('timeline-line');
			if (index === 0) line.addClass('first');
			if (index === events.length - 1) line.addClass('last');

			// Event marker
			const marker = eventRow.createDiv('timeline-marker');
			marker.addClass(`importance-${event.importance}`);

			if (event.color) {
				marker.style.backgroundColor = event.color;
			}

			// Event content
			const content = eventRow.createDiv('timeline-visual-content');

			const dateText = content.createDiv('timeline-visual-date');
			dateText.textContent = this.manager.formatDate(event.startDate);

			const titleText = content.createDiv('timeline-visual-title');
			titleText.textContent = event.title;

			if (event.description) {
				const descText = content.createDiv('timeline-visual-desc');
				descText.textContent = event.description;
			}

			// Click to view details
			eventRow.addEventListener('click', () => this.viewEventDetails(event.id));
		});
	}

	/**
	 * Render empty state
	 */
	private renderEmptyState(container: HTMLElement): void {
		const empty = container.createDiv('timeline-empty-state');

		if (this.showConflictsOnly) {
			empty.createEl('p', { text: 'No conflicts detected' });
		} else {
			empty.createEl('p', { text: 'No timeline events yet' });
			const createBtn = empty.createEl('button', {
				text: 'Create First Event',
				cls: 'mod-cta'
			});
			createBtn.addEventListener('click', () => this.createNewEvent());
		}
	}

	// ========== MENUS ==========

	/**
	 * Show sort menu
	 */
	private showSortMenu(e: MouseEvent): void {
		const menu = new Menu();

		menu.addItem(item => item
			.setTitle('Sort Chronologically')
			.setIcon('clock')
			.setChecked(this.sortBy === 'chronological')
			.onClick(() => {
				this.sortBy = 'chronological';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Importance')
			.setIcon('star')
			.setChecked(this.sortBy === 'importance')
			.onClick(() => {
				this.sortBy = 'importance';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Type')
			.setIcon('tag')
			.setChecked(this.sortBy === 'type')
			.onClick(() => {
				this.sortBy = 'type';
				this.render();
			})
		);

		menu.addItem(item => item
			.setTitle('Sort by Recently Modified')
			.setIcon('history')
			.setChecked(this.sortBy === 'recent')
			.onClick(() => {
				this.sortBy = 'recent';
				this.render();
			})
		);

		menu.showAtMouseEvent(e);
	}

	/**
	 * Show event context menu
	 */
	private showEventContextMenu(e: MouseEvent, event: TimelineEvent): void {
		const menu = new Menu();

		menu.addItem(item => item
			.setTitle('View Details')
			.setIcon('eye')
			.onClick(() => this.viewEventDetails(event.id))
		);

		menu.addSeparator();

		menu.addItem(item => item
			.setTitle('Delete')
			.setIcon('trash')
			.onClick(() => this.deleteEvent(event.id))
		);

		menu.showAtMouseEvent(e);
	}

	// ========== ACTIONS ==========

	/**
	 * Create new timeline event
	 */
	private createNewEvent(): void {
		new TimelineEventModal(
			this.app,
			this.manager,
			null,
			async () => {
				await this.plugin.saveSettings();
				this.refresh();
			}
		).open();
	}

	/**
	 * View event details
	 */
	private viewEventDetails(eventId: string): void {
		new TimelineEventModal(
			this.app,
			this.manager,
			eventId,
			async () => {
				await this.plugin.saveSettings();
				this.refresh();
			}
		).open();
	}

	/**
	 * Delete event
	 */
	private async deleteEvent(eventId: string): Promise<void> {
		const event = this.manager.getEvent(eventId);
		if (!event) return;

		const confirmed = confirm(`Delete event "${event.title}"? This cannot be undone.`);
		if (!confirmed) return;

		this.manager.deleteEvent(eventId);
		await this.plugin.saveSettings();
		this.refresh();
		new Notice('Event deleted');
	}

	/**
	 * Detect conflicts
	 */
	private async detectConflicts(): Promise<void> {
		this.manager.detectAllConflicts();
		await this.plugin.saveSettings();
		this.refresh();

		const stats = this.manager.getStatistics();
		if (stats.unresolvedConflicts > 0) {
			new Notice(`Found ${stats.unresolvedConflicts} conflicts`);
		} else {
			new Notice('No conflicts detected');
		}
	}

	/**
	 * Export timeline
	 */
	private exportTimeline(): void {
		const exporter = new TimelineExporter(this.app, this.manager);
		new TimelineExportDialog(this.app, exporter).open();
	}
}
