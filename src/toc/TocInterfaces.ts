/**
 * Table of Contents Interfaces
 * Data models for automatic ToC generation with multiple style options
 */

export interface TocEntry {
	title: string;
	level: number; // 1 = Chapter, 2 = Section, 3 = Subsection
	filePath?: string; // For linking in digital formats
	pageNumber?: number; // For print formats (usually filled in during typesetting)
	children?: TocEntry[];
}

export interface TocConfiguration {
	// Structure
	includeDepth: 1 | 2 | 3 | 4; // How many heading levels to include
	includeFrontMatter: boolean;
	includeBackMatter: boolean;
	includePartDividers: boolean; // For multi-part books

	// Formatting
	style: TocStyle;
	showPageNumbers: boolean;
	useLeaderDots: boolean; // ........... between title and page number
	indentSublevels: boolean;

	// Numbering
	numberChapters: boolean;
	numberSections: boolean;
	chapterPrefix: string; // e.g., "Chapter", "Ch.", ""
	useRomanNumerals: boolean; // For front matter

	// Digital Features
	createHyperlinks: boolean; // For digital formats

	// Filtering
	excludePatterns?: string[]; // Regex patterns to exclude certain headings
}

export type TocStyle = 'print-book' | 'digital-book' | 'academic' | 'simple' | 'detailed';

export interface TocStyleTemplate {
	id: TocStyle;
	name: string;
	description: string;
	config: TocConfiguration;
	markdownTemplate: string; // Template for rendering
}

export interface TocOutput {
	markdown: string; // Rendered ToC as markdown
	entries: TocEntry[]; // Structured data
	metadata: {
		totalEntries: number;
		maxDepth: number;
		generatedAt: number;
	};
}

export interface ManuscriptStructure {
	frontMatter?: {
		title: string;
		filePath: string;
	}[];
	parts?: {
		title: string;
		chapters: {
			title: string;
			filePath: string;
			headings?: {
				text: string;
				level: number;
			}[];
		}[];
	}[];
	chapters?: {
		title: string;
		filePath: string;
		headings?: {
			text: string;
			level: number;
		}[];
	}[];
	backMatter?: {
		title: string;
		filePath: string;
	}[];
}
