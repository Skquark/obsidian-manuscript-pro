/**
 * Plot Arc Manager
 * Core logic for managing plot threads, milestones, and analysis
 */

import type LatexPandocConcealerPlugin from '../main';
import type {
	PlotThread,
	PlotMilestone,
	PlotAppearance,
	PlotArcData,
	PlotThreadType,
	PlotThreadStatus,
	MilestoneType,
	PlotProminence,
	TensionDataPoint,
	PlotIssue,
} from './PlotArcInterfaces';
import { DEFAULT_THREAD_COLORS, STORY_BEATS } from './PlotArcInterfaces';

export class PlotArcManager {
	private data: PlotArcData;

	constructor(private plugin: LatexPandocConcealerPlugin) {
		// Initialize or load existing data
		this.data = this.plugin.settings.plotArc || this.getDefaultData();
	}

	/**
	 * Get default plot arc data
	 */
	private getDefaultData(): PlotArcData {
		return {
			threads: [],
			settings: {
				enabled: true,
				structure: 'three-act',
				showTensionGraph: true,
				showTimeline: true,
				colorCodeThreads: true,
				autoAnalyze: true,
				defaultThreadColor: '#4A90E2',
			},
		};
	}

	/**
	 * Get all plot threads
	 */
	getThreads(): PlotThread[] {
		return this.data.threads;
	}

	/**
	 * Get thread by ID
	 */
	getThread(id: string): PlotThread | undefined {
		return this.data.threads.find((t) => t.id === id);
	}

	/**
	 * Create new plot thread
	 */
	createThread(
		title: string,
		type: PlotThreadType,
		description: string = '',
	): PlotThread {
		const thread: PlotThread = {
			id: this.generateId(),
			title,
			type,
			description,
			color: DEFAULT_THREAD_COLORS[type],
			status: 'active',
			milestones: [],
			appearances: [],
			relatedCharacters: [],
			relatedThreads: [],
			conflicts: [],
			created: Date.now(),
			modified: Date.now(),
		};

		this.data.threads.push(thread);
		this.save();
		return thread;
	}

	/**
	 * Update plot thread
	 */
	updateThread(id: string, updates: Partial<PlotThread>): boolean {
		const thread = this.getThread(id);
		if (!thread) return false;

		Object.assign(thread, updates);
		thread.modified = Date.now();
		this.save();
		return true;
	}

	/**
	 * Delete plot thread
	 */
	deleteThread(id: string): boolean {
		const index = this.data.threads.findIndex((t) => t.id === id);
		if (index === -1) return false;

		this.data.threads.splice(index, 1);
		this.save();
		return true;
	}

	/**
	 * Add milestone to thread
	 */
	addMilestone(
		threadId: string,
		description: string,
		type: MilestoneType,
		position: number,
		tension: number = 5,
	): PlotMilestone | null {
		const thread = this.getThread(threadId);
		if (!thread) return null;

		const milestone: PlotMilestone = {
			id: this.generateId(),
			description,
			type,
			position,
			tension,
			created: Date.now(),
		};

		thread.milestones.push(milestone);
		thread.milestones.sort((a, b) => a.position - b.position);
		thread.modified = Date.now();
		this.save();
		return milestone;
	}

	/**
	 * Update milestone
	 */
	updateMilestone(
		threadId: string,
		milestoneId: string,
		updates: Partial<PlotMilestone>,
	): boolean {
		const thread = this.getThread(threadId);
		if (!thread) return false;

		const milestone = thread.milestones.find((m) => m.id === milestoneId);
		if (!milestone) return false;

		Object.assign(milestone, updates);
		thread.milestones.sort((a, b) => a.position - b.position);
		thread.modified = Date.now();
		this.save();
		return true;
	}

	/**
	 * Delete milestone
	 */
	deleteMilestone(threadId: string, milestoneId: string): boolean {
		const thread = this.getThread(threadId);
		if (!thread) return false;

		const index = thread.milestones.findIndex((m) => m.id === milestoneId);
		if (index === -1) return false;

		thread.milestones.splice(index, 1);
		thread.modified = Date.now();
		this.save();
		return true;
	}

	/**
	 * Add scene appearance
	 */
	addAppearance(
		threadId: string,
		sceneId: string,
		prominence: PlotProminence = 'secondary',
	): PlotAppearance | null {
		const thread = this.getThread(threadId);
		if (!thread) return null;

		// Don't add duplicate appearances
		if (thread.appearances.some((a) => a.sceneId === sceneId)) {
			return null;
		}

		const appearance: PlotAppearance = {
			sceneId,
			prominence,
		};

		thread.appearances.push(appearance);
		thread.modified = Date.now();
		this.save();
		return appearance;
	}

	/**
	 * Remove scene appearance
	 */
	removeAppearance(threadId: string, sceneId: string): boolean {
		const thread = this.getThread(threadId);
		if (!thread) return false;

		const index = thread.appearances.findIndex((a) => a.sceneId === sceneId);
		if (index === -1) return false;

		thread.appearances.splice(index, 1);
		thread.modified = Date.now();
		this.save();
		return true;
	}

