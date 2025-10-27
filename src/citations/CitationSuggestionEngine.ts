/**
 * Citation Suggestion Engine
 * Provides smart, context-aware citation recommendations
 */

import { EditorPosition, TFile } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { BibEntry } from './BibliographyManager';
import type { BibEntryEnhanced, CitationSuggestion, CitationSearchQuery } from './EnhancedBibInterfaces';

export class CitationSuggestionEngine {
	constructor(private plugin: LatexPandocConcealerPlugin) {}

	/**
	 * Safely get a field value from either Map or Record
	 */
	private getField(entry: BibEntry, field: string): string | undefined {
		if (entry.fields instanceof Map) {
			return entry.fields.get(field);
		}
		return entry.fields[field];
	}

	/**
	 * Convert BibEntry (with Map fields) to BibEntryEnhanced (with Record fields)
	 */
	private convertToEnhanced(entry: BibEntry): BibEntryEnhanced {
		const fields: Record<string, string> = {};

		// Convert Map to Record
		if (entry.fields instanceof Map) {
			entry.fields.forEach((value, key) => {
				fields[key] = value;
			});
		} else {
			// Already a Record, just copy
			Object.assign(fields, entry.fields);
		}

		return {
			key: entry.key,
			type: entry.type,
			fields,
		};
	}

	/**
	 * Get citation suggestions based on cursor context
	 */
	async getSuggestionsAtCursor(file: TFile, position: EditorPosition, query?: string): Promise<CitationSuggestion[]> {
		const content = await this.plugin.app.vault.read(file);
		const contextWindow = this.plugin.settings.enhancedBib?.suggestionContextWindow || 500;

		// Extract context around cursor
		const lines = content.split('\n');
		const offset = lines.slice(0, position.line).join('\n').length + position.ch;

		const contextStart = Math.max(0, offset - contextWindow);
		const contextEnd = Math.min(content.length, offset + contextWindow);
		const context = content.substring(contextStart, contextEnd);

		// Analyze context
		const analysis = this.analyzeContext(context, query);

		// Get all bibliography entries
		const allEntries = this.plugin.bibliographyManager.getAllCitations();

		// Score and rank entries
		const suggestions = this.scoreEntries(allEntries, analysis, query);

		// Limit results
		const maxSuggestions = this.plugin.settings.enhancedBib?.maxSuggestions || 10;
		return suggestions.slice(0, maxSuggestions);
	}

	/**
	 * Search citations by query
	 */
	searchCitations(query: CitationSearchQuery): CitationSuggestion[] {
		const allEntries = this.plugin.bibliographyManager.getAllCitations();
		const suggestions: CitationSuggestion[] = [];

		for (const [key, entry] of allEntries) {
			const score = this.scoreEntryAgainstQuery(entry, query);

			if (score > 0) {
				suggestions.push({
					key,
					entry: this.convertToEnhanced(entry),
					score,
					reason: this.explainQueryMatch(entry, query),
				});
			}
		}

		// Sort by score
		suggestions.sort((a, b) => b.score - a.score);

		// Apply limit
		if (query.limit) {
			return suggestions.slice(0, query.limit);
		}

		return suggestions;
	}

	/**
	 * Analyze context to extract topics, keywords, and existing citations
	 */
	private analyzeContext(
		context: string,
		query?: string,
	): {
		keywords: string[];
		existingCitations: string[];
		topic?: string;
		queryTerms: string[];
	} {
		// Extract existing citations from context
		const citationPattern = /@([a-zA-Z0-9_:-]+)/g;
		const citationMatches = context.matchAll(citationPattern);
		const existingCitations = Array.from(citationMatches, (m) => m[1]);

		// Extract keywords (simple approach - could be enhanced with NLP)
		const keywords = this.extractKeywords(context);

		// Extract query terms
		const queryTerms = query ? this.extractKeywords(query) : [];

		// Detect topic (very simplified)
		const topic = this.detectTopic(context);

		return {
			keywords,
			existingCitations,
			topic,
			queryTerms,
		};
	}

