import { App, TFile } from 'obsidian';
import {
	StyleRule,
	StyleIssue,
	StyleCheckResult,
	TenseAnalysis,
	POVAnalysis,
	RepetitionAnalysis,
	DialogueAnalysis,
	ReadabilityMetrics,
	IssueSeverity,
	RuleCategory
} from './StyleCheckerInterfaces';
import { getAllBuiltInRules } from './BuiltInRules';

/**
 * Style Checker Engine
 *
 * Analyzes text using pattern matching and algorithmic validation.
 * No LLM required - uses regex, frequency analysis, and heuristics.
 */
export class StyleChecker {
	private app: App;
	private enabledRules: StyleRule[] = [];
	private excludePatterns: RegExp[] = [];

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Set which rules are enabled
	 */
	setEnabledRules(rules: StyleRule[]): void {
		this.enabledRules = rules.filter(r => r.enabled);
	}

	/**
	 * Add patterns to exclude from checking (code blocks, etc.)
	 */
	setExcludePatterns(patterns: string[]): void {
		this.excludePatterns = patterns.map(p => new RegExp(p, 'gi'));
	}

	/**
	 * Check a file for style issues
	 */
	async checkFile(file: TFile): Promise<StyleCheckResult> {
		const content = await this.app.vault.read(file);
		return this.checkText(content, file.path);
	}

	/**
	 * Check text content
	 */
	checkText(text: string, filePath?: string): StyleCheckResult {
		const issues: StyleIssue[] = [];

		// Apply each enabled rule
		for (const rule of this.enabledRules) {
			const ruleIssues = this.applyRule(rule, text, filePath);
			issues.push(...ruleIssues);
		}

		// Categorize by severity
		const errors = issues.filter(i => i.severity === 'error');
		const warnings = issues.filter(i => i.severity === 'warning');
		const info = issues.filter(i => i.severity === 'info');
		const suggestions = issues.filter(i => i.severity === 'suggestion');

		// Count by category
		const issuesByCategory: Record<RuleCategory, number> = {
			'tense': 0,
			'pov': 0,
			'punctuation': 0,
			'formatting': 0,
			'dialogue': 0,
			'repetition': 0,
			'readability': 0,
			'academic': 0,
			'latex': 0,
			'custom': 0
		};

		issues.forEach(issue => {
			issuesByCategory[issue.category]++;
		});

		// Calculate document stats
		const stats = this.calculateStats(text);

		return {
			filePath: filePath || 'unknown',
			timestamp: Date.now(),
			errors,
			warnings,
			info,
			suggestions,
			totalIssues: issues.length,
			issuesByCategory,
			...stats
		};
	}

	/**
	 * Apply a single rule to text
	 */
	private applyRule(rule: StyleRule, text: string, filePath?: string): StyleIssue[] {
		const issues: StyleIssue[] = [];

		// Skip if no pattern
		if (!rule.pattern) {
			return issues;
		}

		// Create regex
		const regex = new RegExp(rule.pattern, rule.flags || 'g');

		// Split by scope
		let chunks: string[] = [];
		let chunkOffsets: number[] = [];

		switch (rule.scope) {
			case 'paragraph':
				chunks = text.split(/\n\n+/);
				break;
			case 'sentence':
				chunks = text.split(/[.!?]+\s+/);
				break;
			case 'line':
				chunks = text.split(/\n/);
				break;
			case 'document':
			default:
				chunks = [text];
				break;
		}

		// Calculate offsets
		let currentOffset = 0;
		chunks.forEach((chunk, index) => {
			chunkOffsets[index] = currentOffset;
			currentOffset += chunk.length + (index < chunks.length - 1 ? 2 : 0); // +2 for \n\n
		});

		// Check each chunk
		chunks.forEach((chunk, chunkIndex) => {
			let match: RegExpExecArray | null;
			const chunkOffset = chunkOffsets[chunkIndex];

			// Reset regex
			regex.lastIndex = 0;

			while ((match = regex.exec(chunk)) !== null) {
				// Check if in excluded pattern
				if (this.isExcluded(text, chunkOffset + match.index)) {
					continue;
				}

				// Extract context
				const context = this.extractContext(chunk, match.index, 50);

				// Calculate line and column
				const position = this.getLineColumn(text, chunkOffset + match.index);

				// Create issue
				const issue: StyleIssue = {
					ruleId: rule.id,
					ruleName: rule.name,
					category: rule.category,
					severity: rule.severity,
					message: rule.message || rule.description,
					filePath,
					line: position.line,
					column: position.column,
					offset: chunkOffset + match.index,
					length: match[0].length,
					context,
					matchedText: match[0],
					suggestion: rule.suggestion,
					canAutoFix: rule.autoFix || false,
					fixText: rule.fixPattern,
					timestamp: Date.now()
				};

				issues.push(issue);
			}
		});

		return issues;
	}