	/**
	 * Get tension data points for graphing
	 */
	getTensionData(threadId?: string): TensionDataPoint[] {
		const points: TensionDataPoint[] = [];

		// Get threads to analyze
		const threads = threadId
			? [this.getThread(threadId)].filter(Boolean) as PlotThread[]
			: this.data.threads.filter((t) => t.status === 'active');

		for (const thread of threads) {
			for (const milestone of thread.milestones) {
				points.push({
					position: milestone.position,
					tension: milestone.tension,
					threadId: thread.id,
					chapterNumber: milestone.chapterNumber,
				});
			}
		}

		// Sort by position
		points.sort((a, b) => a.position - b.position);

		return points;
	}

	/**
	 * Get aggregate tension at a given position
	 */
	getAggregateTension(position: number, threads?: PlotThread[]): number {
		const activeThreads = threads || this.data.threads.filter((t) => t.status === 'active');
		let totalTension = 0;
		let count = 0;

		for (const thread of activeThreads) {
			// Find closest milestones before and after position
			const before = thread.milestones
				.filter((m) => m.position <= position)
				.sort((a, b) => b.position - a.position)[0];
			const after = thread.milestones
				.filter((m) => m.position > position)
				.sort((a, b) => a.position - b.position)[0];

			if (before && after) {
				// Interpolate between milestones
				const range = after.position - before.position;
				const offset = position - before.position;
				const ratio = offset / range;
				const interpolated = before.tension + (after.tension - before.tension) * ratio;
				totalTension += interpolated;
				count++;
			} else if (before) {
				totalTension += before.tension;
				count++;
			} else if (after) {
				totalTension += after.tension;
				count++;
			}
		}

		return count > 0 ? totalTension / count : 0;
	}

	/**
	 * Analyze plot for issues
	 */
	analyzePlot(): PlotIssue[] {
		const issues: PlotIssue[] = [];

		// Check each thread
		for (const thread of this.data.threads) {
			// Unresolved threads
			if (thread.status === 'active') {
				const hasResolution = thread.milestones.some(
					(m) => m.type === 'resolution' || m.type === 'climax',
				);
				if (!hasResolution && thread.milestones.length > 0) {
					issues.push({
						id: this.generateId(),
						severity: 'warning',
						type: 'unresolved-thread',
						threadId: thread.id,
						message: `Thread "${thread.title}" has no resolution milestone`,
						suggestion: 'Add a climax or resolution milestone to complete this thread',
					});
				}
			}

			// Missing climax
			const hasClim ax = thread.milestones.some((m) => m.type === 'climax');
			if (thread.status === 'resolved' && !hasClimax) {
				issues.push({
					id: this.generateId(),
					severity: 'warning',
					type: 'missing-climax',
					threadId: thread.id,
					message: `Thread "${thread.title}" is resolved but has no climax milestone`,
					suggestion: 'Mark the climactic moment for this thread',
				});
			}

			// Flat pacing (low tension for extended period)
			const lowTensionMilestones = thread.milestones.filter((m) => m.tension <= 3);
			if (lowTensionMilestones.length >= 3) {
				const positions = lowTensionMilestones.map((m) => m.position).join(', ');
				issues.push({
					id: this.generateId(),
					severity: 'info',
					type: 'flat-pacing',
					threadId: thread.id,
					message: `Thread "${thread.title}" has extended low tension periods`,
					suggestion: 'Consider adding conflict or complications to increase tension',
					location: {
						position: lowTensionMilestones[0].position,
					},
				});
			}
		}

		// Check for missing story beats
		const beats = STORY_BEATS[this.data.settings.structure];
		for (const beat of beats) {
			const hasBeat = this.data.threads.some((t) =>
				t.milestones.some((m) => m.beatSheet === beat.id),
			);
			if (!hasBeat) {
				issues.push({
					id: this.generateId(),
					severity: 'info',
					type: 'missing-beat',
					message: `Missing story beat: ${beat.name}`,
					suggestion: beat.description,
					location: {
						position: beat.expectedPosition,
					},
				});
			}
		}

		// Cache results
		this.data.issues = issues;
		this.data.lastAnalysis = Date.now();
		this.save();

		return issues;
	}

	/**
	 * Get completion percentage for a thread
	 */
	getThreadCompletion(threadId: string): number {
		const thread = this.getThread(threadId);
		if (!thread || thread.milestones.length === 0) return 0;

		const maxPosition = Math.max(...thread.milestones.map((m) => m.position));
		return maxPosition;
	}

	/**
	 * Get threads by type
	 */
	getThreadsByType(type: PlotThreadType): PlotThread[] {
		return this.data.threads.filter((t) => t.type === type);
	}

	/**
	 * Get threads by status
	 */
	getThreadsByStatus(status: PlotThreadStatus): PlotThread[] {
		return this.data.threads.filter((t) => t.status === status);
	}

	/**
	 * Get settings
	 */
	getSettings() {
		return this.data.settings;
	}

	/**
	 * Update settings
	 */
	updateSettings(updates: Partial<typeof this.data.settings>): void {
		Object.assign(this.data.settings, updates);
		this.save();
	}

	/**
	 * Get cached analysis results
	 */
	getIssues(): PlotIssue[] {
		return this.data.issues || [];
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Save data to settings
	 */
	private save(): void {
		this.plugin.settings.plotArc = this.data;
		this.plugin.saveSettings();
	}
}
