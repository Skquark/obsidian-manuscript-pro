import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import ManuscriptProPlugin from '../main';
import type { WritingGoal, WritingSession, WritingStreak } from '../quality/QualityInterfaces';

export const PROGRESS_PANEL_VIEW_TYPE = 'manuscript-pro-progress-panel';

type DateRange = 'today' | 'week' | 'month' | 'all';

interface ProgressStats {
	totalWords: number;
	todayWords: number;
	weekWords: number;
	avgPerDay: number;
	currentStreak: number;
	longestStreak: number;
}

export class ProgressPanelView extends ItemView {
	private plugin: ManuscriptProPlugin;
	private currentRange: DateRange = 'today';
	private refreshInterval: NodeJS.Timeout | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: ManuscriptProPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return PROGRESS_PANEL_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Writing Progress';
	}

	getIcon(): string {
		return 'trending-up';
	}

	async onOpen(): Promise<void> {
		this.containerEl.empty();
		this.containerEl.addClass('progress-panel-view');

		await this.render();

		// Start auto-refresh every 30 seconds
		this.refreshInterval = setInterval(() => {
			this.render();
		}, 30000);
	}

	async onClose(): Promise<void> {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
			this.refreshInterval = null;
		}
		this.containerEl.empty();
	}

	async render(): Promise<void> {
		this.containerEl.empty();

		// Check if progress tracking is enabled
		if (!this.plugin.settings.quality?.progress?.enabled) {
			this.renderDisabledState();
			return;
		}

		const stats = await this.getStats();
		const goals = this.plugin.progressManager.getActiveGoals();
		const sessions = this.plugin.progressManager.getRecentSessions(10);

		// Header
		this.renderHeader();

		// Date range tabs
		this.renderDateRangeTabs();

		// Stats cards
		this.renderStatsCards(stats);

		// Goals section
		this.renderGoalsSection(goals);

		// Recent sessions
		this.renderSessionsTable(sessions);

		// Footer
		this.renderFooter();
	}

	private renderDisabledState(): void {
		const emptyState = this.containerEl.createDiv('progress-empty-state');
		emptyState.createEl('div', {
			cls: 'progress-empty-icon',
			text: '📊',
		});
		emptyState.createEl('h3', {
			cls: 'progress-empty-title',
			text: 'Progress Tracking Disabled',
		});
		emptyState.createEl('p', {
			cls: 'progress-empty-message',
			text: 'Enable Progress Tracking in settings to track your writing progress.',
		});
	}

	private renderHeader(): void {
		const header = this.containerEl.createDiv('progress-header');

		header.createEl('h2', {
			cls: 'progress-title',
			text: 'Writing Progress',
		});

		const actions = header.createDiv('progress-header-actions');

		const refreshBtn = actions.createEl('button', {
			cls: 'progress-btn-icon',
			attr: { 'aria-label': 'Refresh progress' },
		});
		refreshBtn.innerHTML = '🔄';
		refreshBtn.addEventListener('click', () => this.render());

		const menuBtn = actions.createEl('button', {
			cls: 'progress-btn-icon',
			attr: { 'aria-label': 'Progress menu' },
		});
		menuBtn.innerHTML = '⋮';
		menuBtn.addEventListener('click', (e) => this.showMenu(e));
	}

	private renderDateRangeTabs(): void {
		const tabsContainer = this.containerEl.createDiv('progress-tabs');

		const ranges: { value: DateRange; label: string }[] = [
			{ value: 'today', label: 'Today' },
			{ value: 'week', label: 'Week' },
			{ value: 'month', label: 'Month' },
			{ value: 'all', label: 'All Time' },
		];

		ranges.forEach(({ value, label }) => {
			const tab = tabsContainer.createEl('button', {
				cls: 'progress-tab',
				text: label,
			});

			if (value === this.currentRange) {
				tab.addClass('progress-tab-active');
			}

			tab.addEventListener('click', () => {
				this.currentRange = value;
				this.render();
			});
		});
	}

	private renderStatsCards(stats: ProgressStats): void {
		const cardsContainer = this.containerEl.createDiv('progress-cards');

		// Total Words
		this.renderStatCard(cardsContainer, stats.totalWords.toLocaleString(), 'Total Words');

		// Today
		this.renderStatCard(cardsContainer, stats.todayWords.toLocaleString(), 'Today');

		// This Week
		this.renderStatCard(cardsContainer, stats.weekWords.toLocaleString(), 'This Week');

		// Avg/Day
		this.renderStatCard(cardsContainer, Math.round(stats.avgPerDay).toLocaleString(), 'Avg/Day');

		// Current Streak
		this.renderStatCard(cardsContainer, `🔥 ${stats.currentStreak} days`, 'Current Streak');

		// Longest Streak
		this.renderStatCard(cardsContainer, `🏆 ${stats.longestStreak} days`, 'Longest Streak');
	}

	private renderStatCard(container: HTMLElement, value: string, label: string): void {
		const card = container.createDiv('progress-card');

		card.createEl('div', {
			cls: 'progress-card-value',
			text: value,
		});

		card.createEl('div', {
			cls: 'progress-card-label',
			text: label,
		});
	}

	private renderGoalsSection(goals: WritingGoal[]): void {
		const section = this.containerEl.createDiv('progress-goals-section');

		const header = section.createDiv('progress-section-header');
		header.createEl('h3', {
			cls: 'progress-section-title',
			text: '📊 Active Goals',
		});

		if (goals.length === 0) {
			const emptyState = section.createDiv('progress-goals-empty');
			emptyState.createEl('p', {
				cls: 'progress-empty-text',
				text: 'No goals set yet',
			});
			emptyState.createEl('p', {
				cls: 'progress-empty-subtext',
				text: 'Set goals to track your writing progress and stay motivated',
			});

			const addBtn = emptyState.createEl('button', {
				cls: 'progress-btn-primary',
				text: '+ Add Your First Goal',
			});
			addBtn.addEventListener('click', () => this.showAddGoalModal());
		} else {
			const goalsList = section.createDiv('progress-goals-list');

			goals.forEach((goal) => {
				this.renderGoalItem(goalsList, goal);
			});

			const addBtn = section.createEl('button', {
				cls: 'progress-btn-secondary',
				text: '+ Add Goal',
			});
			addBtn.addEventListener('click', () => this.showAddGoalModal());
		}
	}

	private renderGoalItem(container: HTMLElement, goal: WritingGoal): void {
		const item = container.createDiv('progress-goal-item');

		const header = item.createDiv('progress-goal-header');
		header.createEl('span', {
			cls: 'progress-goal-title',
			text: `${goal.description}: ${goal.target.toLocaleString()} words`,
		});

		const progress = (goal.current / goal.target) * 100;
		const progressText = `${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}`;

		const progressBar = item.createDiv('progress-goal-bar-container');

		const bar = progressBar.createDiv('progress-goal-bar');
		const fill = bar.createDiv('progress-goal-bar-fill');
		fill.style.width = `${Math.min(progress, 100)}%`;

		// Color based on progress
		if (progress >= 100) {
			fill.addClass('progress-goal-complete');
		} else if (progress >= 90) {
			fill.addClass('progress-goal-near');
		} else if (progress >= 50) {
			fill.addClass('progress-goal-halfway');
		}

		progressBar.createEl('span', {
			cls: 'progress-goal-text',
			text: progressText,
		});
	}

	private renderSessionsTable(sessions: WritingSession[]): void {
		const section = this.containerEl.createDiv('progress-sessions-section');

		section.createEl('h3', {
			cls: 'progress-section-title',
			text: '📅 Recent Sessions',
		});

		if (sessions.length === 0) {
			section.createEl('p', {
				cls: 'progress-empty-text',
				text: 'No writing sessions yet',
			});
			return;
		}

		const table = section.createDiv('progress-sessions-table');

		// Header
		const tableHeader = table.createDiv('progress-sessions-header');
		tableHeader.createEl('div', { cls: 'progress-session-col-date', text: 'Date' });
		tableHeader.createEl('div', { cls: 'progress-session-col-duration', text: 'Duration' });
		tableHeader.createEl('div', { cls: 'progress-session-col-words', text: 'Words' });
		tableHeader.createEl('div', { cls: 'progress-session-col-badge', text: '' });

		// Rows
		const tableBody = table.createDiv('progress-sessions-body');

		sessions.forEach((session) => {
			const row = tableBody.createDiv('progress-session-row');

			// Date
			const date = new Date(session.startTime);
			const dateStr = this.formatSessionDate(date);
			row.createEl('div', { cls: 'progress-session-col-date', text: dateStr });

			// Duration
			const duration = this.formatDuration(session.duration);
			row.createEl('div', { cls: 'progress-session-col-duration', text: duration });

			// Words
			row.createEl('div', { cls: 'progress-session-col-words', text: session.wordsWritten.toLocaleString() });

			// Achievement badge
			const badge = row.createDiv('progress-session-col-badge');
			if (this.sessionMetGoal(session)) {
				badge.innerHTML = '✓';
				badge.addClass('progress-session-achieved');
			}
		});

		// View all link
		const viewAll = section.createEl('button', {
			cls: 'progress-link',
			text: 'View All Sessions →',
		});
		viewAll.addEventListener('click', () => this.showAllSessions());
	}

	private renderFooter(): void {
		const footer = this.containerEl.createDiv('progress-footer');

		const exportBtn = footer.createEl('button', {
			cls: 'progress-btn-secondary',
			text: 'Export CSV',
		});
		exportBtn.addEventListener('click', () => this.exportToCSV());

		const startBtn = footer.createEl('button', {
			cls: 'progress-btn-primary',
			text: 'Start New Session',
		});
		startBtn.addEventListener('click', () => this.startNewSession());
	}

	private async getStats(): Promise<ProgressStats> {
		const allSessions = this.plugin.progressManager.getAllSessions();
		const streak = this.plugin.progressManager.getStreak();

		// Calculate total words across all sessions
		const totalWords = allSessions.reduce((sum, s) => sum + s.wordsWritten, 0);

		// Today's words
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayWords = allSessions
			.filter((s) => new Date(s.startTime) >= today)
			.reduce((sum, s) => sum + s.wordsWritten, 0);

		// This week's words
		const weekStart = new Date();
		weekStart.setDate(weekStart.getDate() - weekStart.getDay());
		weekStart.setHours(0, 0, 0, 0);
		const weekWords = allSessions
			.filter((s) => new Date(s.startTime) >= weekStart)
			.reduce((sum, s) => sum + s.wordsWritten, 0);

		// Average per day (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const recentWords = allSessions
			.filter((s) => new Date(s.startTime) >= thirtyDaysAgo)
			.reduce((sum, s) => sum + s.wordsWritten, 0);
		const avgPerDay = recentWords / 30;

		return {
			totalWords,
			todayWords,
			weekWords,
			avgPerDay,
			currentStreak: streak.currentStreak,
			longestStreak: streak.longestStreak,
		};
	}

	private formatSessionDate(date: Date): string {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		today.setHours(0, 0, 0, 0);
		yesterday.setHours(0, 0, 0, 0);
		date.setHours(0, 0, 0, 0);

		if (date.getTime() === today.getTime()) {
			return 'Today';
		} else if (date.getTime() === yesterday.getTime()) {
			return 'Yesterday';
		} else {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
	}

	private formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = Math.round(minutes % 60);

		if (hours > 0) {
			return `${hours}h ${mins}m`;
		} else {
			return `${mins}m`;
		}
	}

	private sessionMetGoal(session: WritingSession): boolean {
		// Check if session met any daily goals
		const dailyGoals = this.plugin.progressManager.getActiveGoals().filter((g) => g.type === 'daily');

		return dailyGoals.some((goal) => session.wordsWritten >= goal.target);
	}

	private showAddGoalModal(): void {
		// TODO: Implement Add Goal modal
		console.log('Add Goal modal not yet implemented');
	}

	private showMenu(event: MouseEvent): void {
		// TODO: Implement context menu
		console.log('Progress menu not yet implemented');
	}

	private showAllSessions(): void {
		// TODO: Implement all sessions view
		console.log('All sessions view not yet implemented');
	}

	private exportToCSV(): void {
		const sessions = this.plugin.progressManager.getAllSessions();

		const lines: string[] = [
			'Date,Duration (minutes),Words Written,File',
			...sessions.map((s) => {
				const date = new Date(s.startTime).toLocaleDateString();
				return `${date},${s.duration},${s.wordsWritten},"${s.file}"`;
			}),
		];

		const csv = lines.join('\n');
		navigator.clipboard.writeText(csv);

		console.log('Sessions exported to clipboard as CSV');
	}

	private startNewSession(): void {
		// Sessions are tracked automatically - just show a notice
		console.log('Writing sessions are tracked automatically when you start writing');
	}
}
