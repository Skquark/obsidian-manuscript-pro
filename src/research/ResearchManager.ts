import { App } from 'obsidian';
import {
	ResearchNote,
	ResearchFolder,
	ResearchCategory,
	ResearchPriority,
	ResearchStatus,
	ResearchSearchResult,
	ResearchStats,
	ResearchCitation
} from './ResearchInterfaces';

/**
 * Manages research notes and folders
 */
export class ResearchManager {
	private app: App;
	private notes: Map<string, ResearchNote> = new Map();
	private folders: Map<string, ResearchFolder> = new Map();

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Load research notes from saved data
	 */
	loadNotes(data: Record<string, ResearchNote>): void {
		this.notes.clear();
		if (data) {
			Object.entries(data).forEach(([id, note]) => {
				this.notes.set(id, note);
			});
		}
	}

	/**
	 * Load research folders from saved data
	 */
	loadFolders(data: Record<string, ResearchFolder>): void {
		this.folders.clear();
		if (data) {
			Object.entries(data).forEach(([id, folder]) => {
				this.folders.set(id, folder);
			});
		}
	}

	/**
	 * Get notes for saving
	 */
	getNotesForSave(): Record<string, ResearchNote> {
		const result: Record<string, ResearchNote> = {};
		this.notes.forEach((note, id) => {
			result[id] = note;
		});
		return result;
	}

	/**
	 * Get folders for saving
	 */
	getFoldersForSave(): Record<string, ResearchFolder> {
		const result: Record<string, ResearchFolder> = {};
		this.folders.forEach((folder, id) => {
			result[id] = folder;
		});
		return result;
	}

	// ========== RESEARCH NOTES ==========

	/**
	 * Get all research notes
	 */
	getAllNotes(): ResearchNote[] {
		return Array.from(this.notes.values());
	}

	/**
	 * Get research note by ID
	 */
	getNote(id: string): ResearchNote | undefined {
		return this.notes.get(id);
	}

	/**
	 * Create new research note
	 */
	createNote(
		title: string,
		category: ResearchCategory = 'other',
		priority: ResearchPriority = 'medium'
	): ResearchNote {
		const id = this.generateId();
		const note: ResearchNote = {
			id,
			title,
			category,
			priority,
			status: 'to-verify',
			content: '',
			tags: [],
			created: Date.now(),
			modified: Date.now()
		};

		this.notes.set(id, note);
		return note;
	}

	/**
	 * Update research note
	 */
	updateNote(id: string, updates: Partial<ResearchNote>): void {
		const note = this.notes.get(id);
		if (!note) return;

		Object.assign(note, updates);
		note.modified = Date.now();
		this.notes.set(id, note);
	}

	/**
	 * Delete research note
	 */
	deleteNote(id: string): boolean {
		// Remove from any folders
		this.folders.forEach(folder => {
			folder.notes = folder.notes.filter(noteId => noteId !== id);
		});

		return this.notes.delete(id);
	}

	/**
	 * Mark note as accessed (for recently accessed tracking)
	 */
	markAccessed(id: string): void {
		const note = this.notes.get(id);
		if (!note) return;

		note.lastAccessed = Date.now();
		this.notes.set(id, note);
	}

	/**
	 * Add tag to research note
	 */
	addTag(noteId: string, tag: string): void {
		const note = this.notes.get(noteId);
		if (!note) return;

		const trimmedTag = tag.trim().toLowerCase();
		if (!trimmedTag || note.tags.includes(trimmedTag)) return;

		note.tags.push(trimmedTag);
		note.modified = Date.now();
		this.notes.set(noteId, note);
	}

	/**
	 * Remove tag from research note
	 */
	removeTag(noteId: string, tag: string): void {
		const note = this.notes.get(noteId);
		if (!note) return;

		note.tags = note.tags.filter(t => t !== tag.trim().toLowerCase());
		note.modified = Date.now();
		this.notes.set(noteId, note);
	}

	/**
	 * Add citation to research note
	 */
	addCitation(noteId: string, citation: ResearchCitation): void {
		const note = this.notes.get(noteId);
		if (!note) return;

		if (!note.citations) {
			note.citations = [];
		}

		note.citations.push(citation);
		note.modified = Date.now();
		this.notes.set(noteId, note);
	}

	/**
	 * Remove citation from research note
	 */
	removeCitation(noteId: string, citationIndex: number): void {
		const note = this.notes.get(noteId);
		if (!note || !note.citations) return;

		note.citations.splice(citationIndex, 1);
		note.modified = Date.now();
		this.notes.set(noteId, note);
	}

