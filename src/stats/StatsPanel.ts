/**
 * Manuscript Statistics Panel
 * Sidebar view showing comprehensive document statistics
 */

import { ItemView, WorkspaceLeaf, MarkdownView } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { StatsCalculator } from './StatsCalculator';
import type { ManuscriptStats } from './StatsInterfaces';
import { GoalTracker } from './GoalTracker';
import { GoalEditorModal } from './GoalEditorModal';
import { ContributionHeatmap } from './ContributionHeatmap';

export const STATS_VIEW_TYPE = 'manuscript-stats';

export class StatsPanel extends ItemView {
	plugin: LatexPandocConcealerPlugin;
	private stats: ManuscriptStats | null = null;
	private refreshInterval: number | null = null;
	private currentTab: 'overview' | 'details' | 'history' | 'goals' = 'overview';
	private lastContent = '';
	private isRefreshing = false;

	constructor(leaf: WorkspaceLeaf, plugin: LatexPandocConcealerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return STATS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Manuscript Statistics';
	}

	getIcon(): string {
		return 'bar-chart';
	}

	async onOpen(): Promise<void> {
		await this.renderPanel();
		this.startAutoRefresh();
	}

	async onClose(): Promise<void> {
		this.stopAutoRefresh();
	}

	/**
	 * Start automatic refresh using configured interval
	 */
	private startAutoRefresh(): void {
		this.stopAutoRefresh();
		const intervalMs = this.plugin.settings.statistics.refreshInterval * 1000;
		this.refreshInterval = window.setInterval(() => {
			// Only refresh if the panel is visible and there's an active view
			if (!this.containerEl.isShown()) {
				return;
			}
			this.refresh();
		}, intervalMs);
	}

	/**
	 * Stop automatic refresh
	 */
	private stopAutoRefresh(): void {
		if (this.refreshInterval !== null) {
			window.clearInterval(this.refreshInterval);
			this.refreshInterval = null;
		}
	}

