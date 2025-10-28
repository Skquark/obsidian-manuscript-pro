import { TFile } from 'obsidian';

/**
 * Scene status progression
 */
export type SceneStatus = 'outline' | 'draft' | 'revision' | 'complete';

/**
 * Individual scene metadata
 */
export interface Scene {
	id: string;
	title: string;
	file?: TFile; // Optional link to actual markdown file
	metadata: {
		pov?: string; // Point of view character
		location?: string; // Where the scene takes place
		timeOfDay?: string; // Time of day (morning, afternoon, evening, night)
		dateInStory?: string; // When in the story timeline
		tone?: string; // Emotional tone (tense, romantic, action, etc.)
		plotThreads?: string[]; // Plot threads this scene advances
		status: SceneStatus;
	};
	summary?: string; // Brief scene summary
	notes?: string; // Additional notes
	wordCount: number;
	order: number; // Position within chapter
	created: number; // Timestamp
	modified: number; // Timestamp
}

/**
 * Chapter status
 */
export type ChapterStatus = 'planned' | 'in-progress' | 'complete';

/**
 * Chapter containing multiple scenes
 */
export interface Chapter {
	id: string;
	title: string;
	number?: number; // Chapter number (optional for unnumbered chapters)
	scenes: Scene[];
	summary?: string; // Chapter summary
	notes?: string; // Chapter notes
	wordCount: number; // Sum of all scenes
	targetWordCount?: number; // Optional target
	order: number; // Position within part or manuscript
	status: ChapterStatus;
	created: number;
	modified: number;
}

/**
 * Part/book division (optional)
 */
export interface Part {
	id: string;
	title: string;
	number?: number; // Part number
	chapters: Chapter[];
	summary?: string; // Part summary
	wordCount: number; // Sum of all chapters
	order: number; // Position within manuscript
	created: number;
	modified: number;
}

/**
 * Complete manuscript structure
 */
export interface ManuscriptStructure {
	id: string; // Manuscript identifier
	title: string;
	hasParts: boolean; // Whether to use part divisions
	parts: Part[]; // If hasParts is true
	chapters: Chapter[]; // If hasParts is false (flat structure)
	wordCount: number; // Total word count
	created: number;
	modified: number;
}

/**
 * Outliner view settings
 */
export interface OutlinerSettings {
	showWordCounts: boolean;
	showSceneMetadata: boolean;
	showStatus: boolean;
	expandByDefault: boolean;
	sortBy: 'order' | 'title' | 'wordCount' | 'status';
	filterByStatus?: SceneStatus | ChapterStatus;
}

/**
 * Export format for outlines
 */
export type OutlineExportFormat = 'markdown' | 'pdf' | 'docx';

/**
 * Outline export options
 */
export interface OutlineExportOptions {
	format: OutlineExportFormat;
	includeWordCounts: boolean;
	includeSummaries: boolean;
	includeMetadata: boolean;
	includeNotes: boolean;
	depth: number; // 1 = parts only, 2 = chapters, 3 = scenes
}

/**
 * Drag-and-drop operation
 */
export interface DragOperation {
	type: 'scene' | 'chapter' | 'part';
	itemId: string;
	sourceParentId?: string; // Optional for parts (they don't have parents)
	targetParentId?: string; // Optional for parts
	targetOrder: number;
}

/**
 * Scene search result
 */
export interface SceneSearchResult {
	scene: Scene;
	chapterId: string;
	partId?: string;
	matchedFields: string[]; // Which fields matched the search
}
