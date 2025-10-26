/**
 * Duplicate Citation Detector
 * Finds and manages duplicate bibliography entries
 */

import type { BibEntry } from './BibliographyManager';
import type { BibEntryEnhanced, DuplicateGroup } from './EnhancedBibInterfaces';

export class DuplicateDetector {
	/**
	 * Safely get a field value from either Map or Record
	 */
	private getField(entry: BibEntry | BibEntryEnhanced, field: string): string | undefined {
		if (entry.fields instanceof Map) {
			return entry.fields.get(field);
		}
		return entry.fields[field];
	}

	/**
	 * Find duplicate entries in bibliography
	 */
	findDuplicates(entries: Map<string, BibEntry | BibEntryEnhanced>, threshold: number = 0.8): DuplicateGroup[] {
		const groups: DuplicateGroup[] = [];
		const processed = new Set<string>();

		const entryArray = Array.from(entries.values());

		for (let i = 0; i < entryArray.length; i++) {
			const entry1 = entryArray[i];
			if (processed.has(entry1.key)) continue;

			const duplicates: string[] = [];

			for (let j = i + 1; j < entryArray.length; j++) {
				const entry2 = entryArray[j];
				if (processed.has(entry2.key)) continue;

				const similarity = this.calculateSimilarity(entry1, entry2);

				if (similarity >= threshold) {
					duplicates.push(entry2.key);
					processed.add(entry2.key);
				}
			}

			if (duplicates.length > 0) {
				groups.push({
					canonical: entry1.key,
					duplicates,
					similarity: threshold,
					reason: this.describeSimilarity(entry1, entryArray.find((e) => e.key === duplicates[0])!),
				});
			}
		}

		return groups;
	}

	/**
	 * Calculate similarity between two entries
	 */
	private calculateSimilarity(entry1: BibEntry | BibEntryEnhanced, entry2: BibEntry | BibEntryEnhanced): number {
		let score = 0;
		let weights = 0;

		// DOI match (highest weight)
		const doi1 = this.getField(entry1, 'doi');
		const doi2 = this.getField(entry2, 'doi');
		if (doi1 && doi2) {
			weights += 0.4;
			if (this.normalizeDOI(doi1) === this.normalizeDOI(doi2)) {
				score += 0.4;
				return 1.0; // Perfect match
			}
		}

		// Title similarity (high weight)
		const title1 = this.getField(entry1, 'title');
		const title2 = this.getField(entry2, 'title');
		if (title1 && title2) {
			weights += 0.3;
			const titleSim = this.stringSimilarity(this.normalizeTitle(title1), this.normalizeTitle(title2));
			score += titleSim * 0.3;
		}

		// Author similarity (medium weight)
		const author1 = this.getField(entry1, 'author');
		const author2 = this.getField(entry2, 'author');
		if (author1 && author2) {
			weights += 0.2;
			const authorSim = this.authorSimilarity(author1, author2);
			score += authorSim * 0.2;
		}

		// Year match (low weight)
		const year1 = this.getField(entry1, 'year');
		const year2 = this.getField(entry2, 'year');
		if (year1 && year2) {
			weights += 0.1;
			if (year1 === year2) {
				score += 0.1;
			}
		}

		// Normalize score
		return weights > 0 ? score / weights : 0;
	}

	/**
	 * Calculate string similarity using Levenshtein distance
	 */
	private stringSimilarity(str1: string, str2: string): number {
		const longer = str1.length > str2.length ? str1 : str2;
		const shorter = str1.length > str2.length ? str2 : str1;

		if (longer.length === 0) return 1.0;

		const distance = this.levenshteinDistance(longer, shorter);
		return (longer.length - distance) / longer.length;
	}