	/**
	 * Refresh statistics
	 */
	async refresh(): Promise<void> {
		// Prevent concurrent refreshes
		if (this.isRefreshing) {
			return;
		}

		this.isRefreshing = true;

		try {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				if (this.stats !== null) {
					this.stats = null;
					this.lastContent = '';
					await this.renderPanel();
				}
				return;
			}

			const content = activeView.editor.getValue();

			// Skip refresh if content hasn't changed
			if (content === this.lastContent) {
				return;
			}

			this.lastContent = content;

			const calculator = new StatsCalculator(
				content,
				this.plugin.settings,
				this.plugin.statsData.sessionWordCount,
				this.getTodayWordCount(),
			);

			this.stats = calculator.calculateAll();
			await this.renderPanel();
		} finally {
			this.isRefreshing = false;
		}
	}

	/**
	 * Get today's word count from history
	 */
	private getTodayWordCount(): number {
		const today = this.getDateKey(new Date());
		const todayData = this.plugin.statsData.history[today];
		return todayData ? todayData.wordCount : 0;
	}

	/**
	 * Get date key for history (YYYY-MM-DD)
	 */
	private getDateKey(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	/**
	 * Render the statistics panel
	 */
	async renderPanel(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-stats-panel');

		// Header
		const header = contentEl.createDiv({ cls: 'stats-header' });
		header.createEl('h4', { text: 'Manuscript Statistics', cls: 'stats-title' });

		const buttonContainer = header.createDiv({ cls: 'stats-header-buttons' });

		const refreshButton = buttonContainer.createEl('button', {
			text: '↻',
			cls: 'stats-refresh-button',
		});
		refreshButton.title = 'Refresh statistics';
		refreshButton.onclick = () => this.refresh();

		const closeButton = buttonContainer.createEl('button', {
			text: '✕',
			cls: 'stats-close-button',
		});
		closeButton.title = 'Close';
		closeButton.onclick = () => {
			this.app.workspace.detachLeavesOfType(STATS_VIEW_TYPE);
		};

		// Tabs
		const tabBar = contentEl.createDiv({ cls: 'stats-tab-bar' });

		const tabs: Array<{ id: typeof this.currentTab; label: string; icon: string }> = [
			{ id: 'overview', label: 'Overview', icon: '📊' },
			{ id: 'details', label: 'Details', icon: '📝' },
			{ id: 'history', label: 'History', icon: '📈' },
			{ id: 'goals', label: 'Goals', icon: '🎯' },
		];

		tabs.forEach((tab) => {
			const button = tabBar.createEl('button', {
				text: `${tab.icon} ${tab.label}`,
				cls: 'stats-tab-button',
			});
			if (tab.id === this.currentTab) {
				button.addClass('active');
			}
			button.onclick = () => {
				this.currentTab = tab.id;
				this.renderPanel();
			};
		});

		// Content
		const content = contentEl.createDiv({ cls: 'stats-content' });

		if (!this.stats) {
			content.createEl('p', {
				text: 'No active document. Open a markdown file to see statistics.',
				cls: 'stats-empty',
			});
			return;
		}

		// Render appropriate tab
		switch (this.currentTab) {
			case 'overview':
				this.renderOverviewTab(content);
				break;
			case 'details':
				this.renderDetailsTab(content);
				break;
			case 'history':
				this.renderHistoryTab(content);
				break;
			case 'goals':
				this.renderGoalsTab(content);
				break;
		}
	}

	/**
	 * Render Overview tab
	 */
	private renderOverviewTab(container: HTMLElement): void {
		if (!this.stats) return;

		// Word Count Section
		const wordCountSection = container.createDiv({ cls: 'stats-section' });
		wordCountSection.createEl('h5', { text: '📝 Word Count' });

		const wordStats = wordCountSection.createDiv({ cls: 'stats-grid' });

		this.createStatItem(wordStats, 'Total Words', this.stats.wordCount.total.toLocaleString());
		this.createStatItem(wordStats, 'Excluding Quotes', this.stats.wordCount.excludingQuotes.toLocaleString());
		this.createStatItem(wordStats, 'Session Words', this.stats.wordCount.session.toLocaleString());
		this.createStatItem(wordStats, 'Today', this.stats.wordCount.today.toLocaleString());

		// Reading Time
		const readingSection = container.createDiv({ cls: 'stats-section' });
		readingSection.createEl('h5', { text: '⏱️ Reading Time' });
		readingSection.createEl('p', {
			text: this.stats.readingTime.formatted,
			cls: 'stats-large-number',
		});

		// Citations Section
		const citationsSection = container.createDiv({ cls: 'stats-section' });
		citationsSection.createEl('h5', { text: '📚 Citations' });

		const citeStats = citationsSection.createDiv({ cls: 'stats-grid' });
		this.createStatItem(citeStats, 'Total Citations', this.stats.citations.total.toString());
		this.createStatItem(citeStats, 'Unique Sources', this.stats.citations.unique.toString());
		this.createStatItem(citeStats, 'Footnotes', this.stats.citations.footnotes.toString());

		// Structure Section
		const structureSection = container.createDiv({ cls: 'stats-section' });
		structureSection.createEl('h5', { text: '🏗️ Structure' });

		const structStats = structureSection.createDiv({ cls: 'stats-grid' });
		this.createStatItem(structStats, 'Chapters', this.stats.structure.chapters.toString());
		this.createStatItem(structStats, 'Sections', this.stats.structure.sections.toString());
		this.createStatItem(structStats, 'Subsections', this.stats.structure.subsections.toString());
		this.createStatItem(structStats, 'Figures', this.stats.structure.figures.toString());
		this.createStatItem(structStats, 'Tables', this.stats.structure.tables.toString());
		this.createStatItem(structStats, 'Equations', this.stats.structure.equations.toString());

		// Content Quality
		const qualitySection = container.createDiv({ cls: 'stats-section' });
		qualitySection.createEl('h5', { text: '✨ Content Quality' });

		const qualityStats = qualitySection.createDiv({ cls: 'stats-grid' });
		this.createStatItem(qualityStats, 'Readability', this.stats.content.readability.grade);
		this.createStatItem(qualityStats, 'F-K Score', this.stats.content.readability.fleschKincaid.toString());
		this.createStatItem(
			qualityStats,
			'Vocabulary Richness',
			(this.stats.content.vocabularyRichness * 100).toFixed(1) + '%',
		);
		this.createStatItem(qualityStats, 'Avg Words/Sentence', this.stats.content.avgWordsPerSentence.toString());
	}

	/**
	 * Render Details tab
	 */
	private renderDetailsTab(container: HTMLElement): void {
		if (!this.stats) return;

		// Section Breakdown
		const sectionsSection = container.createDiv({ cls: 'stats-section' });
		sectionsSection.createEl('h5', { text: '📑 Section Breakdown' });

		if (this.stats.wordCount.bySection.length === 0) {
			sectionsSection.createEl('p', { text: 'No sections found.', cls: 'stats-muted' });
		} else {
			const table = sectionsSection.createEl('table', { cls: 'stats-table' });
			const thead = table.createEl('thead');
			const headerRow = thead.createEl('tr');
			headerRow.createEl('th', { text: 'Section' });
			headerRow.createEl('th', { text: 'Words' });
			headerRow.createEl('th', { text: 'Citations' });
			headerRow.createEl('th', { text: 'Figures' });

			const tbody = table.createEl('tbody');
			this.stats.wordCount.bySection.forEach((section) => {
				const row = tbody.createEl('tr');
				const indent = '  '.repeat(section.level - 1);
				row.createEl('td', { text: indent + section.title });
				row.createEl('td', { text: section.wordCount.toLocaleString() });
				row.createEl('td', { text: section.citations.toString() });
				row.createEl('td', { text: section.figures.toString() });
			});
		}

		// Top Cited Sources
		const topCitedSection = container.createDiv({ cls: 'stats-section' });
		topCitedSection.createEl('h5', { text: '🔝 Top Cited Sources' });

		if (this.stats.citations.topCited.length === 0) {
			topCitedSection.createEl('p', { text: 'No citations found.', cls: 'stats-muted' });
		} else {
			const list = topCitedSection.createEl('ol', { cls: 'stats-list' });
			this.stats.citations.topCited.forEach((cite) => {
				const item = list.createEl('li');
				item.createEl('code', { text: cite.key });
				item.createEl('span', { text: ` (${cite.count} times)` });
			});
		}

		// Content Metrics
		const contentSection = container.createDiv({ cls: 'stats-section' });
		contentSection.createEl('h5', { text: '📊 Content Metrics' });

		const contentStats = contentSection.createDiv({ cls: 'stats-grid' });
		this.createStatItem(contentStats, 'Paragraphs', this.stats.content.paragraphs.toString());
		this.createStatItem(contentStats, 'Sentences', this.stats.content.sentences.toString());
		this.createStatItem(contentStats, 'Avg Words/Paragraph', this.stats.content.avgWordsPerParagraph.toString());
		this.createStatItem(contentStats, 'Avg Words/Sentence', this.stats.content.avgWordsPerSentence.toString());
	}

	/**
	 * Render History tab
	 */
	private renderHistoryTab(container: HTMLElement): void {
		const historySection = container.createDiv({ cls: 'stats-section' });
		historySection.createEl('h5', { text: '📈 Writing History' });

		const history = this.plugin.statsData.history;
		const dates = Object.keys(history).sort().reverse().slice(0, 30); // Last 30 days

		if (dates.length === 0) {
			historySection.createEl('p', {
				text: 'No history data yet. Keep writing to track your progress!',
				cls: 'stats-muted',
			});
			return;
		}

		// Calculate streak
		const streak = this.calculateStreak();
		if (streak > 0) {
			const streakBadge = historySection.createEl('p', { cls: 'stats-streak' });
			streakBadge.createEl('span', { text: '🔥' });
			streakBadge.createEl('strong', { text: ` ${streak} day streak!` });
		}

		// History table
		const table = historySection.createEl('table', { cls: 'stats-table' });
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		headerRow.createEl('th', { text: 'Date' });
		headerRow.createEl('th', { text: 'Words' });
		headerRow.createEl('th', { text: 'Citations' });
		headerRow.createEl('th', { text: 'Time' });

		const tbody = table.createEl('tbody');
		dates.forEach((date) => {
			const data = history[date];
			const row = tbody.createEl('tr');
			row.createEl('td', { text: this.formatDate(date) });
			row.createEl('td', { text: data.wordCount.toLocaleString() });
			row.createEl('td', { text: data.citationCount.toString() });
			row.createEl('td', { text: `${data.sessionDuration} min` });
		});
	}

	/**
	 * Render Goals tab
	 */
	private renderGoalsTab(container: HTMLElement): void {
		const goalTracker = new GoalTracker(this.plugin.statsData);

		// Today's goal dashboard (if daily/weekly goal exists)
		const todayGoal = goalTracker.getTodayGoalProgress();
		const weekGoal = goalTracker.getWeekGoalProgress();

		if (todayGoal) {
			this.renderTodayGoalDashboard(container, goalTracker, todayGoal);
		} else if (weekGoal) {
			this.renderWeekGoalDashboard(container, goalTracker, weekGoal);
		}

		// Contribution heatmap
		const heatmapSection = container.createDiv({ cls: 'stats-section' });
		const heatmap = new ContributionHeatmap();
		const heatmapData = goalTracker.getHeatmapData();
		heatmap.render(heatmapSection, heatmapData);

		// All goals list
		const goalsSection = container.createDiv({ cls: 'stats-section' });
		goalsSection.createEl('h5', { text: '🎯 All Goals' });

		const goals = this.plugin.statsData.goals.filter((g) => !g.completed);
		const completedGoals = this.plugin.statsData.goals.filter((g) => g.completed);

		if (goals.length === 0 && completedGoals.length === 0) {
			goalsSection.createEl('p', {
				text: 'No goals set. Create a goal to track your progress!',
				cls: 'stats-muted',
			});
		} else {
			// Active goals
			goals.forEach((goal) => {
				this.renderGoalCard(goalsSection, goal, goalTracker);
			});

			// Completed goals (collapsible)
			if (completedGoals.length > 0) {
				const completedSection = goalsSection.createDiv({ cls: 'completed-goals-section' });
				const completedHeader = completedSection.createEl('h6', {
					text: `✅ Completed Goals (${completedGoals.length})`,
					cls: 'completed-goals-header',
				});
				completedHeader.style.cursor = 'pointer';
				completedHeader.style.marginTop = '16px';

				const completedList = completedSection.createDiv({ cls: 'completed-goals-list' });
				completedList.style.display = 'none';

				completedHeader.onclick = () => {
					completedList.style.display = completedList.style.display === 'none' ? 'block' : 'none';
				};

				completedGoals.forEach((goal) => {
					this.renderGoalCard(completedList, goal, goalTracker);
				});
			}
		}

		// Add goal button
		const addButton = goalsSection.createEl('button', {
			text: '+ Add New Goal',
			cls: 'stats-add-goal-button',
		});
		addButton.onclick = () => {
			const modal = new GoalEditorModal(this.app, null, (goal) => {
				goalTracker.createGoal(goal);
				this.plugin.saveStatsData();
				this.renderPanel();
			});
			modal.open();
		};
	}

	/**
	 * Render today's goal dashboard
	 */
	private renderTodayGoalDashboard(container: HTMLElement, tracker: GoalTracker, progress: any): void {
		const dashboard = container.createDiv({ cls: 'goal-dashboard' });

		const header = dashboard.createDiv({ cls: 'goal-dashboard-header' });
		header.createEl('h5', { text: "Today's Goal", cls: 'goal-dashboard-title' });

		const insights = tracker.getProductivityInsights();
		if (insights.currentStreak > 0) {
			const streakBadge = header.createDiv({ cls: 'goal-streak-badge' });
			streakBadge.createEl('span', { text: '🔥', cls: 'goal-streak-icon' });
			streakBadge.createEl('span', { text: `${insights.currentStreak} day streak!` });
		}

		dashboard.createEl('p', {
			text: `Write ${progress.target.toLocaleString()} words today`,
			cls: 'goal-dashboard-subtitle',
		});

		const progressLarge = dashboard.createDiv({ cls: 'goal-progress-large' });

		const progressLabel = progressLarge.createDiv({ cls: 'goal-progress-label' });
		progressLabel.createEl('span', {
			text: `${progress.actual.toLocaleString()} words`,
			cls: 'goal-progress-current',
		});
		progressLabel.createEl('span', {
			text: `${progress.target.toLocaleString()} words`,
			cls: 'goal-progress-target',
		});

		const progressBar = progressLarge.createDiv({ cls: 'goal-progress-bar-large' });
		const progressFill = progressBar.createDiv({ cls: 'goal-progress-fill-large' });
		progressFill.style.width = `${progress.percent}%`;

		const progressStats = progressLarge.createDiv({ cls: 'goal-progress-stats' });
		progressStats.createEl('span', { text: `${progress.percent}% complete` });
		progressStats.createEl('span', {
			text: progress.remaining > 0 ? `${progress.remaining.toLocaleString()} to go` : '✅ Goal achieved!',
		});
	}

	/**
	 * Render this week's goal dashboard
	 */
	private renderWeekGoalDashboard(container: HTMLElement, tracker: GoalTracker, progress: any): void {
		const dashboard = container.createDiv({ cls: 'goal-dashboard' });

		const header = dashboard.createDiv({ cls: 'goal-dashboard-header' });
		header.createEl('h5', { text: "This Week's Goal", cls: 'goal-dashboard-title' });

		const insights = tracker.getProductivityInsights();
		if (insights.currentStreak > 0) {
			const streakBadge = header.createDiv({ cls: 'goal-streak-badge' });
			streakBadge.createEl('span', { text: '🔥', cls: 'goal-streak-icon' });
			streakBadge.createEl('span', { text: `${insights.currentStreak} day streak!` });
		}

		dashboard.createEl('p', {
			text: `Write ${progress.target.toLocaleString()} words this week`,
			cls: 'goal-dashboard-subtitle',
		});

		const progressLarge = dashboard.createDiv({ cls: 'goal-progress-large' });

		const progressLabel = progressLarge.createDiv({ cls: 'goal-progress-label' });
		progressLabel.createEl('span', {
			text: `${progress.actual.toLocaleString()} words`,
			cls: 'goal-progress-current',
		});
		progressLabel.createEl('span', {
			text: `${progress.target.toLocaleString()} words`,
			cls: 'goal-progress-target',
		});

		const progressBar = progressLarge.createDiv({ cls: 'goal-progress-bar-large' });
		const progressFill = progressBar.createDiv({ cls: 'goal-progress-fill-large' });
		progressFill.style.width = `${progress.percent}%`;

		const progressStats = progressLarge.createDiv({ cls: 'goal-progress-stats' });
		progressStats.createEl('span', { text: `${progress.percent}% • ${progress.daysWritten}/7 days` });
		progressStats.createEl('span', {
			text: progress.remaining > 0 ? `${progress.remaining.toLocaleString()} to go` : '✅ Goal achieved!',
		});
	}

	/**
	 * Render individual goal card
	 */
	private renderGoalCard(container: HTMLElement, goal: any, tracker: GoalTracker): void {
		const goalCard = container.createDiv({ cls: 'stats-goal-card' });

		const titleRow = goalCard.createEl('h6');
		titleRow.createEl('span', { text: goal.name });
		titleRow.createEl('span', {
			text: this.getGoalTypeLabel(goal.type),
			cls: 'stats-goal-type',
		});

		// Calculate progress based on goal type
		let progress = 0;
		let currentWords = 0;

		if (goal.type === 'daily') {
			const todayProgress = tracker.getTodayGoalProgress();
			currentWords = todayProgress ? todayProgress.actual : 0;
			progress = todayProgress ? todayProgress.percent : 0;
		} else if (goal.type === 'weekly') {
			const weekProgress = tracker.getWeekGoalProgress();
			currentWords = weekProgress ? weekProgress.actual : 0;
			progress = weekProgress ? weekProgress.percent : 0;
		} else {
			currentWords = this.stats?.wordCount.total || goal.currentWords || 0;
			progress = Math.min(100, (currentWords / goal.targetWords) * 100);
		}

		const progressBar = goalCard.createDiv({ cls: 'stats-progress-bar' });
		const progressFill = progressBar.createDiv({ cls: 'stats-progress-fill' });
		progressFill.style.width = `${progress}%`;

		const progressText = goalCard.createEl('p', { cls: 'stats-goal-text' });
		progressText.textContent = `${currentWords.toLocaleString()} / ${goal.targetWords.toLocaleString()} words (${progress.toFixed(1)}%)`;

		if (goal.deadline) {
			const deadline = new Date(goal.deadline);
			const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
			goalCard.createEl('p', {
				text: `Deadline: ${this.formatDate(this.getDateKey(deadline))} (${daysLeft} days left)`,
				cls: 'stats-goal-deadline',
			});
		} else if (goal.type === 'project') {
			const estimatedCompletion = tracker.estimateProjectCompletion(goal);
			if (estimatedCompletion) {
				goalCard.createEl('p', {
					text: `Estimated completion: ${this.formatDate(this.getDateKey(estimatedCompletion))}`,
					cls: 'stats-goal-deadline',
				});
			}
		}

		// Action buttons
		const actions = goalCard.createDiv({ cls: 'stats-goal-actions' });

		const editBtn = actions.createEl('button', {
			text: 'Edit',
			cls: 'stats-goal-action-btn',
		});
		editBtn.onclick = () => {
			const modal = new GoalEditorModal(this.app, goal, (updatedGoal) => {
				tracker.updateGoal(goal.id, updatedGoal);
				this.plugin.saveStatsData();
				this.renderPanel();
			});
			modal.open();
		};

		if (goal.type === 'project' && !goal.completed) {
			const completeBtn = actions.createEl('button', {
				text: '✓ Complete',
				cls: 'stats-goal-action-btn',
			});
			completeBtn.onclick = () => {
				tracker.completeProjectGoal(goal.id);
				this.plugin.saveStatsData();
				this.renderPanel();
			};
		}

		const deleteBtn = actions.createEl('button', {
			text: 'Delete',
			cls: 'stats-goal-action-btn',
		});
		deleteBtn.onclick = () => {
			if (confirm(`Delete goal "${goal.name}"?`)) {
				tracker.deleteGoal(goal.id);
				this.plugin.saveStatsData();
				this.renderPanel();
			}
		};
	}

	/**
	 * Get goal type label
	 */
	private getGoalTypeLabel(type: string): string {
		switch (type) {
			case 'daily':
				return '📅 Daily';
			case 'weekly':
				return '📆 Weekly';
			case 'project':
				return '📖 Project';
			case 'session':
				return '⏱️ Session';
			default:
				return type;
		}
	}

	/**
	 * Create a stat display item
	 */
	private createStatItem(container: HTMLElement, label: string, value: string): void {
		const item = container.createDiv({ cls: 'stats-item' });
		item.createEl('div', { text: label, cls: 'stats-label' });
		item.createEl('div', { text: value, cls: 'stats-value' });
	}

	/**
	 * Calculate writing streak (consecutive days)
	 */
	private calculateStreak(): number {
		const history = this.plugin.statsData.history;
		const dates = Object.keys(history).sort().reverse();

		if (dates.length === 0) return 0;

		let streak = 0;
		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);

		for (let i = 0; i < dates.length; i++) {
			const dateKey = this.getDateKey(currentDate);
			if (history[dateKey] && history[dateKey].wordCount > 0) {
				streak++;
				currentDate.setDate(currentDate.getDate() - 1);
			} else {
				break;
			}
		}

		return streak;
	}

	/**
	 * Format date string for display
	 */
	private formatDate(dateKey: string): string {
		const date = new Date(dateKey);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
}
