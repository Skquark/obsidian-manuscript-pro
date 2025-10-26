/**
 * Manuscript Statistics Interfaces
 * Data models for the statistics panel
 */

export interface SectionStats {
	title: string;
	level: number; // 1=chapter, 2=section, etc.
	line: number;
	wordCount: number;
	citations: number;
	figures: number;
	tables: number;
}

export interface WordCountStats {
	total: number;
	excludingQuotes: number;
	bySection: SectionStats[];
	session: number;
	today: number;
	target?: number;
}

export interface CitationStats {
	total: number;
	unique: number;
	bySection: Record<string, number>;
	topCited: Array<{ key: string; count: number; title?: string }>;
	uncited?: string[];
	footnotes: number;
}

export interface StructureStats {
	chapters: number;
	sections: number;
	subsections: number;
	figures: number;
	tables: number;
	equations: number;
	indexEntries: number;
	headingDepth: { max: number; avg: number };
}

export interface ReadabilityStats {
	fleschKincaid: number;
	grade: string;
}

export interface ContentStats {
	paragraphs: number;
	sentences: number;
	avgWordsPerParagraph: number;
	avgWordsPerSentence: number;
	readability: ReadabilityStats;
	vocabularyRichness: number;
}

export interface ReadingTimeStats {
	minutes: number;
	formatted: string; // "2 hours 15 minutes"
}

export interface ManuscriptStats {
	timestamp: number;
	wordCount: WordCountStats;
	citations: CitationStats;
	structure: StructureStats;
	content: ContentStats;
	readingTime: ReadingTimeStats;
}

export interface DailyStats {
	wordCount: number;
	citationCount: number;
	sessionDuration: number; // minutes
}

export interface StatsHistory {
	[date: string]: DailyStats;
}

export interface WritingGoal {
	id: string;
	name: string;
	targetWords: number;
	deadline?: number; // timestamp
	currentWords: number;
	createdAt: number;
}

export interface StatsData {
	history: StatsHistory;
	goals: WritingGoal[];
	sessionStart: number;
	sessionWordCount: number;
}
