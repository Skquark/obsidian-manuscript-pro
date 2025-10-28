/**
 * Style Checker Interfaces
 *
 * Provides algorithmic style consistency checking without requiring LLM.
 * Uses pattern matching, regex, and frequency analysis for validation.
 */

/**
 * Issue severity levels
 */
export type IssueSeverity = 'error' | 'warning' | 'info' | 'suggestion';

/**
 * Rule category for organization
 */
export type RuleCategory =
	| 'tense'           // Verb tense consistency
	| 'pov'             // Point of view consistency
	| 'punctuation'     // Punctuation style
	| 'formatting'      // Number/capitalization formatting
	| 'dialogue'        // Dialogue tags and formatting
	| 'repetition'      // Repeated words/phrases
	| 'readability'     // Sentence/paragraph complexity
	| 'academic'        // Citations, figures, references
	| 'latex'           // LaTeX command consistency
	| 'custom';         // User-defined rules

/**
 * Style rule definition
 */
export interface StyleRule {
	id: string;
	name: string;
	description: string;
	category: RuleCategory;
	severity: IssueSeverity;
	enabled: boolean;

	// Pattern-based matching
	pattern?: string;           // RegExp pattern as string
	flags?: string;             // RegExp flags (g, i, m, etc.)

	// Context validation
	scope?: 'document' | 'paragraph' | 'sentence' | 'line';
	excludePatterns?: string[]; // Patterns to ignore (code blocks, etc.)

	// Suggestions
	message?: string;           // Issue description
	suggestion?: string;        // Fix suggestion
	autoFix?: boolean;          // Can be auto-fixed
	fixPattern?: string;        // Replacement pattern for auto-fix

	// Configuration
	threshold?: number;         // For frequency-based rules
	caseSensitive?: boolean;

	// Custom validation function (stored as string, eval'd carefully)
	customValidator?: string;
}

/**
 * Built-in rule sets
 */
export interface RuleSet {
	id: string;
	name: string;
	description: string;
	category: RuleCategory;
	rules: StyleRule[];
}

/**
 * Style issue found in text
 */
export interface StyleIssue {
	ruleId: string;
	ruleName: string;
	category: RuleCategory;
	severity: IssueSeverity;
	message: string;

	// Location in document
	filePath?: string;
	line: number;
	column: number;
	offset: number;            // Character offset in file
	length: number;            // Length of problematic text

	// Context
	context: string;           // Surrounding text
	matchedText: string;       // Exact matched text

	// Fix suggestion
	suggestion?: string;
	canAutoFix: boolean;
	fixText?: string;          // Replacement text

	// Metadata
	timestamp: number;
	ignored?: boolean;         // User marked as false positive
}

/**
 * Style check result for a file
 */
export interface StyleCheckResult {
	filePath: string;
	timestamp: number;

	// Issues by severity
	errors: StyleIssue[];
	warnings: StyleIssue[];
	info: StyleIssue[];
	suggestions: StyleIssue[];

	// Statistics
	totalIssues: number;
	issuesByCategory: Record<RuleCategory, number>;

	// Document stats
	wordCount: number;
	paragraphCount: number;
	sentenceCount: number;

	// Readability metrics
	avgWordsPerSentence: number;
	avgSentencesPerParagraph: number;
	readabilityScore?: number;  // Flesch-Kincaid
}

/**
 * Project-wide style check results
 */
export interface ProjectStyleReport {
	timestamp: number;
	fileCount: number;

	// Aggregated issues
	allIssues: StyleIssue[];
	totalErrors: number;
	totalWarnings: number;
	totalInfo: number;
	totalSuggestions: number;

	// By category
	issuesByCategory: Record<RuleCategory, StyleIssue[]>;

	// By file
	resultsByFile: Record<string, StyleCheckResult>;

	// Most common issues
	topIssues: Array<{
		ruleId: string;
		ruleName: string;
		count: number;
		severity: IssueSeverity;
	}>;

	// Overall statistics
	totalWordCount: number;
	avgReadabilityScore: number;
}

