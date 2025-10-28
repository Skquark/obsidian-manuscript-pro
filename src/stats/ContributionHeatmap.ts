/**
 * Contribution Heatmap
 * GitHub-style activity calendar showing daily writing progress
 */

export interface HeatmapDay {
	date: string; // YYYY-MM-DD
	count: number; // Word count
	level: number; // 0-4 intensity level
}

export class ContributionHeatmap {
	/**
	 * Render heatmap to container
	 */
	render(container: HTMLElement, data: HeatmapDay[]): void {
		container.empty();
		container.addClass('contribution-heatmap');

		// Create header
		const header = container.createDiv({ cls: 'heatmap-header' });
		header.createEl('h5', { text: 'Writing Activity' });

		const legend = header.createDiv({ cls: 'heatmap-legend' });
		legend.createEl('span', { text: 'Less', cls: 'heatmap-legend-label' });

		for (let i = 0; i <= 4; i++) {
			const square = legend.createDiv({ cls: `heatmap-square level-${i}` });
			square.title = this.getLevelLabel(i);
		}

		legend.createEl('span', { text: 'More', cls: 'heatmap-legend-label' });

		// Create calendar grid
		const calendar = container.createDiv({ cls: 'heatmap-calendar' });

		// Group data by weeks
		const weeks = this.groupByWeeks(data);

		// Render month labels
		this.renderMonthLabels(calendar, weeks);

		// Render day labels (Mon, Wed, Fri)
		this.renderDayLabels(calendar);

		// Render weeks
		const weeksContainer = calendar.createDiv({ cls: 'heatmap-weeks' });

		weeks.forEach((week) => {
			const weekEl = weeksContainer.createDiv({ cls: 'heatmap-week' });

			week.forEach((day) => {
				const dayEl = weekEl.createDiv({
					cls: `heatmap-day level-${day ? day.level : 0}`,
				});

				if (day) {
					dayEl.title = this.formatTooltip(day);
					dayEl.dataset.date = day.date;
					dayEl.dataset.count = day.count.toString();
				} else {
					// Empty cell for padding
					dayEl.addClass('empty');
				}
			});
		});

		// Add stats summary
		this.renderStats(container, data);
	}

	/**
	 * Group days into weeks (Sunday to Saturday)
	 */
	private groupByWeeks(data: HeatmapDay[]): Array<Array<HeatmapDay | null>> {
		const weeks: Array<Array<HeatmapDay | null>> = [];
		const startDate = new Date(data[0].date);
		const endDate = new Date(data[data.length - 1].date);

		// Get to the previous Sunday
		const currentDate = new Date(startDate);
		currentDate.setDate(currentDate.getDate() - currentDate.getDay());

		let currentWeek: Array<HeatmapDay | null> = [];

		// Create a map for quick day lookup
		const dayMap = new Map<string, HeatmapDay>();
		data.forEach((d) => dayMap.set(d.date, d));

		// Iterate through all days
		while (currentDate <= endDate) {
			const dateKey = currentDate.toISOString().split('T')[0];
			const dayData = dayMap.get(dateKey);

			currentWeek.push(dayData || null);

			// If Saturday (day 6), start new week
			if (currentDate.getDay() === 6) {
				weeks.push(currentWeek);
				currentWeek = [];
			}

			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Push remaining days
		if (currentWeek.length > 0) {
			// Pad to full week
			while (currentWeek.length < 7) {
				currentWeek.push(null);
			}
			weeks.push(currentWeek);
		}

		return weeks;
	}

	/**
	 * Render month labels above calendar
	 */
	private renderMonthLabels(container: HTMLElement, weeks: Array<Array<HeatmapDay | null>>): void {
		const monthsRow = container.createDiv({ cls: 'heatmap-months' });

		let lastMonth = -1;
		let weekIndex = 0;

		weeks.forEach((week) => {
			const firstDay = week.find((d) => d !== null);
			if (firstDay) {
				const date = new Date(firstDay.date);
				const month = date.getMonth();

				if (month !== lastMonth && weekIndex > 0) {
					const monthLabel = monthsRow.createDiv({
						cls: 'heatmap-month-label',
					});
					monthLabel.textContent = date.toLocaleDateString('en-US', { month: 'short' });
					monthLabel.style.left = `${weekIndex * 14}px`; // 14px per week
					lastMonth = month;
				}
			}
			weekIndex++;
		});
	}

	/**
	 * Render day of week labels (Mon, Wed, Fri)
	 */
	private renderDayLabels(container: HTMLElement): void {
		const daysColumn = container.createDiv({ cls: 'heatmap-days' });

		const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];

		dayLabels.forEach((label, index) => {
			const dayEl = daysColumn.createDiv({ cls: 'heatmap-day-label' });
			dayEl.textContent = label;
		});
	}

	/**
	 * Render statistics summary
	 */
	private renderStats(container: HTMLElement, data: HeatmapDay[]): void {
		const stats = container.createDiv({ cls: 'heatmap-stats' });

		// Calculate totals
		let totalWords = 0;
		let daysWritten = 0;
		let maxDay = { count: 0, date: '' };

		data.forEach((day) => {
			totalWords += day.count;
			if (day.count > 0) daysWritten++;
			if (day.count > maxDay.count) {
				maxDay = { count: day.count, date: day.date };
			}
		});

		const avgWords = daysWritten > 0 ? Math.round(totalWords / daysWritten) : 0;

		// Render stats
		const statsGrid = stats.createDiv({ cls: 'heatmap-stats-grid' });

		this.createStatItem(statsGrid, 'Total Words', totalWords.toLocaleString());
		this.createStatItem(statsGrid, 'Days Written', daysWritten.toString());
		this.createStatItem(statsGrid, 'Avg Words/Day', avgWords.toLocaleString());
		this.createStatItem(statsGrid, 'Best Day', maxDay.count.toLocaleString());
	}

	/**
	 * Create a stat item
	 */
	private createStatItem(container: HTMLElement, label: string, value: string): void {
		const item = container.createDiv({ cls: 'heatmap-stat-item' });
		item.createEl('div', { text: value, cls: 'heatmap-stat-value' });
		item.createEl('div', { text: label, cls: 'heatmap-stat-label' });
	}

	/**
	 * Format tooltip text
	 */
	private formatTooltip(day: HeatmapDay): string {
		const date = new Date(day.date);
		const dateStr = date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});

		if (day.count === 0) {
			return `${dateStr}: No writing`;
		}

		return `${dateStr}: ${day.count.toLocaleString()} words`;
	}

	/**
	 * Get intensity level label
	 */
	private getLevelLabel(level: number): string {
		switch (level) {
			case 0:
				return 'No writing';
			case 1:
				return '1-499 words';
			case 2:
				return '500-999 words';
			case 3:
				return '1,000-1,999 words';
			case 4:
				return '2,000+ words';
			default:
				return '';
		}
	}
}