	/**
	 * Extract keywords from text
	 */
	private extractKeywords(text: string): string[] {
		// Remove common words (stopwords)
		const stopwords = new Set([
			'the',
			'a',
			'an',
			'and',
			'or',
			'but',
			'in',
			'on',
			'at',
			'to',
			'for',
			'of',
			'with',
			'by',
			'from',
			'as',
			'is',
			'was',
			'are',
			'were',
			'been',
			'be',
			'have',
			'has',
			'had',
			'do',
			'does',
			'did',
			'will',
			'would',
			'could',
			'should',
			'may',
			'might',
			'must',
			'can',
			'this',
			'that',
			'these',
			'those',
			'it',
			'its',
			'we',
			'our',
			'you',
			'your',
		]);

		// Extract words (alphanumeric + hyphens)
		const words = text.toLowerCase().match(/\b[a-z][a-z0-9-]*\b/g) || [];

		// Filter stopwords and short words
		const keywords = words.filter((w) => w.length > 3 && !stopwords.has(w));

		// Count frequency
		const freq = new Map<string, number>();
		for (const word of keywords) {
			freq.set(word, (freq.get(word) || 0) + 1);
		}

		// Return top keywords by frequency
		return Array.from(freq.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map((e) => e[0]);
	}

	/**
	 * Simple topic detection based on keyword clustering
	 */
	private detectTopic(text: string): string | undefined {
		const keywords = this.extractKeywords(text);

		// Topic patterns (could be expanded)
		const topicPatterns: Record<string, string[]> = {
			'machine learning': ['learning', 'neural', 'network', 'training', 'model', 'algorithm'],
			'natural language processing': ['language', 'text', 'nlp', 'parsing', 'semantic'],
			'computer vision': ['image', 'vision', 'visual', 'detection', 'recognition'],
			'quantum computing': ['quantum', 'qubit', 'entanglement', 'superposition'],
			cryptography: ['encryption', 'cryptographic', 'security', 'cipher', 'hash'],
			bioinformatics: ['gene', 'protein', 'sequence', 'genome', 'biological'],
		};

		// Find best matching topic
		let bestTopic: string | undefined;
		let bestScore = 0;

		for (const [topic, patterns] of Object.entries(topicPatterns)) {
			const matches = keywords.filter((k) => patterns.some((p) => k.includes(p) || p.includes(k)));
			const score = matches.length;

			if (score > bestScore) {
				bestScore = score;
				bestTopic = topic;
			}
		}

		return bestScore >= 2 ? bestTopic : undefined;
	}

	/**
	 * Score entries against context analysis
	 */
	private scoreEntries(
		entries: Map<string, BibEntry>,
		analysis: {
			keywords: string[];
			existingCitations: string[];
			topic?: string;
			queryTerms: string[];
		},
		query?: string,
	): CitationSuggestion[] {
		const suggestions: CitationSuggestion[] = [];

		for (const [key, entry] of entries) {
			let score = 0;
			const reasons: string[] = [];

			// Skip if already cited in context
			if (analysis.existingCitations.includes(key)) {
				continue;
			}

			// Query term matching (highest priority)
			if (query && analysis.queryTerms.length > 0) {
				const queryScore = this.matchKeywords(entry, analysis.queryTerms);
				if (queryScore > 0) {
					score += queryScore * 3;
					reasons.push('matches search query');
				}
			}

			// Context keyword matching
			const keywordScore = this.matchKeywords(entry, analysis.keywords);
			if (keywordScore > 0) {
				score += keywordScore * 2;
				reasons.push('relevant to context');
			}

			// Co-citation (cited with same papers)
			const coCitationScore = this.calculateCoCitationScore(key, analysis.existingCitations);
			if (coCitationScore > 0) {
				score += coCitationScore;
				reasons.push('often cited together');
			}

			// Recency boost
			const yearField = this.getField(entry, 'year');
			if (yearField) {
				const year = parseInt(yearField);
				const currentYear = new Date().getFullYear();
				if (year >= currentYear - 3) {
					score += 0.5;
					reasons.push('recent publication');
				}
			}

			// Only include if score is meaningful
			if (score > 0.1) {
				suggestions.push({
					key,
					entry: this.convertToEnhanced(entry),
					score,
					reason: reasons.join(', '),
					context: {
						similarCitations: this.findSimilarCitations(key, analysis.existingCitations),
						keywords: analysis.keywords,
						topic: analysis.topic,
					},
				});
			}
		}

		// Sort by score
		suggestions.sort((a, b) => b.score - a.score);

		return suggestions;
	}

	/**
	 * Match entry against keywords
	 */
	private matchKeywords(entry: BibEntry, keywords: string[]): number {
		if (keywords.length === 0) return 0;

		const entryText = [
			this.getField(entry, 'title') || '',
			this.getField(entry, 'abstract') || '',
			this.getField(entry, 'keywords') || '',
		]
			.join(' ')
			.toLowerCase();

		let matches = 0;
		for (const keyword of keywords) {
			if (entryText.includes(keyword)) {
				matches++;
			}
		}

		return matches / keywords.length;
	}

	/**
	 * Calculate co-citation score
	 */
	private calculateCoCitationScore(key: string, existingCitations: string[]): number {
		// This would ideally analyze co-citation patterns across the entire vault
		// For now, simple implementation
		return 0;
	}

	/**
	 * Find similar citations
	 */
	private findSimilarCitations(key: string, existingCitations: string[]): string[] {
		// Would analyze citation patterns in the vault
		return existingCitations.slice(0, 3);
	}

	/**
	 * Score entry against search query
	 */
	private scoreEntryAgainstQuery(entry: BibEntry, query: CitationSearchQuery): number {
		let score = 0;

		// Text search
		if (query.text) {
			const searchTerms = this.extractKeywords(query.text);
			score += this.matchKeywords(entry, searchTerms) * 5;
		}

		// Author search
		const authorField = this.getField(entry, 'author');
		if (query.author && authorField) {
			if (authorField.toLowerCase().includes(query.author.toLowerCase())) {
				score += 3;
			}
		}

		// Title search
		const titleField = this.getField(entry, 'title');
		if (query.title && titleField) {
			if (titleField.toLowerCase().includes(query.title.toLowerCase())) {
				score += 3;
			}
		}

		// Year filter
		const yearField = this.getField(entry, 'year');
		if (query.year && yearField) {
			if (parseInt(yearField) === query.year) {
				score += 2;
			}
		}

		// Year range
		if (query.yearRange && yearField) {
			const year = parseInt(yearField);
			if (year >= query.yearRange.start && year <= query.yearRange.end) {
				score += 1;
			}
		}

		// Type filter
		if (query.type && entry.type === query.type) {
			score += 1;
		}

		return score;
	}

	/**
	 * Explain why entry matches query
	 */
	private explainQueryMatch(entry: BibEntry, query: CitationSearchQuery): string {
		const reasons: string[] = [];

		const authorField = this.getField(entry, 'author');
		if (query.author && authorField?.toLowerCase().includes(query.author.toLowerCase())) {
			reasons.push('author match');
		}

		const titleField = this.getField(entry, 'title');
		if (query.title && titleField?.toLowerCase().includes(query.title.toLowerCase())) {
			reasons.push('title match');
		}

		const yearField = this.getField(entry, 'year');
		if (query.year && yearField === query.year.toString()) {
			reasons.push('year match');
		}

		if (query.text) {
			reasons.push('keyword match');
		}

		return reasons.length > 0 ? reasons.join(', ') : 'matches search criteria';
	}
}