	// ========== FOLDERS ==========

	/**
	 * Get all folders
	 */
	getAllFolders(): ResearchFolder[] {
		return Array.from(this.folders.values());
	}

	/**
	 * Get folder by ID
	 */
	getFolder(id: string): ResearchFolder | undefined {
		return this.folders.get(id);
	}

	/**
	 * Create new folder
	 */
	createFolder(name: string, parentId?: string): ResearchFolder {
		const id = this.generateId();
		const folder: ResearchFolder = {
			id,
			name,
			notes: [],
			subfolders: [],
			parentId,
			order: this.getAllFolders().length,
			created: Date.now(),
			modified: Date.now()
		};

		this.folders.set(id, folder);

		// Add to parent if specified
		if (parentId) {
			const parent = this.folders.get(parentId);
			if (parent && parent.subfolders) {
				parent.subfolders.push(id);
			}
		}

		return folder;
	}

	/**
	 * Update folder
	 */
	updateFolder(id: string, updates: Partial<ResearchFolder>): void {
		const folder = this.folders.get(id);
		if (!folder) return;

		Object.assign(folder, updates);
		folder.modified = Date.now();
		this.folders.set(id, folder);
	}

	/**
	 * Delete folder
	 */
	deleteFolder(id: string): boolean {
		const folder = this.folders.get(id);
		if (!folder) return false;

		// Remove from parent
		if (folder.parentId) {
			const parent = this.folders.get(folder.parentId);
			if (parent && parent.subfolders) {
				parent.subfolders = parent.subfolders.filter(fid => fid !== id);
			}
		}

		// Delete subfolders recursively
		if (folder.subfolders) {
			folder.subfolders.forEach(subfolderId => {
				this.deleteFolder(subfolderId);
			});
		}

		return this.folders.delete(id);
	}

	/**
	 * Add note to folder
	 */
	addNoteToFolder(noteId: string, folderId: string): void {
		const folder = this.folders.get(folderId);
		if (!folder) return;

		if (!folder.notes.includes(noteId)) {
			folder.notes.push(noteId);
			folder.modified = Date.now();
		}
	}

	/**
	 * Remove note from folder
	 */
	removeNoteFromFolder(noteId: string, folderId: string): void {
		const folder = this.folders.get(folderId);
		if (!folder) return;

		folder.notes = folder.notes.filter(id => id !== noteId);
		folder.modified = Date.now();
	}

	/**
	 * Get notes in folder
	 */
	getNotesInFolder(folderId: string): ResearchNote[] {
		const folder = this.folders.get(folderId);
		if (!folder) return [];

		return folder.notes
			.map(id => this.notes.get(id))
			.filter(note => note !== undefined) as ResearchNote[];
	}

	// ========== SEARCH AND FILTER ==========

	/**
	 * Search research notes
	 */
	searchNotes(query: string): ResearchSearchResult[] {
		const lowerQuery = query.toLowerCase();
		const results: ResearchSearchResult[] = [];

		this.notes.forEach(note => {
			const matchedFields: string[] = [];
			let score = 0;
			let excerpt: string | undefined;

			// Check title (highest priority)
			if (note.title.toLowerCase().includes(lowerQuery)) {
				matchedFields.push('title');
				score += 10;
			}

			// Check summary
			if (note.summary?.toLowerCase().includes(lowerQuery)) {
				matchedFields.push('summary');
				score += 7;
				excerpt = this.extractExcerpt(note.summary, lowerQuery);
			}

			// Check content
			if (note.content.toLowerCase().includes(lowerQuery)) {
				matchedFields.push('content');
				score += 5;
				if (!excerpt) {
					excerpt = this.extractExcerpt(note.content, lowerQuery);
				}
			}

			// Check tags
			if (note.tags.some(tag => tag.includes(lowerQuery))) {
				matchedFields.push('tags');
				score += 3;
			}

			// Check category
			if (note.category.toLowerCase().includes(lowerQuery)) {
				matchedFields.push('category');
				score += 2;
			}

			// Check citations
			if (note.citations?.some(c =>
				c.source.toLowerCase().includes(lowerQuery) ||
				c.author?.toLowerCase().includes(lowerQuery) ||
				c.title?.toLowerCase().includes(lowerQuery)
			)) {
				matchedFields.push('citations');
				score += 4;
			}

			if (matchedFields.length > 0) {
				results.push({
					note,
					matchedFields,
					score,
					excerpt
				});
			}
		});

		// Sort by score (descending)
		return results.sort((a, b) => b.score - a.score);
	}

