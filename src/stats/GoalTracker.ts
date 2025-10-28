/**
 * Goal Tracker
 * Comprehensive goal tracking with daily/weekly/project goals,
 * streak counters, and productivity insights
 */

import type {
	WritingGoal,
	DailyGoalProgress,
	WeeklyGoalProgress,
	ProductivityInsights,
	StatsData,
	StatsHistory,
} from './StatsInterfaces';

export class GoalTracker {
	constructor(private statsData: StatsData) {}

	/**
	 * Get today's date key (YYYY-MM-DD)
	 */
	private getTodayKey(): string {
		return new Date().toISOString().split('T')[0];
	}

	/**
	 * Get week start date (Monday) for a given date
	 */
	private getWeekStart(date: Date): string {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
		d.setDate(diff);
		return d.toISOString().split('T')[0];
	}

	/**
	 * Calculate current streak (consecutive days with writing)
	 */
	calculateStreak(): number {
		const history = this.statsData.history;
		const dates = Object.keys(history).sort().reverse();

		if (dates.length === 0) return 0;

		let streak = 0;
		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);

		// Check if we wrote today or yesterday (streak can continue from yesterday)
		const today = this.getTodayKey();
		const yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

		let startDate: Date;
		if (history[today] && history[today].wordCount > 0) {
			startDate = currentDate;
		} else if (history[yesterday] && history[yesterday].wordCount > 0) {
			startDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
		} else {
			return 0; // No current streak
		}

		// Count backwards from start date
		for (let i = 0; i < 365; i++) {
			// Max 1 year streak check
			const dateKey = startDate.toISOString().split('T')[0];
			if (history[dateKey] && history[dateKey].wordCount > 0) {
				streak++;
				startDate.setDate(startDate.getDate() - 1);
			} else {
				break;
			}
		}

