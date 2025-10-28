import { TFile } from 'obsidian';

/**
 * Research note category
 */
export type ResearchCategory =
	| 'historical-fact'
	| 'technical-detail'
	| 'location'
	| 'terminology'
	| 'character-research'
	| 'plot-research'
	| 'reference'
	| 'quote'
	| 'other';

/**
 * Research note priority
 */
export type ResearchPriority = 'high' | 'medium' | 'low';

/**
 * Research note status
 */
export type ResearchStatus = 'to-verify' | 'verified' | 'needs-citation' | 'complete';

/**
 * Citation information for research
 */
export interface ResearchCitation {
	bibKey?: string; // Link to bibliography entry
	source: string; // Source description
	author?: string;
	title?: string;
	year?: string;
	url?: string;
	pageNumbers?: string;
	notes?: string;
}

/**
 * Research note
 */
export interface ResearchNote {
	id: string;
	title: string;
	category: ResearchCategory;
	priority: ResearchPriority;
	status: ResearchStatus;

	// Content
	content: string; // Main research content
	summary?: string; // Brief summary for quick reference

	// Organization
	tags: string[]; // Flexible tagging
	linkedNotes?: string[]; // IDs of related research notes

	// Sources
	citations?: ResearchCitation[];

	// Links
	linkedFile?: TFile; // Link to detailed research file
	relatedScenes?: string[]; // Scene IDs where this research is relevant
	relatedCharacters?: string[]; // Character IDs this research relates to

	// Metadata
	created: number;
	modified: number;
	lastAccessed?: number; // Track when last viewed
	color?: string; // Visual identification
}

/**
 * Research folder/collection
 */
export interface ResearchFolder {
	id: string;
	name: string;
	description?: string;
	notes: string[]; // Research note IDs
	subfolders?: string[]; // Subfolder IDs
	parentId?: string; // Parent folder ID
	color?: string;
	order: number;
	created: number;
	modified: number;
}

/**
 * Research panel settings
 */
export interface ResearchPanelSettings {
	enabled: boolean;
	showInSidebar: boolean;

	// Display options
	groupBy: 'category' | 'priority' | 'status' | 'tags' | 'recent' | 'folders';
	showSummaries: boolean;
	showCitations: boolean;
	showTags: boolean;
	compactView: boolean;

	// Filters
	filterByCategory?: ResearchCategory;
	filterByPriority?: ResearchPriority;
	filterByStatus?: ResearchStatus;
	filterByTags?: string[];

	// Data storage
	researchNotes?: Record<string, ResearchNote>;
	researchFolders?: Record<string, ResearchFolder>;
}

/**
 * Research search result
 */
export interface ResearchSearchResult {
	note: ResearchNote;
	matchedFields: string[]; // Which fields matched
	score: number; // Relevance score
	excerpt?: string; // Relevant excerpt from content
}

/**
 * Research export options
 */
export interface ResearchExportOptions {
	format: 'markdown' | 'pdf' | 'html';
	includeCategory?: ResearchCategory[]; // Which categories to include
	includePriority?: ResearchPriority[]; // Which priorities to include
	includeStatus?: ResearchStatus[]; // Which statuses to include
	groupBy: 'category' | 'priority' | 'tags' | 'alphabetical';
	includeCitations: boolean;
	includeTags: boolean;
	includeMetadata: boolean;
	title?: string; // Export document title
}

/**
 * Research statistics
 */
export interface ResearchStats {
	totalNotes: number;
	byCategory: Record<ResearchCategory, number>;
	byPriority: Record<ResearchPriority, number>;
	byStatus: Record<ResearchStatus, number>;
	totalTags: number;
	mostUsedTags: Array<{ tag: string; count: number }>;
	recentlyAccessed?: ResearchNote[];
	needsVerification: number; // Count of notes needing verification
	needsCitation: number; // Count of notes needing citations
}
