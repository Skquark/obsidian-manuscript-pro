import { App, TFile, Notice } from 'obsidian';
import { TimelineManager } from './TimelineManager';
import { TimelineEvent, TimelineExportOptions } from './TimelineInterfaces';

/**
 * Timeline Exporter
 * Exports timeline data to various formats
 */
export class TimelineExporter {
	private app: App;
	private manager: TimelineManager;

	constructor(app: App, manager: TimelineManager) {
		this.app = app;
		this.manager = manager;
	}

	/**
	 * Export timeline to markdown
	 */
	async exportToMarkdown(options: TimelineExportOptions): Promise<string> {
		const events = this.getFilteredEvents(options);
		let markdown = '';

		// Header
		markdown += '# Timeline Export\n\n';
		markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
		markdown += `**Total Events:** ${events.length}\n\n`;

		const stats = this.manager.getStatistics();
		if (stats.earliestEvent && stats.latestEvent) {
			markdown += `**Date Range:** ${this.manager.formatDate(stats.earliestEvent.startDate)} — ${this.manager.formatDate(stats.latestEvent.startDate)}\n\n`;
		}

		markdown += '---\n\n';

		// Group events
		const groupedEvents = this.groupEvents(events, options.groupBy);

		if (options.groupBy === 'none') {
			markdown += this.renderEventList(events, options);
		} else {
			for (const [groupName, groupEvents] of Object.entries(groupedEvents)) {
				markdown += `## ${groupName}\n\n`;
				markdown += this.renderEventList(groupEvents, options);
				markdown += '\n';
			}
		}

		// Conflicts section
		if (options.includeConflicts) {
			const eventsWithConflicts = events.filter(e => e.conflicts && e.conflicts.length > 0);
			if (eventsWithConflicts.length > 0) {
				markdown += '---\n\n';
				markdown += '## Timeline Conflicts\n\n';

				eventsWithConflicts.forEach(event => {
					markdown += `### ${event.title}\n\n`;
					event.conflicts!.forEach(conflict => {
						if (!conflict.resolved && !conflict.ignoredByUser) {
							markdown += `- **[${conflict.severity.toUpperCase()}]** ${conflict.message}\n`;
						}
					});
					markdown += '\n';
				});
			}
		}

		return markdown;
	}

	/**
	 * Render event list in markdown
	 */
	private renderEventList(events: TimelineEvent[], options: TimelineExportOptions): string {
		let markdown = '';

		events.forEach((event, index) => {
			markdown += `### ${index + 1}. ${event.title}\n\n`;

			// Type and importance
			markdown += `**Type:** ${event.type} | **Importance:** ${event.importance}\n\n`;

			// Date
			const dateStr = this.manager.formatDate(event.startDate);
			if (event.endDate) {
				markdown += `**Date:** ${dateStr} — ${this.manager.formatDate(event.endDate)}\n\n`;
			} else {
				markdown += `**Date:** ${dateStr}\n\n`;
			}

			// Description
			if (options.includeDescriptions && event.description) {
				markdown += `${event.description}\n\n`;
			}

			// Location
			if (event.location) {
				markdown += `**Location:** ${event.location}\n\n`;
			}

			// Characters
			if (options.includeCharacterAges && event.characterIds && event.characterIds.length > 0) {
				markdown += `**Characters:** ${event.characterIds.join(', ')}\n\n`;
			}

			// Tags
			if (event.tags && event.tags.length > 0) {
				markdown += `**Tags:** ${event.tags.map(t => `#${t}`).join(', ')}\n\n`;
			}

			// Conflicts
			if (options.includeConflicts && event.conflicts && event.conflicts.length > 0) {
				const unresolvedConflicts = event.conflicts.filter(c => !c.resolved && !c.ignoredByUser);
				if (unresolvedConflicts.length > 0) {
					markdown += `**⚠️ Conflicts:** ${unresolvedConflicts.length} unresolved\n\n`;
				}
			}

			markdown += '---\n\n';
		});

		return markdown;
	}

	/**
	 * Export timeline to CSV
	 */
	async exportToCSV(options: TimelineExportOptions): Promise<string> {
		const events = this.getFilteredEvents(options);
		let csv = '';

		// Header
		const headers = [
			'Title',
			'Type',
			'Importance',
			'Start Date',
			'End Date',
			'Duration (days)',
			'Location',
			'Description',
			'Characters',
			'Tags',
			'Conflicts'
		];

		csv += headers.join(',') + '\n';

		// Data rows
		events.forEach(event => {
			const row = [
				this.csvEscape(event.title),
				this.csvEscape(event.type),
				this.csvEscape(event.importance),
				this.csvEscape(this.manager.formatDate(event.startDate)),
				event.endDate ? this.csvEscape(this.manager.formatDate(event.endDate)) : '',
				event.duration?.toString() || '',
				this.csvEscape(event.location || ''),
				this.csvEscape(event.description || ''),
				this.csvEscape(event.characterIds?.join('; ') || ''),
				this.csvEscape(event.tags?.map(t => `#${t}`).join('; ') || ''),
				event.conflicts?.length?.toString() || '0'
			];

			csv += row.join(',') + '\n';
		});

		return csv;
	}

