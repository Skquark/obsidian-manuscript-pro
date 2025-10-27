/**
 * Enhanced Progress Tracking Manager
 *
 * Tracks writing progress with goals, streaks, velocity, and chapter-level analytics.
 */

import { App, Notice } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import {
	WritingGoal,
	WritingStreak,
	WritingVelocity,
	ChapterProgress,
	WritingSession,
	ProgressSnapshot,
	EnhancedProgressData,
	GoalType,
	ChapterStatus,
	TrendDirection,
} from './QualityInterfaces';

export class ProgressTrackingManager {
	private app: App;
	private plugin: ManuscriptProPlugin;
	private data: EnhancedProgressData;
	private currentSession: WritingSession | null = null;
	private lastWordCount = 0;

	constructor(plugin: ManuscriptProPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;

		// Initialize with empty data
		this.data = {
			goals: [],
			streak: {
				currentStreak: 0,
				longestStreak: 0,
				lastWritingDate: new Date(),
				totalDays: 0,
			},
			velocity: {
				wordsPerHour: 0,
				wordsPerDay: 0,
				wordsPerWeek: 0,
				trend: 'stable',
				calculatedAt: new Date(),
			},
			chapters: [],
			sessions: [],
			history: [],
			lastUpdated: new Date(),
		};
	}

	async initialize(): Promise<void> {
		await this.loadData();
		this.startSessionTracking();
	}

	// ============================================
	// SESSION TRACKING
	// ============================================

	private startSessionTracking(): void {
		if (!this.plugin.settings.quality?.progress?.trackSessions) {
			return;
		}

		// Track word count changes
		this.plugin.registerEvent(
			this.app.workspace.on('editor-change', () => {
				this.onEditorChange();
			}),
		);

		// Start session when workspace opens
		this.startSession();

		// End session when closing
		this.plugin.registerEvent(
			this.app.workspace.on('quit', () => {
				this.endSession();
			}),
		);
	}

	private startSession(): void {
		const file = this.app.workspace.getActiveFile();
		if (!file) return;

		// End previous session if exists
		if (this.currentSession) {
			this.endSession();
		}

		this.currentSession = {
			startTime: new Date(),
			endTime: undefined,
			wordsWritten: 0,
			duration: 0,
			file: file.path,
			active: true,
		};

		this.lastWordCount = this.getCurrentWordCount();
	}

	private async onEditorChange(): Promise<void> {
		if (!this.currentSession) {
			this.startSession();
			return;
		}

		const currentWordCount = this.getCurrentWordCount();
		const wordsAdded = currentWordCount - this.lastWordCount;

		if (wordsAdded > 0) {
			this.currentSession.wordsWritten += wordsAdded;
			this.updateStreak();
			await this.checkGoals();
		}

		this.lastWordCount = currentWordCount;
	}

	private endSession(): void {
		if (!this.currentSession) return;

		this.currentSession.endTime = new Date();
		this.currentSession.duration = Math.floor(
			(this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / 60000,
		);
		this.currentSession.active = false;

		// Only save sessions with meaningful activity
		if (this.currentSession.wordsWritten > 10) {
			this.data.sessions.push(this.currentSession);
			this.recordSnapshot();
			this.updateVelocity();
			this.saveData();
		}

		this.currentSession = null;
	}

	private getCurrentWordCount(): number {
		const file = this.app.workspace.getActiveFile();
		if (!file) return 0;

		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache) return 0;

		// Get word count from stats (if available) or calculate
		const activeView = this.app.workspace.getActiveViewOfType(require('obsidian').MarkdownView);
		// @ts-expect-error - editor property exists at runtime
		const content = activeView?.editor?.getValue() || '';
		return content.split(/\s+/).filter((w: string) => w.length > 0).length;
	}

	// ============================================
	// STREAK TRACKING
	// ============================================

	private updateStreak(): void {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const lastDate = new Date(this.data.streak.lastWritingDate);
		lastDate.setHours(0, 0, 0, 0);

		const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);

		if (daysDiff === 0) {
			// Same day, just continue
			return;
		} else if (daysDiff === 1) {
			// Consecutive day
			this.data.streak.currentStreak++;
			this.data.streak.totalDays++;
		} else {
			// Streak broken
			this.data.streak.currentStreak = 1;
			this.data.streak.totalDays++;
		}

		if (this.data.streak.currentStreak > this.data.streak.longestStreak) {
			this.data.streak.longestStreak = this.data.streak.currentStreak;
		}