	/**
	 * Check if position is in excluded pattern (code block, etc.)
	 */
	private isExcluded(text: string, offset: number): boolean {
		for (const pattern of this.excludePatterns) {
			let match: RegExpExecArray | null;
			pattern.lastIndex = 0;
			while ((match = pattern.exec(text)) !== null) {
				if (offset >= match.index && offset < match.index + match[0].length) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Extract context around match
	 */
	private extractContext(text: string, index: number, contextLength: number): string {
		const start = Math.max(0, index - contextLength);
		const end = Math.min(text.length, index + contextLength);

		let context = text.substring(start, end);
		if (start > 0) context = '...' + context;
		if (end < text.length) context = context + '...';

		return context;
	}

	/**
	 * Get line and column from offset
	 */
	private getLineColumn(text: string, offset: number): { line: number; column: number } {
		const lines = text.substring(0, offset).split('\n');
		return {
			line: lines.length,
			column: lines[lines.length - 1].length + 1
		};
	}

	/**
	 * Calculate document statistics
	 */
	private calculateStats(text: string): {
		wordCount: number;
		paragraphCount: number;
		sentenceCount: number;
		avgWordsPerSentence: number;
		avgSentencesPerParagraph: number;
		readabilityScore?: number;
	} {
		// Word count (basic - split by whitespace)
		const words = text.trim().split(/\s+/).filter(w => w.length > 0);
		const wordCount = words.length;

		// Paragraph count
		const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
		const paragraphCount = paragraphs.length;

		// Sentence count (approximate - split by .!?)
		const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
		const sentenceCount = sentences.length;

		// Averages
		const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
		const avgSentencesPerParagraph = paragraphCount > 0 ? sentenceCount / paragraphCount : 0;

		return {
			wordCount,
			paragraphCount,
			sentenceCount,
			avgWordsPerSentence,
			avgSentencesPerParagraph
		};
	}

	/**
	 * Analyze tense usage in text
	 */
	analyzeTense(text: string): TenseAnalysis {
		// Past tense indicators
		const pastPatterns = [
			/\b(was|were|had|did|walked|talked|said|went|came|saw|took|gave|made|found)\b/gi,
			/\b\w+ed\b/gi  // Words ending in -ed
		];

		// Present tense indicators
		const presentPatterns = [
			/\b(is|are|has|does|walks|talks|says|goes|comes|sees|takes|gives|makes|finds)\b/gi,
			/\b\w+s\b/gi  // Words ending in -s (3rd person present)
		];

		// Future tense indicators
		const futurePatterns = [
			/\b(will|shall|going to)\b/gi
		];

		let pastCount = 0;
		let presentCount = 0;
		let futureCount = 0;

		// Count matches
		pastPatterns.forEach(pattern => {
			const matches = text.match(pattern);
			if (matches) pastCount += matches.length;
		});

		presentPatterns.forEach(pattern => {
			const matches = text.match(pattern);
			if (matches) presentCount += matches.length;
		});

		futurePatterns.forEach(pattern => {
			const matches = text.match(pattern);
			if (matches) futureCount += matches.length;
		});

		// Determine dominant tense
		const total = pastCount + presentCount + futureCount;
		let dominantTense: 'past' | 'present' | 'future' | 'mixed' = 'mixed';
		let confidence = 0;

		if (total > 0) {
			if (pastCount / total > 0.6) {
				dominantTense = 'past';
				confidence = pastCount / total;
			} else if (presentCount / total > 0.6) {
				dominantTense = 'present';
				confidence = presentCount / total;
			} else if (futureCount / total > 0.6) {
				dominantTense = 'future';
				confidence = futureCount / total;
			} else {
				dominantTense = 'mixed';
				confidence = 1 - Math.max(pastCount, presentCount, futureCount) / total;
			}
		}

		return {
			dominantTense,
			pastTenseCount: pastCount,
			presentTenseCount: presentCount,
			futureTenseCount: futureCount,
			confidence,
			inconsistencies: []  // TODO: detect specific inconsistencies
		};
	}

	/**
	 * Analyze POV usage in text
	 */
	analyzePOV(text: string): POVAnalysis {
		// First person pronouns
		const firstPersonPattern = /\b(I|me|my|mine|we|us|our|ours)\b/gi;
		const firstPersonMatches = text.match(firstPersonPattern);
		const firstPersonCount = firstPersonMatches ? firstPersonMatches.length : 0;

		// Second person pronouns
		const secondPersonPattern = /\b(you|your|yours)\b/gi;
		const secondPersonMatches = text.match(secondPersonPattern);
		const secondPersonCount = secondPersonMatches ? secondPersonMatches.length : 0;

		// Third person pronouns
		const thirdPersonPattern = /\b(he|him|his|she|her|hers|they|them|their|theirs)\b/gi;
		const thirdPersonMatches = text.match(thirdPersonPattern);
		const thirdPersonCount = thirdPersonMatches ? thirdPersonMatches.length : 0;

		// Determine dominant POV
		const total = firstPersonCount + secondPersonCount + thirdPersonCount;
		let dominantPOV: 'first' | 'second' | 'third' | 'mixed' = 'mixed';
		let confidence = 0;

		if (total > 0) {
			if (firstPersonCount / total > 0.6) {
				dominantPOV = 'first';
				confidence = firstPersonCount / total;
			} else if (secondPersonCount / total > 0.6) {
				dominantPOV = 'second';
				confidence = secondPersonCount / total;
			} else if (thirdPersonCount / total > 0.6) {
				dominantPOV = 'third';
				confidence = thirdPersonCount / total;
			}
		}

		return {
			dominantPOV,
			firstPersonCount,
			secondPersonCount,
			thirdPersonCount,
			confidence,
			inconsistencies: []  // TODO: detect specific shifts
		};
	}

	/**
	 * Analyze repetition in text
	 */
	analyzeRepetition(text: string, threshold: number = 3): RepetitionAnalysis {
		const words = text.toLowerCase().split(/\s+/);
		const wordFrequency: Record<string, number[]> = {};

		// Count word positions
		words.forEach((word, index) => {
			// Clean word (remove punctuation)
			const cleanWord = word.replace(/[^a-z0-9]/g, '');
			if (cleanWord.length < 3) return; // Skip short words

			if (!wordFrequency[cleanWord]) {
				wordFrequency[cleanWord] = [];
			}
			wordFrequency[cleanWord].push(index);
		});

		// Find repeated words
		const repeatedWords = Object.entries(wordFrequency)
			.filter(([word, positions]) => positions.length >= threshold)
			.map(([word, positions]) => ({
				word,
				count: positions.length,
				positions,
				severity: positions.length > threshold * 2 ? 'warning' as IssueSeverity : 'suggestion' as IssueSeverity
			}))
			.sort((a, b) => b.count - a.count);

		// Common overused words
		const commonWords = ['very', 'really', 'just', 'that', 'actually', 'literally'];
		const overusedWords = commonWords.filter(word => {
			const count = wordFrequency[word]?.length || 0;
			return count > 5;
		});

		return {
			repeatedWords,
			repeatedPhrases: [],  // TODO: implement phrase detection
			overusedWords
		};
	}

	/**
	 * Calculate readability metrics
	 */
	calculateReadability(text: string): ReadabilityMetrics {
		// Count words, sentences, syllables
		const words = text.split(/\s+/).filter(w => w.length > 0);
		const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

		const wordCount = words.length;
		const sentenceCount = sentences.length;

		// Estimate syllables (very basic algorithm)
		let totalSyllables = 0;
		let complexWords = 0;

		words.forEach(word => {
			const syllables = this.countSyllables(word);
			totalSyllables += syllables;
			if (syllables >= 3) complexWords++;
		});

		// Calculate averages
		const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
		const avgSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;

		// Flesch-Kincaid Grade Level
		const fleschKincaidGrade =
			0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

		// Flesch Reading Ease
		const fleschReadingEase =
			206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

		// Sentence variety
		const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
		const shortSentences = sentenceLengths.filter(l => l < 10).length;
		const mediumSentences = sentenceLengths.filter(l => l >= 10 && l < 20).length;
		const longSentences = sentenceLengths.filter(l => l >= 20 && l < 30).length;
		const veryLongSentences = sentenceLengths.filter(l => l >= 30).length;

		// Paragraph stats
		const paragraphs = text.split(/\n\n+/);
		const paragraphSentenceCounts = paragraphs.map(p =>
			p.split(/[.!?]+/).filter(s => s.trim().length > 0).length
		);
		const avgSentencesPerParagraph = paragraphs.length > 0
			? paragraphSentenceCounts.reduce((a, b) => a + b, 0) / paragraphs.length
			: 0;
		const shortParagraphs = paragraphSentenceCounts.filter(c => c <= 2).length;
		const longParagraphs = paragraphSentenceCounts.filter(c => c >= 8).length;

		return {
			fleschKincaidGrade: Math.max(0, Math.min(18, fleschKincaidGrade)),
			fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase)),
			avgWordsPerSentence,
			avgSyllablesPerWord,
			complexWords,
			shortSentences,
			mediumSentences,
			longSentences,
			veryLongSentences,
			avgSentencesPerParagraph,
			shortParagraphs,
			longParagraphs
		};
	}

	/**
	 * Count syllables in a word (basic algorithm)
	 */
	private countSyllables(word: string): number {
		word = word.toLowerCase().replace(/[^a-z]/g, '');
		if (word.length <= 3) return 1;

		// Count vowel groups
		const vowelGroups = word.match(/[aeiouy]+/g);
		let count = vowelGroups ? vowelGroups.length : 1;

		// Adjust for silent 'e'
		if (word.endsWith('e') && count > 1) count--;

		// Adjust for 'le' endings
		if (word.endsWith('le') && count > 1 && word.length > 2) {
			const beforeLe = word[word.length - 3];
			if (!/[aeiouy]/.test(beforeLe)) count++;
		}

		return Math.max(1, count);
	}
}
