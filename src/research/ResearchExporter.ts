import { App, TFile, Notice } from 'obsidian';
import { ResearchManager } from './ResearchManager';
import { ResearchNote, ResearchCategory, ResearchPriority, ResearchStatus } from './ResearchInterfaces';

/**
 * Research Export Options
 */
export interface ResearchExportOptions {
	format: 'markdown' | 'csv' | 'json';
	includeContent: boolean;
	includeCitations: boolean;
	includeLinkedNotes: boolean;
	groupBy?: 'category' | 'priority' | 'status' | 'folders' | 'none';
	filterCategory?: ResearchCategory;
	filterPriority?: ResearchPriority;
	filterStatus?: ResearchStatus;
}

/**
 * Research Notes Exporter
 * Exports research database to various formats
 */
export class ResearchExporter {
	private app: App;
	private manager: ResearchManager;

	constructor(app: App, manager: ResearchManager) {
		this.app = app;
		this.manager = manager;
	}

	/**
	 * Export research notes to markdown
	 */
	async exportToMarkdown(options: ResearchExportOptions): Promise<string> {
		const notes = this.getFilteredNotes(options);
		let markdown = '';

		// Header
		markdown += '# Research Notes Export\n\n';
		markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
		markdown += `**Total Notes:** ${notes.length}\n\n`;

		const stats = this.manager.getStatistics();
		markdown += `**By Category:** `;
		for (const [category, count] of Object.entries(stats.byCategory)) {
			markdown += `${category}(${count}) `;
		}
		markdown += '\n\n';

		markdown += '---\n\n';

		// Group notes
		const groupedNotes = this.groupNotes(notes, options.groupBy);

		if (options.groupBy === 'none') {
			markdown += this.renderNoteList(notes, options);
		} else {
			for (const [groupName, groupNotes] of Object.entries(groupedNotes)) {
				markdown += `## ${groupName}\n\n`;
				markdown += this.renderNoteList(groupNotes, options);
				markdown += '\n';
			}
		}

		// Bibliography (if citations included)
		if (options.includeCitations) {
			const notesWithCitations = notes.filter(n => n.citations && n.citations.length > 0);
			if (notesWithCitations.length > 0) {
				markdown += '---\n\n';
				markdown += '## Bibliography\n\n';

				const allCitations: any[] = [];
				notesWithCitations.forEach(note => {
					if (note.citations) {
						allCitations.push(...note.citations);
					}
				});

				// Deduplicate citations by source
				const uniqueCitations = Array.from(
					new Map(allCitations.map(c => [c.source, c])).values()
				);

				uniqueCitations.forEach((citation, index) => {
					markdown += `${index + 1}. `;

					if (citation.author) markdown += `${citation.author}. `;
					if (citation.title) markdown += `*${citation.title}*. `;
					if (citation.year) markdown += `(${citation.year}). `;
					if (citation.source) markdown += `${citation.source}`;
					if (citation.pageNumbers) markdown += `, pp. ${citation.pageNumbers}`;
					if (citation.url) markdown += `. Available at: ${citation.url}`;

					markdown += '\n';
				});

				markdown += '\n';
			}
		}

		return markdown;
	}

	/**
	 * Render note list in markdown
	 */
	private renderNoteList(notes: ResearchNote[], options: ResearchExportOptions): string {
		let markdown = '';

		notes.forEach((note, index) => {
			markdown += `### ${index + 1}. ${note.title}\n\n`;

			// Metadata
			markdown += `**Category:** ${note.category} | **Priority:** ${note.priority} | **Status:** ${note.status}\n\n`;

			// Summary
			if (note.summary) {
				markdown += `**Summary:** ${note.summary}\n\n`;
			}

			// Content
			if (options.includeContent && note.content) {
				markdown += `${note.content}\n\n`;
			}

			// Tags
			if (note.tags && note.tags.length > 0) {
				markdown += `**Tags:** ${note.tags.map(t => `#${t}`).join(', ')}\n\n`;
			}

			// Citations
			if (options.includeCitations && note.citations && note.citations.length > 0) {
				markdown += '**Citations:**\n\n';

				note.citations.forEach(citation => {
					markdown += '- ';
					if (citation.author) markdown += `${citation.author}. `;
					if (citation.title) markdown += `*${citation.title}*. `;
					if (citation.year) markdown += `(${citation.year}). `;
					if (citation.source) markdown += `${citation.source}`;
					if (citation.pageNumbers) markdown += `, pp. ${citation.pageNumbers}`;
					markdown += '\n';
				});

				markdown += '\n';
			}

			// Linked notes
			if (options.includeLinkedNotes && note.linkedNotes && note.linkedNotes.length > 0) {
				markdown += `**Linked Notes:** ${note.linkedNotes.length}\n\n`;
			}

			// Related items
			if (note.relatedScenes && note.relatedScenes.length > 0) {
				markdown += `**Related Scenes:** ${note.relatedScenes.join(', ')}\n\n`;
			}

			if (note.relatedCharacters && note.relatedCharacters.length > 0) {
				markdown += `**Related Characters:** ${note.relatedCharacters.join(', ')}\n\n`;
			}

			markdown += '---\n\n';
		});

		return markdown;
	}

