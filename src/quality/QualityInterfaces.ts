/**
 * Quality & Workflow Enhancement Interfaces
 *
 * Foundational type definitions for:
 * - Pre-Publication Checklist
 * - Enhanced Progress Tracking
 * - Research Knowledge Base
 * - Readability Analysis
 */

// ============================================
// 1. PRE-PUBLICATION CHECKLIST
// ============================================

export type ChecklistType = 'academic-paper' | 'thesis' | 'technical-doc' | 'conference-paper' | 'grant-proposal';

export type ChecklistCategory =
	| 'content'
	| 'references'
	| 'figures'
	| 'structure'
	| 'metadata'
	| 'language'
	| 'supplementary';

export interface ChecklistItem {
	id: string;
	category: ChecklistCategory;
	text: string;
	checked: boolean;
	required: boolean;
	helpText?: string;
	autoCheck?: () => Promise<boolean>; // Auto-validation function
}

export interface PublicationChecklist {
	type: ChecklistType;
	items: ChecklistItem[];
	progress: number; // 0-100
	lastUpdated: number;
	notes: string;
	documentPath: string;
}

// ============================================
// 2. ENHANCED PROGRESS TRACKING
// ============================================

export type GoalType = 'daily' | 'weekly' | 'chapter' | 'total' | 'session';
export type ChapterStatus = 'planned' | 'drafting' | 'revising' | 'final';
export type TrendDirection = 'increasing' | 'stable' | 'decreasing';

export interface WritingGoal {
	id: string;
	type: GoalType;
	target: number; // words
	current: number;
	deadline?: Date;
	description: string;
	createdAt: Date;
}

export interface WritingStreak {
	currentStreak: number; // consecutive days
	longestStreak: number;
	lastWritingDate: Date;
	totalDays: number; // total days with writing
}

export interface WritingVelocity {
	wordsPerHour: number; // when actively writing
	wordsPerDay: number; // average
	wordsPerWeek: number;
	trend: TrendDirection;
	calculatedAt: Date;
}

export interface ChapterProgress {
	file: string;
	title: string;
	status: ChapterStatus;
	wordCount: number;
	targetWords: number;
	percentComplete: number;
	lastModified: Date;
	notes: string;
}

export interface WritingSession {
	startTime: Date;
	endTime?: Date;
	wordsWritten: number;
	duration: number; // minutes
	file: string;
	active: boolean;
}

export interface ProgressSnapshot {
	date: Date;
	totalWords: number;
	dailyWords: number;
	sessionMinutes: number;
	wordsPerHour: number;
	chaptersCompleted: number;
	goalsAchieved: string[];
}

export interface EnhancedProgressData {
	goals: WritingGoal[];
	streak: WritingStreak;
	velocity: WritingVelocity;
	chapters: ChapterProgress[];
	sessions: WritingSession[];
	history: ProgressSnapshot[];
	lastUpdated: Date;
}

// ============================================
// 3. RESEARCH KNOWLEDGE BASE
// ============================================

export type FactCategory =
	| 'definition'
	| 'acronym'
	| 'person'
	| 'organization'
	| 'concept'
	| 'date'
	| 'location'
	| 'custom';

export type EntityType = 'person' | 'organization' | 'institution' | 'concept';

export interface ResearchFact {
	id: string;
	category: FactCategory;
	term: string;
	definition: string;
	source?: string;
	tags: string[];
	firstMentioned?: string; // file path
	lastUpdated: Date;
	references: string[]; // where used
}

export interface EntityInfo {
	name: string;
	type: EntityType;
	alternateNames: string[]; // Dr. Smith, Smith, J. Smith
	description: string;
	affiliations?: string[];
	firstMentioned: string;
	mentionCount: number;
	lastUpdated: Date;
}

export interface ResearchBible {
	facts: ResearchFact[];
	terminology: Map<string, string>; // term → definition
	acronyms: Map<string, string>; // acronym → expansion
	entities: Map<string, EntityInfo>; // name → details
	lastUpdated: Date;
}

export interface TerminologyConsistency {
	term: string;
	variations: string[];
	locations: { file: string; line: number }[];
	suggestion: string;
	confidence: number;
}

// ============================================
// 4. READABILITY ANALYSIS
// ============================================

export type AudienceType = 'general-public' | 'undergraduate' | 'graduate' | 'expert' | 'journal';

export type ComplexityLevel = 'low' | 'medium' | 'high' | 'very-high';

export interface ReadabilityMetrics {
	fleschReadingEase: number; // 0-100, higher = easier
	fleschKincaidGrade: number; // US grade level
	gunningFogIndex: number; // years of education
	smogIndex: number; // years of education
	colemanLiauIndex: number; // US grade level
	automatedReadabilityIndex: number; // US grade level

	// Component metrics
	averageSyllablesPerWord: number;
	averageWordsPerSentence: number;
	averageSentencesPerParagraph: number;
	complexWords: number;
	passiveVoicePercentage: number;

	// Interpretation
	interpretation: string;
	targetAudience: string;
	gradeLevel: number;
	complexity: ComplexityLevel;
}

export interface AudienceProfile {
	type: AudienceType;
	targetGradeLevel: number;
	targetFleschScore: number;
	description: string;
}

export interface SectionReadability {
	heading: string;
	level: number;
	wordCount: number;
	metrics: ReadabilityMetrics;
	complexity: ComplexityLevel;
	recommendations: string[];
	startLine: number;
	endLine: number;
}

export interface ReadabilityReport {
	overall: ReadabilityMetrics;
	sections: SectionReadability[];
	targetAudience: AudienceProfile;
	comparisonToTarget: {
		gradeLevel: number; // difference from target
		fleschScore: number; // difference from target
		status: 'below-target' | 'on-target' | 'above-target';
	};
	recommendations: string[];
	generatedAt: Date;
}

// ============================================
// SHARED TYPES
// ============================================

export interface Position {
	line: number;
	ch: number;
}

export interface Range {
	from: Position;
	to: Position;
}

export interface ValidationIssue {
	type: string;
	severity: 'error' | 'warning' | 'info';
	message: string;
	location?: Range;
	suggestion?: string;
	autoFix?: () => void;
}

// ============================================
// SETTINGS
// ============================================

export interface Phase4Settings {
	// Pre-Publication Checklist
	checklist: {
		enabled: boolean;
		defaultType: ChecklistType;
		autoValidate: boolean;
		showInSidebar: boolean;
	};

	// Enhanced Progress Tracking
	progressTracking: {
		enabled: boolean;
		trackSessions: boolean;
		showStreak: boolean;
		showVelocity: boolean;
		defaultDailyGoal: number;
		defaultChapterGoal: number;
	};

	// Research Knowledge Base
	researchBible: {
		enabled: boolean;
		autoDetectTerms: boolean;
		checkConsistency: boolean;
		showSuggestions: boolean;
		exportPath: string;
	};

	// Readability Analysis
	readability: {
		enabled: boolean;
		targetAudience: AudienceType;
		showInValidation: boolean;
		highlightComplex: boolean;
		autoAnalyze: boolean;
	};
}