	/**
	 * Levenshtein distance algorithm
	 */
	private levenshteinDistance(str1: string, str2: string): number {
		const matrix: number[][] = [];

		for (let i = 0; i <= str2.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= str1.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= str2.length; i++) {
			for (let j = 1; j <= str1.length; j++) {
				if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1, // substitution
						matrix[i][j - 1] + 1, // insertion
						matrix[i - 1][j] + 1, // deletion
					);
				}
			}
		}

		return matrix[str2.length][str1.length];
	}

	/**
	 * Calculate author similarity
	 */
	private authorSimilarity(authors1: string, authors2: string): number {
		const parseAuthors = (authorStr: string): string[] => {
			return authorStr
				.split(' and ')
				.map((a) => a.trim().toLowerCase())
				.filter((a) => a.length > 0);
		};

		const list1 = parseAuthors(authors1);
		const list2 = parseAuthors(authors2);

		if (list1.length === 0 || list2.length === 0) return 0;

		// Count matching authors
		let matches = 0;
		for (const author1 of list1) {
			for (const author2 of list2) {
				// Check if last names match
				const lastName1 = author1.split(',')[0] || author1.split(' ').pop();
				const lastName2 = author2.split(',')[0] || author2.split(' ').pop();

				if (lastName1 && lastName2 && this.stringSimilarity(lastName1, lastName2) > 0.8) {
					matches++;
					break;
				}
			}
		}

		return matches / Math.max(list1.length, list2.length);
	}

	/**
	 * Normalize DOI for comparison
	 */
	private normalizeDOI(doi: string): string {
		return doi
			.toLowerCase()
			.replace(/^https?:\/\/doi\.org\//i, '')
			.trim();
	}

	/**
	 * Normalize title for comparison
	 */
	private normalizeTitle(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, '') // Remove special characters
			.replace(/\s+/g, ' ') // Normalize whitespace
			.trim();
	}

	/**
	 * Describe why entries are considered duplicates
	 */
	private describeSimilarity(entry1: BibEntry | BibEntryEnhanced, entry2: BibEntry | BibEntryEnhanced): string {
		const reasons: string[] = [];

		// Check DOI
		const doi1 = this.getField(entry1, 'doi');
		const doi2 = this.getField(entry2, 'doi');
		if (doi1 && doi2 && this.normalizeDOI(doi1) === this.normalizeDOI(doi2)) {
			reasons.push('same DOI');
		}

		// Check title
		const title1 = this.getField(entry1, 'title');
		const title2 = this.getField(entry2, 'title');
		if (title1 && title2) {
			const titleSim = this.stringSimilarity(this.normalizeTitle(title1), this.normalizeTitle(title2));
			if (titleSim > 0.9) {
				reasons.push('very similar titles');
			} else if (titleSim > 0.7) {
				reasons.push('similar titles');
			}
		}

		// Check authors
		const author1 = this.getField(entry1, 'author');
		const author2 = this.getField(entry2, 'author');
		if (author1 && author2) {
			const authorSim = this.authorSimilarity(author1, author2);
			if (authorSim > 0.8) {
				reasons.push('same authors');
			} else if (authorSim > 0.5) {
				reasons.push('overlapping authors');
			}
		}

		// Check year
		const year1 = this.getField(entry1, 'year');
		const year2 = this.getField(entry2, 'year');
		if (year1 && year2 && year1 === year2) {
			reasons.push('same year');
		}

		return reasons.length > 0 ? reasons.join(', ') : 'similar metadata';
	}

	/**
	 * Merge duplicate entries
	 */
	mergeDuplicates(canonical: BibEntry | BibEntryEnhanced, duplicate: BibEntry | BibEntryEnhanced): BibEntryEnhanced {
		// Convert fields to Record if they're Maps
		const canonicalFields: Record<string, string> = {};
		if (canonical.fields instanceof Map) {
			canonical.fields.forEach((value, key) => {
				canonicalFields[key] = value;
			});
		} else {
			Object.assign(canonicalFields, canonical.fields);
		}

		const duplicateFields: Record<string, string> = {};
		if (duplicate.fields instanceof Map) {
			duplicate.fields.forEach((value, key) => {
				duplicateFields[key] = value;
			});
		} else {
			Object.assign(duplicateFields, duplicate.fields);
		}

		// Start with canonical entry
		const merged: BibEntryEnhanced = {
			key: canonical.key,
			type: canonical.type,
			fields: { ...canonicalFields },
			metadata: (canonical as BibEntryEnhanced).metadata || {
				imported: false,
				verified: false,
			},
		};

		// Merge fields from duplicate (fill in missing fields)
		for (const [field, value] of Object.entries(duplicateFields)) {
			if (!merged.fields[field] && value) {
				merged.fields[field] = value;
			}
		}

		// Prefer DOI from either entry
		if (!merged.fields.doi && duplicateFields.doi) {
			merged.fields.doi = duplicateFields.doi;
		}

		// Mark as merged
		if (merged.metadata) {
			merged.metadata.lastModified = Date.now();
		}

		return merged;
	}
}