	/**
	 * Extract excerpt around query match
	 */
	private extractExcerpt(text: string, query: string, contextLength: number = 100): string {
		const lowerText = text.toLowerCase();
		const index = lowerText.indexOf(query.toLowerCase());
		if (index === -1) return text.substring(0, contextLength) + '...';

		const start = Math.max(0, index - contextLength / 2);
		const end = Math.min(text.length, index + query.length + contextLength / 2);

		let excerpt = text.substring(start, end);
		if (start > 0) excerpt = '...' + excerpt;
		if (end < text.length) excerpt = excerpt + '...';

		return excerpt;
	}

	/**
	 * Filter notes by criteria
	 */
	filterNotes(options: {
		category?: ResearchCategory;
		priority?: ResearchPriority;
		status?: ResearchStatus;
		tags?: string[];
	}): ResearchNote[] {
		let filtered = this.getAllNotes();

		if (options.category) {
			filtered = filtered.filter(n => n.category === options.category);
		}

		if (options.priority) {
			filtered = filtered.filter(n => n.priority === options.priority);
		}

		if (options.status) {
			filtered = filtered.filter(n => n.status === options.status);
		}

		if (options.tags && options.tags.length > 0) {
			filtered = filtered.filter(n =>
				options.tags!.some(tag => n.tags.includes(tag))
			);
		}

		return filtered;
	}

	/**
	 * Sort notes by various criteria
	 */
	sortNotes(
		notes: ResearchNote[],
		sortBy: 'title' | 'category' | 'priority' | 'status' | 'recent' | 'accessed'
	): ResearchNote[] {
		const sorted = [...notes];

		switch (sortBy) {
			case 'title':
				sorted.sort((a, b) => a.title.localeCompare(b.title));
				break;
			case 'category':
				sorted.sort((a, b) => a.category.localeCompare(b.category));
				break;
			case 'priority':
				const priorityOrder: Record<ResearchPriority, number> = {
					high: 0,
					medium: 1,
					low: 2
				};
				sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
				break;
			case 'status':
				sorted.sort((a, b) => a.status.localeCompare(b.status));
				break;
			case 'recent':
				sorted.sort((a, b) => b.modified - a.modified);
				break;
			case 'accessed':
				sorted.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
				break;
		}

		return sorted;
	}

	/**
	 * Get all unique tags
	 */
	getAllTags(): string[] {
		const tagSet = new Set<string>();
		this.notes.forEach(note => {
			note.tags.forEach(tag => tagSet.add(tag));
		});
		return Array.from(tagSet).sort();
	}

	/**
	 * Get tag usage counts
	 */
	getTagCounts(): Record<string, number> {
		const counts: Record<string, number> = {};
		this.notes.forEach(note => {
			note.tags.forEach(tag => {
				counts[tag] = (counts[tag] || 0) + 1;
			});
		});
		return counts;
	}

	// ========== STATISTICS ==========

	/**
	 * Get research statistics
	 */
	getStatistics(): ResearchStats {
		const notes = this.getAllNotes();
		const stats: ResearchStats = {
			totalNotes: notes.length,
			byCategory: {
				'historical-fact': 0,
				'technical-detail': 0,
				'location': 0,
				'terminology': 0,
				'character-research': 0,
				'plot-research': 0,
				'reference': 0,
				'quote': 0,
				'other': 0
			},
			byPriority: {
				high: 0,
				medium: 0,
				low: 0
			},
			byStatus: {
				'to-verify': 0,
				'verified': 0,
				'needs-citation': 0,
				'complete': 0
			},
			totalTags: 0,
			mostUsedTags: [],
			needsVerification: 0,
			needsCitation: 0
		};

		notes.forEach(note => {
			stats.byCategory[note.category]++;
			stats.byPriority[note.priority]++;
			stats.byStatus[note.status]++;

			if (note.status === 'to-verify') stats.needsVerification++;
			if (note.status === 'needs-citation') stats.needsCitation++;
		});

		// Tag statistics
		const tagCounts = this.getTagCounts();
		stats.totalTags = Object.keys(tagCounts).length;
		stats.mostUsedTags = Object.entries(tagCounts)
			.map(([tag, count]) => ({ tag, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		// Recently accessed
		stats.recentlyAccessed = this.sortNotes(notes, 'accessed').slice(0, 5);

		return stats;
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return 'research_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}
}
