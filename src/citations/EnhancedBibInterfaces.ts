/**
 * Enhanced Bibliography Interfaces
 * Advanced citation management features
 */

/**
 * Citation source types for auto-import
 */
export type CitationSource = 'doi' | 'arxiv' | 'pubmed' | 'isbn' | 'url';

/**
 * Citation import request
 */
export interface CitationImportRequest {
	source: CitationSource;
	identifier: string; // DOI, arXiv ID, PubMed ID, etc.
	options?: {
		format?: 'bibtex' | 'json'; // Output format
		overwrite?: boolean; // Overwrite if citation key exists
	};
}

/**
 * Citation import result
 */
export interface CitationImportResult {
	success: boolean;
	entry?: BibEntryEnhanced;
	error?: string;
	warnings?: string[];
	source?: CitationSource;
	identifier?: string;
}

/**
 * Enhanced BibTeX entry with metadata
 */
export interface BibEntryEnhanced {
	// Original BibEntry fields
	key: string;
	type: string;
	fields: Record<string, string>;

	// Enhanced metadata
	metadata?: {
		imported?: boolean;
		importSource?: CitationSource;
		importDate?: number;
		lastModified?: number;
		duplicateOf?: string; // Key of original entry if this is a duplicate
		verified?: boolean; // Manually verified by user
		tags?: string[];
		notes?: string;
	};

	// Computed fields
	formatted?: {
		apa?: string;
		mla?: string;
		chicago?: string;
		vancouver?: string;
		ieee?: string;
	};
}

/**
 * Duplicate detection result
 */
export interface DuplicateGroup {
	canonical: string; // Key of the canonical entry
	duplicates: string[]; // Keys of duplicate entries
	similarity: number; // 0-1 similarity score
	reason: string; // Why they're considered duplicates
}

/**
 * Citation suggestion
 */
export interface CitationSuggestion {
	key: string;
	entry: BibEntryEnhanced;
	score: number; // Relevance score 0-1
	reason: string; // Why this was suggested
	context?: {
		similarCitations?: string[]; // Other citations in nearby text
		keywords?: string[]; // Matching keywords
		topic?: string; // Detected topic
	};
}

/**
 * Citation search query
 */
export interface CitationSearchQuery {
	text?: string; // Free text search
	author?: string;
	title?: string;
	year?: number;
	yearRange?: { start: number; end: number };
	type?: string; // article, book, inproceedings, etc.
	tags?: string[];
	limit?: number;
}

/**
 * Citation analytics
 */
export interface CitationAnalytics {
	totalEntries: number;
	entriesByType: Record<string, number>;
	entriesByYear: Record<number, number>;
	topAuthors: Array<{ author: string; count: number }>;
	topJournals: Array<{ journal: string; count: number }>;
	citationFrequency: Record<string, number>; // How many times each entry is cited
	uncitedEntries: string[]; // Entries never cited
	duplicatePairs: number;
	missingFields: Array<{ key: string; missingFields: string[] }>;
}

/**
 * External API configuration
 */
export interface ExternalAPIConfig {
	// CrossRef (DOI)
	crossrefEmail?: string; // Polite API access

	// PubMed
	pubmedApiKey?: string;
	pubmedEmail?: string;

	// arXiv (no key needed, but rate limited)

	// Rate limiting
	rateLimitDelay?: number; // ms between requests
}

/**
 * Citation manager import settings
 */
export interface CitationManagerImport {
	type: 'zotero' | 'mendeley' | 'endnote';
	path: string; // Path to library file
	autoSync?: boolean; // Auto-import new citations
	syncInterval?: number; // Minutes between syncs
}

/**
 * Enhanced bibliography settings
 */
export interface EnhancedBibSettings {
	enabled: boolean;

	// Auto-import
	enableAutoImport: boolean;
	preferredFormat: 'bibtex' | 'json';

	// External APIs
	apiConfig: ExternalAPIConfig;

	// Duplicate detection
	enableDuplicateDetection: boolean;
	duplicateSimilarityThreshold: number; // 0-1
	autoMergeDuplicates: boolean;

	// Smart suggestions
	enableSmartSuggestions: boolean;
	suggestionContextWindow: number; // Characters before/after cursor
	maxSuggestions: number;

	// Citation manager integration
	citationManager?: CitationManagerImport;

	// Analytics
	trackCitationUsage: boolean;
	showAnalytics: boolean;
}

/**
 * DOI metadata response (from CrossRef API)
 */
export interface DOIMetadata {
	DOI: string;
	type: string;
	title: string[];
	author?: Array<{
		given: string;
		family: string;
		sequence?: string;
	}>;
	'container-title'?: string[]; // Journal name
	volume?: string;
	issue?: string;
	page?: string;
	published?: {
		'date-parts': number[][];
	};
	publisher?: string;
	ISSN?: string[];
	URL?: string;
	abstract?: string;
}

/**
 * arXiv metadata response
 */
export interface ArXivMetadata {
	id: string;
	updated: string;
	published: string;
	title: string;
	summary: string;
	authors: Array<{
		name: string;
	}>;
	categories: string[];
	primary_category: string;
	doi?: string;
	journal_ref?: string;
	pdf_url: string;
}

/**
 * PubMed metadata response
 */
export interface PubMedMetadata {
	pmid: string;
	title: string;
	authors: string[];
	journal: string;
	pubdate: string;
	volume?: string;
	issue?: string;
	pages?: string;
	doi?: string;
	abstract?: string;
	keywords?: string[];
}
