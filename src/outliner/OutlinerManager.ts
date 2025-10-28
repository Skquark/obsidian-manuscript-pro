import { App, TFile, Notice } from 'obsidian';
import { v4 as uuidv4 } from 'uuid';
import {
	ManuscriptStructure,
	Part,
	Chapter,
	Scene,
	SceneStatus,
	ChapterStatus,
	DragOperation,
	SceneSearchResult
} from './OutlinerInterfaces';

/**
 * Manages manuscript outline structure, scenes, chapters, and parts
 */
export class OutlinerManager {
	private app: App;
	private structures: Map<string, ManuscriptStructure>;

	constructor(app: App) {
		this.app = app;
		this.structures = new Map();
	}

	/**
	 * Load structures from saved data
	 */
	loadStructures(data: Record<string, ManuscriptStructure>): void {
		this.structures.clear();
		Object.entries(data).forEach(([id, structure]) => {
			this.structures.set(id, structure);
		});
	}

	/**
	 * Get all structures as object for saving
	 */
	getStructuresForSave(): Record<string, ManuscriptStructure> {
		const result: Record<string, ManuscriptStructure> = {};
		this.structures.forEach((structure, id) => {
			result[id] = structure;
		});
		return result;
	}

	/**
	 * Create new manuscript structure
	 */
	createManuscript(title: string, useParts: boolean = false): ManuscriptStructure {
		const now = Date.now();
		const structure: ManuscriptStructure = {
			id: uuidv4(),
			title,
			hasParts: useParts,
			parts: useParts ? [] : [],
			chapters: useParts ? [] : [],
			wordCount: 0,
			created: now,
			modified: now
		};
		this.structures.set(structure.id, structure);
		return structure;
	}

	/**
	 * Get manuscript structure by ID
	 */
	getManuscript(id: string): ManuscriptStructure | undefined {
		return this.structures.get(id);
	}

	/**
	 * Get all manuscript structures
	 */
	getAllManuscripts(): ManuscriptStructure[] {
		return Array.from(this.structures.values());
	}

	/**
	 * Update manuscript title
	 */
	updateManuscriptTitle(id: string, title: string): void {
		const structure = this.structures.get(id);
		if (structure) {
			structure.title = title;
			structure.modified = Date.now();
		}
	}

	/**
	 * Delete manuscript structure
	 */
	deleteManuscript(id: string): void {
		this.structures.delete(id);
	}

	/**
	 * Convert flat structure to parts or vice versa
	 */
	togglePartStructure(manuscriptId: string): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return;

		structure.hasParts = !structure.hasParts;
		structure.modified = Date.now();

		if (structure.hasParts && structure.chapters.length > 0) {
			// Convert chapters to a single part
			const part = this.createPart(manuscriptId, 'Part 1');
			if (part) {
				part.chapters = [...structure.chapters];
				structure.chapters = [];
			}
		} else if (!structure.hasParts && structure.parts.length > 0) {
			// Flatten all chapters from all parts
			structure.chapters = structure.parts.flatMap(p => p.chapters);
			structure.parts = [];
		}

