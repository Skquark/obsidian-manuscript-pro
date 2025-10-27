/**
 * Manuscript Statistics Calculator
 * Analyzes document content and calculates comprehensive metrics
 */

import type { PluginSettings } from '../interfaces/plugin-settings';
import type {
	ManuscriptStats,
	SectionStats,
	WordCountStats,
	CitationStats,
	StructureStats,
	ContentStats,
	ReadingTimeStats,
} from './StatsInterfaces';

export class StatsCalculator {
	private content: string;
	private settings: PluginSettings;
	private sessionWordCount: number;
	private todayWordCount: number;

	constructor(content: string, settings: PluginSettings, sessionStart = 0, todayStart = 0) {
		this.content = content;
		this.settings = settings;
		this.sessionWordCount = sessionStart;
		this.todayWordCount = todayStart;
	}

	/**
	 * Calculate all manuscript statistics
	 */
	calculateAll(): ManuscriptStats {
		const cleanedContent = this.stripLatexPandoc(this.content);
		const sections = this.parseSections();

		const wordCount = this.calculateWordCount(cleanedContent, sections);
		const citations = this.analyzeCitations();
		const structure = this.countStructuralElements(sections);
		const content = this.analyzeContent(cleanedContent);
		const readingTime = this.calculateReadingTime(wordCount.total);

		return {
			timestamp: Date.now(),
			wordCount,
			citations,
			structure,
			content,
			readingTime,
		};
	}

	/**
	 * Strip LaTeX and Pandoc syntax from text
	 */
	stripLatexPandoc(text: string): string {
		let cleaned = text;

		// Remove display math
		cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, '');
		// Remove inline math
		cleaned = cleaned.replace(/\$[^$\n]+?\$/g, '');

