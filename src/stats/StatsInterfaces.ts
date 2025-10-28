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
	type: 'daily' | 'weekly' | 'project' | 'session';
	targetWords: number;
	deadline?: number; // timestamp
	currentWords: number;
	createdAt: number;
	manuscript?: string; // Specific manuscript file or 'all' for global
	completed?: boolean;
	completedAt?: number;
}

export interface DailyGoalProgress {
	date: string; // YYYY-MM-DD
	targetWords: number;
	actualWords: number;
	achieved: boolean;
}

export interface WeeklyGoalProgress {
	weekStart: string; // YYYY-MM-DD (Monday)
	targetWords: number;
	actualWords: number;
	daysWritten: number; // Days with any writing
}

export interface ProductivityInsights {
	averageWordsPerDay: number;
	mostProductiveHour?: number;
	mostProductiveDayOfWeek?: string;
	longestStreak: number;
	currentStreak: number;
	totalDaysWritten: number;
	totalWords: number;
}

export interface StatsData {
	history: StatsHistory;
	goals: WritingGoal[];
	dailyGoalProgress: DailyGoalProgress[]; // Last 365 days
	weeklyGoalProgress: WeeklyGoalProgress[]; // Last 52 weeks
	sessionStart: number;
	sessionWordCount: number;
}