/**
 * Tense detection result
 */
export interface TenseAnalysis {
	dominantTense: 'past' | 'present' | 'future' | 'mixed';
	pastTenseCount: number;
	presentTenseCount: number;
	futureTenseCount: number;
	confidence: number;        // 0-1, how confident we are
	inconsistencies: Array<{
		line: number;
		text: string;
		expectedTense: string;
		foundTense: string;
	}>;
}

/**
 * POV detection result
 */
export interface POVAnalysis {
	dominantPOV: 'first' | 'second' | 'third' | 'mixed';
	firstPersonCount: number;   // I, me, my, we, us, our
	secondPersonCount: number;   // you, your
	thirdPersonCount: number;    // he, she, they, him, her, them
	confidence: number;
	inconsistencies: Array<{
		line: number;
		text: string;
		expectedPOV: string;
		foundPOV: string;
	}>;
}

/**
 * Repeated phrase detection
 */
export interface RepetitionAnalysis {
	repeatedWords: Array<{
		word: string;
		count: number;
		positions: number[];
		severity: IssueSeverity;
	}>;
	repeatedPhrases: Array<{
		phrase: string;
		count: number;
		positions: number[];
		severity: IssueSeverity;
	}>;
	overusedWords: string[];     // Common words used excessively
}

/**
 * Dialogue tag analysis
 */
export interface DialogueAnalysis {
	totalDialogueTags: number;
	uniqueTags: Set<string>;
	tagFrequency: Record<string, number>;
	overusedTags: string[];      // Tags used too frequently
	missingVariety: boolean;     // Using same tag repeatedly
	adverbCount: number;         // Dialogue tags with adverbs (said softly)
}

/**
 * Character name consistency check
 */
export interface NameConsistencyCheck {
	characterNames: Map<string, string[]>;  // Base name -> variations
	inconsistencies: Array<{
		line: number;
		found: string;
		suggested: string[];
		context: string;
	}>;
}

/**
 * Style checker settings
 */
export interface StyleCheckerSettings {
	enabled: boolean;
	autoCheckOnSave: boolean;
	showInlineIssues: boolean;

	// Rule configuration
	enabledRuleSets: string[];
	customRules: StyleRule[];

	// Severity filters
	showErrors: boolean;
	showWarnings: boolean;
	showInfo: boolean;
	showSuggestions: boolean;

	// Exclusions
	excludePatterns: string[];     // File path patterns to exclude
	excludeCodeBlocks: boolean;
	excludeQuotes: boolean;
	excludeLaTeX: boolean;

	// Thresholds
	repetitionThreshold: number;   // How many times before flagging repetition
	paragraphLengthThreshold: number;  // Max words per paragraph
	sentenceLengthThreshold: number;   // Max words per sentence

	// Character name dictionary
	characterNameVariations: Record<string, string[]>;  // "John" -> ["Johnny", "John Smith"]

	// Ignored issues (false positives)
	ignoredIssues: Array<{
		ruleId: string;
		filePath: string;
		offset: number;
		text: string;
	}>;
}

/**
 * Quick fix action
 */
export interface QuickFix {
	issueId: string;
	action: 'replace' | 'remove' | 'ignore' | 'custom';
	newText?: string;
	description: string;
}

/**
 * Readability metrics
 */
export interface ReadabilityMetrics {
	fleschKincaidGrade: number;    // Grade level (0-18+)
	fleschReadingEase: number;     // 0-100 (higher = easier)
	avgWordsPerSentence: number;
	avgSyllablesPerWord: number;
	complexWords: number;          // 3+ syllables

	// Sentence variety
	shortSentences: number;        // < 10 words
	mediumSentences: number;       // 10-20 words
	longSentences: number;         // 20+ words
	veryLongSentences: number;     // 30+ words

	// Paragraph stats
	avgSentencesPerParagraph: number;
	shortParagraphs: number;       // 1-2 sentences
	longParagraphs: number;        // 8+ sentences
}