	/**
	 * Export research notes to CSV
	 */
	async exportToCSV(options: ResearchExportOptions): Promise<string> {
		const notes = this.getFilteredNotes(options);
		let csv = '';

		// Header
		const headers = [
			'Title',
			'Category',
			'Priority',
			'Status',
			'Summary',
			'Content',
			'Tags',
			'Citations',
			'Linked Notes',
			'Related Scenes',
			'Related Characters',
			'Created',
			'Modified'
		];

		csv += headers.join(',') + '\n';

		// Data rows
		notes.forEach(note => {
			const row = [
				this.csvEscape(note.title),
				this.csvEscape(note.category),
				this.csvEscape(note.priority),
				this.csvEscape(note.status),
				this.csvEscape(note.summary || ''),
				this.csvEscape(note.content || ''),
				this.csvEscape(note.tags?.join('; ') || ''),
				note.citations?.length?.toString() || '0',
				note.linkedNotes?.length?.toString() || '0',
				this.csvEscape(note.relatedScenes?.join('; ') || ''),
				this.csvEscape(note.relatedCharacters?.join('; ') || ''),
				new Date(note.created).toISOString(),
				new Date(note.modified).toISOString()
			];

			csv += row.join(',') + '\n';
		});

		return csv;
	}

	/**
	 * Export research notes to JSON
	 */
	async exportToJSON(options: ResearchExportOptions): Promise<string> {
		const notes = this.getFilteredNotes(options);

		const exportData = {
			metadata: {
				exportDate: new Date().toISOString(),
				totalNotes: notes.length,
				statistics: this.manager.getStatistics()
			},
			notes: notes,
			folders: this.manager.getAllFolders(),
			options: options
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * Save export to file
	 */
	async saveExport(
		content: string,
		format: 'markdown' | 'csv' | 'json',
		baseFilename: string = 'research_export'
	): Promise<void> {
		try {
			const extension = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'md';
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

			new Notice(`Research notes exported to ${filename}`);
		} catch (error) {
			console.error('Failed to save research export:', error);
			new Notice('Failed to export research notes');
		}
	}

	/**
	 * Get filtered notes based on export options
	 */
	private getFilteredNotes(options: ResearchExportOptions): ResearchNote[] {
		let notes = this.manager.getAllNotes();

		// Apply filters
		if (options.filterCategory) {
			notes = notes.filter(n => n.category === options.filterCategory);
		}

		if (options.filterPriority) {
			notes = notes.filter(n => n.priority === options.filterPriority);
		}

		if (options.filterStatus) {
			notes = notes.filter(n => n.status === options.filterStatus);
		}

		// Sort by recent
		notes = this.manager.sortNotes(notes, 'recent');

		return notes;
	}

	/**
	 * Group notes by specified criteria
	 */
	private groupNotes(
		notes: ResearchNote[],
		groupBy?: 'category' | 'priority' | 'status' | 'folders' | 'none'
	): Record<string, ResearchNote[]> {
		if (!groupBy || groupBy === 'none') {
			return { 'All Notes': notes };
		}

		const groups: Record<string, ResearchNote[]> = {};

		notes.forEach(note => {
			let groupKey: string;

			switch (groupBy) {
				case 'category':
					groupKey = note.category;
					break;

				case 'priority':
					groupKey = note.priority;
					break;

				case 'status':
					groupKey = note.status;
					break;

				case 'folders':
					// Would need folder information from manager
					groupKey = 'Root';
					break;

				default:
					groupKey = 'All Notes';
			}

			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}

			groups[groupKey].push(note);
		});

		return groups;
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
