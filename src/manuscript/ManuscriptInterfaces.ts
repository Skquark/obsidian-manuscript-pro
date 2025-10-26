/**
 * Manuscript Navigator Data Models
 * Defines the structure for book.json and runtime data
 */

/**
 * Root configuration object loaded from book.json
 */
export interface ManuscriptConfig {
	version: string;
	metadata: ManuscriptMetadata;
	structure: ManuscriptStructure;
	settings?: ManuscriptSettings;
	build?: BuildSettings;
}

/**
 * Book metadata (title, author, publisher info)
 */
export interface ManuscriptMetadata {
	title: string;
	subtitle?: string;
	author: string;
	publisher?: string;
	year?: number;
	isbn?: string;
}

/**
 * Overall manuscript structure
 */
export interface ManuscriptStructure {
	frontmatter?: ChapterEntry[];
	parts?: Part[];
	chapters: ChapterEntry[];
	appendices?: ChapterEntry[];
	backmatter?: ChapterEntry[];
}

/**
 * A part/section that groups chapters
 */
export interface Part {
	id: string;
	title: string;
	chapters: string[]; // Array of chapter IDs
	order?: number;
}

/**
 * Individual chapter entry
 */
export interface ChapterEntry {
	id: string;
	number?: number; // Chapter number (e.g., 1, 2, 3)
	title: string;
	file: string; // Relative path from vault root
	included: boolean;
	order: number;
	notes?: string; // Internal notes (not displayed in output)
}

/**
 * Manuscript-level settings
 */
export interface ManuscriptSettings {
	wordCountGoals?: {
		chapter?: number;
		total?: number;
	};
	numberingFormat?: {
		figures?: string; // "chapter.sequential" | "continuous"
		tables?: string;
		equations?: string;
	};
}

/**
 * Build/export settings
 */
export interface BuildSettings {
	outputDir?: string;
	includeOnly?: 'all' | 'included';
}

/**
 * Runtime statistics for a single chapter
 */
export interface ChapterStats {
	chapterId: string;
	wordCount: number;
	figureCount: number;
	tableCount: number;
	citationCount: number;
	equationCount: number;
	lastModified: number; // Timestamp
	cached: boolean;
}

/**
 * Manuscript-wide statistics (aggregated)
 */
export interface ManuscriptStatsData {
	totalWordCount: number;
	includedWordCount: number;
	chapterCount: number;
	includedChapterCount: number;
	figureCount: number;
	tableCount: number;
	citationCount: number;
	equationCount: number;
	lastCalculated: number;
	chapters: Map<string, ChapterStats>; // Keyed by chapter ID
}

/**
 * Tree node for UI rendering
 */
export interface TreeNode {
	type: 'part' | 'chapter' | 'frontmatter' | 'backmatter';
	id: string;
	title: string;
	file?: string; // Only for chapters
	included?: boolean; // Only for chapters
	children?: TreeNode[]; // For parts
	stats?: ChapterStats; // Only for chapters
	collapsed?: boolean; // UI state
	partId?: string; // For chapters that belong to a part
}

/**
 * Settings for the Navigator feature
 */
export interface ManuscriptNavigatorSettings {
	enabled: boolean; // Master toggle
	showInSidebar: boolean; // Auto-open on startup
	configFile: string; // Path to book.json (default: "book.json")

	// Display options
	showWordCount: boolean; // Show word counts
	showFigureCount: boolean; // Show figure counts
	showCitationCount: boolean; // Show citation counts
	showLastModified: boolean; // Show timestamps

	// Behavior
	autoRefreshStats: boolean; // Recalc on file change
	confirmReorder: boolean; // Confirm before reordering
	expandPartsOnLoad: boolean; // Expand all parts by default

	// Goals
	defaultChapterWordGoal: number; // Default word count goal per chapter
	totalWordGoal: number; // Total manuscript word count goal
}