		this.recalculateWordCounts(manuscriptId);
	}

	// ========== PART MANAGEMENT ==========

	/**
	 * Create new part
	 */
	createPart(manuscriptId: string, title: string, order?: number): Part | null {
		const structure = this.structures.get(manuscriptId);
		if (!structure || !structure.hasParts) return null;

		const now = Date.now();
		const part: Part = {
			id: uuidv4(),
			title,
			number: structure.parts.length + 1,
			chapters: [],
			wordCount: 0,
			order: order ?? structure.parts.length,
			created: now,
			modified: now
		};

		structure.parts.push(part);
		structure.parts.sort((a, b) => a.order - b.order);
		structure.modified = now;

		return part;
	}

	/**
	 * Get part by ID
	 */
	getPart(manuscriptId: string, partId: string): Part | undefined {
		const structure = this.structures.get(manuscriptId);
		return structure?.parts.find(p => p.id === partId);
	}

	/**
	 * Update part
	 */
	updatePart(manuscriptId: string, partId: string, updates: Partial<Part>): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return;

		const part = structure.parts.find(p => p.id === partId);
		if (part) {
			Object.assign(part, updates);
			part.modified = Date.now();
			structure.modified = Date.now();
		}
	}

	/**
	 * Delete part
	 */
	deletePart(manuscriptId: string, partId: string): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return;

		structure.parts = structure.parts.filter(p => p.id !== partId);
		structure.parts.forEach((p, idx) => {
			p.order = idx;
			p.number = idx + 1;
		});
		structure.modified = Date.now();
		this.recalculateWordCounts(manuscriptId);
	}

	// ========== CHAPTER MANAGEMENT ==========

	/**
	 * Create new chapter
	 */
	createChapter(manuscriptId: string, title: string, partId?: string): Chapter | null {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return null;

		const now = Date.now();
		const chapter: Chapter = {
			id: uuidv4(),
			title,
			scenes: [],
			wordCount: 0,
			order: 0,
			status: 'planned',
			created: now,
			modified: now
		};

		if (structure.hasParts) {
			if (!partId) return null;
			const part = structure.parts.find(p => p.id === partId);
			if (!part) return null;
			chapter.order = part.chapters.length;
			chapter.number = part.chapters.length + 1;
			part.chapters.push(chapter);
		} else {
			chapter.order = structure.chapters.length;
			chapter.number = structure.chapters.length + 1;
			structure.chapters.push(chapter);
		}

		structure.modified = now;
		return chapter;
	}

	/**
	 * Get chapter by ID
	 */
	getChapter(manuscriptId: string, chapterId: string): Chapter | undefined {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return undefined;

		if (structure.hasParts) {
			for (const part of structure.parts) {
				const chapter = part.chapters.find(c => c.id === chapterId);
				if (chapter) return chapter;
			}
		} else {
			return structure.chapters.find(c => c.id === chapterId);
		}
		return undefined;
	}

	/**
	 * Update chapter
	 */
	updateChapter(manuscriptId: string, chapterId: string, updates: Partial<Chapter>): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return;

		const updateChapterInArray = (chapters: Chapter[]) => {
			const chapter = chapters.find(c => c.id === chapterId);
			if (chapter) {
				Object.assign(chapter, updates);
				chapter.modified = Date.now();
				structure.modified = Date.now();
				return true;
			}
			return false;
		};

		if (structure.hasParts) {
			for (const part of structure.parts) {
				if (updateChapterInArray(part.chapters)) break;
			}
		} else {
			updateChapterInArray(structure.chapters);
		}
	}

	/**
	 * Delete chapter
	 */
	deleteChapter(manuscriptId: string, chapterId: string): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return;

		if (structure.hasParts) {
			for (const part of structure.parts) {
				const initialLength = part.chapters.length;
				part.chapters = part.chapters.filter(c => c.id !== chapterId);
				if (part.chapters.length !== initialLength) {
					part.chapters.forEach((c, idx) => {
						c.order = idx;
						c.number = idx + 1;
					});
					break;
				}
			}
		} else {
			structure.chapters = structure.chapters.filter(c => c.id !== chapterId);
			structure.chapters.forEach((c, idx) => {
				c.order = idx;
				c.number = idx + 1;
			});
		}

		structure.modified = Date.now();
		this.recalculateWordCounts(manuscriptId);
	}

	// ========== SCENE MANAGEMENT ==========

	/**
	 * Create new scene
	 */
	createScene(manuscriptId: string, chapterId: string, title: string): Scene | null {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return null;

		const chapter = this.getChapter(manuscriptId, chapterId);
		if (!chapter) return null;

		const now = Date.now();
		const scene: Scene = {
			id: uuidv4(),
			title,
			metadata: {
				status: 'outline'
			},
			wordCount: 0,
			order: chapter.scenes.length,
			created: now,
			modified: now
		};

		chapter.scenes.push(scene);
		chapter.modified = now;
		structure.modified = now;

		return scene;
	}

	/**
	 * Get scene by ID
	 */
	getScene(manuscriptId: string, sceneId: string): Scene | undefined {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return undefined;

		const searchInChapters = (chapters: Chapter[]): Scene | undefined => {
			for (const chapter of chapters) {
				const scene = chapter.scenes.find(s => s.id === sceneId);
				if (scene) return scene;
			}
			return undefined;
		};

		if (structure.hasParts) {
			for (const part of structure.parts) {
				const scene = searchInChapters(part.chapters);
				if (scene) return scene;
			}
		} else {
			return searchInChapters(structure.chapters);
		}
		return undefined;
	}

	/**
	 * Update scene
	 */
	updateScene(manuscriptId: string, sceneId: string, updates: Partial<Scene>): void {
		const scene = this.getScene(manuscriptId, sceneId);
		if (scene) {
			Object.assign(scene, updates);
			scene.modified = Date.now();
			const structure = this.structures.get(manuscriptId);
			if (structure) {
				structure.modified = Date.now();
			}
			this.recalculateWordCounts(manuscriptId);
		}
	}

	/**
	 * Delete scene
	 */
	deleteScene(manuscriptId: string, sceneId: string): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return;

		const deleteFromChapters = (chapters: Chapter[]) => {
			for (const chapter of chapters) {
				const initialLength = chapter.scenes.length;
				chapter.scenes = chapter.scenes.filter(s => s.id !== sceneId);
				if (chapter.scenes.length !== initialLength) {
					chapter.scenes.forEach((s, idx) => s.order = idx);
					chapter.modified = Date.now();
					return true;
				}
			}
			return false;
		};

		if (structure.hasParts) {
			for (const part of structure.parts) {
				if (deleteFromChapters(part.chapters)) break;
			}
		} else {
			deleteFromChapters(structure.chapters);
		}

		structure.modified = Date.now();
		this.recalculateWordCounts(manuscriptId);
	}

	/**
	 * Link scene to markdown file
	 */
	async linkSceneToFile(manuscriptId: string, sceneId: string, file: TFile): Promise<void> {
		const scene = this.getScene(manuscriptId, sceneId);
		if (!scene) return;

		scene.file = file;
		scene.modified = Date.now();

		// Update word count from file
		const content = await this.app.vault.read(file);
		scene.wordCount = this.countWords(content);
		this.recalculateWordCounts(manuscriptId);
	}

	/**
	 * Count words in text
	 */
	private countWords(text: string): number {
		return text.trim().split(/\s+/).filter(word => word.length > 0).length;
	}

	// ========== DRAG AND DROP ==========

	/**
	 * Handle drag and drop operation
	 */
	handleDragDrop(manuscriptId: string, operation: DragOperation): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return;

		if (operation.type === 'scene') {
			// Scenes must have a target chapter
			if (!operation.targetParentId) {
				console.error('Scene drag-drop requires targetParentId');
				return;
			}
			this.moveScene(manuscriptId, operation.itemId, operation.targetParentId, operation.targetOrder);
		} else if (operation.type === 'chapter') {
			// Chapters need a target parent only if structure has parts
			if (structure.hasParts && !operation.targetParentId) {
				console.error('Chapter drag-drop in part-based structure requires targetParentId');
				return;
			}
			this.moveChapter(manuscriptId, operation.itemId, operation.targetParentId || '', operation.targetOrder);
		} else if (operation.type === 'part') {
			this.movePart(manuscriptId, operation.itemId, operation.targetOrder);
		}
	}

	/**
	 * Move scene to different chapter or reorder
	 */
	private moveScene(manuscriptId: string, sceneId: string, targetChapterId: string, targetOrder: number): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return;

		// Find and remove scene from current location
		let scene: Scene | undefined;
		const removeFromChapters = (chapters: Chapter[]) => {
			for (const chapter of chapters) {
				const index = chapter.scenes.findIndex(s => s.id === sceneId);
				if (index !== -1) {
					scene = chapter.scenes.splice(index, 1)[0];
					chapter.scenes.forEach((s, idx) => s.order = idx);
					return true;
				}
			}
			return false;
		};

		if (structure.hasParts) {
			for (const part of structure.parts) {
				if (removeFromChapters(part.chapters)) break;
			}
		} else {
			removeFromChapters(structure.chapters);
		}

		if (!scene) return;

		// Add to target chapter
		const targetChapter = this.getChapter(manuscriptId, targetChapterId);
		if (targetChapter) {
			scene.order = targetOrder;
			targetChapter.scenes.splice(targetOrder, 0, scene);
			targetChapter.scenes.forEach((s, idx) => s.order = idx);
			targetChapter.modified = Date.now();
		}

		structure.modified = Date.now();
		this.recalculateWordCounts(manuscriptId);
	}

	/**
	 * Move chapter to different part or reorder
	 */
	private moveChapter(manuscriptId: string, chapterId: string, targetParentId: string, targetOrder: number): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return;

		let chapter: Chapter | undefined;

		if (structure.hasParts) {
			// Find and remove chapter
			for (const part of structure.parts) {
				const index = part.chapters.findIndex(c => c.id === chapterId);
				if (index !== -1) {
					chapter = part.chapters.splice(index, 1)[0];
					part.chapters.forEach((c, idx) => {
						c.order = idx;
						c.number = idx + 1;
					});
					break;
				}
			}

			// Add to target part
			if (chapter) {
				const targetPart = structure.parts.find(p => p.id === targetParentId);
				if (targetPart) {
					chapter.order = targetOrder;
					targetPart.chapters.splice(targetOrder, 0, chapter);
					targetPart.chapters.forEach((c, idx) => {
						c.order = idx;
						c.number = idx + 1;
					});
				}
			}
		} else {
			// Flat structure - just reorder
			const index = structure.chapters.findIndex(c => c.id === chapterId);
			if (index !== -1) {
				chapter = structure.chapters.splice(index, 1)[0];
				chapter.order = targetOrder;
				structure.chapters.splice(targetOrder, 0, chapter);
				structure.chapters.forEach((c, idx) => {
					c.order = idx;
					c.number = idx + 1;
				});
			}
		}

		if (chapter) {
			chapter.modified = Date.now();
			structure.modified = Date.now();
			this.recalculateWordCounts(manuscriptId);
		}
	}

	/**
	 * Move part to new position
	 */
	private movePart(manuscriptId: string, partId: string, targetOrder: number): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure || !structure.hasParts) return;

		const index = structure.parts.findIndex(p => p.id === partId);
		if (index !== -1) {
			const part = structure.parts.splice(index, 1)[0];
			part.order = targetOrder;
			structure.parts.splice(targetOrder, 0, part);
			structure.parts.forEach((p, idx) => {
				p.order = idx;
				p.number = idx + 1;
			});
			part.modified = Date.now();
			structure.modified = Date.now();
		}
	}

	// ========== UTILITIES ==========

	/**
	 * Recalculate all word counts in manuscript
	 */
	recalculateWordCounts(manuscriptId: string): void {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return;

		if (structure.hasParts) {
			for (const part of structure.parts) {
				for (const chapter of part.chapters) {
					chapter.wordCount = chapter.scenes.reduce((sum, s) => sum + s.wordCount, 0);
				}
				part.wordCount = part.chapters.reduce((sum, c) => sum + c.wordCount, 0);
			}
			structure.wordCount = structure.parts.reduce((sum, p) => sum + p.wordCount, 0);
		} else {
			for (const chapter of structure.chapters) {
				chapter.wordCount = chapter.scenes.reduce((sum, s) => sum + s.wordCount, 0);
			}
			structure.wordCount = structure.chapters.reduce((sum, c) => sum + c.wordCount, 0);
		}

		structure.modified = Date.now();
	}

	/**
	 * Search scenes by query
	 */
	searchScenes(manuscriptId: string, query: string): SceneSearchResult[] {
		const structure = this.structures.get(manuscriptId);
		if (!structure) return [];

		const results: SceneSearchResult[] = [];
		const lowerQuery = query.toLowerCase();

		const searchInChapters = (chapters: Chapter[], partId?: string) => {
			for (const chapter of chapters) {
				for (const scene of chapter.scenes) {
					const matchedFields: string[] = [];

					if (scene.title.toLowerCase().includes(lowerQuery)) matchedFields.push('title');
					if (scene.summary?.toLowerCase().includes(lowerQuery)) matchedFields.push('summary');
					if (scene.notes?.toLowerCase().includes(lowerQuery)) matchedFields.push('notes');
					if (scene.metadata.pov?.toLowerCase().includes(lowerQuery)) matchedFields.push('pov');
					if (scene.metadata.location?.toLowerCase().includes(lowerQuery)) matchedFields.push('location');

					if (matchedFields.length > 0) {
						results.push({
							scene,
							chapterId: chapter.id,
							partId,
							matchedFields
						});
					}
				}
			}
		};

		if (structure.hasParts) {
			for (const part of structure.parts) {
				searchInChapters(part.chapters, part.id);
			}
		} else {
			searchInChapters(structure.chapters);
		}

		return results;
	}

	/**
	 * Update chapter status based on scene statuses
	 */
	updateChapterStatus(manuscriptId: string, chapterId: string): void {
		const chapter = this.getChapter(manuscriptId, chapterId);
		if (!chapter || chapter.scenes.length === 0) return;

		const allComplete = chapter.scenes.every(s => s.metadata.status === 'complete');
		const anyInProgress = chapter.scenes.some(s =>
			s.metadata.status === 'draft' || s.metadata.status === 'revision'
		);

		if (allComplete) {
			chapter.status = 'complete';
		} else if (anyInProgress) {
			chapter.status = 'in-progress';
		} else {
			chapter.status = 'planned';
		}

		chapter.modified = Date.now();
		const structure = this.structures.get(manuscriptId);
		if (structure) {
			structure.modified = Date.now();
		}
	}
}
