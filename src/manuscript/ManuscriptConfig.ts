/**
 * Manuscript Configuration Manager
 * Handles loading, parsing, validating, and saving book.json
 */

import { TFile, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { ManuscriptConfig, ChapterEntry, TreeNode } from './ManuscriptInterfaces';

export class ManuscriptConfigManager {
	private config: ManuscriptConfig | null = null;
	private configPath: string;
	private treeState: Map<string, boolean> = new Map(); // Track collapsed state by node ID

	constructor(private plugin: LatexPandocConcealerPlugin) {
		this.configPath = plugin.settings.manuscriptNavigator.configFile;
	}

	/**
	 * Load and parse book.json
	 */
	async load(): Promise<boolean> {
		const file = this.plugin.app.vault.getAbstractFileByPath(this.configPath);
		if (!file || !(file instanceof TFile)) {
			if (this.plugin.settings.debugMode) {
				console.log(`ManuscriptConfig: No config file found at ${this.configPath}`);
			}
			return false;
		}

		try {
			const content = await this.plugin.app.vault.read(file);
			this.config = JSON.parse(content) as ManuscriptConfig;

			// Validate configuration
			const errors = this.validate();
			if (errors.length > 0) {
				console.error('Manuscript configuration errors:', errors);
				new Notice(`Found ${errors.length} errors in ${this.configPath}. See console for details.`);
				return false;
			}

			if (this.plugin.settings.debugMode) {
				console.log('ManuscriptConfig: Loaded successfully', this.config);
			}

			return true;
		} catch (error) {
			console.error('ManuscriptConfig: Failed to parse book.json', error);
			new Notice(`Failed to parse ${this.configPath}: ${error.message}`);
			return false;
		}
	}

	/**
	 * Save configuration back to book.json
	 */
	async save(): Promise<void> {
		if (!this.config) {
			console.warn('ManuscriptConfig: No config to save');
			return;
		}

		try {
			const content = JSON.stringify(this.config, null, 2);
			const file = this.plugin.app.vault.getAbstractFileByPath(this.configPath);

			if (file instanceof TFile) {
				await this.plugin.app.vault.modify(file, content);

				if (this.plugin.settings.debugMode) {
					console.log('ManuscriptConfig: Saved successfully');
				}
			} else {
				console.error('ManuscriptConfig: Config file not found for saving');
			}
		} catch (error) {
			console.error('ManuscriptConfig: Failed to save book.json', error);
			new Notice(`Failed to save ${this.configPath}: ${error.message}`);
		}
	}

	/**
	 * Validate configuration structure
	 */
	validate(): string[] {
		const errors: string[] = [];

		if (!this.config) {
			errors.push('No configuration loaded');
			return errors;
		}

		// Check required fields
		if (!this.config.version) {
			errors.push('Missing version field');
		}

		if (!this.config.metadata?.title) {
			errors.push('Missing metadata.title');
		}

		if (!this.config.metadata?.author) {
			errors.push('Missing metadata.author');
		}

		if (!this.config.structure?.chapters) {
			errors.push('Missing structure.chapters array');
			return errors; // Can't continue validation without chapters
		}

		// Validate chapter entries
		const chapterIds = new Set<string>();
		const allChapters = this.getAllChapterEntries();

		for (const chapter of allChapters) {
			// Check required fields
			if (!chapter.id) {
				errors.push(`Chapter missing id: ${chapter.title || 'Unknown'}`);
			} else {
				// Check for duplicate IDs
				if (chapterIds.has(chapter.id)) {
					errors.push(`Duplicate chapter id: ${chapter.id}`);
				}
				chapterIds.add(chapter.id);
			}

			if (!chapter.title) {
				errors.push(`Chapter missing title: ${chapter.id || 'Unknown'}`);
			}

			if (!chapter.file) {
				errors.push(`Chapter missing file path: ${chapter.title || chapter.id || 'Unknown'}`);
			}

			if (chapter.included === undefined || chapter.included === null) {
				errors.push(`Chapter missing included flag: ${chapter.title || chapter.id || 'Unknown'}`);
			}

			if (chapter.order === undefined || chapter.order === null) {
				errors.push(`Chapter missing order: ${chapter.title || chapter.id || 'Unknown'}`);
			}
		}

		// Validate file paths exist
		for (const chapter of allChapters) {
			if (chapter.file) {
				const file = this.plugin.app.vault.getAbstractFileByPath(chapter.file);
				if (!file) {
					errors.push(`Chapter file not found: ${chapter.file} (${chapter.title})`);
				}
			}
		}

		// Validate parts reference valid chapters
		if (this.config.structure.parts) {
			for (const part of this.config.structure.parts) {
				if (!part.id) {
					errors.push(`Part missing id: ${part.title || 'Unknown'}`);
				}

				if (!part.title) {
					errors.push(`Part missing title: ${part.id || 'Unknown'}`);
				}

				if (!part.chapters || part.chapters.length === 0) {
					errors.push(`Part has no chapters: ${part.title || part.id || 'Unknown'}`);
				}

				// Check that all chapter IDs in part exist
				for (const chapterId of part.chapters || []) {
					if (!chapterIds.has(chapterId)) {
						errors.push(`Part "${part.title}" references non-existent chapter: ${chapterId}`);
					}
				}
			}
		}

		return errors;
	}

	/**
	 * Get all chapter entries from all sections
	 */
	private getAllChapterEntries(): ChapterEntry[] {
		if (!this.config) return [];

		const allChapters: ChapterEntry[] = [];

		if (this.config.structure.frontmatter) {
			allChapters.push(...this.config.structure.frontmatter);
		}

		allChapters.push(...this.config.structure.chapters);

		if (this.config.structure.appendices) {
			allChapters.push(...this.config.structure.appendices);
		}

		if (this.config.structure.backmatter) {
			allChapters.push(...this.config.structure.backmatter);
		}

		return allChapters;
	}

	/**
	 * Get flat list of all chapters in order
	 */
	getChaptersInOrder(): ChapterEntry[] {
		if (!this.config) return [];

		const chapters = [...this.config.structure.chapters];
		chapters.sort((a, b) => a.order - b.order);
		return chapters;
	}

	/**
	 * Get chapters grouped by parts for tree view
	 */
	getStructuredChapters(): TreeNode[] {
		if (!this.config) return [];

		const nodes: TreeNode[] = [];

		// Track which chapters are in parts
		const chaptersInParts = new Set<string>();

		// Add frontmatter
		if (this.config.structure.frontmatter) {
			for (const fm of this.config.structure.frontmatter) {
				nodes.push(this.chapterToNode(fm, 'frontmatter'));
			}
		}

		// Add parts and their chapters
		if (this.config.structure.parts) {
			for (const part of this.config.structure.parts) {
				const partNode: TreeNode = {
					type: 'part',
					id: part.id,
					title: part.title,
					children: [],
					collapsed: this.treeState.get(part.id) ?? !this.plugin.settings.manuscriptNavigator.expandPartsOnLoad,
				};

				for (const chapterId of part.chapters) {
					const chapter = this.config.structure.chapters.find((c) => c.id === chapterId);
					if (chapter) {
						partNode.children!.push(this.chapterToNode(chapter, 'chapter', part.id));
						chaptersInParts.add(chapterId);
					}
				}

				nodes.push(partNode);
			}
		}

		// Add chapters not in any part
		const orphanChapters = this.config.structure.chapters.filter((c) => !chaptersInParts.has(c.id));
		for (const chapter of orphanChapters) {
			nodes.push(this.chapterToNode(chapter, 'chapter'));
		}

		// Add appendices
		if (this.config.structure.appendices) {
			for (const app of this.config.structure.appendices) {
				nodes.push(this.chapterToNode(app, 'chapter'));
			}
		}

		// Add backmatter
		if (this.config.structure.backmatter) {
			for (const bm of this.config.structure.backmatter) {
				nodes.push(this.chapterToNode(bm, 'backmatter'));
			}
		}

		return nodes;
	}

	/**
	 * Convert chapter entry to tree node
	 */
	private chapterToNode(chapter: ChapterEntry, type: TreeNode['type'], partId?: string): TreeNode {
		return {
			type,
			id: chapter.id,
			title: chapter.title,
			file: chapter.file,
			included: chapter.included,
			partId,
		};
	}

	/**
	 * Update chapter order after drag-and-drop reordering
	 */
	async reorderChapters(newOrder: string[]): Promise<void> {
		if (!this.config) return;

		for (let i = 0; i < newOrder.length; i++) {
			const chapter = this.config.structure.chapters.find((c) => c.id === newOrder[i]);
			if (chapter) {
				chapter.order = i + 1;
			}
		}

		await this.save();
	}

	/**
	 * Toggle chapter inclusion status
	 */
	async toggleChapterInclusion(chapterId: string): Promise<void> {
		if (!this.config) return;

		const allChapters = this.getAllChapterEntries();
		const chapter = allChapters.find((c) => c.id === chapterId);

		if (chapter) {
			chapter.included = !chapter.included;
			await this.save();

			if (this.plugin.settings.debugMode) {
				console.log(`ManuscriptConfig: Toggled inclusion for ${chapterId} to ${chapter.included}`);
			}
		}
	}

	/**
	 * Add new chapter to the manuscript
	 */
	async addChapter(title: string, file: string, afterChapterId?: string): Promise<string> {
		if (!this.config) {
			throw new Error('No manuscript configuration loaded');
		}

		// Generate unique ID
		const id = this.generateUniqueId(title);

		// Determine order
		let order = this.config.structure.chapters.length + 1;
		if (afterChapterId) {
			const afterChapter = this.config.structure.chapters.find((c) => c.id === afterChapterId);
			if (afterChapter) {
				order = afterChapter.order + 1;

				// Increment order of all chapters after this one
				for (const chapter of this.config.structure.chapters) {
					if (chapter.order >= order) {
						chapter.order++;
					}
				}
			}
		}

		// Create new chapter entry
		const newChapter: ChapterEntry = {
			id,
			title,
			file,
			included: true,
			order,
		};

		this.config.structure.chapters.push(newChapter);
		await this.save();

		if (this.plugin.settings.debugMode) {
			console.log(`ManuscriptConfig: Added chapter ${id}`, newChapter);
		}

		return id;
	}

	/**
	 * Remove chapter from manuscript (does not delete file)
	 */
	async removeChapter(chapterId: string): Promise<void> {
		if (!this.config) return;

		const index = this.config.structure.chapters.findIndex((c) => c.id === chapterId);
		if (index !== -1) {
			this.config.structure.chapters.splice(index, 1);
			await this.save();

			if (this.plugin.settings.debugMode) {
				console.log(`ManuscriptConfig: Removed chapter ${chapterId}`);
			}
		}
	}

	/**
	 * Update chapter title
	 */
	async updateChapterTitle(chapterId: string, newTitle: string): Promise<void> {
		if (!this.config) return;

		const allChapters = this.getAllChapterEntries();
		const chapter = allChapters.find((c) => c.id === chapterId);

		if (chapter) {
			chapter.title = newTitle;
			await this.save();

			if (this.plugin.settings.debugMode) {
				console.log(`ManuscriptConfig: Updated chapter ${chapterId} title to "${newTitle}"`);
			}
		}
	}

	/**
	 * Set collapsed state for a part
	 */
	setPartCollapsed(partId: string, collapsed: boolean): void {
		this.treeState.set(partId, collapsed);
	}

	/**
	 * Generate unique ID from title
	 */
	private generateUniqueId(title: string): string {
		const base = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');

		let id = base;
		let counter = 1;

		const allChapters = this.getAllChapterEntries();
		while (allChapters.some((c) => c.id === id)) {
			id = `${base}-${counter}`;
			counter++;
		}

		return id;
	}

	/**
	 * Get the loaded configuration
	 */
	getConfig(): ManuscriptConfig | null {
		return this.config;
	}

	/**
	 * Get chapter by ID
	 */
	getChapter(chapterId: string): ChapterEntry | null {
		if (!this.config) return null;

		const allChapters = this.getAllChapterEntries();
		return allChapters.find((c) => c.id === chapterId) || null;
	}

	/**
	 * Check if a config file exists
	 */
	async exists(): Promise<boolean> {
		const file = this.plugin.app.vault.getAbstractFileByPath(this.configPath);
		return file instanceof TFile;
	}

	/**
	 * Update config file path and reload
	 */
	async setConfigPath(path: string): Promise<boolean> {
		this.configPath = path;
		return await this.load();
	}
}