	/**
	 * Export timeline to Gantt chart markdown (Mermaid format)
	 */
	async exportToGantt(options: TimelineExportOptions): Promise<string> {
		const events = this.getFilteredEvents(options);
		let gantt = '```mermaid\n';
		gantt += 'gantt\n';
		gantt += '    title Timeline Gantt Chart\n';
		gantt += '    dateFormat YYYY-MM-DD\n\n';

		// Group by type for sections
		const groupedEvents = this.groupEvents(events, 'type');

		for (const [groupName, groupEvents] of Object.entries(groupedEvents)) {
			gantt += `    section ${groupName}\n`;

			groupEvents.forEach(event => {
				const startDate = this.formatDateForGantt(event.startDate);
				const endDate = event.endDate
					? this.formatDateForGantt(event.endDate)
					: startDate;

				// Determine task status based on importance
				let status = '';
				if (event.importance === 'critical') {
					status = 'crit, ';
				} else if (event.importance === 'major') {
					status = 'active, ';
				}

				const taskName = event.title.replace(/[,;:]/g, '');
				const taskId = `task${event.id}`;

				gantt += `    ${taskName} :${status}${taskId}, ${startDate}, ${endDate}\n`;
			});

			gantt += '\n';
		}

		gantt += '```\n';

		return gantt;
	}

	/**
	 * Export timeline to JSON
	 */
	async exportToJSON(options: TimelineExportOptions): Promise<string> {
		const events = this.getFilteredEvents(options);

		const exportData = {
			metadata: {
				exportDate: new Date().toISOString(),
				totalEvents: events.length,
				statistics: this.manager.getStatistics()
			},
			events: events,
			options: options
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * Save export to file
	 */
	async saveExport(
		content: string,
		format: 'markdown' | 'csv' | 'gantt' | 'json',
		baseFilename: string = 'timeline_export'
	): Promise<void> {
		try {
			const extension = format === 'gantt' ? 'md' : format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'md';
			const filename = `${baseFilename}.${extension}`;

			// Get active file's directory or use root
			const activeFile = this.app.workspace.getActiveFile();
			const exportPath = activeFile?.parent?.path
				? `${activeFile.parent.path}/${filename}`
				: filename;

			// Check if file exists
			const existingFile = this.app.vault.getAbstractFileByPath(exportPath);
			if (existingFile instanceof TFile) {
				// Overwrite existing file
				await this.app.vault.modify(existingFile, content);
			} else {
				// Create new file
				await this.app.vault.create(exportPath, content);
			}

			new Notice(`Timeline exported to ${filename}`);
		} catch (error) {
			console.error('Failed to save timeline export:', error);
			new Notice('Failed to export timeline');
		}
	}

	/**
	 * Get filtered events based on export options
	 */
	private getFilteredEvents(options: TimelineExportOptions): TimelineEvent[] {
		let events = this.manager.getAllEvents();

		// Filter by type if specified
		if (options.groupBy === 'type') {
			// Include all types
		}

		// Sort chronologically
		events = this.manager.sortEvents(events);

		return events;
	}

	/**
	 * Group events by specified criteria
	 */
	private groupEvents(
		events: TimelineEvent[],
		groupBy?: 'type' | 'character' | 'year' | 'none'
	): Record<string, TimelineEvent[]> {
		if (!groupBy || groupBy === 'none') {
			return { 'All Events': events };
		}

		const groups: Record<string, TimelineEvent[]> = {};

		events.forEach(event => {
			let groupKey: string;

			switch (groupBy) {
				case 'type':
					groupKey = event.type;
					break;

				case 'year':
					groupKey = event.startDate.year
						? event.startDate.year.toString()
						: 'Unknown Year';
					break;

				case 'character':
					// Group by first character, or "No Characters"
					groupKey = event.characterIds && event.characterIds.length > 0
						? event.characterIds[0]
						: 'No Characters';
					break;

				default:
					groupKey = 'All Events';
			}

			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}

			groups[groupKey].push(event);
		});

		return groups;
	}

	/**
	 * Format date for Gantt chart (YYYY-MM-DD)
	 */
	private formatDateForGantt(date: any): string {
		const year = date.year || 2024;
		const month = date.month || 1;
		const day = date.day || 1;

		return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
	}

	/**
	 * Escape CSV value
	 */
	private csvEscape(value: string): string {
		if (!value) return '""';

		// Escape quotes and wrap in quotes if contains comma, quote, or newline
		if (value.includes(',') || value.includes('"') || value.includes('\n')) {
			return `"${value.replace(/"/g, '""')}"`;
		}

		return `"${value}"`;
	}
}