		// Remove citations
		cleaned = cleaned.replace(/@[a-zA-Z0-9_\-:]+/g, '');
		cleaned = cleaned.replace(/\[@[^\]]+\]/g, '');

		// Remove LaTeX commands
		cleaned = cleaned.replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{[^}]*\})?/g, '');

		// Remove Pandoc divs and spans
		cleaned = cleaned.replace(/:::\{[^}]*\}/g, '');
		cleaned = cleaned.replace(/:::/g, '');
		cleaned = cleaned.replace(/\[[^\]]*\]\{[^}]*\}/g, '');

		// Remove indexing
		cleaned = cleaned.replace(/\^\[[^\]]+\]/g, '');

		// Remove HTML comments
		cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

		// Remove extra whitespace
		cleaned = cleaned.replace(/\s+/g, ' ');

		return cleaned.trim();
	}

	/**
	 * Count words in text
	 */
	countWords(text: string): number {
		if (!text || text.trim().length === 0) return 0;

		// Split on whitespace and filter empty strings
		const words = text
			.trim()
			.split(/\s+/)
			.filter((word) => word.length > 0);

		return words.length;
	}

	/**
	 * Calculate comprehensive word count statistics
	 */
	private calculateWordCount(cleanedContent: string, sections: SectionStats[]): WordCountStats {
		const total = this.countWords(cleanedContent);

		// Calculate excluding block quotes
		const withoutQuotes = this.stripBlockQuotes(cleanedContent);
		const excludingQuotes = this.countWords(withoutQuotes);

		return {
			total,
			excludingQuotes,
			bySection: sections,
			session: this.sessionWordCount,
			today: this.todayWordCount,
		};
	}

	/**
	 * Strip block quotes from text
	 */
	private stripBlockQuotes(text: string): string {
		return text.replace(/^>\s.*$/gm, '');
	}

	/**
	 * Parse document into sections with statistics
	 */
	parseSections(): SectionStats[] {
		const sections: SectionStats[] = [];
		const lines = this.content.split('\n');

		let currentSection: SectionStats | null = null;
		let currentContent = '';

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

			if (headingMatch) {
				// Save previous section
				if (currentSection) {
					const cleaned = this.stripLatexPandoc(currentContent);
					currentSection.wordCount = this.countWords(cleaned);
					currentSection.citations = this.countCitationsInText(currentContent);
					currentSection.figures = this.countFiguresInText(currentContent);
					currentSection.tables = this.countTablesInText(currentContent);
					sections.push(currentSection);
				}

				// Start new section
				const level = headingMatch[1].length;
				const title = headingMatch[2].trim();

				currentSection = {
					title,
					level,
					line: i + 1,
					wordCount: 0,
					citations: 0,
					figures: 0,
					tables: 0,
				};

				currentContent = '';
			} else {
				currentContent += line + '\n';
			}
		}

		// Save last section
		if (currentSection) {
			const cleaned = this.stripLatexPandoc(currentContent);
			currentSection.wordCount = this.countWords(cleaned);
			currentSection.citations = this.countCitationsInText(currentContent);
			currentSection.figures = this.countFiguresInText(currentContent);
			currentSection.tables = this.countTablesInText(currentContent);
			sections.push(currentSection);
		}

		return sections;
	}

	/**
	 * Extract all citation keys from content
	 */
	private extractCitations(): string[] {
		const citations: string[] = [];

		// Find @citekey patterns
		const citePattern = /@([a-zA-Z0-9_\-:]+)/g;
		let match;

		while ((match = citePattern.exec(this.content)) !== null) {
			citations.push(match[1]);
		}

		return citations;
	}

	/**
	 * Count citations in specific text
	 */
	private countCitationsInText(text: string): number {
		const citePattern = /@([a-zA-Z0-9_\-:]+)/g;
		const matches = text.match(citePattern);
		return matches ? matches.length : 0;
	}

	/**
	 * Count figures in specific text
	 */
	private countFiguresInText(text: string): number {
		// Count \begin{figure} or ![...]
		const latexFigures = (text.match(/\\begin\{figure\}/g) || []).length;
		const mdImages = (text.match(/!\[.*?\]\(.*?\)/g) || []).length;
		return latexFigures + mdImages;
	}

	/**
	 * Count tables in specific text
	 */
	private countTablesInText(text: string): number {
		// Count \begin{table} or markdown tables
		const latexTables = (text.match(/\\begin\{table\}/g) || []).length;
		const mdTables = (text.match(/^\|.+\|$/gm) || []).length > 0 ? 1 : 0;
		return latexTables + mdTables;
	}

	/**
	 * Analyze citations and references
	 */
	private analyzeCitations(): CitationStats {
		const allCitations = this.extractCitations();
		const uniqueCitations = [...new Set(allCitations)];

		// Count citations by section
		const bySection: Record<string, number> = {};
		const sections = this.parseSections();
		sections.forEach((section) => {
			bySection[section.title] = section.citations;
		});

		// Find top cited sources
		const citationCounts: Record<string, number> = {};
		allCitations.forEach((cite) => {
			citationCounts[cite] = (citationCounts[cite] || 0) + 1;
		});

		const topCited = Object.entries(citationCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([key, count]) => ({ key, count }));

		// Count footnotes
		const footnotes = (this.content.match(/\[\^[^\]]+\]/g) || []).length;

		return {
			total: allCitations.length,
			unique: uniqueCitations.length,
			bySection,
			topCited,
			footnotes,
		};
	}

	/**
	 * Count structural elements
	 */
	private countStructuralElements(sections: SectionStats[]): StructureStats {
		const chapters = sections.filter((s) => s.level === 1).length;
		const sectionsL2 = sections.filter((s) => s.level === 2).length;
		const subsections = sections.filter((s) => s.level === 3).length;

		// Count figures (all LaTeX and Markdown images)
		const latexFigures = (this.content.match(/\\begin\{figure\}/g) || []).length;
		const mdImages = (this.content.match(/!\[.*?\]\(.*?\)/g) || []).length;
		const figures = latexFigures + mdImages;

		// Count tables
		const latexTables = (this.content.match(/\\begin\{table\}/g) || []).length;
		const mdTableLines = this.content.match(/^\|.+\|$/gm) || [];
		const tables = latexTables + (mdTableLines.length > 0 ? 1 : 0);

		// Count equations
		const displayEq = (this.content.match(/\$\$[\s\S]*?\$\$/g) || []).length;
		const numberedEq = (this.content.match(/\\begin\{equation\}/g) || []).length;
		const equations = displayEq + numberedEq;

		// Count index entries
		const indexEntries = (this.content.match(/\\index\{[^}]+\}/g) || []).length;

		// Calculate heading depth
		const depths = sections.map((s) => s.level);
		const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;
		const avgDepth = depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;

		return {
			chapters,
			sections: sectionsL2,
			subsections,
			figures,
			tables,
			equations,
			indexEntries,
			headingDepth: {
				max: maxDepth,
				avg: Math.round(avgDepth * 10) / 10,
			},
		};
	}

	/**
	 * Analyze content quality metrics
	 */
	private analyzeContent(cleanedContent: string): ContentStats {
		// Count paragraphs (blocks separated by blank lines)
		const paragraphs = cleanedContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

		// Count sentences (approximate)
		const sentences = this.countSentences(cleanedContent);

		const totalWords = this.countWords(cleanedContent);
		const avgWordsPerParagraph = paragraphs > 0 ? Math.round(totalWords / paragraphs) : 0;
		const avgWordsPerSentence = sentences > 0 ? Math.round(totalWords / sentences) : 0;

		// Calculate readability
		const readability = this.calculateFleschKincaid(cleanedContent);

		// Calculate vocabulary richness
		const vocabularyRichness = this.calculateVocabularyRichness(cleanedContent);

		return {
			paragraphs,
			sentences,
			avgWordsPerParagraph,
			avgWordsPerSentence,
			readability,
			vocabularyRichness,
		};
	}

	/**
	 * Count sentences in text
	 */
	private countSentences(text: string): number {
		// Split on sentence-ending punctuation followed by space or end
		const sentenceEndings = text.match(/[.!?]+[\s\n]/g);
		return sentenceEndings ? sentenceEndings.length : 1;
	}

	/**
	 * Calculate Flesch-Kincaid readability score
	 */
	private calculateFleschKincaid(text: string): { fleschKincaid: number; grade: string } {
		const words = this.countWords(text);
		const sentences = this.countSentences(text);
		const syllables = this.countSyllables(text);

		if (words === 0 || sentences === 0) {
			return { fleschKincaid: 0, grade: 'N/A' };
		}

		// Flesch-Kincaid Reading Ease: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
		const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

		// Convert to grade level
		let grade: string;
		if (score >= 90) grade = '5th grade';
		else if (score >= 80) grade = '6th grade';
		else if (score >= 70) grade = '7th grade';
		else if (score >= 60) grade = '8th-9th grade';
		else if (score >= 50) grade = '10th-12th grade';
		else if (score >= 30) grade = 'College';
		else grade = 'College Graduate';

		return {
			fleschKincaid: Math.round(score * 10) / 10,
			grade,
		};
	}

	/**
	 * Count syllables in text (approximate)
	 */
	private countSyllables(text: string): number {
		const words = text.toLowerCase().split(/\s+/);
		let syllableCount = 0;

		words.forEach((word) => {
			// Remove non-alphabetic characters
			word = word.replace(/[^a-z]/g, '');
			if (word.length === 0) return;

			// Count vowel groups
			const vowelGroups = word.match(/[aeiouy]+/g);
			let count = vowelGroups ? vowelGroups.length : 0;

			// Adjust for silent e
			if (word.endsWith('e')) count--;

			// Ensure at least 1 syllable per word
			if (count === 0) count = 1;

			syllableCount += count;
		});

		return syllableCount;
	}

	/**
	 * Calculate vocabulary richness (unique words / total words)
	 */
	private calculateVocabularyRichness(text: string): number {
		const words = text
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 0);
		const uniqueWords = new Set(words);

		if (words.length === 0) return 0;

		const richness = uniqueWords.size / words.length;
		return Math.round(richness * 1000) / 1000; // Round to 3 decimal places
	}

	/**
	 * Calculate reading time
	 */
	private calculateReadingTime(wordCount: number): ReadingTimeStats {
		// Average reading speed: 250 words per minute
		const wordsPerMinute = 250;
		const minutes = Math.round(wordCount / wordsPerMinute);

		let formatted: string;
		if (minutes < 60) {
			formatted = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
		} else {
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			formatted = `${hours} hour${hours !== 1 ? 's' : ''}`;
			if (remainingMinutes > 0) {
				formatted += ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
			}
		}

		return {
			minutes,
			formatted,
		};
	}
}