		this.data.streak.lastWritingDate = today;
		this.saveData();
	}

	getStreak(): WritingStreak {
		return this.data.streak;
	}

	// ============================================
	// VELOCITY TRACKING
	// ============================================

	private updateVelocity(): void {
		// Calculate words per hour from recent sessions
		const recentSessions = this.data.sessions.slice(-10);
		if (recentSessions.length === 0) return;

		const totalWords = recentSessions.reduce((sum, s) => sum + s.wordsWritten, 0);
		const totalMinutes = recentSessions.reduce((sum, s) => sum + s.duration, 0);

		this.data.velocity.wordsPerHour = totalMinutes > 0 ? Math.round((totalWords / totalMinutes) * 60) : 0;

		// Calculate words per day from recent history
		const recentHistory = this.data.history.slice(-7);
		if (recentHistory.length > 0) {
			const avgDaily = recentHistory.reduce((sum, h) => sum + h.dailyWords, 0) / recentHistory.length;
			this.data.velocity.wordsPerDay = Math.round(avgDaily);
		}

		// Calculate words per week
		this.data.velocity.wordsPerWeek = this.data.velocity.wordsPerDay * 7;

		// Calculate trend
		this.data.velocity.trend = this.calculateTrend();
		this.data.velocity.calculatedAt = new Date();
	}

	private calculateTrend(): TrendDirection {
		if (this.data.history.length < 14) return 'stable';

		const recent = this.data.history.slice(-7);
		const previous = this.data.history.slice(-14, -7);

		const recentAvg = recent.reduce((sum, h) => sum + h.dailyWords, 0) / recent.length;
		const previousAvg = previous.reduce((sum, h) => sum + h.dailyWords, 0) / previous.length;

		const change = (recentAvg - previousAvg) / previousAvg;

		if (change > 0.1) return 'increasing';
		if (change < -0.1) return 'decreasing';
		return 'stable';
	}

	getVelocity(): WritingVelocity {
		return this.data.velocity;
	}

	// ============================================
	// GOAL MANAGEMENT
	// ============================================

	addGoal(type: GoalType, target: number, deadline?: Date, description?: string): WritingGoal {
		const goal: WritingGoal = {
			id: Date.now().toString(),
			type,
			target,
			current: 0,
			deadline,
			description: description || `${type} goal: ${target} words`,
			createdAt: new Date(),
		};

		this.data.goals.push(goal);
		this.saveData();

		return goal;
	}

	removeGoal(id: string): void {
		this.data.goals = this.data.goals.filter((g) => g.id !== id);
		this.saveData();
	}

	private async checkGoals(): Promise<void> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (const goal of this.data.goals) {
			const previousCurrent = goal.current;

			switch (goal.type) {
				case 'daily': {
					const todaySnapshot = this.data.history.find((h) => {
						const d = new Date(h.date);
						d.setHours(0, 0, 0, 0);
						return d.getTime() === today.getTime();
					});
					goal.current = todaySnapshot?.dailyWords || 0;
					break;
				}

				case 'weekly': {
					const weekAgo = new Date(today);
					weekAgo.setDate(weekAgo.getDate() - 7);
					const weekSnapshots = this.data.history.filter((h) => new Date(h.date) >= weekAgo);
					goal.current = weekSnapshots.reduce((sum, h) => sum + h.dailyWords, 0);
					break;
				}

				case 'total': {
					goal.current = this.getCurrentTotalWords();
					break;
				}

				case 'session': {
					goal.current = this.currentSession?.wordsWritten || 0;
					break;
				}
			}

			// Notify if goal achieved
			if (goal.current >= goal.target && previousCurrent < goal.target) {
				new Notice(`🎉 Goal achieved: ${goal.description}!`);
			}
		}

		this.saveData();
	}

	getGoals(): WritingGoal[] {
		return this.data.goals;
	}

	getActiveGoals(): WritingGoal[] {
		const now = new Date();
		return this.data.goals.filter((goal) => {
			// Filter out goals that have passed their deadline
			if (goal.deadline) {
				return new Date(goal.deadline) >= now;
			}
			return true;
		});
	}

	getAllSessions(): WritingSession[] {
		return this.data.sessions;
	}

	getRecentSessions(count: number): WritingSession[] {
		// Return the most recent sessions, sorted by start time descending
		return [...this.data.sessions]
			.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
			.slice(0, count);
	}

	private getCurrentTotalWords(): number {
		// Sum all word counts from history or calculate from current document
		const file = this.app.workspace.getActiveFile();
		if (!file) return 0;

		return this.getCurrentWordCount();
	}

	// ============================================
	// CHAPTER PROGRESS
	// ============================================

	addChapter(file: string, title: string, targetWords: number): ChapterProgress {
		const chapter: ChapterProgress = {
			file,
			title,
			status: 'planned',
			wordCount: 0,
			targetWords,
			percentComplete: 0,
			lastModified: new Date(),
			notes: '',
		};

		this.data.chapters.push(chapter);
		this.saveData();

		return chapter;
	}

	updateChapterStatus(file: string, status: ChapterStatus): void {
		const chapter = this.data.chapters.find((c) => c.file === file);
		if (!chapter) return;

		chapter.status = status;
		chapter.lastModified = new Date();
		this.saveData();
	}

	updateChapterProgress(file: string, wordCount: number): void {
		const chapter = this.data.chapters.find((c) => c.file === file);
		if (!chapter) return;

		chapter.wordCount = wordCount;
		chapter.percentComplete = Math.round((wordCount / chapter.targetWords) * 100);
		chapter.lastModified = new Date();
		this.saveData();
	}

	getChapterProgress(): ChapterProgress[] {
		return this.data.chapters;
	}

	removeChapter(file: string): void {
		this.data.chapters = this.data.chapters.filter((c) => c.file !== file);
		this.saveData();
	}

	// ============================================
	// PROGRESS SNAPSHOTS
	// ============================================

	private recordSnapshot(): void {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Check if we already have a snapshot for today
		const existingIndex = this.data.history.findIndex((h) => {
			const d = new Date(h.date);
			d.setHours(0, 0, 0, 0);
			return d.getTime() === today.getTime();
		});

		const snapshot: ProgressSnapshot = {
			date: today,
			totalWords: this.getCurrentTotalWords(),
			dailyWords: this.currentSession?.wordsWritten || 0,
			sessionMinutes: this.currentSession?.duration || 0,
			wordsPerHour: this.data.velocity.wordsPerHour,
			chaptersCompleted: this.data.chapters.filter((c) => c.status === 'final').length,
			goalsAchieved: this.data.goals.filter((g) => g.current >= g.target).map((g) => g.id),
		};

		if (existingIndex >= 0) {
			// Update existing snapshot
			const existing = this.data.history[existingIndex];
			snapshot.dailyWords = existing.dailyWords + (this.currentSession?.wordsWritten || 0);
			this.data.history[existingIndex] = snapshot;
		} else {
			// Add new snapshot
			this.data.history.push(snapshot);
		}

		// Keep only last 90 days
		if (this.data.history.length > 90) {
			this.data.history = this.data.history.slice(-90);
		}
	}

	getHistory(days = 30): ProgressSnapshot[] {
		return this.data.history.slice(-days);
	}

	// ============================================
	// STATISTICS & EXPORTS
	// ============================================

	getStatsSummary(): {
		totalWords: number;
		todayWords: number;
		streak: number;
		velocity: number;
		goalsAchieved: number;
		chaptersComplete: number;
	} {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const todaySnapshot = this.data.history.find((h) => {
			const d = new Date(h.date);
			d.setHours(0, 0, 0, 0);
			return d.getTime() === today.getTime();
		});

		return {
			totalWords: this.getCurrentTotalWords(),
			todayWords: todaySnapshot?.dailyWords || 0,
			streak: this.data.streak.currentStreak,
			velocity: this.data.velocity.wordsPerHour,
			goalsAchieved: this.data.goals.filter((g) => g.current >= g.target).length,
			chaptersComplete: this.data.chapters.filter((c) => c.status === 'final').length,
		};
	}

	exportToCSV(): string {
		const headers = ['Date', 'Total Words', 'Daily Words', 'Session Minutes', 'Words/Hour', 'Chapters Complete'];
		const rows = this.data.history.map((h) => [
			new Date(h.date).toISOString().split('T')[0],
			h.totalWords,
			h.dailyWords,
			h.sessionMinutes,
			h.wordsPerHour,
			h.chaptersCompleted,
		]);

		return [headers, ...rows].map((row) => row.join(',')).join('\n');
	}

	exportToJSON(): string {
		return JSON.stringify(
			{
				summary: this.getStatsSummary(),
				goals: this.data.goals,
				chapters: this.data.chapters,
				velocity: this.data.velocity,
				streak: this.data.streak,
				history: this.data.history,
				exportedAt: new Date().toISOString(),
			},
			null,
			2,
		);
	}

	// ============================================
	// PERSISTENCE
	// ============================================

	private async loadData(): Promise<void> {
		const saved = await this.plugin.loadData();
		if (saved?.enhancedProgress) {
			this.data = {
				...this.data,
				...saved.enhancedProgress,
				// Convert date strings back to Date objects
				streak: {
					...saved.enhancedProgress.streak,
					lastWritingDate: new Date(saved.enhancedProgress.streak.lastWritingDate),
				},
				velocity: {
					...saved.enhancedProgress.velocity,
					calculatedAt: new Date(saved.enhancedProgress.velocity.calculatedAt),
				},
				lastUpdated: new Date(saved.enhancedProgress.lastUpdated),
			};
		}
	}

	private async saveData(): Promise<void> {
		const saved = (await this.plugin.loadData()) || {};
		saved.enhancedProgress = this.data;
		await this.plugin.saveData(saved);
	}

	/**
	 * Reset all progress data (use with caution)
	 */
	async reset(): Promise<void> {
		this.data = {
			goals: [],
			streak: {
				currentStreak: 0,
				longestStreak: 0,
				lastWritingDate: new Date(),
				totalDays: 0,
			},
			velocity: {
				wordsPerHour: 0,
				wordsPerDay: 0,
				wordsPerWeek: 0,
				trend: 'stable',
				calculatedAt: new Date(),
			},
			chapters: [],
			sessions: [],
			history: [],
			lastUpdated: new Date(),
		};

		await this.saveData();
		new Notice('Progress data reset');
	}
}