		return streak;
	}

	/**
	 * Calculate longest streak in history
	 */
	calculateLongestStreak(): number {
		const history = this.statsData.history;
		const dates = Object.keys(history).sort();

		let longestStreak = 0;
		let currentStreak = 0;
		let lastDate: Date | null = null;

		for (const dateKey of dates) {
			const data = history[dateKey];
			if (data.wordCount === 0) {
				currentStreak = 0;
				lastDate = null;
				continue;
			}

			const currentDate = new Date(dateKey);

			if (lastDate) {
				const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
				if (daysDiff === 1) {
					currentStreak++;
				} else {
					currentStreak = 1;
				}
			} else {
				currentStreak = 1;
			}

			longestStreak = Math.max(longestStreak, currentStreak);
			lastDate = currentDate;
		}

		return longestStreak;
	}

	/**
	 * Get productivity insights
	 */
	getProductivityInsights(): ProductivityInsights {
		const history = this.statsData.history;
		const dates = Object.keys(history);

		let totalWords = 0;
		let totalDaysWritten = 0;

		// Count writing days and total words
		for (const dateKey of dates) {
			const data = history[dateKey];
			if (data.wordCount > 0) {
				totalDaysWritten++;
				totalWords += data.wordCount;
			}
		}

		const averageWordsPerDay = totalDaysWritten > 0 ? Math.round(totalWords / totalDaysWritten) : 0;

		return {
			averageWordsPerDay,
			longestStreak: this.calculateLongestStreak(),
			currentStreak: this.calculateStreak(),
			totalDaysWritten,
			totalWords,
		};
	}

	/**
	 * Update daily goal progress
	 */
	updateDailyProgress(todayWordCount: number): void {
		const today = this.getTodayKey();
		const dailyGoals = this.statsData.goals.filter((g) => g.type === 'daily');

		if (dailyGoals.length === 0) return;

		// Initialize array if needed
		if (!this.statsData.dailyGoalProgress) {
			this.statsData.dailyGoalProgress = [];
		}

		// Find or create today's progress entry
		let todayProgress = this.statsData.dailyGoalProgress.find((p) => p.date === today);

		if (!todayProgress) {
			todayProgress = {
				date: today,
				targetWords: dailyGoals[0].targetWords,
				actualWords: todayWordCount,
				achieved: todayWordCount >= dailyGoals[0].targetWords,
			};
			this.statsData.dailyGoalProgress.push(todayProgress);
		} else {
			todayProgress.actualWords = todayWordCount;
			todayProgress.achieved = todayWordCount >= todayProgress.targetWords;
		}

		// Prune old entries (keep last 365 days)
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - 365);
		const cutoffKey = cutoffDate.toISOString().split('T')[0];

		this.statsData.dailyGoalProgress = this.statsData.dailyGoalProgress.filter((p) => p.date >= cutoffKey);
	}

	/**
	 * Update weekly goal progress
	 */
	updateWeeklyProgress(): void {
		const weekStart = this.getWeekStart(new Date());
		const weeklyGoals = this.statsData.goals.filter((g) => g.type === 'weekly');

		if (weeklyGoals.length === 0) return;

		// Initialize array if needed
		if (!this.statsData.weeklyGoalProgress) {
			this.statsData.weeklyGoalProgress = [];
		}

		// Calculate words this week
		let weekWords = 0;
		let daysWritten = 0;
		const weekStartDate = new Date(weekStart);

		for (let i = 0; i < 7; i++) {
			const date = new Date(weekStartDate.getTime() + i * 24 * 60 * 60 * 1000);
			const dateKey = date.toISOString().split('T')[0];
			const dayData = this.statsData.history[dateKey];

			if (dayData) {
				weekWords += dayData.wordCount;
				if (dayData.wordCount > 0) daysWritten++;
			}
		}

		// Find or create this week's progress entry
		let weekProgress = this.statsData.weeklyGoalProgress.find((p) => p.weekStart === weekStart);

		if (!weekProgress) {
			weekProgress = {
				weekStart,
				targetWords: weeklyGoals[0].targetWords,
				actualWords: weekWords,
				daysWritten,
			};
			this.statsData.weeklyGoalProgress.push(weekProgress);
		} else {
			weekProgress.actualWords = weekWords;
			weekProgress.daysWritten = daysWritten;
		}

		// Prune old entries (keep last 52 weeks)
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - 364); // 52 weeks
		const cutoffKey = this.getWeekStart(cutoffDate);

		this.statsData.weeklyGoalProgress = this.statsData.weeklyGoalProgress.filter((p) => p.weekStart >= cutoffKey);
	}

	/**
	 * Get today's daily goal progress
	 */
	getTodayGoalProgress(): { target: number; actual: number; percent: number; remaining: number } | null {
		const dailyGoals = this.statsData.goals.filter((g) => g.type === 'daily');
		if (dailyGoals.length === 0) return null;

		const goal = dailyGoals[0];
		const today = this.getTodayKey();
		const todayData = this.statsData.history[today];
		const actual = todayData ? todayData.wordCount : 0;
		const percent = Math.min(100, Math.round((actual / goal.targetWords) * 100));
		const remaining = Math.max(0, goal.targetWords - actual);

		return {
			target: goal.targetWords,
			actual,
			percent,
			remaining,
		};
	}

	/**
	 * Get this week's goal progress
	 */
	getWeekGoalProgress(): { target: number; actual: number; percent: number; remaining: number; daysWritten: number } | null {
		const weeklyGoals = this.statsData.goals.filter((g) => g.type === 'weekly');
		if (weeklyGoals.length === 0) return null;

		const goal = weeklyGoals[0];
		const weekStart = this.getWeekStart(new Date());
		const weekStartDate = new Date(weekStart);

		// Calculate words this week
		let weekWords = 0;
		let daysWritten = 0;

		for (let i = 0; i < 7; i++) {
			const date = new Date(weekStartDate.getTime() + i * 24 * 60 * 60 * 1000);
			const dateKey = date.toISOString().split('T')[0];
			const dayData = this.statsData.history[dateKey];

			if (dayData) {
				weekWords += dayData.wordCount;
				if (dayData.wordCount > 0) daysWritten++;
			}
		}

		const percent = Math.min(100, Math.round((weekWords / goal.targetWords) * 100));
		const remaining = Math.max(0, goal.targetWords - weekWords);

		return {
			target: goal.targetWords,
			actual: weekWords,
			percent,
			remaining,
			daysWritten,
		};
	}

	/**
	 * Estimate project completion date based on average velocity
	 */
	estimateProjectCompletion(projectGoal: WritingGoal): Date | null {
		const insights = this.getProductivityInsights();
		if (insights.averageWordsPerDay === 0) return null;

		const remaining = projectGoal.targetWords - projectGoal.currentWords;
		if (remaining <= 0) return new Date(); // Already complete

		const daysNeeded = Math.ceil(remaining / insights.averageWordsPerDay);
		const completionDate = new Date();
		completionDate.setDate(completionDate.getDate() + daysNeeded);

		return completionDate;
	}

	/**
	 * Get heatmap data for contribution calendar (last 365 days)
	 */
	getHeatmapData(): Array<{ date: string; count: number; level: number }> {
		const data: Array<{ date: string; count: number; level: number }> = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Go back 365 days
		for (let i = 364; i >= 0; i--) {
			const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
			const dateKey = date.toISOString().split('T')[0];
			const dayData = this.statsData.history[dateKey];
			const count = dayData ? dayData.wordCount : 0;

			// Calculate level (0-4) based on word count
			let level = 0;
			if (count > 0) level = 1;
			if (count >= 500) level = 2;
			if (count >= 1000) level = 3;
			if (count >= 2000) level = 4;

			data.push({ date: dateKey, count, level });
		}

		return data;
	}

	/**
	 * Create a new goal
	 */
	createGoal(goal: WritingGoal): void {
		this.statsData.goals.push(goal);
	}

	/**
	 * Update an existing goal
	 */
	updateGoal(goalId: string, updates: Partial<WritingGoal>): boolean {
		const goal = this.statsData.goals.find((g) => g.id === goalId);
		if (!goal) return false;

		Object.assign(goal, updates);
		return true;
	}

	/**
	 * Delete a goal
	 */
	deleteGoal(goalId: string): boolean {
		const index = this.statsData.goals.findIndex((g) => g.id === goalId);
		if (index === -1) return false;

		this.statsData.goals.splice(index, 1);
		return true;
	}

	/**
	 * Mark a project goal as complete
	 */
	completeProjectGoal(goalId: string): boolean {
		const goal = this.statsData.goals.find((g) => g.id === goalId);
		if (!goal || goal.type !== 'project') return false;

		goal.completed = true;
		goal.completedAt = Date.now();
		return true;
	}
}
